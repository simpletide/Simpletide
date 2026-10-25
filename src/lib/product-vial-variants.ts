import { baseProductName, getProductBySlug, slugFor, type CatalogProduct } from "@/lib/catalog";

// Per-size hero images (slug -> size -> image). Empty until per-size Simpletide
// vial art exists; every size falls back to the product's own photo.
const VARIANT_HERO: Record<string, Record<string, string>> = {};

export function heroImageForVariant(slug: string, size: string, fallback: string): string {
  return VARIANT_HERO[slug]?.[size] ?? fallback;
}

function variantFromCartName(name: string): string | null {
  const bacMatch = name.match(/^BAC Water \(([^)]+)\)$/i);
  if (bacMatch) return bacMatch[1];
  const dashIdx = name.lastIndexOf(" - ");
  if (dashIdx > -1) return name.slice(dashIdx + 3);
  return null;
}

function resolveCatalogSize(product: CatalogProduct, size: string): string {
  const trimmed = size.trim();
  if (!trimmed) return product.variants[0]?.size ?? "";
  const match = product.variants.find((v) => v.size.toLowerCase() === trimmed.toLowerCase());
  return match?.size ?? trimmed;
}

/** Cart/checkout vial thumbnail for a product name + optional mg size. */
export function vialImageForProduct(name: string, variant?: string | null): string | null {
  const title = baseProductName(name);
  const slug = slugFor(title);
  if (!slug) return null;

  const product = getProductBySlug(slug);
  if (!product) return null;

  const rawSize = variant ?? variantFromCartName(name) ?? product.variants[0]?.size ?? "";
  const size = resolveCatalogSize(product, rawSize);
  const fallback = product.heroImage ?? product.image;

  return heroImageForVariant(slug, size, fallback);
}

export function hasVariantHeroImages(slug: string): boolean {
  return slug in VARIANT_HERO;
}

export function preloadHeroImage(src: string) {
  const img = new Image();
  img.src = src;
}
