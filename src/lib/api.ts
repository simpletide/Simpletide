/**
 * Resolves the base URL for the existing Simpletide Express API
 * (payments, orders, emails, affiliates). The new site talks to that proven
 * backend cross-origin instead of re-implementing it.
 *
 * Resolution order:
 *  1. VITE_API_URL (explicit override — set this in production)
 *  2. localhost dev → the local API dev server on :3000
 *  3. Fallback → the existing production backend
 */
export function apiBase(): string {
  const explicit = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      // Local frontend only — orders/payments hit the deployed Railway API.
      return "https://web-production-a7fad.up.railway.app";
    }
  }

  // Production default — same Railway backend Payment Admin uses.
  return "https://web-production-a7fad.up.railway.app";
}

/** Builds a full API URL for a given path (e.g. apiUrl("/api/keybilling/pay")). */
export function apiUrl(path: string): string {
  const base = apiBase();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
