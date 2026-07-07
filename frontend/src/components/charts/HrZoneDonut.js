import React, { useMemo, useState } from 'react';

const SIZE = 200;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;

const ZONE_COLORS = [
  'var(--series-aqua)',
  'var(--series-blue)',
  'var(--series-yellow)',
  'var(--series-orange)',
  'var(--series-red)',
];
const ZONE_LABELS = ['Z1 Recovery', 'Z2 Easy', 'Z3 Tempo', 'Z4 Threshold', 'Z5 VO2 Max'];

export default function HrZoneDonut({ zones, runsWithHr }) {
  const [hover, setHover] = useState(null);
  const circumference = 2 * Math.PI * R;

  const segments = useMemo(() => {
    let offset = 0;
    return zones.map((z, i) => {
      const seg = { ...z, offset, color: ZONE_COLORS[i], label: ZONE_LABELS[i] };
      offset += z.percent;
      return seg;
    });
  }, [zones]);

  if (!runsWithHr) {
    return (
      <div className="empty-state">
        No heart-rate data on recent runs yet. Connect a HR monitor to see zone distribution.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Heart rate zone distribution">
        <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke="var(--gridline)" strokeWidth={STROKE} />
        {segments.map((s, i) => {
          const dash = (s.percent / 100) * circumference;
          return (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? STROKE + 4 : STROKE}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-(s.offset / 100) * circumference}
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              opacity={hover == null || hover === i ? 1 : 0.55}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: 'stroke-width 120ms ease' }}
            />
          );
        })}
        <text x={CENTER} y={CENTER - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text-primary)">
          {hover != null ? `${segments[hover].percent}%` : `${zones.reduce((s, z) => s + z.minutes, 0)}m`}
        </text>
        <text x={CENTER} y={CENTER + 16} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
          {hover != null ? segments[hover].label : 'total time'}
        </text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column', gap: 8 }}>
        {segments.map((s, i) => (
          <div
            key={i}
            className="legend-item"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: 'default', fontWeight: hover === i ? 700 : 400 }}
          >
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.label} — {s.percent}% ({s.minutes}m)
          </div>
        ))}
      </div>
    </div>
  );
}
