import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Camera,
  Mail,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/shipping-returns")({
  head: () =>
    pageSeoHead({
      path: "/shipping-returns",
      title: "Shipping & Returns | Simpletide",
      description:
        "Simpletide shipping options, processing times, and our refunds & returns policy, including how to file a claim for a damaged or missing vial.",
    }),
  component: ShippingReturnsPage,
});

const SUPPORT_EMAIL = "support@simpletide.com";

// Light card treatment — identical to the About page's card look (subtle blue
// wash, 2px translucent blue border, soft layered shadow, hover glow).
const LIGHT_CARD_BASE = [
  "border-2 bg-[#F3EEFE]",
  "transition-[border-color,box-shadow] duration-300 ease-out",
].join(" ");

const LIGHT_CARD_INACTIVE = [
  "border-[rgba(167,139,250,0.10)]",
  "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.06)]",
  "hover:border-[rgba(167,139,250,0.5)]",
  "hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.15),0_4px_16px_rgba(0,0,0,0.04)]",
].join(" ");

const LIGHT_CARD_ACTIVE =
  "border-[rgba(167,139,250,0.5)] shadow-[0_0_20px_4px_rgba(167,139,250,0.15),0_4px_16px_rgba(0,0,0,0.04)]";

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

type InfoCard = { icon: LucideIcon; title: string; desc: string };

const CLAIM_STEPS: InfoCard[] = [
  {
    icon: Camera,
    title: "Record & Photograph",
    desc: "Capture a full unboxing video and take photos of the outer packaging, contents, and packing slip.",
  },
  {
    icon: Mail,
    title: "Email Us Within 7 Days",
    desc: `Send all documentation to ${SUPPORT_EMAIL} with your order number within 7 calendar days of delivery.`,
  },
  {
    icon: Package,
    title: "Receive a Replacement",
    desc: "Once your claim is verified, we'll ship a replacement of the affected items at our discretion.",
  },
];

const DOCUMENTATION = [
  "A full unboxing video recorded from the moment the package is first opened",
  "Photos of the external packaging",
  "Photos of the package contents",
  "Photos of the packing slip enclosed with the order",
];

function ShippingReturnsPage() {
  useReveal();

  // Sticky tap-glow for the cards on mobile (mirrors the desktop hover): a
  // tapped card keeps glowing until another is tapped, the user taps elsewhere,
  // or scrolls.
  const [activeCard, setActiveCard] = useState<string | null>(null);
  useEffect(() => {
    const clear = (e?: Event) => {
      if (e && e.type === "pointerdown") {
        const target = e.target as HTMLElement | null;
        if (target && target.closest("[data-info-card]")) return;
      }
      setActiveCard(null);
    };
    document.addEventListener("pointerdown", clear, { passive: true });
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", clear);
      window.removeEventListener("scroll", clear);
    };
  }, []);

  const renderCard = (c: InfoCard, i: number) => (
    <div
      key={c.title}
      data-info-card
      data-reveal
      style={revealDelay((i % 6) * 70)}
      onPointerDown={(e) => {
        // Desktop (mouse): no click effect — glow is hover-only via CSS.
        // Touch/pen: sticky tap-glow that mirrors hover.
        if (e.pointerType !== "mouse") setActiveCard(c.title);
      }}
      className={`${LIGHT_CARD_BASE} ${
        activeCard === c.title ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
      } group flex flex-col items-center gap-2 rounded-[16px] p-3.5 text-center lg:gap-4 lg:rounded-[24px] lg:p-6 [-webkit-tap-highlight-color:transparent]`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#a78bfa]/12 transition-colors duration-300 group-hover:bg-[#a78bfa]/20 lg:h-10 lg:w-10 lg:rounded-[12px]">
        <c.icon className="h-5 w-5 text-[#8b5cf6] lg:h-[22px] lg:w-[22px]" />
      </div>
      <h3 className="text-[14px] font-semibold leading-5 tracking-[-0.02em] text-[#242424] lg:text-[16px] lg:leading-6">
        {c.title}
      </h3>
      <p className="text-[12px] leading-[1.4] tracking-[-0.01em] text-[#555] lg:text-[13.5px] lg:leading-5">
        {c.desc}
      </p>
    </div>
  );

  const PolicyBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h3 className="mb-2 text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#8b5cf6] lg:text-[17px]">
        {title}
      </h3>
      <div className="flex flex-col gap-2 text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1">
        {/* ─── HERO — identical to the About page hero (left untouched) ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgb(221,214,254) 11%, rgb(237,233,254) 100%)" }}
        >
          {/* Faint floating vials, low opacity — same positions/animations as About */}
          <div data-reveal="fade" className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            <div className="absolute top-[4%] left-[2%] md:top-[14%] md:left-[13%] w-[clamp(56px,9.5vw,150px)] rotate-[-10deg] opacity-70">
              <img src={vialNad.url} alt="" className="w-full object-contain animate-vial-left" loading="lazy" />
            </div>
            <div className="absolute top-[3%] right-[6%] md:top-[8%] md:right-[11%] w-[clamp(50px,8.5vw,128px)] rotate-[-42deg] opacity-70">
              <img src={vialGhkCu.url} alt="" className="w-full object-contain animate-vial-center" loading="lazy" />
            </div>
            <div className="absolute bottom-[5%] right-[7%] md:bottom-[8%] md:right-[18%] w-[clamp(56px,8.5vw,136px)] rotate-[-5deg] opacity-70">
              <img src={vialGlp3.url} alt="" className="w-full object-contain animate-vial-right" loading="lazy" />
            </div>
          </div>

          <div className="relative z-[1] mx-auto flex max-w-[1280px] items-center justify-center md:items-center min-h-[285px] md:min-h-[clamp(320px,44vh,440px)]">
            <div className="mx-auto max-w-[700px] px-6 pt-2 pb-12 text-center md:pt-6 md:pb-24">
              <span data-reveal style={revealDelay(0)} className="mb-4 md:mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-xs md:px-[22px] md:py-2.5 md:text-sm font-semibold text-[#19276E] shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-[8px]">
                Delivered with Care
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Shipping &amp;{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Returns</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                How we process, package, and ship your order — plus our policy on returns, replacements, and damaged or incorrect items.
              </p>
              <p data-reveal style={revealDelay(270)} className="mt-4 text-[11px] font-medium tracking-[0.01em] text-[#19276E]/55 md:text-[12px]">
                Last updated: June 21, 2026
              </p>
            </div>
          </div>
        </section>

        {/* ─── INTRO — Quality You Can Trust ─── */}
        <section className="bg-white px-5 pt-6 pb-6 md:px-20 md:py-12">
          <div data-reveal className="mx-auto max-w-[860px] text-center">
            <div
              data-info-card
              onPointerDown={(e) => {
                if (e.pointerType !== "mouse") setActiveCard("quality");
              }}
              className={`${LIGHT_CARD_BASE} ${
                activeCard === "quality" ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
              } rounded-[16px] p-6 lg:rounded-[24px] lg:p-8 [-webkit-tap-highlight-color:transparent]`}
            >
              <h2 className="mb-3 text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-[#8b5cf6] md:text-[24px] lg:text-[26px]">
                Quality You Can Trust
              </h2>
              <p className="mx-auto max-w-[620px] text-[13.5px] leading-[1.6] tracking-[-0.01em] text-[#333333] lg:text-[15px]">
                Every order is carefully prepared, inspected, and shipped with the utmost care. We stand behind the quality and purity of every product we deliver.
              </p>
            </div>
          </div>
        </section>

        {/* ─── SHIPPING OPTIONS (CHECKOUT) ─── */}
        <section className="bg-white px-5 pt-2 pb-6 md:px-20 md:pt-4 md:pb-12">
          <div className="mx-auto max-w-[860px]">
            <div data-reveal className="mb-6 md:mb-8">
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-[#8b5cf6] md:text-[24px] lg:text-[26px]">
                Shipping Options
              </h2>
              <div className="mt-4 h-px bg-neutral-200" />
              <p className="mt-4 max-w-[600px] text-[13px] leading-[1.5] text-[#555] md:text-[15px] md:leading-[1.55]">
                At checkout you may choose one of the following methods. Rates and transit times below match what you see in your cart.
              </p>
            </div>

            <div className="flex flex-col gap-5 md:gap-6">
              {/* Free USPS Priority */}
              <div data-reveal style={revealDelay(0)}>
                <h3 className="text-[14px] font-bold tracking-[-0.01em] text-[#8b5cf6] lg:text-[16px]">
                  Free USPS Priority Shipping - $0
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7">
                  <strong className="font-semibold text-[#242424]">Typical delivery: 2-3 business days</strong> after dispatch within the contiguous United States. Carrier scans and rural routes may add a day in isolated cases.
                </p>
                <p className="mt-2 text-[11px] leading-[1.5] text-[#9aa0ab] lg:text-[12px]">
                  Default option for research peptide orders—no minimum purchase required for this complimentary service.
                </p>
              </div>

              {/* USPS Next-Day Express */}
              <div data-reveal style={revealDelay(90)}>
                <h3 className="text-[14px] font-bold tracking-[-0.01em] text-[#8b5cf6] lg:text-[16px]">
                  USPS Next-Day Express - $35
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7">
                  Expedited service for time-sensitive lab schedules. <strong className="font-semibold text-[#242424]">Most destinations: 1-2 business days</strong> after dispatch, depending on ZIP code and carrier operational timelines (checkout mirrors this language).
                </p>
                <p className="mt-2 text-[11px] leading-[1.5] text-[#9aa0ab] lg:text-[12px]">
                  Express is optional; availability of overnight status varies by location. Final delivery date is estimated by the carrier once labeled.
                </p>
              </div>

              <ul data-reveal style={revealDelay(180)} className="ml-5 list-disc space-y-2 text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7">
                <li>
                  Orders placed before <strong className="font-semibold text-[#242424]">4:00 PM Eastern Time (EST)</strong>, Monday through Friday, typically ship the same business day.
                </li>
                <li>
                  Orders placed after the cutoff, on weekends, or on U.S. federal holidays are processed on the next business day.
                </li>
                <li>
                  You will receive an email confirmation when your order is received and another when it ships with tracking details.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ─── REFUNDS & RETURNS — white ─── */}
        <section className="bg-white px-5 pt-4 pb-12 md:px-20 md:py-12">
          <div className="mx-auto max-w-[860px]">
            <div data-reveal className="mb-6 md:mb-8">
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-[#8b5cf6] md:text-[24px] lg:text-[26px]">
                Refunds &amp; Returns
              </h2>
              <div className="mt-4 h-px bg-neutral-200" />
            </div>

            <div data-reveal className="mb-6 flex flex-col gap-2 text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7">
              <p>
                Due to the sensitive nature of our products and applicable regulatory requirements, <strong className="font-semibold text-[#242424]">all sales are final</strong>.
              </p>
              <p>
                Simpletide does <strong className="font-semibold text-[#242424]">not</strong> accept returns, issue refunds, or allow order cancellations once an order has been placed, regardless of delivery status.
              </p>
            </div>

            <div data-reveal className="flex flex-col gap-5 md:gap-6">
              <PolicyBlock title="Delivered Packages">
                <p>
                  Once a shipment is marked as <strong className="font-semibold text-[#242424]">&ldquo;Delivered&rdquo;</strong> by the carrier, responsibility for the package transfers to the customer.
                </p>
                <p>
                  Simpletide is <strong className="font-semibold text-[#242424]">not responsible for packages that are lost or stolen after delivery</strong>, including theft from porches, mailrooms, front desks, lockers, or other delivery locations.
                </p>
                <p>
                  Refunds, credits, or replacements will <strong className="font-semibold text-[#242424]">not</strong> be issued for packages confirmed as delivered by the carrier.
                </p>
              </PolicyBlock>

              <PolicyBlock title="Shipping Damage or Fulfillment Errors">
                <p>
                  In the event of a verified Simpletide fulfillment or shipping error, such as incorrect items, missing items, or damage incurred during transit <strong className="font-semibold text-[#242424]">prior to delivery</strong>, customers must notify Simpletide within <strong className="font-semibold text-[#242424]">seven (7) calendar days</strong> of the carrier's delivery date.
                </p>
                <p>
                  This reporting window is firm. Requests submitted outside of this timeframe will be denied without exception.
                </p>
              </PolicyBlock>
            </div>

            {/* How to File a Claim */}
            <div data-reveal className="mt-8 mb-5 lg:mt-10">
              <h3 className="text-[16px] font-bold leading-[1.2] tracking-[-0.02em] text-[#8b5cf6] md:text-[18px] lg:text-[20px]">
                How to File a Claim for a Damaged or Missing Vial
              </h3>
              <p className="mt-2 max-w-[560px] text-[13px] leading-[1.5] text-[#555] md:text-[15px]">
                If your order arrives with a damaged or missing vial, here's what to do.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-4 lg:gap-6">
              {CLAIM_STEPS.map(renderCard)}
            </div>

            {/* Required Documentation + remaining policy */}
            <div data-reveal className="mt-6 flex flex-col gap-5 md:mt-8 md:gap-6">
              <PolicyBlock title="Required Documentation">
                <p>All claims must include complete and verifiable documentation, including:</p>
                <ul className="ml-5 list-disc space-y-1">
                  {DOCUMENTATION.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p>
                  Claims submitted without <strong className="font-semibold text-[#242424]">all required documentation</strong> will be denied.
                </p>
              </PolicyBlock>

              <PolicyBlock title="Resolution">
                <p>
                  Upon confirmation of an eligible shipping or fulfillment error caused by Simpletide, we may, at our sole discretion, issue a <strong className="font-semibold text-[#242424]">replacement of the affected items</strong>.
                </p>
                <p>
                  Cash refunds, store credits, or alternative compensation are not guaranteed and are not provided for delivered, refused, or stolen packages.
                </p>
              </PolicyBlock>

              <PolicyBlock title="Chargebacks">
                <p>
                  Chargebacks submitted for delivered, refused, or stolen packages will be disputed using carrier confirmation, delivery records, and the customer's agreement to these Terms.
                </p>
              </PolicyBlock>

              <PolicyBlock title="Our Commitment">
                <p>
                  We are committed to accurate fulfillment and timely shipment of every order. To maintain fairness, prevent abuse, and protect all parties involved, the policies above are strictly enforced. By placing an order with Simpletide, you acknowledge and agree to these terms.
                </p>
              </PolicyBlock>
            </div>
          </div>
        </section>

        {/* ─── QUESTIONS — filled brand-blue banner ─── */}
        <section className="bg-white px-5 pb-12 md:px-20 md:pb-14">
          <div className="mx-auto max-w-[860px]">
            <div
              data-reveal="fade"
              className="rounded-[20px] px-6 py-8 text-center shadow-[0_10px_30px_rgba(167,139,250,0.25)] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] lg:px-10 lg:py-10"
              style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)" }}
            >
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[24px] lg:text-[26px]">
                Questions About Your Order?
              </h2>
              <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-[1.6] text-white/85 lg:text-[15px]">
                Our support team is here to help with any shipping or order-related questions.
              </p>
              <p className="mt-3 text-[13px] font-semibold lg:text-[15px]">
                <a href="mailto:support@simpletide.com" className="text-[#ede9fe] hover:underline">
                  support@simpletide.com
                </a>
                <span className="px-2 text-white/55">·</span>
                <a href="tel:0000000000" className="text-[#ede9fe] hover:underline">
                  (000) 000-0000
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ─── NEWSLETTER — same closing section as the About page ─── */}
        <NewsletterSection variant="light" vialsOnMobile className="bg-white px-0 py-6 md:py-8" />
      </main>
    </div>
  );
}
