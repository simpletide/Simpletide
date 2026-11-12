/**
 * Primary call-to-action styling, shared so the homepage, newsletter and
 * product cards can't drift apart.
 *
 * Solid slate-900 rather than the pastel gradient the homepage used: white on
 * that gradient's lightest stop (#f9a8d4) measures 1.8:1, far below the 4.5:1
 * WCAG AA minimum, so the label washed out across the left half of every
 * button. slate-900 measures 17.9:1 and matches the product page's existing
 * Add to cart button. `scripts/verify-conversion.mjs` re-measures both numbers
 * against the rendered page.
 */
const LIFT = "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/25 active:translate-y-0";

/** Full-size CTA: hero "Shop Products", "See all products", Subscribe. */
export const CTA_PRIMARY = `inline-flex items-center justify-center rounded-full bg-slate-900 px-8 py-3 font-bold text-white hover:bg-slate-800 ${LIFT}`;

/** Card-width CTA: "Add to cart" on a product card. */
export const CTA_CARD = `inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-slate-900 font-bold text-white hover:bg-slate-800 ${LIFT}`;
