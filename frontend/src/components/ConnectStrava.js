import React from 'react';
import { loginUrl } from '../api/client';

export default function ConnectStrava() {
  return (
    <div className="card connect-banner">
      <div>
        <div className="card-title" style={{ marginBottom: 6 }}>
          Connect your Strava account
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Link Strava to see your training analysis and get a personalized running plan.
        </div>
      </div>
      <a href={loginUrl()} className="btn btn-primary">
        Connect with Strava
      </a>
    </div>
  );
}
