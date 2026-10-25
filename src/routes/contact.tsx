import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

// Pixel-faithful copies of Peptora's contact-card icons (their /icons/*.svg
// outline assets), recolored from teal to our brand blue via currentColor so
// the existing icon tile's text color controls them.

// Peptora /icons/mail-01.svg — outline envelope (Support card).
function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.6665 8L11.8839 13.2226C15.282 15.148 16.7177 15.148 20.1158 13.2226L29.3332 8" />
      <path d="M2.68753 17.9675C2.77469 22.0549 2.81828 24.0985 4.32645 25.6125C5.83461 27.1264 7.93361 27.1791 12.1316 27.2845C14.7189 27.3496 17.2808 27.3496 19.8681 27.2845C24.0661 27.1791 26.165 27.1264 27.6733 25.6125C29.1814 24.0985 29.225 22.0549 29.3121 17.9675C29.3402 16.6532 29.3402 15.3468 29.3121 14.0325C29.225 9.94515 29.1814 7.90146 27.6733 6.38755C26.165 4.87365 24.0661 4.82091 19.8681 4.71543C17.2808 4.65042 14.7189 4.65042 12.1316 4.71542C7.93361 4.82089 5.83461 4.87362 4.32644 6.38754C2.81826 7.90145 2.77469 9.94514 2.68752 14.0325C2.65949 15.3468 2.6595 16.6532 2.68753 17.9675Z" />
    </svg>
  );
}

// Peptora /icons/headset.svg — outline customer-support headset (Sales card).
function HeadsetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M25 20C25 18.159 26.4923 16.6667 28.3333 16.6667C32.0152 16.6667 35 19.6515 35 23.3333C35 27.0152 32.0152 30 28.3333 30C26.4923 30 25 28.5077 25 26.6667V20Z" />
      <path d="M15 20C15 18.159 13.5076 16.6667 11.6667 16.6667C7.98477 16.6667 5 19.6515 5 23.3333C5 27.0152 7.98477 30 11.6667 30C13.5076 30 15 28.5077 15 26.6667V20Z" />
      <path d="M5 23.3333V18.3333C5 10.0491 11.7157 3.33333 20 3.33333C28.2843 3.33333 35 10.0491 35 18.3333V26.4103C35 29.7575 35 31.431 34.4127 32.7362C33.7442 34.2215 32.5548 35.4108 31.0695 36.0793C29.7643 36.6667 28.0908 36.6667 24.7437 36.6667H20" />
    </svg>
  );
}

// Peptora /icons/call-02.svg — outline phone handset (Phone card).
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15.2642 9.52028L14.5932 8.01031C14.1544 7.02303 13.935 6.52936 13.6068 6.15158C13.1956 5.67813 12.6596 5.32979 12.06 5.14631C11.5815 4.99989 11.0413 4.99989 9.96083 4.99989C8.38033 4.99989 7.59008 4.99989 6.9267 5.30371C6.14527 5.66159 5.43955 6.43869 5.15837 7.25089C4.91967 7.94038 4.98805 8.64894 5.12478 10.0661C6.58033 25.1502 14.8502 33.42 29.9343 34.8757C31.3514 35.0123 32.0601 35.0807 32.7494 34.842C33.5617 34.5608 34.3388 33.8552 34.6968 33.0737C35.0004 32.4103 35.0004 31.62 35.0004 30.0395C35.0004 28.9592 35.0004 28.419 34.8541 27.9405C34.6706 27.3408 34.3223 26.8048 33.8488 26.3935C33.4711 26.0655 32.9774 25.846 31.9901 25.4072L30.4801 24.7362C29.4109 24.261 28.8762 24.0233 28.3331 23.9717C27.8131 23.9222 27.2889 23.9952 26.8023 24.1847C26.2938 24.3827 25.8444 24.7572 24.9454 25.5063C24.0507 26.2518 23.6034 26.6247 23.0567 26.8243C22.5721 27.0015 21.9314 27.067 21.4211 26.9918C20.8452 26.907 20.4044 26.6713 19.5226 26.2002C16.7792 24.734 15.2664 23.2212 13.8003 20.4778C13.3291 19.596 13.0935 19.1552 13.0086 18.5793C12.9334 18.069 12.999 17.4283 13.176 16.9437C13.3757 16.397 13.7485 15.9497 14.4941 15.0549C15.2432 14.156 15.6177 13.7066 15.8157 13.1981C16.0052 12.7115 16.0782 12.1872 16.0287 11.6674C15.9771 11.1241 15.7394 10.5895 15.2642 9.52028Z" />
    </svg>
  );
}

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageSeoHead({
      path: "/contact",
      title: "Contact Simpletide | Research Support & Sales",
      description:
        "Get in touch with the Simpletide team for help with orders, product questions, reconstitution guidance, bulk pricing, and Certificates of Analysis.",
    }),
  component: ContactPage,
});

// Light card treatment — shared with /about (subtle blue wash, 2px translucent
// blue border, soft layered shadow, hover glow). Our brand-blue equivalent of
// Peptora's teal-tinted card; radius applied per use to match Peptora's 24px.
// Structural classes only (no border-color / shadow) so the active + inactive
// variants below never conflict in the generated CSS.
const LIGHT_CARD_BASE = [
  "border-2 bg-[#F3EEFE]",
  "transition-[border-color,box-shadow] duration-300 ease-out",
].join(" ");

// Resting border + shadow plus the desktop hover glow.
const LIGHT_CARD_INACTIVE = [
  "border-[rgba(167,139,250,0.10)]",
  "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.06)]",
  "hover:border-[rgba(167,139,250,0.5)]",
  "hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.15),0_4px_16px_rgba(0,0,0,0.04)]",
].join(" ");

// Tapped/active glow (same look as hover) for sticky mobile taps.
const LIGHT_CARD_ACTIVE =
  "border-[rgba(167,139,250,0.5)] shadow-[0_0_20px_4px_rgba(167,139,250,0.15),0_4px_16px_rgba(0,0,0,0.04)]";

// Full resting card (used for the non-interactive treatments, e.g. the form).
const LIGHT_CARD = `${LIGHT_CARD_BASE} ${LIGHT_CARD_INACTIVE}`;

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

// Light-background form field styling (mirrors NewsletterSection's light variant).
const FIELD_CLASS =
  "w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#a78bfa] transition-colors";

const SUPPORT_EMAIL = "support@simpletide.com";
const SALES_EMAIL = "sales@simpletide.com";

function ContactPage() {
  useReveal();

  // Sticky tap-glow for the contact cards on mobile (mirrors the desktop hover):
  // a tapped card keeps glowing until another is tapped, the user taps
  // elsewhere, or scrolls.
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  useEffect(() => {
    const clear = (e?: Event) => {
      if (e && e.type === "pointerdown") {
        const target = e.target as HTMLElement | null;
        if (target && target.closest("[data-channel-card]")) return;
      }
      setActiveChannel(null);
    };
    document.addEventListener("pointerdown", clear, { passive: true });
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", clear);
      window.removeEventListener("scroll", clear);
    };
  }, []);

  const channels = [
    {
      icon: MailIcon,
      title: "Support",
      desc: "Our research support team is here to help.",
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: HeadsetIcon,
      title: "Sales",
      desc: "Questions or queries? Get in touch!",
      value: SALES_EMAIL,
      href: `mailto:${SALES_EMAIL}`,
    },
    {
      icon: PhoneIcon,
      title: "Phone",
      desc: "Monday-Friday from 10am-7pm EST.",
      caption: "Text or Call:",
      value: "(000) 000-0000",
      href: "tel:0000000000" as string | undefined,
    },
  ];

  const faqs = [
    {
      q: "How long does it take to get a response?",
      a: "We typically reply to every inquiry within 24 hours Monday-Saturday. For order-specific issues, include your order number so we can prioritize it.",
    },
    {
      q: "My order arrived damaged or incorrect. What should I do?",
      a: "Email our support team right away with your order number and a photo of the issue, and we'll arrange a replacement or refund as quickly as possible.",
    },
    {
      q: "Do you offer bulk or wholesale pricing?",
      a: "We do. Reach out to our sales team with your volume requirements and we'll put together a custom quote for your lab.",
    },
    {
      q: "How do I get a Certificate of Analysis (COA)?",
      a: "Our complete archive is available on the COA page. Need a specific batch? Send us the batch number and we'll forward it directly.",
    },
    {
      q: "Which compound is right for my research?",
      a: "Tell us about your research goals and our team will help point you toward the most relevant compounds in our catalog.",
    },
    {
      q: "My payment was declined. What should I do?",
      a: "Double-check your payment details and try again, or use an alternate method. If the issue persists, contact your bank or reach out and we'll help you troubleshoot.",
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1">
        {/* ─── HERO — light blue gradient (matches /about + product newsletter card) ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgb(221,214,254) 11%, rgb(237,233,254) 100%)" }}
        >
          {/* Faint floating vials, low opacity (Peptora uses small decorative vials) */}
          <div data-reveal="fade" className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            <div className="absolute top-[4%] left-[2%] md:top-[16%] md:left-[12%] w-[clamp(56px,9.5vw,150px)] rotate-[-10deg] opacity-70">
              <img src={vialNad.url} alt="" className="w-full object-contain animate-vial-left" loading="lazy" />
            </div>
            <div className="absolute top-[3%] right-[6%] md:top-[10%] md:right-[11%] w-[clamp(50px,8.5vw,128px)] rotate-[-42deg] opacity-70">
              <img src={vialGhkCu.url} alt="" className="w-full object-contain animate-vial-center" loading="lazy" />
            </div>
            <div className="absolute bottom-[9%] right-[7%] md:bottom-[10%] md:right-[20%] w-[clamp(56px,8.5vw,136px)] rotate-[-5deg] opacity-70">
              <img src={vialGlp3.url} alt="" className="w-full object-contain animate-vial-right" loading="lazy" />
            </div>
          </div>

          <div className="relative z-[1] mx-auto flex max-w-[1280px] items-center justify-center md:items-start min-h-[285px] md:min-h-[clamp(320px,44vh,440px)]">
            <div className="mx-auto max-w-[700px] px-6 pt-2 pb-12 text-center md:pt-11 md:pb-24">
              <span data-reveal style={revealDelay(0)} className="mb-4 md:mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] md:px-[22px] md:py-2.5 md:text-sm font-semibold text-[#19276E] shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-[8px]">
                Typically respond within 24 hours
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                How can we{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>help?</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Our dedicated research support team is ready to assist you with orders, product questions, and anything else your lab needs.
              </p>
            </div>
          </div>
        </section>

        {/* ─── CONTACT CHANNELS — white (Peptora's Support / Sales / Phone cards) ─── */}
        <section className="bg-white px-5 pt-8 pb-12 md:px-20 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-4 lg:gap-6">
              {channels.map((c, i) => (
                <div
                  key={c.title}
                  data-channel-card
                  data-reveal
                  style={revealDelay((i % 6) * 70)}
                  onPointerDown={(e) => {
                    // Desktop (mouse): no click effect — glow is hover-only via
                    // CSS. Touch/pen: sticky tap-glow that mirrors hover.
                    if (e.pointerType !== "mouse") setActiveChannel(c.title);
                  }}
                  className={`${LIGHT_CARD_BASE} ${
                    activeChannel === c.title ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
                  } group flex flex-col items-start gap-2 rounded-[16px] p-3.5 lg:gap-2.5 lg:rounded-[18px] lg:p-4 [-webkit-tap-highlight-color:transparent]`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#a78bfa]/12 transition-colors duration-300 group-hover:bg-[#a78bfa]/20 lg:h-10 lg:w-10 lg:rounded-[11px]">
                    <c.icon className="h-5 w-5 text-[#8b5cf6] lg:h-[22px] lg:w-[22px]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#242424] lg:text-[16px] lg:leading-6">
                      {c.title}
                    </h3>
                    <p className="text-[12px] leading-[1.4] tracking-[-0.01em] text-[#555] lg:text-[14px] lg:leading-5">{c.desc}</p>
                  </div>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {"caption" in c && c.caption ? (
                      <span className="text-[13px] font-medium leading-4 tracking-[-0.01em] text-[#555]">
                        {c.caption}
                      </span>
                    ) : null}
                    {c.href ? (
                      <a
                        href={c.href}
                        className="text-[15px] font-semibold text-[#8b5cf6] transition-colors hover:text-[#a78bfa]"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <span className="text-[15px] font-semibold text-[#8b5cf6]">{c.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ — #FAFAFA (Peptora's Frequently Asked Questions accordion) ─── */}
        <section className="bg-white md:bg-[#FAFAFA] px-5 pt-4 pb-12 md:px-20 md:py-16">
          <div className="mx-auto max-w-[860px]">
            <div data-reveal className="mb-8 text-center md:mb-10 lg:mb-12">
              <h2 className="text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414] md:text-[40px] lg:text-[48px]">
                Frequently Asked <span className={`inline-block ${GRADIENT_TEXT}`}>Questions</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[13px] leading-[1.5] text-[#555] md:text-[15px] md:leading-[1.55] lg:text-[16px]">
                Common questions about orders, shipping, and research support.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 md:gap-3">
              {faqs.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={item.q} data-reveal style={revealDelay((i % 6) * 70)} className={`${LIGHT_CARD} overflow-hidden rounded-[14px]`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left lg:gap-4 lg:px-5 lg:py-3.5"
                    >
                      <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#242424] lg:text-[15px]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#8b5cf6] transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                    >
                      <div className="overflow-hidden">
                        <p className="px-4 pb-3.5 text-[12px] leading-[1.5] text-[#555] lg:px-5 lg:pb-4 lg:text-[14px] lg:leading-6">
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

        {/* ─── GET IN TOUCH — white form section (Peptora's contact form) ─── */}
        <section className="bg-white px-5 pb-16 md:px-20">
          <div className="mx-auto max-w-[760px]">
            <div data-reveal className="mb-6 text-center md:mb-8">
              <h2 className="text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414] md:text-[40px] lg:text-[48px]">
                Get in <span className={`inline-block ${GRADIENT_TEXT}`}>Touch</span>
              </h2>
              <p className="mx-auto mt-3 max-w-[520px] text-[13px] leading-[1.5] text-[#555] md:text-[15px] md:leading-[1.55] lg:text-[16px]">
                Choose the best way to reach our team and we'll get back to you soon.
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className={`${LIGHT_CARD} space-y-4 rounded-[16px] p-4 sm:space-y-5 sm:rounded-[18px] sm:p-6`}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#242424]">First name</label>
                  <input type="text" placeholder="Enter first name" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#242424]">Last name</label>
                  <input type="text" placeholder="Enter last name" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#242424]">Email address</label>
                  <input type="email" placeholder="Enter email address" className={FIELD_CLASS} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#242424]">Phone number</label>
                  <input type="tel" placeholder="Enter phone number" className={FIELD_CLASS} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#242424]">Message</label>
                <textarea rows={4} placeholder="Type message" className={`${FIELD_CLASS} resize-none`} />
              </div>
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-8 py-3 font-bold text-white shadow-[0_0_20px_rgba(167,139,250,0.45)] transition-all hover:scale-[1.02]"
                >
                  <span>Submit Message</span>
                  <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:w-5">
                    <ArrowRight className="h-5 w-5 flex-shrink-0 -translate-x-2 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ─── NEWSLETTER — white (matches /about ending) ─── */}
        <NewsletterSection variant="light" vialsOnMobile className="bg-white px-0 py-6 md:py-8" />
      </main>
    </div>
  );
}
