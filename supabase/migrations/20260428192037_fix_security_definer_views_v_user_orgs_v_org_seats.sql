-- 20260428192037_fix_security_definer_views_v_user_orgs_v_org_seats.sql
--
-- Fix Supabase security advisor ERROR-level findings
-- (https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
--
-- v_user_orgs and v_org_seats were defined with SECURITY DEFINER, which
-- bypasses RLS on org_members and organizations and exposes per-org user
-- mappings to any anon/authenticated caller. Verified by querying as anon
-- and getting back rows the caller had no RLS-permitted access to.
--
-- Both views are unused by app code, edge functions, and other DB objects.
-- The fix below:
--   1. Switches both views to SECURITY INVOKER (RLS now enforced for caller)
--   2. Revokes the over-permissive write grants (INSERT/UPDATE/DELETE/etc.
--      have no business existing on a read-only view).
--   3. Leaves SELECT to authenticated/service_role so the views remain
--      callable for future feature work, but now respect RLS.
-- Companion migration `fix_org_members_rls_recursion` immediately after
-- repairs the RLS policy on org_members itself, which had infinite
-- recursion that these SECURITY DEFINER views were silently masking.

ALTER VIEW public.v_user_orgs SET (security_invoker = true);
ALTER VIEW public.v_org_seats SET (security_invoker = true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.v_user_orgs FROM anon, authenticated, service_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.v_org_seats FROM anon, authenticated, service_role;

REVOKE SELECT ON public.v_user_orgs FROM anon;
REVOKE SELECT ON public.v_org_seats FROM anon;
