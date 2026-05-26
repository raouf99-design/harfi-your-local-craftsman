// API client for Harfi backend
export const API_BASE = "https://harfi-app.onrender.com";

export type Role = "customer" | "craftsman";

export interface User {
  id: string;
  phone: string;
  role: Role;
  name?: string;
  profession?: string;
  wilaya?: string;
  commune?: string;
  available?: boolean;
}

const STORAGE_KEY = "harfi_session";

export interface Session {
  user: User;
  token?: string;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else localStorage.removeItem(STORAGE_KEY);
}

// Generic, user-safe error class. Raw backend messages are logged to the
// console for debugging but NEVER surfaced in the UI.
export class ApiError extends Error {
  status: number;
  constructor(status: number, userMessage: string) {
    super(userMessage);
    this.status = status;
  }
}

function safeMessageForStatus(status: number): string {
  if (status === 0) return "تعذّر الاتصال بالخادم، تحقق من الإنترنت";
  if (status === 400) return "البيانات المُدخلة غير صحيحة";
  if (status === 401 || status === 403) return "غير مصرّح، يرجى تسجيل الدخول مجدداً";
  if (status === 404) return "العنصر المطلوب غير موجود";
  if (status === 409) return "حدث تعارض، حاول مرة أخرى";
  if (status === 422) return "البيانات المُدخلة غير صحيحة";
  if (status === 429) return "محاولات كثيرة، حاول لاحقاً";
  if (status >= 500) return "خطأ مؤقت في الخادم، حاول لاحقاً";
  return "تعذّر إتمام الطلب";
}

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const session = getSession();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  } catch (err) {
    console.error("[api] network error", path, err);
    throw new ApiError(0, safeMessageForStatus(0));
  }
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    // Log the raw backend response for developers, but never expose it to the UI.
    console.error("[api] error response", path, res.status, data);
    throw new ApiError(res.status, safeMessageForStatus(res.status));
  }
  return data as T;
}

