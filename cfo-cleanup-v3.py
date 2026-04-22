#!/usr/bin/env python3
"""
Castford CFO Hub — Comprehensive Cleanup v3
============================================

Goals:
  1. Strip ALL remaining hardcoded demo values from cfo.html (generic patterns,
     not value-specific — catches $7.4M COGS and $41.2M Gross Profit that v2 missed)
  2. Rename "Financial Command Center" → "The Hub" (enterprise energy)
  3. Update <title> to match

Generic patterns:
  - Any <span class="pl-val">VALUE</span>           → "—"
  - Any <div class="cash-stat-val">VALUE</div>      → "—"
  - Any <span class="panel-badge badge-green">$X</span> → "—" (only the dynamic one)

Run from ~/Desktop/Castford:
    python3 cfo-cleanup-v3.py
"""
import os, sys, re

ROOT = os.path.abspath(os.path.dirname(__file__))
if not os.path.exists(os.path.join(ROOT, 'middleware.js')):
    sys.exit("❌ Not in Castford repo root")

CFO_HTML = os.path.join(ROOT, 'public/site/dashboard/cfo.html')
required_files = [
    'public/site/cfo-command-brain.js',
    'public/site/cfo-subpage-shell.js',
    'public/site/cfo-pnl-brain.js',
    'public/site/cfo-cash-brain.js',
    'public/site/cfo-budget-brain.js',
    'public/site/cfo-forecast-brain.js',
]
missing = [p for p in required_files if not os.path.exists(os.path.join(ROOT, p))]
if missing:
    sys.exit(f"❌ Missing files (did unzip work?):\n  " + "\n  ".join(missing))

if not os.path.exists(CFO_HTML):
    sys.exit(f"❌ Missing: {CFO_HTML}")

print("▸ Castford CFO Hub Comprehensive Cleanup v3")
print(f"  repo: {ROOT}\n")

with open(CFO_HTML, 'r') as f:
    html = f.read()
original = html

# ─── Comprehensive sweeps ───
sweeps = [
    # Sweep ALL pl-val contents to "—" — catches Revenue, COGS, GP, OpEx, NI regardless of value
    ("pl-val sweep",
     r'(<span class="pl-val"[^>]*>)[^<]*(</span>)',
     r'\1—\2'),

    # Sweep ALL cash-stat-val contents to "—"
    ("cash-stat-val sweep",
     r'(<div class="cash-stat-val"[^>]*>)[^<]*(</div>)',
     r'\1—\2'),

    # Sweep panel-badge badge-green (Cash Position pill) — only dynamic green badges
    ("badge-green sweep",
     r'(<span class="panel-badge badge-green"[^>]*>)\$[^<]*(</span>)',
     r'\1—\2'),
]

for desc, pat, rep in sweeps:
    new_html, n = re.subn(pat, rep, html)
    if n > 0:
        html = new_html
        print(f"  ✓ {desc}: {n} replacement(s)")
    else:
        print(f"  · {desc}: 0 matches (already cleaned)")

# ─── Title rename ───
title_replacements = [
    # Page H1 / heading
    ("Page heading: Financial Command Center → The Hub",
     r'Financial Command Center',
     r'The Hub'),
    # Subtitle (refined for enterprise energy)
    ("Subtitle refresh",
     r'Full P&L visibility with drill-down\s*[·•&middot;]\s*Real-time cash position\s*[·•&middot;]\s*One-click board deck',
     r'Castford executive command center'),
    # Browser tab title
    ("Browser tab: CFO Dashboard → The Hub",
     r'<title>([^<]*)CFO Dashboard([^<]*)</title>',
     r'<title>\1The Hub\2</title>'),
]

for desc, pat, rep in title_replacements:
    new_html, n = re.subn(pat, rep, html)
    if n > 0:
        html = new_html
        print(f"  ✓ {desc}: {n} match(es)")
    else:
        print(f"  · {desc}: not matched")

# ─── Write back ───
if html != original:
    with open(CFO_HTML, 'w') as f:
        f.write(html)
    print(f"\n✓ Wrote {CFO_HTML}")
    print(f"  Bytes: {len(original)} → {len(html)} ({len(html)-len(original):+d})")
else:
    print(f"\n  No changes")

print("")
print("=" * 64)
print("CLEANUP v3 + UI/UX UPGRADE READY.")
print("")
print("1. Commit + push:")
print("   git checkout -b cfo-cleanup-v3-ux")
print("   git add -A")
print("   git commit -m 'Hub: full hardcode sweep, rename to The Hub, custom tooltips, subpage polish'")
print("   git push origin cfo-cleanup-v3-ux")
print("")
print("2. Open PR, merge.")
print("")
print("3. Hard-refresh /cfo (Cmd+Shift+R). Expect:")
print("   - 'The Hub' heading (replaces Financial Command Center)")
print("   - Subtitle: 'Castford executive command center'")
print("   - Browser tab: 'Castford — The Hub'")
print("   - All P&L rows live (no $7.4M, $41.2M, $8.1M demos remaining)")
print("   - Hover ANY chart bar (cash, weekly, monthly, variance, forecast)")
print("     → custom dark tooltip with detail")
print("   - Subpages now have quicknav widget too")
print("   - P&L/Budget table rows highlight on hover")
print("=" * 64)
