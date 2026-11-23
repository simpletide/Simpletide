export type PromoCartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  variant?: string;
};

export type BogoSummary = {
  totalUnits: number;
  freeCount: number;
  /** Discount earned right now from paired vials (every 2nd vial of equal or lesser value is free). */
  discount: number;
  /** True when the cart has an odd number of vials (adding 1 more unlocks a free vial). */
  needsPair: boolean;
  /** The unpaired item whose 2nd vial becomes free if the customer clicks "Add one more". */
  pairCandidate: PromoCartItem | null;
};

export const BOGO_CODE = "BOGO";

/**
 * Standard retail Buy One Get One Free (equal or lesser value):
 * sort all individual vial prices descending and discount every 2nd vial.
 */
export function calculateBogo(items: PromoCartItem[]): BogoSummary {
  const units: Array<{ price: number; item: PromoCartItem }> = [];
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.qty));
    for (let i = 0; i < qty; i++) {
      units.push({ price: Number(item.price) || 0, item });
    }
  }

  units.sort((a, b) => b.price - a.price);

  let discount = 0;
  let freeCount = 0;
  for (let i = 1; i < units.length; i += 2) {
    discount += units[i].price;
    freeCount += 1;
  }

  const needsPair = units.length % 2 === 1;
  const pairCandidate = needsPair ? units[units.length - 1].item : null;

  return {
    totalUnits: units.length,
    freeCount,
    discount: Number(discount.toFixed(2)),
    needsPair,
    pairCandidate,
  };
}

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isSupportedPromoCode(raw: string): boolean {
  return normalizePromoCode(raw) === BOGO_CODE;
}

/** Formats the effective per-vial price under BOGO (50% off when paired), e.g. "$20" or "$17.50". */
export function formatBogoUnitPrice(unitPrice: number): string {
  const half = Math.round(Math.round(unitPrice * 100) / 2) / 100;
  return Number.isInteger(half) ? `$${half}` : `$${half.toFixed(2)}`;
}

/** Compact card micro-copy showing the effective BOGO per-vial rate, e.g. "BOGO · from $20/vial". */
export function formatBogoCardLabel(priceText: string, unitPrice: number): string {
  const unit = formatBogoUnitPrice(unitPrice);
  const isFrom = /^from\b/i.test(priceText.trim());
  return isFrom ? `BOGO · from ${unit}/vial` : `BOGO · ${unit}/vial`;
}
