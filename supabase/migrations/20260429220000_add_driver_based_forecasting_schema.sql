-- ============================================================================
-- Driver-based forecasting: 4 new tables
--   drivers          — atomic input variables (e.g., customer_count, arpu)
--   driver_values    — period-level values, scenario-scoped
--   forecast_runs    — materialized forecast jobs
--   forecast_outputs — forecast results per account/period
-- All tables RLS-gated via current_user_org_id() and user_has_org_permission().
-- Live in production via Supabase MCP 2026-04-29; this commit aligns git
-- source-of-truth.
-- ============================================================================

-- ─── drivers ─────────────────────────────────────────────────────────────────
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('revenue','cost','headcount','unit_economics','workforce','general')),
  unit TEXT NOT NULL DEFAULT 'number'
    CHECK (unit IN ('number','currency','percentage','months','ratio')),
  source_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (source_type IN ('manual','formula','gl_actual','workforce')),
  formula TEXT,
  feeds_account_id UUID REFERENCES public.gl_accounts(id) ON DELETE SET NULL,
  default_value NUMERIC,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);
CREATE INDEX idx_drivers_org_active   ON public.drivers (org_id, is_active);
CREATE INDEX idx_drivers_org_category ON public.drivers (org_id, category, display_order);
COMMENT ON TABLE public.drivers IS
  'Atomic input variables for driver-based forecasting. Source types: manual (user enters), formula (combines other drivers), gl_actual (aggregates from gl_transactions), workforce (computed from workforce_* tables).';

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY drivers_select ON public.drivers FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());
CREATE POLICY drivers_insert ON public.drivers FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  );
CREATE POLICY drivers_update ON public.drivers FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  );
CREATE POLICY drivers_delete ON public.drivers FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'admin')
  );
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── driver_values ───────────────────────────────────────────────────────────
CREATE TABLE public.driver_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  value NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','calculated','imported','forecast')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- NULL scenario_id means "base assumption" — must be unique per driver+period
CREATE UNIQUE INDEX uniq_driver_values_base
  ON public.driver_values (org_id, driver_id, period)
  WHERE scenario_id IS NULL;
CREATE UNIQUE INDEX uniq_driver_values_scenario
  ON public.driver_values (org_id, driver_id, scenario_id, period)
  WHERE scenario_id IS NOT NULL;
CREATE INDEX idx_driver_values_lookup
  ON public.driver_values (org_id, scenario_id, period);
COMMENT ON TABLE public.driver_values IS
  'Period-level values for drivers. NULL scenario_id = base assumption used by every scenario unless overridden. Non-null scenario_id = scenario-specific override.';

ALTER TABLE public.driver_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY driver_values_select ON public.driver_values FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());
CREATE POLICY driver_values_insert ON public.driver_values FOR INSERT TO authenticated
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  );
CREATE POLICY driver_values_update ON public.driver_values FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  )
  WITH CHECK (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  );
CREATE POLICY driver_values_delete ON public.driver_values FOR DELETE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND public.user_has_org_permission(auth.uid(), org_id, 'editor')
  );
CREATE TRIGGER driver_values_updated_at BEFORE UPDATE ON public.driver_values
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ─── forecast_runs ───────────────────────────────────────────────────────────
CREATE TABLE public.forecast_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES public.scenarios(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  periods_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  drivers_evaluated INTEGER NOT NULL DEFAULT 0,
  outputs_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_forecast_runs_org_recent
  ON public.forecast_runs (org_id, created_at DESC);
CREATE INDEX idx_forecast_runs_scenario
  ON public.forecast_runs (org_id, scenario_id, created_at DESC);
COMMENT ON TABLE public.forecast_runs IS
  'Materialized forecast jobs. Each run corresponds to evaluating all drivers + formulas for a scenario over a date range.';

ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY forecast_runs_select ON public.forecast_runs FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());
-- Writes via service_role only (the edge function); no insert/update/delete policy for authenticated.


-- ─── forecast_outputs ────────────────────────────────────────────────────────
CREATE TABLE public.forecast_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  forecast_run_id UUID NOT NULL REFERENCES public.forecast_runs(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.gl_accounts(id) ON DELETE SET NULL,
  period TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  output_type TEXT NOT NULL DEFAULT 'driver'
    CHECK (output_type IN ('driver','account','rollup')),
  formula_evaluated TEXT,
  source_drivers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_forecast_outputs_run
  ON public.forecast_outputs (forecast_run_id, output_type, period);
CREATE INDEX idx_forecast_outputs_account_period
  ON public.forecast_outputs (org_id, account_id, period)
  WHERE account_id IS NOT NULL;
CREATE INDEX idx_forecast_outputs_driver_period
  ON public.forecast_outputs (org_id, driver_id, period)
  WHERE driver_id IS NOT NULL;
COMMENT ON TABLE public.forecast_outputs IS
  'Forecast results per period. output_type=driver: a driver value for the period. output_type=account: a P&L line item. output_type=rollup: aggregated totals (revenue, opex, net_income).';

ALTER TABLE public.forecast_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY forecast_outputs_select ON public.forecast_outputs FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());
-- Writes via service_role only.
