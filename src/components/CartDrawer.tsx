import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Gift } from "lucide-react";

import { AcceptedCardLogos } from "@/components/AcceptedCardLogos";
import { useCart, FREE_BAC_WATER_THRESHOLD } from "@/lib/cart-context";
import { slugFor, baseProductName } from "@/lib/catalog";
import { BOGO_CODE } from "@/lib/promo-codes";
import { FREE_SHIPPING_THRESHOLD, shippingFeeForSubtotal } from "@/lib/site-copy";
import { imageForTitle, sizeForTitle, formatVariant, splitNameVariant } from "@/lib/drawer-product-image";
import { useEntered } from "@/lib/use-overlay-mount";

const BAC_PRICE = 24.99;

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    subtotal,
    baseSubtotal,
    promoCode,
    promoDiscount,
    bogoPreview,
    hasFreeBacWater,
    freeBacWaterRemaining,
    applyPromoCode,
    clearPromoCode,
    removeItem,
    setQty,
    addItem,
  } = useCart();

  // Mounted on demand, so it arrives with `isOpen` already true; delaying the
  // visible state one frame preserves the slide-in transition.
  const entered = useEntered(isOpen);
  const shown = isOpen && entered;
  const bacItem = items.find(
    (i) => i.id === "bac-water-10ml" || slugFor(baseProductName(i.name)) === "bac-water",
  );
  const bacImage = imageForTitle("BAC WATER");

  const [promo, setPromo] = useState("");
  const [promoStatus, setPromoStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const handleApplyPromo = (codeOverride?: string) => {
    const raw = (codeOverride ?? promo).trim();
    if (!raw) return;
    const res = applyPromoCode(raw);
    setPromoStatus(res);
    if (res.ok) setPromo("");
  };

  const handleAddPairAndApply = () => {
    const candidate = bogoPreview.pairCandidate;
    if (!candidate) return;
    setQty(candidate.id, candidate.qty + 1);
    if (promoCode !== BOGO_CODE) {
      applyPromoCode(BOGO_CODE);
    }
    setPromoStatus(null);
  };

  const shipping = shippingFeeForSubtotal(subtotal);
  const freeShippingRemaining = Math.max(0, Number((FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)));
  const total = Number((subtotal + shipping).toFixed(2));
  const bogoActive = promoCode === BOGO_CODE;

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

  const pairTitle = bogoPreview.pairCandidate
    ? (() => {
        const { title, variant } = splitNameVariant(bogoPreview.pairCandidate.name);
        const v = bogoPreview.pairCandidate.variant ?? variant;
        return v ? `${title} ${formatVariant(v)}` : title;
      })()
    : "";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={`fixed inset-0 cursor-pointer bg-black/50 z-40 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white text-slate-900 z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          shown ? "translate-x-0" : "translate-x-full"
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

        {/* Items (+ Simpletide BOGO promo card scrolls with cart) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 space-y-3">
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
            <>
              <ul className="space-y-2">
                {items.map((item) => {
                  const { title, variant } = splitNameVariant(item.name);
                  const variantLabel = item.variant ?? variant ?? sizeForTitle(title);
                  const image = imageForTitle(title, variantLabel);
                  const lineTotal = Number((item.price * item.qty).toFixed(2));
                  const isGift = Boolean(item.isFreeGift);
                  return (
                    <li
                      key={item.id}
                      className={`flex gap-2.5 items-center p-2 rounded-xl border transition-colors ${
                        isGift
                          ? "border-emerald-200 bg-gradient-to-r from-emerald-50/60 via-white to-violet-50/40"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="w-20 h-20 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {image ? (
                          <img
                            src={image}
                            alt={title}
                            className="pointer-events-none h-[125%] w-[125%] max-w-none object-contain drop-shadow-sm"
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
                            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                              {variantLabel && (
                                <span className="rounded bg-[#d3def6] px-1.5 py-0.5 text-[10px] font-semibold text-[#3559a6]">
                                  {formatVariant(variantLabel)}
                                </span>
                              )}
                              {isGift && (
                                <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                  <Gift className="h-2.5 w-2.5" /> Free Gift ($150+)
                                </span>
                              )}
                            </div>
                          </div>
                          {!isGift && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors shrink-0"
                              aria-label={`Remove ${item.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          {isGift ? (
                            <span className="text-[11px] font-medium text-emerald-700">
                              Qty: 1 · Auto-added
                            </span>
                          ) : (
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
                          )}
                          {isGift ? (
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                              <span className="text-xs font-medium text-slate-400 line-through">
                                {fmt(BAC_PRICE)}
                              </span>
                              FREE
                            </span>
                          ) : (
                            <span className="text-sm font-bold text-slate-900">{fmt(lineTotal)}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Simpletide Buy One Get One promo card */}
              <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-br from-[#faf7ff] via-white to-[#f5f8ff] p-3.5 shadow-[0_4px_18px_rgba(124,58,237,0.06)]">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" />
                    Buy One Get One
                  </span>
                  {bogoActive && promoDiscount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Saved {fmt(promoDiscount)}
                    </span>
                  ) : bogoPreview.needsPair ? (
                    <span className="text-[11px] font-semibold text-violet-600">Needs a pair</span>
                  ) : (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                      Ready · Save {fmt(bogoPreview.discount)}
                    </span>
                  )}
                </div>

                {bogoPreview.needsPair && bogoPreview.pairCandidate ? (
                  <>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {bogoActive
                        ? "Code BOGO is active — add one more vial to get your next vial free."
                        : "Add one more vial and apply code BOGO to get your 2nd vial free."}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white/90 px-3 py-2 text-xs">
                      <span className="truncate font-semibold text-slate-800">2nd {pairTitle}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-slate-400 line-through">
                          {fmt(bogoPreview.pairCandidate.price)}
                        </span>
                        <span className="rounded-md bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                          $0
                        </span>
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAddPairAndApply}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        Add one more
                      </button>
                      <Link
                        to="/products"
                        onClick={closeCart}
                        className="text-xs font-medium text-slate-600 underline underline-offset-2 transition-colors hover:text-slate-900"
                      >
                        or pick another compound
                      </Link>
                    </div>

                    {!bogoActive && bogoPreview.freeCount > 0 && (
                      <div className="mt-3 flex items-center justify-between border-t border-violet-100 pt-2.5 text-xs">
                        <span className="text-slate-600">
                          Apply <strong className="text-slate-900">BOGO</strong> now to save {fmt(bogoPreview.discount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApplyPromo(BOGO_CODE)}
                          className="font-bold text-[#7c3aed] underline underline-offset-2 hover:text-violet-900"
                        >
                          Use BOGO
                        </button>
                      </div>
                    )}
                  </>
                ) : !bogoActive ? (
                  <>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      Your cart qualifies for{" "}
                      <strong className="text-slate-900">
                        {bogoPreview.freeCount} free vial{bogoPreview.freeCount === 1 ? "" : "s"}
                      </strong>{" "}
                      with code <strong className="text-slate-900">BOGO</strong>.
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleApplyPromo(BOGO_CODE)}
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        Apply BOGO (-{fmt(bogoPreview.discount)})
                      </button>
                      <span className="text-[11px] font-medium text-slate-500">Code: BOGO</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span>
                      Code <strong className="text-slate-900">BOGO</strong> active ·{" "}
                      <strong className="text-emerald-700">
                        {bogoPreview.freeCount} free vial{bogoPreview.freeCount === 1 ? "" : "s"}
                      </strong>{" "}
                      applied
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearPromoCode();
                        setPromoStatus(null);
                      }}
                      className="shrink-0 font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer: financials + checkout — hidden entirely when the cart is empty */}
        {items.length > 0 && (
          <div className="border-t border-slate-200 px-4 py-2.5 space-y-1.5 sm:px-6 sm:py-4 sm:space-y-3 bg-white shrink-0">
            {/* Cross-sell: BAC Water */}
            {!bacItem && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:rounded-2xl sm:p-4">
                <div className="flex gap-2 sm:gap-3 items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {bacImage && (
                      <img
                        src={bacImage}
                        alt="BAC Water"
                        className="pointer-events-none h-[125%] w-[125%] max-w-none object-contain drop-shadow-sm"
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

            {/* Promo code input */}
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value);
                    if (promoStatus) setPromoStatus(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyPromo();
                    }
                  }}
                  placeholder="Promo code (e.g. BOGO)"
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-base sm:px-3 sm:py-2 sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-st-cyan focus:ring-2 focus:ring-st-cyan/30"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPromo()}
                  className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Apply
                </button>
              </div>
              {promoStatus && (
                <p
                  className={`mt-1 text-xs font-medium sm:mt-1.5 ${
                    promoStatus.ok ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {promoStatus.message}
                </p>
              )}
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm">Subtotal</span>
              <span className="font-bold text-xs sm:text-sm">{fmt(baseSubtotal)}</span>
            </div>

            {bogoActive && promoDiscount > 0 && (
              <div className="flex items-center justify-between text-emerald-600">
                <span className="font-semibold text-xs sm:text-sm">Promo (BOGO)</span>
                <span className="font-bold text-xs sm:text-sm">-{fmt(promoDiscount)}</span>
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-700 sm:text-sm">FedEx Shipping</span>
                {shipping === 0 ? (
                  <span className="font-semibold text-xs text-emerald-500 sm:text-sm">FREE</span>
                ) : (
                  <span className="font-semibold text-xs text-slate-900 sm:text-sm">{fmt(shipping)}</span>
                )}
              </div>
              {!hasFreeBacWater && freeBacWaterRemaining > 0 && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  Add {fmt(freeBacWaterRemaining)} more for a FREE Bac Water (orders ${FREE_BAC_WATER_THRESHOLD}+)
                </p>
              )}
              {freeShippingRemaining > 0 && (
                <p className="text-[11px] text-violet-600 font-medium">
                  Add {fmt(freeShippingRemaining)} more for free FedEx shipping (orders ${FREE_SHIPPING_THRESHOLD}+)
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 sm:pt-2">
              <span className="font-bold text-sm sm:text-base">Total</span>
              <span className="font-bold text-sm sm:text-base">{fmt(total)}</span>
            </div>

            {/* Checkout button */}
            <Link
              to="/checkout"
              onClick={closeCart}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-full transition-colors hover:bg-slate-800 sm:gap-2 sm:py-3"
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
