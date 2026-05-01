/* Castford Pricing Auth v2 — castford-pricing-auth.js
   Wires every [data-checkout-plan] button on /pricing.

   Behavior:
   - Signed-in user with org → POST /functions/v1/create-checkout with
     { plan, interval } → redirect to returned Stripe URL.
   - Signed-in user with NO org (rare) → /signup?next=checkout&... so the
     wizard finishes onboard before checkout.
   - Anonymous user → /signup?next=checkout&plan=X&interval=Y so the wizard
     runs and metadata.org_id ends up on the Stripe session. No more
     orphan-payment loophole from buy.stripe.com Payment Links.

   Also shows a small "Signed in as ..." badge on the page so logged-in
   users know they don't need to re-authenticate.

   Loads: castford-pricing-auth.js (after Supabase JS CDN, after the
   page's setBilling() inline script that sets window.__cfBilling).
*/
(function() {
  'use strict';

  var SB_URL = 'https://crecesswagluelvkesul.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTI5NzYsImV4cCI6MjA4OTM4ODk3Nn0.IGEEYDStt-eH9Mf2G_DzqCPfruDjN8m_ORtAcmtSAZg';

  // Read the current monthly/annual selection. Falls back to annual (matches
  // pricing.html default) if the page hasn't initialized yet.
  function currentInterval() {
    var b = window.__cfBilling;
    return b === 'monthly' ? 'monthly' : 'annual';
  }

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset._origText = btn.textContent;
      btn.textContent = 'Loading…';
      btn.disabled = true;
    } else {
      if (btn.dataset._origText) btn.textContent = btn.dataset._origText;
      btn.disabled = false;
    }
  }

  function showSignedInBadge(email) {
    if (!email) return;
    if (document.getElementById('cf-pricing-badge')) return;
    var n = document.createElement('div');
    n.id = 'cf-pricing-badge';
    n.style.cssText = 'position:fixed;bottom:18px;left:18px;background:#0B0E1A;color:#fff;font-family:DM Sans,sans-serif;font-size:12px;padding:8px 14px;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,0.15);z-index:99;display:flex;align-items:center;gap:8px;';
    n.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#4ADE80;display:inline-block"></span> Signed in as <strong style="font-weight:600">' + email + '</strong>';
    document.body.appendChild(n);
  }

  // Build the /signup deep link with current selection so the wizard
  // pre-fills + uses correct copy.
  function signupRedirect(plan, interval) {
    var qs = 'next=checkout&plan=' + encodeURIComponent(plan) + '&interval=' + encodeURIComponent(interval);
    window.location.href = '/signup?' + qs;
  }

  // Authenticated path: ask the edge function for a checkout URL, redirect.
  async function startCheckout(session, plan, interval, btn) {
    try {
      var r = await fetch(SB_URL + '/functions/v1/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
          'apikey': SB_KEY
        },
        body: JSON.stringify({ plan: plan, interval: interval })
      });
      var d = await r.json();
      if (r.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      console.error('[pricing-auth] create-checkout failed:', d);
      setBtnLoading(btn, false);
      // If it's an auth/org issue, fall through to wizard so the user
      // can complete whatever step is missing.
      if (r.status === 401 || r.status === 404 || /no.*org/i.test(d.error || '')) {
        signupRedirect(plan, interval);
        return;
      }
      alert('Checkout could not start. ' + (d.error || d.detail || 'Please try again or contact support.'));
    } catch (err) {
      console.error('[pricing-auth] create-checkout network error:', err);
      setBtnLoading(btn, false);
      alert('Network error reaching checkout. Please try again.');
    }
  }

  async function handleClick(e) {
    var btn = e.currentTarget;
    var plan = btn.getAttribute('data-checkout-plan');
    if (!plan) return;
    var interval = currentInterval();
    e.preventDefault();
    setBtnLoading(btn, true);

    if (!window.supabase) {
      // Supabase CDN didn't load — fall back to wizard so the user isn't stuck
      console.warn('[pricing-auth] Supabase CDN missing; routing through /signup');
      signupRedirect(plan, interval);
      return;
    }

    var sb = window.supabase.createClient(SB_URL, SB_KEY);
    var sessRes;
    try { sessRes = await sb.auth.getSession(); } catch (_) { sessRes = { data: {} }; }
    var session = sessRes && sessRes.data ? sessRes.data.session : null;

    if (!session) {
      // Anonymous → /signup wizard with plan pre-fill
      signupRedirect(plan, interval);
      return;
    }

    // Signed-in: must have an org for checkout to set metadata.org_id correctly.
    // verify-session is idempotent and provisions an org if missing.
    var hasOrg = false;
    try {
      var vr = await fetch(SB_URL + '/functions/v1/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token }
      });
      if (vr.ok) {
        var vd = await vr.json();
        hasOrg = !!(vd && vd.org && vd.org.id);
      }
    } catch (_) {}

    if (!hasOrg) {
      // Has session but no org row yet — route through wizard step 2 to
      // collect company info before the Stripe handoff.
      signupRedirect(plan, interval);
      return;
    }

    await startCheckout(session, plan, interval, btn);
  }

  function wireButtons() {
    var btns = document.querySelectorAll('[data-checkout-plan]');
    btns.forEach(function(b) { b.addEventListener('click', handleClick); });
  }

  async function showBadgeIfSignedIn() {
    if (!window.supabase) return;
    try {
      var sb = window.supabase.createClient(SB_URL, SB_KEY);
      var r = await sb.auth.getSession();
      var session = r && r.data ? r.data.session : null;
      if (session && session.user && session.user.email) {
        showSignedInBadge(session.user.email);
      }
    } catch (_) {}
  }

  function init() {
    wireButtons();
    showBadgeIfSignedIn();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
