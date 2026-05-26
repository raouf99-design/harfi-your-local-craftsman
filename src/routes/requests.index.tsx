import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { Star } from "lucide-react";
import { getSession } from "@/lib/api";

export const Route = createFileRoute("/requests/")({
  component: RequestsList,
});

const STORE_KEY = "harfi_requests";

interface RequestItem {
  id: string;
  craftsmanName?: string;
  category: string;
  address: string;
  description: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  createdAt: number;
  rating?: number;
}

const STATUS: Record<RequestItem["status"], { label: string; color: string }> = {
  pending: { label: "بانتظار الموافقة", color: "bg-yellow-500/20 text-yellow-300" },
  accepted: { label: "مقبول", color: "bg-blue-500/20 text-blue-300" },
  in_progress: { label: "قيد التنفيذ", color: "bg-[color:var(--gold)]/20 text-[color:var(--gold)]" },
  completed: { label: "مكتمل", color: "bg-emerald-500/20 text-emerald-300" },
  cancelled: { label: "ملغى", color: "bg-red-500/20 text-red-300" },
};

function RequestsList() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<RequestItem[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setAuthed(true);
    const list: RequestItem[] = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
    setItems(list);
  }, [navigate]);

  const rate = (id: string, r: number) => {
    // NOTE: Client-side rating is UX-only. Server must enforce that the
    // request is in `completed` state and that the caller is the customer.
    const next = items.map((i) => i.id === id ? { ...i, rating: r } : i);
    setItems(next);
    localStorage.setItem(STORE_KEY, JSON.stringify(next));
  };

  if (!authed) return null;

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <h1 className="text-2xl font-black">طلباتي</h1>
        <p className="mt-1 text-sm text-muted-foreground">تابع جميع طلباتك السابقة والحالية</p>

        {items.length === 0 ? (
          <div className="mt-10 card-gold rounded-3xl p-8 text-center">
            <div className="text-5xl">📭</div>
            <p className="mt-3 font-bold">لا توجد طلبات بعد</p>
            <p className="mt-1 text-sm text-muted-foreground">ابدأ بإنشاء طلب جديد لحرفي.</p>
            <Link to="/home" className="mt-5 inline-block gold-gradient text-black font-bold rounded-xl px-5 py-2.5 text-sm">
              تصفح الحرفيين ←
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((r) => {
              const st = STATUS[r.status];
              return (
                <li key={r.id} className="card-gold rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold">{r.category}</p>
                      {r.craftsmanName && <p className="text-xs text-[color:var(--gold)]">{r.craftsmanName}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">📍 {r.address}</p>
                  <p className="mt-1 text-sm line-clamp-2">{r.description}</p>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("ar-DZ")}
                    </span>
                  </div>

                  {r.status === "completed" && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">قيّم الحرفي:</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => rate(r.id, n)}>
                            <Star className={`h-5 w-5 ${(r.rating ?? 0) >= n ? "text-[color:var(--gold)] fill-current" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
