const express = require('express');
const { fetchRecentRuns } = require('../services/activityService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const runs = await fetchRecentRuns({ days: Number(req.query.days) || 120 });
    res.json({ activities: runs.slice().reverse() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
