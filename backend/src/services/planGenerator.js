const { predictRaceTime, formatPace } = require('./paceUtils');

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RACE_PRESETS = {
  '5k': 5,
  '10k': 10,
  half: 21.0975,
  marathon: 42.195,
};

// Recommended peak long run distance (km) and weekly-volume-to-long-run
// multiplier per goal, tuned for recreational/sub-elite runners.
const GOAL_PROFILE = {
  5: { longRunKm: 11, volumeMultiple: 2.6, taperWeeks: 2 },
  10: { longRunKm: 15, volumeMultiple: 3.0, taperWeeks: 2 },
  21.0975: { longRunKm: 19, volumeMultiple: 3.2, taperWeeks: 3 },
  42.195: { longRunKm: 32, volumeMultiple: 3.4, taperWeeks: 3 },
};

function closestGoalProfile(distanceKm) {
  const known = Object.keys(GOAL_PROFILE).map(Number);
  const nearest = known.reduce((a, b) => (Math.abs(b - distanceKm) < Math.abs(a - distanceKm) ? b : a));
  return GOAL_PROFILE[nearest];
}

function addDays(date, n) {
  return new Date(date.getTime() + n * DAY_MS);
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

// All physiological targets (peak long run, volume multipliers, etc.) are
// tuned in real kilometers, so distances are only converted to the
// athlete's display unit at the point they're written to the output.
function kmToUnit(km, unit) {
  const value = unit === 'mi' ? km * 0.621371 : km;
  return Math.round(value * 10) / 10;
}

function phaseForWeek(weekIndex, nonTaperWeeks) {
  const ratio = (weekIndex + 1) / nonTaperWeeks;
  if (ratio <= 0.4) return 'Base';
  if (ratio <= 0.75) return 'Build';
  return 'Peak';
}

function buildWorkoutDescription(phase, weekInPhaseIdx, zones, racePaceSecPerKm, unit) {
  const threshold = zones.find((z) => z.label === 'Threshold');
  const vo2 = zones.find((z) => z.label === 'VO2 Max');

  if (phase === 'Base') {
    return {
      type: 'Strides / Fartlek',
      description: `Easy run with 6-8 x 20s relaxed strides, full recovery between.`,
    };
  }
  if (phase === 'Build') {
    const reps = 5 + Math.min(weekInPhaseIdx, 4); // 5..9
    return {
      type: 'Threshold Intervals',
      description: `Warm up, then ${reps} x 800m @ ${formatPace(threshold?.avgPaceSecPerKm, unit)} with 400m easy jog recovery, cool down.`,
    };
  }
  if (phase === 'Peak') {
    return {
      type: 'Race-Pace Repeats',
      description: `Warm up, then 4 x 1.6km @ ${formatPace(racePaceSecPerKm, unit)} (goal race pace) with 3min jog recovery, cool down.`,
    };
  }
  return {
    type: 'Sharpening',
    description: `Warm up, then 4 x 400m @ ${formatPace(vo2?.avgPaceSecPerKm, unit)} with full recovery, cool down. Keep legs fresh.`,
  };
}

function weekDayPlan({ phase, weekInPhaseIdx, daysPerWeek, weeklyKm, longRunKm, zones, racePaceSecPerKm, unit, isRaceWeek }) {
  const easy = zones.find((z) => z.label === 'Easy');
  const recovery = zones.find((z) => z.label === 'Recovery');
  const easyPace = formatPace(easy?.avgPaceSecPerKm, unit);
  const recoveryPace = formatPace(recovery?.avgPaceSecPerKm, unit);

  const remainingKm = Math.max(weeklyKm - longRunKm, 0);
  const runDaysExcludingLong = Math.max(daysPerWeek - 1, 1);
  const perEasyRunKm = remainingKm / runDaysExcludingLong;

  const days = WEEK_DAYS.map((label) => ({ day: label, type: 'Rest', description: 'Recovery — rest or cross-train.' }));

  // Long run on Sunday
  days[6] = {
    day: 'Sun',
    type: isRaceWeek ? 'Race Day' : 'Long Run',
    targetDistanceKm: Math.round(longRunKm * 10) / 10,
    targetPace: recoveryPace + ' – ' + easyPace,
    description: isRaceWeek
      ? `Race day! Goal pace ${formatPace(racePaceSecPerKm, unit)}.`
      : `Steady long run, negative-split the final 20% if feeling strong.`,
  };

  if (isRaceWeek) {
    // Light week: a couple short shakeouts, mostly rest.
    days[2] = {
      day: 'Wed',
      type: 'Shakeout',
      targetDistanceKm: unit === 'mi' ? 2 : 3,
      targetPace: easyPace,
      description: 'Short easy shakeout run with a few strides.',
    };
    return days;
  }

  const trainingDaySlots = [0, 1, 3, 4, 5]; // Mon Tue Thu Fri Sat, leaving Wed/rest flexible
  let assigned = 0;
  const workout = buildWorkoutDescription(phase, weekInPhaseIdx, zones, racePaceSecPerKm, unit);

  for (const slot of trainingDaySlots) {
    if (assigned >= daysPerWeek - 1) break;
    const isWorkoutDay = assigned === 1 && workout; // second training day gets the quality workout
    if (isWorkoutDay) {
      days[slot] = {
        day: WEEK_DAYS[slot],
        type: workout.type,
        targetDistanceKm: Math.round(perEasyRunKm * 10) / 10,
        targetPace: 'see workout',
        description: workout.description,
      };
    } else {
      days[slot] = {
        day: WEEK_DAYS[slot],
        type: 'Easy Run',
        targetDistanceKm: Math.round(perEasyRunKm * 10) / 10,
        targetPace: easyPace,
        description: 'Conversational effort, focus on consistent cadence.',
      };
    }
    assigned += 1;
  }

  return days;
}

function generatePlan({ goal, goalDate, daysPerWeek = 5, currentFitness, paceZones, bestRecentEffort, measurementPreference }) {
  const unit = measurementPreference === 'feet' ? 'mi' : 'km';
  const distanceKm = RACE_PRESETS[goal] || Number(goal) || 10;
  const profile = closestGoalProfile(distanceKm);
  const zones = paceZones;

  let racePaceSecPerKm = null;
  if (bestRecentEffort) {
    const predictedSec = predictRaceTime(bestRecentEffort.distanceKm, bestRecentEffort.timeSec, distanceKm);
    racePaceSecPerKm = predictedSec / distanceKm;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const race = new Date(goalDate);
  const totalWeeks = Math.max(Math.ceil((race - today) / (7 * DAY_MS)), 4);
  const taperWeeks = Math.min(profile.taperWeeks, totalWeeks - 2);
  const nonTaperWeeks = totalWeeks - taperWeeks;

  const baselineKm = Math.max(currentFitness.avgWeeklyKm || 0, 12);
  const rawPeakKm = Math.max(profile.longRunKm * profile.volumeMultiple, baselineKm * 1.1);
  const peakKm = Math.min(rawPeakKm, baselineKm * 1.6); // guard against unsafe jumps for low-mileage athletes

  const baselineLongKm = Math.max(currentFitness.longestRunKm || 0, distanceKm * 0.3, 5);
  const peakLongKm = Math.min(profile.longRunKm, baselineLongKm * 1.8);

  const weeks = [];
  const weekStart0 = (() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff); // Monday of current week
  })();

  let phaseCounters = { Base: 0, Build: 0, Peak: 0 };

  for (let w = 0; w < totalWeeks; w += 1) {
    const isTaper = w >= nonTaperWeeks;
    const weekStart = addDays(weekStart0, w * 7);
    const isRaceWeek = w === totalWeeks - 1;

    let phase;
    let weeklyKm;
    let longRunKm;

    if (isTaper) {
      const taperIdx = w - nonTaperWeeks; // 0-based within taper
      const remainingTaper = taperWeeks - taperIdx;
      phase = isRaceWeek ? 'Race Week' : 'Taper';
      const taperFactor = isRaceWeek ? 0.35 : 0.55 + 0.15 * (remainingTaper - 1);
      weeklyKm = peakKm * Math.min(taperFactor, 0.85);
      longRunKm = isRaceWeek ? distanceKm : peakLongKm * 0.6;
      if (isRaceWeek) weeklyKm = Math.max(weeklyKm, distanceKm + 4);
    } else {
      phase = phaseForWeek(w, nonTaperWeeks);
      phaseCounters[phase] += 1;
      const progress = (w + 1) / nonTaperWeeks;
      weeklyKm = baselineKm + (peakKm - baselineKm) * progress;
      // Cutback every 4th week to manage fatigue.
      if ((w + 1) % 4 === 0) weeklyKm *= 0.8;
      longRunKm = Math.min(baselineLongKm + (peakLongKm - baselineLongKm) * progress, peakLongKm);
    }

    if (!isRaceWeek) longRunKm = Math.min(longRunKm, weeklyKm * 0.42);
    const weeklyDisplay = kmToUnit(weeklyKm, unit);
    const longRunDisplay = kmToUnit(longRunKm, unit);

    const days = weekDayPlan({
      phase,
      weekInPhaseIdx: phaseCounters[phase] || 0,
      daysPerWeek,
      weeklyKm: weeklyDisplay,
      longRunKm: longRunDisplay,
      zones,
      racePaceSecPerKm,
      unit,
      isRaceWeek,
      isFinalTaperWeek: isTaper,
    });

    weeks.push({
      weekNumber: w + 1,
      weekStart: isoDate(weekStart),
      phase,
      targetDistanceKm: weeklyDisplay,
      targetLongRunKm: longRunDisplay,
      days,
    });
  }

  return {
    goal,
    goalDate: isoDate(race),
    totalWeeks,
    unit,
    predictedRacePace: racePaceSecPerKm ? formatPace(racePaceSecPerKm, unit) : null,
    baselineWeeklyKm: kmToUnit(baselineKm, unit),
    peakWeeklyKm: kmToUnit(peakKm, unit),
    zones,
    weeks,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generatePlan, RACE_PRESETS };
