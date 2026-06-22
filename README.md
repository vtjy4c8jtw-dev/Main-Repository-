# Weather SuperComputer 🌤️

A unified weather forecasting platform that aggregates data from multiple weather services to provide the most accurate local weather forecast.

## Features

- ✅ Aggregates forecasts from multiple weather APIs
- ✅ Real-time weather updates
- ✅ Location-based forecasting
- ✅ Data visualization and analytics
- ✅ Historical weather data tracking

## Tech Stack

- **Frontend:** React.js with TypeScript
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **APIs:** OpenWeatherMap, WeatherAPI, NOAA
- **Deployment:** Docker

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB (local or Atlas)
- Weather API keys (see setup below)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vtjy4c8jtw-dev/Main-Repository-.git
cd Main-Repository-
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables (see `.env.example`)

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
.
├── frontend/          # React app
├── backend/           # Express API server
├── docs/              # Documentation
├── docker-compose.yml # Local development setup
└── .env.example       # Environment variables template
```

## Getting API Keys

1. **OpenWeatherMap**: https://openweathermap.org/api
2. **WeatherAPI**: https://www.weatherapi.com/
3. **NOAA**: https://www.weather.gov/documentation/services-web-api

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT
