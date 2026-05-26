import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { upsertAuthProfile } from "./auth.server";

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