/* Castford Dashboard Engine v2 — Visual Polish Pass
 *
 * Same architecture as v1. Same configs work unchanged.
 * Major upgrades:
 *   - Sticky brand header with org name + sync indicator
 *   - Larger, more confident page hero (Instrument Serif title)
 *   - KPI cards with gradient values + sparklines + refined deltas
 *   - Cash trend rendered as a REAL chart (Y-axis, gridlines, proper proportions)
 *   - Cash Position panel with hero treatment
 *   - Polished placeholder/empty states
 *   - Reveal animations (fade-in stagger on panel render)
 *   - Multi-layer background (solid + hex pattern + radial gradient)
 *   - Consistent denim/gold/cyan brand palette throughout
 */
(function(global) {
  'use strict';

  var BASE = 'https://crecesswagluelvkesul.supabase.co/functions/v1';
  var SB_URL = 'https://crecesswagluelvkesul.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTU0NTAsImV4cCI6MjA3NjA5MTQ1MH0.h7nBkfmZHLbuzqJxhX6lgfRFWxgjYuxl5d2SbkRSaCk';

  var COLORS = {
    denim: '#5B7FCC', denimDeep: '#4669B5', denimSoft: 'rgba(91,127,204,0.15)',
    gold: '#C4884A', goldSoft: 'rgba(196,136,74,0.15)',
    cyan: '#0EA5E9', rose: '#EF4444', green: '#22C55E', amber: '#F59E0B',
    bg: '#0a0e1a', bgLift: '#0f1729',
    panel: 'rgba(15,23,42,0.65)', panelBorder: 'rgba(91,127,204,0.18)',
    text1: '#e2e8f0', text2: '#94a3b8', text3: '#64748b',
  };

  // ───────────── UTILITIES ─────────────

  function normalizeLabel(raw) {
    return (raw || '').replace(/^[\s\W]+/, '').trim().toLowerCase();
  }

  function getValue(obj, path) {
    if (!path || !obj) return null;
    var parts = path.split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return null;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function formatValue(val, format) {
    if (val == null || val === undefined) return '—';
    var n = Number(val);
    switch (format) {
      case 'currency_short': {
        if (isNaN(n)) return '—';
        var a = Math.abs(n);
        if (a >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
        if (a >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
        if (a >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
        return '$' + n.toFixed(0);
      }
      case 'currency_short_or_profitable':
        return n === 0 ? 'Profitable' : formatValue(n, 'currency_short') + '/mo';
      case 'percent': return isNaN(n) ? '—' : n.toFixed(1) + '%';
      case 'percent_signed': return isNaN(n) ? '—' : (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
      case 'months': return val === null ? '∞' : Math.floor(n) + ' mo';
      case 'integer': return isNaN(n) ? '—' : Math.round(n).toLocaleString();
      case 'date_relative':
        if (!val) return 'Never';
        var d = new Date(val);
        var min = Math.floor((Date.now() - d.getTime()) / 60000);
        if (min < 1) return 'Just now';
        if (min < 60) return min + 'm ago';
        if (min < 1440) return Math.floor(min/60) + 'h ago';
        return Math.floor(min/1440) + 'd ago';
      default: return String(val);
    }
  }

  function colorForValue(val, logic) {
    var n = Number(val);
    if (logic === 'runway_urgency') {
      if (val == null) return COLORS.green;
      if (n < 6) return COLORS.rose;
      if (n < 12) return COLORS.amber;
      return COLORS.green;
    }
    if (logic === 'green_if_positive') return n >= 0 ? COLORS.green : COLORS.rose;
    if (logic === 'green_if_negative') return n <= 0 ? COLORS.green : COLORS.rose;
    return null;
  }

  // ───────────── AUTH ─────────────

  async function getToken() {
    try {
      if (global.supabase && global.supabase.createClient) {
        var c = global.supabase.createClient(SB_URL, SB_KEY);
        var s = await c.auth.getSession();
        if (s.data && s.data.session) return s.data.session.access_token;
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
  }

  // ───────────── TOOLTIP ─────────────

  var Tooltip = (function() {
    var el = null;
    function ensure() {
      if (el) return el;
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;background:rgba(15,23,42,0.96);color:#fff;padding:10px 14px;border-radius:6px;font-size:12px;font-family:Instrument Sans,-apple-system,sans-serif;pointer-events:none;z-index:99999;opacity:0;transition:opacity 0.15s;border:1px solid rgba(91,127,204,0.3);box-shadow:0 12px 28px rgba(0,0,0,0.5);max-width:300px;line-height:1.5;display:none;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)';
      document.body.appendChild(el);
      return el;
    }
    function show(target, html) {
      var t = ensure(); t.innerHTML = html; t.style.display = 'block'; t.style.opacity = '0';
      var rect = target.getBoundingClientRect(); var tr = t.getBoundingClientRect();
      var top = rect.top - tr.height - 10;
      var left = rect.left + rect.width/2 - tr.width/2;
      if (top < 8) top = rect.bottom + 10;
      if (left < 8) left = 8;
      if (left + tr.width > window.innerWidth - 8) left = window.innerWidth - tr.width - 8;
      t.style.top = top + 'px'; t.style.left = left + 'px';
      requestAnimationFrame(function() { t.style.opacity = '1'; });
    }
    function hide() {
      if (el) { el.style.opacity = '0'; setTimeout(function() { if (el && el.style.opacity === '0') el.style.display = 'none'; }, 200); }
    }
    function attach(target, html) {
      target.addEventListener('mouseenter', function() { show(target, typeof html === 'function' ? html(target) : html); });
      target.addEventListener('mouseleave', hide);
    }
    return { attach: attach, show: show, hide: hide };
  })();

  // ───────────── SPARKLINE ─────────────

  function renderSparkline(data, color, opts) {
    opts = opts || {};
    if (!data || !data.length) return '';
    var values = data.map(function(v) { return Number(v) || 0; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var range = max - min || 1;
    var w = 100, h = 28, n = data.length;
    var pulseLatest = opts.pulseLatest !== false;

    if (opts.style === 'bars') {
      var barW = w / n;
      var bars = '';
      for (var i = 0; i < n; i++) {
        var v = values[i];
        var bh = ((v - min) / range) * h * 0.85 + h * 0.1;
        var by = h - bh;
        var op = i === n - 1 ? 1 : (0.45 + 0.5 * (i / (n - 1))).toFixed(2);
        var pulseAttr = (pulseLatest && i === n - 1) ? ' class="eng-pulse"' : '';
        bars += '<rect' + pulseAttr + ' x="' + (i * barW + 0.5).toFixed(2) + '" y="' + by.toFixed(2) +
                '" width="' + (barW - 1).toFixed(2) + '" height="' + Math.max(0.5, bh).toFixed(2) +
                '" fill="' + color + '" opacity="' + op + '" rx="0.8"/>';
      }
      return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block">' + bars + '</svg>';
    }

    // Line + area
    var pts = values.map(function(v, i) {
      var x = (i / (n - 1)) * w;
      var y = h - ((v - min) / range) * h * 0.85 - h * 0.1;
      return x.toFixed(2) + ',' + y.toFixed(2);
    });
    var linePath = 'M ' + pts.join(' L ');
    var areaPath = linePath + ' L ' + w + ',' + h + ' L 0,' + h + ' Z';
    var lastX = ((n - 1) / (n - 1)) * w;
    var lastY = h - ((values[n-1] - min) / range) * h * 0.85 - h * 0.1;
    var gradId = 'spark-grad-' + Math.random().toString(36).slice(2, 8);
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block;overflow:visible">' +
      '<defs><linearGradient id="' + gradId + '" x1="0" x2="0" y1="0" y2="1">' +
        '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.4"/>' +
        '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      '<path d="' + areaPath + '" fill="url(#' + gradId + ')"/>' +
      '<path d="' + linePath + '" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + lastX.toFixed(2) + '" cy="' + lastY.toFixed(2) + '" r="2" fill="' + color + '"' + (pulseLatest ? ' class="eng-pulse"' : '') + '/>' +
    '</svg>';
  }

  // ───────────── STYLE INJECTION ─────────────

  function injectStyles() {
    if (document.getElementById('engine-css-v2')) return;
    var hexBg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='35' viewBox='0 0 40 35'%3E%3Cpath fill='none' stroke='%235B7FCC' stroke-width='0.4' opacity='0.07' d='M20 0 L40 11.5 L40 23.5 L20 35 L0 23.5 L0 11.5 Z'/%3E%3C/svg%3E";
    var css = document.createElement('style');
    css.id = 'engine-css-v2';
    css.textContent = `
      :root {
        --eng-denim:${COLORS.denim}; --eng-denim-deep:${COLORS.denimDeep}; --eng-denim-soft:${COLORS.denimSoft};
        --eng-gold:${COLORS.gold}; --eng-gold-soft:${COLORS.goldSoft};
        --eng-cyan:${COLORS.cyan}; --eng-rose:${COLORS.rose};
        --eng-green:${COLORS.green}; --eng-amber:${COLORS.amber};
        --eng-bg:${COLORS.bg}; --eng-bg-lift:${COLORS.bgLift};
        --eng-panel:${COLORS.panel}; --eng-panel-border:${COLORS.panelBorder};
        --eng-text-1:${COLORS.text1}; --eng-text-2:${COLORS.text2}; --eng-text-3:${COLORS.text3};
      }
      body {
        background:
          radial-gradient(ellipse 80% 50% at 50% 0%, rgba(91,127,204,0.12) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 100% 100%, rgba(196,136,74,0.06) 0%, transparent 50%),
          url("${hexBg}"),
          var(--eng-bg);
        color: var(--eng-text-1);
        font-family: 'Instrument Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        margin: 0; min-height: 100vh; padding-top: 64px;
      }

      /* ── Sticky brand header ── */
      .eng-topbar {
        position: fixed; top: 0; left: 0; right: 0; height: 64px;
        background: rgba(10,14,26,0.85);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        backdrop-filter: blur(20px) saturate(180%);
        border-bottom: 1px solid rgba(91,127,204,0.12);
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 32px; z-index: 1000;
      }
      .eng-brand {
        display: flex; align-items: center; gap: 12px;
        font-family: 'Instrument Serif', serif; font-size: 22px; color: #fff;
        letter-spacing: -0.01em; text-decoration: none;
      }
      .eng-brand-mark {
        width: 28px; height: 28px;
        background: linear-gradient(135deg, var(--eng-denim) 0%, var(--eng-denim-deep) 100%);
        border-radius: 4px; display: flex; align-items: center; justify-content: center;
        font-family: 'Geist Mono', monospace; font-size: 13px; font-weight: 700; color: #fff;
        box-shadow: 0 2px 8px rgba(91,127,204,0.4);
      }
      .eng-org-pill {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 14px; background: rgba(91,127,204,0.08);
        border: 1px solid rgba(91,127,204,0.2); border-radius: 100px;
        font-size: 12px; color: var(--eng-text-2); font-weight: 500;
      }
      .eng-org-pill .dot { width: 6px; height: 6px; border-radius: 50%;
        background: var(--eng-green); box-shadow: 0 0 8px var(--eng-green); }
      .eng-org-pill.demo .dot { background: var(--eng-gold); box-shadow: 0 0 8px var(--eng-gold); }
      .eng-sync-meta { font-size: 10px; color: var(--eng-text-3); margin-left: 8px;
        text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }

      /* ── Page layout ── */
      .eng-page { max-width: 1400px; margin: 0 auto; padding: 48px 40px 100px; }
      .eng-hero { margin-bottom: 40px; opacity: 0; animation: engReveal 0.6s ease-out forwards; }
      .eng-title {
        font-family: 'Instrument Serif', serif; font-size: 52px; font-weight: 400;
        margin: 0 0 12px; letter-spacing: -0.02em; line-height: 1.05;
        background: linear-gradient(135deg, #fff 0%, #c8d4e8 100%);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .eng-subtitle { color: var(--eng-text-2); font-size: 15px; margin: 0;
        max-width: 720px; line-height: 1.6; font-weight: 400; }
      .eng-meta-bar {
        background: linear-gradient(90deg, var(--eng-gold-soft) 0%, transparent 80%);
        border-left: 2px solid var(--eng-gold);
        padding: 12px 16px; font-size: 12px; color: var(--eng-text-2);
        margin-top: 20px; border-radius: 1px; line-height: 1.5;
      }
      .eng-meta-bar.live {
        background: linear-gradient(90deg, rgba(34,197,94,0.08) 0%, transparent 80%);
        border-left-color: var(--eng-green);
      }
      .eng-meta-bar a { color: var(--eng-gold); text-decoration: underline; font-weight: 600; }

      /* ── KPI cards ── */
      .eng-kpi-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 18px; margin-bottom: 36px;
      }
      .eng-kpi-card {
        background: linear-gradient(180deg, var(--eng-panel) 0%, rgba(15,23,42,0.45) 100%);
        border: 1px solid var(--eng-panel-border);
        border-radius: 4px; padding: 24px; position: relative;
        transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        cursor: default; opacity: 0; animation: engReveal 0.5s ease-out forwards;
        overflow: hidden;
      }
      .eng-kpi-card::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, var(--eng-denim), transparent); opacity: 0.4;
      }
      .eng-kpi-card.clickable { cursor: pointer; }
      .eng-kpi-card.clickable:hover {
        border-color: rgba(91,127,204,0.45); transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(91,127,204,0.2);
      }
      .eng-kpi-label {
        font-size: 10px; color: var(--eng-text-3); text-transform: uppercase;
        letter-spacing: 0.14em; margin-bottom: 14px; font-weight: 700;
      }
      .eng-kpi-value {
        font-family: 'Geist Mono', monospace; font-size: 36px; font-weight: 600;
        letter-spacing: -0.025em; line-height: 1; margin-bottom: 4px;
        background: linear-gradient(180deg, #fff 0%, #d1dbed 100%);
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .eng-kpi-value.has-color { background: none; -webkit-text-fill-color: initial; }
      .eng-kpi-spark { height: 28px; margin: 12px 0 4px; }
      .eng-kpi-delta {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 10px; padding: 4px 10px; border-radius: 1px; font-weight: 700;
        margin-top: 10px; letter-spacing: 0.06em;
        background: rgba(91,127,204,0.12); color: var(--eng-denim);
        text-transform: uppercase;
      }
      .eng-kpi-delta.up { background: rgba(34,197,94,0.12); color: var(--eng-green); }
      .eng-kpi-delta.down { background: rgba(239,68,68,0.12); color: var(--eng-rose); }
      .eng-kpi-delta.neutral { background: rgba(148,163,184,0.1); color: var(--eng-text-2); }

      /* ── Panels ── */
      .eng-panel {
        background: linear-gradient(180deg, var(--eng-panel) 0%, rgba(15,23,42,0.45) 100%);
        border: 1px solid var(--eng-panel-border);
        border-radius: 4px; padding: 32px; margin-bottom: 24px; position: relative;
        opacity: 0; animation: engReveal 0.6s ease-out forwards;
      }
      .eng-panel::before {
        content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
        background: linear-gradient(90deg, transparent, var(--eng-denim), transparent); opacity: 0.3;
      }
      .eng-panel-title {
        font-size: 13px; color: var(--eng-text-1); font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.14em;
        margin: 0 0 24px; display: flex; align-items: center; justify-content: space-between;
      }
      .eng-panel-title .arrow {
        color: var(--eng-denim); font-size: 14px; opacity: 0.6;
        transition: transform 0.2s, opacity 0.2s;
      }
      .eng-panel-title.clickable { cursor: pointer; transition: color 0.15s; }
      .eng-panel-title.clickable:hover { color: var(--eng-denim); }
      .eng-panel-title.clickable:hover .arrow { transform: translateX(6px); opacity: 1; }

      /* ── Cash position hero ── */
      .eng-cash-hero { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; padding: 8px 0; }
      .eng-cash-stat { padding: 16px 24px; position: relative; }
      .eng-cash-stat:not(:last-child)::after {
        content: ''; position: absolute; right: 0; top: 20%; bottom: 20%;
        width: 1px; background: var(--eng-panel-border);
      }
      .eng-cash-stat-label {
        font-size: 10px; color: var(--eng-text-3); text-transform: uppercase;
        letter-spacing: 0.14em; margin-bottom: 12px; font-weight: 700;
      }
      .eng-cash-stat-value {
        font-family: 'Geist Mono', monospace; font-size: 38px; font-weight: 700;
        letter-spacing: -0.025em; line-height: 1;
      }

      /* ── Cash trend chart ── */
      .eng-chart-wrap { position: relative; padding: 16px 0 8px; }
      .eng-chart {
        position: relative; height: 240px;
        display: grid; grid-template-columns: 60px 1fr; gap: 8px;
      }
      .eng-chart-yaxis {
        display: flex; flex-direction: column; justify-content: space-between;
        padding: 8px 8px 24px 0; text-align: right;
      }
      .eng-chart-ylabel {
        font-family: 'Geist Mono', monospace; font-size: 10px;
        color: var(--eng-text-3); font-weight: 500;
      }
      .eng-chart-plot { position: relative; }
      .eng-chart-grid {
        position: absolute; inset: 0 0 24px 0; display: flex; flex-direction: column;
        justify-content: space-between; pointer-events: none;
      }
      .eng-chart-gridline { width: 100%; height: 1px; background: var(--eng-panel-border); opacity: 0.5; }
      .eng-chart-gridline.zero { background: var(--eng-text-3); opacity: 0.4; }
      .eng-chart-bars {
        position: absolute; inset: 0 0 24px 0;
        display: flex; align-items: stretch; gap: 8px;
      }
      .eng-trend-bar-col {
        flex: 1; display: flex; flex-direction: column; cursor: pointer;
        transition: filter 0.2s;
      }
      .eng-trend-bar-col:hover { filter: brightness(1.2); }
      .eng-trend-bar {
        background: linear-gradient(180deg, currentColor 0%, transparent 110%);
        border-radius: 3px 3px 0 0; transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 1px;
      }
      .eng-trend-bar.neg {
        background: linear-gradient(0deg, currentColor 0%, transparent 110%);
        border-radius: 0 0 3px 3px;
      }
      .eng-chart-xaxis {
        position: absolute; bottom: 0; left: 0; right: 0; height: 24px;
        display: flex; gap: 8px; padding-top: 8px;
      }
      .eng-chart-xlabel {
        flex: 1; text-align: center; font-family: 'Geist Mono', monospace;
        font-size: 10px; color: var(--eng-text-3); font-weight: 500;
      }

      /* ── Empty / placeholder states ── */
      .eng-empty {
        text-align: center; padding: 48px 20px;
        background: linear-gradient(180deg, rgba(91,127,204,0.04) 0%, transparent 100%);
        border: 1px dashed var(--eng-panel-border); border-radius: 4px;
      }
      .eng-empty-icon { font-size: 36px; margin-bottom: 16px; opacity: 0.5; }
      .eng-empty-heading { color: var(--eng-text-1); font-weight: 600;
        margin-bottom: 8px; font-size: 14px; }
      .eng-empty-message { color: var(--eng-text-3); font-size: 12px;
        max-width: 440px; margin: 0 auto; line-height: 1.6; }

      /* ── Quicknav ── */
      .cfo-quicknav {
        position: fixed; top: 80px; right: 24px; display: flex; gap: 4px;
        background: rgba(15,23,42,0.85);
        -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
        border: 1px solid rgba(91,127,204,0.25); border-radius: 100px;
        padding: 5px; z-index: 999;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        animation: engFadeDown 0.5s ease-out;
      }

      /* ── Animations ── */
      @keyframes engReveal { 0% { opacity: 0; transform: translateY(8px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes engFadeDown { 0% { opacity: 0; transform: translateY(-8px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes engPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      .eng-pulse { animation: engPulse 2s ease-in-out infinite; }

      /* ── Responsive ── */
      @media (max-width: 1024px) {
        .eng-cash-hero { grid-template-columns: 1fr; }
        .eng-cash-stat:not(:last-child)::after { display: none; }
        .eng-cash-stat:not(:last-child) { border-bottom: 1px solid var(--eng-panel-border); }
      }
      @media (max-width: 768px) {
        .eng-page { padding: 32px 20px 60px; }
        .eng-title { font-size: 36px; }
        .eng-topbar { padding: 0 16px; }
        .cfo-quicknav { position: relative; top: auto; right: auto; margin: 16px auto; max-width: max-content; }
      }
    `;
    document.head.appendChild(css);
  }

  // ───────────── TOPBAR ─────────────

  function injectTopbar(meta) {
    if (document.querySelector('.eng-topbar')) return;
    var bar = document.createElement('header');
    bar.className = 'eng-topbar';
    var demo = meta.demo_mode;
    var sync = meta.last_sync_at ? formatValue(meta.last_sync_at, 'date_relative') : 'Never synced';
    bar.innerHTML =
      '<a href="/" class="eng-brand">' +
        '<div class="eng-brand-mark">C</div>' +
        '<span>Castford</span>' +
      '</a>' +
      '<div class="eng-org-pill' + (demo ? ' demo' : '') + '">' +
        '<span class="dot"></span>' +
        '<span>' + (meta.org_name || 'Organization') + '</span>' +
        '<span class="eng-sync-meta">' + (demo ? 'Demo Data' : 'Live · ' + sync) + '</span>' +
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);
  }

  // ───────────── QUICKNAV ─────────────

  function injectQuicknav(currentRole, allowedRoles) {
    if (document.querySelector('.cfo-quicknav')) return;
    var nav = document.createElement('div');
    nav.className = 'cfo-quicknav';
    var allPages = [
      { url: '/cfo', label: 'CFO', role: 'cfo' },
      { url: '/ceo', label: 'Founder', role: 'ceo' },
      { url: '/controller', label: 'Controller', role: 'controller' },
      { url: '/fpa', label: 'FP&A', role: 'fpa' },
    ];
    var path = window.location.pathname.replace(/\/$/, '');
    allPages.forEach(function(p) {
      var locked = allowedRoles && !allowedRoles.includes(p.role);
      var current = path === p.url || currentRole === p.role;
      var btn = document.createElement('a');
      btn.href = locked ? '#' : p.url; btn.textContent = p.label + (locked ? ' 🔒' : '');
      btn.style.cssText = 'padding:6px 14px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.04em;text-decoration:none;transition:all 0.15s;font-family:Instrument Sans,sans-serif;color:' + (current ? '#fff' : locked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)') + ';background:' + (current ? COLORS.denim : 'transparent') + (locked ? ';cursor:not-allowed' : '');
      if (locked) {
        btn.title = 'Upgrade to access ' + p.label + ' dashboard';
        btn.addEventListener('click', function(e) { e.preventDefault(); alert('Upgrade your plan to access the ' + p.label + ' dashboard.'); });
      } else if (!current) {
        btn.addEventListener('mouseenter', function() { btn.style.color = '#fff'; btn.style.background = 'rgba(91,127,204,0.2)'; });
        btn.addEventListener('mouseleave', function() { btn.style.color = 'rgba(255,255,255,0.55)'; btn.style.background = 'transparent'; });
      }
      nav.appendChild(btn);
    });
    document.body.appendChild(nav);
  }

  // ───────────── PANEL RENDERERS ─────────────

  function renderKPICard(card, data, idx) {
    var val = getValue(data, card.data_path);
    var formatted = formatValue(val, card.format || 'currency_short');
    var color = card.color_logic ? colorForValue(val, card.color_logic) : null;
    var delta = card.delta_path ? getValue(data, card.delta_path) : null;
    var deltaHtml = '';
    if (delta != null && !isNaN(Number(delta))) {
      var n = Number(delta);
      var cls = n >= 0 ? 'up' : 'down';
      deltaHtml = '<div class="eng-kpi-delta ' + cls + '">' + (n >= 0 ? '▲' : '▼') + ' ' + Math.abs(n).toFixed(1) + '% ' + (card.delta_label || '') + '</div>';
    } else if (card.no_delta_text) {
      deltaHtml = '<div class="eng-kpi-delta neutral">' + card.no_delta_text + '</div>';
    }
    // Sparkline if monthly trend available and card has a sparkline_field
    var sparkHtml = '';
    var trend = getValue(data, 'trends.monthly') || [];
    if (trend.length && card.sparkline_field) {
      var sparkData = trend.map(function(m) {
        if (card.sparkline_field === 'derived_margin') return m.revenue > 0 ? (m.revenue - m.cogs) / m.revenue * 100 : 0;
        if (card.sparkline_field === 'derived_ocf') return m.revenue - m.opex;
        if (card.sparkline_field === 'derived_burn') return Math.max(0, -m.net);
        return m[card.sparkline_field] || 0;
      });
      var sparkColor = color || COLORS.denim;
      sparkHtml = '<div class="eng-kpi-spark">' + renderSparkline(sparkData, sparkColor, { style: card.sparkline_style || 'line' }) + '</div>';
    }
    var clickable = card.drill_to ? ' clickable' : '';
    var drill = card.drill_to ? ' data-drill="' + card.drill_to + '"' : '';
    var valueClass = color ? 'eng-kpi-value has-color' : 'eng-kpi-value';
    var valueStyle = color ? ';color:' + color : '';
    var delay = ((idx || 0) * 80);
    return '<div class="eng-kpi-card' + clickable + '" style="animation-delay:' + delay + 'ms"' + drill + '>' +
      '<div class="eng-kpi-label">' + card.label + '</div>' +
      '<div class="' + valueClass + '" style="' + valueStyle + '">' + formatted + '</div>' +
      sparkHtml + deltaHtml +
    '</div>';
  }

  function renderTopKPIRow(cards, data) {
    var html = '<div class="eng-kpi-grid">';
    cards.forEach(function(c, i) { html += renderKPICard(c, data, i); });
    html += '</div>';
    return html;
  }

  function renderKPIGrid(panel, data) {
    var html = '<div class="eng-kpi-grid">';
    (panel.cards || []).forEach(function(c, i) { html += renderKPICard(c, data, i); });
    html += '</div>';
    return wrapPanel(panel, html, false);
  }

  function renderCashTrend(panel, data) {
    var trendData = getValue(data, panel.data_path) || [];
    if (!trendData.length) {
      return wrapPanel(panel, '<div class="eng-empty"><div class="eng-empty-icon">📊</div><div class="eng-empty-heading">No cash data yet</div><div class="eng-empty-message">Connect QuickBooks or upload a GL to see your cash trend.</div></div>');
    }
    var field = panel.value_field || 'net';
    var values = trendData.map(function(m) { return Number(m[field]) || 0; });
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    var hasNeg = min < 0;
    var range = Math.max(Math.abs(max), Math.abs(min)) || 1;

    var ySteps = hasNeg
      ? [range, range / 2, 0, -range / 2, -range]
      : [range, range * 0.75, range * 0.5, range * 0.25, 0];
    var yLabels = ySteps.map(function(v) { return '<div class="eng-chart-ylabel">' + formatValue(v, 'currency_short') + '</div>'; }).join('');

    var chartId = 'eng-chart-' + Math.random().toString(36).slice(2, 8);
    var bars = trendData.map(function(m, i) {
      var v = Number(m[field]) || 0;
      var color = v >= 0 ? COLORS.green : COLORS.rose;
      var pctOfRange = Math.abs(v) / range;
      var barHeight, topPad, bottomPad;
      if (hasNeg) {
        if (v >= 0) {
          topPad = (1 - pctOfRange) * 50;
          barHeight = pctOfRange * 50;
          bottomPad = 50;
        } else {
          topPad = 50;
          barHeight = pctOfRange * 50;
          bottomPad = 50 - barHeight;
        }
      } else {
        topPad = (1 - pctOfRange) * 100;
        barHeight = pctOfRange * 100;
        bottomPad = 0;
      }
      return '<div data-bar-idx="' + i + '" class="eng-trend-bar-col" style="color:' + color + '">' +
        '<div style="height:' + topPad + '%"></div>' +
        '<div class="eng-trend-bar' + (v < 0 ? ' neg' : '') + '" style="height:' + barHeight + '%"></div>' +
        (bottomPad ? '<div style="height:' + bottomPad + '%"></div>' : '') +
      '</div>';
    }).join('');
    var xLabels = trendData.map(function(m) { return '<div class="eng-chart-xlabel">' + (m.label || m.month) + '</div>'; }).join('');

    var html = '<div class="eng-chart-wrap">' +
      '<div class="eng-chart" id="' + chartId + '">' +
        '<div class="eng-chart-yaxis">' + yLabels + '</div>' +
        '<div class="eng-chart-plot">' +
          '<div class="eng-chart-grid">' +
            (hasNeg
              ? '<div class="eng-chart-gridline"></div><div class="eng-chart-gridline"></div><div class="eng-chart-gridline zero"></div><div class="eng-chart-gridline"></div><div class="eng-chart-gridline"></div>'
              : '<div class="eng-chart-gridline"></div><div class="eng-chart-gridline"></div><div class="eng-chart-gridline"></div><div class="eng-chart-gridline"></div><div class="eng-chart-gridline zero"></div>') +
          '</div>' +
          '<div class="eng-chart-bars">' + bars + '</div>' +
          '<div class="eng-chart-xaxis">' + xLabels + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    setTimeout(function() {
      var chart = document.getElementById(chartId);
      if (!chart) return;
      chart.querySelectorAll('.eng-trend-bar-col').forEach(function(col) {
        var idx = parseInt(col.dataset.barIdx, 10);
        var m = trendData[idx];
        if (!m) return;
        var color = m[field] >= 0 ? COLORS.green : COLORS.rose;
        Tooltip.attach(col,
          '<div style="font-weight:700;color:' + COLORS.denim + ';margin-bottom:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.12em">' + (m.label || m.month) + '</div>' +
          (m.revenue != null ? '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px">Revenue: <span style="color:#fff;font-weight:600">' + formatValue(m.revenue, 'currency_short') + '</span></div>' : '') +
          (m.cogs != null ? '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px">COGS: <span style="color:#fff;font-weight:600">' + formatValue(m.cogs, 'currency_short') + '</span></div>' : '') +
          (m.opex != null ? '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:8px">OpEx: <span style="color:#fff;font-weight:600">' + formatValue(m.opex, 'currency_short') + '</span></div>' : '') +
          '<div style="padding-top:8px;border-top:1px solid rgba(255,255,255,0.15);font-family:Geist Mono,monospace;font-size:14px">Net: <span style="color:' + color + ';font-weight:700">' + formatValue(m[field], 'currency_short') + '</span></div>'
        );
      });
    }, 50);
    return wrapPanel(panel, html);
  }

  function renderCashPosition(panel, data) {
    var cash = getValue(data, panel.cash_path || 'kpis.cash_position');
    var burn = getValue(data, panel.burn_path || 'kpis.burn_rate_monthly');
    var runway = getValue(data, panel.runway_path || 'kpis.runway_months');
    var runwayColor = runway === null ? COLORS.green : runway < 6 ? COLORS.rose : runway < 12 ? COLORS.amber : COLORS.green;
    var runwayText = runway === null ? '∞' : runway + ' mo';
    var burnText = burn === 0 ? 'Profitable' : formatValue(burn, 'currency_short') + '/mo';
    var burnColor = burn === 0 ? COLORS.green : COLORS.text1;

    var html = '<div class="eng-cash-hero">' +
      '<div class="eng-cash-stat"><div class="eng-cash-stat-label">Current Cash</div>' +
        '<div class="eng-cash-stat-value" style="color:' + COLORS.denim + '">' + formatValue(cash, 'currency_short') + '</div></div>' +
      '<div class="eng-cash-stat"><div class="eng-cash-stat-label">Monthly Burn</div>' +
        '<div class="eng-cash-stat-value" style="color:' + burnColor + '">' + burnText + '</div></div>' +
      '<div class="eng-cash-stat"><div class="eng-cash-stat-label">Runway</div>' +
        '<div class="eng-cash-stat-value" style="color:' + runwayColor + '">' + runwayText + '</div></div>' +
    '</div>';
    return wrapPanel(panel, html);
  }

  function renderPlaceholder(panel, data) {
    var html = '<div class="eng-empty">' +
      '<div class="eng-empty-icon">' + (panel.icon || '⏳') + '</div>' +
      '<div class="eng-empty-heading">' + (panel.heading || 'Coming soon') + '</div>' +
      '<div class="eng-empty-message">' + (panel.message || 'This feature is being built.') + '</div>' +
    '</div>';
    return wrapPanel(panel, html);
  }

  function renderSimpleTable(panel, data) {
    var rows = getValue(data, panel.data_path) || [];
    if (!rows.length) {
      return wrapPanel(panel, '<div class="eng-empty"><div class="eng-empty-icon">📋</div><div class="eng-empty-heading">No data yet</div></div>');
    }
    var cols = panel.columns || [];
    var html = '<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr>';
    cols.forEach(function(c) {
      html += '<th style="text-align:' + (c.align || 'left') + ';padding:12px 8px;color:var(--eng-text-3);font-size:10px;text-transform:uppercase;letter-spacing:0.1em;border-bottom:1px solid var(--eng-panel-border);font-weight:700">' + c.label + '</th>';
    });
    html += '</tr></thead><tbody>';
    rows.forEach(function(row) {
      html += '<tr>';
      cols.forEach(function(c) {
        var v = getValue(row, c.field);
        var formatted = formatValue(v, c.format || 'integer');
        var family = c.format && c.format.indexOf('currency') > -1 ? "'Geist Mono',monospace" : '';
        html += '<td style="padding:12px 8px;text-align:' + (c.align || 'left') + ';font-family:' + family + ';border-bottom:1px solid rgba(91,127,204,0.06);color:var(--eng-text-1)">' + formatted + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return wrapPanel(panel, html);
  }

  function wrapPanel(panel, contentHtml, addArrow) {
    if (addArrow === undefined) addArrow = true;
    var titleClass = panel.drill_to ? 'eng-panel-title clickable' : 'eng-panel-title';
    var arrow = (panel.drill_to && addArrow) ? '<span class="arrow">→</span>' : '';
    var drill = panel.drill_to ? ' data-drill="' + panel.drill_to + '"' : '';
    return '<div class="eng-panel"' + drill + '>' +
      (panel.title ? '<div class="' + titleClass + '">' + panel.title + arrow + '</div>' : '') +
      contentHtml +
    '</div>';
  }

  var PANEL_RENDERERS = {
    kpi_grid: renderKPIGrid,
    cash_trend: renderCashTrend,
    cash_position: renderCashPosition,
    placeholder: renderPlaceholder,
    simple_table: renderSimpleTable,
  };

  // ───────────── ENGINE ORCHESTRATOR ─────────────

  function DashboardEngine(role) {
    this.role = role;
    this.config = null;
    this.data = null;
  }

  DashboardEngine.prototype.fetchConfig = async function() {
    var resp = await fetch('/site/dashboard/configs/' + this.role + '.json?v=2');
    if (!resp.ok) throw new Error('Config not found for role: ' + this.role);
    return await resp.json();
  };

  DashboardEngine.prototype.fetchData = async function() {
    var token = await getToken();
    if (!token) { window.location.href = '/login'; return null; }
    var resp = await fetch(BASE + '/dashboard-data?role=' + this.role, {
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    });
    if (resp.status === 401) { window.location.href = '/login'; return null; }
    if (resp.status === 403) {
      var err = await resp.json();
      throw new Error(err.error + ' (current tier: ' + err.tier + ', upgrade to: ' + err.upgrade_to + ')');
    }
    if (!resp.ok) throw new Error('Data fetch failed: HTTP ' + resp.status);
    return await resp.json();
  };

  DashboardEngine.prototype.render = function() {
    var page = document.getElementById('eng-page');
    if (!page) { console.error('[Engine v2] No #eng-page mount point'); return; }
    var c = this.config; var d = this.data;

    var hero = '<div class="eng-hero">' +
      '<h1 class="eng-title">' + (c.title || 'Dashboard') + '</h1>' +
      (c.subtitle ? '<p class="eng-subtitle">' + c.subtitle + '</p>' : '') +
      (d.meta && d.meta.demo_mode
        ? '<div class="eng-meta-bar">📊 You are viewing demo data — connect QuickBooks to see your real financials. <a href="/integrations">Connect →</a></div>'
        : '') +
    '</div>';

    var kpiRow = '';
    if (c.kpi_cards && c.kpi_cards.length) kpiRow = renderTopKPIRow(c.kpi_cards, d);

    var panels = '';
    if (c.panels && c.panels.length) {
      c.panels.forEach(function(panel, i) {
        var renderer = PANEL_RENDERERS[panel.type];
        if (renderer) {
          try { panels += renderer(panel, d); }
          catch (e) {
            console.error('[Engine v2] Panel render error:', panel.id, e);
            panels += '<div class="eng-panel"><div style="color:var(--eng-rose)">Failed to render: ' + panel.id + '</div></div>';
          }
        } else {
          panels += '<div class="eng-panel"><div style="color:var(--eng-rose)">Unknown panel type: ' + panel.type + '</div></div>';
        }
      });
    }

    page.innerHTML = hero + kpiRow + panels;

    page.querySelectorAll('[data-drill]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') return;
        window.location.href = el.dataset.drill;
      });
    });

    console.log('[Engine v2] rendered', this.role, 'in', performance.now().toFixed(0) + 'ms');
  };

  DashboardEngine.prototype.boot = async function() {
    injectStyles();
    try {
      var configP = this.fetchConfig();
      var dataP = this.fetchData();
      this.config = await configP;
      this.data = await dataP;
      if (!this.data) return;
      injectTopbar(this.data.meta || {});
      var TIER_DASHBOARDS = {
        starter: ['ceo'],
        growth: ['ceo', 'controller', 'fpa'],
        business: ['ceo', 'controller', 'fpa', 'cfo'],
        enterprise: ['ceo', 'controller', 'fpa', 'cfo'],
      };
      var allowedRoles = TIER_DASHBOARDS[this.data.meta.tier] || [];
      injectQuicknav(this.role, allowedRoles);
      this.render();
    } catch (err) {
      console.error('[Engine v2] Boot error:', err);
      var page = document.getElementById('eng-page');
      if (page) page.innerHTML = '<div class="eng-empty"><div class="eng-empty-icon">⚠️</div><div class="eng-empty-heading">Could not load dashboard</div><div class="eng-empty-message">' + err.message + '</div></div>';
    }
  };

  global.DashboardEngine = DashboardEngine;

  function autoBoot() {
    var role = (new URLSearchParams(window.location.search)).get('role')
      || document.body.dataset.role || 'ceo';
    var engine = new DashboardEngine(role);
    engine.boot();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoBoot);
  else autoBoot();

})(window);
