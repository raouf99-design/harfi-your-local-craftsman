import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { FloatingContacts } from "@/components/FloatingContacts";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, MessageCircle, MapPin, Star } from "lucide-react";
import { getSession } from "@/lib/api";
import {
  getRequestDetail,
  cancelRequest,
  rateRequest,
  startJob,
  completeJob,
} from "@/lib/service-requests.functions";

export const Route = createFileRoute("/requests/$id")({
  component: RequestDetail,
});

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار الموافقة", color: "bg-yellow-500/20 text-yellow-300" },
  accepted: { label: "مقبول", color: "bg-blue-500/20 text-blue-300" },
  in_progress: { label: "قيد التنفيذ", color: "bg-[color:var(--gold)]/20 text-[color:var(--gold)]" },
  completed: { label: "مكتمل", color: "bg-emerald-500/20 text-emerald-300" },
  cancelled: { label: "ملغى", color: "bg-red-500/20 text-red-300" },
};

interface Detail {
  request: {
    id: string;
    category: string;
    address: string;
    description: string;
    status: string;
    price: number | null;
    created_at: string;
    rating: number | null;
  };
  customer: { name: string | null; phone: string | null } | null;
  craftsman: {
    name: string | null;
    phone: string | null;
    profession: string | null;
    wilaya: string | null;
    commune: string | null;
  } | null;
  role: "customer" | "craftsman" | "viewer";
}

function RequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchDetail = useServerFn(getRequestDetail);
  const cancelFn = useServerFn(cancelRequest);
  const rateFn = useServerFn(rateRequest);
  const startFn = useServerFn(startJob);
  const completeFn = useServerFn(completeJob);

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDetail({ data: { id } });
      setData(res as Detail);
    } catch (err) {
      console.error("[request.detail] failed", err);
    } finally {
      setLoading(false);
    }
  }, [fetchDetail, id]);

  useEffect(() => {
    if (!getSession()) {
      navigate({ to: "/" });
      return;
    }
    refresh();
  }, [navigate, refresh]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      console.error("[request.detail] action failed", e);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-md px-5 pt-10 space-y-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-md px-5 pt-20 text-center">
          <div className="card-gold rounded-3xl p-8">
            <div className="text-5xl">😶</div>
            <p className="mt-3 font-bold">الطلب غير موجود</p>
            <Link to="/requests" className="mt-5 inline-block gold-gradient text-black font-bold rounded-xl px-5 py-2.5 text-sm">
              العودة للطلبات
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const r = data.request;
  const st = STATUS[r.status] ?? STATUS.pending;
  const counterparty = data.role === "customer" ? data.craftsman : data.customer;
  const counterpartyPhone = counterparty?.phone;

  return (
    <main className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-md px-5 pt-10">
        <Link
          to={data.role === "craftsman" ? "/dashboard" : "/requests"}
          className="text-sm text-muted-foreground"
        >
          → رجوع
        </Link>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">{r.category}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(r.created_at).toLocaleString("ar-DZ")}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
        </div>

        <div className="mt-5 card-gold rounded-2xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {r.address}
          </p>
          <p className="text-sm leading-relaxed">{r.description}</p>
          {r.price ? (
            <p className="pt-2 mt-2 border-t border-white/10 text-sm">
              السعر التقديري: <span className="gold-text font-black">{r.price.toLocaleString("ar-DZ")} دج</span>
            </p>
          ) : null}
        </div>

        {counterparty && (
          <div className="mt-4 card-gold rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">
              {data.role === "customer" ? "الحرفي" : "العميل"}
            </p>
            <p className="font-bold mt-1">{counterparty.name || "—"}</p>
            {data.role === "customer" && data.craftsman?.profession && (
              <p className="text-xs text-[color:var(--gold)]">{data.craftsman.profession}</p>
            )}
            {counterpartyPhone && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${counterpartyPhone}`}
                  className="py-2.5 rounded-xl bg-card border border-white/10 text-sm flex items-center justify-center gap-2"
                >
                  <Phone className="h-4 w-4 text-[color:var(--gold)]" /> اتصال
                </a>
                <a
                  href={`https://wa.me/${counterpartyPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> واتساب
                </a>
              </div>
            )}
          </div>
        )}

        {/* Customer actions */}
        {data.role === "customer" && (
          <div className="mt-5 space-y-3">
            {(r.status === "pending" || r.status === "accepted") && (
              <button
                disabled={busy}
                onClick={() => act(() => cancelFn({ data: { id } }))}
                className="w-full py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 font-bold"
              >
                إلغاء الطلب
              </button>
            )}
            {r.status === "completed" && (
              <div className="card-gold rounded-2xl p-4">
                <p className="text-sm font-bold">قيّم الحرفي</p>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      disabled={busy}
                      onClick={() => act(() => rateFn({ data: { id, rating: n } }))}
                    >
                      <Star
                        className={`h-7 w-7 ${
                          (r.rating ?? 0) >= n
                            ? "text-[color:var(--gold)] fill-current"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Craftsman actions */}
        {data.role === "craftsman" && (
          <div className="mt-5 space-y-3">
            {r.status === "accepted" && (
              <button
                disabled={busy}
                onClick={() => act(() => startFn({ data: { id } }))}
                className="w-full py-3 rounded-2xl gold-gradient text-black font-bold"
              >
                ابدأ العمل
              </button>
            )}
            {r.status === "in_progress" && (
              <button
                disabled={busy}
                onClick={() => act(() => completeFn({ data: { id } }))}
                className="w-full py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold"
              >
                إنهاء العمل
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
      <FloatingContacts />
    </main>
  );
}
