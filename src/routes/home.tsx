import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { getSession, setSession, type Session } from "@/lib/api";
import { FloatingContacts } from "@/components/FloatingContacts";
import { BottomNav } from "@/components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [session, setSess] = useState<Session | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const s = getSession();
    if (!s) navigate({ to: "/" });
    else setSess(s);
  }, [navigate]);

  if (!session) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-md px-5 pt-10 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }
  const u = session.user;
  const isCraftsman = u.role === "craftsman";

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl gold-gradient flex items-center justify-center text-black font-black text-lg">
              {u.name?.charAt(0) || "ح"}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">مرحباً بك</p>
              <p className="text-sm font-bold">{u.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => { setSession(null); navigate({ to: "/" }); }}
              className="h-10 w-10 rounded-xl bg-card border border-white/10 flex items-center justify-center"
              aria-label="تسجيل خروج"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Hero banner */}
        <section className="mt-6 relative overflow-hidden rounded-3xl card-gold p-5">
          <div className="absolute -left-6 -bottom-6 text-[140px] opacity-10 select-none">🛠️</div>
          <p className="text-xs text-[color:var(--gold)] font-bold tracking-widest">حرفي · DZ</p>
          <h2 className="mt-2 text-xl font-bold leading-snug">
            {isCraftsman ? "جاهز لاستقبال طلبات جديدة؟" : "احصل على حرفي\nخلال دقائق"}
          </h2>
          <Link
            to={isCraftsman ? "/dashboard" : "/requests/new"}
            className="mt-4 inline-flex items-center gap-2 gold-gradient text-black font-bold rounded-xl px-4 py-2.5 text-sm"
          >
            {isCraftsman ? "اذهب للوحة التحكم" : "اطلب الآن"} <span>←</span>
          </Link>
        </section>

        {/* Search */}
        <div className="mt-6 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن خدمة..."
            className="w-full bg-card border border-white/10 rounded-2xl pr-11 pl-4 py-3.5 text-sm outline-none focus:border-[color:var(--gold)]"
          />
        </div>

        {/* Categories */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">الفئات</h3>
            <span className="text-xs text-muted-foreground">{CATEGORIES.length} خدمة</span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES
              .filter((c) => !q || c.name.includes(q))
              .map((cat) => (
                <Link
                  key={cat.id}
                  to="/category/$id"
                  params={{ id: cat.id }}
                  className={`group rounded-2xl bg-gradient-to-br ${cat.color} border border-white/10 p-3 flex flex-col items-center justify-center aspect-square text-center transition-transform active:scale-95`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="mt-1.5 text-[11px] font-semibold leading-tight">{cat.name}</span>
                </Link>
              ))}
          </div>
        </section>

        {/* Featured craftsmen */}
        {!isCraftsman && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">حرفيون مميزون</h3>
              <Link to="/category/$id" params={{ id: "general" }} className="text-xs text-[color:var(--gold)]">عرض الكل</Link>
            </div>

            <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 scrollbar-none">
              {[
                { name: "محمد بن علي", job: "سباك", rating: 4.9, jobs: 128, wilaya: "الجزائر" },
                { name: "كريم زيدان", job: "كهربائي", rating: 4.8, jobs: 92, wilaya: "وهران" },
                { name: "ياسين حداد", job: "نجار", rating: 4.7, jobs: 64, wilaya: "قسنطينة" },
              ].map((c) => (
                <div key={c.name} className="min-w-[210px] card-gold rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full gold-gradient text-black font-black flex items-center justify-center">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.name}</p>
                      <p className="text-xs text-[color:var(--gold)]">{c.job}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.wilaya}</span>
                    <span>⭐ {c.rating} · {c.jobs} عمل</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
