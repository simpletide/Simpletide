import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase-lazy";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { canAccessPaymentAdmin } from "@/lib/admin";

export const LIVE_VISITORS_CHANNEL = "simpletide:live-visitors";

export type LiveVisitorPresence = {
  visitorId: string;
  path: string;
  stage: "browse" | "product" | "checkout";
  cartCount: number;
  joinedAt: string;
  updatedAt: string;
};

function getOrCreateVisitorId(): string {
  try {
    const key = "simpletide_vid_v1";
    const existing = window.sessionStorage.getItem(key);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return `v-${Date.now().toString(36)}`;
  }
}

function stageForPath(path: string): "browse" | "product" | "checkout" {
  if (path.startsWith("/checkout")) return "checkout";
  if (path.startsWith("/product")) return "product";
  return "browse";
}

/**
 * Lazy-mounted after first paint inside `DeferredWidgets`.
 * 1) Joins Supabase Realtime Presence so Payment Admin shows live visitors + current page.
 * 2) Logs lightweight anonymous pageviews into `public.site_visits` for 24h / 7d funnel stats.
 * Skips tracking when signed in as the Payment Admin account so admin browsing never inflates counts.
 */
export function SitePresenceTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { items } = useCart();
  const { user } = useAuth();
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);
  const isAdmin = canAccessPaymentAdmin(user?.email);

  const channelRef = useRef<{ track: (payload: LiveVisitorPresence) => Promise<unknown> } | null>(null);
  const joinedAtRef = useRef<string>(new Date().toISOString());
  const lastLoggedPathRef = useRef<string>("");
  const visitorIdRef = useRef<string>("");

  // Join Supabase Realtime Presence once per browser session
  useEffect(() => {
    if (typeof window === "undefined" || isAdmin) return;

    let active = true;
    let cleanup: (() => void) | undefined;
    visitorIdRef.current = getOrCreateVisitorId();

    void (async () => {
      try {
        const supabase = await getSupabase();
        if (!active) return;
        const channel = supabase.channel(LIVE_VISITORS_CHANNEL, {
          config: { presence: { key: visitorIdRef.current } },
        });
        channel.subscribe(async (status) => {
          if (status === "SUBSCRIBED" && active) {
            channelRef.current = channel;
            await channel.track({
              visitorId: visitorIdRef.current,
              path: window.location.pathname || "/",
              stage: stageForPath(window.location.pathname || "/"),
              cartCount,
              joinedAt: joinedAtRef.current,
              updatedAt: new Date().toISOString(),
            });
          }
        });
        cleanup = () => {
          channelRef.current = null;
          void supabase.removeChannel(channel);
        };
      } catch {
        /* non-blocking */
      }
    })();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [isAdmin]);

  // Update presence metadata + log pageview whenever pathname or cart changes
  useEffect(() => {
    if (typeof window === "undefined" || isAdmin) return;
    const vid = visitorIdRef.current || getOrCreateVisitorId();
    visitorIdRef.current = vid;
    const stage = stageForPath(pathname);

    if (channelRef.current) {
      void channelRef.current
        .track({
          visitorId: vid,
          path: pathname,
          stage,
          cartCount,
          joinedAt: joinedAtRef.current,
          updatedAt: new Date().toISOString(),
        })
        .catch(() => {});
    }

    // Dedupe rapid duplicate route effects on the same path
    if (lastLoggedPathRef.current === pathname) return;
    lastLoggedPathRef.current = pathname;

    void (async () => {
      try {
        const supabase = await getSupabase();
        const sb = supabase as unknown as {
          from: (t: string) => { insert: (row: Record<string, unknown>) => Promise<unknown> };
        };
        await sb.from("site_visits").insert({
          visitor_id: vid,
          path: pathname.slice(0, 256),
          stage,
        });
      } catch {
        /* non-blocking */
      }
    })();
  }, [pathname, cartCount, isAdmin]);

  return null;
}
