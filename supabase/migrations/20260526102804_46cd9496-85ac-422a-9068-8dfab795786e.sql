-- Drop legacy policies (RLS is disabled; access goes through server functions using the service role).
DROP POLICY IF EXISTS "Craftsmen can update pending or assigned requests" ON public.service_requests;
DROP POLICY IF EXISTS "Craftsmen can view pending or assigned requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers can insert their own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers can update their own requests" ON public.service_requests;
DROP POLICY IF EXISTS "Customers can view their own requests" ON public.service_requests;

-- Block direct PostgREST access from anon/authenticated roles; only the service role (server functions) may touch this table.
REVOKE ALL ON public.service_requests FROM anon, authenticated;