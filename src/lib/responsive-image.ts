/**
 * Builds `srcset` strings for the width variants produced by
 * `scripts/generate-responsive-images.mjs`.
 *
 * The originals are large enough for desktop retina (hero vials are 1200px
 * wide, cards 960px) but phones were downloading them to paint a ~160px card.
 * Each variant file sits beside its source as `<name>-<width>.webp`, and the
 * original stays in the list as the widest candidate.
 */

type Variants = { widths: number[]; intrinsic: number };

const BY_FOLDER: Record<string, Variants> = {
  "/images/hero-vials/": { widths: [400, 800], intrinsic: 1200 },
  "/images/cards/": { widths: [320, 640], intrinsic: 960 },
  "/images/vials/": { widths: [320, 640], intrinsic: 800 },
};

/**
 * `srcset` for a generated image, or undefined when the path has no variants
 * (imported assets, remote URLs, anything outside the folders above).
 */
export function srcSetFor(src: string | null | undefined): string | undefined {
  if (!src || !src.endsWith(".webp")) return undefined;

  const folder = Object.keys(BY_FOLDER).find((f) => src.includes(f));
  if (!folder) return undefined;

  // Already a variant (…-320.webp); don't build a set from one.
  if (/-\d+\.webp$/.test(src)) return undefined;

  const { widths, intrinsic } = BY_FOLDER[folder];
  const base = src.replace(/\.webp$/, "");
  const candidates = widths
    .filter((w) => w < intrinsic)
    .map((w) => `${base}-${w}.webp ${w}w`);

  return [...candidates, `${src} ${intrinsic}w`].join(", ");
}

/** Intrinsic width/height of a generated image, for layout-shift-free markup. */
export function intrinsicSizeFor(src: string | null | undefined): { width: number; height: number } | undefined {
  if (!src) return undefined;
  if (src.includes("/images/hero-vials/")) return { width: 1200, height: 1500 };
  if (src.includes("/images/cards/")) return { width: 960, height: 1200 };
  if (src.includes("/images/vials/")) return { width: 800, height: 1200 };
  return undefined;
}

/** `sizes` for the product card grid: 2-up on phones, 4-up from `sm` upward. */
export const CARD_SIZES = "(min-width: 1024px) 306px, (min-width: 640px) 25vw, 45vw";
