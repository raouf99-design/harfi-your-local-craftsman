import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getUnreadCount } from "@/lib/notifications.functions";
import { getSession } from "@/lib/api";

export function NotificationBell() {
  const getCount = useServerFn(getUnreadCount);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!getSession()) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await getCount();
        if (!stop) setCount(r.count);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 30_000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => {
      stop = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [getCount]);

  return (
    <Link
      to="/notifications"
      className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/5 border border-white/10 text-foreground"
      aria-label="الإشعارات"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-1 -left-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[color:var(--gold)] text-black text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
