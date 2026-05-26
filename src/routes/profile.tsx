import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { PortfolioManager } from "@/components/PortfolioManager";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession, setSession, type Session } from "@/lib/api";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { LogOut, Save, Info } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const PROFESSIONS = ["سباك", "كهربائي", "دهان", "نجار", "حداد", "بلاط", "فني تكييف", "أعمال عامة"];

function ProfilePage() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMyProfile);
  const saveMe = useServerFn(updateMyProfile);
  const [session, setSess] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [profession, setProfession] = useState("سباك");
  const [wilaya, setWilaya] = useState("");
  const [commune, setCommune] = useState("");
  const [available, setAvailable] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setSess(s);
    (async () => {
      try {
        const res = await fetchMe({});
        const p = res.profile;
        setName(p?.name ?? s.user.name ?? "");
        setProfession(p?.profession ?? s.user.profession ?? "سباك");
        setWilaya(p?.wilaya ?? s.user.wilaya ?? "");
        setCommune(p?.commune ?? s.user.commune ?? "");
        setAvailable(p?.available ?? true);
        setAvatarUrl(p?.avatar_url ?? null);
      } catch (e) {
        console.error("[profile] load failed", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, fetchMe]);

  if (!session) return null;
  const isCraftsman = session.user.role === "craftsman";

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedOk(false);
    try {
      await saveMe({
        data: {
          name: name.trim() || undefined,
          ...(isCraftsman
            ? {
                profession,
                wilaya: wilaya.trim() || undefined,
                commune: commune.trim() || undefined,
                available,
              }
            : {}),
        },
      });
      setSession({
        ...session,
        user: { ...session.user, name, profession, wilaya, commune, available },
      });
      setSavedOk(true);
    } catch (err) {
      console.error("[profile] save failed", err);
      setError("تعذّر حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    setSession(null);
    navigate({ to: "/" });
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/home" className="text-sm text-muted-foreground">→ رجوع</Link>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-20 w-20 rounded-3xl overflow-hidden gold-gradient text-black font-black flex items-center justify-center text-3xl glow-gold">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (name || session.user.name || "ح").charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black">{name || "حسابي"}</h1>
            <p className="text-xs text-[color:var(--gold)]">
              {isCraftsman ? "حساب حرفي" : "حساب عميل"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{session.user.phone}</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : (
          <form onSubmit={save} className="mt-6 space-y-4">
            <Field label="الاسم الكامل">
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
            </Field>

            {isCraftsman && (
              <>
                <Field label="المهنة">
                  <select value={profession} onChange={(e) => setProfession(e.target.value)} className="input">
                    {PROFESSIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الولاية">
                    <input value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input" />
                  </Field>
                  <Field label="البلدية">
                    <input value={commune} onChange={(e) => setCommune(e.target.value)} className="input" />
                  </Field>
                </div>
                <label className="card-gold rounded-2xl p-4 flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-sm font-bold">حالة التوفر</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      عند الإيقاف، لن يظهر اسمك للعملاء.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="h-5 w-5 accent-[color:var(--gold)]"
                  />
                </label>
              </>
            )}

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
            {savedOk && (
              <p className="text-xs text-emerald-400 text-center">تم حفظ التعديلات ✓</p>
            )}

            <button disabled={saving} className="btn-gold w-full inline-flex items-center justify-center gap-2">
              <Save className="h-4 w-4" /> {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </form>
        )}

        <div className="mt-6 space-y-2">
          <Link to="/about" className="card-gold rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 text-[color:var(--gold)]" /> من نحن
            </span>
            <span className="text-muted-foreground">←</span>
          </Link>
          <button
            onClick={logout}
            className="w-full card-gold rounded-2xl p-4 flex items-center justify-between border border-red-500/20"
          >
            <span className="text-sm font-bold text-red-400 flex items-center gap-2">
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </span>
            <span className="text-red-400/60">←</span>
          </button>
        </div>
      </div>

      <style>{`
        .input { width:100%; background: var(--input); border:1px solid var(--border); border-radius:14px; padding:14px 16px; color: var(--foreground); font:inherit; font-size:15px; outline:none; }
        .input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px color-mix(in oklab, var(--gold) 20%, transparent); }
        .btn-gold { background: linear-gradient(135deg, oklch(0.85 0.1 85), oklch(0.7 0.14 75)); color:#000; font-weight:800; border-radius:14px; padding:14px 20px; }
        .btn-gold:disabled { opacity:.6; }
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
