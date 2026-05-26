import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Bell, CheckCheck, Inbox } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import {
  listNotifications,
  markRead,
  markAllRead,
} from "@/lib/notifications.functions";
import { getSession } from "@/lib/api";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات — حرفي" },
      { name: "description", content: "إشعارات الطلبات والتحديثات" },
    ],
  }),
  component: NotificationsPage,
});

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "الآن";
  if (d < 3600) return `منذ ${Math.floor(d / 60)} د`;
  if (d < 86400) return `منذ ${Math.floor(d / 3600)} س`;
  return `منذ ${Math.floor(d / 86400)} ي`;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const list = useServerFn(listNotifications);
  const mark = useServerFn(markRead);
  const markAll = useServerFn(markAllRead);
  const qc = useQueryClient();

  useEffect(() => {
    if (!getSession()) navigate({ to: "/auth/$role", params: { role: "customer" }, replace: true });
  }, [navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => list(),
    refetchInterval: 30_000,
  });

  const markMut = useMutation({
    mutationFn: (id: string) => mark({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const allMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-4 flex items-center justify-between">
          <Link to="/home" className="text-muted-foreground"><ArrowRight className="h-5 w-5" /></Link>
          <h1 className="text-base font-bold flex items-center gap-2"><Bell className="h-4 w-4 text-[color:var(--gold)]" /> الإشعارات</h1>
          <button
            onClick={() => allMut.mutate()}
            disabled={!items.some((n) => !n.read)}
            className="text-xs text-[color:var(--gold)] disabled:text-muted-foreground flex items-center gap-1"
          >
            <CheckCheck className="h-4 w-4" /> قراءة الكل
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground text-sm">جارٍ التحميل…</div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
            <Inbox className="h-10 w-10 opacity-50" />
            لا توجد إشعارات حتى الآن
          </div>
        ) : (
          items.map((n) => {
            const inner = (
              <div className={`p-4 rounded-2xl border ${n.read ? "border-white/5 bg-white/[0.02]" : "border-[color:var(--gold)]/30 bg-[color:var(--gold)]/[0.06]"}`}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{n.title}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
                {!n.read && <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--gold)]" />}
              </div>
            );
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markMut.mutate(n.id);
                  if (n.request_id) navigate({ to: "/requests/$id", params: { id: n.request_id } });
                }}
                className="w-full text-right"
              >
                {inner}
              </button>
            );
          })
        )}
      </main>
      <BottomNav />
    </div>
  );
}
