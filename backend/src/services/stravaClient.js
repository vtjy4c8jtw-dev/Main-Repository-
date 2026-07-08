const axios = require('axios');
const tokenStore = require('../lib/tokenStore');

const STRAVA_API = 'https://www.strava.com/api/v3';
const STRAVA_OAUTH = 'https://www.strava.com/oauth';

function getAuthorizeUrl(redirectUri) {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,profile:read_all',
  });
  return `${STRAVA_OAUTH}/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const { data } = await axios.post(`${STRAVA_OAUTH}/token`, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
  });
  tokenStore.write({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: data.athlete && data.athlete.id,
  });
  return data;
}

async function refreshAccessToken(tokens) {
  const { data } = await axios.post(`${STRAVA_OAUTH}/token`, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token',
  });
  const updated = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    athlete_id: tokens.athlete_id,
  };
  tokenStore.write(updated);
  return updated;
}

async function getValidTokens() {
  const tokens = tokenStore.read();
  if (!tokens) return null;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (tokens.expires_at - nowSeconds < 120) {
    return refreshAccessToken(tokens);
  }
  return tokens;
}

async function stravaGet(path, params = {}) {
  const tokens = await getValidTokens();
  if (!tokens) {
    const err = new Error('Not connected to Strava');
    err.code = 'NOT_CONNECTED';
    throw err;
  }
  const { data } = await axios.get(`${STRAVA_API}${path}`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    params,
  });
  return data;
}

module.exports = {
  getAuthorizeUrl,
  exchangeCodeForToken,
  getValidTokens,
  stravaGet,
};
