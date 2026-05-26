-- 1. Re-enable RLS on service_requests (no policies = deny all for anon/authenticated;
--    server-side supabaseAdmin uses service_role and bypasses RLS, so server fns keep working)
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- 2. Revoke direct phone column access from anon and authenticated roles
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;
REVOKE INSERT (phone), UPDATE (phone) ON public.profiles FROM anon;
