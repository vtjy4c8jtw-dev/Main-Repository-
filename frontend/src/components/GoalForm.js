import React, { useState } from 'react';

const PRESETS = [
  { value: '5k', label: '5K' },
  { value: '10k', label: '10K' },
  { value: 'half', label: 'Half Marathon' },
  { value: 'marathon', label: 'Marathon' },
];

function defaultGoalDate() {
  const d = new Date();
  d.setDate(d.getDate() + 12 * 7);
  return d.toISOString().slice(0, 10);
}

export default function GoalForm({ onGenerate, generating }) {
  const [goal, setGoal] = useState('10k');
  const [goalDate, setGoalDate] = useState(defaultGoalDate());
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate({ goal, goalDate, daysPerWeek });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div>
          <label htmlFor="goal">Race distance</label>
          <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="goalDate">Race date</label>
          <input id="goalDate" type="date" value={goalDate} onChange={(e) => setGoalDate(e.target.value)} />
        </div>
        <div>
          <label htmlFor="daysPerWeek">Training days / week</label>
          <select id="daysPerWeek" value={daysPerWeek} onChange={(e) => setDaysPerWeek(Number(e.target.value))}>
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={generating}>
        {generating ? 'Generating…' : 'Generate my training plan'}
      </button>
    </form>
  );
}
