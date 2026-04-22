/* Castford CFO Cash Brain v3 — tooltips on weekly + monthly + forecast bars */
(function() {
  'use strict';
  function fmt(v) { return window.CF.fmt(v); }
  var DENIM = '#5B7FCC', GREEN = '#22C55E', ROSE = '#EF4444';

  async function run() {
    var data = await window.CF.fetchView('cash');
    if (!data) return;
    window.CF.buildSyncBadge(data.meta);

    var s = data.summary || {};
    function setKPI(key, val, color) {
      var el = document.querySelector('[data-kpi="' + key + '"]');
      if (el) { el.textContent = val; if (color) el.style.color = color; }
    }
    setKPI('cash_position', fmt(s.cash_position));
    setKPI('working_capital', fmt(s.working_capital));
    setKPI('monthly_burn', s.monthly_burn === 0 ? 'Profitable' : fmt(s.monthly_burn) + '/mo');
    setKPI('runway', s.runway_months === null ? 'Indefinite' : s.runway_months + ' months',
      s.runway_months === null ? GREEN : s.runway_months < 6 ? ROSE : s.runway_months < 12 ? 'var(--amber)' : GREEN);

    // ── CCC ──
    var cccBlock = document.getElementById('ccc-block');
    if (cccBlock) {
      var ccc = data.ccc;
      if (!ccc) {
        cccBlock.innerHTML = '<div style="color:var(--text-3);padding:20px 0">CCC requires AR and AP tables.</div>';
      } else {
        cccBlock.innerHTML =
          '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px">' +
            ['DSO','DIO','DPO','CCC'].map(function(k, i) {
              var v = ccc[k.toLowerCase()];
              var labels = {DSO:'Days Sales Outstanding', DIO:'Days Inventory Outstanding', DPO:'Days Payable Outstanding', CCC:'DSO + DIO − DPO'};
              var isMain = k === 'CCC';
              return '<div><div class="k-label" style="font-size:10px;color:' + (isMain?DENIM:'var(--text-3)') + ';text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px">' + k + '</div>' +
                '<div style="font-family:Geist Mono,monospace;font-size:28px;color:' + (isMain?DENIM:'var(--text-1)') + ';' + (isMain?'font-weight:700':'') + '">' + v + ' <span style="font-size:14px;color:' + (isMain?'var(--text-2)':'var(--text-3)') + '">days</span></div>' +
                '<div style="font-size:11px;color:var(--text-3);margin-top:4px">' + labels[k] + '</div></div>';
            }).join('') +
          '</div>' +
          (ccc.note ? '<div style="margin-top:12px;padding:10px 12px;background:rgba(196,136,74,0.08);border-left:2px solid var(--gold);font-size:11px;color:var(--text-2);line-height:1.5"><strong style="color:var(--text-1)">Note:</strong> ' + ccc.note + '</div>' : '');
      }
    }

    // ── 13-week forecast (combined chart) ──
    var fcWrap = document.getElementById('cash-forecast');
    if (fcWrap) {
      var hist = data.weekly_history || [];
      var fc = data.weekly_forecast || [];
      var combined = hist.concat(fc);
      if (!combined.length) {
        fcWrap.innerHTML = '<div style="color:var(--text-3);padding:20px 0">No weekly data yet.</div>';
      } else {
        var maxNet = Math.max.apply(null, combined.map(function(w) { return Math.abs(w.net); }));
        fcWrap.innerHTML = '<div style="display:flex;align-items:flex-end;justify-content:space-between;height:180px;gap:2px;padding:20px 0;border-bottom:1px solid var(--panel-border);position:relative">' +
          '<div style="position:absolute;left:0;right:0;top:50%;border-top:1px dashed var(--panel-border)"></div>' +
          combined.map(function(w, i) {
            var pct = maxNet > 0 ? Math.abs(w.net) / maxNet * 50 : 0;
            var pos = w.net >= 0;
            var color = w.forecast ? (pos ? 'rgba(91,127,204,0.7)' : 'rgba(239,68,68,0.6)') : (pos ? GREEN : ROSE);
            var border = w.forecast ? 'border:1px dashed rgba(91,127,204,0.5)' : '';
            return '<div data-idx="' + i + '" class="cash-fc-bar" style="flex:1;min-width:8px;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:center;cursor:pointer">' +
              '<div style="width:100%;height:50%;display:flex;align-items:flex-end">' + (pos ? '<div style="width:100%;height:' + pct*2 + '%;background:' + color + ';' + border + ';border-radius:1px 1px 0 0;transition:height 0.6s"></div>' : '') + '</div>' +
              '<div style="width:100%;height:50%;display:flex;align-items:flex-start">' + (!pos ? '<div style="width:100%;height:' + pct*2 + '%;background:' + color + ';' + border + ';border-radius:0 0 1px 1px;transition:height 0.6s"></div>' : '') + '</div>' +
              '</div>';
          }).join('') + '</div>' +
          '<div style="display:flex;justify-content:space-between;padding-top:12px;font-size:10px;color:var(--text-3)"><span>13 weeks history</span><span style="border-left:2px dashed var(--denim);padding-left:6px">→ 13 weeks forecast</span></div>';

        // Wire tooltips to combined bars
        document.querySelectorAll('.cash-fc-bar').forEach(function(bar) {
          var idx = parseInt(bar.dataset.idx, 10);
          var w = combined[idx];
          if (!w) return;
          var color = w.net >= 0 ? GREEN : ROSE;
          window.CF.tooltip.attach(bar,
            '<div style="font-weight:700;color:' + DENIM + ';margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em">Week of ' + w.week + (w.forecast ? ' · forecast' : '') + '</div>' +
            '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:2px">Inflow: <span style="color:' + GREEN + '">' + fmt(w.inflow) + '</span></div>' +
            '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:6px">Outflow: <span style="color:' + ROSE + '">' + fmt(w.outflow) + '</span></div>' +
            '<div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-family:Geist Mono,monospace;font-size:14px">Net: <span style="color:' + color + ';font-weight:700">' + fmt(w.net) + '</span></div>'
          );
        });
      }
    }

    // ── Weekly history (inline rows) ──
    var weeklyWrap = document.getElementById('cash-weekly');
    if (weeklyWrap) {
      var weeks = data.weekly_history || [];
      if (!weeks.length) {
        weeklyWrap.innerHTML = '<div style="color:var(--text-3);padding:20px 0">No weekly data yet.</div>';
      } else {
        var max = Math.max.apply(null, weeks.map(function(w) { return Math.max(w.inflow, w.outflow); }));
        weeklyWrap.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">' +
          weeks.map(function(w) {
            var inPct = max > 0 ? w.inflow / max * 100 : 0;
            var outPct = max > 0 ? w.outflow / max * 100 : 0;
            return '<div style="display:grid;grid-template-columns:60px 1fr 70px 1fr 70px;gap:8px;align-items:center;font-size:11px">' +
              '<div style="color:var(--text-3);font-family:Geist Mono,monospace">' + w.week.slice(5) + '</div>' +
              '<div style="height:5px;background:rgba(34,197,94,0.1);position:relative"><div style="width:' + inPct + '%;height:100%;background:' + GREEN + ';transition:width 0.8s"></div></div>' +
              '<div style="color:' + GREEN + ';font-family:Geist Mono,monospace;text-align:right">' + fmt(w.inflow) + '</div>' +
              '<div style="height:5px;background:rgba(239,68,68,0.1);position:relative"><div style="width:' + outPct + '%;height:100%;background:' + ROSE + ';transition:width 0.8s"></div></div>' +
              '<div style="color:' + ROSE + ';font-family:Geist Mono,monospace;text-align:right">' + fmt(w.outflow) + '</div>' +
              '</div>';
          }).join('') + '</div>';
      }
    }

    // ── Monthly net cash with tooltips ──
    var monthlyWrap = document.getElementById('cash-monthly');
    if (monthlyWrap) {
      var monthly = data.monthly_net || [];
      if (!monthly.length) {
        monthlyWrap.innerHTML = '<div style="color:var(--text-3);padding:20px 0">No monthly data yet.</div>';
      } else {
        var absMax = Math.max.apply(null, monthly.map(function(m) { return Math.abs(m.net); }));
        monthlyWrap.innerHTML = '<div style="display:flex;align-items:flex-end;justify-content:space-between;height:160px;gap:4px;padding:20px 0;border-bottom:1px solid var(--panel-border)">' +
          monthly.map(function(m, i) {
            var pctH = absMax > 0 ? Math.abs(m.net) / absMax * 100 : 0;
            var isPos = m.net >= 0;
            return '<div data-idx="' + i + '" class="cash-monthly-bar" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer">' +
              '<div style="height:100%;width:100%;display:flex;align-items:' + (isPos ? 'flex-end' : 'flex-start') + ';position:relative">' +
              '<div style="width:100%;height:' + pctH + '%;background:' + (isPos ? 'linear-gradient(to top,#22C55E,#4ADE80)' : 'linear-gradient(to bottom,#EF4444,#FCA5A5)') + ';transition:height 0.8s ease"></div>' +
              '</div>' +
              '<div style="font-size:10px;color:var(--text-3);font-family:Geist Mono,monospace">' + m.label + '</div>' +
              '</div>';
          }).join('') + '</div>';

        // Wire tooltips
        document.querySelectorAll('.cash-monthly-bar').forEach(function(bar) {
          var idx = parseInt(bar.dataset.idx, 10);
          var m = monthly[idx];
          if (!m) return;
          var color = m.net >= 0 ? GREEN : ROSE;
          window.CF.tooltip.attach(bar,
            '<div style="font-weight:700;color:' + DENIM + ';margin-bottom:6px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em">' + m.label + ' ' + m.month + '</div>' +
            '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:2px">Revenue: <span style="color:#fff">' + fmt(m.revenue) + '</span></div>' +
            '<div style="font-family:Geist Mono,monospace;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:6px">OpEx: <span style="color:#fff">' + fmt(m.opex) + '</span></div>' +
            '<div style="padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);font-family:Geist Mono,monospace;font-size:14px">Net: <span style="color:' + color + ';font-weight:700">' + fmt(m.net) + '</span></div>'
          );
        });
      }
    }
    console.log('[CFO Cash brain v3] painted with tooltips', { weeks: (data.weekly_history||[]).length });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
