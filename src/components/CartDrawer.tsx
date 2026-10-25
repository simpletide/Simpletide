import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, ArrowRight, ShieldCheck } from "lucide-react";

import { AcceptedCardLogos } from "@/components/AcceptedCardLogos";
import { useCart } from "@/lib/cart-context";
import { slugFor, discountedLine, baseProductName } from "@/lib/catalog";
import { imageForTitle, sizeForTitle, formatVariant, splitNameVariant } from "@/lib/drawer-product-image";

const BAC_PRICE = 20.0;

export function CartDrawer() {
  const { isOpen, closeCart, items, subtotal, baseSubtotal, bundleSavings, removeItem, setQty, addItem } = useCart();
  const bacItem = items.find(
    (i) => i.id === "bac-water-10ml" || slugFor(baseProductName(i.name)) === "bac-water",
  );
  const bacImage = imageForTitle("BAC WATER");

  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const applyPromo = () => {
    if (!promo.trim()) return;
    setPromoMsg("Invalid or expired code");
  };

  const shipping = 0;
  const total = subtotal + shipping;

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const addBac = () =>
    addItem({
      id: "bac-water-10ml",
      name: "BAC Water - 10ML",
      tag: "Add-on",
      price: BAC_PRICE,
      variant: "10ML",
      qty: 1,
    });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 cursor-pointer bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white text-slate-900 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-5 border-b border-slate-200">
          <h2 className="text-base sm:text-lg font-bold tracking-tight">Shopping Cart</h2>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items (+ upsell scrolls with cart so footer stays short on mobile) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <p className="text-slate-600 mb-1">Your cart is empty.</p>
              <p className="text-xs text-slate-400">Add a product to get started.</p>
              <Link
                to="/products"
                onClick={closeCart}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
              >
                Start Shopping <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => {
                const { title, variant } = splitNameVariant(item.name);
                const variantLabel = item.variant ?? variant ?? sizeForTitle(title);
                const image = imageForTitle(title, variantLabel);
                const line = discountedLine(item.name, item.price, item.qty);
                return (
                  <li
                    key={item.id}
                    className="flex gap-2.5 items-center p-2 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
                  >
                    <div className="w-20 h-20 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {image ? (
                        <img
                          src={image}
                          alt={title}
                          className="h-[125%] w-[125%] max-w-none object-contain drop-shadow-sm"
                          loading="lazy"
                          decoding="async"
                          style={{ imageRendering: "auto" }}
                        />
                      ) : (
                        <div className="w-5 h-10 bg-white rounded-sm border border-slate-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex flex-col items-start">
                          <h3 className="max-w-full font-bold text-sm text-slate-900 leading-snug truncate">{title}</h3>
                          {variantLabel && (
                            <span className="mt-0.5 rounded bg-[#d3def6] px-1.5 py-0.5 text-[10px] font-semibold text-[#3559a6]">
                              {formatVariant(variantLabel)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors shrink-0"
                          aria-label={`Remove ${item.name}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center border border-slate-200 rounded-full">
                          <button
                            onClick={() => setQty(item.id, item.qty - 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                          <button
                            onClick={() => setQty(item.id, item.qty + 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {line.pct > 0 && (
                            <span className="text-xs text-slate-400 line-through">{fmt(line.baseTotal)}</span>
                          )}
                          <span className="text-sm font-bold text-slate-900">{fmt(line.lineTotal)}</span>
                        </div>
                      </div>
                      {line.pct > 0 && (
                        <p className="mt-1 text-right text-[11px] font-semibold text-emerald-600">
                          {line.pct}% bundle discount applied
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

        </div>

        {/* Footer: financials + checkout — hidden entirely when the cart is empty (Peptora-style) */}
        {items.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-2.5 space-y-1.5 sm:px-6 sm:py-4 sm:space-y-3 bg-white shrink-0">
          {/* Cross-sell: BAC Water — pinned directly above the promo code */}
          {items.length > 0 && !bacItem && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:rounded-2xl sm:p-4">
              <div className="flex gap-2 sm:gap-3 items-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {bacImage && (
                    <img
                      src={bacImage}
                      alt="BAC Water"
                      className="h-[125%] w-[125%] max-w-none object-contain drop-shadow-sm"
                      loading="lazy"
                      decoding="async"
                      style={{ imageRendering: "auto" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex flex-col items-start">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        BAC Water
                      </h3>
                      <span className="mt-0.5 inline-block rounded bg-[#d3def6] px-1.5 py-0.5 text-[10px] font-semibold text-[#3559a6]">
                        {formatVariant("10ML")}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-wide bg-[#a78bfa]/10 text-[#8b5cf6] px-1.5 py-0.5 rounded-full shrink-0 sm:px-2">
                      Recommended
                    </span>
                  </div>
                  <div className="mt-1.5 sm:mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{fmt(BAC_PRICE)}</span>
                    <button
                      onClick={addBac}
                      className="inline-flex items-center gap-1 rounded-full bg-[#1A1A1A] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#2A2A2A] sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-xs"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Promo code */}
          {items.length > 0 && (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value);
                    if (promoMsg) setPromoMsg(null);
                  }}
                  placeholder="Promo code"
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-st-cyan focus:ring-2 focus:ring-st-cyan/30"
                />
                <button
                  onClick={applyPromo}
                  className="shrink-0 rounded-lg bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Apply
                </button>
              </div>
              {promoMsg && <p className="mt-1 text-xs font-medium text-red-600 sm:mt-1.5">{promoMsg}</p>}
            </div>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs sm:text-sm">Subtotal</span>
            <span className="font-bold text-xs sm:text-sm">{fmt(baseSubtotal)}</span>
          </div>

          {bundleSavings > 0 && (
            <div className="flex items-center justify-between text-emerald-600">
              <span className="font-semibold text-xs sm:text-sm">Bundle savings</span>
              <span className="font-bold text-xs sm:text-sm">-{fmt(bundleSavings)}</span>
            </div>
          )}

          {items.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-slate-700 sm:text-sm">Shipping</span>
              <span className="font-semibold text-xs text-emerald-500 sm:text-sm">
                FREE
              </span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 sm:pt-2">
            <span className="font-bold text-sm sm:text-base">Total</span>
            <span className="font-bold text-sm sm:text-base">{fmt(total)}</span>
          </div>

          {/* Checkout button */}
          <Link
            to="/checkout"
            onClick={closeCart}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white text-sm font-semibold py-2.5 rounded-full transition-all hover:brightness-110 sm:gap-2 sm:py-3"
          >
            Proceed to Checkout <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Trust footer */}
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 sm:gap-x-2.5 sm:gap-y-1.5">
            <AcceptedCardLogos
              order="checkout"
              decorative
              className="flex items-center gap-1.5 sm:gap-2.5 [&_img]:!h-5 [&_img]:!w-8 sm:[&_img]:!h-6 sm:[&_img]:!w-10"
            />
            <span className="text-[10px] sm:text-[11px] text-slate-500 inline-flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> 100% secure payments
            </span>
          </div>
        </div>
        )}
      </aside>
    </>
  );
}
