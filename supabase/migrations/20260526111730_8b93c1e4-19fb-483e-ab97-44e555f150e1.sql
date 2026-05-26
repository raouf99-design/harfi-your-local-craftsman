
-- 1. Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Portfolio table
CREATE TABLE IF NOT EXISTS public.craftsman_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  craftsman_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS craftsman_portfolio_craftsman_id_idx
  ON public.craftsman_portfolio(craftsman_id, created_at DESC);

-- Public read so customers can browse work
ALTER TABLE public.craftsman_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Portfolio items are publicly viewable"
  ON public.craftsman_portfolio FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('craftsmen-media', 'craftsmen-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read; writes restricted (server functions use service role)
CREATE POLICY "craftsmen-media public read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'craftsmen-media');
