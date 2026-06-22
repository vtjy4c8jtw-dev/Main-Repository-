import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({ lat: 40.7128, lon: -74.006 });

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/api/weather/current?lat=${location.lat}&lon=${location.lon}`
      );
      setWeather(response.data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (newLat, newLon) => {
    setLocation({ lat: newLat, lon: newLon });
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🌤️ Weather SuperComputer</h1>
        <p>Aggregated weather forecasts for maximum accuracy</p>
      </header>

      <main className="container">
        <div className="search-box">
          <h2>Enter Location</h2>
          <div className="input-group">
            <input
              type="number"
              placeholder="Latitude"
              value={location.lat}
              onChange={(e) => handleLocationChange(parseFloat(e.target.value), location.lon)}
              step="0.01"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={location.lon}
              onChange={(e) => handleLocationChange(location.lat, parseFloat(e.target.value))}
              step="0.01"
            />
            <button onClick={fetchWeather} disabled={loading}>
              {loading ? 'Loading...' : 'Get Weather'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">Error: {error}</div>}

        {weather && (
          <div className="weather-display">
            <div className="weather-main">
              <h2>Current Weather</h2>
              <div className="weather-grid">
                <div className="weather-card">
                  <span className="label">Temperature</span>
                  <span className="value">{weather.temperature}°C</span>
                </div>
                <div className="weather-card">
                  <span className="label">Humidity</span>
                  <span className="value">{weather.humidity}%</span>
                </div>
                <div className="weather-card">
                  <span className="label">Wind Speed</span>
                  <span className="value">{weather.windSpeed} m/s</span>
                </div>
              </div>
            </div>

            <div className="sources">
              <h3>Data Sources</h3>
              <ul>
                {weather.sources.map((source, idx) => (
                  <li key={idx}>
                    <strong>{source.name}</strong> - {source.temperature}°C, {source.humidity}% humidity
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
