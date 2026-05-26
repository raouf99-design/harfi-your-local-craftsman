import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { MapPin, Star, Phone, MessageCircle } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  cat: z.string().optional(),
  name: z.string().optional(),
});

export const Route = createFileRoute("/craftsman/$id")({
  validateSearch: searchSchema,
  component: CraftsmanProfile,
});

const PORTFOLIO = [
  { before: "🚰", after: "✨", title: "إصلاح تسرب حمام" },
  { before: "🔌", after: "💡", title: "تركيب لوحة كهربائية" },
  { before: "🧱", after: "🏠", title: "بلاط مطبخ كامل" },
  { before: "🚪", after: "🚪", title: "تركيب باب خشبي" },
];

function CraftsmanProfile() {
  const { id } = Route.useParams();
  const { cat, name } = Route.useSearch();
  const displayName = name || "محمد بن علي";

  return (
    <main className="min-h-screen bg-background pb-32">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/category/$id" params={{ id: cat ?? "general" }} className="text-sm text-muted-foreground">→ رجوع</Link>

        <div className="mt-5 flex items-center gap-4">
          <div className="h-20 w-20 rounded-3xl gold-gradient text-black font-black flex items-center justify-center text-3xl glow-gold">
            {displayName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black">{displayName}</h1>
            <p className="text-sm text-[color:var(--gold)]">سباك محترف · 8 سنوات خبرة</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" /> الجزائر · باب الزوار
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="التقييم" value="4.9" icon={<Star className="h-3.5 w-3.5 fill-current" />} />
          <Stat label="الأعمال" value="128" />
          <Stat label="الاستجابة" value="< 30د" />
        </div>

        <div className="mt-6 card-gold rounded-2xl p-4">
          <h2 className="text-sm font-bold mb-2">نبذة عني</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            حرفي محترف بخبرة تزيد عن 8 سنوات في مجال السباكة والتدفئة. أقدم خدمات سريعة ومضمونة مع ضمان على جميع الأعمال.
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-bold mb-3">معرض الأعمال (قبل / بعد)</h2>
          <div className="grid grid-cols-2 gap-3">
            {PORTFOLIO.map((p) => (
              <div key={p.title} className="card-gold rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="aspect-square bg-muted/30 flex items-center justify-center text-4xl border-l border-white/10">
                    {p.before}
                  </div>
                  <div className="aspect-square bg-[color:var(--gold)]/10 flex items-center justify-center text-4xl">
                    {p.after}
                  </div>
                </div>
                <p className="text-xs p-2 text-center font-medium">{p.title}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-bold mb-3">آراء العملاء</h2>
          <div className="space-y-2">
            {[
              { n: "أمين ك.", r: 5, t: "عمل احترافي وسريع، أنصح به." },
              { n: "سارة ب.", r: 5, t: "أنجز العمل في الوقت المحدد وبجودة ممتازة." },
            ].map((rv) => (
              <div key={rv.n} className="card-gold rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{rv.n}</p>
                  <span className="text-xs text-[color:var(--gold)]">{"⭐".repeat(rv.r)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{rv.t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed action bar */}
      <div className="fixed bottom-16 inset-x-0 z-30 px-5">
        <div className="mx-auto max-w-md flex gap-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
          <a href="tel:+213541528713" className="h-12 w-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
            <Phone className="h-4 w-4 text-[color:var(--gold)]" />
          </a>
          <a href="https://wa.me/213541528713" target="_blank" rel="noreferrer" className="h-12 w-12 rounded-xl bg-card border border-white/10 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-emerald-400" />
          </a>
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

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="card-gold rounded-2xl p-3 text-center">
      <p className="text-lg font-black flex items-center justify-center gap-1 text-[color:var(--gold)]">
        {icon}{value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
