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

## Alternative: import a Strava data export (no API app needed)

If you don't want to set up a Strava API application, you can instead
download your full account archive and import it directly:

1. In Strava, go to **Settings → My Account → Download or Delete Your
   Account → Request Your Archive**.
2. Strava emails you a link once it's ready (minutes to ~24 hours). Download
   the resulting `.zip`.
3. On the dashboard's connect screen (or the "Import a Strava data export"
   card once you're in), upload the `.zip` — or just `activities.csv` if
   you've already extracted it.

The importer reads `activities.csv`, keeps only runs, and merges them with
any live-connected data (de-duplicated by activity ID). Distance units in
that file are inconsistent across Strava's export versions, so the importer
auto-detects meters vs. km vs. miles by checking which interpretation
produces plausible running paces across your file — the upload response
tells you which unit it picked. Imported data is stored in
`backend/src/data/imports.json` (gitignored); clear it any time with the
**Clear imported data** button.
