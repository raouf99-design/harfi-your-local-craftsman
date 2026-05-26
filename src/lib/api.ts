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

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const session = getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const msg = (data && typeof data === "object" && "message" in data)
      ? (data as { message: string }).message
      : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}
