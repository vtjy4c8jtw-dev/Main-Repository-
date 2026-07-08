const { stravaGet } = require('./stravaClient');
const importStore = require('../lib/importStore');

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { at: 0, activities: [] };

// Strava's activity workout_type: 0 default run, 1 race, 2 long run, 3 workout (intervals/tempo)
const WORKOUT_TYPE_LABEL = {
  0: 'run',
  1: 'race',
  2: 'long_run',
  3: 'workout',
};

function classifyActivity(a) {
  if (a.workout_type != null && WORKOUT_TYPE_LABEL[a.workout_type]) {
    return WORKOUT_TYPE_LABEL[a.workout_type];
  }
  const name = (a.name || '').toLowerCase();
  if (/x\s?\d|interval|repeat|400|800|1k|1200|mile/.test(name)) return 'workout';
  if (a.distance > 15000) return 'long_run';
  return 'run';
}

async function fetchLiveRuns(days) {
  const after = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const perPage = 100;
  let page = 1;
  const all = [];

  for (;;) {
    const batch = await stravaGet('/athlete/activities', { after, per_page: perPage, page });
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
    if (page > 10) break; // safety cap
  }

  return all
    .filter((a) => a.type === 'Run' || a.sport_type === 'Run')
    .map((a) => ({
      id: String(a.id),
      name: a.name,
      startDate: a.start_date_local,
      distance: a.distance, // meters
      movingTime: a.moving_time, // seconds
      elapsedTime: a.elapsed_time,
      elevationGain: a.total_elevation_gain,
      avgHeartrate: a.average_heartrate || null,
      maxHeartrate: a.max_heartrate || null,
      sufferScore: a.suffer_score || null,
      avgSpeed: a.average_speed, // m/s
      cadence: a.average_cadence || null,
      category: classifyActivity(a),
      source: 'live',
    }));
}

// Combines live Strava activities (if connected) with any imported export
// data, de-duplicating by activity id (live wins on conflict, since it's
// the more current source). Works fine with only one source present.
async function fetchRecentRuns({ days = 120 } = {}) {
  const now = Date.now();
  if (now - cache.at < CACHE_TTL_MS && cache.activities.length) {
    return cache.activities;
  }

  let liveRuns = [];
  try {
    liveRuns = await fetchLiveRuns(days);
  } catch (err) {
    if (err.code !== 'NOT_CONNECTED') throw err;
  }

  const imported = importStore.read();
  const importedRuns = imported ? imported.runs : [];

  const byId = new Map();
  for (const run of importedRuns) byId.set(run.id, run);
  for (const run of liveRuns) byId.set(run.id, run); // live takes precedence

  const runs = Array.from(byId.values()).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  cache = { at: now, activities: runs };
  return runs;
}

function invalidateCache() {
  cache = { at: 0, activities: [] };
}

module.exports = { fetchRecentRuns, invalidateCache, classifyActivity };
