const express = require('express');
const fs = require('fs');
const path = require('path');
const { fetchRecentRuns } = require('../services/activityService');
const { currentFitness, paceZonesFromHeartRate, bestRecentEffort } = require('../services/analysisEngine');
const { generatePlan, RACE_PRESETS } = require('../services/planGenerator');
const { stravaGet } = require('../services/stravaClient');
const importStore = require('../lib/importStore');

async function resolveMeasurementPreference() {
  try {
    const profile = await stravaGet('/athlete');
    return profile.measurement_preference;
  } catch (err) {
    if (err.code !== 'NOT_CONNECTED') throw err;
    const imported = importStore.read();
    return imported && imported.detectedUnit === 'mi' ? 'feet' : 'meters';
  }
}

const router = express.Router();
const PLAN_PATH = path.join(__dirname, '..', 'data', 'plan.json');

router.get('/goals', (req, res) => {
  res.json({ presets: Object.keys(RACE_PRESETS) });
});

router.get('/', (req, res) => {
  try {
    const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));
    res.json(plan);
  } catch {
    res.status(404).json({ error: 'No training plan generated yet' });
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { goal, goalDate, daysPerWeek } = req.body;
    if (!goal || !goalDate) {
      return res.status(400).json({ error: 'goal and goalDate are required' });
    }

    const [runs, measurementPreference, zoneData] = await Promise.all([
      fetchRecentRuns({ days: 120 }),
      resolveMeasurementPreference(),
      stravaGet('/athlete/zones').catch(() => null),
    ]);
    const hrZones =
      zoneData && zoneData.heart_rate
        ? zoneData.heart_rate.zones.map((z) => ({ min: z.min, max: z.max === -1 ? null : z.max }))
        : null;

    const plan = generatePlan({
      goal,
      goalDate,
      daysPerWeek: Number(daysPerWeek) || 5,
      currentFitness: currentFitness(runs),
      paceZones: paceZonesFromHeartRate(runs, hrZones),
      bestRecentEffort: bestRecentEffort(runs),
      measurementPreference,
    });

    fs.mkdirSync(path.dirname(PLAN_PATH), { recursive: true });
    fs.writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2));
    res.json(plan);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
