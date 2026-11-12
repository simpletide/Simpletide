import type { ShopBadge } from "@/lib/shop-products";

/**
 * Corner flag on a product card.
 *
 * The catalog has carried a `badge` field all along, but nothing rendered it,
 * so "BEST SELLING!" never reached a shopper. Labels are rewritten here rather
 * than in the data so the catalog keeps its existing values.
 */
const STYLES: Record<Exclude<ShopBadge, null>, { label: string; className: string }> = {
  "BEST SELLING!": { label: "Best Seller", className: "bg-slate-900 text-white" },
  "SALE!": { label: "Sale", className: "bg-[#be185d] text-white" },
  "OUT OF STOCK": { label: "Out of Stock", className: "bg-slate-500 text-white" },
};

export function ProductBadge({ badge }: { badge: ShopBadge }) {
  const style = badge ? STYLES[badge] : undefined;
  if (!style) return null;
  return (
    <span
      className={`absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm sm:left-3 sm:top-3 ${style.className}`}
    >
      {style.label}
    </span>
  );
}
