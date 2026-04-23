#!/usr/bin/env python3
"""
apply-pricing-update.py

Surgical updates for the new tier seat structure:
  Starter: 5 full / 5 viewer / 3 external
  Growth:  15 full / 25 viewer / 10 external (+$80/full, +$25/viewer overage)
  Business: 30 full / unlimited viewer / unlimited external (+$200/full overage)

Files modified:
  1. supabase/functions/_shared/auth.ts  — tier limit constants
  2. public/site/pricing.html            — 3 tier card seat blocks
  3. app/terms/page.jsx                  — pricing language

Run from repo root: python3 apply-pricing-update.py
"""

import os
import sys
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
if not os.path.isdir(os.path.join(ROOT, '.git')):
    print("ERROR: Run from Castford repo root", file=sys.stderr)
    sys.exit(1)

CHANGES = []

def patch_file(path, find, replace, description):
    """Replace `find` with `replace` in `path`. Errors if find isn't found."""
    full = os.path.join(ROOT, path)
    if not os.path.isfile(full):
        print(f"  ✗ {path}: file not found")
        return False
    with open(full) as f:
        content = f.read()
    if find not in content:
        print(f"  ✗ {path}: pattern not found — {description}")
        print(f"    Looking for: {repr(find[:80])}{'...' if len(find) > 80 else ''}")
        return False
    if replace in content and find != replace:
        # Already applied (idempotent check)
        print(f"  ⊙ {path}: {description} (already applied, skipped)")
        return True
    new_content = content.replace(find, replace, 1)
    with open(full, 'w') as f:
        f.write(new_content)
    CHANGES.append(path)
    print(f"  ✓ {path}: {description}")
    return True

print("═══════════════════════════════════════════════════════════════")
print("  Castford Pricing Update — Seat Structure v2")
print("═══════════════════════════════════════════════════════════════")
print()

# ─────────────────────────────────────────────────────────────────────
# 1. auth.ts — tier limit constants
# ─────────────────────────────────────────────────────────────────────
print("▸ Backend: tier limits in auth.ts")

patch_file(
    'supabase/functions/_shared/auth.ts',
    "const TIER_FULL_SEAT_LIMIT: Record<string, number> = { starter: 1, growth: 5, business: 15, enterprise: 9999 };",
    "const TIER_FULL_SEAT_LIMIT: Record<string, number> = { starter: 5, growth: 15, business: 30, enterprise: 9999 };",
    "TIER_FULL_SEAT_LIMIT 1/5/15 → 5/15/30"
)

patch_file(
    'supabase/functions/_shared/auth.ts',
    "const TIER_VIEWER_SEAT_LIMIT: Record<string, number> = { starter: 1, growth: 5, business: 25, enterprise: 9999 };",
    "const TIER_VIEWER_SEAT_LIMIT: Record<string, number> = { starter: 5, growth: 25, business: 9999, enterprise: 9999 };",
    "TIER_VIEWER_SEAT_LIMIT 1/5/25 → 5/25/unlimited"
)

patch_file(
    'supabase/functions/_shared/auth.ts',
    "const TIER_EXTERNAL_SEAT_LIMIT: Record<string, number> = { starter: 2, growth: 5, business: 15, enterprise: 9999 };",
    "const TIER_EXTERNAL_SEAT_LIMIT: Record<string, number> = { starter: 3, growth: 10, business: 9999, enterprise: 9999 };",
    "TIER_EXTERNAL_SEAT_LIMIT 2/5/15 → 3/10/unlimited"
)

print()

# ─────────────────────────────────────────────────────────────────────
# 2. pricing.html — insert seat blocks after each tier price
# ─────────────────────────────────────────────────────────────────────
print("▸ Public pricing page: tier card seat blocks")

# Common style (inline so we don't depend on existing CSS class names)
def seat_block(seats_full, seats_viewer, seats_external, overage_text, viewer_unlim=False, external_unlim=False):
    viewer_display = '∞' if viewer_unlim else str(seats_viewer)
    external_display = '∞' if external_unlim else str(seats_external)
    viewer_color = '#C4884A' if viewer_unlim else '#1a2332'
    external_color = '#C4884A' if external_unlim else '#1a2332'
    return f'''<div style="margin-top:18px;padding-top:16px;border-top:1px solid rgba(0,0,0,0.08)">
<div style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px">Seats included</div>
<div style="display:flex;flex-direction:column;gap:6px;font-size:13px;color:#475569">
<div><strong style="color:#1a2332;font-weight:600">{seats_full}</strong> full seats <span style="color:#94a3b8">· edit data, run reports, use AI</span></div>
<div><strong style="color:{viewer_color};font-weight:600">{viewer_display}</strong> view-only seats <span style="color:#94a3b8">· read-only access</span></div>
<div><strong style="color:{external_color};font-weight:600">{external_display}</strong> external observer seats <span style="color:#94a3b8">· board, auditors, fractional CFOs</span></div>
</div>
<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.04);font-size:11px;color:#94a3b8">{overage_text}</div>
</div>'''

# Anchor: the closing </div> of each .plan-price block
# We insert seat info AFTER each price block

# Starter ($499/$599)
patch_file(
    'public/site/pricing.html',
    '<div class="plan-price"><span class="dollar">$</span><span class="amount" data-monthly="599" data-annual="499">499</span><span class="per">/mo</span></div>',
    '<div class="plan-price"><span class="dollar">$</span><span class="amount" data-monthly="599" data-annual="499">499</span><span class="per">/mo</span></div>' +
    seat_block(5, 5, 3, 'Add view-only seats: $25/mo each'),
    "Insert Starter seat block (5 / 5 / 3)"
)

# Growth ($1,499/$1,799)
patch_file(
    'public/site/pricing.html',
    '<div class="plan-price"><span class="dollar">$</span><span class="amount" data-monthly="1799" data-annual="1499">1,499</span><span class="per">/mo</span></div>',
    '<div class="plan-price"><span class="dollar">$</span><span class="amount" data-monthly="1799" data-annual="1499">1,499</span><span class="per">/mo</span></div>' +
    seat_block(15, 25, 10, 'Add full seats: $80/mo · view-only: $25/mo'),
    "Insert Growth seat block (15 / 25 / 10)"
)

# Business ($3,999/$4,799) — viewer + external are UNLIMITED
patch_file(
    'public/site/pricing.html',
    '<div class="plan-price"><span class="dollar">$</span><span class="amount" data-monthly="4799" data-annual="3999">3,999</span><span class="per">/mo</span></div>',
    '<div class="plan-price"><span class="dollar">$</span><span class="amount" data-monthly="4799" data-annual="3999">3,999</span><span class="per">/mo</span></div>' +
    seat_block(30, None, None, 'Add full seats: $200/mo · view-only & external always free', viewer_unlim=True, external_unlim=True),
    "Insert Business seat block (30 / unlimited / unlimited)"
)

print()

# ─────────────────────────────────────────────────────────────────────
# 3. terms/page.jsx — pricing language
# ─────────────────────────────────────────────────────────────────────
print("▸ Terms of service: pricing language")

patch_file(
    'app/terms/page.jsx',
    "Starter ($599/month or $499/month billed annually), Growth ($1,799/month or $1,499/month billed annually), Business ($4,799/month or $3,999/month billed annually), and Enterprise (custom pricing).",
    "Starter (5 full + 5 view-only + 3 external observer seats, $599/month or $499/month billed annually), Growth (15 full + 25 view-only + 10 external observer seats, $1,799/month or $1,499/month billed annually), Business (30 full seats + unlimited view-only + unlimited external observer seats, $4,799/month or $3,999/month billed annually), and Enterprise (custom pricing). Additional full seats may be purchased on Growth at $80/month and on Business at $200/month. Additional view-only seats may be purchased on Starter and Growth at $25/month.",
    "Update legal pricing description with seat structure"
)

print()
print("═══════════════════════════════════════════════════════════════")
print(f"  {len(CHANGES)} files modified")
print("═══════════════════════════════════════════════════════════════")
for f in CHANGES:
    print(f"  {f}")
print()
print("Next steps:")
print()
print("  1. Review changes:")
print("     git diff")
print()
print("  2. Re-deploy edge functions that use auth.ts:")
print("     for fn in me dashboard-data org-invite org-invite-preview org-accept-invite \\")
print("              org-revoke-invite org-update-member org-remove-member set-active-org; do")
print("       supabase functions deploy $fn --no-verify-jwt --project-ref crecesswagluelvkesul")
print("     done")
print()
print("  3. Commit + push:")
print("     git checkout -b pricing-seat-structure-v2")
print("     git add -A")
print("     git commit -m 'Update pricing tier seat structure: 5/15/30 full + unlimited viewers/external on Business'")
print("     git push origin pricing-seat-structure-v2")
print()
print("  4. landing.html: see landing-snippet.html for manual placement")
