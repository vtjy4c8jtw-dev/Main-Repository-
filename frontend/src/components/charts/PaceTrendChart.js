import React, { useMemo, useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 46 };

function formatPace(secPerKm, unit) {
  if (!secPerKm) return '--';
  const secPerUnit = unit === 'mi' ? secPerKm * 1.60934 : secPerKm;
  const mins = Math.floor(secPerUnit / 60);
  const secs = Math.round(secPerUnit % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function PaceTrendChart({ weeks, unit }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(
    () =>
      weeks
        .filter((w) => w.avgPaceSecPerKm)
        .map((w) => ({
          label: w.weekStart.slice(5),
          value: unit === 'mi' ? w.avgPaceSecPerKm * 1.60934 : w.avgPaceSecPerKm,
        })),
    [weeks, unit]
  );

  if (data.length < 2) {
    return <div className="empty-state">Not enough weeks with pace data yet.</div>;
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const values = data.map((d) => d.value);
  const minV = Math.min(...values) * 0.95;
  const maxV = Math.max(...values) * 1.05;
  const step = innerW / (data.length - 1);

  const scaleY = (v) => PAD.top + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;

  const points = data.map((d, i) => [PAD.left + step * i, scaleY(d.value)]);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => minV + ((maxV - minV) / yTicks) * i);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Weekly average pace">
        {gridLines.map((g, i) => (
          <line
            key={i}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={scaleY(g)}
            y2={scaleY(g)}
            stroke="var(--gridline)"
            strokeWidth="1"
          />
        ))}
        {gridLines.map((g, i) => (
          <text key={i} x={PAD.left - 8} y={scaleY(g) + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">
            {formatPace(g, unit)}
          </text>
        ))}
        <path d={path} fill="none" stroke="var(--series-aqua)" strokeWidth="2" strokeLinecap="round" />
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={hover === i ? 5 : 3.5}
            fill="var(--surface-1)"
            stroke="var(--series-aqua)"
            strokeWidth="2"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {data.map((d, i) =>
          i % Math.ceil(data.length / 8 || 1) === 0 ? (
            <text key={i} x={PAD.left + step * i} y={HEIGHT - 6} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {d.label}
            </text>
          ) : null
        )}
      </svg>
      {hover != null && (
        <div
          className="tooltip"
          style={{ left: `${(PAD.left + step * hover) / WIDTH * 100}%`, top: 6, transform: 'translateX(-50%)' }}
        >
          <strong>{data[hover].label}</strong>: {formatPace(data[hover].value, unit)} /{unit}
        </div>
      )}
    </div>
  );
}
