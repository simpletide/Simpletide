import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart, parsePrice } from "@/lib/cart-context";
import { descriptorFor, slugFor, seoProductSlug } from "@/lib/catalog";
import { SHOP_VARIANTS, shopProductId, type ShopProduct } from "@/lib/shop-products";
type ProductCardProps = {
  product: ShopProduct;
  /** Tighter layout for dense grids (e.g. the search dropdown): square image,
   *  smaller text, no descriptor line, compact button. */
  compact?: boolean;
};

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const id = shopProductId(product.name);
  const variants = SHOP_VARIANTS[product.name];
  const [selectedSize, setSelectedSize] = useState<string | null>(
    variants ? variants[0].size : null,
  );
  const selectedVariant = variants?.find((v) => v.size === selectedSize) ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const slug = slugFor(product.name);
  const productSlug = slug ? seoProductSlug(slug) : null;

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 text-slate-900 group flex flex-col h-full hover:shadow-xl hover:border-slate-300 transition-all overflow-hidden shadow-sm">
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-xl">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {productSlug && (
          <Link to="/product/$slug" params={{ slug: productSlug }} className="absolute inset-0 z-0" aria-label={`View ${product.name}`} />
        )}
      </div>

      <div className={`flex-grow flex flex-col ${compact ? "px-3 py-2.5" : "px-3 py-2.5 sm:px-5 sm:py-3.5"}`}>
        <div className={`flex flex-col gap-0.5 ${compact ? "mb-2.5" : "mb-1"}`}>
          {(() => {
            const heading = (
              <h3 className={`font-bold text-gray-900 leading-snug ${compact ? "text-[13px]" : "text-[13px] sm:text-base"}`}>{product.name}</h3>
            );
            return productSlug ? (
              <Link to="/product/$slug" params={{ slug: productSlug }} className="min-w-0 hover:text-gray-700 transition-colors">
                {heading}
              </Link>
            ) : (
              <div className="min-w-0">{heading}</div>
            );
          })()}
          <span className={`font-bold text-gray-900 whitespace-nowrap ${compact ? "text-[13px]" : "text-[13px] sm:text-base"}`}>{product.price}</span>
        </div>
        {!compact && (
          <p className="text-[11px] tracking-wider text-gray-500 mb-2 sm:mb-2.5">
            {descriptorFor(product.name) ?? product.category ?? "Research Compound"}
          </p>
        )}
        {product.outOfStock ? (
          <button
            disabled
            className={`w-full bg-gray-100 border border-gray-200 text-gray-400 rounded-full font-bold cursor-not-allowed mt-auto uppercase tracking-wider ${compact ? "py-2 text-xs" : "py-2.5 sm:py-3 text-sm"}`}
          >
            Out of Stock
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (variants) {
                setIsOpen((open) => !open);
              } else {
                const cartName = product.name === "GLOW" ? "GLOW - 70mg" : product.name;
                addItem({
                  id,
                  name: cartName,
                  tag: product.category ?? "Research",
                  price: parsePrice(product.price),
                  variant: product.name === "GLOW" ? "70mg" : undefined,
                });
                openCart();
              }
            }}
                      className={`group/cart w-full mt-auto inline-flex cursor-pointer items-center justify-center rounded-full border border-[#1A1A1A] bg-[#1A1A1A] font-bold text-white transition-all duration-300 hover:bg-white hover:text-[#1A1A1A] hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.20),0_0_40px_8px_rgba(167,139,250,0.10)] ${compact ? "py-2 text-xs" : "py-2.5 sm:py-3 text-sm"}`}
          >
            <span>Add to cart</span>
            <div className="w-0 overflow-hidden transition-all duration-200 ease-out group-hover/cart:ml-2 group-hover/cart:w-4">
              <ArrowRight className="h-4 w-4 flex-shrink-0 -translate-x-2 opacity-0 transition-all duration-200 ease-out group-hover/cart:translate-x-0 group-hover/cart:opacity-100" />
            </div>
          </button>
        )}
      </div>

      {variants && (
        <div
          ref={isOpen ? popoverRef : undefined}
          className={`absolute inset-x-0 bottom-0 bg-white border-t border-gray-200 rounded-b-2xl shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.25)] transform transition-all duration-300 ease-out ${
            compact ? "p-2.5" : "p-5"
          } ${
            isOpen
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className={`flex items-center justify-between ${compact ? "mb-1.5" : "mb-3"}`}>
            <p className={`uppercase tracking-wider text-gray-500 font-semibold ${compact ? "text-[9px]" : "text-[11px]"}`}>Select Size</p>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close size selector"
            >
              <X className={compact ? "w-3.5 h-3.5 text-gray-500" : "w-4 h-4 text-gray-500"} />
            </button>
          </div>
          <div
            className={
              compact
                ? `grid w-full mb-2 gap-1 ${
                    variants.length === 1
                      ? "grid-cols-1"
                      : variants.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2"
                  }`
                : `mb-4 grid w-full gap-2 ${
                    variants.length <= 1
                      ? "grid-cols-1"
                      : variants.length === 3
                        ? "grid-cols-3"
                        : "grid-cols-2"
                  } max-sm:[&>button]:min-w-0 sm:flex sm:flex-wrap`
            }
          >
            {variants.map((v) => {
              const active = selectedSize === v.size;
              return (
                <button
                  key={v.size}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedSize(v.size);
                  }}
                  className={`flex w-full min-w-0 flex-col items-center justify-center border font-semibold transition-all ${
                    compact
                      ? "rounded-lg px-1 py-1 text-[11px]"
                      : "rounded-xl px-2 py-2.5 text-xs sm:min-w-[64px] sm:w-auto sm:px-3 sm:py-2"
                  } ${
                    active
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-800 hover:border-gray-500"
                  }`}
                >
                  <span className="leading-tight">{v.size}</span>
                  <span className={`leading-tight ${compact ? "mt-0 text-[9px]" : "mt-0.5 text-[10px]"} ${active ? "text-white/80" : "text-gray-500"}`}>
                    ${v.price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!selectedVariant) return;
              addItem({
                id: `${id}--${selectedVariant.size}`,
                name: `${product.name} - ${selectedVariant.size}`,
                tag: product.category ?? "Research",
                price: selectedVariant.price,
                variant: selectedVariant.size,
              });
              setIsOpen(false);
              openCart();
            }}
            className={`group/cart w-full inline-flex items-center justify-center rounded-full border border-[#1A1A1A] bg-[#1A1A1A] font-bold text-white transition-all duration-300 hover:bg-white hover:text-[#1A1A1A] hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.20),0_0_40px_8px_rgba(167,139,250,0.10)] ${
              compact
                ? "flex-row gap-1 py-2 text-[11px] whitespace-nowrap"
                : "flex-col sm:flex-row gap-0.5 sm:gap-1.5 leading-tight py-2.5 sm:py-3 text-sm"
            }`}
          >
            <span>Add to cart</span>
            {!compact && <span className="hidden sm:inline">—</span>}
            {!compact && <span>${selectedVariant?.price.toFixed(2)}</span>}
          </button>
        </div>
      )}
    </div>
  );
}
