export function formatDistance(meters, unit) {
  if (meters == null) return '--';
  const value = unit === 'mi' ? meters / 1609.34 : meters / 1000;
  return `${value.toFixed(2)} ${unit}`;
}

export function formatDuration(seconds) {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPace(secPerKm, unit) {
  if (!secPerKm) return '--';
  const secPerUnit = unit === 'mi' ? secPerKm * 1.60934 : secPerKm;
  const mins = Math.floor(secPerUnit / 60);
  const secs = Math.round(secPerUnit % 60);
  return `${mins}:${String(secs).padStart(2, '0')} /${unit}`;
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
