# Strava API Setup

The dashboard authenticates with your own Strava account via OAuth. You need
a Strava API application to get a client ID/secret.

1. Log in to Strava and go to https://www.strava.com/settings/api
2. Create an application:
   - **Application Name**: anything, e.g. "Run Dashboard"
   - **Category**: Training
   - **Website**: `http://localhost:3000`
   - **Authorization Callback Domain**: `localhost`
3. Copy the **Client ID** and **Client Secret** shown on the application page.
4. Put them in your `.env` file at the repo root:
   ```
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   ```
5. Start the app and click **Connect with Strava** — you'll be redirected to
   Strava to authorize the `read`, `activity:read_all`, and
   `profile:read_all` scopes, then redirected back to the dashboard.

Tokens are stored locally in `backend/src/data/tokens.json` (gitignored) and
refreshed automatically when they expire. To disconnect, use the
**Disconnect** button in the dashboard header, which deletes the stored
tokens.
