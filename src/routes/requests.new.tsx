import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getSession } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";

const searchSchema = z.object({
  craftsmanId: z.string().optional(),
  craftsmanName: z.string().optional(),
});

export const Route = createFileRoute("/requests/new")({
  validateSearch: searchSchema,
  component: NewRequest,
});

function NewRequest() {
  const { craftsmanId } = Route.useSearch();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    const s = getSession();
    if (!s) navigate({ to: "/" });
    else {
      setAuthed(true);
      setUserId(s.user.id);
    }
  }, [navigate]);
  const [category, setCategory] = useState("سباك");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!authed || !userId) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: insertError } = await supabase.from("service_requests").insert({
      customer_id: userId,
      craftsman_id: craftsmanId ?? null,
      category,
      address,
      description,
      status: "pending",
    });
    if (insertError) {
      console.error("[requests.new] insert failed", insertError);
      setError("تعذّر إرسال الطلب، حاول مرة أخرى");
      setLoading(false);
      return;
    }
    navigate({ to: "/requests" });
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/home" className="text-sm text-muted-foreground">→ رجوع</Link>
        <h1 className="mt-4 text-2xl font-black">طلب خدمة جديد</h1>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="نوع الخدمة">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
              {["سباك", "كهربائي", "دهان", "نجار", "حداد", "بلاط", "فني تكييف", "أعمال عامة"].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>

          <Field label="عنوان التدخل">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="الحي، الشارع، رقم المنزل..." required />
          </Field>

          <Field label="وصف المشكلة">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input min-h-[120px] resize-none"
              placeholder="اشرح المشكلة بالتفصيل..."
              required
            />
          </Field>

          <div className="card-gold rounded-2xl p-4 text-xs text-muted-foreground">
            💡 سيتم تحديد السعر مع الحرفي بعد المعاينة. الدفع يتم نقداً.
          </div>

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}

          <button disabled={loading} className="btn-gold w-full">
            {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--input);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
          color: var(--foreground);
          font-family: inherit;
          font-size: 15px;
          outline: none;
        }
        .input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px color-mix(in oklab, var(--gold) 20%, transparent); }
        .btn-gold {
          background: linear-gradient(135deg, oklch(0.85 0.1 85), oklch(0.7 0.14 75));
          color: #000; font-weight: 800;
          border-radius: 14px; padding: 14px 20px;
          box-shadow: 0 8px 24px -8px color-mix(in oklab, var(--gold) 50%, transparent);
        }
        .btn-gold:disabled { opacity: .6; }
      `}</style>
      <BottomNav />
      <FloatingContacts />
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1.5 font-medium">{label}</span>
      {children}
    </label>
  );
}
