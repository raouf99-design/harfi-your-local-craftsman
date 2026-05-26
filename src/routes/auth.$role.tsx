import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { setSession, type Role } from "@/lib/api";

export const Route = createFileRoute("/auth/$role")({
  component: AuthPage,
});

function AuthPage() {
  const { role } = Route.useParams() as { role: Role };
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("سباك");
  const [wilaya, setWilaya] = useState("الجزائر");
  const [commune, setCommune] = useState("");
  const [loading, setLoading] = useState(false);

  const isCraftsman = role === "craftsman";

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^0?[5-7][0-9]{8}$/.test(phone.replace(/\s/g, ""))) {
      alert("رقم الهاتف غير صحيح");
      return;
    }
    setLoading(true);
    // Mocked OTP send — backend can be wired here
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 600);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4 && otp.length !== 6) {
      alert("أدخل رمز التحقق");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setSession({
        user: {
          id: crypto.randomUUID(),
          phone,
          role,
          name: name || (isCraftsman ? "حرفي جديد" : "عميل جديد"),
          ...(isCraftsman ? { profession, wilaya, commune, available: true } : {}),
        },
      });
      setLoading(false);
      navigate({ to: isCraftsman ? "/dashboard" : "/home" });
    }, 600);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-6 pt-10 pb-20">
        <Link to="/" className="text-sm text-muted-foreground">→ رجوع</Link>

        <div className="mt-6">
          <p className="text-xs text-[color:var(--gold)] tracking-widest font-bold">
            {isCraftsman ? "حساب حرفي" : "حساب عميل"}
          </p>
          <h1 className="mt-2 text-3xl font-black">
            {step === "phone" ? "أدخل رقم هاتفك" : "تحقق من الرمز"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "phone"
              ? "سنرسل لك رمز التحقق عبر رسالة قصيرة."
              : `أدخل الرمز المرسل إلى ${phone}`}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="mt-8 space-y-4">
            {isCraftsman && (
              <>
                <Field label="الاسم الكامل">
                  <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="مثال: محمد بن علي" required />
                </Field>
                <Field label="المهنة">
                  <select value={profession} onChange={(e) => setProfession(e.target.value)} className="input">
                    {["سباك", "كهربائي", "دهان", "نجار", "حداد", "بلاط", "فني تكييف", "أعمال عامة"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الولاية">
                    <input value={wilaya} onChange={(e) => setWilaya(e.target.value)} className="input" required />
                  </Field>
                  <Field label="البلدية">
                    <input value={commune} onChange={(e) => setCommune(e.target.value)} className="input" required />
                  </Field>
                </div>
              </>
            )}
            <Field label="رقم الهاتف">
              <div className="flex gap-2">
                <span className="input !w-20 text-center text-muted-foreground">+213</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input flex-1"
                  placeholder="05XX XXX XXX"
                  inputMode="tel"
                  required
                />
              </div>
            </Field>
            <button disabled={loading} className="btn-gold w-full mt-2">
              {loading ? "جارٍ الإرسال..." : "إرسال رمز التحقق"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-8 space-y-4">
            <Field label="رمز التحقق">
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input text-center text-2xl tracking-[0.6em] font-bold"
                placeholder="••••"
                inputMode="numeric"
                autoFocus
              />
            </Field>
            <p className="text-xs text-muted-foreground text-center">
              للتجربة، أدخل أي 4 أرقام
            </p>
            <button disabled={loading} className="btn-gold w-full mt-2">
              {loading ? "..." : "تأكيد ومتابعة"}
            </button>
            <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-muted-foreground py-2">
              تغيير الرقم
            </button>
          </form>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          background: var(--input);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 14px 16px;
          color: var(--foreground);
          font-family: inherit;
          font-size: 15px;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px color-mix(in oklab, var(--gold) 20%, transparent); }
        .btn-gold {
          background: linear-gradient(135deg, oklch(0.85 0.1 85), oklch(0.7 0.14 75));
          color: #000;
          font-weight: 800;
          border-radius: 14px;
          padding: 14px 20px;
          box-shadow: 0 8px 24px -8px color-mix(in oklab, var(--gold) 50%, transparent);
        }
        .btn-gold:disabled { opacity: .6; }
      `}</style>
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
