/* Castford CFO Budget Brain v3 — variance bar tooltips */
(function() {
  'use strict';
  function fmt(v) { return window.CF.fmt(v); }
  var DENIM = '#5B7FCC', GREEN = '#22C55E', ROSE = '#EF4444';

  async function run() {
    var data = await window.CF.fetchView('budget');
    if (!data) return;
    window.CF.buildSyncBadge(data.meta);

    var totals = data.totals || {};
    function setKPI(key, val, color) {
      var el = document.querySelector('[data-kpi="' + key + '"]');
      if (el) { el.textContent = val; if (color) el.style.color = color; }
    }
    setKPI('actual', fmt(totals.actual));
    setKPI('budget', fmt(totals.budget));
    setKPI('variance', fmt(totals.variance), totals.variance > 0 ? ROSE : GREEN);
    setKPI('variance_pct', totals.variance_pct !== null ? (totals.variance_pct >= 0 ? '+' : '') + totals.variance_pct.toFixed(1) + '%' : '—',
      totals.variance_pct > 0 ? ROSE : GREEN);

    // Commentary
    var commentary = data.commentary || [];
    var cWrap = document.getElementById('commentary-text');
    if (cWrap) {
      cWrap.innerHTML = commentary.length
        ? commentary.map(function(c) { return '<p style="margin:0 0 8px">' + c + '</p>'; }).join('')
        : '<div style="color:var(--text-3)">No commentary available.</div>';
    }

    // Top 5 drivers
    var topDrivers = data.top_drivers || [];
    var topWrap = document.getElementById('top-drivers');
    if (topWrap) {
      if (!topDrivers.length) {
        topWrap.innerHTML = '<div style="color:var(--text-3);padding:20px 0;text-align:center">No variance data yet.</div>';
      } else {
        var maxAbs = Math.max.apply(null, topDrivers.map(function(d){return Math.abs(d.variance);}));
        topWrap.innerHTML = '<div style="display:flex;flex-direction:column;gap:10px">' +
          topDrivers.map(function(d, i) {
            var color = d.direction === 'over' ? ROSE : GREEN;
            var bg = d.direction === 'over' ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)';
            var pct = maxAbs > 0 ? Math.abs(d.variance) / maxAbs * 100 : 0;
            return '<div data-idx="' + i + '" class="driver-card" style="background:' + bg + ';padding:14px 16px;border-left:3px solid ' + color + ';border-radius:1px;cursor:pointer;transition:transform 0.15s">' +
              '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px">' +
                '<div>' +
                  '<div style="font-size:10px;color:var(--text-3);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">#' + (i+1) + ' · ' + d.share_of_total_variance + '% of total variance</div>' +
                  '<div style="font-size:15px;font-weight:600;color:var(--text-1)">' + d.name + '</div>' +
                '</div>' +
                '<div style="text-align:right">' +
                  '<div style="font-family:Geist Mono,monospace;font-size:18px;color:' + color + ';font-weight:600">' + (d.variance >= 0 ? '+' : '') + fmt(d.variance) + '</div>' +
                  '<div style="font-size:11px;color:var(--text-3);margin-top:2px">' + (d.variance_pct !== null ? (d.variance_pct >= 0 ? '+' : '') + d.variance_pct.toFixed(1) + '% vs budget' : '') + '</div>' +
                '</div>' +
              '</div>' +
              '<div style="height:4px;background:rgba(255,255,255,0.05);border-radius:1px;position:relative">' +
                '<div style="width:' + pct + '%;height:100%;background:' + color + ';transition:width 0.8s ease"></div>' +
              '</div>' +
              '</div>';
          }).join('') + '</div>';

        // Tooltip on each driver card
        document.querySelectorAll('.driver-card').forEach(function(card) {
          var idx = parseInt(card.dataset.idx, 10);
          var d = topDrivers[idx];
          if (!d) return;
          card.addEventListener('mouseenter', function() { card.style.transform = 'translateX(4px)'; });
          card.addEventListener('mouseleave', function() { card.style.transform = ''; });
          window.CF.tooltip.attach(card,
            '<div style="font-weight:700;color:' + DENIM + ';margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em">' + d.name + '</div>' +
            '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:2px">Actual: <span style="color:#fff">' + fmt(d.actual) + '</span></div>' +
            '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:6px">Budget: <span style="color:#fff">' + fmt(d.budget) + '</span></div>' +
            '<div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-family:Geist Mono,monospace;font-size:14px">Variance: <span style="color:' + (d.variance > 0 ? ROSE : GREEN) + ';font-weight:700">' + (d.variance >= 0 ? '+' : '') + fmt(d.variance) + '</span></div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:6px">Drives ' + d.share_of_total_variance + '% of total variance</div>'
          );
        });
      }
    }

    // Full table
    var rows = data.rows || [];
    var wrap = document.getElementById('budget-table');
    if (!wrap) return;
    var filtered = rows.filter(function(r) { return r.actual > 0 || r.budget > 0; });
    if (!filtered.length) {
      wrap.innerHTML = '<div style="color:var(--text-3);padding:40px 0;text-align:center">No budget data yet.</div>';
      return;
    }
    var maxVar = Math.max.apply(null, filtered.map(function(r){return Math.abs(r.variance);}));
    wrap.innerHTML = '<table class="cfo-table"><thead><tr>' +
      '<th style="min-width:200px">Account</th><th>Type</th>' +
      '<th class="num">Actual</th><th class="num">Budget</th>' +
      '<th class="num">Variance</th><th class="num">Var %</th><th style="width:140px">Scale</th>' +
      '</tr></thead><tbody>' +
      filtered.map(function(r, i) {
        var vc = r.variance > 0 ? 'cfo-var-neg' : 'cfo-var-pos';
        var pct = maxVar > 0 ? Math.abs(r.variance) / maxVar * 100 : 0;
        var bc = r.variance > 0 ? ROSE : GREEN;
        var tl = r.type === 'revenue' || r.type === 'other_income' ? 'Revenue' : r.type === 'cost_of_revenue' ? 'COGS' : 'OpEx';
        return '<tr data-idx="' + i + '" class="budget-row">' +
          '<td>' + r.name + '</td>' +
          '<td style="color:var(--text-3);font-size:11px;text-transform:uppercase;letter-spacing:0.08em">' + tl + '</td>' +
          '<td class="num">' + fmt(r.actual) + '</td>' +
          '<td class="num" style="color:var(--text-3)">' + (r.budget > 0 ? fmt(r.budget) : '—') + '</td>' +
          '<td class="num ' + vc + '" style="font-weight:600">' + (r.variance >= 0 ? '+' : '') + fmt(r.variance) + '</td>' +
          '<td class="num ' + vc + '">' + (r.variance_pct !== null ? (r.variance_pct >= 0 ? '+' : '') + r.variance_pct.toFixed(1) + '%' : '—') + '</td>' +
          '<td><div class="cfo-bar-track"><div class="cfo-bar-fill" style="width:' + pct + '%;background:' + bc + '"></div></div></td>' +
        '</tr>';
      }).join('') +
      '</tbody></table>';

    // Tooltips on each row
    document.querySelectorAll('.budget-row').forEach(function(tr) {
      var idx = parseInt(tr.dataset.idx, 10);
      var r = filtered[idx];
      if (!r) return;
      window.CF.tooltip.attach(tr,
        '<div style="font-weight:700;color:' + DENIM + ';margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em">' + r.name + '</div>' +
        '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:2px">Actual spend: <span style="color:#fff">' + fmt(r.actual) + '</span></div>' +
        '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:6px">Budget: <span style="color:#fff">' + fmt(r.budget) + '</span></div>' +
        '<div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-family:Geist Mono,monospace;font-size:13px">' +
          (r.variance > 0 ? '<span style="color:' + ROSE + '">Over budget by ' + fmt(Math.abs(r.variance)) : '<span style="color:' + GREEN + '">Under budget by ' + fmt(Math.abs(r.variance))) +
          (r.variance_pct !== null ? ' (' + (r.variance_pct >= 0 ? '+' : '') + r.variance_pct.toFixed(1) + '%)' : '') + '</span></div>'
      );
    });
    console.log('[CFO Budget brain v3] painted with tooltips', { drivers: topDrivers.length, rows: filtered.length });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
