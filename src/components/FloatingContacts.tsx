import { useEffect, useState } from "react";

const links = [
  { href: "https://wa.me/213541528713", label: "واتساب 1", bg: "bg-emerald-500", icon: "💬" },
  { href: "https://wa.me/213775125674", label: "واتساب 2", bg: "bg-emerald-600", icon: "💬" },
  { href: "https://www.tiktok.com/@homedz25", label: "تيك توك", bg: "bg-black border border-white/20", icon: "🎵" },
  { href: "https://www.instagram.com/plmb.25", label: "إنستغرام", bg: "bg-gradient-to-br from-fuchsia-500 to-orange-400", icon: "📷" },
];

export function FloatingContacts() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-3">
      {open &&
        links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className={`${l.bg} text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg text-lg animate-in fade-in slide-in-from-bottom-2`}
            aria-label={l.label}
          >
            <span>{l.icon}</span>
          </a>
        ))}
      <button
        onClick={() => setOpen((v) => !v)}
        className="gold-gradient text-black rounded-full h-14 w-14 flex items-center justify-center shadow-2xl glow-gold font-bold text-xl"
        aria-label="تواصل معنا"
      >
        {open ? "✕" : "☎"}
      </button>
    </div>
  );
}
