const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_BUILD_DIR = path.join(__dirname, '..', '..', 'frontend', 'build');
const hasFrontendBuild = fs.existsSync(path.join(FRONTEND_BUILD_DIR, 'index.html'));

// Same-origin deploys (backend serving the built frontend) need a
// permissive-enough CSP for CRA's static assets; API-only local dev
// (frontend on its own dev server) keeps helmet's stricter defaults.
app.use(helmet(hasFrontendBuild ? { contentSecurityPolicy: false } : undefined));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/athlete', require('./routes/athlete'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/analysis', require('./routes/analysis'));
app.use('/api/training-plan', require('./routes/trainingPlan'));
app.use('/api/import', require('./routes/importRoute'));

if (hasFrontendBuild) {
  app.use(express.static(FRONTEND_BUILD_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(FRONTEND_BUILD_DIR, 'index.html'));
  });
}

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.code === 'NOT_CONNECTED') {
    return res.status(401).json({ error: 'Not connected to Strava' });
  }
  console.error(err.response?.data || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Strava dashboard API running on port ${PORT}${hasFrontendBuild ? ' (serving built frontend)' : ''}`);
});
