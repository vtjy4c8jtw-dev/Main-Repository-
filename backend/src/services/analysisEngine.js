const { PACE_ZONE_LABELS } = require('./paceUtils');

const DAY_MS = 24 * 60 * 60 * 1000;
// Relative pace multipliers vs. the Easy zone, used to interpolate a zone
// that has no direct heart-rate/pace samples in the athlete's history.
const ZONE_RATIO_VS_EASY = [1.12, 1.0, 0.93, 0.87, 0.8];

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // week starts Monday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d;
}

function paceSecPerKm(distanceMeters, movingTimeSec) {
  if (!distanceMeters) return null;
  return movingTimeSec / (distanceMeters / 1000);
}

function weeklySummaries(runs) {
  const weeks = new Map();
  for (const run of runs) {
    const weekKey = startOfWeek(run.startDate).toISOString().slice(0, 10);
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, {
        weekStart: weekKey,
        distance: 0,
        movingTime: 0,
        elevationGain: 0,
        runCount: 0,
        longestRun: 0,
        workouts: 0,
      });
    }
    const w = weeks.get(weekKey);
    w.distance += run.distance;
    w.movingTime += run.movingTime;
    w.elevationGain += run.elevationGain || 0;
    w.runCount += 1;
    w.longestRun = Math.max(w.longestRun, run.distance);
    if (run.category === 'workout' || run.category === 'race') w.workouts += 1;
  }
  return Array.from(weeks.values())
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .map((w) => ({
      ...w,
      avgPaceSecPerKm: paceSecPerKm(w.distance, w.movingTime),
      distanceKm: w.distance / 1000,
    }));
}

function paceTrend(runs) {
  return weeklySummaries(runs).map((w) => ({
    weekStart: w.weekStart,
    avgPaceSecPerKm: w.avgPaceSecPerKm,
    distanceKm: w.distanceKm,
  }));
}

// Bucket each run's average heart rate into the athlete's 5 HR zones and
// attribute the run's moving time to that zone as an estimate of zone distribution.
function heartRateZoneDistribution(runs, hrZones) {
  const zoneSeconds = [0, 0, 0, 0, 0];
  let runsWithHr = 0;
  for (const run of runs) {
    if (!run.avgHeartrate || !hrZones || !hrZones.length) continue;
    runsWithHr += 1;
    const zoneIdx = hrZones.findIndex(
      (z) => run.avgHeartrate >= z.min && (z.max == null || run.avgHeartrate <= z.max)
    );
    const idx = zoneIdx === -1 ? hrZones.length - 1 : zoneIdx;
    zoneSeconds[idx] += run.movingTime;
  }
  const totalSeconds = zoneSeconds.reduce((a, b) => a + b, 0);
  return {
    runsWithHr,
    zones: zoneSeconds.map((seconds, i) => ({
      zone: i + 1,
      seconds,
      minutes: Math.round(seconds / 60),
      percent: totalSeconds ? Math.round((seconds / totalSeconds) * 1000) / 10 : 0,
    })),
  };
}

// Training load proxy: uses Strava's suffer_score when present, otherwise
// falls back to a duration-based estimate scaled by HR-derived intensity.
function dailyLoad(runs) {
  const byDay = new Map();
  for (const run of runs) {
    const dayKey = run.startDate.slice(0, 10);
    let load = run.sufferScore;
    if (load == null) {
      const intensity = run.avgHeartrate ? run.avgHeartrate / 150 : 1;
      load = (run.movingTime / 60) * intensity;
    }
    byDay.set(dayKey, (byDay.get(dayKey) || 0) + load);
  }
  return byDay;
}

function acuteChronicRatio(runs) {
  const byDay = dailyLoad(runs);
  if (!byDay.size) return { acuteLoad: 0, chronicLoad: 0, acwr: null, series: [] };

  const days = Array.from(byDay.keys()).sort();
  const lastDay = new Date(days[days.length - 1]);
  const series = [];

  for (let offset = 55; offset >= 0; offset -= 1) {
    const d = new Date(lastDay.getTime() - offset * DAY_MS);
    const key = d.toISOString().slice(0, 10);

    let acuteSum = 0;
    for (let i = 0; i < 7; i += 1) {
      const k = new Date(d.getTime() - i * DAY_MS).toISOString().slice(0, 10);
      acuteSum += byDay.get(k) || 0;
    }
    let chronicSum = 0;
    for (let i = 0; i < 28; i += 1) {
      const k = new Date(d.getTime() - i * DAY_MS).toISOString().slice(0, 10);
      chronicSum += byDay.get(k) || 0;
    }
    const acute = acuteSum / 7;
    const chronic = chronicSum / 28;
    series.push({
      date: key,
      acuteLoad: Math.round(acute * 10) / 10,
      chronicLoad: Math.round(chronic * 10) / 10,
      acwr: chronic ? Math.round((acute / chronic) * 100) / 100 : null,
    });
  }

  const latest = series[series.length - 1];
  return { ...latest, series };
}

function consistency(runs, days = 28) {
  if (!runs.length) return { runDays: 0, windowDays: days, percent: 0 };
  const cutoff = Date.now() - days * DAY_MS;
  const daySet = new Set(
    runs.filter((r) => new Date(r.startDate).getTime() >= cutoff).map((r) => r.startDate.slice(0, 10))
  );
  return {
    runDays: daySet.size,
    windowDays: days,
    percent: Math.round((daySet.size / days) * 1000) / 10,
  };
}

function currentFitness(runs) {
  const weeks = weeklySummaries(runs);
  const last4 = weeks.slice(-4);
  const last6 = weeks.slice(-6);
  const avgWeeklyKm = last4.length
    ? last4.reduce((sum, w) => sum + w.distanceKm, 0) / last4.length
    : 0;
  const longestRunKm = last6.length
    ? Math.max(...last6.map((w) => w.longestRun)) / 1000
    : 0;
  const avgWorkoutsPerWeek = last4.length
    ? last4.reduce((sum, w) => sum + w.workouts, 0) / last4.length
    : 0;
  const runDaysPerWeek = last4.length
    ? last4.reduce((sum, w) => sum + w.runCount, 0) / last4.length
    : 0;
  return {
    avgWeeklyKm: Math.round(avgWeeklyKm * 10) / 10,
    longestRunKm: Math.round(longestRunKm * 10) / 10,
    avgWorkoutsPerWeek: Math.round(avgWorkoutsPerWeek * 10) / 10,
    runDaysPerWeek: Math.round(runDaysPerWeek * 10) / 10,
  };
}

// Derives personalized pace zones from the athlete's own run history rather
// than a synthetic table: for each HR zone, average the pace of runs whose
// average heart rate fell in that zone. Zones with no samples are
// interpolated from whichever zone does have data, using fixed physiological
// ratios (recovery slower than easy, tempo/threshold/VO2max progressively
// faster).
function paceZonesFromHeartRate(runs, hrZones) {
  const overallPace = paceSecPerKm(
    runs.reduce((s, r) => s + r.distance, 0),
    runs.reduce((s, r) => s + r.movingTime, 0)
  );

  const buckets = (hrZones || []).map(() => ({ distance: 0, time: 0 }));
  for (const run of runs) {
    if (!run.avgHeartrate || !hrZones || !hrZones.length) continue;
    const idx = hrZones.findIndex((z) => run.avgHeartrate >= z.min && (z.max == null || run.avgHeartrate <= z.max));
    const bucket = buckets[idx === -1 ? hrZones.length - 1 : idx];
    bucket.distance += run.distance;
    bucket.time += run.movingTime;
  }

  const rawPace = buckets.map((b) => (b.distance ? paceSecPerKm(b.distance, b.time) : null));
  const easyIdx = 1;
  const anchorPace = rawPace[easyIdx] || rawPace.find((p) => p) || overallPace || 360;

  return rawPace.map((pace, i) => ({
    zone: i + 1,
    label: PACE_ZONE_LABELS[i] || `Zone ${i + 1}`,
    avgPaceSecPerKm: pace || Math.round(anchorPace * (ZONE_RATIO_VS_EASY[i] || 1)),
    estimated: !pace,
  }));
}

// Finds the athlete's strongest recent effort to use as the seed performance
// for Riegel race-time prediction. Prefers workout/race-tagged runs since
// those best reflect true effort rather than easy mileage.
function bestRecentEffort(runs, days = 120) {
  const cutoff = Date.now() - days * DAY_MS;
  const candidates = runs.filter(
    (r) => r.distance >= 1500 && new Date(r.startDate).getTime() >= cutoff && r.avgSpeed
  );
  if (!candidates.length) return null;

  const scored = candidates.map((r) => ({
    distanceKm: r.distance / 1000,
    timeSec: r.movingTime,
    paceSecPerKm: paceSecPerKm(r.distance, r.movingTime),
    weight: r.category === 'race' ? 1.15 : r.category === 'workout' ? 1.05 : 1,
  }));

  scored.sort((a, b) => a.paceSecPerKm / a.weight - b.paceSecPerKm / b.weight);
  const best = scored[0];
  return { distanceKm: Math.round(best.distanceKm * 100) / 100, timeSec: Math.round(best.timeSec) };
}

function summarizeAnalysis(runs, hrZones) {
  return {
    weeklySummaries: weeklySummaries(runs),
    paceTrend: paceTrend(runs),
    hrZoneDistribution: heartRateZoneDistribution(runs, hrZones),
    trainingLoad: acuteChronicRatio(runs),
    consistency: consistency(runs),
    currentFitness: currentFitness(runs),
    paceZones: paceZonesFromHeartRate(runs, hrZones),
    bestRecentEffort: bestRecentEffort(runs),
    totalRuns: runs.length,
  };
}

module.exports = {
  weeklySummaries,
  paceTrend,
  heartRateZoneDistribution,
  acuteChronicRatio,
  consistency,
  currentFitness,
  paceZonesFromHeartRate,
  bestRecentEffort,
  summarizeAnalysis,
  paceSecPerKm,
};
