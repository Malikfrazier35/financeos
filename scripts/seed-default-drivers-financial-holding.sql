-- ============================================================================
-- One-time seed: 19 default SaaS drivers for Financial Holding LLC
-- (10 manual atoms + 9 formula drivers wired to existing GL accounts).
--
-- Idempotent via ON CONFLICT (org_id, key) DO NOTHING.
-- Applied to production via Supabase MCP on 2026-04-29.
--
-- This is a one-off seed for an existing org; not a migration. New orgs
-- should get default drivers via an onboarding edge fn (future work — a
-- public.seed_default_drivers(uuid) function that this script could be
-- refactored into).
-- ============================================================================

WITH org_const AS (
  SELECT 'd8afc85d-dfeb-4289-824c-400d14dc8029'::uuid AS org_id
), gl AS (
  SELECT id, name FROM public.gl_accounts
  WHERE org_id = (SELECT org_id FROM org_const)
)
INSERT INTO public.drivers
  (org_id, key, name, category, unit, source_type, formula, feeds_account_id, default_value, description, display_order)
SELECT * FROM (VALUES
  -- ─── Manual atoms (the 10 input variables you actually edit) ────────────
  ((SELECT org_id FROM org_const), 'customer_count',          'Customer count',                    'revenue',         'number',      'manual',  NULL,                                                                                  NULL, 100,    'Total paying customers at start of period.',                10),
  ((SELECT org_id FROM org_const), 'arpu_monthly',            'ARPU (monthly)',                    'revenue',         'currency',    'manual',  NULL,                                                                                  NULL, 850,    'Average revenue per customer per month.',                   20),
  ((SELECT org_id FROM org_const), 'new_customers_monthly',   'New customers (per month)',         'revenue',         'number',      'manual',  NULL,                                                                                  NULL, 8,      'Gross new customer adds per month.',                        30),
  ((SELECT org_id FROM org_const), 'churn_rate_monthly',      'Monthly churn rate',                'revenue',         'percentage',  'manual',  NULL,                                                                                  NULL, 2.5,    'Monthly customer churn as a percentage.',                   40),
  ((SELECT org_id FROM org_const), 'headcount_total',         'Total headcount',                   'headcount',       'number',      'manual',  NULL,                                                                                  NULL, 14,     'Total FTE for the period.',                                  50),
  ((SELECT org_id FROM org_const), 'avg_loaded_cost_monthly', 'Avg loaded cost per FTE (monthly)', 'headcount',       'currency',    'manual',  NULL,                                                                                  NULL, 12500,  'Fully-loaded cost per FTE per month (salary + benefits + tax).', 60),
  ((SELECT org_id FROM org_const), 'hosting_pct_revenue',     'Hosting as % of revenue',           'cost',            'percentage',  'manual',  NULL,                                                                                  NULL, 18,     'Cloud infrastructure cost as a % of revenue.',              70),
  ((SELECT org_id FROM org_const), 'sm_pct_revenue',          'S&M as % of revenue',               'cost',            'percentage',  'manual',  NULL,                                                                                  NULL, 22,     'Sales & marketing spend as a % of revenue.',                80),
  ((SELECT org_id FROM org_const), 'ga_pct_revenue',          'G&A as % of revenue',               'cost',            'percentage',  'manual',  NULL,                                                                                  NULL, 12,     'General & admin spend as a % of revenue.',                  90),
  ((SELECT org_id FROM org_const), 'rd_pct_revenue',          'R&D as % of revenue',               'cost',            'percentage',  'manual',  NULL,                                                                                  NULL, 28,     'Research & development spend as a % of revenue.',          100),

  -- ─── Formula drivers (derived; feed P&L line items) ────────────────────
  ((SELECT org_id FROM org_const), 'revenue_total',           'Revenue (total)',                   'revenue',         'currency',    'formula', '{D:customer_count} * {D:arpu_monthly}',                                              (SELECT id FROM gl WHERE name='Subscription Revenue'), NULL, 'Total subscription revenue for the period.',                          110),
  ((SELECT org_id FROM org_const), 'cogs_hosting',            'COGS — Hosting',                    'cost',            'currency',    'formula', '{D:revenue_total} * {D:hosting_pct_revenue} / 100',                                  (SELECT id FROM gl WHERE name='Cloud Infrastructure'), NULL, 'Cloud infrastructure cost for the period.',                           120),
  ((SELECT org_id FROM org_const), 'opex_sales',              'OpEx — Sales',                      'cost',            'currency',    'formula', '{D:revenue_total} * {D:sm_pct_revenue} / 100 * 0.6',                                 (SELECT id FROM gl WHERE name='Sales'),                NULL, 'Sales-attributed share of S&M spend (60% of total S&M).',             130),
  ((SELECT org_id FROM org_const), 'opex_marketing',          'OpEx — Marketing',                  'cost',            'currency',    'formula', '{D:revenue_total} * {D:sm_pct_revenue} / 100 * 0.4',                                 (SELECT id FROM gl WHERE name='Marketing'),            NULL, 'Marketing-attributed share of S&M spend (40% of total S&M).',         140),
  ((SELECT org_id FROM org_const), 'opex_ga',                 'OpEx — G&A',                        'cost',            'currency',    'formula', '{D:revenue_total} * {D:ga_pct_revenue} / 100',                                       (SELECT id FROM gl WHERE name='Finance & Legal'),      NULL, 'General & admin spend.',                                              150),
  ((SELECT org_id FROM org_const), 'opex_rd',                 'OpEx — R&D',                        'cost',            'currency',    'formula', '{D:revenue_total} * {D:rd_pct_revenue} / 100',                                       (SELECT id FROM gl WHERE name='R&D — Engineering'),    NULL, 'Research & development spend.',                                       160),
  ((SELECT org_id FROM org_const), 'payroll_total',           'Payroll (total loaded)',            'headcount',       'currency',    'formula', '{D:headcount_total} * {D:avg_loaded_cost_monthly}',                                   NULL,                                                  NULL, 'Total loaded payroll cost for the period (cross-department).',         170),
  ((SELECT org_id FROM org_const), 'gross_profit',            'Gross profit',                      'unit_economics',  'currency',    'formula', '{D:revenue_total} - {D:cogs_hosting}',                                                NULL,                                                  NULL, 'Gross profit (revenue − COGS).',                                       180),
  ((SELECT org_id FROM org_const), 'net_income',              'Net income',                        'unit_economics',  'currency',    'formula', '{D:revenue_total} - {D:cogs_hosting} - {D:opex_sales} - {D:opex_marketing} - {D:opex_ga} - {D:opex_rd}', NULL,                                              NULL, 'Net income before tax (P&L bottom line).',                            190)
) AS v(org_id, key, name, category, unit, source_type, formula, feeds_account_id, default_value, description, display_order)
ON CONFLICT (org_id, key) DO NOTHING;
