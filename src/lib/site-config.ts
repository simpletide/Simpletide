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

/** Default social preview (hosted on your domain).
 *  Stays JPEG: Facebook/X/iMessage link scrapers don't reliably render WebP. */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/cards/glp-3-rt.jpg`;

export function normalizePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${normalizePath(path)}`;
}
