import { CATALOG, getProductBySlug, seoProductSlug, resolveCatalogSlug } from "@/lib/catalog";

/** Production site origin — override with VITE_SITE_URL in deploy env. */
export const SITE_ORIGIN = (
  (import.meta.env.VITE_SITE_URL as string | undefined)?.trim() || "https://simpletide.com"
).replace(/\/$/, "");

/** Default social preview (hosted on your domain). */
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/images/cards/glp-3-rt.jpg`;

export function normalizePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${normalizePath(path)}`;
}

export function productPath(catalogOrLegacySlug: string): string {
  const product = getProductBySlug(catalogOrLegacySlug);
  if (!product) return `/product/${resolveCatalogSlug(catalogOrLegacySlug)}`;
  return `/product/${seoProductSlug(product.slug)}`;
}

type PageSeoInput = {
  path: string;
  title: string;
  description: string;
  ogImage?: string;
  noindex?: boolean;
};

/** Standard TanStack Router `head()` payload for a public page. */
export function pageSeoHead({ path, title, description, ogImage, noindex }: PageSeoInput) {
  const url = absoluteUrl(path);
  const image = ogImage ? (ogImage.startsWith("http") ? ogImage : absoluteUrl(ogImage)) : DEFAULT_OG_IMAGE;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:site_name", content: "Simpletide" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function productSeoHead(product: import("@/lib/catalog").CatalogProduct) {
  const path = productPath(product.slug);
  const title = `${product.name} | Simpletide`;
  const description =
    product.description ??
    `${product.name} — premium research compound by Simpletide. Third-party lab tested.`;
  const ogImage = product.image.startsWith("http") ? product.image : absoluteUrl(product.image);

  return pageSeoHead({ path, title, description, ogImage });
}

export type SitemapEntry = {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
};

/** Static + product URLs for sitemap.xml (canonical simpletide.com paths). */
export function buildSitemapEntries(): SitemapEntry[] {
  const staticPages: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/products", changefreq: "weekly", priority: "0.9" },
    { path: "/about", changefreq: "monthly", priority: "0.7" },
    { path: "/faq", changefreq: "monthly", priority: "0.6" },
    { path: "/contact", changefreq: "monthly", priority: "0.6" },
    { path: "/coa-archive", changefreq: "monthly", priority: "0.6" },
    { path: "/track-order", changefreq: "monthly", priority: "0.5" },
    { path: "/privacy-policy", changefreq: "yearly", priority: "0.4" },
    { path: "/terms-of-service", changefreq: "yearly", priority: "0.4" },
    { path: "/shipping-returns", changefreq: "yearly", priority: "0.4" },
  ];

  const products: SitemapEntry[] = CATALOG.map((p) => ({
    path: productPath(p.slug),
    changefreq: "weekly" as const,
    priority: "0.8",
  }));

  return [...staticPages, ...products];
}

/** 301 redirects from old simpletide.com paths → new routes. */
export const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  "/shop": "/products",
  "/products/peptides": "/products",
  "/products/essentials": "/products",
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/coa": "/coa-archive",
  "/lab-reports": "/coa-archive",
  "/terms-conditions": "/terms-of-service",
  "/terms": "/terms-of-service",
  "/shipping-policy": "/shipping-returns",
  "/refund-return-policy": "/shipping-returns",
  "/shipping": "/shipping-returns",
  "/refund": "/shipping-returns",
};
