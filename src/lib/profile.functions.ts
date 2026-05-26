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

// Authenticated user fetches their own profile.
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, phone, profession, wilaya, commune, available")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) {
      console.error("[profile] me fetch failed", error);
      throw new Error("تعذّر تحميل الحساب");
    }
    return { profile: data };
  });

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  profession: z.string().trim().min(1).max(80).optional(),
  wilaya: z.string().trim().min(1).max(80).optional(),
  commune: z.string().trim().min(1).max(80).optional(),
  available: z.boolean().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const patch: {
      name?: string;
      profession?: string;
      wilaya?: string;
      commune?: string;
      available?: boolean;
    } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.profession !== undefined) patch.profession = data.profession;
    if (data.wilaya !== undefined) patch.wilaya = data.wilaya;
    if (data.commune !== undefined) patch.commune = data.commune;
    if (data.available !== undefined) patch.available = data.available;
    if (!Object.keys(patch).length) return { ok: true };
    const { error } = await supabaseAdmin
      .from("profiles")
      .update(patch)
      .eq("user_id", context.userId);
    if (error) {
      console.error("[profile] update failed", error);
      throw new Error("تعذّر حفظ التعديلات");
    }
    return { ok: true };
  });
