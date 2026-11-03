import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, hasStoredSession, onSupabaseLoaded } from "@/lib/supabase-lazy";
import { afterFirstPaint } from "@/lib/after-first-paint";

type AuthValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let started = false;
    let unsubscribe: (() => void) | undefined;

    const start = async () => {
      // Both the same-tab load hook and the cross-tab storage event can fire;
      // only one auth listener should ever be attached.
      if (started) return;
      started = true;

      let supabase;
      try {
        supabase = await getSupabase();
      } catch {
        // Missing env vars or a failed chunk fetch must not wedge the UI in a
        // permanent loading state; the rest of the site works signed out.
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        setLoading(false);
      } catch {
        if (mounted) setLoading(false);
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      });
      unsubscribe = () => sub.subscription.unsubscribe();

      // The listener is attached after the await above, so a sign-in that
      // landed in between would be missed without this re-read.
      if (!mounted) {
        unsubscribe();
        return;
      }
      const { data: latest } = await supabase.auth.getSession();
      if (mounted) setSession((prev) => prev ?? latest.session);
    };

    // A signed-in visitor has a persisted token, so load the SDK right after
    // first paint and restore/refresh the session as before. A signed-out
    // visitor has nothing to restore, so the SDK is left for whenever a feature
    // actually needs it (login, checkout, newsletter, account).
    if (!hasStoredSession()) {
      setLoading(false);

      // Logging in on this tab loads the client through the login form, so
      // follow along and start tracking the session from there.
      const offLoad = onSupabaseLoaded(() => {
        if (mounted) void start();
      });

      // Signing in from another tab writes the token; pick it up here so this
      // tab doesn't stay logged out until a reload.
      const onStorage = (e: StorageEvent) => {
        if (e.key && /^sb-.+-auth-token$/.test(e.key) && e.newValue) void start();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        mounted = false;
        offLoad();
        window.removeEventListener("storage", onStorage);
        unsubscribe?.();
      };
    }

    const cancel = afterFirstPaint(() => {
      void start();
    });

    return () => {
      mounted = false;
      cancel();
      unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Best-effort display name from Supabase user metadata or email. */
export function displayNameFor(user: User | null): string {
  if (!user) return "Account";
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return meta?.full_name || meta?.name || user.email?.split("@")[0] || "Account";
}

/** First + last initial (e.g. Ryan Thorsen → RT). */
export function profileInitialsFor(user: User | null): string {
  if (!user) return "A";
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const full = (meta?.full_name || meta?.name || displayNameFor(user)).trim();
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (user.email?.[0] || "A").toUpperCase();
}
