import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, Briefcase, ClipboardList, User, Wallet } from "lucide-react";
import { getSession, type Session } from "@/lib/api";

const CUSTOMER_ITEMS = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/requests", label: "طلباتي", icon: ClipboardList },
  { to: "/profile", label: "حسابي", icon: User },
] as const;

const CRAFTSMAN_ITEMS = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/dashboard", label: "لوحتي", icon: Briefcase },
  { to: "/earnings", label: "أرباحي", icon: Wallet },
  { to: "/profile", label: "حسابي", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  const [session, setSess] = useState<Session | null>(() => getSession());

  useEffect(() => {
    setSess(getSession());
  }, [location.pathname]);

  if (!session) return null;

  const items = session.user.role === "craftsman" ? CRAFTSMAN_ITEMS : CUSTOMER_ITEMS;
  const cols = items.length === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-xl">
      <div className={`mx-auto max-w-md grid ${cols}`}>
        {items.map((it) => {
          const active = location.pathname === it.to || location.pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-col items-center justify-center py-3 gap-1 text-[11px] transition-colors ${
                active ? "text-[color:var(--gold)]" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
