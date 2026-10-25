import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, ShieldCheck, Lock, ChevronLeft, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { useCart } from "@/lib/cart-context";
import { discountedLine } from "@/lib/catalog";
import { vialImageForProduct } from "@/lib/product-vial-variants";
import { apiUrl } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  loadGoogleMaps,
  getGoogleMapsApiKey,
  type GoogleAddressComponent,
  type GoogleAutocompleteService,
  type GooglePlacesService,
} from "@/lib/google-maps";
import { AcceptedCardLogos } from "@/components/AcceptedCardLogos";
import { pageSeoHead } from "@/lib/site-seo";
import { trackInitiateCheckout } from "@/lib/pixel-tracking";
import { useReveal } from "@/lib/use-reveal";

function vialFor(name: string, variant?: string | null): string | null {
  return vialImageForProduct(name, variant);
}

export const Route = createFileRoute("/checkout")({
  head: () =>
    pageSeoHead({
      path: "/checkout",
      title: "Checkout | Simpletide",
      description: "Securely complete your Simpletide research compound order.",
      noindex: true,
    }),
  component: CheckoutPage,
});

type Addr = { line1: string; apt: string; city: string; region: string; zip: string; country: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

function formatCardNumber(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

// KeyBilling expects 2-digit month and 4-digit year.
function parseExpiry(v: string): { mm: string; yyyy: string } {
  const d = v.replace(/\D/g, "");
  const mm = d.slice(0, 2);
  const yy = d.slice(2, 4);
  return { mm: mm.padStart(2, "0"), yyyy: yy.length === 2 ? `20${yy}` : "" };
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, baseSubtotal, bundleSavings, removeItem } = useCart();

  // Re-run once the cart hydrates so the heading/summary reveal nodes animate.
  useReveal(items.length);

  // Meta + TikTok InitiateCheckout + AddPaymentInfo on checkout mount (matches simpletide.com).
  useEffect(() => {
    trackInitiateCheckout();
  }, []);

  const [placing, setPlacing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"card" | "venmo">("card");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addr, setAddr] = useState<Addr>({ line1: "", apt: "", city: "", region: "", zip: "", country: "US" });
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvc: "" });

  // Hide the "Have an account? Log in" prompt for already-signed-in shoppers.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(!!data.session?.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const updateAddr = (patch: Partial<Addr>) => setAddr((a) => ({ ...a, ...patch }));

  const shipping = 0;
  const total = subtotal + shipping;

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Confirmation snapshot built from the live cart (base prices so the
  // confirmation page re-applies bundle discounts correctly for display).
  const buildConfirmed = (orderNumber: string) => ({
    orderNumber,
    items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, variant: i.variant })),
    baseSubtotal,
    subtotal,
    bundleSavings,
    total,
    paid: true,
  });

  const validateShipping = (): string | null => {
    if (!firstName.trim() || !lastName.trim()) return "Please enter your first and last name.";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email address.";
    if (!addr.line1.trim() || !addr.city.trim() || !addr.region || !addr.zip.trim())
      return "Please complete your shipping address.";
    return null;
  };

  const validateCard = (): string | null => {
    const shippingErr = validateShipping();
    if (shippingErr) return shippingErr;
    if (card.number.replace(/\D/g, "").length < 13) return "Please enter a valid card number.";
    const exp = parseExpiry(card.exp);
    if (!/^(0[1-9]|1[0-2])$/.test(exp.mm) || !exp.yyyy) return "Please enter a valid expiry date (MM/YY).";
    if (card.cvc.replace(/\D/g, "").length < 3) return "Please enter a valid CVC.";
    return null;
  };

  // Venmo: create the pending order in the backend *now* so it appears in the
  // Payment Admin dashboard with the real order number the customer must put in
  // their Venmo note. The backend then sends the new Simpletide "Order
  // Placed" email. Finally, send them to the pending page to complete payment.
  const handleVenmo = async () => {
    const err = validateShipping();
    if (err) {
      setCardError(err);
      toast.error(err);
      return;
    }
    setCardError(null);
    setPlacing(true);

    try {
      // Link the order to the signed-in account (production Supabase). Guests stay null.
      let userId: string | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        userId = data.session?.user?.id ?? null;
      } catch {
        /* not logged in — guest checkout */
      }

      const orderItems = items.map((it) => {
        const line = discountedLine(it.name, it.price, it.qty);
        const unit = round2(line.lineTotal / it.qty);
        const img = vialFor(it.name, it.variant);
        return {
          product_id: it.id,
          product_name: it.name,
          variant_spec: it.variant || "",
          quantity: it.qty,
          price: unit,
          ...(img ? { image: img } : {}),
        };
      });

      const shippingAddress = {
        firstName,
        lastName,
        street: addr.line1,
        apartment: addr.apt,
        city: addr.city,
        state: addr.region,
        zipCode: addr.zip,
        country: addr.country || "US",
        phone: phone.replace(/\D/g, ""),
        email,
      };

      const res = await fetch(apiUrl("/api/create-venmo-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          shipping_address: shippingAddress,
          items: orderItems,
          subtotal: round2(subtotal),
          shipping_cost: 0,
          total: round2(total),
          user_id: userId,
          shipping_method: "priority",
          estimated_delivery: "2-3 business days",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "We couldn't place your Venmo order. Please try again.");
      }

      const orderNumber = String(data.orderNumber || data.order?.order_number || "");

      const pending = {
        orderNumber,
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, variant: i.variant })),
        baseSubtotal,
        subtotal,
        bundleSavings,
        total,
      };
      try {
        window.localStorage.setItem("simpletide_pending_order", JSON.stringify(pending));
      } catch {
        /* ignore */
      }

      window.open("https://www.venmo.com/u/REPLACE-WITH-SIMPLETIDE-VENMO", "_blank", "noopener,noreferrer");
      items.forEach((i) => removeItem(i.id));
      navigate({ to: "/order-pending" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "We couldn't place your Venmo order. Please try again.";
      setCardError(msg);
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  // Credit / debit card via the existing KeyBilling backend (/api/keybilling/pay).
  const handleCardPayment = async () => {
    const err = validateCard();
    if (err) {
      setCardError(err);
      toast.error(err);
      return;
    }
    setCardError(null);
    setPlacing(true);

    try {
      const orderId = `AS-${Date.now().toString(36).toUpperCase()}`;
      const exp = parseExpiry(card.exp);

      // Link the order to the signed-in account (production Supabase). Guests stay null.
      let userId: string | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        userId = data.session?.user?.id ?? null;
      } catch {
        /* not logged in — guest checkout */
      }

      const orderItems = items.map((it) => {
        const line = discountedLine(it.name, it.price, it.qty);
        const unit = round2(line.lineTotal / it.qty);
        const img = vialFor(it.name, it.variant);
        return {
          product_id: it.id,
          product_name: it.name,
          variant_spec: it.variant || "",
          quantity: it.qty,
          price: unit,
          ...(img ? { image: img } : {}),
        };
      });

      const orderData = {
        shipping_address: {
          firstName,
          lastName,
          street: addr.line1,
          apartment: addr.apt,
          city: addr.city,
          state: addr.region,
          zipCode: addr.zip,
          country: addr.country || "US",
          phone: phone.replace(/\D/g, ""),
          email,
        },
        items: orderItems,
        subtotal: round2(subtotal),
        shipping_cost: 0,
        total: round2(total),
        user_id: userId,
        affiliate_code: null,
        affiliate_id: null,
        affiliate_commission_rate: null,
        affiliate_discount: 0,
        credits_redeemed: 0,
        credits_discount: 0,
        credits_earned: 0,
        processing_fee: 0,
        shipping_method: "priority",
        estimated_delivery: "2-3 business days",
      };

      const res = await fetch(apiUrl("/api/keybilling/pay"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total.toFixed(2),
          currency: "USD",
          merchantReference: orderId,
          orderId,
          firstName,
          lastName,
          email,
          phone: phone.replace(/\D/g, "").slice(0, 15) || "5555555555",
          address: addr.line1 || "123 Main St",
          country: (addr.country || "US").toUpperCase().slice(0, 2),
          state: addr.region || "CA",
          city: addr.city || "Los Angeles",
          zip: addr.zip || "90028",
          cardHolderName: (card.name || `${firstName} ${lastName}`).trim().toUpperCase(),
          cardNumber: card.number.replace(/\D/g, ""),
          dateExpiryMonth: exp.mm,
          dateExpiryYear: exp.yyyy,
          cvc2: card.cvc.replace(/\D/g, ""),
          orderData,
        }),
      });

      const data = await res.json();

      // 3-D Secure required: stash order + confirmation snapshot, then redirect.
      if (data.requires3DS && data.redirectUrl) {
        try {
          sessionStorage.setItem("keybilling_pending_order", JSON.stringify(orderData));
          sessionStorage.setItem("keybilling_pending_confirmed", JSON.stringify(buildConfirmed(orderId)));
          sessionStorage.setItem("pendingKeyBilling3DS", "true");
        } catch {
          /* ignore */
        }
        window.location.href = data.redirectUrl;
        return;
      }

      // Approved immediately (no 3DS) — order already created server-side.
      if (data.success && (data.orderNumber || data.orderId)) {
        const confirmed = buildConfirmed(String(data.orderNumber || data.orderId));
        try {
          window.localStorage.setItem("simpletide_confirmed_order", JSON.stringify(confirmed));
          // Clear the cart (storage key from cart-context) before the full reload.
          window.localStorage.setItem("simpletide_cart_v1", JSON.stringify([]));
        } catch {
          /* ignore */
        }
        window.location.assign("/order-confirmation");
        return;
      }

      const msg =
        (data.error as string) ||
        "Your bank did not approve this charge. Please try another card or use Venmo.";
      setCardError(msg);
      toast.error(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Payment failed. Please try again.";
      setCardError(msg);
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || placing) return;
    if (payMethod === "venmo") {
      void handleVenmo();
      return;
    }
    void handleCardPayment();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-slate-900">
        <Header opaque />
        <main className="flex-1 flex items-center justify-center px-4 py-24">
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your cart is empty</h1>
            <p className="mt-2 text-sm text-slate-500">
              Add some research compounds before heading to checkout.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A2A2A]"
            >
              Browse Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header opaque />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5 md:py-8">
          <div className="mb-4" data-reveal>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" /> Continue shopping
            </Link>
            <h1 className="mt-2 text-xl md:text-2xl font-bold tracking-tight">Checkout</h1>
          </div>

          {!signedIn && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:px-5" data-reveal>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Have an account?</p>
                <p className="text-xs text-slate-500">Log in to autofill your address</p>
              </div>
              <Link
                to="/auth/login"
                search={{ redirect: "/checkout" }}
                className="shrink-0 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-5 py-2 text-sm font-semibold text-white transition-all hover:brightness-110"
              >
                Log in
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
            {/* LEFT — details */}
            <div className="space-y-5">
              {/* Shipping */}
              <section>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" htmlFor="firstName">
                    <input
                      id="firstName"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Last name" htmlFor="lastName">
                    <input
                      id="lastName"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                </div>
                <AddressFields addr={addr} update={updateAddr} />
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Email address" htmlFor="email">
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@lab.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                  <Field label="Phone (for shipping updates)" htmlFor="phone">
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(555) 555-5555"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={INPUT}
                    />
                  </Field>
                </div>
              </section>

              {/* Payment */}
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-1">Payment</h2>
                <p className="mb-2.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> All transactions are secure and encrypted.
                </p>
                <div className="space-y-3">
                  {/* Credit / debit card */}
                  <div
                    className={`rounded-xl border transition-colors ${
                      payMethod === "card" ? "border-st-cyan bg-st-cyan/[0.04]" : "border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPayMethod("card")}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <PayRadio active={payMethod === "card"} />
                      <span className="text-sm font-semibold text-slate-900">Credit / Debit Card</span>
                      <AcceptedCardLogos order="checkout" className="ml-auto flex items-center gap-2.5" />
                    </button>
                    {payMethod === "card" && (
                      <div className="space-y-3 px-4 pb-4">
                        <Field label="Name on card" htmlFor="cardName">
                          <input
                            id="cardName"
                            autoComplete="cc-name"
                            value={card.name}
                            onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                            className={INPUT}
                          />
                        </Field>
                        <Field label="Card number" htmlFor="card">
                          <input
                            id="card"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="1234 5678 9012 3456"
                            value={card.number}
                            onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                            className={INPUT}
                          />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Expiration (MM/YY)" htmlFor="exp">
                            <input
                              id="exp"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              placeholder="MM/YY"
                              value={card.exp}
                              onChange={(e) => setCard((c) => ({ ...c, exp: formatExpiry(e.target.value) }))}
                              className={INPUT}
                            />
                          </Field>
                          <Field label="CVC" htmlFor="cvc">
                            <input
                              id="cvc"
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              placeholder="123"
                              value={card.cvc}
                              onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                              className={INPUT}
                            />
                          </Field>
                        </div>
                        {cardError && (
                          <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                            {cardError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Venmo */}
                  <div
                    className={`rounded-xl border transition-colors ${
                      payMethod === "venmo" ? "border-st-cyan bg-st-cyan/[0.04]" : "border-slate-200"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPayMethod("venmo")}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <PayRadio active={payMethod === "venmo"} />
                      <span className="text-sm font-semibold text-slate-900">Venmo</span>
                      <img
                        src="/images/assets/venmo%20logo.png"
                        alt="Venmo"
                        className="ml-auto h-9 w-auto rounded object-contain"
                      />
                    </button>
                    {payMethod === "venmo" && (
                      <div className="px-4 pb-4 text-sm text-slate-600">
                        <ol className="list-decimal space-y-1 pl-5 text-[13px]">
                          <li>
                            Click <span className="font-semibold text-slate-900">“Place Order”</span>.
                          </li>
                          <li>
                            Send the <span className="font-semibold text-slate-900">Order Summary Total</span> (
                            {fmt(total)}) to our verified business profile.
                          </li>
                          <li>
                            Add your <span className="font-semibold text-slate-900">Order Number</span> in the payment
                            notes.
                          </li>
                        </ol>
                        <p className="mt-2 text-[11px] leading-snug text-slate-400">
                          Our Venmo is a Verified Business Profile which offers the customer purchase protection.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* RIGHT — order summary */}
            <aside className="lg:sticky lg:top-20 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3">Order summary</h2>

              <ul className="space-y-3" data-reveal>
                {items.map((item) => {
                  const variantLabel = item.variant ?? null;
                  const vial = vialFor(item.name, item.variant);
                  const line = discountedLine(item.name, item.price, item.qty);
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-md bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                          {vial && (
                            <img src={vial} alt={item.name} className="h-full w-full object-contain" />
                          )}
                        </div>
                        <span className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-700 px-1 text-[11px] font-bold text-white">
                          {item.qty}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-snug text-slate-900">{item.name}</p>
                        {variantLabel && (
                          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-st-cyan">
                            {variantLabel}
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

              <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3" data-reveal>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold text-slate-900">{fmt(baseSubtotal)}</span>
                </div>
                {bundleSavings > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span className="font-semibold">Bundle savings</span>
                    <span className="font-bold">-{fmt(bundleSavings)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-semibold text-emerald-600">FREE</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-base font-bold text-slate-900">Total</span>
                  <span className="text-base font-bold text-slate-900">{fmt(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {placing ? "Processing…" : (
                  <>
                    Place Order — {fmt(total)} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> 100% secure checkout
              </div>
            </aside>
          </form>
        </div>
      </main>
    </div>
  );
}

const INPUT =
  "w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-st-cyan focus:ring-2 focus:ring-st-cyan/30";

function PayRadio({ active }: { active: boolean }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
        active ? "border-st-cyan" : "border-slate-300"
      }`}
    >
      {active && <span className="h-2 w-2 rounded-full bg-st-cyan" />}
    </span>
  );
}

type AddrParts = { line1: string; city: string; state: string; zip: string };
type Suggestion = { label: string; placeId?: string; parts?: AddrParts };

const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

// Accepts a 2-letter code or full state name and returns the matching code ("" if unknown).
function normalizeState(value: string): string {
  if (!value) return "";
  const v = value.trim();
  const byCode = US_STATES.find((s) => s.code.toLowerCase() === v.toLowerCase());
  if (byCode) return byCode.code;
  const byName = US_STATES.find((s) => s.name.toLowerCase() === v.toLowerCase());
  return byName ? byName.code : "";
}

function parseGoogleComponents(components: GoogleAddressComponent[]): AddrParts {
  const get = (type: string, short = false) => {
    const c = components.find((x) => x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : "";
  };
  return {
    line1: [get("street_number"), get("route")].filter(Boolean).join(" "),
    city:
      get("locality") ||
      get("postal_town") ||
      get("sublocality") ||
      get("administrative_area_level_2"),
    state: get("administrative_area_level_1", true),
    zip: get("postal_code"),
  };
}

/**
 * Shipping address fields with live type-ahead suggestions. Uses Google Places
 * Autocomplete when VITE_GOOGLE_MAPS_API_KEY is set (precise, US-validated),
 * and falls back to the free, key-less Photon (OpenStreetMap) geocoder.
 */
function AddressFields({ addr, update }: { addr: Addr; update: (patch: Partial<Addr>) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const justSelected = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const autocompleteRef = useRef<GoogleAutocompleteService | null>(null);
  const placesRef = useRef<GooglePlacesService | null>(null);
  const tokenRef = useRef<object | null>(null);
  const [googleReady, setGoogleReady] = useState(false);

  // Initialise Google Places once if a key is configured.
  useEffect(() => {
    const key = getGoogleMapsApiKey();
    if (!key) return;
    let cancelled = false;
    loadGoogleMaps(key)
      .then((google) => {
        if (cancelled) return;
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        placesRef.current = new google.maps.places.PlacesService(document.createElement("div"));
        tokenRef.current = new google.maps.places.AutocompleteSessionToken();
        setGoogleReady(true);
      })
      .catch(() => {
        /* fall back to Photon */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = addr.line1.trim();
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (q.length < 3 || !open) {
      setSuggestions([]);
      return;
    }

    // --- Google Places path ---------------------------------------------
    if (googleReady && autocompleteRef.current) {
      const t = setTimeout(() => {
        autocompleteRef.current!.getPlacePredictions(
          {
            input: q,
            componentRestrictions: { country: "us" },
            types: ["address"],
            sessionToken: tokenRef.current ?? undefined,
          },
          (preds, status) => {
            const ok = window.google?.maps?.places?.PlacesServiceStatus?.OK;
            if (status !== ok || !preds) {
              setSuggestions([]);
              return;
            }
            setSuggestions(preds.map((p) => ({ label: p.description, placeId: p.place_id })));
          },
        );
      }, 200);
      return () => clearTimeout(t);
    }

    // --- Photon fallback -------------------------------------------------
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`,
          { signal: ctrl.signal },
        );
        const data = await res.json();
        const list: Suggestion[] = (data.features ?? [])
          .map((f: { properties: Record<string, string> }) => f.properties)
          .filter((p: Record<string, string>) => (p.countrycode ?? "").toLowerCase() === "us")
          .map((p: Record<string, string>) => {
            const parts: AddrParts = {
              line1: [p.housenumber, p.street ?? p.name].filter(Boolean).join(" "),
              city: p.city ?? p.town ?? p.village ?? p.county ?? "",
              state: p.state ?? "",
              zip: p.postcode ?? "",
            };
            return {
              label: [parts.line1, parts.city, parts.state, parts.zip].filter(Boolean).join(", "),
              parts,
            };
          })
          .filter((s: Suggestion) => s.parts?.line1);
        setSuggestions(list);
      } catch {
        /* ignore network/abort errors */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [addr.line1, open, googleReady]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const fill = (parts: AddrParts) => {
    justSelected.current = true;
    update({
      line1: parts.line1,
      city: parts.city,
      region: normalizeState(parts.state),
      zip: parts.zip,
    });
    setSuggestions([]);
    setOpen(false);
  };

  const choose = (s: Suggestion) => {
    if (s.placeId && placesRef.current) {
      placesRef.current.getDetails(
        {
          placeId: s.placeId,
          fields: ["address_components"],
          sessionToken: tokenRef.current ?? undefined,
        },
        (place, status) => {
          const ok = window.google?.maps?.places?.PlacesServiceStatus?.OK;
          if (status === ok && place?.address_components) {
            fill(parseGoogleComponents(place.address_components));
          }
          // Start a fresh session token after each completed selection.
          if (window.google?.maps?.places) {
            tokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
          }
        },
      );
    } else if (s.parts) {
      fill(s.parts);
    }
  };

  return (
    <>
      <div className="mt-3 relative" ref={boxRef}>
        <Field label="Address" htmlFor="address">
          <input
            id="address"
            name="address"
            required
            autoComplete="off"
            placeholder="Start typing your address…"
            value={addr.line1}
            onChange={(e) => {
              update({ line1: e.target.value });
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length) setOpen(true);
            }}
            className={INPUT}
          />
        </Field>
        {open && suggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={`${s.label}-${i}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(s);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 text-slate-700">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3">
        <Field label="Apartment, suite, etc. (optional)" htmlFor="address2">
          <input
            id="address2"
            name="address2"
            autoComplete="off"
            value={addr.apt}
            onChange={(e) => update({ apt: e.target.value })}
            className={INPUT}
          />
        </Field>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="City" htmlFor="city">
          <input
            id="city"
            required
            autoComplete="off"
            value={addr.city}
            onChange={(e) => update({ city: e.target.value })}
            className={INPUT}
          />
        </Field>
        <Field label="ZIP code" htmlFor="zip">
          <input
            id="zip"
            required
            inputMode="numeric"
            autoComplete="off"
            value={addr.zip}
            onChange={(e) => update({ zip: e.target.value })}
            className={INPUT}
          />
        </Field>
        <Field label="State" htmlFor="state">
          <select
            id="state"
            required
            value={addr.region}
            onChange={(e) => update({ region: e.target.value })}
            className={`${INPUT} ${addr.region ? "" : "text-slate-400"}`}
          >
            <option value="" disabled>
              Select state
            </option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code} className="text-slate-900">
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Country" htmlFor="country">
          <select
            id="country"
            required
            value={addr.country}
            onChange={(e) => update({ country: e.target.value })}
            className={INPUT}
          >
            <option value="US">United States</option>
          </select>
        </Field>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
