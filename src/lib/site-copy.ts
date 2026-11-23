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
