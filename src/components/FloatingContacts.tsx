import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.11 17.39c-.27-.13-1.59-.78-1.84-.87-.25-.09-.43-.13-.61.14-.18.27-.69.87-.85 1.05-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.47.07-.72.34-.25.27-.94.92-.94 2.25 0 1.33.97 2.61 1.1 2.79.13.18 1.9 2.91 4.61 4.08.64.28 1.15.45 1.54.58.65.21 1.24.18 1.71.11.52-.08 1.59-.65 1.81-1.28.22-.63.22-1.17.16-1.28-.07-.11-.25-.18-.52-.31zM16.02 5.33h-.01c-5.92 0-10.73 4.81-10.73 10.72 0 2.11.62 4.07 1.68 5.72L5 27l5.4-1.71a10.66 10.66 0 0 0 5.61 1.6h.01c5.91 0 10.72-4.81 10.72-10.72 0-2.86-1.11-5.55-3.14-7.58a10.65 10.65 0 0 0-7.58-3.26zm0 19.65h-.01a8.9 8.9 0 0 1-4.54-1.25l-.32-.19-3.36 1.06 1.08-3.27-.21-.34a8.93 8.93 0 0 1-1.36-4.74c0-4.93 4.01-8.94 8.95-8.94 2.39 0 4.63.93 6.32 2.62a8.88 8.88 0 0 1 2.61 6.33c0 4.93-4.01 8.94-8.95 8.94z" />
    </svg>
  );
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path fill="#25F4EE" d="M22.5 11.8a8.5 8.5 0 0 1-1.4-.7v8.6a6.6 6.6 0 1 1-6.6-6.6c.2 0 .4 0 .6.1v2.7a3.9 3.9 0 1 0 2.7 3.7V5h2.6a4.9 4.9 0 0 0 2.1 3.4z" transform="translate(-2 0)" />
      <path fill="#FE2C55" d="M24.5 11.8a8.5 8.5 0 0 1-1.4-.7v8.6a6.6 6.6 0 1 1-6.6-6.6c.2 0 .4 0 .6.1v2.7a3.9 3.9 0 1 0 2.7 3.7V5h2.6a4.9 4.9 0 0 0 2.1 3.4z" transform="translate(2 0)" />
      <path fill="#fff" d="M23.5 10.8a8.5 8.5 0 0 1-1.4-.7v8.6a6.6 6.6 0 1 1-6.6-6.6c.2 0 .4 0 .6.1v2.7a3.9 3.9 0 1 0 2.7 3.7V4h2.6a4.9 4.9 0 0 0 2.1 3.4z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

type Link = {
  href: string;
  label: string;
  bg: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  iconColor: string;
};

const links: Link[] = [
  { href: "https://wa.me/213541528713", label: "واتساب 1", bg: "#25D366", Icon: WhatsAppIcon, iconColor: "text-white" },
  { href: "https://wa.me/213775125674", label: "واتساب 2", bg: "#25D366", Icon: WhatsAppIcon, iconColor: "text-white" },
  { href: "https://www.tiktok.com/@homedz25", label: "تيك توك", bg: "#000000", Icon: TikTokIcon, iconColor: "" },
  {
    href: "https://www.instagram.com/plmb.25",
    label: "إنستغرام",
    bg: "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
    Icon: InstagramIcon,
    iconColor: "text-white",
  },
];

export function FloatingContacts() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-center gap-3">
      {open &&
        links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            aria-label={l.label}
            style={{ background: l.bg, width: 48, height: 48 }}
            className="rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-2"
          >
            <l.Icon className={`w-6 h-6 ${l.iconColor}`} />
          </a>
        ))}
      <button
        onClick={() => setOpen((v) => !v)}
        className="gold-gradient text-black rounded-full h-14 w-14 flex items-center justify-center shadow-2xl glow-gold"
        aria-label="تواصل معنا"
      >
        {open ? <X className="w-6 h-6" strokeWidth={3} /> : <Plus className="w-7 h-7" strokeWidth={3} />}
      </button>
    </div>
  );
}
