import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "harfi_pwa_dismissed";

export function PWAInstallBanner() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    // Already installed?
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore iOS
      window.navigator.standalone === true;
    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show) return null;

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setShow(false);
    setEvt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <div
      dir="rtl"
      className="sticky top-0 z-50 bg-[color:var(--gold)] text-black px-4 py-3 flex items-center gap-3 shadow-lg"
    >
      <button onClick={dismiss} aria-label="إغلاق" className="p-1 -m-1 shrink-0">
        <X className="h-4 w-4" />
      </button>
      <div className="flex-1 text-sm font-bold leading-tight">
        ثبّت التطبيق على هاتفك مجاناً 📲
      </div>
      <button
        onClick={install}
        className="shrink-0 bg-black text-[color:var(--gold)] rounded-xl px-3 py-1.5 text-sm font-bold flex items-center gap-1"
      >
        <Download className="h-4 w-4" /> تثبيت الآن
      </button>
    </div>
  );
}
