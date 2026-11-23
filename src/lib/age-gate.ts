export const AGE_STORAGE_KEY = "simpletide-researcher-verified";
export const AGE_COOKIE_NAME = "simpletide_age_ok";

/** Routes readable before passing the researcher/age gate (e.g. compliance links on /age). */
const AGE_BYPASS_PATHS = new Set([
  "/age",
  "/terms-of-service",
  "/privacy-policy",
  "/disclaimer",
]);

export function isAgeBypassPath(pathname: string): boolean {
  const clean = (pathname || "/").replace(/\/+$/, "") || "/";
  return AGE_BYPASS_PATHS.has(clean) || clean.startsWith("/age/");
}

/**
 * Only allow relative internal paths for `?return=...` to prevent open redirects
 * and redirect loops back into `/age`.
 */
export function sanitizeReturnPath(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/";
  }
  const pathOnly = trimmed.split(/[?#]/)[0] || "/";
  if (pathOnly === "/age" || pathOnly.startsWith("/age/")) {
    return "/";
  }
  return trimmed;
}

export function isAgeVerifiedClient(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.localStorage.getItem(AGE_STORAGE_KEY) === "true") return true;
  } catch {
    /* ignore */
  }
  try {
    if (document.cookie.includes(`${AGE_COOKIE_NAME}=1`)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function markAgeVerifiedClient(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AGE_STORAGE_KEY, "true");
  } catch {
    /* ignore */
  }
  try {
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `${AGE_COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/**
 * Runs synchronously in <head> before first paint so unverified visitors landing on
 * any storefront page are immediately redirected to `/age?return=<encoded path>`
 * without ever flashing products, vials, or store UI.
 */
export const FIRST_PAINT_AGE_GATE_SCRIPT = `(function(){try{var p=(location.pathname||"/").replace(/\\/+$/,"")||"/";if(p==="/age"||p.indexOf("/age/")===0||p==="/terms-of-service"||p==="/privacy-policy"||p==="/disclaimer")return;var ok=false;try{ok=localStorage.getItem("${AGE_STORAGE_KEY}")==="true";}catch(e){}if(!ok&&document.cookie.indexOf("${AGE_COOKIE_NAME}=1")!==-1)ok=true;if(!ok){var r=(location.pathname||"/")+(location.search||"")+(location.hash||"");location.replace("/age?return="+encodeURIComponent(r||"/"));}}catch(e){}})();`;
