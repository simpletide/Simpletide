import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy } from "lucide-react";
import { Header } from "@/components/Header";
import { discountedLine } from "@/lib/catalog";
import { vialImageForProduct } from "@/lib/product-vial-variants";
import { toast } from "sonner";
import { pageSeoHead } from "@/lib/site-seo";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/order-pending")({
  head: () =>
    pageSeoHead({
      path: "/order-pending",
      title: "Complete Your Payment | Simpletide",
      description: "Complete payment for your Simpletide order.",
      noindex: true,
    }),
  component: OrderPendingPage,
});

const PENDING_KEY = "simpletide_pending_order";
const CONFIRMED_KEY = "simpletide_confirmed_order";
const VENMO_URL = "https://www.venmo.com/u/REPLACE-WITH-SIMPLETIDE-VENMO";

type PendingItem = { id: string; name: string; price: number; qty: number; variant?: string };
type PendingOrder = {
  orderNumber: string;
  items: PendingItem[];
  baseSubtotal: number;
  subtotal: number;
  bundleSavings: number;
  total: number;
};

function vialFor(name: string, variant?: string | null): string | null {
  return vialImageForProduct(name, variant);
}

const fmt = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function OrderPendingPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Re-run once the async order resolves so newly rendered reveal nodes animate.
  useReveal(order);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PENDING_KEY);
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard?.writeText(order.orderNumber).then(
      () => toast.success("Order number copied"),
      () => {},
    );
  };

  const handlePaid = () => {
    if (!order) return;
    try {
      window.localStorage.setItem(CONFIRMED_KEY, JSON.stringify(order));
      window.localStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
    navigate({ to: "/order-confirmation" });
  };

  if (loaded && !order) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-slate-900">
        <Header opaque />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">No pending order</h1>
            <p className="mt-2 text-sm text-slate-500">There's no payment awaiting completion.</p>
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
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          <div className="text-center" data-reveal>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Complete your payment</h1>
            <p className="mt-1 text-sm text-slate-500">
              Your order is reserved. Send your Venmo payment to finish.
            </p>
          </div>

          {/* Order number */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order number</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">{order.orderNumber}</span>
              <button
                type="button"
                onClick={copyOrderNumber}
                className="text-slate-400 transition-colors hover:text-slate-900"
                aria-label="Copy order number"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Add this number in your Venmo payment notes.</p>
          </div>

          {/* Steps */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4" data-reveal>
            <ol className="list-decimal space-y-1 pl-5 text-[13px] text-slate-600">
              <li>
                Send the <span className="font-semibold text-slate-900">order total ({fmt(order.total)})</span> to our
                verified business profile.
              </li>
              <li>
                Add your <span className="font-semibold text-slate-900">order number ({order.orderNumber})</span> in the
                payment notes.
              </li>
              <li>
                Tap <span className="font-semibold text-slate-900">"I Paid"</span> below once your payment is sent.
              </li>
            </ol>
            <p className="mt-3 text-[13px] font-semibold text-red-600">
              Only include your order number in the Venmo payment note. Otherwise, the transaction will be canceled and/or refunded.
            </p>
          </div>

          {/* Order summary */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5" data-reveal>
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

          {/* Actions */}
          <button
            type="button"
            onClick={handlePaid}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] py-3.5 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <Check className="h-4 w-4" /> I Paid
          </button>
          <a
            href={VENMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <img src="/images/assets/venmo%20logo.png" alt="" className="h-5 w-5 rounded object-contain" />
            Open Venmo
          </a>
        </div>
      </main>
    </div>
  );
}
