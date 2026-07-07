const express = require('express');
const { stravaGet } = require('../services/stravaClient');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const profile = await stravaGet('/athlete');
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.get('/zones', async (req, res, next) => {
  try {
    const zones = await stravaGet('/athlete/zones');
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
