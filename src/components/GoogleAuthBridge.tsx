import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { completeGoogleAuth } from "@/lib/auth.functions";
import { getSession, setSession, type Role } from "@/lib/api";
import { GOOGLE_PENDING_ROLE_KEY } from "@/components/GoogleSignInButton";

/**
 * Watches the Supabase auth session. After a successful Google OAuth
 * redirect the lovable broker calls supabase.auth.setSession() and we get
 * a SIGNED_IN event here. We then call completeGoogleAuth to provision
 * the Harfi profile + role and persist the legacy harfi_session.
 */
export function GoogleAuthBridge() {
  const navigate = useNavigate();
  const finish = useServerFn(completeGoogleAuth);
  const handling = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const handleSession = async (
      event: "SIGNED_IN" | "INITIAL_SESSION" | string,
      hasSession: boolean,
    ) => {
      if (!hasSession) return;
      if (getSession()) return; // already bridged
      if (handling.current) return;
      handling.current = true;

      const pending = (() => {
        try {
          return localStorage.getItem(GOOGLE_PENDING_ROLE_KEY) as Role | null;
        } catch {
          return null;
        }
      })();

      try {
        const res = await finish({ data: { role: pending ?? undefined } });
        setSession({ user: res.user });
        try {
          localStorage.removeItem(GOOGLE_PENDING_ROLE_KEY);
        } catch {
          /* ignore */
        }
        if (event === "SIGNED_IN") {
          toast.success("تم تسجيل الدخول بنجاح");
        }
        navigate({ to: "/home" });
      } catch (err) {
        console.error("[google-bridge] completion failed", err);
        toast.error("تعذّر إكمال تسجيل الدخول، حاول مرة أخرى");
        try {
          await supabase.auth.signOut();
        } catch {
          /* ignore */
        }
      } finally {
        handling.current = false;
      }
    };

    // Initial check (in case the page loaded with an existing supabase session)
    supabase.auth.getSession().then(({ data }) => {
      handleSession("INITIAL_SESSION", !!data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        if (getSession()) {
          setSession(null);
          toast.info("تم تسجيل الخروج");
          navigate({ to: "/" });
        }
        return;
      }
      handleSession(event, !!session);
    });
    unsub = () => data.subscription.unsubscribe();

    return () => {
      unsub?.();
    };
  }, [finish, navigate]);

  return null;
}
