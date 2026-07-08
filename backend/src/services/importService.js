const AdmZip = require('adm-zip');
const { parse } = require('csv-parse/sync');
const { classifyActivity } = require('./activityService');

// Strava's bulk-export activities.csv has historically been inconsistent
// about whether "Distance"/"Elevation Gain" are meters, km, or miles across
// export versions and third-party-uploaded activities. Rather than assume,
// we try a few unit hypotheses and pick whichever produces plausible running
// paces across the whole file.
const DISTANCE_UNIT_CANDIDATES = [
  { unit: 'km', metersPerUnit: 1 }, // raw value already meters
  { unit: 'km', metersPerUnit: 1000 }, // raw value in km
  { unit: 'mi', metersPerUnit: 1609.34 }, // raw value in miles
];
const PLAUSIBLE_PACE_RANGE = [120, 900]; // 2:00/km - 15:00/km
const REFERENCE_PACE_SEC_PER_KM = 300; // 5:00/km

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function extractCsvBuffer(buffer, filename) {
  const lower = (filename || '').toLowerCase();
  if (lower.endsWith('.csv')) return buffer;

  if (lower.endsWith('.zip') || isZipMagicNumber(buffer)) {
    const zip = new AdmZip(buffer);
    const entry = zip
      .getEntries()
      .find((e) => /(^|\/)activities\.csv$/i.test(e.entryName));
    if (!entry) {
      throw new Error('Could not find activities.csv inside the archive');
    }
    return entry.getData();
  }

  throw new Error('Unsupported file type — upload the Strava export .zip or its activities.csv');
}

function isZipMagicNumber(buffer) {
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function buildHeaderIndex(headerRow) {
  const index = {};
  headerRow.forEach((raw, i) => {
    const key = raw.trim().toLowerCase();
    if (!index[key]) index[key] = [];
    index[key].push(i);
  });
  return index;
}

function getField(row, headerIndex, candidateNames) {
  for (const name of candidateNames) {
    const indices = headerIndex[name];
    if (!indices) continue;
    for (const idx of indices) {
      const value = row[idx];
      if (value != null && String(value).trim() !== '') return String(value).trim();
    }
  }
  return undefined;
}

function chooseDistanceUnit(rawRows) {
  let best = DISTANCE_UNIT_CANDIDATES[0];
  let bestScore = Infinity;
  let anyInRange = false;

  for (const candidate of DISTANCE_UNIT_CANDIDATES) {
    const paces = rawRows
      .filter((r) => r.movingTime > 0 && r.rawDistance > 0)
      .map((r) => r.movingTime / ((r.rawDistance * candidate.metersPerUnit) / 1000));
    const med = median(paces);
    if (med == null) continue;
    const inRange = med >= PLAUSIBLE_PACE_RANGE[0] && med <= PLAUSIBLE_PACE_RANGE[1];
    const score = Math.abs(med - REFERENCE_PACE_SEC_PER_KM) - (inRange ? 1000 : 0);
    if (inRange) anyInRange = true;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return { ...best, confident: anyInRange };
}

function parseStravaExport(buffer, filename) {
  const csvBuffer = extractCsvBuffer(buffer, filename);
  const rows = parse(csvBuffer, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
  if (!rows.length) throw new Error('activities.csv was empty');

  const headerIndex = buildHeaderIndex(rows[0]);
  const dataRows = rows.slice(1);

  const rawRows = [];
  let skippedNonRun = 0;
  let skippedInvalid = 0;

  dataRows.forEach((row, i) => {
    const activityType = getField(row, headerIndex, ['activity type']);
    if (!activityType || !/run/i.test(activityType)) {
      skippedNonRun += 1;
      return;
    }

    const dateStr = getField(row, headerIndex, ['activity date']);
    const date = dateStr ? new Date(dateStr) : null;
    const rawDistance = parseFloat(getField(row, headerIndex, ['distance']));
    const movingTime = parseFloat(getField(row, headerIndex, ['moving time']));
    const elapsedTime = parseFloat(getField(row, headerIndex, ['elapsed time']));

    if (!date || Number.isNaN(date.getTime()) || Number.isNaN(rawDistance) || rawDistance <= 0) {
      skippedInvalid += 1;
      return;
    }

    rawRows.push({
      id: getField(row, headerIndex, ['activity id']) || `import-${i}`,
      name: getField(row, headerIndex, ['activity name']) || 'Imported Run',
      date,
      rawDistance,
      movingTime: Number.isNaN(movingTime) ? elapsedTime || 0 : movingTime,
      elapsedTime: Number.isNaN(elapsedTime) ? movingTime || 0 : elapsedTime,
      elevationGainRaw: parseFloat(getField(row, headerIndex, ['elevation gain'])) || 0,
      avgHeartrate: parseFloat(getField(row, headerIndex, ['average heart rate'])) || null,
      maxHeartrate: parseFloat(getField(row, headerIndex, ['max heart rate'])) || null,
      sufferScore:
        parseFloat(getField(row, headerIndex, ['relative effort', 'perceived relative effort', 'perceived exertion'])) ||
        null,
      cadence: parseFloat(getField(row, headerIndex, ['average cadence'])) || null,
    });
  });

  if (!rawRows.length) {
    throw new Error('No valid run activities found in this file');
  }

  const distanceUnit = chooseDistanceUnit(rawRows);
  const isMiles = distanceUnit.metersPerUnit === 1609.34;

  const runs = rawRows
    .map((r) => {
      const distance = r.rawDistance * distanceUnit.metersPerUnit;
      const elevationGain = isMiles ? r.elevationGainRaw * 0.3048 : r.elevationGainRaw;
      return {
        id: String(r.id),
        name: r.name,
        startDate: r.date.toISOString(),
        distance,
        movingTime: r.movingTime,
        elapsedTime: r.elapsedTime,
        elevationGain,
        avgHeartrate: r.avgHeartrate,
        maxHeartrate: r.maxHeartrate,
        sufferScore: r.sufferScore,
        avgSpeed: r.movingTime > 0 ? distance / r.movingTime : 0,
        cadence: r.cadence,
        category: classifyActivity({ name: r.name, distance }),
        source: 'import',
      };
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  return {
    runs,
    detectedUnit: isMiles ? 'mi' : 'km',
    unitConfident: distanceUnit.confident,
    importedCount: runs.length,
    skippedNonRun,
    skippedInvalid,
    dateRange:
      runs.length > 0
        ? { from: runs[0].startDate.slice(0, 10), to: runs[runs.length - 1].startDate.slice(0, 10) }
        : null,
  };
}

module.exports = { parseStravaExport };
