import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FloatingContacts } from "@/components/FloatingContacts";
import { useEffect } from "react";
import { getSession } from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  useEffect(() => {
    const s = getSession();
    if (s) navigate({ to: "/home" });
  }, [navigate]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-background">
      {/* glow background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-20%] right-[-10%] h-[60vh] w-[60vh] rounded-full bg-[color:var(--gold)] opacity-[0.12] blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[50vh] w-[50vh] rounded-full bg-[color:var(--gold)] opacity-[0.08] blur-[120px]" />
      </div>

      <div className="mx-auto max-w-md min-h-screen flex flex-col px-6 pt-14 pb-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-3xl gold-gradient flex items-center justify-center text-black text-4xl font-black shadow-xl glow-gold">
            ح
          </div>
          <h1 className="mt-5 text-5xl font-black tracking-tight">
            <span className="gold-text">حرفي</span>
          </h1>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-xs">
            منصة جزائرية تربطك بأفضل الحرفيين في منطقتك — بضغطة واحدة.
          </p>
        </div>

        {/* Hero illustration card */}
        <div className="mt-10 card-gold rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 text-[180px] opacity-10 select-none">🛠️</div>
          <div className="relative">
            <p className="text-xs text-[color:var(--gold)] font-bold tracking-widest">HARFI · DZ</p>
            <h2 className="mt-2 text-2xl font-bold leading-snug">
              ابحث، اطلب، وأنجز<br /> أعمالك بثقة
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2 items-center"><span className="text-[color:var(--gold)]">●</span> حرفيون موثوقون في 58 ولاية</li>
              <li className="flex gap-2 items-center"><span className="text-[color:var(--gold)]">●</span> تتبع طلبك لحظة بلحظة</li>
              <li className="flex gap-2 items-center"><span className="text-[color:var(--gold)]">●</span> تقييم وضمان الجودة</li>
            </ul>
          </div>
        </div>

        <div className="mt-auto pt-10">
          <p className="text-center text-sm text-muted-foreground mb-4">اختر نوع حسابك للمتابعة</p>
          <div className="grid grid-cols-1 gap-3">
            <Link
              to="/auth/$role"
              params={{ role: "customer" }}
              className="group relative rounded-2xl gold-gradient text-black font-bold py-4 px-5 flex items-center justify-between shadow-lg glow-gold"
            >
              <div className="text-right">
                <div className="text-base">أنا عميل</div>
                <div className="text-xs opacity-70 font-medium">أبحث عن حرفي لإنجاز عمل</div>
              </div>
              <span className="h-10 w-10 rounded-xl bg-black/15 flex items-center justify-center text-xl">←</span>
            </Link>

            <Link
              to="/auth/$role"
              params={{ role: "craftsman" }}
              className="group relative rounded-2xl bg-card border border-[color:var(--gold)]/30 text-foreground font-bold py-4 px-5 flex items-center justify-between"
            >
              <div className="text-right">
                <div className="text-base gold-text">أنا حرفي</div>
                <div className="text-xs text-muted-foreground font-medium">أقدم خدمات حرفية وأبحث عن عملاء</div>
              </div>
              <span className="h-10 w-10 rounded-xl bg-[color:var(--gold)]/10 flex items-center justify-center text-xl text-[color:var(--gold)]">←</span>
            </Link>
          </div>

          <Link to="/about" className="block text-center text-xs text-muted-foreground mt-6 hover:text-[color:var(--gold)]">
            من نحن؟
          </Link>
        </div>
      </div>

      <FloatingContacts />
    </main>
  );
}
