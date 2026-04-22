#!/usr/bin/env python3
"""
Castford CFO Hub — Hardcode Cleanup Patcher
============================================

Replaces hardcoded demo values in cfo.html with "—" placeholders.
The brain will populate them with live data on load. If the brain fails,
"—" remains visible (visible failure mode, no misleading demo numbers).

Targets (from prior DOM dump):
  Line 238: Revenue $48.6M       → —
  Line 262: OpEx ($33.1M)        → —
  Line 271: Net Income $8.1M     → —
  Line 280: Cash Position $34.2M → —
  Line 292: Current cash $34.2M  → —
  Line 293: Runway 28 mo         → —

  Plus Board Deck file metadata (visual lies):
    "24 pages · 2.4 MB" → "Generated on demand"
    "18 slides · 8.1 MB" → "Latest financials"
    "6 tabs · 1.8 MB"   → "Includes all schedules"

Run from ~/Desktop/Castford:
    python3 cfo-cleanup-v2.py
"""
import os, sys, re

ROOT = os.path.abspath(os.path.dirname(__file__))
if not os.path.exists(os.path.join(ROOT, 'middleware.js')):
    sys.exit("❌ Not in Castford repo root")

CFO_HTML = os.path.join(ROOT, 'public/site/dashboard/cfo.html')
BRAIN_PATH = os.path.join(ROOT, 'public/site/cfo-command-brain.js')

if not os.path.exists(CFO_HTML):
    sys.exit(f"❌ Missing: {CFO_HTML}")
if not os.path.exists(BRAIN_PATH):
    sys.exit(f"❌ Missing: {BRAIN_PATH} (did the unzip work?)")

print("▸ Castford CFO Hub Hardcode Cleanup")
print(f"  repo: {ROOT}\n")

with open(CFO_HTML, 'r') as f:
    html = f.read()
original = html

# ─── Replacements ───
# Each tuple: (description, regex/string find, string replace)
replacements = [
    # P&L statement values
    ("Revenue $48.6M",
     r'(<span class="pl-val"[^>]*>)\$48\.6M(</span>)',
     r'\1—\2'),
    ("OpEx ($33.1M)",
     r'(<span class="pl-val"[^>]*>)\(\$33\.1M\)(</span>)',
     r'\1—\2'),
    ("Net Income $8.1M",
     r'(<span class="pl-val"[^>]*>)\$8\.1M(</span>)',
     r'\1—\2'),
    # Cash Position values
    ("Cash Position pill $34.2M",
     r'(<span class="panel-badge badge-green"[^>]*>)\$34\.2M(</span>)',
     r'\1—\2'),
    ("Current cash $34.2M",
     r'(<div class="cash-stat-val"[^>]*style="color:var\(--blue\)"[^>]*>)\$34\.2M(</div>)',
     r'\1—\2'),
    ("Runway 28 mo",
     r'(<div class="cash-stat-val"[^>]*style="color:var\(--green\)"[^>]*>)28 mo(</div>)',
     r'\1—\2'),
    # Board Deck file metadata (visual lies — these are fabricated sizes)
    ("Board Deck PDF metadata",
     r'<div class="export-size">24 pages\s*&middot;\s*2\.4 MB</div>',
     r'<div class="export-size">Generated on demand</div>'),
    ("Board Deck PPT metadata",
     r'<div class="export-size">18 slides\s*&middot;\s*8\.1 MB</div>',
     r'<div class="export-size">Latest financials</div>'),
    ("Board Deck XLS metadata",
     r'<div class="export-size">6 tabs\s*&middot;\s*1\.8 MB</div>',
     r'<div class="export-size">Includes all schedules</div>'),
    # Also handle if the "·" entity rendered differently
    ("Board Deck PDF (alt)",
     r'<div class="export-size">24 pages\s*·\s*2\.4 MB</div>',
     r'<div class="export-size">Generated on demand</div>'),
    ("Board Deck PPT (alt)",
     r'<div class="export-size">18 slides\s*·\s*8\.1 MB</div>',
     r'<div class="export-size">Latest financials</div>'),
    ("Board Deck XLS (alt)",
     r'<div class="export-size">6 tabs\s*·\s*1\.8 MB</div>',
     r'<div class="export-size">Includes all schedules</div>'),
]

found_count = 0
for desc, pat, rep in replacements:
    new_html, n = re.subn(pat, rep, html)
    if n > 0:
        html = new_html
        print(f"  ✓ {desc}: {n} replacement(s)")
        found_count += n
    else:
        print(f"  · {desc}: not found (may already be replaced)")

# ─── Write back ───
if html != original:
    with open(CFO_HTML, 'w') as f:
        f.write(html)
    print(f"\n✓ Wrote {CFO_HTML}")
    print(f"  Bytes: {len(original)} → {len(html)} ({len(html)-len(original):+d})")
else:
    print(f"\n  No changes to cfo.html — all values already cleaned (or selectors didn't match)")

print("")
print("=" * 64)
print("CLEANUP READY.")
print("")
print("1. Commit + push on a branch (PR required):")
print("   git checkout -b cfo-cleanup-v2")
print("   git add -A")
print("   git commit -m 'CFO cleanup: strip demo values, brain v5 with verbose logging'")
print("   git push origin cfo-cleanup-v2")
print("")
print("2. Open PR, merge on GitHub.")
print("")
print("3. Hard-refresh /cfo (Cmd+Shift+R) and check console for the new")
print("   verbose P&L trace. The output will look like:")
print("")
print('   [CFO brain v5] P&L trace:')
print('     [0] "Revenue" before="—" → REV → $55.4M')
print('     [1] "COGS" before="—" → COGS → ($X.XM)')
print('     [2] "Gross Profit" before="$41.2M" → GP → $XX.XM')
print('     [3] "Operating Expenses" before="—" → OPEX → ($XX.XM)')
print('     [4] "Net Income" before="—" → NET → $5.1M')
print("")
print("   If any row shows 'no-match' OR action shows but value is wrong,")
print("   we now have line-by-line evidence to fix it precisely.")
print("=" * 64)
