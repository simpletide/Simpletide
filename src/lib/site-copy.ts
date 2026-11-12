import { BUNDLE_TIERS } from "@/lib/bundle-pricing";

/**
 * Promises the site makes in more than one place, kept in one file so the
 * announcement bar, homepage, footer and product pages can't contradict each
 * other.
 *
 * The cutoff is the one published on /shipping-returns; change it there and
 * here together.
 */
export const SHIPPING_CUTOFF = "4PM ET";

/** The full shipping promise. Announcement bar, product page, FAQ. */
export const SHIPPING_PROMISE = `Order by ${SHIPPING_CUTOFF} — ships same day. Free priority shipping.`;

/** Short form for trust strips and badges, where the full sentence won't fit. */
export const SHIPPING_SHORT = `Ships same day (${SHIPPING_CUTOFF})`;

/**
 * Stated on every product card, so it reads the tiers rather than restating
 * them — a tier change would otherwise leave the cards advertising a discount
 * checkout no longer gives.
 */
export const MAX_BUNDLE_DISCOUNT_PCT = Math.max(...BUNDLE_TIERS.map((t) => t.discountPct));
export const BUNDLE_SAVINGS_LINE = `Save up to ${MAX_BUNDLE_DISCOUNT_PCT}% on bundles`;
