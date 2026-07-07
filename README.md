# Run Dashboard 🏃

A running dashboard that connects to Strava, visualizes your training data in
one place, and generates a personalized training plan based on your actual
fitness and history.

## Features

- ✅ Connect your Strava account via OAuth
- ✅ Weekly distance, pace trend, heart-rate zone distribution, and training
  load (acute:chronic ratio) charts
- ✅ Recent activity log with pace/distance/type at a glance
- ✅ Personalized, periodized training plans (Base → Build → Peak → Taper)
  built from your own recent mileage, long-run distance, heart-rate zones,
  and best recent effort — not a generic template
- ✅ Light/dark theme

## Tech Stack

- **Frontend:** React (Create React App)
- **Backend:** Node.js + Express
- **Data source:** Strava API v3 (OAuth)
- **Deployment:** Docker

## Quick Start

### Prerequisites
- Node.js (v18+)
- npm
- A Strava API application — create one at
  https://www.strava.com/settings/api (set the "Authorization Callback
  Domain" to `localhost`)

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

3. Copy `.env.example` to `.env` (backend reads it via `dotenv`) and fill in
   `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` from your Strava API
   application.

4. Start the development servers:
```bash
npm run dev
```

5. Open `http://localhost:3000` and click **Connect with Strava**.

## Project Structure

```
.
├── frontend/          # React dashboard
│   └── src/
│       ├── components/  # Stat tiles, charts, activity table, plan view
│       ├── pages/        # Dashboard page
│       └── api/          # Backend API client
├── backend/           # Express API server
│   └── src/
│       ├── routes/       # auth, athlete, activities, analysis, training-plan
│       └── services/      # Strava client, analysis engine, plan generator
├── docs/               # Documentation
├── docker-compose.yml  # Local development setup
└── .env.example        # Environment variables template
```

## How the analysis works

- **Weekly summaries** aggregate distance, time, elevation, and pace per week
  from your run history.
- **Training load** uses Strava's relative-effort score (or a duration/HR
  based estimate when unavailable) to compute a 7-day acute load vs. 28-day
  chronic load ratio (ACWR) — a common proxy for injury risk from ramping
  volume too fast.
- **Pace zones** are derived from your own data: for each heart-rate zone,
  the app averages the pace of your runs whose average HR fell in that zone,
  so "tempo pace" and "threshold pace" reflect your actual performance
  rather than a generic chart.

## How the training plan works

Given a goal race, date, and days/week you can train, the plan generator:

1. Computes your current 4-week average weekly volume and longest recent run.
2. Sets a safe peak weekly volume and peak long run for the goal distance,
   capping the ramp-up rate.
3. Splits the remaining weeks into Base / Build / Peak phases plus a taper,
   with a cutback week every 4th week.
4. Assigns workout types per phase (strides → threshold intervals →
   race-pace repeats → sharpening) using your derived pace zones.
5. Predicts your goal race pace from your best recent effort using Riegel's
   endurance formula.

## Getting Strava API Credentials

1. Go to https://www.strava.com/settings/api
2. Create an application (Authorization Callback Domain: `localhost`)
3. Copy the Client ID and Client Secret into your `.env`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT
