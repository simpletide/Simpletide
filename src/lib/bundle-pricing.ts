/**
 * Bundle tier data + line-total math, deliberately free of any catalog import.
 *
 * The cart context needs this on every page, and pulling it from `@/lib/catalog`
 * dragged the entire 82KB product catalog into the app's first-load bundle.
 * Keeping the arithmetic here lets the cart stay lightweight while `catalog.ts`
 * re-exports the same values, so there is still exactly one implementation of
 * the money math.
 */

/**
 * A multi-unit "bundle" discount tier. Generic + data-driven so the same
 * product template can offer bundle pricing across the whole catalog.
 * `minQty` is the number of vials the tier represents (and the quantity a
 * card click snaps to); `discountPct` is applied to the per-unit price.
 */
export type BundleTier = {
  id: string;
  label: string;
  minQty: number;
  discountPct: number;
  badge?: string;
  /** When true, this tier is the default selection (e.g. "best value"). */
  highlight?: boolean;
};

/** Default bundle tiers shared by every product unless overridden per-product. */
export const BUNDLE_TIERS: BundleTier[] = [
  { id: "duo", label: "2 Vials", minQty: 2, discountPct: 5 },
  { id: "trio", label: "3 Vials", minQty: 3, discountPct: 7 },
  { id: "quad", label: "5+ Vials", minQty: 5, discountPct: 10, badge: "BEST VALUE", highlight: true },
];

/** Highest tier satisfied by `qty`, or null when the quantity earns no discount. */
export function tierForQty(tiers: BundleTier[], qty: number): BundleTier | null {
  return [...tiers].reverse().find((t) => qty >= t.minQty) ?? null;
}

export type DiscountedLine = {
  pct: number;
  unit: number;
  lineTotal: number;
  baseTotal: number;
  savings: number;
};

/**
 * The one place bundle line totals are computed. `catalog.discountedLine`
 * resolves per-product tiers and delegates here, so cart, drawer, and checkout
 * can never drift apart on rounding.
 */
export function lineForTiers(
  tiers: BundleTier[],
  unitPrice: number,
  qty: number,
): DiscountedLine {
  const pct = tierForQty(tiers, qty)?.discountPct ?? 0;
  const unit = Number((unitPrice * (1 - pct / 100)).toFixed(2));
  const lineTotal = Number((unit * qty).toFixed(2));
  const baseTotal = Number((unitPrice * qty).toFixed(2));
  return { pct, unit, lineTotal, baseTotal, savings: Number((baseTotal - lineTotal).toFixed(2)) };
}

/**
 * Line total using the shared tiers. Correct for every product today because
 * none define `bundleTiers`; `catalog.discountedLine` is the variant that
 * honours per-product overrides and is what the drawer and checkout call.
 */
export function discountedLineDefault(unitPrice: number, qty: number): DiscountedLine {
  return lineForTiers(BUNDLE_TIERS, unitPrice, qty);
}
