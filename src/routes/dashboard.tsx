import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { getSession, setSession, type Session } from "@/lib/api";
import { TrendingUp, Wallet, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

interface IncomingJob {
  id: string;
  client: string;
  category: string;
  address: string;
  price: number;
  status: "new" | "accepted" | "declined" | "done";
}

const MOCK_JOBS: IncomingJob[] = [
  {
    id: "j1",
    client: "أمين قاسمي",
    category: "إصلاح تسرب",
    address: "حي بدر، الجزائر",
    price: 3500,
    status: "new",
  },
  {
    id: "j2",
    client: "سارة بلال",
    category: "تركيب حنفية",
    address: "السانيا، وهران",
    price: 2000,
    status: "new",
  },
  {
    id: "j3",
    client: "كريم زيدان",
    category: "صيانة كهربائية",
    address: "الخروب، قسنطينة",
    price: 4200,
    status: "accepted",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [session, setSess] = useState<Session | null>(null);
  const [available, setAvailable] = useState(true);
  const [jobs, setJobs] = useState<IncomingJob[]>(MOCK_JOBS);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setSess(s);
    setAvailable(s.user.available ?? true);
  }, [navigate]);

  if (!session) return null;

  const toggle = () => {
    const next = !available;
    setAvailable(next);
    setSession({ ...session, user: { ...session.user, available: next } });
  };

  const act = (id: string, status: IncomingJob["status"]) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, status } : j)));

  // NOTE: This client-side role check is a UX gate only. Real protection
  // for craftsman-only data and actions MUST be enforced server-side using
  // the server-issued session and role stored in Lovable Cloud.
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
  const done = jobs.filter((j) => j.status === "done");
  const earnings = done.reduce((s, j) => s + j.price, 0);

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
            value={jobs.filter((j) => j.status === "new").length}
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
        <ul className="mt-3 space-y-3">
          {jobs
            .filter((j) => j.status !== "done")
            .map((j) => (
              <li key={j.id} className="card-gold rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold">{j.client}</p>
                    <p className="text-xs text-[color:var(--gold)]">{j.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">📍 {j.address}</p>
                  </div>
                  <p className="text-sm font-black gold-text">
                    {j.price.toLocaleString("ar-DZ")} دج
                  </p>
                </div>

                {j.status === "new" && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => act(j.id, "declined")}
                      className="py-2.5 rounded-xl bg-card border border-white/10 text-sm"
                    >
                      رفض
                    </button>
                    <button
                      onClick={() => act(j.id, "accepted")}
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
                      onClick={() => act(j.id, "done")}
                      className="py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-bold"
                    >
                      إنهاء العمل
                    </button>
                  </div>
                )}

                {j.status === "declined" && (
                  <p className="mt-2 text-xs text-red-300">تم رفض هذا الطلب.</p>
                )}
              </li>
            ))}
        </ul>
      </div>
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
