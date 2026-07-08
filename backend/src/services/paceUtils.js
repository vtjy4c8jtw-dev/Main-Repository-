function formatPace(secPerKm, unit = 'km') {
  if (!secPerKm) return '--';
  const secPerUnit = unit === 'mi' ? secPerKm * 1.60934 : secPerKm;
  const mins = Math.floor(secPerUnit / 60);
  const secs = Math.round(secPerUnit % 60);
  return `${mins}:${String(secs).padStart(2, '0')} /${unit}`;
}

// Riegel's endurance formula: predicts race time at a new distance from a known
// performance, assuming similar training/conditions.
function predictRaceTime(knownDistanceKm, knownTimeSec, targetDistanceKm) {
  return knownTimeSec * (targetDistanceKm / knownDistanceKm) ** 1.06;
}

const PACE_ZONE_LABELS = ['Recovery', 'Easy', 'Tempo', 'Threshold', 'VO2 Max'];

module.exports = {
  formatPace,
  predictRaceTime,
  PACE_ZONE_LABELS,
};
