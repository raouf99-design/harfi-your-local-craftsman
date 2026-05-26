import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  uploadCraftsmanMedia,
  getCraftsmanPortfolio,
  deletePortfolioItem,
} from "@/lib/portfolio.functions";
import { Camera, ImagePlus, Trash2, Loader2 } from "lucide-react";

interface PortfolioItem {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
}

interface Props {
  userId: string;
  currentAvatarUrl: string | null;
  onAvatarChange?: (url: string) => void;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let bin = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function PortfolioManager({ userId, currentAvatarUrl, onAvatarChange }: Props) {
  const upload = useServerFn(uploadCraftsmanMedia);
  const list = useServerFn(getCraftsmanPortfolio);
  const del = useServerFn(deletePortfolioItem);

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [avatar, setAvatar] = useState<string | null>(currentAvatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [portBusy, setPortBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const workRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatar(currentAvatarUrl);
  }, [currentAvatarUrl]);

  useEffect(() => {
    (async () => {
      try {
        const res = await list({ data: { userId } });
        setItems(res.items as PortfolioItem[]);
      } catch (e) {
        console.error("[portfolio] load", e);
      }
    })();
  }, [userId, list]);

  const pickAvatar = () => avatarRef.current?.click();
  const pickWork = () => workRef.current?.click();

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(null);
    setAvatarBusy(true);
    try {
      const base64 = await fileToBase64(f);
      const res = await upload({
        data: { kind: "avatar", mimeType: f.type, base64 },
      });
      if (res.url) {
        setAvatar(res.url);
        onAvatarChange?.(res.url);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "تعذّر رفع الصورة");
    } finally {
      setAvatarBusy(false);
    }
  };

  const onWorkFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setError(null);
    setPortBusy(true);
    try {
      for (const f of files) {
        const base64 = await fileToBase64(f);
        const res = await upload({
          data: { kind: "portfolio", mimeType: f.type, base64 },
        });
        if (res.item) setItems((prev) => [res.item as PortfolioItem, ...prev]);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "تعذّر رفع الصور");
    } finally {
      setPortBusy(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm("حذف هذه الصورة؟")) return;
    try {
      await del({ data: { id } });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "تعذّر الحذف");
    }
  };

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="card-gold rounded-2xl p-4">
        <p className="text-sm font-bold mb-3">الصورة الشخصية</p>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-card border border-white/10 flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground" />
            )}
            {avatarBusy && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={pickAvatar}
            disabled={avatarBusy}
            className="flex-1 rounded-xl border border-[color:var(--gold)]/40 px-4 py-3 text-sm font-bold text-[color:var(--gold)]"
          >
            {avatar ? "تغيير الصورة" : "إضافة صورة شخصية"}
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onAvatarFile}
          />
        </div>
      </div>

      {/* Portfolio */}
      <div className="card-gold rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold">معرض الأعمال</p>
          <button
            type="button"
            onClick={pickWork}
            disabled={portBusy}
            className="inline-flex items-center gap-1.5 rounded-lg gold-gradient text-black font-bold px-3 py-1.5 text-xs"
          >
            {portBusy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5" />
            )}
            إضافة
          </button>
          <input
            ref={workRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={onWorkFile}
          />
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            أضف صور أعمالك السابقة لتزيد ثقة العملاء بك.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((it) => (
              <div key={it.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeItem(it.id)}
                  className="absolute top-1 left-1 h-7 w-7 rounded-full bg-black/70 flex items-center justify-center"
                  aria-label="حذف"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-300" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
