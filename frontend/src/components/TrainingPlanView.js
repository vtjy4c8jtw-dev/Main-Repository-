import React, { useState } from 'react';

function phaseClass(phase) {
  return `phase-${phase.replace(' ', '-')}`;
}

function WeekDetail({ week, unit }) {
  return (
    <div className="card" style={{ marginTop: 12 }}>
      {week.days
        .filter((d) => d.type !== 'Rest')
        .map((d, i) => (
          <div className="day-chip" key={i}>
            <span className="day-label">{d.day}</span>
            <span>
              <strong>{d.type}</strong>
              <div style={{ color: 'var(--text-secondary)' }}>{d.description}</div>
            </span>
            <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
              {d.targetDistanceKm ? `${d.targetDistanceKm} ${unit}` : ''}
              {d.targetPace && d.targetPace !== 'see workout' ? <div>{d.targetPace}</div> : null}
            </span>
          </div>
        ))}
    </div>
  );
}

export default function TrainingPlanView({ plan }) {
  const [openWeek, setOpenWeek] = useState(0);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="label">Goal</div>
          <div className="value" style={{ fontSize: 20 }}>
            {plan.goal.toUpperCase()}
          </div>
          <div className="sub">Race day {plan.goalDate}</div>
        </div>
        <div className="stat-tile">
          <div className="label">Predicted race pace</div>
          <div className="value" style={{ fontSize: 20 }}>
            {plan.predictedRacePace || '--'}
          </div>
          <div className="sub">from recent best effort</div>
        </div>
        <div className="stat-tile">
          <div className="label">Peak weekly volume</div>
          <div className="value" style={{ fontSize: 20 }}>
            {plan.peakWeeklyKm} {plan.unit}
          </div>
          <div className="sub">up from {plan.baselineWeeklyKm} {plan.unit} now</div>
        </div>
        <div className="stat-tile">
          <div className="label">Plan length</div>
          <div className="value" style={{ fontSize: 20 }}>
            {plan.totalWeeks} weeks
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Weekly overview</div>
        {plan.weeks.map((w, i) => (
          <div key={w.weekNumber}>
            <div className="week-row" style={{ cursor: 'pointer' }} onClick={() => setOpenWeek(openWeek === i ? -1 : i)}>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Week {w.weekNumber}</span>
              <span className={`phase-badge ${phaseClass(w.phase)}`} style={{ justifySelf: 'start' }}>
                {w.phase}
              </span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>
                {w.targetDistanceKm} {plan.unit}
              </span>
            </div>
            {openWeek === i && <WeekDetail week={w} unit={plan.unit} />}
          </div>
        ))}
      </div>
    </div>
  );
}
