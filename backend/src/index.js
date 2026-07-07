const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
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

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.code === 'NOT_CONNECTED') {
    return res.status(401).json({ error: 'Not connected to Strava' });
  }
  console.error(err.response?.data || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Strava dashboard API running on port ${PORT}`);
});
