import React from 'react';
import { formatDistance, formatDuration, formatPace, formatDate } from '../utils/format';

export default function ActivityTable({ activities, unit }) {
  const rows = activities.slice(0, 12);

  if (!rows.length) {
    return <div className="empty-state">No recent activities found.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Type</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>{formatDate(a.startDate)}</td>
              <td>{a.name}</td>
              <td>
                <span className={`pill pill-${a.category}`}>{a.category.replace('_', ' ')}</span>
              </td>
              <td>{formatDistance(a.distance, unit)}</td>
              <td>{formatDuration(a.movingTime)}</td>
              <td>{formatPace(a.movingTime / (a.distance / 1000), unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
