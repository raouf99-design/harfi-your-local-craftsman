import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getSession } from "@/lib/api";
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

const STORE_KEY = "harfi_requests";

interface RequestItem {
  id: string;
  craftsmanId?: string;
  craftsmanName?: string;
  category: string;
  address: string;
  description: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  createdAt: number;
}

function NewRequest() {
  const { craftsmanId, craftsmanName } = Route.useSearch();
  const navigate = useNavigate();
  const [category, setCategory] = useState("سباك");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const item: RequestItem = {
      id: crypto.randomUUID(),
      craftsmanId,
      craftsmanName,
      category,
      address,
      description,
      status: "pending",
      createdAt: Date.now(),
    };
    const list: RequestItem[] = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    list.unshift(item);
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
    setTimeout(() => navigate({ to: "/requests" }), 500);
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/home" className="text-sm text-muted-foreground">→ رجوع</Link>
        <h1 className="mt-4 text-2xl font-black">طلب خدمة جديد</h1>
        {craftsmanName && (
          <p className="mt-1 text-sm text-[color:var(--gold)]">للحرفي: {craftsmanName}</p>
        )}

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
