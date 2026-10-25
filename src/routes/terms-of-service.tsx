import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { AlertTriangle, Scale, type LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/terms-of-service")({
  head: () =>
    pageSeoHead({
      path: "/terms-of-service",
      title: "Terms of Service | Simpletide",
      description:
        "The terms governing your use of the Simpletide website and the purchase of our research peptides and compounds, including research-use-only and liability terms.",
    }),
  component: TermsOfServicePage,
});

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

// Light card treatment — identical to the About / Privacy Policy cards
// (subtle blue wash, 2px translucent blue border, soft shadow, hover glow).
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

// Shared text styles — identical sizing/coloring to the Privacy Policy page.
const BODY = "text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7";
const STRONG = "font-semibold text-[#242424]";

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <>
      <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-[#8b5cf6] md:text-[24px] lg:text-[26px]">
        {children}
      </h2>
      <div className="mt-4 h-px bg-neutral-200" />
    </>
  );
}

function TermsOfServicePage() {
  useReveal();

  // Sticky tap-glow for the cards on mobile (mirrors the desktop hover): a tapped
  // card keeps glowing until another is tapped, the user taps elsewhere, or scrolls.
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

  // Single centered emphasis card (icon in a round tile, heading, body) —
  // matches the "Your Data is Protected" card on the Privacy Policy page.
  const renderCenteredCard = (id: string, icon: LucideIcon, title: string, body: ReactNode) => {
    const Icon = icon;
    return (
      <div
        data-info-card
        onPointerDown={(e) => {
          // Desktop (mouse): no click effect — glow is hover-only via CSS.
          // Touch/pen: sticky tap-glow that mirrors hover.
          if (e.pointerType !== "mouse") setActiveCard(id);
        }}
        className={`${LIGHT_CARD_BASE} ${
          activeCard === id ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
        } group mt-4 rounded-[12px] px-3.5 py-3 lg:rounded-[14px] lg:px-4 lg:py-3.5 [-webkit-tap-highlight-color:transparent]`}
      >
        <div className="mb-1.5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#a78bfa]/12 transition-colors duration-300 group-hover:bg-[#a78bfa]/20 lg:h-8 lg:w-8 lg:rounded-[9px]">
            <Icon className="h-4 w-4 text-[#8b5cf6] lg:h-[18px] lg:w-[18px]" />
          </div>
          <h3 className="text-[14px] font-bold leading-5 tracking-[-0.02em] text-[#8b5cf6] lg:text-[15px]">
            {title}
          </h3>
        </div>
        <p className={BODY}>{body}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1">
        {/* ─── HERO — identical to the About page hero ─── */}
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
                Legal Agreement
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Terms of{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Service</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Please read these terms carefully before using our website or purchasing our research peptides and compounds.
              </p>
              <p data-reveal style={revealDelay(270)} className="mt-4 text-[11px] font-medium tracking-[0.01em] text-[#19276E]/55 md:text-[12px]">
                Last updated: June 21, 2026
              </p>
            </div>
          </div>
        </section>

        {/* ─── TERMS BODY ─── */}
        <section className="bg-white px-5 pt-8 pb-12 md:px-20 md:py-14">
          <div className="mx-auto flex max-w-[860px] flex-col gap-10">
            {/* Acceptance of Terms */}
            <div data-reveal>
              <SectionHeading>Acceptance of Terms</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                By accessing or using the Simpletide website (simpletide.com), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            {/* Research Use Only */}
            <div data-reveal>
              <SectionHeading>Research Use Only</SectionHeading>
              {renderCenteredCard(
                "research",
                AlertTriangle,
                "Important Notice",
                <>
                  All products sold by Simpletide are intended strictly for{" "}
                  <strong className={STRONG}>laboratory research purposes only</strong>. They are not intended for human consumption, veterinary use, or any clinical application. By purchasing, you confirm that you understand and agree to this restriction.
                </>,
              )}
            </div>

            {/* Eligibility */}
            <div data-reveal>
              <SectionHeading>Eligibility</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>To use our services and purchase products, you must:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li>Be at least 18 years of age</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Be authorized to conduct research activities</li>
                  <li>Agree to use products solely for lawful research purposes</li>
                </ul>
              </div>
            </div>

            {/* Account Responsibilities */}
            <div data-reveal>
              <SectionHeading>Account Responsibilities</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>When you create an account with us, you are responsible for:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li><strong className={STRONG}>Account security</strong> — maintaining the confidentiality of your login credentials</li>
                  <li><strong className={STRONG}>Account activity</strong> — all activities that occur under your account</li>
                  <li><strong className={STRONG}>Accurate information</strong> — keeping your account information up to date</li>
                  <li><strong className={STRONG}>Unauthorized access</strong> — notifying us immediately of any security breaches</li>
                </ul>
              </div>
            </div>

            {/* Orders & Pricing */}
            <div data-reveal>
              <SectionHeading>Orders &amp; Pricing</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>All prices are listed in USD and are subject to change without notice. We reserve the right to:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li>Refuse or cancel any order at our discretion</li>
                  <li>Limit quantities available for purchase</li>
                  <li>Correct pricing errors</li>
                  <li>Modify or discontinue products without notice</li>
                </ul>
                <p>An order confirmation email does not constitute acceptance. Your order is accepted when we ship the product.</p>
              </div>
            </div>

            {/* Payment Terms */}
            <div data-reveal>
              <SectionHeading>Payment Terms</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                We accept major credit cards and other payment methods as displayed at checkout. All payments are processed securely through our payment provider. You agree to pay all charges at the prices listed, including applicable taxes and shipping fees.
              </p>
            </div>

            {/* Shipping & Delivery */}
            <div data-reveal>
              <SectionHeading>Shipping &amp; Delivery</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                Please refer to our{" "}
                <Link to="/shipping-returns" className="font-semibold text-[#8b5cf6] underline-offset-2 hover:underline">
                  Shipping &amp; Returns Policy
                </Link>{" "}
                for detailed information about shipping methods, delivery times, and return procedures.
              </p>
            </div>

            {/* Intellectual Property */}
            <div data-reveal>
              <SectionHeading>Intellectual Property</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                All content on this website, including text, graphics, logos, images, and software, is the property of Simpletide or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our written consent.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div data-reveal>
              <SectionHeading>Limitation of Liability</SectionHeading>
              {renderCenteredCard(
                "liability",
                Scale,
                "Liability Limitations",
                <>
                  Simpletide shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our products or services. Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.
                </>,
              )}
            </div>

            {/* Indemnification */}
            <div data-reveal>
              <SectionHeading>Indemnification</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                You agree to indemnify and hold Simpletide harmless from any claims, damages, losses, or expenses arising from your use of our products, violation of these terms, or infringement of any third-party rights.
              </p>
            </div>

            {/* Governing Law */}
            <div data-reveal>
              <SectionHeading>Governing Law</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                These Terms of Service are governed by the laws of the State of Florida, without regard to conflict of law provisions. Any disputes shall be resolved in the courts located in Duval County, Florida.
              </p>
            </div>

            {/* Modifications */}
            <div data-reveal>
              <SectionHeading>Modifications</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                We reserve the right to modify these terms at any time. Changes become effective upon posting to the website. Continued use of our services after modifications constitutes acceptance of the updated terms.
              </p>
            </div>

            {/* Questions About These Terms — filled brand-blue banner */}
            <div
              data-reveal="fade"
              className="rounded-[20px] px-6 py-8 text-center shadow-[0_10px_30px_rgba(167,139,250,0.25)] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] lg:px-10 lg:py-10"
              style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)" }}
            >
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[24px] lg:text-[26px]">
                Questions About These Terms?
              </h2>
              <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-[1.6] text-white/85 lg:text-[15px]">
                If you have questions about our Terms of Service,{" "}
                <br className="md:hidden" />
                reach out to us:
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
