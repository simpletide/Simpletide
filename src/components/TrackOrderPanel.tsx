import { useState } from "react";
import { Loader2, Package, Truck, ExternalLink } from "lucide-react";
import { fetchOrderTrack, formatTrackDate, uspsTrackingUrl, type TrackedOrder } from "@/lib/order-track";

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#a78bfa] focus:outline-none focus:ring-2 focus:ring-[#a78bfa]/20";

type Props = {
  /** Hide the hero intro when nested inside account tabs */
  embedded?: boolean;
  /** Pre-fill billing email (e.g. signed-in account) */
  defaultEmail?: string;
  /** Pre-fill order number (e.g. from /track-order?order=…) */
  defaultOrderNumber?: string;
};

export function TrackOrderPanel({
  embedded = false,
  defaultEmail = "",
  defaultOrderNumber = "",
}: Props) {
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const on = orderNumber.trim();
    const em = email.trim();
    if (!on || !em) {
      setError("Please enter both your order number and billing email.");
      return;
    }

    setLoading(true);
    try {
      setResult(await fetchOrderTrack(on, em));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={embedded ? "" : "mx-auto max-w-xl"}>
      {embedded && (
        <p className="mb-5 text-sm leading-relaxed text-slate-600">
          Look up any order with your order number and the billing email used at checkout.
        </p>
      )}

      <form onSubmit={handleTrack} className="space-y-4">
        <div>
          <label htmlFor="track-order-number" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Order number
          </label>
          <input
            id="track-order-number"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. AS-104839"
            autoComplete="off"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="track-order-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Billing email
          </label>
          <input
            id="track-order-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email used at checkout"
            autoComplete="email"
            className={INPUT}
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(167,139,250,0.35)] transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Looking up…
            </>
          ) : (
            "Track order"
          )}
        </button>
      </form>

      {result && <TrackOrderResult order={result} className="mt-6" />}

      {!embedded && <ShippingInfo className="mt-8" />}
    </div>
  );
}

export function TrackOrderResult({ order, className = "" }: { order: TrackedOrder; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 md:p-6 ${className}`}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Order</p>
          <p className="font-mono text-lg font-extrabold text-[#141414]">{order.orderNumber}</p>
          <p className="mt-1 text-sm text-slate-600">Placed {formatTrackDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">Fulfillment</p>
          <p className="text-base font-extrabold text-[#8b5cf6]">{order.statusLabel}</p>
          <p className="mt-1 text-sm text-slate-600">{order.paymentLabel}</p>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Items</p>
          <ul className="space-y-2">
            {order.items.map((line, i) => (
              <li
                key={`${line.product_name}-${i}`}
                className="flex justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-800">{line.product_name}</span>
                <span className="shrink-0 text-slate-600">×{line.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.trackingNumber ? (
        <div className="rounded-xl border border-[#a78bfa]/25 bg-[#eef4ff] px-5 py-5">
          <div className="mb-2 flex items-center gap-2 font-bold text-slate-800">
            <Truck className="h-5 w-5 text-[#8b5cf6]" aria-hidden />
            Tracking number
          </div>
          <p className="mb-4 break-all font-mono font-semibold text-slate-900">{order.trackingNumber}</p>
          <a
            href={uspsTrackingUrl(order.trackingNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          >
            Track on USPS
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      ) : (
        <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden />
          <p>
            When your order ships, a tracking number will appear here and you will receive it by email as well.
          </p>
        </div>
      )}
    </div>
  );
}

export function ShippingInfo({ className = "" }: { className?: string }) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 md:p-6 ${className}`}>
      <h2 className="mb-4 text-lg font-extrabold text-[#141414] md:text-xl">Shipping information</h2>
      <ul className="space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a78bfa]" aria-hidden />
          <span>
            Orders placed before 4pm EST will be dropped off at USPS the same day, and the tracking number should
            update the day after.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a78bfa]" aria-hidden />
          <span>Shipping confirmations are emailed within 24 hours.</span>
        </li>
        <li className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a78bfa]" aria-hidden />
          <span>
            Our complimentary priority shipping usually arrives within 2–3 business days depending on your location.
          </span>
        </li>
      </ul>
    </section>
  );
}
