import type { supabase as SupabaseClient } from "@/integrations/supabase/client";

/**
 * On-demand accessor for the Supabase client.
 *
 * The SDK is ~110KB and was previously reachable from the root layout, so every
 * page paid for it. Importing it through here keeps it in its own chunk that is
 * fetched after first paint (see `AuthProvider`) or when a feature actually
 * needs it. The promise is cached, so concurrent callers share one fetch and
 * one client instance — important because the client owns the auth session and
 * its refresh timer.
 *
 * Pages that are useless without Supabase (login, account, checkout, order
 * tracking) still import `@/integrations/supabase/client` directly; their route
 * chunk is only downloaded when that page is visited.
 */
let clientPromise: Promise<typeof SupabaseClient> | null = null;
const loadListeners = new Set<() => void>();

export function getSupabase(): Promise<typeof SupabaseClient> {
  clientPromise ??= import("@/integrations/supabase/client").then((m) => {
    for (const listener of loadListeners) listener();
    loadListeners.clear();
    return m.supabase;
  });
  return clientPromise;
}

/**
 * Run `cb` the first time anything loads the Supabase client.
 *
 * `AuthProvider` skips loading the SDK for signed-out visitors, which also
 * means its auth listener isn't attached yet. If that visitor then logs in,
 * the login form loads the client — this hook is how the provider finds out and
 * starts tracking the session, so the header updates without a reload.
 */
export function onSupabaseLoaded(cb: () => void): () => void {
  if (clientPromise) {
    cb();
    return () => {};
  }
  loadListeners.add(cb);
  return () => loadListeners.delete(cb);
}

/**
 * Warm the chunk without needing the client, for hover/focus on links that lead
 * somewhere Supabase-backed. Failures are intentionally swallowed.
 */
export function preloadSupabase(): void {
  void getSupabase().catch(() => {});
}

/**
 * Whether a Supabase session is persisted in this browser.
 *
 * The client is configured with `storage: localStorage`, so a signed-in visitor
 * always has an `sb-<ref>-auth-token` key. Checking for it lets a signed-out
 * visitor skip downloading and parsing the ~200KB SDK entirely — there is no
 * session for it to restore or refresh, and the header is correctly logged out
 * either way. Signed-in visitors still load it immediately after first paint.
 *
 * The project ref isn't hardcoded so this keeps working if the project changes.
 */
export function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && /^sb-.+-auth-token$/.test(key)) return true;
    }
  } catch {
    // Storage can throw in private mode / blocked-cookie contexts. Assume a
    // session might exist so auth still works rather than silently staying out.
    return true;
  }
  return false;
}
