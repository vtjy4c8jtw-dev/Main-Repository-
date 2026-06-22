# Weather API Setup Guide

## OpenWeatherMap

1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Generate an API key from your account dashboard
4. Add to `.env`: `OPENWEATHER_API_KEY=your_key`

### Usage in Code
```javascript
const response = await fetch(
  `https://api.openweathermap.org/data/2.5/forecast?q=London&appid=${OPENWEATHER_API_KEY}`
);
```

## WeatherAPI

1. Visit https://www.weatherapi.com/
2. Sign up for free
3. Copy your API key from the dashboard
4. Add to `.env`: `WEATHER_API_KEY=your_key`

### Usage in Code
```javascript
const response = await axios.get(
  `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=London&days=10`
);
```

## NOAA

1. NOAA doesn't require authentication for basic requests
2. Visit https://www.weather.gov/documentation/services-web-api
3. Read the documentation

### Usage in Code
```javascript
const gridResponse = await fetch(
  `https://api.weather.gov/points/39.7392,-104.9903`
);
const gridData = await gridResponse.json();
const forecastResponse = await fetch(gridData.properties.forecast);
const forecast = await forecastResponse.json();
```

## Aggregation Strategy

The backend will:
1. Call all three APIs for a given location
2. Parse and normalize the data
3. Weight the forecasts (optional: by source reliability)
4. Return the aggregated forecast to the frontend

See `backend/src/services/weatherAggregator.js` for implementation details.
