import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import ConnectStrava from './components/ConnectStrava';
import { getAuthStatus, logout } from './api/client';

export default function App() {
  const [connected, setConnected] = useState(null);
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    getAuthStatus()
      .then((s) => setConnected(s.connected))
      .catch(() => setConnected(false));
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
    setConnected(false);
  }

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
          {connected && (
            <button onClick={handleLogout} title="Disconnect Strava">
              Disconnect
            </button>
          )}
        </div>
      </header>

      {connected === null && <div className="empty-state">Checking Strava connection…</div>}
      {connected === false && <ConnectStrava />}
      {connected === true && <Dashboard />}
    </div>
  );
}
