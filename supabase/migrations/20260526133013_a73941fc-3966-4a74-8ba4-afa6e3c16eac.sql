
-- Notifications table for in-app + realtime alerts
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  request_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id) WHERE read = false;

-- Grants: only service_role writes; authenticated may read their own via realtime
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Deny client writes (server functions use service role)
CREATE POLICY "notifications: deny client insert"
  ON public.notifications FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "notifications: deny client update"
  ON public.notifications FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "notifications: deny client delete"
  ON public.notifications FOR DELETE TO anon, authenticated USING (false);

-- Reads also denied at RLS layer because our auth is external (auth.uid() never matches).
-- All reads go through server functions with the validated external JWT.
CREATE POLICY "notifications: deny client select"
  ON public.notifications FOR SELECT TO anon, authenticated USING (false);

-- Enable realtime
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
