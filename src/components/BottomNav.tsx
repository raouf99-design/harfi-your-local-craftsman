import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Briefcase, ClipboardList, User } from "lucide-react";

const items = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/requests", label: "طلباتي", icon: ClipboardList },
  { to: "/dashboard", label: "لوحتي", icon: Briefcase },
  { to: "/about", label: "من نحن", icon: User },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to);
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
