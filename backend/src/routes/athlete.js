const express = require('express');
const { stravaGet } = require('../services/stravaClient');
const importStore = require('../lib/importStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const profile = await stravaGet('/athlete');
    res.json(profile);
  } catch (err) {
    if (err.code === 'NOT_CONNECTED') {
      const imported = importStore.read();
      if (imported) {
        return res.json({
          measurement_preference: imported.detectedUnit === 'mi' ? 'feet' : 'meters',
          fromImport: true,
        });
      }
    }
    next(err);
  }
});

router.get('/zones', async (req, res, next) => {
  try {
    const zones = await stravaGet('/athlete/zones');
    res.json(zones);
  } catch (err) {
    if (err.code === 'NOT_CONNECTED') {
      return res.json({ heart_rate: null });
    }
    next(err);
  }
});

module.exports = router;
