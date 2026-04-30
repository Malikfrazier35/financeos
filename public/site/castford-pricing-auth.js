/* Castford Pricing Auth v2 — castford-pricing-auth.js
 *
 * Auth-required checkout. Replaces v1 which used Stripe Payment Links
 * (buy.stripe.com/...) directly — that approach allowed unauthenticated
 * users to pay without ever creating a Castford account, which led to
 * orphaned Stripe customers (no organization to attach the subscription).
 *
 * v2 flow:
 *   1. User clicks any [data-checkout-plan="X"] button on /pricing
 *   2. If they have a session: POST to /functions/v1/create-checkout with
 *      { plan, interval } — get back a Stripe Checkout URL — redirect
 *   3. If no session: redirect to /signup?next=checkout&plan=X&interval=Y
 *      so they sign up FIRST. /signup.html handles the next=checkout
 *      branch and continues the flow after auth completes.
 *
 * Anonymous users can no longer skip signup. Webhook always has a real
 * org_id in metadata. No more orphans.
 */

(function () {
  'use strict';

  var SB_URL = 'https://crecesswagluelvkesul.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTI5NzYsImV4cCI6MjA4OTM4ODk3Nn0.IGEEYDStt-eH9Mf2G_DzqCPfruDjN8m_ORtAcmtSAZg';

  // Wait for Supabase JS, then wire button handlers
  function ready() {
    if (!window.supabase) {
      console.warn('[pricing-auth] Supabase JS not loaded yet — retrying');
      setTimeout(ready, 100);
      return;
    }
    var sb = window.supabase.createClient(SB_URL, SB_KEY);

    var buttons = document.querySelectorAll('[data-checkout-plan]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var plan = btn.getAttribute('data-checkout-plan');
        if (!plan) return;
        var interval = (window.currentBilling === 'monthly') ? 'monthly' : 'annual';
        handleClick(sb, btn, plan, interval);
      });
    });

    // Show signed-in indicator if applicable
    sb.auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (!session) return;
      showSignedInBadge(session.user.email);
    });
  }

  async function handleClick(sb, btn, plan, interval) {
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Loading…';

    try {
      var sessRes = await sb.auth.getSession();
      var session = sessRes.data && sessRes.data.session;

      if (!session) {
        // Anonymous: redirect to signup with deep-link params
        var qs = 'next=checkout&plan=' + encodeURIComponent(plan) + '&interval=' + encodeURIComponent(interval);
        window.location.href = '/signup?' + qs;
        return;
      }

      // Authenticated: call create-checkout edge function
      var resp = await fetch(SB_URL + '/functions/v1/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
          'apikey': SB_KEY
        },
        body: JSON.stringify({ plan: plan, interval: interval })
      });
      var data = await resp.json().catch(function () { return {}; });
      if (!resp.ok || !data.url) {
        console.error('[pricing-auth] create-checkout failed:', resp.status, data);
        btn.disabled = false;
        btn.textContent = originalText;
        alert('We couldn\'t start your checkout. ' + (data.error || data.detail || 'Please try again.'));
        return;
      }
      // Stripe handles the rest
      window.location.href = data.url;
    } catch (err) {
      console.error('[pricing-auth] handleClick error:', err);
      btn.disabled = false;
      btn.textContent = originalText;
      alert('Network error. Please try again.');
    }
  }

  function showSignedInBadge(email) {
    if (!email) return;
    if (document.getElementById('cf-pricing-signed-in')) return; // idempotent
    var badge = document.createElement('div');
    badge.id = 'cf-pricing-signed-in';
    badge.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:200;padding:8px 14px;' +
      'background:#0f172a;color:#fff;font:600 11.5px "DM Sans",sans-serif;display:flex;' +
      'align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);letter-spacing:0.01em';
    badge.innerHTML = '<span style="width:6px;height:6px;background:#10b981;border-radius:50%;flex-shrink:0"></span>' +
      'Signed in as ' + email;
    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }
})();
