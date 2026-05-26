import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Role, User } from "@/lib/api";

type ProfileInput = {
  userId: string;
  phone: string;
  role: Role;
  name?: string;
  profession?: string;
  wilaya?: string;
  commune?: string;
};

const clean = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export async function upsertAuthProfile(input: ProfileInput): Promise<User> {
  const profile = {
    user_id: input.userId,
    phone: input.phone,
    name: clean(input.name),
    profession: input.role === "craftsman" ? clean(input.profession) : null,
    wilaya: input.role === "craftsman" ? clean(input.wilaya) : null,
    commune: input.role === "craftsman" ? clean(input.commune) : null,
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
    phone: input.phone,
    role: input.role,
    name: profile.name ?? undefined,
    profession: profile.profession ?? undefined,
    wilaya: profile.wilaya ?? undefined,
    commune: profile.commune ?? undefined,
    available: profile.available,
  };
}
