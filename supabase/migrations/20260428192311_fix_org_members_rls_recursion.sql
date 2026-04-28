-- 20260428192311_fix_org_members_rls_recursion.sql
--
-- Fix infinite recursion in 5 RLS policies that all share the same anti-pattern:
-- they restrict access by checking `org_id IN (SELECT org_id FROM org_members ...)`,
-- but org_members itself has RLS that triggers the same lookup, causing recursion.
--
-- Postgres returns 42P17 ("infinite recursion detected in policy") on every query,
-- which means:
--   - org_members is unreadable by anyone except service_role
--   - close_periods is unreadable / unwritable for any non-service request
--   - org_pack_purchases (the pack-guard table!) is unreadable, so EVERY pack
--     entitlement check returns 500. The pack guard would block every real
--     paying customer from accessing what they bought.
--
-- The fix uses two pre-existing SECURITY DEFINER helpers that bypass RLS:
--   - current_user_org_id()  → returns auth.uid()'s org_id from users table
--   - user_has_org_permission(user_id, org_id, level) → checks org_members directly
-- Both are SECURITY DEFINER so they don't re-trigger RLS on org_members.

-- 1. org_members SELECT policy
DROP POLICY IF EXISTS users_read_own_org_members ON public.org_members;
CREATE POLICY users_read_own_org_members ON public.org_members
  FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());

-- 2. close_periods SELECT (anyone in the org)
DROP POLICY IF EXISTS close_periods_select_org_members ON public.close_periods;
CREATE POLICY close_periods_select_org_members ON public.close_periods
  FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());

-- 3. close_periods UPDATE (admin or owner)
DROP POLICY IF EXISTS close_periods_update_admin ON public.close_periods;
CREATE POLICY close_periods_update_admin ON public.close_periods
  FOR UPDATE TO authenticated
  USING (public.user_has_org_permission(auth.uid(), org_id, 'admin'))
  WITH CHECK (public.user_has_org_permission(auth.uid(), org_id, 'admin'));

-- 4. close_periods DELETE (owner only)
DROP POLICY IF EXISTS close_periods_delete_owner ON public.close_periods;
CREATE POLICY close_periods_delete_owner ON public.close_periods
  FOR DELETE TO authenticated
  USING (public.user_has_org_permission(auth.uid(), org_id, 'owner'));

-- 5. org_pack_purchases SELECT (THE PACK-GUARD POLICY)
DROP POLICY IF EXISTS "Org members can read their pack purchases" ON public.org_pack_purchases;
CREATE POLICY "Org members can read their pack purchases" ON public.org_pack_purchases
  FOR SELECT TO authenticated
  USING (org_id = public.current_user_org_id());
