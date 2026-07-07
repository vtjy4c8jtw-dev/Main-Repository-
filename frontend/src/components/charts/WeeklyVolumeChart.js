import React, { useMemo, useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

export default function WeeklyVolumeChart({ weeks, unit }) {
  const [hover, setHover] = useState(null);

  const data = useMemo(
    () =>
      weeks.map((w) => ({
        label: w.weekStart.slice(5),
        value: unit === 'mi' ? w.distanceKm * 0.621371 : w.distanceKm,
      })),
    [weeks, unit]
  );

  if (!data.length) {
    return <div className="empty-state">No runs yet in this window.</div>;
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map((d) => d.value), 1) * 1.15;
  const barW = Math.min(28, (innerW / data.length) * 0.6);
  const step = innerW / data.length;

  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Weekly distance">
        {gridLines.map((g, i) => {
          const y = PAD.top + innerH - (g / maxVal) * innerH;
          return (
            <line
              key={i}
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--gridline)"
              strokeWidth="1"
            />
          );
        })}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + innerH}
          stroke="var(--baseline)"
          strokeWidth="1"
        />
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="var(--baseline)"
          strokeWidth="1"
        />
        {gridLines.map((g, i) => {
          const y = PAD.top + innerH - (g / maxVal) * innerH;
          return (
            <text key={i} x={PAD.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {Math.round(g)}
            </text>
          );
        })}
        {data.map((d, i) => {
          const x = PAD.left + step * i + step / 2 - barW / 2;
          const h = (d.value / maxVal) * innerH;
          const y = PAD.top + innerH - h;
          const isHover = hover === i;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 1)}
                rx="4"
                fill="var(--series-blue)"
                opacity={isHover ? 1 : 0.85}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {i % Math.ceil(data.length / 8 || 1) === 0 && (
                <text
                  x={x + barW / 2}
                  y={PAD.top + innerH + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-muted)"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div
          className="tooltip"
          style={{
            left: `${(PAD.left + step * hover + step / 2) / WIDTH * 100}%`,
            top: 6,
            transform: 'translateX(-50%)',
          }}
        >
          <strong>{data[hover].label}</strong>: {data[hover].value.toFixed(1)} {unit}
        </div>
      )}
    </div>
  );
}
