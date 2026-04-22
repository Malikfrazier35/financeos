/* Castford CFO Command Brain v4
 * Hub orchestrator. v4 adds (over v3):
 *   - LIVE sparkline rendering into .kpi-spark for all 6 KPI cards
 *   - wireSectionLinks: P&L Statement + Cash Position panel titles → subpages
 *   - injectSubpageNav: floating top-right pill row for full subpage access
 *
 * v3 paint behaviors preserved:
 *   - 6 KPIs (.kpi-card → .kpi-value/.kpi-label/.kpi-delta)
 *   - P&L statement rows (.pl-row → .pl-label/.pl-val/.pl-bar-fill)
 *   - Cash Position panel header pill (.panel-badge.badge-green)
 *   - Cash bars (6-month .cash-bar with data-h)
 *   - Cash stats (Current + Runway via .cash-stat-val)
 *   - Re-paint at 1500ms to win race with cfo.html inline animateBars
 */
(function() {
  'use strict';

  var BASE = 'https://crecesswagluelvkesul.supabase.co/functions/v1';
  var SB_URL = 'https://crecesswagluelvkesul.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTU0NTAsImV4cCI6MjA3NjA5MTQ1MH0.h7nBkfmZHLbuzqJxhX6lgfRFWxgjYuxl5d2SbkRSaCk';

  // Brand colors (match Castford theme)
  var DENIM = '#5B7FCC';
  var GOLD = '#C4884A';
  var CYAN = '#0EA5E9';
  var ROSE = '#EF4444';
  var GREEN = '#22C55E';

  function fmt(v) {
    var n = Number(v) || 0; var a = Math.abs(n);
    if (a >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
    if (a >= 1e6) return '$' + (n/1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + (n/1e3).toFixed(0) + 'K';
    return '$' + n.toFixed(0);
  }
  function fmtNeg(v) { return '(' + fmt(Math.abs(v)) + ')'; }

  async function getToken() {
    try {
      if (window.supabase && window.supabase.createClient) {
        var c = window.supabase.createClient(SB_URL, SB_KEY);
        var s = await c.auth.getSession();
        if (s.data && s.data.session && s.data.session.access_token) return s.data.session.access_token;
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
  }

  // ─────────────────────────────── PAINT FUNCTIONS ───────────────────────────────

  function paintKPIs(kpis, deltas) {
    var painted = 0;
    document.querySelectorAll('.kpi-card').forEach(function(card) {
      var labelEl = card.querySelector('.kpi-label');
      var valEl = card.querySelector('.kpi-value');
      var deltaEl = card.querySelector('.kpi-delta');
      if (!labelEl || !valEl) return;
      var label = (labelEl.textContent || '').trim().toLowerCase();

      try {
        if (label === 'total revenue' || label === 'revenue') {
          valEl.textContent = fmt(kpis.revenue);
          if (deltaEl && deltas.revenue_yoy !== null && deltas.revenue_yoy !== undefined) {
            deltaEl.textContent = (deltas.revenue_yoy >= 0 ? '▲ ' : '▼ ') + Math.abs(deltas.revenue_yoy).toFixed(0) + '% YoY';
            deltaEl.className = 'kpi-delta ' + (deltas.revenue_yoy >= 0 ? 'up' : 'down');
          }
          painted++;
        } else if (label === 'gross margin') {
          valEl.textContent = (kpis.gross_margin || 0).toFixed(1) + '%';
          if (deltaEl && deltas.gross_margin_qoq !== null && deltas.gross_margin_qoq !== undefined) {
            deltaEl.textContent = (deltas.gross_margin_qoq >= 0 ? '▲ ' : '▼ ') + Math.abs(deltas.gross_margin_qoq).toFixed(1) + 'pts QoQ';
            deltaEl.className = 'kpi-delta ' + (deltas.gross_margin_qoq >= 0 ? 'up' : 'down');
          }
          painted++;
        } else if (label === 'operating cash flow' || label === 'ocf') {
          valEl.textContent = fmt(kpis.operating_cash_flow);
          if (deltaEl && deltas.ocf_qoq !== null && deltas.ocf_qoq !== undefined) {
            deltaEl.textContent = (deltas.ocf_qoq >= 0 ? '▲ ' : '▼ ') + Math.abs(deltas.ocf_qoq).toFixed(1) + '% QoQ';
            deltaEl.className = 'kpi-delta ' + (deltas.ocf_qoq >= 0 ? 'up' : 'down');
          }
          painted++;
        } else if (label === 'roic') {
          valEl.textContent = (kpis.roic || 0).toFixed(1) + '%';
          if (deltaEl && deltas.roic_yoy !== null && deltas.roic_yoy !== undefined) {
            deltaEl.textContent = (deltas.roic_yoy >= 0 ? '▲ ' : '▼ ') + Math.abs(deltas.roic_yoy).toFixed(1) + 'pts YoY';
            deltaEl.className = 'kpi-delta ' + (deltas.roic_yoy >= 0 ? 'up' : 'down');
          }
          painted++;
        } else if (label === 'net income') {
          valEl.textContent = fmt(kpis.net_income);
          if (deltaEl && deltas.net_income_yoy !== null && deltas.net_income_yoy !== undefined) {
            deltaEl.textContent = (deltas.net_income_yoy >= 0 ? '▲ ' : '▼ ') + Math.abs(deltas.net_income_yoy).toFixed(0) + '% YoY';
            deltaEl.className = 'kpi-delta ' + (deltas.net_income_yoy >= 0 ? 'up' : 'down');
          }
          painted++;
        } else if (label === 'burn rate') {
          if (kpis.burn_rate === 0) {
            valEl.textContent = '$0';
            if (deltaEl) { deltaEl.textContent = 'Profitable'; deltaEl.className = 'kpi-delta up'; }
          } else {
            valEl.textContent = fmt(kpis.burn_rate) + '/mo';
            if (deltaEl) { deltaEl.textContent = kpis.burn_status || 'elevated'; deltaEl.className = 'kpi-delta down'; }
          }
          painted++;
        }
      } catch (e) { console.warn('[CFO brain] KPI paint error on', label, e); }
    });
    console.log('[CFO brain v4] KPIs painted:', painted, '/ 6');
  }

  function paintPL(kpis) {
    var painted = 0;
    document.querySelectorAll('.pl-row').forEach(function(row) {
      var labelEl = row.querySelector('.pl-label');
      var valEl = row.querySelector('.pl-val');
      if (!labelEl || !valEl) return;
      var label = (labelEl.textContent || '').trim().toLowerCase();

      try {
        if (label === 'revenue' || label === 'total revenue') {
          valEl.textContent = fmt(kpis.revenue);
          painted++;
        } else if (label === 'cogs' || label.indexOf('cost of') > -1) {
          valEl.textContent = fmtNeg(kpis.cogs);
          painted++;
        } else if (label === 'gross profit') {
          valEl.textContent = fmt(kpis.gross_profit);
          valEl.style.color = 'var(--green,#22C55E)';
          painted++;
        } else if (label === 'opex' || label === 'operating expenses' || label.indexOf('operating') > -1) {
          valEl.textContent = fmtNeg(kpis.opex);
          painted++;
        } else if (label === 'net income' || label === 'net profit') {
          valEl.textContent = fmt(kpis.net_income);
          valEl.style.color = kpis.net_income >= 0 ? 'var(--green,#22C55E)' : 'var(--rose,#EF4444)';
          painted++;
        }
      } catch (e) { console.warn('[CFO brain] P&L paint error on', label, e); }
    });
    console.log('[CFO brain v4] P&L rows painted:', painted);
  }

  function paintPLBars(bars) {
    if (!bars) return;
    var painted = 0;
    document.querySelectorAll('.pl-row').forEach(function(row) {
      var labelEl = row.querySelector('.pl-label');
      var fillEl = row.querySelector('.pl-bar-fill');
      if (!labelEl || !fillEl) return;
      var label = (labelEl.textContent || '').trim().toLowerCase();
      try {
        if ((label === 'revenue' || label === 'total revenue') && bars.revenue && bars.revenue.pct !== null) {
          fillEl.style.width = Math.min(100, bars.revenue.pct) + '%';
          fillEl.dataset.w = Math.min(100, bars.revenue.pct) + '%';
          painted++;
        } else if ((label === 'cogs' || label.indexOf('cost of') > -1) && bars.cogs && bars.cogs.pct !== null) {
          fillEl.style.width = Math.min(100, bars.cogs.pct) + '%';
          fillEl.dataset.w = Math.min(100, bars.cogs.pct) + '%';
          painted++;
        } else if ((label === 'opex' || label.indexOf('operating') > -1) && bars.opex && bars.opex.pct !== null) {
          fillEl.style.width = Math.min(100, bars.opex.pct) + '%';
          fillEl.dataset.w = Math.min(100, bars.opex.pct) + '%';
          painted++;
        }
      } catch (e) { console.warn('[CFO brain] P&L bar paint error on', label, e); }
    });
    console.log('[CFO brain v4] P&L bars painted:', painted);
  }

  function paintCashBars(bars) {
    if (!bars || !bars.length) return;
    var els = document.querySelectorAll('.cash-bar');
    if (!els.length) return;
    var painted = 0;
    var n = Math.min(els.length, bars.length);
    for (var i = 0; i < n; i++) {
      try {
        var el = els[i];
        var d = bars[i];
        el.style.height = d.pct + '%';
        el.dataset.h = d.pct + '%';
        var labelEl = el.querySelector('.cash-bar-label');
        if (labelEl) labelEl.textContent = d.label;
        painted++;
      } catch (e) { console.warn('[CFO brain] Cash bar paint error', i, e); }
    }
    console.log('[CFO brain v4] Cash bars painted:', painted);
  }

  function paintCashPosition(kpis) {
    document.querySelectorAll('.panel').forEach(function(panel) {
      var titleEl = panel.querySelector('.panel-title');
      if (!titleEl) return;
      var title = (titleEl.textContent || '').trim().toLowerCase();
      if (title === 'cash position') {
        var badge = panel.querySelector('.panel-badge');
        if (badge) badge.textContent = fmt(kpis.cash_position);

        var stats = panel.querySelectorAll('.cash-stat-val');
        if (stats.length >= 1) stats[0].textContent = fmt(kpis.cash_position);
        if (stats.length >= 2) {
          if (kpis.burn_rate && kpis.burn_rate > 0) {
            var runway = Math.floor(kpis.cash_position / kpis.burn_rate);
            stats[1].textContent = runway + ' mo';
            stats[1].style.color = runway < 6 ? 'var(--rose,#EF4444)' : runway < 12 ? 'var(--amber,#F59E0B)' : 'var(--green,#22C55E)';
          } else {
            stats[1].textContent = '∞';
            stats[1].style.color = 'var(--green,#22C55E)';
          }
        }
        console.log('[CFO brain v4] Cash Position painted: pill=' + (badge?'✓':'✗') + ', stats=' + stats.length);
      }
    });
  }

  // ─────────────────────────────── NEW IN v4: SPARKLINES ───────────────────────────────

  function renderSparklineSVG(data, color) {
    if (!data || !data.length) return '';
    var values = data.map(function(v) { return Math.abs(Number(v) || 0); });
    var max = Math.max.apply(null, values);
    if (max === 0) return '<svg viewBox="0 0 100 24" preserveAspectRatio="none" style="width:100%;height:100%;display:block"></svg>';
    var n = data.length;
    var w = 100, h = 24;
    var barW = w / n;
    var bars = '';
    for (var i = 0; i < n; i++) {
      var v = values[i];
      var bh = (v / max) * h;
      var by = h - bh;
      var op = i === n - 1 ? '1' : (0.4 + 0.5 * (i / n)).toFixed(2);
      bars += '<rect x="' + (i * barW + 0.5).toFixed(2) + '" y="' + by.toFixed(2) +
              '" width="' + (barW - 1).toFixed(2) + '" height="' + Math.max(0.5, bh).toFixed(2) +
              '" fill="' + color + '" opacity="' + op + '" rx="0.5"/>';
    }
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:100%;display:block">' + bars + '</svg>';
  }

  function paintSparklines(monthlyTrend) {
    if (!monthlyTrend || !monthlyTrend.length) {
      console.log('[CFO brain v4] No monthly_trend data for sparklines');
      return;
    }
    var painted = 0;
    document.querySelectorAll('.kpi-card').forEach(function(card) {
      var labelEl = card.querySelector('.kpi-label');
      var sparkEl = card.querySelector('.kpi-spark');
      if (!labelEl || !sparkEl) return;
      var label = (labelEl.textContent || '').trim().toLowerCase();

      var data = null, color = DENIM;
      if (label === 'total revenue' || label === 'revenue') {
        data = monthlyTrend.map(function(m) { return m.revenue; });
        color = DENIM;
      } else if (label === 'gross margin') {
        data = monthlyTrend.map(function(m) { return m.revenue > 0 ? (m.revenue - m.cogs) / m.revenue * 100 : 0; });
        color = DENIM;
      } else if (label === 'operating cash flow' || label === 'ocf') {
        data = monthlyTrend.map(function(m) { return m.revenue - m.opex; });
        color = DENIM;
      } else if (label === 'roic') {
        data = monthlyTrend.map(function(m) { return m.revenue > 0 ? m.net / m.revenue * 100 : 0; });
        color = CYAN;
      } else if (label === 'net income') {
        data = monthlyTrend.map(function(m) { return m.net; });
        color = GOLD;
      } else if (label === 'burn rate') {
        data = monthlyTrend.map(function(m) { return Math.max(0, -m.net); });
        color = ROSE;
      }
      if (!data) return;
      try {
        sparkEl.innerHTML = renderSparklineSVG(data, color);
        painted++;
      } catch (e) { console.warn('[CFO brain] Sparkline render error on', label, e); }
    });
    console.log('[CFO brain v4] Sparklines painted:', painted, '/ 6');
  }

  // ─────────────────────────────── NEW IN v4: NAVIGATION ───────────────────────────────

  function wireSectionLinks() {
    document.querySelectorAll('.panel').forEach(function(panel) {
      var titleEl = panel.querySelector('.panel-title');
      if (!titleEl) return;
      if (titleEl.dataset.cfoLinked === 'true') return; // idempotent
      var title = (titleEl.textContent || '').trim().toLowerCase();
      var url = null;
      if (title === 'p&l statement') url = '/cfo/pnl';
      else if (title === 'cash position') url = '/cfo/cash';
      if (!url) return;

      titleEl.dataset.cfoLinked = 'true';
      titleEl.style.cursor = 'pointer';
      titleEl.style.transition = 'color 0.15s';

      // Append a subtle → arrow if not already present
      if (!titleEl.querySelector('.section-arrow')) {
        var arrow = document.createElement('span');
        arrow.className = 'section-arrow';
        arrow.style.cssText = 'margin-left:8px;font-size:14px;color:' + DENIM + ';opacity:0.7;transition:transform 0.15s';
        arrow.textContent = '→';
        titleEl.appendChild(arrow);
      }

      titleEl.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = url;
      });
      titleEl.addEventListener('mouseenter', function() {
        titleEl.style.color = DENIM;
        var a = titleEl.querySelector('.section-arrow');
        if (a) { a.style.transform = 'translateX(4px)'; a.style.opacity = '1'; }
      });
      titleEl.addEventListener('mouseleave', function() {
        titleEl.style.color = '';
        var a = titleEl.querySelector('.section-arrow');
        if (a) { a.style.transform = ''; a.style.opacity = '0.7'; }
      });
    });
    console.log('[CFO brain v4] Section links wired');
  }

  function injectSubpageNav() {
    if (document.querySelector('.cfo-quicknav')) return;
    var nav = document.createElement('div');
    nav.className = 'cfo-quicknav';
    nav.style.cssText = [
      'position:fixed', 'top:80px', 'right:24px',
      'display:flex', 'gap:4px',
      'background:rgba(15,23,42,0.85)',
      '-webkit-backdrop-filter:blur(12px)', 'backdrop-filter:blur(12px)',
      'border:1px solid rgba(91,127,204,0.25)',
      'border-radius:24px', 'padding:5px',
      'z-index:9999',
      'font-family:Instrument Sans,-apple-system,sans-serif',
      'box-shadow:0 8px 24px rgba(0,0,0,0.3)',
    ].join(';');

    var path = window.location.pathname.replace(/\/$/, '') || '/cfo';
    var pages = [
      { url: '/cfo', label: 'Hub' },
      { url: '/cfo/pnl', label: 'P&L' },
      { url: '/cfo/cash', label: 'Cash' },
      { url: '/cfo/budget', label: 'Budget' },
      { url: '/cfo/forecast', label: 'Forecast' },
    ];

    pages.forEach(function(p) {
      var current = path === p.url;
      var btn = document.createElement('a');
      btn.href = p.url;
      btn.textContent = p.label;
      btn.style.cssText = [
        'padding:6px 14px', 'border-radius:18px',
        'font-size:11px', 'font-weight:600', 'letter-spacing:0.04em',
        'text-decoration:none', 'transition:all 0.15s',
        'color:' + (current ? '#fff' : 'rgba(255,255,255,0.55)'),
        'background:' + (current ? DENIM : 'transparent'),
      ].join(';');
      if (!current) {
        btn.addEventListener('mouseenter', function() {
          btn.style.color = '#fff';
          btn.style.background = 'rgba(91,127,204,0.2)';
        });
        btn.addEventListener('mouseleave', function() {
          btn.style.color = 'rgba(255,255,255,0.55)';
          btn.style.background = 'transparent';
        });
      }
      nav.appendChild(btn);
    });

    document.body.appendChild(nav);
    console.log('[CFO brain v4] Subpage quicknav injected (top-right)');
  }

  function paintSyncBadge(meta) {
    if (!meta) return;
    var existing = document.querySelector('.refresh-indicator');
    if (existing) {
      existing.textContent = meta.demo_mode ? 'Demo data' :
        (meta.last_sync_at ? 'Synced ' + new Date(meta.last_sync_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : 'Live');
    }
  }

  // ─────────────────────────────── ORCHESTRATOR ───────────────────────────────

  var lastData = null;

  function paintAll(data) {
    if (!data || !data.kpis) return;
    paintKPIs(data.kpis, data.deltas || {});
    paintPL(data.kpis);
    paintPLBars(data.bars || {});
    paintCashBars(data.cash_bars || []);
    paintCashPosition(data.kpis);
    paintSparklines(data.monthly_trend || []);
    paintSyncBadge(data.meta || {});
    wireSectionLinks();
    console.log('[CFO brain v4] paintAll complete', { revenue: data.kpis.revenue, net: data.kpis.net_income, cash: data.kpis.cash_position });
  }

  async function run() {
    // Inject the quicknav immediately, regardless of data fetch outcome
    injectSubpageNav();

    var token = await getToken();
    if (!token) { console.warn('[CFO brain v4] No auth token — redirecting to /login'); window.location.href = '/login'; return; }

    try {
      var resp = await fetch(BASE + '/cfo-command-center?view=hub', {
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      });
      if (resp.status === 401 || resp.status === 403) { window.location.href = '/login'; return; }
      if (!resp.ok) {
        console.error('[CFO brain v4] Hub fetch failed', resp.status);
        return;
      }
      var data = await resp.json();
      lastData = data;

      if (data.meta && data.meta.demo_mode) {
        console.log('[CFO brain v4] demo mode — designed values preserved');
        return;
      }

      paintAll(data);

      setTimeout(function() {
        if (lastData) {
          console.log('[CFO brain v4] re-firing paint @ 1500ms to win race');
          paintAll(lastData);
        }
      }, 1500);

    } catch (err) {
      console.error('[CFO brain v4] Error:', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
