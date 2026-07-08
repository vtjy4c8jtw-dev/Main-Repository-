# Deploying to Replit

The app is set up to run as a single service: the backend builds and serves
the React frontend itself (same origin), so there's only one thing to deploy
and one URL. This matters because Replit's cheaper **Autoscale** deployment
type is stateless between instances — this app keeps your Strava connection
and imported data in local files, so it needs **Reserved VM**, which keeps a
persistent disk.

## 1. Import the project

1. In Replit, **Create App → Import from GitHub**.
2. Point it at this repo and the `claude/strava-running-dashboard-52y22o`
   branch (or whichever branch you're using).
3. Replit should pick up the included `.replit` file automatically. If it
   doesn't detect it as a Node.js project, that's fine — the manual settings
   below take precedence anyway.

## 2. Set Secrets (never commit these)

In the Replit workspace, open **Tools → Secrets** and add:

| Key | Value |
|---|---|
| `STRAVA_CLIENT_ID` | from your Strava API app (strava.com/settings/api) |
| `STRAVA_CLIENT_SECRET` | from your Strava API app |
| `STRAVA_REDIRECT_URI` | `https://<your-repl-name>.<your-username>.repl.co/api/auth/callback` (or your custom domain) |
| `FRONTEND_URL` | `https://<your-repl-name>.<your-username>.repl.co` (same host, no path) |

You won't know the exact `.repl.co` URL until after the first deploy — deploy
once, note the URL Replit gives you, then come back and fill these in (a
redeploy picks up the new Secrets).

## 3. Deploy

1. Click **Deploy** in the top right.
2. Choose **Reserved VM** (not Autoscale) — this is the part that's easy to
   miss, and picking Autoscale will silently lose your Strava connection and
   imported data on every scale event.
3. If asked for build/run commands, set:
   - Build: `npm run build`
   - Run: `npm start`
4. Deploy. Replit gives you a public URL once it's live.

## 4. Connect your data

Visit the deployed URL and either:
- Click **Connect with Strava** (requires the Secrets from step 2 to be set
  correctly — the Strava app's Authorization Callback Domain must match your
  Replit domain), or
- Use **Import a Strava data export** to upload your archive directly — no
  Strava API app needed at all, if you'd rather skip step 2 entirely for now.

## Notes

- Your data (`backend/src/data/tokens.json`, `imports.json`, `plan.json`) is
  gitignored and lives only on the Reserved VM's disk — it is not part of
  the repo and won't survive deleting/recreating the Repl. There's no
  external database here by design (single-user personal app).
- If Replit's UI or `.replit` schema has changed since this was written and
  the file isn't picked up automatically, just set the Build/Run commands
  manually in the Deployment settings as shown in step 3 — that's the part
  that actually matters.
