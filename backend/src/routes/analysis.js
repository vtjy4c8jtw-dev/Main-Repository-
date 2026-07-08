const express = require('express');
const { fetchRecentRuns } = require('../services/activityService');
const { summarizeAnalysis } = require('../services/analysisEngine');
const { stravaGet } = require('../services/stravaClient');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [runs, zoneData] = await Promise.all([
      fetchRecentRuns({ days: Number(req.query.days) || 120 }),
      stravaGet('/athlete/zones').catch(() => null),
    ]);
    const hrZones =
      zoneData && zoneData.heart_rate
        ? zoneData.heart_rate.zones.map((z) => ({ min: z.min, max: z.max === -1 ? null : z.max }))
        : null;
    res.json(summarizeAnalysis(runs, hrZones));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
