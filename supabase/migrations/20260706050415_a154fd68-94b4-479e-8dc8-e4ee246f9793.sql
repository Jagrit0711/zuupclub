
-- Fix set_updated_at search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Lock down SECURITY DEFINER functions from being called via the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- authenticated still needs it for RLS policies (evaluated by policy engine, not called directly)
-- but that's fine to revoke too; policies use security definer context
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- Replace overly-permissive signup insert policies with a tiny sanity check
DROP POLICY IF EXISTS "signups public insert" ON public.waitlist_signups;
DROP POLICY IF EXISTS "signups authenticated insert" ON public.waitlist_signups;

CREATE POLICY "signups public insert" ON public.waitlist_signups
  FOR INSERT TO anon
  WITH CHECK (
    length(full_name) BETWEEN 1 AND 120
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(school) BETWEEN 1 AND 200
  );

CREATE POLICY "signups authenticated insert" ON public.waitlist_signups
  FOR INSERT TO authenticated
  WITH CHECK (
    length(full_name) BETWEEN 1 AND 120
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(school) BETWEEN 1 AND 200
  );
