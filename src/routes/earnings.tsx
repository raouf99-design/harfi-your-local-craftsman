import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/api";
import { listEarnings } from "@/lib/service-requests.functions";

export const Route = createFileRoute("/earnings")({
  component: Earnings,
});

interface Txn {
  id: string;
  category: string;
  customer_id: string;
  customer_name?: string | null;
  price: number | null;
  created_at: string;
}

function Earnings() {
  const navigate = useNavigate();
  const fetchEarnings = useServerFn(listEarnings);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    const s = getSession();
    if (!s || s.user.role !== "craftsman") {
      navigate({ to: "/" });
      return;
    }
    setReady(true);
    (async () => {
      try {
        const res = await fetchEarnings({});
        setTxns((res.items ?? []) as Txn[]);
      } catch (err) {
        console.error("[earnings] fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, fetchEarnings]);

  if (!ready) return null;

  const now = Date.now();
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const total = txns.reduce((s, t) => s + (t.price ?? 0), 0);
  const week = txns
    .filter((t) => now - new Date(t.created_at).getTime() <= WEEK)
    .reduce((s, t) => s + (t.price ?? 0), 0);
  const month = txns
    .filter((t) => {
      const d = new Date(t.created_at);
      const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    })
    .reduce((s, t) => s + (t.price ?? 0), 0);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/dashboard" className="text-sm text-muted-foreground">→ رجوع</Link>
        <h1 className="mt-3 text-2xl font-black">الأرباح</h1>

        <div className="mt-5 card-gold rounded-3xl p-6 bg-gradient-to-br from-[color:var(--gold)]/20 to-transparent">
          <p className="text-xs text-muted-foreground">الإجمالي</p>
          {loading ? (
            <Skeleton className="mt-2 h-10 w-40" />
          ) : (
            <p className="mt-1 text-4xl font-black gold-text">{total.toLocaleString("ar-DZ")} دج</p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
              <p className="font-bold mt-1">{week.toLocaleString("ar-DZ")} دج</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">هذا الشهر</p>
              <p className="font-bold mt-1">{month.toLocaleString("ar-DZ")} دج</p>
            </div>
          </div>
        </div>

        <h2 className="mt-6 text-sm font-bold">آخر المعاملات</h2>
        {loading ? (
          <ul className="mt-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="card-gold rounded-2xl p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/3" />
              </li>
            ))}
          </ul>
        ) : txns.length === 0 ? (
          <div className="mt-4 card-gold rounded-2xl p-6 text-center text-sm text-muted-foreground">
            لا توجد معاملات بعد
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {txns.map((t) => (
              <li key={t.id} className="card-gold rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">
                    {t.category}
                    {t.customer_name ? ` — ${t.customer_name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(t.created_at).toLocaleDateString("ar-DZ")}
                  </p>
                </div>
                <p className="text-sm font-black text-emerald-400">
                  +{(t.price ?? 0).toLocaleString("ar-DZ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
