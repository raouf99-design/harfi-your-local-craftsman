import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const IdSchema = z.object({ userId: z.string().uuid() });

// Authenticated users can fetch a craftsman's phone number (for contact).
export const getCraftsmanPhone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("profiles")
      .select("phone")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) {
      console.error("[profile] phone fetch failed", error);
      throw new Error("تعذّر تحميل رقم الهاتف");
    }
    return { phone: row?.phone ?? null };
  });
