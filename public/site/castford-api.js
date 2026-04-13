/* Castford API v1 — Unified Edge Function Client
   Provides typed methods for every brain in the Castford backend.
   Auto-handles auth, CORS, error handling, and loading states.

   Usage:
     <script src="/site/castford-api.js" defer></script>
     const api = new CastfordAPI();
     const forecast = await api.forecast({ periods: 6 });
     const cashflow = await api.cashflow('summary');
*/

(function() {
  'use strict';

  const BASE = 'https://crecesswagluelvkesul.supabase.co/functions/v1';
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyZWNlc3N3YWdsdWVsdmtlc3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDI4NTgsImV4cCI6MjA4OTQ3ODg1OH0.dFJHfGixRS7ZDHbPqNuzVdRigVqmiPJwD8LFkZYqhIQ';

  class CastfordAPI {
    constructor() {
      this._token = null;
      this._refreshToken();
    }

    _refreshToken() {
      try {
        const raw = localStorage.getItem('sb-crecesswagluelvkesul-auth-token');
        if (raw) {
          const parsed = JSON.parse(raw);
          this._token = parsed?.access_token || null;
        }
      } catch(e) { /* no auth */ }
    }

    _headers() {
      this._refreshToken();
      const h = { 'Content-Type': 'application/json', 'apikey': ANON_KEY };
      if (this._token) h['Authorization'] = 'Bearer ' + this._token;
      return h;
    }

    async _post(fn, body = {}) {
      try {
        const res = await fetch(BASE + '/' + fn, {
          method: 'POST', headers: this._headers(), body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          return { error: err.error || res.statusText, status: res.status };
        }
        return await res.json();
      } catch(e) {
        return { error: e.message || 'Network error' };
      }
    }

    // === COPILOT ===
    async copilot(query, opts = {}) {
      return this._post('copilot', { query, history: opts.history, conversation_id: opts.conversation_id });
    }

    // === FORECASTING ===
    async forecast(opts = {}) {
      return this._post('generate-forecast', { periods: opts.periods || 6, account_type: opts.account_type || 'revenue', model: opts.model || 'all' });
    }

    // === ALERTS ===
    async alerts() {
      return this._post('alert-evaluator', { source: 'dashboard' });
    }

    // === INSIGHTS ===
    async insights() {
      return this._post('dashboard-insights', {});
    }

    // === DASHBOARD SUMMARY ===
    async summary() {
      return this._post('dashboard-summary', {});
    }

    // === CASH FLOW ===
    async cashflow(view = 'summary') {
      return this._post('cash-flow-brain', { action: view === 'full' ? 'generate' : view === 'trend' ? 'trend' : 'summary' });
    }

    // === BUDGET ===
    async budget(action = 'summary', opts = {}) {
      return this._post('budget-brain', { action, ...opts });
    }
    async budgetVariance(period) {
      return this._post('budget-brain', { action: 'variance', period });
    }

    // === SCENARIOS ===
    async scenarioTemplates() {
      return this._post('scenario-engine', { action: 'templates' });
    }
    async runScenario(assumptions) {
      return this._post('scenario-engine', { action: 'compute', assumptions });
    }
    async listScenarios() {
      return this._post('scenario-engine', { action: 'list' });
    }

    // === BENCHMARKS ===
    async benchmark(industry = 'saas') {
      return this._post('benchmark-compare', { industry });
    }

    // === REPORTS ===
    async generateReport(type = 'monthly_board', period) {
      return this._post('report-generate', { action: 'generate', report_type: type, period });
    }
    async listReports() {
      return this._post('report-generate', { action: 'list' });
    }

    // === COMPLIANCE ===
    async complianceStatus() {
      return this._post('compliance-brain', { action: 'status' });
    }
    async complianceControls() {
      return this._post('compliance-brain', { action: 'controls' });
    }
    async closeChecklist(period) {
      return this._post('compliance-brain', { action: 'close_checklist', period });
    }

    // === CONSOLIDATION ===
    async consolidate() {
      return this._post('consolidation-brain', { action: 'consolidate' });
    }
    async listEntities() {
      return this._post('consolidation-brain', { action: 'list_entities' });
    }

    // === xP&A ===
    async xpaOverview(fiscal_year) {
      return this._post('xpa-brain', { action: 'overview', fiscal_year });
    }
    async xpaDepartment(department, fiscal_year) {
      return this._post('xpa-brain', { action: 'department', department, fiscal_year });
    }
    async headcountPlan(fiscal_year) {
      return this._post('xpa-brain', { action: 'headcount_plan', fiscal_year });
    }
    async revenueBridge(fiscal_year) {
      return this._post('xpa-brain', { action: 'revenue_bridge', fiscal_year });
    }
    async opexWaterfall(fiscal_year) {
      return this._post('xpa-brain', { action: 'opex_waterfall', fiscal_year });
    }

    // === BILLING ===
    async currentPlan() {
      return this._post('billing-brain', { action: 'current_plan' });
    }
    async getPlans() {
      return this._post('billing-brain', { action: 'get_plans' });
    }
    async enforceFeature(feature) {
      return this._post('billing-brain', { action: 'enforce', feature });
    }
    async upgradePreview(target_plan, interval) {
      return this._post('billing-brain', { action: 'upgrade_preview', target_plan, interval });
    }
    async usageSummary() {
      return this._post('billing-brain', { action: 'usage_summary' });
    }

    // === BILLING PORTAL ===
    async openBillingPortal(return_url) {
      return this._post('billing-portal', { action: 'create_portal', return_url });
    }
    async createCheckout(plan, interval) {
      return this._post('billing-portal', { action: 'create_checkout', plan, interval });
    }

    // === WORKSPACE ===
    async listTasks() {
      return this._post('workspace-api', { action: 'list_tasks' });
    }
    async createTask(title, opts = {}) {
      return this._post('workspace-api', { action: 'create_task', title, ...opts });
    }
    async listMessages() {
      return this._post('workspace-api', { action: 'list_messages' });
    }

    // === NOTIFICATIONS ===
    async getNotifications(limit = 20) {
      return this._post('notify', { action: 'list', limit });
    }
    async markAllRead() {
      return this._post('notify', { action: 'mark_all_read' });
    }

    // === ONBOARDING ===
    async onboardingStatus() {
      return this._post('onboarding-brain', { action: 'status' });
    }

    // === CUSTOMER HEALTH (admin) ===
    async customerHealth() {
      return this._post('customer-health', {});
    }

    // === UTILITY: Loading state wrapper ===
    async withLoading(el, fn) {
      if (typeof el === 'string') el = document.getElementById(el);
      if (el) el.classList.add('cf-loading');
      try {
        const result = await fn();
        if (el) el.classList.remove('cf-loading');
        return result;
      } catch(e) {
        if (el) el.classList.remove('cf-loading');
        throw e;
      }
    }

    // === UTILITY: Format helpers ===
    static fmt(v) {
      const a = Math.abs(v);
      if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
      if (a >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
      return '$' + v.toFixed(0);
    }
    static pct(v) { return v.toFixed(1) + '%'; }
    static delta(v) { return (v >= 0 ? '+' : '') + CastfordAPI.fmt(v); }
  }

  // Expose globally
  window.CastfordAPI = CastfordAPI;
  window.cfapi = new CastfordAPI();

  // Add loading CSS
  const style = document.createElement('style');
  style.textContent = '.cf-loading{opacity:0.5;pointer-events:none;position:relative}.cf-loading::after{content:"";position:absolute;top:50%;left:50%;width:24px;height:24px;margin:-12px;border:3px solid rgba(30,64,175,0.2);border-top-color:#1e40af;border-radius:50%;animation:cf-spin .6s linear infinite}@keyframes cf-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
})();
