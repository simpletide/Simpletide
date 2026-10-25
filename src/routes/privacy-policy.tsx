import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Clipboard, Search, Lock, type LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/privacy-policy")({
  head: () =>
    pageSeoHead({
      path: "/privacy-policy",
      title: "Privacy Policy | Simpletide",
      description:
        "How Simpletide collects, uses, and protects your personal information, including your rights, cookies, and data security practices.",
    }),
  component: PrivacyPolicyPage,
});

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

// Light card treatment — identical to the About / Shipping & Returns cards
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

// Shared text styles — identical sizing/coloring to the Shipping & Returns page.
const BODY = "text-[13px] leading-[1.6] text-[#555] lg:text-[15px] lg:leading-7";
const SUBHEAD = "text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#8b5cf6] lg:text-[17px]";
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

function PrivacyPolicyPage() {
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

  // Two-up card (icon + heading on one row, body below) — left aligned.
  const renderInfoCard = (id: string, icon: LucideIcon, title: string, body: string) => {
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
        } group rounded-[12px] px-3.5 py-3 lg:rounded-[14px] lg:px-4 lg:py-3.5 [-webkit-tap-highlight-color:transparent]`}
      >
        <div className="mb-1.5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#a78bfa]/12 transition-colors duration-300 group-hover:bg-[#a78bfa]/20 lg:h-8 lg:w-8 lg:rounded-[9px]">
            <Icon className="h-4 w-4 text-[#8b5cf6] lg:h-[18px] lg:w-[18px]" />
          </div>
          <h3 className="text-[14px] font-bold leading-5 tracking-[-0.02em] text-[#8b5cf6] lg:text-[15px]">{title}</h3>
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
                Your Privacy Matters
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Privacy{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Policy</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                How we collect, use, and protect your personal information.
              </p>
              <p data-reveal style={revealDelay(270)} className="mt-4 text-[11px] font-medium tracking-[0.01em] text-[#19276E]/55 md:text-[12px]">
                Last updated: June 21, 2026
              </p>
            </div>
          </div>
        </section>

        {/* ─── POLICY BODY ─── */}
        <section className="bg-white px-5 pt-8 pb-12 md:px-20 md:py-14">
          <div className="mx-auto flex max-w-[860px] flex-col gap-10">
            {/* Information We Collect */}
            <div data-reveal>
              <SectionHeading>Information We Collect</SectionHeading>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {renderInfoCard(
                  "personal",
                  Clipboard,
                  "Personal Information",
                  "When you create an account, place an order, or contact us, we may collect your name, email address, shipping address, phone number, and payment information.",
                )}
                {renderInfoCard(
                  "usage",
                  Search,
                  "Usage Data",
                  "We automatically collect information about how you interact with our website, including your IP address, browser type, pages visited, and time spent on pages.",
                )}
              </div>
            </div>

            {/* How We Use Your Information */}
            <div data-reveal>
              <SectionHeading>How We Use Your Information</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>We use the information we collect to:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li><strong className={STRONG}>Process orders</strong> — fulfill purchases, manage shipping, and handle returns</li>
                  <li><strong className={STRONG}>Communicate with you</strong> — send order confirmations, shipping updates, and respond to inquiries</li>
                  <li><strong className={STRONG}>Improve our services</strong> — analyze usage patterns to enhance user experience</li>
                  <li><strong className={STRONG}>Marketing</strong> — send promotional emails (you can opt out anytime)</li>
                  <li><strong className={STRONG}>Legal compliance</strong> — comply with applicable laws and regulations</li>
                </ul>
              </div>
            </div>

            {/* Information Sharing */}
            <div data-reveal>
              <SectionHeading>Information Sharing</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>We do not sell your personal information. We may share your data with:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li><strong className={STRONG}>Service providers</strong> — payment processors, shipping carriers, and email services that help us operate our business</li>
                  <li><strong className={STRONG}>Legal requirements</strong> — when required by law or to protect our rights</li>
                  <li><strong className={STRONG}>Business transfers</strong> — in connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div data-reveal>
              <SectionHeading>Data Security</SectionHeading>
              <div
                data-info-card
                onPointerDown={(e) => {
                  if (e.pointerType !== "mouse") setActiveCard("security");
                }}
                className={`${LIGHT_CARD_BASE} ${
                  activeCard === "security" ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
                } group mt-4 flex flex-col items-center gap-1.5 rounded-[12px] px-4 py-4 text-center lg:rounded-[14px] lg:px-5 lg:py-5 [-webkit-tap-highlight-color:transparent]`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#a78bfa]/12 transition-colors duration-300 group-hover:bg-[#a78bfa]/20 lg:h-9 lg:w-9">
                  <Lock className="h-4 w-4 text-[#8b5cf6] lg:h-[18px] lg:w-[18px]" />
                </div>
                <h3 className="text-[14px] font-bold leading-5 tracking-[-0.02em] text-[#8b5cf6] lg:text-[15px]">
                  Your Data is Protected
                </h3>
                <p className={`max-w-[560px] ${BODY}`}>
                  We implement industry-standard security measures including SSL encryption, secure payment processing, and regular security audits to protect your personal information.
                </p>
              </div>
            </div>

            {/* Cookies & Tracking */}
            <div data-reveal>
              <SectionHeading>Cookies &amp; Tracking</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>
                  We use cookies and similar technologies to optimize your laboratory configuration, analyze research traffic, and guarantee secure transactions. Specifically, cookies help us:
                </p>
                <ul className="ml-5 list-disc space-y-2">
                  <li>Remember your preferences and login status</li>
                  <li>Analyze website traffic and usage patterns</li>
                  <li>Deliver relevant advertisements</li>
                  <li>Improve site functionality</li>
                </ul>
                <p>
                  By continuing to use our website, you consent to our use of cookies and the data practices outlined in this Privacy Policy. You can manage cookie preferences through your browser settings; disabling cookies may affect certain site features.
                </p>
              </div>
            </div>

            {/* Your Rights */}
            <div data-reveal>
              <SectionHeading>Your Rights</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>Depending on your location, you may have the right to:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li><strong className={STRONG}>Access</strong> — request a copy of your personal data</li>
                  <li><strong className={STRONG}>Correction</strong> — update inaccurate information</li>
                  <li><strong className={STRONG}>Deletion</strong> — request removal of your personal data</li>
                  <li><strong className={STRONG}>Portability</strong> — receive your data in a portable format</li>
                  <li><strong className={STRONG}>Opt-out</strong> — unsubscribe from marketing communications</li>
                </ul>
              </div>
            </div>

            {/* California Privacy Rights (CCPA) */}
            <div data-reveal>
              <SectionHeading>California Privacy Rights (CCPA)</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                California residents have additional rights under the CCPA, including the right to know what personal information is collected, request deletion, and opt out of the sale of personal information. We do not sell personal information.
              </p>
            </div>

            {/* Children's Privacy */}
            <div data-reveal>
              <SectionHeading>Children's Privacy</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children.
              </p>
            </div>

            {/* Changes to This Policy */}
            <div data-reveal>
              <SectionHeading>Changes to This Policy</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                We may update this Privacy Policy periodically. We will notify you of significant changes by posting a notice on our website or sending an email.
              </p>
            </div>

            {/* Questions About Your Privacy — filled brand-blue banner */}
            <div
              data-reveal="fade"
              className="rounded-[20px] px-6 py-8 text-center shadow-[0_10px_30px_rgba(167,139,250,0.25)] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] lg:px-10 lg:py-10"
              style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)" }}
            >
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[24px] lg:text-[26px]">
                Questions About Your Privacy?
              </h2>
              <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-[1.6] text-white/85 lg:text-[15px]">
                If you have questions or concerns about this Privacy Policy, contact us:
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
