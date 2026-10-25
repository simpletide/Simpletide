import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/faq")({
  head: () =>
    pageSeoHead({
      path: "/faq",
      title: "FAQ | Simpletide",
      description:
        "Answers to common questions about Simpletide research compounds, purity testing, Certificates of Analysis, ordering, shipping, and support.",
    }),
  component: FaqPage,
});

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

type FaqItem = { q: string; a: ReactNode };

const FAQS: FaqItem[] = [
  {
    q: "How do I place an order?",
    a: "Simply browse our products, select your desired peptides, add them to your cart, and proceed to checkout. We accept all major credit cards with secure payment processing, and your order is processed immediately upon payment confirmation.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. All transactions are processed through secure, encrypted payment gateways to protect your information.",
  },
  {
    q: "Can I modify or cancel my order?",
    a: "Orders may be modified or cancelled within one hour of placement. After this window, orders enter processing and can no longer be changed. If you need to make changes, please contact support@simpletide.com immediately.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are typically processed within 24 hours, and all orders ship via priority shipping. Please note that occasional carrier delays may occur during transit, which are outside of our control.",
  },
  {
    q: "Do you ship internationally?",
    a: "We currently ship within the United States only. We're actively working to expand our shipping capabilities — sign up for our newsletter to be notified when international shipping becomes available.",
  },
  {
    q: "How are peptides packaged for shipping?",
    a: "All peptides are packed tightly in multiple layers of protection to ensure product safety during transit. Because our peptides ship in lyophilized (freeze-dried) form, insulated packaging is unnecessary to maintain stability. The multiple protective layers also help insulate each vial from temperature fluctuations during shipping, keeping your product secure from start to finish.",
  },
  {
    q: "What is the purity of your peptides?",
    a: "All of our peptides are manufactured to 99%+ purity standards. Each batch undergoes rigorous third-party testing by HPLC and mass spectrometry, and a Certificate of Analysis (COA) is available for every product on its product page.",
  },
  {
    q: "How should I store my peptides?",
    a: "Lyophilized (powder) peptides should be stored at -20°C for long-term storage or 2-8°C (refrigerator) for short-term. Once reconstituted, store at 2-8°C and use within 4-6 weeks. Always protect from light and avoid repeated freeze-thaw cycles.",
  },
  {
    q: "What is the shelf life of your peptides?",
    a: "Lyophilized peptides have a shelf life of 2+ years when stored properly at -20°C. Reconstituted peptides should be used within 4-6 weeks when refrigerated. Each product includes a lot-specific expiration date.",
  },
  {
    q: "How do I reconstitute peptides?",
    a: "Use bacteriostatic water (BAC water) for reconstitution.",
  },
  {
    q: "What is bacteriostatic water?",
    a: "Bacteriostatic water is sterile water containing 0.9% benzyl alcohol as a preservative. It prevents bacterial growth and allows reconstituted peptides to remain stable for 4-6 weeks when refrigerated.",
  },
  {
    q: "Are your peptides third-party tested?",
    a: "Yes, every batch is tested by independent, accredited laboratories using HPLC for purity verification and Mass Spectrometry for identity confirmation. Test results are published on each product page as Certificates of Analysis (CoA).",
  },
  {
    q: "Where are your peptides manufactured?",
    a: "Our peptides are synthesized in USA-based, FDA-registered facilities following strict cGMP guidelines. We maintain complete supply chain transparency and never source from overseas manufacturers.",
  },
  {
    q: "What is your return policy?",
    a: (
      <>
        Click{" "}
        <Link to="/shipping-returns" className="font-semibold text-[#8b5cf6] underline-offset-2 hover:underline">
          here
        </Link>{" "}
        to see our shipping and returns policy.
      </>
    ),
  },
  {
    q: "How do I contact customer support?",
    a: "Email us at support@simpletide.com for any questions or concerns. We typically respond within 24 hours on business days. You can also call or text us at (000) 000-0000.",
  },
  {
    q: "Do you offer bulk or wholesale pricing?",
    a: "Yes, we offer competitive bulk pricing for research institutions and high-volume customers. Contact sales@simpletide.com with your requirements for a custom quote. Bulk orders may also qualify for expedited shipping and dedicated support.",
  },
];

function FaqPage() {
  useReveal();

  // Single-open accordion across the whole page; clicking an open item closes it.
  const [openKey, setOpenKey] = useState<string | null>(null);

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
                Frequently Asked Questions
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Your Questions,{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Answered</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Everything you need to know about our research compounds, testing standards, ordering, and shipping. Can't find what you're looking for? Our team is always happy to help.
              </p>
            </div>
          </div>
        </section>

        {/* ─── FAQ — single accordion list (same questions as Peptora) ─── */}
        <section className="bg-white md:bg-[#FAFAFA] px-5 pt-6 pb-12 md:px-20 md:py-16">
          <div className="mx-auto max-w-[860px]">
            <div data-reveal className="mb-8 text-center md:mb-10 lg:mb-12">
              <h2 className="text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414] md:text-[40px] lg:text-[48px]">
                Frequently Asked <span className={`inline-block ${GRADIENT_TEXT}`}>Questions</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[560px] text-[13px] leading-[1.5] text-[#555] md:text-[15px] md:leading-[1.55] lg:text-[16px]">
                Everything you need to know about research peptides, ordering, shipping, and more.
              </p>
            </div>

            <div className="border-t border-slate-200 text-left">
              {FAQS.map((item, i) => {
                const key = item.q;
                const isOpen = openKey === key;
                return (
                  <div key={key} data-reveal style={revealDelay((i % 6) * 70)} className="border-b border-slate-200">
                    <button
                      type="button"
                      onClick={() => setOpenKey(isOpen ? null : key)}
                      aria-expanded={isOpen}
                      className="group w-full flex items-center justify-between gap-4 py-5 text-left [-webkit-tap-highlight-color:transparent]"
                    >
                      <span className="text-sm md:text-base font-semibold text-slate-900">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-0 text-[#8b5cf6]" : "-rotate-90 text-slate-400"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm md:text-base leading-relaxed text-slate-500 pb-5">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER — same blue radial card as the About page ─── */}
        <section className="px-5 py-16 md:px-20">
          <div className="mx-auto max-w-[1280px]">
            <div
              data-reveal="fade"
              className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-8 text-center shadow-[0_10px_30px_rgba(167,139,250,0.25)] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] lg:px-10 lg:py-10"
              style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)" }}
            >
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[24px] lg:text-[26px]">
                Still Have{" "}
                <span className="text-white/75">Questions?</span>
              </h2>
              <p className="mx-auto max-w-[560px] text-[13px] leading-[1.6] text-white/85 lg:text-[15px]">
                Our research support team is quick to respond and happy to help!
              </p>
              <p className="text-[13px] font-semibold lg:text-[15px]">
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
