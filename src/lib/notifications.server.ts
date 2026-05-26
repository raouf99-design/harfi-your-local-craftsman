import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type NotificationType =
  | "request_new"
  | "request_accepted"
  | "request_declined"
  | "request_started"
  | "request_completed"
  | "request_cancelled"
  | "request_rated";

export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  requestId?: string;
}) {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? null,
      request_id: opts.requestId ?? null,
    });
  } catch (e) {
    console.error("[notifications] create failed", e);
  }
}
