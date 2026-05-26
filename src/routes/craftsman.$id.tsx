import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, MessageCircle, Star } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/api";
import { getCraftsmanPhone } from "@/lib/profile.functions";
import { getCraftsmenStats } from "@/lib/service-requests.functions";
import { getCraftsmanPortfolio } from "@/lib/portfolio.functions";

const searchSchema = z.object({
  cat: z.string().optional(),
  name: z.string().optional(),
});

export const Route = createFileRoute("/craftsman/$id")({
  validateSearch: searchSchema,
  component: CraftsmanProfile,
});

interface Profile {
  user_id: string;
  name: string | null;
  profession: string | null;
  wilaya: string | null;
  commune: string | null;
  available: boolean;
  avatar_url?: string | null;
  phone?: string | null;
}

interface PortfolioItem {
  id: string;
  image_url: string;
  caption: string | null;
}

function CraftsmanProfile() {
  const { id } = Route.useParams();
  const { cat } = Route.useSearch();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ count: number; rating: number | null } | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const authed = !!getSession();
  const fetchPhone = useServerFn(getCraftsmanPhone);
  const fetchStats = useServerFn(getCraftsmenStats);
  const fetchPortfolio = useServerFn(getCraftsmanPortfolio);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, profession, wilaya, commune, available, avatar_url")
        .eq("user_id", id)
        .maybeSingle();
      if (!active) return;
      if (error) console.error("[craftsman] fetch failed", error);
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      let phone: string | null = null;
      if (authed) {
        try {
          const res = await fetchPhone({ data: { userId: id } });
          phone = res.phone;
        } catch (e) {
          console.error("[craftsman] phone fetch failed", e);
        }
      }
      try {
        const res = await fetchStats({ data: { userIds: [id] } });
        if (active) setStats(res.stats?.[id] ?? null);
      } catch (e) {
        console.error("[craftsman] stats failed", e);
      }
      try {
        const res = await fetchPortfolio({ data: { userId: id } });
        if (active) setPortfolio(res.items as PortfolioItem[]);
      } catch (e) {
        console.error("[craftsman] portfolio failed", e);
      }
      if (!active) return;
      setProfile({ ...(data as Profile), phone });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, authed, fetchPhone, fetchStats, fetchPortfolio]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-32">
        <div className="mx-auto max-w-md px-5 pt-10 space-y-5">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-3xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-md px-5 pt-20 text-center">
          <div className="card-gold rounded-3xl p-8">
            <div className="text-5xl">😶</div>
            <p className="mt-3 font-bold">الحرفي غير موجود</p>
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

  const displayName = profile.name || "حرفي";
  const contactPhone = profile.phone || "+213541528713";

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link
          to="/category/$id"
          params={{ id: cat ?? "general" }}
          className="text-sm text-muted-foreground"
        >
          → رجوع
        </Link>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-20 w-20 rounded-3xl overflow-hidden gold-gradient text-black font-black flex items-center justify-center text-3xl glow-gold">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black">{displayName}</h1>
            {profile.profession && (
              <p className="text-sm text-[color:var(--gold)]">{profile.profession}</p>
            )}
            {(profile.wilaya || profile.commune) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> {profile.wilaya}
                {profile.commune ? ` · ${profile.commune}` : ""}
              </p>
            )}
            <p
              className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                profile.available
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              {profile.available ? "● متاح" : "● مشغول"}
            </p>
          </div>
        </div>

        {stats && (stats.rating != null || stats.count > 0) && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="card-gold rounded-2xl p-4 text-center">
              <div className="text-[color:var(--gold)] flex justify-center"><Star className="h-4 w-4 fill-current" /></div>
              <p className="mt-1 text-2xl font-black">
                {stats.rating != null ? stats.rating : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">متوسط التقييم</p>
            </div>
            <div className="card-gold rounded-2xl p-4 text-center">
              <p className="text-2xl font-black">{stats.count}</p>
              <p className="text-[10px] text-muted-foreground">عمل منجز</p>
            </div>
          </div>
        )}

        <div className="mt-6 card-gold rounded-2xl p-4">
          <h2 className="text-sm font-bold mb-2">نبذة</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            حرفي متاح للعمل في منطقتك. يمكنك إرسال طلب خدمة وسيتم التواصل معك قريباً.
          </p>
        </div>

        {portfolio.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold mb-3">معرض الأعمال</h2>
            <div className="grid grid-cols-3 gap-2">
              {portfolio.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightbox(p.image_url)}
                  className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-card"
                >
                  <img src={p.image_url} alt={p.caption ?? ""} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-2xl" />
        </div>
      )}

      <div className="fixed bottom-16 inset-x-0 z-30 px-5">
        <div className="mx-auto max-w-md flex gap-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          {authed && (
            <>
              <a
                href={`tel:${contactPhone}`}
                className="h-12 w-12 rounded-xl bg-card border border-white/10 flex items-center justify-center"
              >
                <Phone className="h-4 w-4 text-[color:var(--gold)]" />
              </a>
              <a
                href={`https://wa.me/${contactPhone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="h-12 w-12 rounded-xl bg-card border border-white/10 flex items-center justify-center"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
              </a>
            </>
          )}
          <Link
            to="/requests/new"
            search={{ craftsmanId: id, craftsmanName: displayName }}
            className="flex-1 gold-gradient text-black font-bold rounded-xl flex items-center justify-center text-sm"
          >
            أرسل طلب خدمة ←
          </Link>
        </div>
      </div>

      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
