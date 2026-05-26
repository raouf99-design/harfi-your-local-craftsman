import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession, setSession, type Session } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  listJobsForCraftsman,
  acceptJob as acceptJobFn,
  declineJob as declineJobFn,
  completeJob as completeJobFn,
} from "@/lib/service-requests.functions";
import { TrendingUp, Wallet, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

interface Job {
  id: string;
  customer_id: string;
  craftsman_id: string | null;
  category: string;
  address: string;
  description: string;
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled";
  price: number | null;
  created_at: string;
}

function Dashboard() {
  const navigate = useNavigate();
  const fetchJobsFn = useServerFn(listJobsForCraftsman);
  const acceptFn = useServerFn(acceptJobFn);
  const declineFn = useServerFn(declineJobFn);
  const completeFn = useServerFn(completeJobFn);
  const [session, setSess] = useState<Session | null>(null);
  const [available, setAvailable] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceModalId, setPriceModalId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchJobsFn({});
      setJobs((res.items ?? []) as Job[]);
    } catch (err) {
      console.error("[dashboard] fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [fetchJobsFn]);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setSess(s);
    setAvailable(s.user.available ?? true);
    if (s.user.role === "craftsman") fetchJobs();
    else setLoading(false);
  }, [navigate, fetchJobs]);

  if (!session) return null;

  const toggle = async () => {
    const next = !available;
    setAvailable(next);
    setSession({ ...session, user: { ...session.user, available: next } });
    await supabase.from("profiles").update({ available: next }).eq("user_id", session.user.id);
  };

  const acceptJob = async (id: string, price: number) => {
    try {
      await acceptFn({ data: { id, price } });
      fetchJobs();
    } catch (err) {
      console.error("[dashboard] accept failed", err);
    }
  };

  const declineJob = async (id: string) => {
    try {
      await declineFn({ data: { id } });
      fetchJobs();
    } catch (err) {
      console.error("[dashboard] decline failed", err);
    }
  };

  const completeJob = async (id: string) => {
    try {
      await completeFn({ data: { id } });
      fetchJobs();
    } catch (err) {
      console.error("[dashboard] complete failed", err);
    }
  };

  const submitPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(priceInput, 10);
    if (!priceModalId || isNaN(p) || p <= 0) return;
    acceptJob(priceModalId, p);
    setPriceModalId(null);
    setPriceInput("");
  };

  const isCraftsman = session.user.role === "craftsman" && !!session.token;
  if (!isCraftsman) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-md px-5 pt-10 text-center">
          <div className="card-gold rounded-3xl p-8 mt-10">
            <div className="text-5xl">🔒</div>
            <p className="mt-3 font-bold">لوحة الحرفي</p>
            <p className="mt-1 text-sm text-muted-foreground">هذه الصفحة مخصصة للحرفيين فقط.</p>
            <Link
              to="/home"
              className="mt-5 inline-block gold-gradient text-black font-bold rounded-xl px-5 py-2.5 text-sm"
            >
              العودة للرئيسية
            </Link>
          </div>
        </div>
        <BottomNav />
        <FloatingContacts />
      </main>
    );
  }

  const accepted = jobs.filter((j) => j.status === "accepted");
  const done = jobs.filter((j) => j.status === "completed");
  const earnings = done.reduce((s, j) => s + (j.price ?? 0), 0);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">مرحباً</p>
            <p className="text-lg font-black">{session.user.name}</p>
            <p className="text-xs text-[color:var(--gold)]">{session.user.profession}</p>
          </div>
          <button
            onClick={toggle}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border ${
              available
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                : "bg-red-500/15 text-red-300 border-red-500/30"
            }`}
          >
            {available ? "● متاح" : "● مشغول"}
          </button>
        </header>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <KPI
            icon={<Clock className="h-4 w-4" />}
            label="جديدة"
            value={jobs.filter((j) => j.status === "pending").length}
          />
          <KPI icon={<CheckCircle2 className="h-4 w-4" />} label="مقبولة" value={accepted.length} />
          <KPI icon={<TrendingUp className="h-4 w-4" />} label="منجزة" value={done.length} />
        </div>

        <Link
          to="/earnings"
          className="mt-4 block card-gold rounded-2xl p-4 bg-gradient-to-br from-[color:var(--gold)]/15 to-transparent"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الأرباح</p>
              <p className="text-2xl font-black gold-text mt-1">
                {earnings.toLocaleString("ar-DZ")} دج
              </p>
            </div>
            <Wallet className="h-8 w-8 text-[color:var(--gold)]" />
          </div>
        </Link>

        <h2 className="mt-7 text-sm font-bold">طلبات واردة</h2>

        {loading ? (
          <ul className="mt-3 space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="card-gold rounded-2xl p-4 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-3 space-y-3">
            {jobs
              .filter((j) => j.status !== "completed" && j.status !== "cancelled")
              .map((j) => (
                <li key={j.id} className="card-gold rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold">طلب جديد</p>
                      <p className="text-xs text-[color:var(--gold)]">{j.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">📍 {j.address}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{j.description}</p>
                    </div>
                    {j.price && (
                      <p className="text-sm font-black gold-text">
                        {j.price.toLocaleString("ar-DZ")} دج
                      </p>
                    )}
                  </div>

                  {j.status === "pending" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => declineJob(j.id)}
                        className="py-2.5 rounded-xl bg-card border border-white/10 text-sm"
                      >
                        رفض
                      </button>
                      <button
                        onClick={() => {
                          setPriceModalId(j.id);
                          setPriceInput("");
                        }}
                        className="py-2.5 rounded-xl gold-gradient text-black text-sm font-bold"
                      >
                        قبول
                      </button>
                    </div>
                  )}

                  {j.status === "accepted" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="py-2.5 rounded-xl bg-card border border-white/10 text-sm">
                        📷 رفع صور
                      </button>
                      <button
                        onClick={() => completeJob(j.id)}
                        className="py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-bold"
                      >
                        إنهاء العمل
                      </button>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {priceModalId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-5">
          <form
            onSubmit={submitPrice}
            className="w-full max-w-md card-gold rounded-3xl p-5 bg-background"
          >
            <p className="text-sm font-bold">حدد السعر التقديري</p>
            <p className="text-xs text-muted-foreground mt-1">أدخل السعر بالدينار الجزائري</p>
            <input
              type="number"
              min="1"
              autoFocus
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="مثال: 3000"
              className="mt-4 w-full bg-card border border-white/10 rounded-xl px-4 py-3 text-foreground outline-none focus:border-[color:var(--gold)]"
              required
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriceModalId(null)}
                className="py-2.5 rounded-xl bg-card border border-white/10 text-sm"
              >
                إلغاء
              </button>
              <button className="py-2.5 rounded-xl gold-gradient text-black text-sm font-bold">
                تأكيد القبول
              </button>
            </div>
          </form>
        </div>
      )}

      <BottomNav />
      <FloatingContacts />
    </main>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="card-gold rounded-2xl p-3 text-center">
      <div className="text-[color:var(--gold)] flex justify-center">{icon}</div>
      <p className="mt-1 text-xl font-black">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
