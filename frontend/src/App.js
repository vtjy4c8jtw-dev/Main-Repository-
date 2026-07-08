import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import ConnectStrava from './components/ConnectStrava';
import { getAuthStatus, logout } from './api/client';

export default function App() {
  const [status, setStatus] = useState(null);
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    getAuthStatus()
      .then(setStatus)
      .catch(() => setStatus({ connected: false, hasImportedData: false }));
  }, []);

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  async function handleLogout() {
    await logout();
    setStatus((s) => ({ ...s, connected: false }));
  }

  const hasData = status && (status.connected || status.hasImportedData);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">🏃</span> Run Dashboard
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="system">System theme</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          {status?.connected && (
            <button onClick={handleLogout} title="Disconnect Strava">
              Disconnect
            </button>
          )}
        </div>
      </header>

      {status === null && <div className="empty-state">Checking Strava connection…</div>}
      {status !== null && !hasData && <ConnectStrava />}
      {hasData && <Dashboard status={status} />}
    </div>
  );
}
