/* Castford Dashboard Wire v1 — Auto-connects page elements to live brain data
   Runs after castford-api.js. Detects which dashboard page is loaded and
   fetches the appropriate data from edge functions.

   Usage: <script src="/site/dashboard-wire.js" defer></script>
   Requires: castford-api.js loaded first
*/

(function() {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function() {
    if (!window.cfapi) return;
    const api = window.cfapi;
    const path = window.location.pathname;

    // === BILLING PAGE ===
    if (path.includes('billing')) {
      wireBilling(api);
    }

    // === ALERTS PAGE ===
    if (path.includes('alerts')) {
      wireAlerts(api);
    }

    // === REPORTS PAGE ===
    if (path.includes('reports')) {
      wireReports(api);
    }

    // === NOTIFICATIONS PAGE ===
    if (path.includes('notifications')) {
      wireNotifications(api);
    }

    // === COMMAND CENTER / CFO DASHBOARD ===
    if (path.includes('command-center') || path.includes('cfo')) {
      wireCommandCenter(api);
    }

    // === WORKSPACE ===
    if (path.includes('workspace')) {
      wireWorkspace(api);
    }
  });

  // === BILLING WIRING ===
  async function wireBilling(api) {
    const data = await api.currentPlan();
    if (data.error) return;

    // Plan name
    const planEl = document.querySelector('[data-bind="plan-name"]');
    if (planEl) planEl.textContent = (data.org?.plan || 'demo').charAt(0).toUpperCase() + (data.org?.plan || 'demo').slice(1);

    // AI model badge
    const modelEl = document.querySelector('[data-bind="ai-model"]');
    if (modelEl) {
      modelEl.textContent = data.org?.ai_model_display || 'Claude Sonnet 4.6';
      if ((data.org?.ai_model || '').includes('opus')) modelEl.classList.add('premium-badge');
    }

    // Usage meters
    const usage = data.usage || {};
    bindUsageMeter('seats', usage.seats);
    bindUsageMeter('copilot', usage.copilot_queries);
    bindUsageMeter('integrations', usage.integrations);
    bindUsageMeter('entities', usage.entities);

    // Manage billing button
    const manageBtn = document.querySelector('[data-action="manage-billing"]');
    if (manageBtn) {
      manageBtn.addEventListener('click', async function() {
        const portal = await api.openBillingPortal();
        if (portal.url) window.open(portal.url, '_blank');
        else if (portal.redirect) window.location.href = portal.redirect;
      });
    }

    // Upgrade buttons
    document.querySelectorAll('[data-action="upgrade"]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        const plan = btn.dataset.plan || 'growth';
        const interval = btn.dataset.interval || 'monthly';
        const checkout = await api.createCheckout(plan, interval);
        if (checkout.url) window.location.href = checkout.url;
      });
    });
  }

  function bindUsageMeter(key, usage) {
    if (!usage) return;
    const bar = document.querySelector('[data-meter="' + key + '"]');
    const label = document.querySelector('[data-meter-label="' + key + '"]');
    if (bar) {
      const pct = usage.unlimited ? 0 : Math.min(100, Math.round(usage.used / usage.limit * 100));
      bar.style.width = pct + '%';
      if (pct > 80) bar.classList.add('meter-warning');
      if (pct > 95) bar.classList.add('meter-critical');
    }
    if (label) {
      label.textContent = usage.unlimited ? usage.used + ' / Unlimited' : usage.used + ' / ' + usage.limit;
    }
  }

  // === ALERTS WIRING ===
  async function wireAlerts(api) {
    const container = document.querySelector('[data-bind="alerts-list"]');
    if (!container) return;
    container.innerHTML = '<div class="cf-loading" style="min-height:100px"></div>';

    const data = await api.alerts();
    if (data.error) { container.innerHTML = '<p>Unable to load alerts.</p>'; return; }

    const alerts = data.alerts || data.financial_alerts || [];
    if (!alerts.length) { container.innerHTML = '<p>No active alerts. Your financials look healthy.</p>'; return; }

    container.innerHTML = alerts.map(function(a) {
      const severity = a.severity || 'medium';
      const colors = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#65a30d' };
      return '<div class="alert-card" style="border-left:4px solid ' + (colors[severity] || '#6b7280') + ';padding:16px;margin-bottom:12px;background:var(--surface, #f8fafc);border-radius:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<strong>' + (a.title || a.alert_type || 'Alert') + '</strong>' +
        '<span style="font-size:12px;color:' + (colors[severity] || '#6b7280') + ';font-weight:600;text-transform:uppercase">' + severity + '</span></div>' +
        '<p style="margin:8px 0 0;font-size:14px;color:var(--text-secondary, #64748b)">' + (a.description || a.message || '') + '</p>' +
        (a.deviation_pct ? '<span style="font-size:13px;color:var(--text-tertiary, #94a3b8)">Deviation: ' + a.deviation_pct + '%</span>' : '') +
        '</div>';
    }).join('');
  }

  // === REPORTS WIRING ===
  async function wireReports(api) {
    const container = document.querySelector('[data-bind="reports-list"]');
    if (!container) return;

    const data = await api.listReports();
    const reports = data.reports || [];
    if (!reports.length) { container.innerHTML = '<p>No reports generated yet.</p>'; return; }

    container.innerHTML = reports.map(function(r) {
      const kpis = r.kpis || {};
      return '<div class="report-card" style="padding:20px;margin-bottom:16px;background:var(--surface, #f8fafc);border-radius:12px;border:1px solid var(--border, #e2e8f0)">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div><strong style="font-size:16px">' + (r.title || 'Financial Report') + '</strong>' +
        '<p style="margin:4px 0 0;font-size:13px;color:var(--text-secondary, #64748b)">' + (r.period || '') + ' | ' + (r.report_type || '').replace('_', ' ') + '</p></div>' +
        '<span style="font-size:12px;color:var(--text-tertiary, #94a3b8)">' + new Date(r.created_at).toLocaleDateString() + '</span></div>' +
        (kpis.revenue ? '<div style="display:flex;gap:24px;margin-top:12px;font-size:14px"><span>Revenue: <strong>' + CastfordAPI.fmt(kpis.revenue) + '</strong></span><span>NI: <strong>' + CastfordAPI.fmt(kpis.net_income) + '</strong></span><span>Margin: <strong>' + kpis.net_margin + '%</strong></span></div>' : '') +
        '</div>';
    }).join('');

    // Generate report button
    const genBtn = document.querySelector('[data-action="generate-report"]');
    if (genBtn) {
      genBtn.addEventListener('click', async function() {
        genBtn.disabled = true;
        genBtn.textContent = 'Generating...';
        await api.generateReport();
        genBtn.textContent = 'Generate New Report';
        genBtn.disabled = false;
        wireReports(api); // refresh
      });
    }
  }

  // === NOTIFICATIONS WIRING ===
  async function wireNotifications(api) {
    const container = document.querySelector('[data-bind="notifications-list"]');
    if (!container) return;

    const data = await api.getNotifications(30);
    const notifications = data.notifications || [];
    if (!notifications.length) { container.innerHTML = '<p>No notifications.</p>'; return; }

    container.innerHTML = notifications.map(function(n) {
      const icons = { alert: '\u26a0', billing: '\ud83d\udcb3', system: '\u2699', copilot: '\ud83e\udd16' };
      const icon = icons[n.category] || '\ud83d\udd14';
      return '<div class="notification-row" style="display:flex;gap:12px;padding:14px;border-bottom:1px solid var(--border, #e2e8f0);opacity:' + (n.read ? '0.6' : '1') + '">' +
        '<span style="font-size:20px">' + icon + '</span>' +
        '<div style="flex:1"><p style="margin:0;font-size:14px;font-weight:' + (n.read ? '400' : '600') + '">' + (n.title || n.message) + '</p>' +
        '<span style="font-size:12px;color:var(--text-tertiary, #94a3b8)">' + new Date(n.created_at).toLocaleString() + '</span></div></div>';
    }).join('');

    // Mark all read button
    const markBtn = document.querySelector('[data-action="mark-all-read"]');
    if (markBtn) {
      markBtn.addEventListener('click', async function() {
        await api.markAllRead();
        wireNotifications(api);
      });
    }
  }

  // === COMMAND CENTER WIRING ===
  async function wireCommandCenter(api) {
    // Fetch insights
    const insightsEl = document.querySelector('[data-bind="insights"]');
    if (insightsEl) {
      const data = await api.insights();
      if (data.insights) {
        insightsEl.innerHTML = data.insights.map(function(i) {
          return '<div style="padding:12px;margin-bottom:8px;background:var(--surface, #f8fafc);border-radius:8px;font-size:14px">' + i.text + '</div>';
        }).join('');
      }
    }

    // Compliance score
    const compEl = document.querySelector('[data-bind="compliance-score"]');
    if (compEl) {
      const data = await api.complianceStatus();
      if (data.score !== undefined) {
        compEl.textContent = data.score + '%';
        compEl.dataset.grade = data.grade || 'D';
      }
    }

    // Cash flow summary
    const cfEl = document.querySelector('[data-bind="cashflow"]');
    if (cfEl) {
      const data = await api.cashflow('summary');
      if (data.free_cash_flow) {
        cfEl.innerHTML = '<span>FCF: <strong>' + data.free_cash_flow + '</strong></span> <span>Margin: ' + data.fcf_margin + '</span> <span>Conversion: ' + data.cash_conversion + '</span>';
      }
    }
  }

  // === WORKSPACE WIRING ===
  async function wireWorkspace(api) {
    const tasksEl = document.querySelector('[data-bind="tasks-list"]');
    if (tasksEl) {
      const data = await api.listTasks();
      const tasks = data.tasks || [];
      tasksEl.innerHTML = tasks.length ? tasks.map(function(t) {
        const priorityColors = { critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#22c55e' };
        return '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-bottom:1px solid var(--border, #e2e8f0)">' +
          '<div style="width:10px;height:10px;border-radius:50%;background:' + (priorityColors[t.priority] || '#6b7280') + '"></div>' +
          '<div style="flex:1"><strong style="font-size:14px">' + t.title + '</strong>' +
          (t.due_date ? '<span style="font-size:12px;color:var(--text-tertiary, #94a3b8);margin-left:8px">Due ' + t.due_date + '</span>' : '') +
          '</div><span style="font-size:12px;text-transform:capitalize;color:var(--text-secondary, #64748b)">' + (t.status || 'open') + '</span></div>';
      }).join('') : '<p style="padding:16px;color:var(--text-secondary, #64748b)">No tasks yet. Use the Copilot to create tasks.</p>';
    }
  }
})();
