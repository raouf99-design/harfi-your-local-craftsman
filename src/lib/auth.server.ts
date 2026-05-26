import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Role, User } from "@/lib/api";

type ProfileInput = {
  userId: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: Role;
  name?: string;
  profession?: string;
  wilaya?: string;
  commune?: string;
};

const clean = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function upsertAuthProfile(input: ProfileInput): Promise<User> {
  // Preserve existing fields if not provided (so Google sign-in doesn't wipe phone)
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("phone, email, avatar_url, name, profession, wilaya, commune")
    .eq("user_id", input.userId)
    .maybeSingle();

  const profile = {
    user_id: input.userId,
    phone: clean(input.phone) ?? existing?.phone ?? null,
    email: clean(input.email) ?? existing?.email ?? null,
    avatar_url: clean(input.avatarUrl) ?? existing?.avatar_url ?? null,
    name: clean(input.name) ?? existing?.name ?? null,
    profession:
      input.role === "craftsman"
        ? (clean(input.profession) ?? existing?.profession ?? null)
        : null,
    wilaya:
      input.role === "craftsman"
        ? (clean(input.wilaya) ?? existing?.wilaya ?? null)
        : null,
    commune:
      input.role === "craftsman"
        ? (clean(input.commune) ?? existing?.commune ?? null)
        : null,
    available: input.role === "craftsman",
  };

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(profile, { onConflict: "user_id" });

  if (profileError) {
    console.error("[auth] profile upsert failed", profileError);
    throw new Error("تعذّر حفظ بيانات الحساب");
  }

  const { error: deleteRoleError } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", input.userId);

  if (deleteRoleError) {
    console.error("[auth] role cleanup failed", deleteRoleError);
    throw new Error("تعذّر حفظ نوع الحساب");
  }

  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: input.userId, role: input.role });

  if (roleError) {
    console.error("[auth] role insert failed", roleError);
    throw new Error("تعذّر حفظ نوع الحساب");
  }

  return {
    id: input.userId,
    phone: profile.phone ?? undefined,
    email: profile.email ?? undefined,
    avatar_url: profile.avatar_url ?? undefined,
    role: input.role,
    name: profile.name ?? undefined,
    profession: profile.profession ?? undefined,
    wilaya: profile.wilaya ?? undefined,
    commune: profile.commune ?? undefined,
    available: profile.available,
  };
}
