import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { getCraftsmenStats } from "@/lib/service-requests.functions";
import { MapPin, Star } from "lucide-react";

export const Route = createFileRoute("/category/$id")({
  component: CategoryPage,
});

const CATEGORY_TO_PROFESSION: Record<string, string> = {
  plumber: "سباك",
  electrician: "كهربائي",
  painter: "دهان",
  carpenter: "نجار",
  blacksmith: "حداد",
  tiler: "بلاط",
  ac: "فني تكييف",
  general: "أعمال عامة",
};

interface CraftsmanProfile {
  user_id: string;
  name: string | null;
  profession: string | null;
  wilaya: string | null;
  commune: string | null;
}

function CategoryPage() {
  const { id } = Route.useParams();
  const cat = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
  const profession = CATEGORY_TO_PROFESSION[id] ?? cat.name;
  const statsFn = useServerFn(getCraftsmenStats);

  const [list, setList] = useState<CraftsmanProfile[]>([]);
  const [stats, setStats] = useState<Record<string, { count: number; rating: number | null }>>({});
  const [loading, setLoading] = useState(true);
  const [wilayaFilter, setWilayaFilter] = useState("الكل");

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, profession, wilaya, commune")
        .eq("profession", profession)
        .eq("available", true);
      if (!active) return;
      if (error) console.error("[category] fetch failed", error);
      const items = (data ?? []) as CraftsmanProfile[];
      setList(items);
      setLoading(false);
      const ids = items.map((c) => c.user_id);
      if (ids.length) {
        try {
          const res = await statsFn({ data: { userIds: ids } });
          if (active) setStats(res.stats ?? {});
        } catch (e) {
          console.error("[category] stats failed", e);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [profession, statsFn]);

  const wilayas = useMemo(() => {
    const set = new Set<string>();
    list.forEach((c) => c.wilaya && set.add(c.wilaya));
    return Array.from(set);
  }, [list]);

  const filtered = wilayaFilter === "الكل" ? list : list.filter((c) => c.wilaya === wilayaFilter);

  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/home" className="text-sm text-muted-foreground">→ رجوع</Link>

        <div className={`mt-4 card-gold rounded-3xl p-5 bg-gradient-to-br ${cat.color}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[color:var(--gold)] tracking-widest font-bold">فئة</p>
              <h1 className="mt-1 text-2xl font-black">{cat.name}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {loading ? "..." : `${filtered.length} حرفي متاح`}
              </p>
            </div>
            <span className="text-5xl">{cat.icon}</span>
          </div>
        </div>

        {wilayas.length > 0 && (
          <div className="mt-5">
            <label className="block text-xs text-muted-foreground mb-1.5">تصفية حسب الولاية</label>
            <select
              value={wilayaFilter}
              onChange={(e) => setWilayaFilter(e.target.value)}
              className="w-full bg-card border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[color:var(--gold)]"
            >
              <option value="الكل">الكل</option>
              {wilayas.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        )}

        <h2 className="mt-6 text-sm font-bold text-muted-foreground">الحرفيون المتاحون</h2>

        {loading ? (
          <ul className="mt-3 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="card-gold rounded-2xl p-4 flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="mt-8 card-gold rounded-3xl p-8 text-center">
            <div className="text-5xl">😕</div>
            <p className="mt-3 text-sm text-muted-foreground">
              لا يوجد حرفيون متاحون في هذه الفئة حالياً
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {filtered.map((c) => {
              const displayName = c.name || "حرفي";
              const s = stats[c.user_id];
              return (
                <li key={c.user_id}>
                  <Link
                    to="/craftsman/$id"
                    params={{ id: c.user_id }}
                    search={{ cat: cat.id, name: displayName }}
                    className="card-gold rounded-2xl p-4 flex items-center gap-3 active:scale-[.98] transition-transform"
                  >
                    <div className="h-14 w-14 rounded-2xl gold-gradient text-black font-black flex items-center justify-center text-lg">
                      {displayName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold truncate">{displayName}</p>
                        {s?.rating != null && (
                          <span className="text-[11px] flex items-center gap-0.5 text-[color:var(--gold)] font-bold shrink-0">
                            <Star className="h-3 w-3 fill-current" /> {s.rating}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[color:var(--gold)] mt-0.5">{c.profession}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        {(c.wilaya || c.commune) ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3 shrink-0" /> {c.wilaya}
                            {c.commune ? ` · ${c.commune}` : ""}
                          </p>
                        ) : <span />}
                        {s?.count ? (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {s.count} عمل
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
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
