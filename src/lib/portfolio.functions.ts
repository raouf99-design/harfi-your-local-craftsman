import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "craftsmen-media";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const UploadSchema = z.object({
  kind: z.enum(["avatar", "portfolio"]),
  mimeType: z.string().min(3).max(50),
  // base64 only, no data: prefix
  base64: z.string().min(10).max(8_000_000),
  caption: z.string().trim().max(200).optional(),
});

function extFromMime(m: string) {
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "bin";
}

export const uploadCraftsmanMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!ALLOWED_MIME.includes(data.mimeType)) {
      throw new Error("نوع الملف غير مدعوم (JPG/PNG/WebP فقط)");
    }
    const buf = Buffer.from(data.base64, "base64");
    if (buf.byteLength === 0) throw new Error("الملف فارغ");
    if (buf.byteLength > MAX_BYTES) throw new Error("الصورة كبيرة جداً (الحد 5 ميغا)");

    const ext = extFromMime(data.mimeType);
    const path = `${context.userId}/${data.kind}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: data.mimeType, upsert: false });
    if (upErr) {
      console.error("[portfolio] upload failed", upErr);
      throw new Error("تعذّر رفع الصورة");
    }

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    if (data.kind === "avatar") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", context.userId);
      if (error) {
        console.error("[portfolio] set avatar failed", error);
        throw new Error("تعذّر تحديث الصورة الشخصية");
      }
      return { ok: true, url: publicUrl };
    }

    // portfolio
    const { data: row, error } = await supabaseAdmin
      .from("craftsman_portfolio")
      .insert({
        craftsman_id: context.userId,
        image_url: publicUrl,
        caption: data.caption ?? null,
      })
      .select("id, image_url, caption, created_at")
      .single();
    if (error) {
      console.error("[portfolio] insert failed", error);
      throw new Error("تعذّر حفظ الصورة");
    }
    return { ok: true, item: row };
  });

// Public — anyone can list a craftsman's portfolio
const ListSchema = z.object({ userId: z.string().uuid() });
export const getCraftsmanPortfolio = createServerFn({ method: "POST" })
  .inputValidator((input) => ListSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: items, error } = await supabaseAdmin
      .from("craftsman_portfolio")
      .select("id, image_url, caption, created_at")
      .eq("craftsman_id", data.userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[portfolio] list failed", error);
      throw new Error("تعذّر تحميل المعرض");
    }
    return { items: items ?? [] };
  });

const DelSchema = z.object({ id: z.string().uuid() });
export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DelSchema.parse(input))
  .handler(async ({ data, context }) => {
    // Fetch row to verify ownership & get storage path
    const { data: row, error: rErr } = await supabaseAdmin
      .from("craftsman_portfolio")
      .select("id, craftsman_id, image_url")
      .eq("id", data.id)
      .maybeSingle();
    if (rErr || !row) throw new Error("العنصر غير موجود");
    if (row.craftsman_id !== context.userId) throw new Error("غير مصرح");

    // best-effort delete from storage
    const marker = `/${BUCKET}/`;
    const idx = row.image_url.indexOf(marker);
    if (idx >= 0) {
      const path = row.image_url.slice(idx + marker.length);
      await supabaseAdmin.storage.from(BUCKET).remove([path]).catch(() => null);
    }

    const { error } = await supabaseAdmin
      .from("craftsman_portfolio")
      .delete()
      .eq("id", data.id);
    if (error) {
      console.error("[portfolio] delete failed", error);
      throw new Error("تعذّر الحذف");
    }
    return { ok: true };
  });
