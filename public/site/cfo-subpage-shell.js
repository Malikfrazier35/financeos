/* Castford CFO Subpage Shell v1.2
 * Shared utilities for /cfo/{pnl,cash,budget,forecast}
 * v1.2: + window.CF.tooltip + injectQuicknav (matches hub experience)
 */
(function() {
  'use strict';

  var BASE = 'https://crecesswagluelvkesul.supabase.co/functions/v1';
  var SB_URL = 'https://crecesswagluelvkesul.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTU0NTAsImV4cCI6MjA3NjA5MTQ1MH0.h7nBkfmZHLbuzqJxhX6lgfRFWxgjYuxl5d2SbkRSaCk';

  var DENIM = '#5B7FCC';

  // ── Inject shared CSS ──
  if (!document.getElementById('cfo-subpage-css')) {
    var css = document.createElement('style');
    css.id = 'cfo-subpage-css';
    css.textContent = `
      :root { --denim: #5B7FCC; --gold: #C4884A; --rose: #EF4444; --green: #22C55E; --amber: #F59E0B; --cyan: #0EA5E9;
        --bg: #0a0e1a; --panel: rgba(15,23,42,0.6); --panel-border: rgba(91,127,204,0.15);
        --text-1: #e2e8f0; --text-2: #94a3b8; --text-3: #64748b; }
      body { background: var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Cpath fill='none' stroke='%235B7FCC' stroke-width='0.3' opacity='0.08' d='M20 0 L40 11.5 L40 23.5 L20 35 L0 23.5 L0 11.5 Z'/%3E%3C/svg%3E"); color: var(--text-1); font-family: 'Instrument Sans', -apple-system, sans-serif; margin: 0; min-height: 100vh; }
      .cfo-page { max-width: 1400px; margin: 0 auto; padding: 32px 40px 80px; }
      .cfo-title { font-family: 'Instrument Serif', serif; font-size: 36px; font-weight: 400; margin: 0 0 8px; color: var(--text-1); letter-spacing: -0.02em; }
      .cfo-subtitle { color: var(--text-3); font-size: 14px; margin: 0 0 32px; }
      .cfo-back { display: inline-flex; align-items: center; gap: 6px; color: var(--text-3); text-decoration: none; font-size: 12px; padding: 8px 14px; border: 1px solid var(--panel-border); border-radius: 2px; margin-bottom: 24px; transition: all 0.15s; font-weight: 500; }
      .cfo-back:hover { color: var(--denim); border-color: var(--denim); }
      .cfo-tabs { display: flex; gap: 2px; margin-bottom: 32px; border-bottom: 1px solid var(--panel-border); }
      .cfo-tab { padding: 12px 20px; color: var(--text-3); font-size: 13px; font-weight: 600; text-decoration: none; border-bottom: 2px solid transparent; transition: all 0.15s; letter-spacing: 0.04em; text-transform: uppercase; }
      .cfo-tab:hover { color: var(--text-1); }
      .cfo-tab.active { color: var(--denim); border-bottom-color: var(--denim); }
      .cfo-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
      .cfo-kpi-card { background: var(--panel); border: 1px solid var(--panel-border); border-radius: 2px; padding: 20px; transition: border-color 0.15s; }
      .cfo-kpi-card:hover { border-color: rgba(91,127,204,0.3); }
      .cfo-kpi-card .k-label { font-size: 10px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; font-weight: 600; }
      .cfo-kpi-card .k-value { font-family: 'Geist Mono', monospace; font-size: 28px; color: var(--text-1); font-weight: 600; letter-spacing: -0.02em; }
      .cfo-kpi-card .k-delta { display: inline-block; font-size: 10px; padding: 3px 8px; border-radius: 1px; font-weight: 600; margin-top: 8px; letter-spacing: 0.04em; }
      .cfo-panel { background: var(--panel); border: 1px solid var(--panel-border); border-radius: 2px; padding: 24px; margin-bottom: 24px; }
      .cfo-panel-title { font-size: 13px; color: var(--text-1); font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 16px; }
      .cfo-loading { color: var(--text-3); padding: 40px 0; text-align: center; font-size: 13px; }
      .cfo-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .cfo-table th { text-align: left; padding: 12px 8px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; border-bottom: 1px solid var(--panel-border); }
      .cfo-table td { padding: 10px 8px; border-bottom: 1px solid rgba(91,127,204,0.05); color: var(--text-1); transition: background 0.12s; }
      .cfo-table tbody tr:hover td { background: rgba(91,127,204,0.05); }
      .cfo-table .num { font-family: 'Geist Mono', monospace; text-align: right; }
      .cfo-table .section-row td { background: rgba(91,127,204,0.08); color: var(--denim); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; padding: 8px; }
      .cfo-table .total-row td { background: rgba(91,127,204,0.04); font-weight: 700; border-top: 1px solid var(--panel-border); }
      .cfo-bar-track { background: rgba(91,127,204,0.1); height: 6px; border-radius: 1px; overflow: hidden; }
      .cfo-bar-fill { height: 100%; background: var(--denim); border-radius: 1px; transition: width 0.6s ease; }
      .cfo-var-pos { color: var(--green); }
      .cfo-var-neg { color: var(--rose); }
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } .cfo-page { padding: 24px 20px 60px; } }
      .cfo-quicknav { animation: cfoFadeDown 0.5s ease-out; }
      @keyframes cfoFadeDown { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(css);
  }

  // ── Inject back button + tabs ──
  function injectShell() {
    var page = document.querySelector('.cfo-page');
    if (!page) return;
    var current = window.__CFO_PAGE || 'pnl';
    var tabsHtml =
      '<a href="/cfo" class="cfo-back">← Back to Hub</a>' +
      '<div class="cfo-tabs">' +
        '<a href="/cfo" class="cfo-tab' + (current==='hub'?' active':'') + '">Hub</a>' +
        '<a href="/cfo/pnl" class="cfo-tab' + (current==='pnl'?' active':'') + '">P&amp;L</a>' +
        '<a href="/cfo/cash" class="cfo-tab' + (current==='cash'?' active':'') + '">Cash</a>' +
        '<a href="/cfo/budget" class="cfo-tab' + (current==='budget'?' active':'') + '">Budget</a>' +
        '<a href="/cfo/forecast" class="cfo-tab' + (current==='forecast'?' active':'') + '">Forecast</a>' +
      '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = tabsHtml;
    page.insertBefore(wrap.children[0], page.firstChild);
    page.insertBefore(wrap.children[0], page.children[1]);
  }

  // ── Inject floating quicknav (matches hub) ──
  function injectQuicknav() {
    if (document.querySelector('.cfo-quicknav')) return;
    var nav = document.createElement('div');
    nav.className = 'cfo-quicknav';
    nav.style.cssText = ['position:fixed','top:24px','right:24px','display:flex','gap:4px',
      'background:rgba(15,23,42,0.85)','-webkit-backdrop-filter:blur(12px)','backdrop-filter:blur(12px)',
      'border:1px solid rgba(91,127,204,0.25)','border-radius:24px','padding:5px','z-index:9999',
      'font-family:Instrument Sans,-apple-system,sans-serif','box-shadow:0 8px 24px rgba(0,0,0,0.3)'].join(';');
    var path = window.location.pathname.replace(/\/$/, '') || '/cfo';
    var pages = [{url:'/cfo',label:'Hub'},{url:'/cfo/pnl',label:'P&L'},{url:'/cfo/cash',label:'Cash'},{url:'/cfo/budget',label:'Budget'},{url:'/cfo/forecast',label:'Forecast'}];
    pages.forEach(function(p) {
      var current = path === p.url;
      var btn = document.createElement('a');
      btn.href = p.url; btn.textContent = p.label;
      btn.style.cssText = ['padding:6px 14px','border-radius:18px','font-size:11px','font-weight:600',
        'letter-spacing:0.04em','text-decoration:none','transition:all 0.15s',
        'color:' + (current ? '#fff' : 'rgba(255,255,255,0.55)'),
        'background:' + (current ? DENIM : 'transparent')].join(';');
      if (!current) {
        btn.addEventListener('mouseenter', function() { btn.style.color = '#fff'; btn.style.background = 'rgba(91,127,204,0.2)'; });
        btn.addEventListener('mouseleave', function() { btn.style.color = 'rgba(255,255,255,0.55)'; btn.style.background = 'transparent'; });
      }
      nav.appendChild(btn);
    });
    document.body.appendChild(nav);
  }

  // ── Tooltip system (window.CF.tooltip) ──
  var Tooltip = (function() {
    var el = null;
    function ensure() {
      if (el) return el;
      el = document.createElement('div');
      el.className = 'cfo-tooltip';
      el.style.cssText = 'position:fixed;background:rgba(15,23,42,0.96);color:#fff;padding:10px 14px;border-radius:6px;font-size:12px;font-family:Instrument Sans,-apple-system,sans-serif;pointer-events:none;z-index:99999;opacity:0;transition:opacity 0.15s;border:1px solid rgba(91,127,204,0.3);box-shadow:0 6px 16px rgba(0,0,0,0.4);max-width:280px;line-height:1.5;display:none';
      document.body.appendChild(el);
      return el;
    }
    function show(target, html) {
      var t = ensure();
      t.innerHTML = html;
      t.style.display = 'block';
      t.style.opacity = '0';
      var rect = target.getBoundingClientRect();
      var tipRect = t.getBoundingClientRect();
      var top = rect.top - tipRect.height - 10;
      var left = rect.left + rect.width/2 - tipRect.width/2;
      if (top < 8) top = rect.bottom + 10;
      if (left < 8) left = 8;
      if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
      t.style.top = top + 'px'; t.style.left = left + 'px';
      requestAnimationFrame(function() { t.style.opacity = '1'; });
    }
    function hide() {
      if (el) { el.style.opacity = '0'; setTimeout(function() { if (el && el.style.opacity === '0') el.style.display = 'none'; }, 200); }
    }
    function attach(target, htmlOrFn) {
      if (target.dataset.cfoTipWired === 'true') return;
      target.dataset.cfoTipWired = 'true';
      target.addEventListener('mouseenter', function() { show(target, typeof htmlOrFn === 'function' ? htmlOrFn(target) : htmlOrFn); });
      target.addEventListener('mouseleave', hide);
    }
    return { show: show, hide: hide, attach: attach };
  })();

  // ── window.CF API ──
  window.CF = window.CF || {};
  window.CF.BASE = BASE;
  window.CF.tooltip = Tooltip;

  window.CF.fmt = function(v) {
    var n = Number(v) || 0; var a = Math.abs(n);
    if (a >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
    if (a >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
  };
  window.CF.pct = function(v) { var n = Number(v) || 0; return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'; };

  window.CF.getToken = async function() {
    try {
      if (window.supabase && window.supabase.createClient) {
        var c = window.supabase.createClient(SB_URL, SB_KEY);
        var s = await c.auth.getSession();
        if (s.data && s.data.session) return s.data.session.access_token;
      }
    } catch (e) {}
    try {
      if (window.__fos_session && window.__fos_session.access_token) return window.__fos_session.access_token;
      if (window.__fos_supabase) {
        var s2 = await window.__fos_supabase.auth.getSession();
        if (s2.data && s2.data.session) return s2.data.session.access_token;
      }
    } catch (e) {}
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && v.access_token) return v.access_token;
          if (v && v.currentSession && v.currentSession.access_token) return v.currentSession.access_token;
        }
      }
    } catch (e) {}
    return null;
  };

  window.CF.fetchView = async function(view, extraParams) {
    var token = await window.CF.getToken();
    if (!token) { window.location.href = '/login'; return null; }
    var qs = '?view=' + view + (extraParams || '');
    var resp = await fetch(BASE + '/cfo-command-center' + qs, {
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    });
    if (resp.status === 401 || resp.status === 403) { window.location.href = '/login'; return null; }
    if (!resp.ok) { console.error('[CF] fetchView', view, 'failed', resp.status); return null; }
    return await resp.json();
  };

  window.CF.buildSyncBadge = function(meta) {
    var existing = document.querySelector('.refresh-indicator');
    if (existing && meta) {
      existing.textContent = meta.demo_mode ? 'Demo data' :
        (meta.last_sync_at ? 'Synced ' + new Date(meta.last_sync_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : 'Live');
    }
  };

  // ── Boot ──
  function boot() {
    injectShell();
    injectQuicknav();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
