-- 1) Notifications: remove from realtime publication (we use polling)
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- 2) Storage: explicit public SELECT policy for craftsmen-media
DROP POLICY IF EXISTS "craftsmen-media public read" ON storage.objects;
CREATE POLICY "craftsmen-media public read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'craftsmen-media');