/**
 * Origin + URL helpers with no catalog dependency.
 *
 * The root layout needs `SITE_ORIGIN` and `DEFAULT_OG_IMAGE` for its meta tags.
 * Those used to come from `site-seo`, which imports the product catalog, so
 * every page downloaded the catalog just to render two `<meta>` tags. `site-seo`
 * re-exports these, so existing imports are unaffected.
 */

/** Production site origin — override with VITE_SITE_URL in deploy env. */
export const SITE_ORIGIN = (
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() || "https://simpletide.com"
).replace(/\/$/, "");

/** Default social preview (1200×630 JPEG hosted on your domain).
 *  Stays JPEG: Facebook/X/iMessage/WhatsApp link scrapers reliably render JPEG. */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.jpg?v=2`;
export const DEFAULT_OG_IMAGE_WIDTH = "1200";
export const DEFAULT_OG_IMAGE_HEIGHT = "630";
export const DEFAULT_OG_IMAGE_ALT = "Simpletide — High-purity lab-tested research compounds";

export function normalizePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${normalizePath(path)}`;
}
