import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { upsertAuthProfile } from "./auth.server";
import type { Role, User } from "./api";

const CompletePhoneAuthSchema = z.object({
  role: z.enum(["customer", "craftsman"]),
  phone: z.string().min(8).max(20),
  name: z.string().max(120).optional(),
  profession: z.string().max(80).optional(),
  wilaya: z.string().max(80).optional(),
  commune: z.string().max(80).optional(),
});

export const completePhoneAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CompletePhoneAuthSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: authData, error } = await context.supabase.auth.getUser();

    if (error || !authData.user) {
      throw new Error("تعذّر التحقق من الجلسة");
    }

    const user = await upsertAuthProfile({
      userId: context.userId,
      phone: authData.user.phone ?? data.phone,
      role: data.role,
      name: data.name,
      profession: data.profession,
      wilaya: data.wilaya,
      commune: data.commune,
    });

    return { user };
  });

const CompleteGoogleAuthSchema = z.object({
  role: z.enum(["customer", "craftsman"]).optional(),
});

// Called after a successful Google OAuth flow. Creates a Harfi profile +
// role from the Supabase auth user (email, name, avatar) if missing, and
// returns the merged user. If the user already has a role, that role wins
// (so re-logging in keeps the existing account intact).
export const completeGoogleAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CompleteGoogleAuthSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: authData, error } = await context.supabase.auth.getUser();
    if (error || !authData.user) {
      throw new Error("تعذّر التحقق من الجلسة");
    }
    const authUser = authData.user;
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;

    const email =
      authUser.email ??
      (typeof meta.email === "string" ? (meta.email as string) : null);
    const name =
      (typeof meta.full_name === "string" ? (meta.full_name as string) : null) ??
      (typeof meta.name === "string" ? (meta.name as string) : null) ??
      (email ? email.split("@")[0] : undefined);
    const avatarUrl =
      (typeof meta.avatar_url === "string" ? (meta.avatar_url as string) : null) ??
      (typeof meta.picture === "string" ? (meta.picture as string) : null);

    // Preserve existing role if any
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();

    const role: Role =
      (existingRole?.role as Role | undefined) ?? data.role ?? "customer";

    const user: User = await upsertAuthProfile({
      userId: context.userId,
      phone: authUser.phone ?? null,
      email,
      avatarUrl,
      role,
      name: name ?? undefined,
    });

    return { user };
  });
