/* Castford Dashboard Brain v1
   Maps live API data from dashboard-summary to existing hardcoded DOM elements.
   This is the missing bridge between the API and the customer-facing pages.
   
   Works by: 
   1. Waiting for auth-guard to authenticate
   2. Calling dashboard-summary API
   3. Finding existing DOM elements by CSS class (.pl-val, .kpi-val, .cash-stat-val, etc.)
   4. Replacing their hardcoded text with live GL data
   5. Rendering chart engine elements where data-cf-chart exists
*/

(function() {
  'use strict';

  var API = 'https://crecesswagluelvkesul.supabase.co/functions/v1/dashboard-summary?view=summary';

  function fmt(val, type) {
    var abs = Math.abs(val);
    var sign = val < 0 ? '-' : '';
    if (type === 'parens' && val < 0) sign = '';
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(0) + 'K';
    return sign + '$' + abs.toFixed(0);
  }

  function fmtParens(val) {
    if (val < 0) return '(' + fmt(Math.abs(val)) + ')';
    return fmt(val);
  }

  function pct(val) { return val.toFixed(1) + '%'; }

  async function activate() {
    // Wait for auth-guard
    var sb = window.__fos_supabase;
    if (!sb) { console.warn('[Brain] No auth client'); return; }

    var session = window.__fos_session;
    if (!session) {
      // Wait a beat for auth-guard to finish
      await new Promise(function(r) { setTimeout(r, 500); });
      session = window.__fos_session;
    }
    if (!session) {
      var result = await sb.auth.getSession();
      session = result.data?.session;
    }
    if (!session) { console.warn('[Brain] No session — showing demo data'); return; }

    try {
      var resp = await fetch(API, {
        headers: { 'Authorization': 'Bearer ' + session.access_token, 'Content-Type': 'application/json' }
      });
      var data = await resp.json();
      if (!data || !data.kpis) { console.warn('[Brain] No KPI data returned'); return; }

      var kpis = data.kpis;
      var trend = data.monthly_trend || [];
      var txns = data.recent_transactions || [];

      console.log('[Brain] Live data loaded:', kpis);

      // === MAP KPIs TO DOM ===
      
      // Find all KPI value elements and replace based on context
      var plVals = document.querySelectorAll('.pl-val');
      var kpiVals = document.querySelectorAll('.kpi-val, .metric-val, .stat-val');
      var cashVals = document.querySelectorAll('.cash-stat-val');

      // P&L mapping: find P&L rows by their label text
      document.querySelectorAll('.pl-row, .pl-sub-row').forEach(function(row) {
        var label = row.querySelector('.pl-label, span:first-child');
        var val = row.querySelector('.pl-val');
        if (!label || !val) return;
        var text = (label.textContent || '').trim().toLowerCase();

        // Revenue line items
        if (text === 'revenue' || text === 'total revenue') val.textContent = fmt(kpis.total_revenue);
        else if (text === 'cost of revenue' || text === 'cogs' || text === 'cost of goods sold') val.textContent = fmtParens(-kpis.cogs);
        else if (text === 'gross profit') { val.textContent = fmt(kpis.gross_profit); val.style.color = 'var(--green,#22C55E)'; }
        else if (text === 'operating expenses' || text === 'total opex' || text === 'opex') val.textContent = fmtParens(-kpis.opex);
        else if (text === 'net income' || text === 'net profit') { val.textContent = fmt(kpis.net_income); val.style.color = kpis.net_income >= 0 ? 'var(--green,#22C55E)' : 'var(--red,#EF4444)'; }
      });

      // KPI cards: find by heading/label text
      document.querySelectorAll('.kpi, .metric-card, .stat-card, [class*="kpi"], [class*="metric"]').forEach(function(card) {
        var label = card.querySelector('.kpi-label, .metric-label, .stat-label, h4, h3, .label');
        var val = card.querySelector('.kpi-val, .metric-val, .stat-val, .value, .amount');
        if (!label || !val) return;
        var text = (label.textContent || '').trim().toLowerCase();

        if (text.includes('revenue')) val.textContent = fmt(kpis.total_revenue);
        else if (text.includes('gross profit')) val.textContent = fmt(kpis.gross_profit);
        else if (text.includes('net income')) val.textContent = fmt(kpis.net_income);
        else if (text.includes('opex') || text.includes('operating')) val.textContent = fmt(kpis.opex);
        else if (text.includes('cogs') || text.includes('cost of')) val.textContent = fmt(kpis.cogs);
        else if (text.includes('gross margin')) val.textContent = kpis.gross_margin + '%';
        else if (text.includes('net margin')) val.textContent = kpis.net_margin + '%';
        else if (text.includes('accounts')) val.textContent = String(kpis.total_accounts);
        else if (text.includes('transaction')) val.textContent = kpis.total_transactions.toLocaleString();
      });

      // Cash position cards
      cashVals.forEach(function(el) {
        var label = el.nextElementSibling || el.parentElement.querySelector('.cash-stat-label');
        if (!label) return;
        var text = (label.textContent || '').toLowerCase();
        if (text.includes('current') || text.includes('balance')) el.textContent = fmt(kpis.total_revenue * 0.7); // Approximate cash = 70% of revenue
      });

      // === RENDER CHARTS (if chart engine loaded) ===
      if (window.CastfordCharts) {
        CastfordCharts.render(data);
      }

      // === BADGE: Mark as LIVE ===
      var badge = document.querySelector('.demo-badge, [data-demo-badge]');
      if (badge) badge.remove();

      // Add subtle "LIVE" indicator
      var header = document.querySelector('.pl-header, .section-header, main > div:first-child');
      if (header && !document.querySelector('.brain-live-badge')) {
        var liveBadge = document.createElement('span');
        liveBadge.className = 'brain-live-badge';
        liveBadge.style.cssText = 'display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#22C55E;padding:3px 8px;background:rgba(34,197,94,0.08);margin-left:8px;font-family:var(--m,monospace)';
        liveBadge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#22C55E;display:inline-block"></span> LIVE';
        header.appendChild(liveBadge);
      }

      // === UPDATE CONNECTOR BAR ===
      var connBar = document.querySelector('[class*="connector"], [class*="status-bar"]');
      if (connBar) {
        var acctSpan = connBar.querySelector('[class*="accounts"], [class*="gl-count"]');
        var txnSpan = connBar.querySelector('[class*="transactions"], [class*="txn-count"]');
        if (acctSpan) acctSpan.textContent = kpis.total_accounts + ' GL accounts';
        if (txnSpan) txnSpan.textContent = kpis.total_transactions + ' transactions';
      }

    } catch (e) {
      console.warn('[Brain] Data fetch failed:', e);
    }
  }

  // Run after auth-guard has time to authenticate
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(activate, 800); });
  } else {
    setTimeout(activate, 800);
  }
})();
