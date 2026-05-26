-- Revoke column-level SELECT on the sensitive phone column from public/anon roles.
-- RLS still allows the existing "Craftsman profiles are publicly readable" policy
-- to expose rows, but column privileges block anon from reading `phone`.
REVOKE SELECT (phone) ON public.profiles FROM anon;