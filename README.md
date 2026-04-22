# CFO Command Center v1 — Phase 1 Deployment

## What ships

**New route: `/cfo`** with its own auth gate, edge function, and dedicated frontend brain.

**8 files changed across the stack:**

### Database
- `supabase/migrations/20260422_add_dashboard_role.sql` — new `users.dashboard_role` column (`cfo`, `ceo`, `controller`, `fpa`, `standard`, `cashflow`) with check constraint, index, and seed for `malik@vaultline.app`.

### Edge functions
- `supabase/functions/cfo-command-center/index.ts` (NEW) — single payload with KPIs, P&L breakdown, bars, cash bars, monthly trend, 3-month forecast, recent transactions, alerts, integration status. Role-gated (`cfo` or `owner`/`admin`).
- `supabase/functions/verify-session/index.ts` (PATCHED) — returns `dashboard_role` in the user object.

### Routes / middleware
- `middleware.js` (REPLACED) — adds route rewrites for `/cfo`, `/ceo`, `/controller`, `/fpa`, `/standard`, `/cashflow`, `/login`, `/signup`, `/logout`.

### Frontend
- `public/site/cfo-command-brain.js` (NEW) — dedicated orchestrator for cfo.html. Paints KPIs, P&L rows + sub-lines, bars, cash bars, alerts banner, sync indicator. Handles 403 by redirecting to user's actual dashboard_role route.
- `public/site/logout.html` (NEW) — explicit logout page. Supabase signOut + nuke localStorage/sessionStorage/auth cookies + hard redirect to `/login`.
- `public/site/login.html` (PATCHED) — after sign-in, calls `verify-session`, reads `dashboard_role`, redirects to `/{role}`.
- `public/site/dashboard/cfo.html` + `cfo-light.html` (PATCHED) — swap generic dashboard-brain + chart-brain for `cfo-command-brain.js`.

## What's NOT in this PR

- The other 5 command centers (ceo, controller, fpa, standard, cashflow) have route stubs in middleware but keep their current generic brain. Replicate the cfo pattern next session.
- `castford-auth.js` is untouched — the CFO brain handles its own role gate via the edge function's 403 response.

## Deploy

```bash
cd ~/Desktop/Castford
unzip -o ~/Downloads/cfo-command-center-v1.zip -d .
python3 cfo-v1-patcher.py

# Apply DB migration (two options)
# Option A — Supabase CLI:
supabase db push --project-ref crecesswagluelvkesul

# Option B — paste the SQL from the migration file into the Supabase SQL editor

# Deploy edge functions
supabase functions deploy cfo-command-center --no-verify-jwt --project-ref crecesswagluelvkesul
supabase functions deploy verify-session --no-verify-jwt --project-ref crecesswagluelvkesul

# Commit + push
git checkout -b cfo-command-center-v1
git add -A
git commit -m "CFO Command Center v1: dedicated route, edge fn, brain, role routing"
git push origin cfo-command-center-v1
```

## Verify

1. Log in. You should land on `/cfo` (since Malik is seeded as `dashboard_role=cfo`).
2. Open DevTools console on `/cfo`. Look for:
   ```
   [CFO brain] painted live dashboard { revenue: 55000000, alerts: 0, bars: {...} }
   ```
3. If you see a top-right "Live · synced 5m ago" green badge, the data pipeline is end-to-end.
4. If you see a warm-gold "Demo Data" badge, the API returned `demo_mode: true` — connect a GL integration to see live numbers.
5. Log out. You should land on `/login` and the back button should NOT return you to `/cfo`.
6. Manually navigate to `/cfo` without a session → you get bounced. Change your `dashboard_role` to `ceo` in Supabase and re-login → you get redirected to `/ceo` instead.

## Rollback

```bash
# Restore patched files
find . -name "*.bak-phase1" | while read bak; do
  mv "$bak" "${bak%.bak-phase1}"
done

# Remove new files
rm public/site/cfo-command-brain.js
rm public/site/logout.html
rm -rf supabase/functions/cfo-command-center
rm supabase/migrations/20260422_add_dashboard_role.sql

# Revert middleware (git checkout the original)
git checkout HEAD -- middleware.js

# In Supabase: drop the column
# ALTER TABLE users DROP COLUMN dashboard_role;
```
