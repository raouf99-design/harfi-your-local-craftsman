import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const StatusEnum = z.enum(["pending", "accepted", "in_progress", "completed", "cancelled"]);

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
    const { error } = await supabaseAdmin.from("service_requests").insert({
      customer_id: context.userId,
      craftsman_id: data.craftsmanId ?? null,
      category: data.category,
      address: data.address,
      description: data.description,
      status: "pending",
    });
    if (error) {
      console.error("[service-requests] create failed", error);
      throw new Error("تعذّر إرسال الطلب");
    }
    return { ok: true };
  });

// ---------- Customer: list my requests ----------
export const listMyRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("service_requests")
      .select("id, craftsman_id, category, address, description, status, created_at, rating")
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
    const { error } = await supabaseAdmin
      .from("service_requests")
      .update({ rating: data.rating })
      .eq("id", data.id)
      .eq("customer_id", context.userId);
    if (error) {
      console.error("[service-requests] rate failed", error);
      throw new Error("تعذّر حفظ التقييم");
    }
    return { ok: true };
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
    return { items: data ?? [] };
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
    return { ok: true };
  });

// ---------- Craftsman: decline a pending job ----------
const IdSchema = z.object({ id: z.string().uuid() });

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

// Suppress unused-var lint for shared schema export.
export type RequestStatus = z.infer<typeof StatusEnum>;
