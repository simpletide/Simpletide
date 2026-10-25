const BASE = "/images/assets/product%20page%20cards";

const LOGOS = {
  visa: { src: `${BASE}/visa_card.png`, alt: "Visa" },
  mastercard: { src: `${BASE}/mastercard_card.png`, alt: "Mastercard" },
  discover: { src: `${BASE}/discover_card.png`, alt: "Discover" },
  amex: { src: `${BASE}/amex_card.png`, alt: "American Express" },
} as const;

/** Fixed box so every card badge renders at the same size. */
const LOGO_CLASS = "h-6 w-10 shrink-0 object-contain";

type Order = "checkout" | "product";

const ORDER: Record<Order, (keyof typeof LOGOS)[]> = {
  checkout: ["visa", "mastercard", "discover", "amex"],
  product: ["visa", "discover", "mastercard", "amex"],
};

export function AcceptedCardLogos({
  order,
  className,
  decorative,
}: {
  order: Order;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <div className={className} aria-hidden={decorative || undefined}>
      {ORDER[order].map((key) => (
        <img
          key={key}
          src={LOGOS[key].src}
          alt={decorative ? "" : LOGOS[key].alt}
          className={LOGO_CLASS}
          loading="lazy"
          decoding="async"
          style={{ imageRendering: "auto" }}
        />
      ))}
    </div>
  );
}
