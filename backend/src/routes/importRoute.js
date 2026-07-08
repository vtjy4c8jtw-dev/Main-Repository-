const express = require('express');
const multer = require('multer');
const importStore = require('../lib/importStore');
const { parseStravaExport } = require('../services/importService');
const { invalidateCache } = require('../services/activityService');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // export zips can be large (GPX files)
});

router.get('/', (req, res) => {
  const data = importStore.read();
  if (!data) return res.json({ imported: false });
  res.json({
    imported: true,
    count: data.runs.length,
    detectedUnit: data.detectedUnit,
    unitConfident: data.unitConfident,
    dateRange: data.dateRange,
    importedAt: data.importedAt,
  });
});

router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = parseStravaExport(req.file.buffer, req.file.originalname);
    importStore.write({ ...result, importedAt: new Date().toISOString() });
    invalidateCache();
    res.json({
      imported: true,
      count: result.importedCount,
      detectedUnit: result.detectedUnit,
      unitConfident: result.unitConfident,
      dateRange: result.dateRange,
      skippedNonRun: result.skippedNonRun,
      skippedInvalid: result.skippedInvalid,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/', (req, res) => {
  importStore.clear();
  invalidateCache();
  res.json({ ok: true });
});

module.exports = router;
