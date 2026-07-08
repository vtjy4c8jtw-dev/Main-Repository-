import React, { useEffect, useState } from 'react';
import { loginUrl, getImportStatus } from '../api/client';
import ImportPanel from './ImportPanel';

export default function ConnectStrava() {
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    getImportStatus()
      .then(setImportStatus)
      .catch(() => setImportStatus(null));
  }, []);

  return (
    <div>
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

      <div className="card">
        <ImportPanel importStatus={importStatus} onChange={() => window.location.reload()} />
      </div>
    </div>
  );
}
