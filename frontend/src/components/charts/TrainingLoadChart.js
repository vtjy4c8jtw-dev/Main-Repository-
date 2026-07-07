import React, { useMemo, useState } from 'react';

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

export default function TrainingLoadChart({ series }) {
  const [hover, setHover] = useState(null);
  const data = useMemo(() => series.slice(-42), [series]);

  if (!data.length) {
    return <div className="empty-state">Not enough training history yet.</div>;
  }

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const maxV = Math.max(...data.map((d) => Math.max(d.acuteLoad, d.chronicLoad)), 1) * 1.1;
  const step = innerW / (data.length - 1 || 1);
  const scaleY = (v) => PAD.top + innerH - (v / maxV) * innerH;

  const acutePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${PAD.left + step * i},${scaleY(d.acuteLoad)}`).join(' ');
  const chronicPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${PAD.left + step * i},${scaleY(d.chronicLoad)}`)
    .join(' ');

  const latest = data[data.length - 1];
  const acwrClass = !latest.acwr ? '' : latest.acwr > 1.5 ? 'acwr-critical' : latest.acwr > 1.3 ? 'acwr-warning' : 'acwr-good';

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-label="Training load: acute vs chronic">
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <line
            key={i}
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={PAD.top + innerH * t}
            y2={PAD.top + innerH * t}
            stroke="var(--gridline)"
            strokeWidth="1"
          />
        ))}
        <path d={chronicPath} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
        <path d={acutePath} fill="none" stroke="var(--series-red)" strokeWidth="2" strokeLinecap="round" />
        {data.map((d, i) => (
          <rect
            key={i}
            x={PAD.left + step * i - step / 2}
            y={PAD.top}
            width={step}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {hover != null && (
          <line
            x1={PAD.left + step * hover}
            x2={PAD.left + step * hover}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--baseline)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
      </svg>
      <div className="legend">
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: 'var(--series-red)' }} /> Acute (7-day)
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ background: 'var(--text-muted)' }} /> Chronic (28-day)
        </span>
        <span className={`acwr-badge ${acwrClass}`}>ACWR {latest.acwr ?? '--'}</span>
      </div>
      {hover != null && (
        <div
          className="tooltip"
          style={{ left: `${(PAD.left + step * hover) / WIDTH * 100}%`, top: 6, transform: 'translateX(-50%)' }}
        >
          <strong>{data[hover].date}</strong>
          <div>Acute: {data[hover].acuteLoad}</div>
          <div>Chronic: {data[hover].chronicLoad}</div>
          <div>ACWR: {data[hover].acwr ?? '--'}</div>
        </div>
      )}
    </div>
  );
}
