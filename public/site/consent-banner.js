/* Castford Consent Banner v1
   GDPR Art 7 + CCPA compliant cookie consent
   Auto-injects on all pages via castford-shell.js or direct import
   Stores consent in localStorage + logs to Supabase consent_log */

(function(){
  'use strict';
  if (document.getElementById('cf-consent')) return;
  var stored = localStorage.getItem('cf-consent-v1');
  if (stored) return; // Already consented

  var banner = document.createElement('div');
  banner.id = 'cf-consent';
  banner.innerHTML = '<div style="max-width:680px;display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:280px">'
    +'<div style="font-weight:700;font-size:14px;margin-bottom:4px;color:var(--ink,#0C0E1A)">We respect your privacy</div>'
    +'<div style="font-size:13px;color:var(--t2,#4A4F6E);line-height:1.5">We use essential cookies to make Castford work. With your consent, we also use analytics cookies to improve our product. <a href="/privacy" style="color:var(--prime,#1A3F7A);text-decoration:underline">Privacy Policy</a> · <a href="/privacy#ccpa" style="color:var(--prime,#1A3F7A);text-decoration:underline">Do Not Sell My Info</a></div>'
    +'</div>'
    +'<div style="display:flex;gap:8px;flex-shrink:0;align-items:center">'
    +'<button id="cf-consent-reject" style="padding:8px 16px;border:1px solid var(--bdr,#ddd);background:var(--s1,#fff);color:var(--ink,#0C0E1A);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Essential Only</button>'
    +'<button id="cf-consent-accept" style="padding:8px 16px;border:none;background:var(--prime,#1A3F7A);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">Accept All</button>'
    +'</div></div>';

  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:var(--s1,#fff);border-top:1px solid var(--bdr,#e5e7eb);padding:16px 24px;display:flex;justify-content:center;box-shadow:0 -4px 20px rgba(0,0,0,0.08);font-family:var(--b,"DM Sans",sans-serif)';

  document.body.appendChild(banner);

  function saveConsent(level) {
    var data = { level: level, timestamp: new Date().toISOString(), version: 'v1' };
    localStorage.setItem('cf-consent-v1', JSON.stringify(data));
    banner.style.display = 'none';

    // Log to Supabase if authenticated
    try {
      if (window.supabase) {
        var sb = window.supabase.createClient(
          'https://crecesswagluelvkesul.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTI5NzYsImV4cCI6MjA4OTM4ODk3Nn0.IGEEYDStt-eH9Mf2G_DzqCPfruDjN8m_ORtAcmtSAZg'
        );
        sb.auth.getSession().then(function(res) {
          var userId = res.data?.session?.user?.id;
          if (userId) {
            var types = level === 'all' ? ['essential','analytics','ai_processing'] : ['essential'];
            types.forEach(function(t) {
              sb.from('consent_log').insert({
                user_id: userId, consent_type: t, granted: true, 
                policy_version: '2026-04-07',
                user_agent: navigator.userAgent
              }).catch(function(){});
            });
            if (level === 'essential') {
              sb.from('consent_log').insert({
                user_id: userId, consent_type: 'analytics', granted: false,
                policy_version: '2026-04-07',
                user_agent: navigator.userAgent
              }).catch(function(){});
            }
          }
        });
      }
    } catch(e) {}

    // Disable GA4 if essential only
    if (level === 'essential') {
      window['ga-disable-G-HWFEGEPQ9C'] = true;
    }
  }

  document.getElementById('cf-consent-accept').addEventListener('click', function() { saveConsent('all'); });
  document.getElementById('cf-consent-reject').addEventListener('click', function() { saveConsent('essential'); });
})();
