import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — حرفي" },
      { name: "description", content: "حرفي منصة جزائرية تربط العملاء بأفضل الحرفيين المحليين." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link to="/" className="text-sm text-muted-foreground">→ رجوع</Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-14 w-14 rounded-2xl gold-gradient flex items-center justify-center text-black font-black text-2xl">ح</div>
          <div>
            <h1 className="text-2xl font-black gold-text">حرفي</h1>
            <p className="text-xs text-muted-foreground">Harfi · Algeria</p>
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
          منصة جزائرية رائدة تربط العملاء بأمهر الحرفيين المحليين في جميع الولايات. مهمتنا تسهيل الوصول لخدمات حرفية موثوقة، شفافة، وعالية الجودة.
        </p>

        <h2 className="mt-7 text-base font-bold">رسالتنا</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          نؤمن بأن كل بيت يستحق حرفياً ماهراً، وكل حرفي يستحق فرصة عادلة. نبني جسراً بين الطرفين بالتقنية والثقة.
        </p>

        <h2 className="mt-7 text-base font-bold">قيمنا</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            { t: "الجودة", d: "حرفيون موثقون ومراجعات حقيقية." },
            { t: "السرعة", d: "ربط فوري مع أقرب حرفي متاح." },
            { t: "الشفافية", d: "أسعار واضحة وتقييمات صادقة." },
            { t: "الدعم", d: "فريق دعم متواجد لمساعدتك." },
          ].map((v) => (
            <li key={v.t} className="card-gold rounded-2xl p-3">
              <p className="font-bold text-[color:var(--gold)]">{v.t}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{v.d}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-7 text-base font-bold">تواصل معنا</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <a href="https://wa.me/213541528713" target="_blank" rel="noreferrer" className="card-gold rounded-2xl p-3 text-center">
            💬 واتساب 1
          </a>
          <a href="https://wa.me/213775125674" target="_blank" rel="noreferrer" className="card-gold rounded-2xl p-3 text-center">
            💬 واتساب 2
          </a>
          <a href="https://www.tiktok.com/@homedz25" target="_blank" rel="noreferrer" className="card-gold rounded-2xl p-3 text-center">
            🎵 تيك توك
          </a>
          <a href="https://www.instagram.com/plmb.25" target="_blank" rel="noreferrer" className="card-gold rounded-2xl p-3 text-center">
            📷 إنستغرام
          </a>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} حرفي · جميع الحقوق محفوظة
        </p>
      </div>
      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
