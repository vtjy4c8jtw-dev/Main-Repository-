const express = require('express');
const { getAuthorizeUrl, exchangeCodeForToken } = require('../services/stravaClient');
const tokenStore = require('../lib/tokenStore');
const importStore = require('../lib/importStore');
const { invalidateCache } = require('../services/activityService');

const router = express.Router();

function redirectUri(req) {
  return process.env.STRAVA_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/callback`;
}

router.get('/login', (req, res) => {
  res.redirect(getAuthorizeUrl(redirectUri(req)));
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  if (error) {
    return res.redirect(`${frontendUrl}?strava_error=${encodeURIComponent(error)}`);
  }
  try {
    await exchangeCodeForToken(code);
    invalidateCache();
    res.redirect(`${frontendUrl}?connected=1`);
  } catch (err) {
    res.redirect(`${frontendUrl}?strava_error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/status', (req, res) => {
  const tokens = tokenStore.read();
  const imported = importStore.read();
  res.json({ connected: Boolean(tokens), hasImportedData: Boolean(imported) });
});

router.post('/logout', (req, res) => {
  tokenStore.clear();
  invalidateCache();
  res.json({ ok: true });
});

module.exports = router;
