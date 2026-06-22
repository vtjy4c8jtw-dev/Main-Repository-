const express = require('express');
const { query, validationResult } = require('express-validator');
const weatherAggregator = require('../services/weatherAggregator');
const Location = require('../models/Location');
const Forecast = require('../models/Forecast');

const router = express.Router();

router.get(
  '/current',
  [
    query('lat').isFloat(),
    query('lon').isFloat(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { lat, lon } = req.query;
      const aggregated = await weatherAggregator.aggregateWeather(lat, lon);

      res.json({
        location: { lat, lon },
        data: aggregated,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
