
-- 1) Drop overly broad listing policy on craftsmen-media (public URLs still work for public buckets)
DROP POLICY IF EXISTS "Portfolio media is publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Public read craftsmen-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view craftsmen-media" ON storage.objects;

-- Best-effort: drop any SELECT policy whose USING clause is just bucket_id='craftsmen-media'
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND cmd='SELECT'
      AND qual ILIKE '%craftsmen-media%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- 2) Scoped write policies for craftsmen-media (first folder must be the user's id)
CREATE POLICY "craftsmen-media: users upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'craftsmen-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "craftsmen-media: users update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'craftsmen-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'craftsmen-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "craftsmen-media: users delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'craftsmen-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3) Explicit deny policies on service_requests so the table is not "RLS enabled with no policy".
-- All legitimate access is performed via trusted server functions using the service role,
-- which bypasses RLS. Direct client access must remain blocked.
CREATE POLICY "service_requests: deny client select"
ON public.service_requests FOR SELECT TO anon, authenticated
USING (false);

CREATE POLICY "service_requests: deny client insert"
ON public.service_requests FOR INSERT TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "service_requests: deny client update"
ON public.service_requests FOR UPDATE TO anon, authenticated
USING (false) WITH CHECK (false);

CREATE POLICY "service_requests: deny client delete"
ON public.service_requests FOR DELETE TO anon, authenticated
USING (false);
