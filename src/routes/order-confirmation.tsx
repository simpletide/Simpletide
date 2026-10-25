import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Copy } from "lucide-react";
import { Header } from "@/components/Header";
import { discountedLine } from "@/lib/catalog";
import { vialImageForProduct } from "@/lib/product-vial-variants";
import { apiUrl } from "@/lib/api";
import { toast } from "sonner";
import { pageSeoHead } from "@/lib/site-seo";
import { trackPurchaseOnce } from "@/lib/pixel-tracking";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/order-confirmation")({
  validateSearch: (search: Record<string, unknown>) => ({
    preview: search.preview === "1" || search.preview === 1,
  }),
  head: () =>
    pageSeoHead({
      path: "/order-confirmation",
      title: "Order Confirmation | Simpletide",
      description: "Your Simpletide order confirmation.",
      noindex: true,
    }),
  component: OrderConfirmationPage,
});

const CONFIRMED_KEY = "simpletide_confirmed_order";

type ConfirmedItem = { id: string; name: string; price: number; qty: number; variant?: string };
type ConfirmedOrder = {
  orderNumber: string;
  items: ConfirmedItem[];
  baseSubtotal: number;
  subtotal: number;
  bundleSavings: number;
  total: number;
  // True for paid card orders (KeyBilling); absent/false for manual (Venmo) flows.
  paid?: boolean;
};

function vialFor(name: string, variant?: string | null): string | null {
  return vialImageForProduct(name, variant);
}

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const VIAL_SEMAX = "/images/hero-vials/simpletide-selank-semax-20mg.png";
const VIAL_SELANK = "/images/hero-vials/simpletide-selank-10mg.png";
const VIAL_ADAMAX = "/images/hero-vials/simpletide-bpc157-10mg.png";

function FloatingVials() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true" data-reveal="fade">
      <div className="absolute top-[2%] left-[0%] md:top-[16%] md:left-[26%] w-[clamp(78px,22vw,120px)] md:w-[clamp(52px,14vw,120px)] -rotate-12 opacity-60 md:opacity-70">
        <img src={VIAL_SEMAX} alt="" className="w-full object-contain animate-vial-left" loading="lazy" />
      </div>
      <div className="absolute top-[13%] right-[0%] md:top-[54%] md:right-[26%] w-[clamp(74px,21vw,112px)] md:w-[clamp(48px,13vw,112px)] rotate-[18deg] opacity-60 md:opacity-70">
        <img src={VIAL_SELANK} alt="" className="w-full object-contain animate-vial-center" loading="lazy" />
      </div>
      <div className="absolute bottom-[4%] left-[2%] md:bottom-auto md:left-auto md:top-[12%] md:right-[28%] w-[clamp(76px,22vw,116px)] md:w-[clamp(50px,13vw,116px)] rotate-[8deg] opacity-60 md:opacity-70">
        <img src={VIAL_ADAMAX} alt="" className="w-full object-contain animate-vial-right" loading="lazy" />
      </div>
    </div>
  );
}

const DEMO_ORDER: ConfirmedOrder = {
  orderNumber: "AS-482917",
  items: [
    {
      id: "demo-glp3",
      name: "GLP-3 RT (RETA) - 20mg",
      price: 120,
      qty: 1,
      variant: "20mg",
    },
  ],
  baseSubtotal: 120,
  subtotal: 120,
  bundleSavings: 0,
  total: 120,
};

function OrderConfirmationPage() {
  const { preview } = Route.useSearch();
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Re-run once the async order resolves so newly rendered reveal nodes animate.
  useReveal(order);

  useEffect(() => {
    // KeyBilling 3-D Secure return: verify the transaction, then show the order.
    const params = new URLSearchParams(window.location.search);
    const txnId = params.get("transaction_id");
    const isKbReturn =
      !!txnId &&
      (params.get("gateway") === "keybilling" ||
        !!sessionStorage.getItem("keybilling_pending_order"));

    if (isKbReturn) {
      (async () => {
        try {
          const pendingRaw = sessionStorage.getItem("keybilling_pending_order");
          const orderData = pendingRaw ? JSON.parse(pendingRaw) : null;
          if (!orderData) throw new Error("Missing pending order");

          const res = await fetch(apiUrl("/api/keybilling/verify"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId: txnId, orderData }),
          });
          const result = await res.json();

          sessionStorage.removeItem("keybilling_pending_order");
          sessionStorage.removeItem("pendingKeyBilling3DS");

          if (result.success && result.orderNumber) {
            const snapRaw = sessionStorage.getItem("keybilling_pending_confirmed");
            sessionStorage.removeItem("keybilling_pending_confirmed");
            const snap = snapRaw ? (JSON.parse(snapRaw) as ConfirmedOrder) : null;
            const confirmed: ConfirmedOrder = snap
              ? { ...snap, orderNumber: String(result.orderNumber), paid: true }
              : {
                  orderNumber: String(result.orderNumber),
                  items: (orderData.items || []).map(
                    (it: { product_name?: string; price?: number; quantity?: number; variant_spec?: string }, idx: number) => ({
                      id: String(idx),
                      name: it.product_name || "Product",
                      price: Number(it.price) || 0,
                      qty: Number(it.quantity) || 1,
                      variant: it.variant_spec || undefined,
                    }),
                  ),
                  baseSubtotal: Number(orderData.subtotal) || 0,
                  subtotal: Number(orderData.subtotal) || 0,
                  bundleSavings: 0,
                  total: Number(orderData.total) || 0,
                  paid: true,
                };
            try {
              window.localStorage.setItem(CONFIRMED_KEY, JSON.stringify(confirmed));
            } catch {
              /* ignore */
            }
            setOrder(confirmed);
            window.history.replaceState({}, "", "/order-confirmation");
          } else {
            toast.error((result.error as string) || "Payment was not approved.");
          }
        } catch {
          toast.error("We couldn't verify your payment. Please contact support.");
        } finally {
          setLoaded(true);
        }
      })();
      return;
    }

    try {
      const raw = window.localStorage.getItem(CONFIRMED_KEY);
      if (raw) {
        const data = JSON.parse(raw) as ConfirmedOrder;
        if (data.orderNumber) {
          setOrder(data);
          setLoaded(true);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    if (preview) setOrder(DEMO_ORDER);
    setLoaded(true);
  }, [preview]);

  // Meta Purchase + TikTok CompletePayment, once per real order (the demo/preview
  // order is skipped). Card orders arrive paid; Venmo orders arrive here after the
  // shopper taps "I Paid" — both count, matching simpletide.com.
  useEffect(() => {
    if (!order || preview) return;
    trackPurchaseOnce({
      orderNumber: order.orderNumber,
      total: order.total,
      items: order.items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
    });
  }, [order, preview]);

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.orderNumber).then(
      () => toast.success("Order number copied"),
      () => {},
    );
  };

  if (loaded && !order) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-slate-900">
        <Header opaque />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">No order found</h1>
            <p className="mt-2 text-sm text-slate-500">We couldn't find a recent order to display.</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-7 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              Browse Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-slate-900">
        <Header opaque />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header opaque />
      <main className="flex-1 relative overflow-hidden">
        <FloatingVials />
        <div className="relative z-[1] mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pt-24 pb-6 md:pt-32 md:pb-10">
          <div className="text-center" data-reveal>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-snug text-slate-900">
              {order.paid
                ? "Order Confirmed — Thank You!"
                : "Transaction Pending Verification from the Simpletide Payment Team"}
            </h1>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order number</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">{order.orderNumber}</span>
              <button
                type="button"
                onClick={copyOrderNumber}
                className="text-slate-400 transition-colors hover:text-slate-900"
                aria-label="Copy order number"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-5 text-center text-sm leading-relaxed text-slate-600" data-reveal>
            {order.paid
              ? "Your payment was successful and your order is being prepared. A confirmation email is on its way."
              : "You will receive a confirmation email once your payment has been confirmed."}
          </p>

          {/* Order summary */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5" data-reveal>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Order summary</h2>
            <ul className="space-y-3">
              {order.items.map((item) => {
                const vial = vialFor(item.name, item.variant);
                const line = discountedLine(item.name, item.price, item.qty);
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                        {vial && <img src={vial} alt={item.name} className="h-full w-full object-contain" />}
                      </div>
                      <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1 text-[11px] font-bold text-white">
                        {item.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-snug text-slate-900">{item.name}</p>
                      {item.variant && (
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-st-cyan">
                          {item.variant}
                        </p>
                      )}
                    </div>
                    <div className="text-right whitespace-nowrap">
                      {line.pct > 0 && (
                        <span className="block text-[11px] text-slate-400 line-through">{fmt(line.baseTotal)}</span>
                      )}
                      <span className="text-sm font-semibold text-slate-900">{fmt(line.lineTotal)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{fmt(order.baseSubtotal)}</span>
              </div>
              {order.bundleSavings > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-600">
                  <span className="font-semibold">Bundle savings</span>
                  <span className="font-bold">-{fmt(order.bundleSavings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-base font-bold text-slate-900">{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center" data-reveal>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-7 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
            >
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
