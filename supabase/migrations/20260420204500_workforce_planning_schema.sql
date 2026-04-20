-- Workforce planning schema
-- Applied via Supabase MCP on 2026-04-20. This file records the change in Git history.
-- Six tables for position-level workforce modeling, complementing department_plans aggregates.
-- Scoped by org_id with RLS matching the pattern of other Castford tables.

CREATE TABLE IF NOT EXISTS public.workforce_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  title text NOT NULL,
  department text NOT NULL,
  function_area text NOT NULL,
  level text,
  location text,
  is_approved boolean NOT NULL DEFAULT false,
  target_start_date date,
  target_comp_total numeric,
  gl_account_id uuid REFERENCES public.gl_accounts(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_positions_org ON public.workforce_positions(org_id);
CREATE INDEX IF NOT EXISTS idx_workforce_positions_entity ON public.workforce_positions(entity_id);
CREATE INDEX IF NOT EXISTS idx_workforce_positions_dept ON public.workforce_positions(org_id, department);

CREATE TABLE IF NOT EXISTS public.workforce_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_id uuid REFERENCES public.workforce_positions(id) ON DELETE SET NULL,
  entity_id uuid REFERENCES public.entities(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  employee_external_id text,
  hire_date date NOT NULL,
  termination_date date,
  manager_employee_id uuid REFERENCES public.workforce_employees(id) ON DELETE SET NULL,
  base_salary_annual numeric NOT NULL,
  bonus_target_annual numeric NOT NULL DEFAULT 0,
  equity_annual_value numeric NOT NULL DEFAULT 0,
  benefits_multiplier numeric NOT NULL DEFAULT 1.25,
  employment_type text NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'rippling', 'workday', 'gusto', 'csv_import', 'api')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_employees_org ON public.workforce_employees(org_id);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_position ON public.workforce_employees(position_id);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_status ON public.workforce_employees(org_id, status);
CREATE INDEX IF NOT EXISTS idx_workforce_employees_manager ON public.workforce_employees(manager_employee_id);

CREATE TABLE IF NOT EXISTS public.workforce_hiring_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position_id uuid REFERENCES public.workforce_positions(id) ON DELETE SET NULL,
  scenario_id uuid REFERENCES public.scenarios(id) ON DELETE SET NULL,
  budget_version_id uuid REFERENCES public.budget_versions(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date,
  fte_count numeric(10,2) NOT NULL DEFAULT 1.0 CHECK (fte_count >= 0),
  loaded_cost_monthly numeric,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'open', 'filled', 'cancelled', 'on_hold')),
  filled_by_employee_id uuid REFERENCES public.workforce_employees(id) ON DELETE SET NULL,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_hiring_plan_org ON public.workforce_hiring_plan(org_id);
CREATE INDEX IF NOT EXISTS idx_workforce_hiring_plan_scenario ON public.workforce_hiring_plan(scenario_id);
CREATE INDEX IF NOT EXISTS idx_workforce_hiring_plan_position ON public.workforce_hiring_plan(position_id);
CREATE INDEX IF NOT EXISTS idx_workforce_hiring_plan_period ON public.workforce_hiring_plan(org_id, period_start);

CREATE TABLE IF NOT EXISTS public.workforce_comp_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  function_area text NOT NULL,
  level text NOT NULL,
  location text NOT NULL,
  base_min numeric NOT NULL,
  base_mid numeric NOT NULL,
  base_max numeric NOT NULL,
  bonus_target_pct numeric NOT NULL DEFAULT 0 CHECK (bonus_target_pct >= 0),
  equity_range_min numeric NOT NULL DEFAULT 0,
  equity_range_max numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  effective_from date NOT NULL,
  effective_to date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (base_min <= base_mid AND base_mid <= base_max)
);

CREATE INDEX IF NOT EXISTS idx_workforce_comp_bands_org ON public.workforce_comp_bands(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workforce_comp_bands_unique ON public.workforce_comp_bands(org_id, function_area, level, location, effective_from);

CREATE TABLE IF NOT EXISTS public.workforce_ramp_curves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  function_area text,
  level text,
  month_number integer NOT NULL CHECK (month_number >= 1 AND month_number <= 36),
  productivity_pct numeric(5,4) NOT NULL CHECK (productivity_pct >= 0 AND productivity_pct <= 1),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_ramp_curves_org ON public.workforce_ramp_curves(org_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workforce_ramp_curves_unique ON public.workforce_ramp_curves(
  org_id, COALESCE(function_area, ''), COALESCE(level, ''), month_number
);

CREATE TABLE IF NOT EXISTS public.workforce_attrition_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  function_area text,
  level text,
  annual_rate numeric(5,4) NOT NULL CHECK (annual_rate >= 0 AND annual_rate <= 1),
  effective_from date NOT NULL,
  effective_to date,
  source text NOT NULL DEFAULT 'planned' CHECK (source IN ('historical', 'planned', 'industry_benchmark')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_attrition_org ON public.workforce_attrition_rates(org_id);
CREATE INDEX IF NOT EXISTS idx_workforce_attrition_effective ON public.workforce_attrition_rates(org_id, effective_from);

ALTER TABLE public.workforce_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_hiring_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_comp_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_ramp_curves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workforce_attrition_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workforce_positions_org_members" ON public.workforce_positions;
CREATE POLICY "workforce_positions_org_members" ON public.workforce_positions
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "workforce_employees_org_members" ON public.workforce_employees;
CREATE POLICY "workforce_employees_org_members" ON public.workforce_employees
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "workforce_hiring_plan_org_members" ON public.workforce_hiring_plan;
CREATE POLICY "workforce_hiring_plan_org_members" ON public.workforce_hiring_plan
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "workforce_comp_bands_org_members" ON public.workforce_comp_bands;
CREATE POLICY "workforce_comp_bands_org_members" ON public.workforce_comp_bands
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "workforce_ramp_curves_org_members" ON public.workforce_ramp_curves;
CREATE POLICY "workforce_ramp_curves_org_members" ON public.workforce_ramp_curves
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "workforce_attrition_rates_org_members" ON public.workforce_attrition_rates;
CREATE POLICY "workforce_attrition_rates_org_members" ON public.workforce_attrition_rates
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

COMMENT ON TABLE public.workforce_positions IS 'Job definitions. Filled or open requisitions. Position-level detail complementing department_plans aggregates.';
COMMENT ON TABLE public.workforce_employees IS 'Current and historical employees. Source of truth for headcount, comp, and ramp calculations.';
COMMENT ON TABLE public.workforce_hiring_plan IS 'Time-phased planned hires by period. Scenario-scoped for what-if modeling. Ties to budget_versions for approval workflow.';
COMMENT ON TABLE public.workforce_comp_bands IS 'Salary band definitions by function area, level, and location. Governs hiring approval range.';
COMMENT ON TABLE public.workforce_ramp_curves IS 'Productivity ramp profiles. month_number and productivity_pct 0-1 define the curve. NULL function_area or level means default for the org.';
COMMENT ON TABLE public.workforce_attrition_rates IS 'Voluntary attrition rates used in forward headcount modeling. NULL function_area means org-wide rate.';
