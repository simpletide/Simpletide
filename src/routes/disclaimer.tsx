import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/disclaimer")({
  head: () =>
    pageSeoHead({
      path: "/disclaimer",
      title: "Disclaimer | Simpletide",
      description:
        "Important research-use-only disclaimer for Simpletide, including product use, no-medical-advice, buyer responsibility, liability, indemnification, and FDA notices.",
    }),
  component: DisclaimerPage,
});

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

// Light card treatment — identical to the Shipping & Returns / About card look
// (subtle blue wash, 2px translucent blue border, soft layered shadow, hover glow).
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

// Shared text styles — identical sizing/coloring to the Privacy / Terms pages.
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

function DisclaimerPage() {
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
        {/* ─── HERO — 1:1 match with the Shipping & Returns page hero ─── */}
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
                Important Notice
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Disclaimer</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Please read this important information carefully before purchasing from Simpletide.
              </p>
              <p data-reveal style={revealDelay(270)} className="mt-4 text-[11px] font-medium tracking-[0.01em] text-[#19276E]/55 md:text-[12px]">
                Last updated: June 22, 2026
              </p>
            </div>
          </div>
        </section>

        {/* ─── DISCLAIMER BODY ─── */}
        <section className="bg-white px-5 pt-8 pb-12 md:px-20 md:py-14">
          <div className="mx-auto flex max-w-[860px] flex-col gap-10">
            {/* Research Use Only */}
            <div data-reveal>
              <SectionHeading>Research Use Only</SectionHeading>
              {renderCenteredCard(
                "research",
                AlertTriangle,
                "Important Notice",
                <>
                  All products sold by Simpletide are intended for{" "}
                  <strong className={STRONG}>research and laboratory use only</strong>. They are not intended for human or veterinary use, and are not to be used for food additives, drugs, or household chemicals.
                </>,
              )}
            </div>

            {/* General Disclaimer */}
            <div data-reveal>
              <SectionHeading>General Disclaimer</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                The information provided on this website is for general informational purposes only. While we strive to provide accurate and up-to-date information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information, products, or services contained on this website.
              </p>
            </div>

            {/* Product Use Disclaimer */}
            <div data-reveal>
              <SectionHeading>Product Use Disclaimer</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>All products sold by Simpletide:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li>Are sold strictly for in-vitro research and laboratory use only</li>
                  <li>Are not intended for human or veterinary use</li>
                  <li>Are not intended for use as food additives, drugs, cosmetics, or household chemicals</li>
                  <li>Are not intended to diagnose, treat, cure, or prevent any disease</li>
                  <li>Should only be handled by qualified and licensed professionals</li>
                </ul>
              </div>
            </div>

            {/* No Medical Advice */}
            <div data-reveal>
              <SectionHeading>No Medical Advice</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                Nothing on this website should be construed as providing medical advice. The content is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </div>

            {/* Research Information */}
            <div data-reveal>
              <SectionHeading>Research Information</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                Any research information, scientific data, or study references provided on this website are for educational and informational purposes only. Such information does not constitute endorsement of any particular use of our products. Researchers are responsible for verifying all information and conducting their own due diligence before using any products.
              </p>
            </div>

            {/* Buyer Responsibility */}
            <div data-reveal>
              <SectionHeading>Buyer Responsibility</SectionHeading>
              <div className={`mt-4 flex flex-col gap-2 ${BODY}`}>
                <p>By purchasing products from Simpletide, you represent and warrant that:</p>
                <ul className="ml-5 list-disc space-y-2">
                  <li>You are at least 18 years of age</li>
                  <li>You are purchasing products for legitimate research purposes only</li>
                  <li>You will comply with all applicable laws and regulations regarding the purchase, possession, and use of our products</li>
                  <li>You will not use products in any manner inconsistent with their intended research use</li>
                  <li>You accept full responsibility for the proper handling, storage, and use of products</li>
                </ul>
              </div>
            </div>

            {/* Product Quality Disclaimer */}
            <div data-reveal>
              <SectionHeading>Product Quality Disclaimer</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                While we strive to provide the highest quality research-grade peptides with 99%+ purity as verified by third-party testing, results may vary based on research conditions, storage, handling, and other factors beyond our control. Certificate of Analysis (CoA) documents reflect the quality at the time of testing and do not guarantee outcomes in specific research applications.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div data-reveal>
              <SectionHeading>Limitation of Liability</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                In no event shall Simpletide, its owners, employees, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our products or the information provided on this website. This includes, but is not limited to, damages for loss of profits, data, or other intangible losses.
              </p>
            </div>

            {/* Indemnification */}
            <div data-reveal>
              <SectionHeading>Indemnification</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                You agree to indemnify, defend, and hold harmless Simpletide, its owners, officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, liabilities, and expenses (including reasonable attorneys&apos; fees) arising from: (a) your use, misuse, or handling of our products, including any injury, illness, or damage resulting from administration to any human or animal; (b) any statements, health claims, dosing recommendations, or representations you make to third parties regarding our products; (c) any advertising, marketing, or promotional content you create referencing our products; (d) any violation of this disclaimer or our Terms of Service; or (e) any regulatory action brought against Simpletide as a result of your actions or statements. This indemnification survives the termination of your account.
              </p>
            </div>

            {/* External Links */}
            <div data-reveal>
              <SectionHeading>External Links</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                This website may contain links to external websites. We have no control over the content and nature of these sites and are not responsible for their content or privacy practices. The inclusion of any links does not imply endorsement or recommendation.
              </p>
            </div>

            {/* Changes to This Disclaimer */}
            <div data-reveal>
              <SectionHeading>Changes to This Disclaimer</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                We reserve the right to modify this disclaimer at any time without prior notice. Changes will be effective immediately upon posting to this page. Your continued use of our website and products after any changes constitutes acceptance of the modified disclaimer.
              </p>
            </div>

            {/* FDA Disclaimer */}
            <div data-reveal>
              <SectionHeading>FDA Disclaimer</SectionHeading>
              <p className={`mt-4 ${BODY}`}>
                Statements made regarding our products have not been evaluated by the U.S. Food and Drug Administration. The efficacy of these products has not been confirmed by FDA-approved research. Products are not intended to diagnose, treat, cure, or prevent any disease. Information presented on this website is not a substitute for, or alternative to, information from a qualified health care practitioner. Please consult a licensed health care professional regarding any potential interactions or complications before using any product. This notice is required under the Federal Food, Drug, and Cosmetic Act.
              </p>
            </div>

            {/* Questions About This Disclaimer — filled brand-blue banner */}
            <div
              data-reveal="fade"
              className="rounded-[20px] px-6 py-8 text-center shadow-[0_10px_30px_rgba(167,139,250,0.25)] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] lg:px-10 lg:py-10"
              style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)" }}
            >
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[24px] lg:text-[26px]">
                Questions About This Disclaimer?
              </h2>
              <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-[1.6] text-white/85 lg:text-[15px]">
                If you have questions about this disclaimer, reach out to us:
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

        {/* ─── NEWSLETTER — same closing section as the Shipping & Returns page ─── */}
        <NewsletterSection variant="light" vialsOnMobile className="bg-white px-0 py-6 md:py-8" />
      </main>
    </div>
  );
}
