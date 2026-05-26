import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createNotification } from "./notifications.server";

const StatusEnum = z.enum(["pending", "accepted", "in_progress", "completed", "cancelled"]);

async function notifyCustomerOfStatus(requestId: string, opts: {
  type: "request_accepted" | "request_declined" | "request_started" | "request_completed";
  title: string;
  body?: string;
}) {
  const { data } = await supabaseAdmin
    .from("service_requests")
    .select("customer_id, category")
    .eq("id", requestId)
    .maybeSingle();
  if (data?.customer_id) {
    await createNotification({
      userId: data.customer_id,
      type: opts.type,
      title: opts.title,
      body: opts.body ?? data.category,
      requestId,
    });
  }
}

// ---------- Customer: create a request ----------
const CreateRequestSchema = z.object({
  craftsmanId: z.string().uuid().nullish(),
  category: z.string().min(1).max(80),
  address: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
});

export const createRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => CreateRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await supabaseAdmin
      .from("service_requests")
      .insert({
        customer_id: context.userId,
        craftsman_id: data.craftsmanId ?? null,
        category: data.category,
        address: data.address,
        description: data.description,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[service-requests] create failed", error);
      throw new Error("تعذّر إرسال الطلب");
    }
    // Notify the targeted craftsman (if any), otherwise notify all craftsmen in the category.
    if (data.craftsmanId && inserted?.id) {
      await createNotification({
        userId: data.craftsmanId,
        type: "request_new",
        title: "طلب جديد",
        body: `${data.category} — ${data.address}`,
        requestId: inserted.id,
      });
    } else if (inserted?.id) {
      const { data: crafts } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("profession", data.category)
        .eq("available", true);
      for (const c of crafts ?? []) {
        await createNotification({
          userId: c.user_id,
          type: "request_new",
          title: "طلب جديد متاح",
          body: `${data.category} — ${data.address}`,
          requestId: inserted.id,
        });
      }
    }
    return { ok: true };
  });

// ---------- Customer: list my requests ----------
export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("service_requests")
      .select("id, craftsman_id, category, address, description, status, price, created_at, rating")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[service-requests] list mine failed", error);
      throw new Error("تعذّر تحميل الطلبات");
    }
    return { items: data ?? [] };
  });

// ---------- Customer: rate a completed request ----------
const RateSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

export const rateRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("service_requests")
      .update({ rating: data.rating })
      .eq("id", data.id)
      .eq("customer_id", context.userId)
      .select("craftsman_id, category")
      .maybeSingle();
    if (error) {
      console.error("[service-requests] rate failed", error);
      throw new Error("تعذّر حفظ التقييم");
    }
    if (row?.craftsman_id) {
      await createNotification({
        userId: row.craftsman_id,
        type: "request_rated",
        title: `تقييم جديد ${"★".repeat(data.rating)}`,
        body: row.category,
        requestId: data.id,
      });
    }
    return { ok: true };
  });

// ---------- Customer: cancel a pending request ----------
const IdSchema = z.object({ id: z.string().uuid() });

export const cancelRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("service_requests")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("customer_id", context.userId)
      .in("status", ["pending", "accepted"])
      .select("craftsman_id, category")
      .maybeSingle();
    if (error) {
      console.error("[service-requests] cancel failed", error);
      throw new Error("تعذّر إلغاء الطلب");
    }
    if (row?.craftsman_id) {
      await createNotification({
        userId: row.craftsman_id,
        type: "request_cancelled",
        title: "أُلغي الطلب من العميل",
        body: row.category,
        requestId: data.id,
      });
    }
    return { ok: true };
  });

// ---------- Shared: detail of a single request (visible to its customer or craftsman) ----------
export const getRequestDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await supabaseAdmin
      .from("service_requests")
      .select("id, customer_id, craftsman_id, category, address, description, status, price, created_at, rating")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("[service-requests] detail failed", error);
      throw new Error("تعذّر تحميل الطلب");
    }
    if (!row) throw new Error("الطلب غير موجود");
    const isCustomer = row.customer_id === context.userId;
    const isCraftsman = row.craftsman_id === context.userId;
    if (!isCustomer && !isCraftsman && row.status !== "pending") {
      throw new Error("غير مصرّح");
    }

    const ids = [row.customer_id, row.craftsman_id].filter(Boolean) as string[];
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("user_id, name, phone, profession, wilaya, commune").in("user_id", ids)
      : { data: [] };
    const map = Object.fromEntries((profs ?? []).map((p) => [p.user_id, p]));
    const customer = map[row.customer_id] ?? null;
    const craftsman = row.craftsman_id ? map[row.craftsman_id] ?? null : null;

    return {
      request: row,
      // Only expose the counter-party's phone to the legitimate party.
      customer: customer
        ? { name: customer.name, phone: isCraftsman ? customer.phone : null }
        : null,
      craftsman: craftsman
        ? {
            name: craftsman.name,
            phone: isCustomer ? craftsman.phone : null,
            profession: craftsman.profession,
            wilaya: craftsman.wilaya,
            commune: craftsman.commune,
          }
        : null,
      role: isCustomer ? "customer" : isCraftsman ? "craftsman" : "viewer",
    };
  });

// ---------- Craftsman: list jobs (pending or mine) ----------
export const listJobsForCraftsman = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("service_requests")
      .select("id, customer_id, craftsman_id, category, address, description, status, price, created_at")
      .or(`status.eq.pending,craftsman_id.eq.${context.userId}`)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[service-requests] list jobs failed", error);
      throw new Error("تعذّر تحميل الطلبات");
    }
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r) => r.customer_id)));
    let nameMap: Record<string, { name: string | null; phone: string | null }> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name, phone")
        .in("user_id", ids);
      nameMap = Object.fromEntries(
        (profs ?? []).map((p) => [p.user_id, { name: p.name, phone: p.phone }]),
      );
    }
    return {
      items: rows.map((r) => ({
        ...r,
        customer_name: nameMap[r.customer_id]?.name ?? null,
        // Phone exposed only when the craftsman is assigned to the job.
        customer_phone:
          r.craftsman_id === context.userId ? nameMap[r.customer_id]?.phone ?? null : null,
      })),
    };
  });

// ---------- Craftsman: accept a pending job ----------
const AcceptSchema = z.object({
  id: z.string().uuid(),
  price: z.number().int().positive().max(10_000_000),
});

export const acceptJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => AcceptSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("service_requests")
      .update({ status: "accepted", craftsman_id: context.userId, price: data.price })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) {
      console.error("[service-requests] accept failed", error);
      throw new Error("تعذّر قبول الطلب");
    }
    await notifyCustomerOfStatus(data.id, {
      type: "request_accepted",
      title: "تم قبول طلبك",
      body: `السعر المقترح: ${data.price} د.ج`,
    });
    return { ok: true };
  });

// ---------- Craftsman: decline a pending job ----------
export const declineJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("service_requests")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) {
      console.error("[service-requests] decline failed", error);
      throw new Error("تعذّر رفض الطلب");
    }
    await notifyCustomerOfStatus(data.id, {
      type: "request_declined",
      title: "تم رفض الطلب",
    });
    return { ok: true };
  });

// ---------- Craftsman: start a job (accepted -> in_progress) ----------
export const startJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("service_requests")
      .update({ status: "in_progress" })
      .eq("id", data.id)
      .eq("craftsman_id", context.userId)
      .eq("status", "accepted");
    if (error) {
      console.error("[service-requests] start failed", error);
      throw new Error("تعذّر بدء العمل");
    }
    await notifyCustomerOfStatus(data.id, {
      type: "request_started",
      title: "بدأ الحرفي تنفيذ طلبك",
    });
    return { ok: true };
  });

// ---------- Craftsman: complete a job ----------
export const completeJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => IdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("service_requests")
      .update({ status: "completed" })
      .eq("id", data.id)
      .eq("craftsman_id", context.userId);
    if (error) {
      console.error("[service-requests] complete failed", error);
      throw new Error("تعذّر إنهاء العمل");
    }
    await notifyCustomerOfStatus(data.id, {
      type: "request_completed",
      title: "اكتمل العمل — قيّم تجربتك",
    });
    return { ok: true };
  });

// ---------- Craftsman: list completed jobs (earnings) ----------
export const listEarnings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("service_requests")
      .select("id, category, customer_id, price, created_at")
      .eq("craftsman_id", context.userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[service-requests] list earnings failed", error);
      throw new Error("تعذّر تحميل الأرباح");
    }
    const rows = data ?? [];
    const ids = Array.from(new Set(rows.map((r) => r.customer_id)));
    let nameMap: Record<string, string | null> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name")
        .in("user_id", ids);
      nameMap = Object.fromEntries((profs ?? []).map((p) => [p.user_id, p.name]));
    }
    return {
      items: rows.map((r) => ({ ...r, customer_name: nameMap[r.customer_id] ?? null })),
    };
  });

// ---------- Public: stats (rating avg + completed count) for a set of craftsmen ----------
const StatsSchema = z.object({ userIds: z.array(z.string().uuid()).min(1).max(100) });

export const getCraftsmenStats = createServerFn({ method: "POST" })
  .inputValidator((input) => StatsSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("service_requests")
      .select("craftsman_id, rating, status")
      .in("craftsman_id", data.userIds)
      .eq("status", "completed");
    if (error) {
      console.error("[service-requests] stats failed", error);
      return { stats: {} as Record<string, { count: number; rating: number | null }> };
    }
    const acc: Record<string, { count: number; ratings: number[] }> = {};
    for (const r of rows ?? []) {
      if (!r.craftsman_id) continue;
      const a = (acc[r.craftsman_id] ||= { count: 0, ratings: [] });
      a.count += 1;
      if (typeof r.rating === "number") a.ratings.push(r.rating);
    }
    const stats: Record<string, { count: number; rating: number | null }> = {};
    for (const [k, v] of Object.entries(acc)) {
      stats[k] = {
        count: v.count,
        rating: v.ratings.length
          ? Math.round((v.ratings.reduce((s, n) => s + n, 0) / v.ratings.length) * 10) / 10
          : null,
      };
    }
    return { stats };
  });

export type RequestStatus = z.infer<typeof StatusEnum>;
