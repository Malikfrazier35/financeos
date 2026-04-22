#!/usr/bin/env python3
"""
Castford CFO Phase 2B Deployment Patcher
=========================================

Ships:
  - Edge fn v3: TTM-based hub math, ?period for PNL, 13-week + CCC for cash,
    attribution + commentary for budget, drivers + scenarios + CIs for forecast
  - 4 updated subpage HTMLs (CSP fix: unpkg → jsdelivr, plus new UI controls)
  - 4 updated brains (depth + scenario/period interaction)

Run from ~/Desktop/Castford:
    python3 cfo-phase2b-patcher.py
"""
import os, sys

ROOT = os.path.abspath(os.path.dirname(__file__))

if not os.path.exists(os.path.join(ROOT, 'middleware.js')):
    sys.exit("❌ Not in Castford repo root")

REQUIRED = [
    'supabase/functions/cfo-command-center/index.ts',
    'public/site/cfo-pnl-brain.js',
    'public/site/cfo-cash-brain.js',
    'public/site/cfo-budget-brain.js',
    'public/site/cfo-forecast-brain.js',
    'public/site/dashboard/cfo/pnl.html',
    'public/site/dashboard/cfo/cash.html',
    'public/site/dashboard/cfo/budget.html',
    'public/site/dashboard/cfo/forecast.html',
]

print("▸ Castford CFO Phase 2B patcher")
print(f"  repo: {ROOT}\n")

missing = [p for p in REQUIRED if not os.path.exists(os.path.join(ROOT, p))]
if missing:
    sys.exit(f"❌ Missing files (did the unzip work?):\n  " + "\n  ".join(missing))

print("✓ All Phase 2B files in place\n")
print("=" * 62)
print("PHASE 2B READY TO SHIP.")
print("")
print("1. Redeploy the edge function (v3):")
print("   supabase functions deploy cfo-command-center \\")
print("     --no-verify-jwt --project-ref crecesswagluelvkesul")
print("")
print("2. Commit + push on a branch (PR required):")
print("   git checkout -b cfo-phase-2b")
print("   git add -A")
print("   git commit -m 'CFO Phase 2B: TTM math, drivers, scenarios, CCC, common-size, attribution'")
print("   git push origin cfo-phase-2b")
print("")
print("3. Open PR, merge on GitHub.")
print("")
print("4. Verify each subpage:")
print("   /cfo            → Hub with TTM-corrected YoY (no more -100%)")
print("   /cfo/pnl        → Period toggle (MTD/QTD/YTD/TTM/All), common-size checkbox")
print("   /cfo/cash       → CCC card, 13-week forecast chart")
print("   /cfo/budget     → Variance commentary + top-5 drivers")
print("   /cfo/forecast   → Scenario buttons, driver inputs, CI bands")
print("=" * 62)
