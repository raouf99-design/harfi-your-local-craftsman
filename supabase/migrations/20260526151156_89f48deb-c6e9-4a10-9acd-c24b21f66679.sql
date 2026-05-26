ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);