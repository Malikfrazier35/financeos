#!/usr/bin/env python3
"""
Castford CFO Command Center v1 — Deployment Patcher
===================================================

What this does:
  1. Copies new files into place (migration, edge fn, brain, logout page, middleware).
  2. Patches verify-session edge fn to return dashboard_role.
  3. Patches login.html to do role-based redirect instead of hardcoded RD.
  4. Patches cfo.html to swap dashboard-brain.js + dashboard-chart-brain.js for cfo-command-brain.js.
  5. Creates backups (.bak-phase1) for clean rollback.

Run from ~/Desktop/Castford after unzipping this bundle:
    python3 cfo-v1-patcher.py

Idempotent — safe to re-run.
"""

import glob
import os
import re
import shutil
import sys

ROOT = os.path.abspath(os.path.dirname(__file__))

def log(msg):
    print(msg)

def assert_in_castford_root():
    markers = ['middleware.js', 'package.json', 'public/site']
    missing = [m for m in markers if not os.path.exists(os.path.join(ROOT, m))]
    if missing:
        sys.exit(f"❌ Not in Castford repo root. Missing: {missing}")

def backup_once(path):
    bak = path + '.bak-phase1'
    if os.path.exists(path) and not os.path.exists(bak):
        shutil.copy2(path, bak)
        log(f"  backup → {os.path.relpath(bak, ROOT)}")

def patch_file(path, old, new, label):
    if not os.path.exists(path):
        log(f"⚠ Skipped {label}: file missing")
        return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if new in content:
        log(f"• {label}: already patched")
        return False
    if old not in content:
        log(f"⚠ {label}: pattern not found — manual review needed")
        return False
    backup_once(path)
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    log(f"✓ {label}")
    return True

assert_in_castford_root()
log("▸ Castford CFO Command Center v1 patcher")
log(f"  repo: {ROOT}\n")

# ── Step 1: Verify new files are in place ──
REQUIRED = [
    'supabase/migrations/20260422_add_dashboard_role.sql',
    'supabase/functions/cfo-command-center/index.ts',
    'public/site/cfo-command-brain.js',
    'public/site/logout.html',
    'middleware.js',
]
missing = [p for p in REQUIRED if not os.path.exists(os.path.join(ROOT, p))]
if missing:
    sys.exit(f"❌ Missing new files (did you unzip the bundle in the repo root?):\n  " + "\n  ".join(missing))
log("✓ All new files present\n")

# ── Step 2: Patch verify-session to include dashboard_role ──
log("▸ Patching verify-session edge function")
vs_path = os.path.join(ROOT, 'supabase/functions/verify-session/index.ts')

# Add dashboard_role to the users select
patch_file(
    vs_path,
    ".from('users').select('id, org_id, role, full_name').eq('id', user.id).maybeSingle()",
    ".from('users').select('id, org_id, role, full_name, dashboard_role').eq('id', user.id).maybeSingle()",
    "verify-session: added dashboard_role to SELECT",
)

# Add dashboard_role to the returned user object
patch_file(
    vs_path,
    "user: { id: existingUser.id, name: existingUser.full_name, role: existingUser.role },",
    "user: { id: existingUser.id, name: existingUser.full_name, role: existingUser.role, dashboard_role: existingUser.dashboard_role || 'standard' },",
    "verify-session: return dashboard_role in payload",
)

log("")

# ── Step 3: Patch login.html to do role-based redirect ──
log("▸ Patching login.html for role-based redirect")
login_path = os.path.join(ROOT, 'public/site/login.html')

if os.path.exists(login_path):
    with open(login_path, 'r', encoding='utf-8') as f:
        login = f.read()

    # Inject goToUserHome() function + replace window.location.href=RD callers
    # We find the RD declaration (const/let/var RD = '...';) and inject our resolver immediately after.

    rd_match = re.search(r"(const|let|var)\s+RD\s*=\s*['\"]([^'\"]+)['\"]\s*;?", login)
    if rd_match and 'goToUserHome' not in login:
        backup_once(login_path)
        rd_fallback = rd_match.group(2)
        resolver = (
            "\n// ── CFO v1: role-based redirect resolver ──\n"
            "async function goToUserHome(fallback){\n"
            "  fallback = fallback || '" + rd_fallback + "';\n"
            "  try {\n"
            "    const {data:{session}} = await sb.auth.getSession();\n"
            "    if (!session) { window.location.href = fallback; return; }\n"
            "    const resp = await fetch('https://crecesswagluelvkesul.supabase.co/functions/v1/verify-session', {\n"
            "      method: 'POST',\n"
            "      headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }\n"
            "    });\n"
            "    if (!resp.ok) { window.location.href = fallback; return; }\n"
            "    const d = await resp.json();\n"
            "    const role = (d.user && d.user.dashboard_role) || 'standard';\n"
            "    window.location.href = '/' + role;\n"
            "  } catch(e) { window.location.href = fallback; }\n"
            "}\n"
        )
        # Insert resolver right after the RD declaration
        login = login.replace(rd_match.group(0), rd_match.group(0) + resolver)

        # Replace the 3 redirect callers that use RD directly
        redirects = [
            ("if(session)window.location.href=RD",            "if(session)goToUserHome(RD)"),
            ("}else{window.location.href=RD}",                 "}else{goToUserHome(RD)}"),
            ("window.location.href=RD;",                       "goToUserHome(RD);"),
            ("window.location.href=RD}",                       "goToUserHome(RD)}"),
        ]
        replaced = 0
        for old, new in redirects:
            if old in login:
                login = login.replace(old, new)
                replaced += 1

        with open(login_path, 'w', encoding='utf-8') as f:
            f.write(login)
        log(f"✓ login.html: injected goToUserHome() + replaced {replaced} redirect call(s)")
    elif 'goToUserHome' in login:
        log("• login.html: already patched")
    else:
        log("⚠ login.html: RD constant not found — manual review needed")
else:
    log("⚠ login.html: file missing")

log("")

# ── Step 4: Patch cfo.html to swap brain scripts ──
log("▸ Patching cfo.html to use cfo-command-brain")

for cfo_path in [
    os.path.join(ROOT, 'public/site/dashboard/cfo.html'),
    os.path.join(ROOT, 'public/site/dashboard/cfo-light.html'),
]:
    if not os.path.exists(cfo_path):
        continue
    with open(cfo_path, 'r', encoding='utf-8') as f:
        html = f.read()

    already = 'cfo-command-brain.js' in html
    changed = False

    if not already:
        backup_once(cfo_path)
        # Remove generic brain scripts
        for tag in [
            '<script src="/site/dashboard-brain.js"></script>',
            '<script src="/site/dashboard-chart-brain.js"></script>',
            '<script src="/site/castford-charts.js"></script>',
        ]:
            if tag in html:
                html = html.replace(tag + '\n', '')
                html = html.replace(tag, '')
                changed = True

        # Inject command brain before </head>
        cfo_tag = '<script src="/site/cfo-command-brain.js"></script>'
        if '</head>' in html:
            html = html.replace('</head>', cfo_tag + '\n</head>', 1)
            changed = True

    if changed:
        with open(cfo_path, 'w', encoding='utf-8') as f:
            f.write(html)
        log(f"✓ {os.path.relpath(cfo_path, ROOT)}: swapped brains")
    elif already:
        log(f"• {os.path.relpath(cfo_path, ROOT)}: already patched")

log("")

# ── Summary ──
log("=" * 62)
log("CFO COMMAND CENTER v1 DEPLOYED LOCALLY.")
log("")
log("NEXT STEPS:")
log("")
log("  1. Apply the DB migration:")
log("     supabase db push --project-ref crecesswagluelvkesul")
log("     (or paste the SQL from supabase/migrations/20260422_add_dashboard_role.sql)")
log("")
log("  2. Deploy the new edge function:")
log("     supabase functions deploy cfo-command-center \\")
log("       --no-verify-jwt --project-ref crecesswagluelvkesul")
log("")
log("  3. Redeploy verify-session (it was patched):")
log("     supabase functions deploy verify-session \\")
log("       --no-verify-jwt --project-ref crecesswagluelvkesul")
log("")
log("  4. Commit and push:")
log("     git checkout -b cfo-command-center-v1")
log("     git add -A")
log("     git commit -m 'CFO Command Center v1: dedicated route, edge fn, brain, role routing'")
log("     git push origin cfo-command-center-v1")
log("")
log("  5. Merge PR, then visit https://castford.com/cfo while logged in.")
log("=" * 62)
