import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

// "What We Stand For" value icons — exact SVG path data extracted from
// Peptora's live About page (peptoralabs.com /icons/*.svg, the Hugeicons set
// Peptora ships) for the matching value cards, in the same order. Each icon
// keeps its native viewBox + stroke width so the proportions and stroke weight
// match Peptora exactly, and uses `stroke="currentColor"` so the surrounding
// `text-[#8b5cf6]` class drives the color (rendered in our site blue #a78bfa;
// Peptora uses #2B848F teal).

// /icons/flask.svg — Erlenmeyer flask (Scientific Rigor).
function FlaskIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.66667}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.6667 1.66666V6.66666C11.6666 6.94623 11.7368 7.22134 11.8709 7.46666L16.4626 15.8667C16.6014 16.1205 16.6719 16.4061 16.6669 16.6954C16.6619 16.9847 16.5816 17.2678 16.4341 17.5167C16.2865 17.7656 16.0767 17.9717 15.8252 18.1149C15.5738 18.2581 15.2894 18.3334 15.0001 18.3333H5.00006C4.71071 18.3334 4.42632 18.2581 4.17489 18.1149C3.92345 17.9717 3.71362 17.7656 3.56605 17.5167C3.41848 17.2678 3.33825 16.9847 3.33326 16.6954C3.32826 16.4061 3.39867 16.1205 3.53756 15.8667L8.12923 7.46666C8.2633 7.22134 8.33351 6.94623 8.33339 6.66666V1.66666" />
      <path d="M5.37793 12.5H14.6229" />
      <path d="M7.08301 1.66666H12.9163" />
    </svg>
  );
}

// /icons/license-third-party.svg — document with text lines and a person.
function LicenseThirdPartyIcon({ className }: { className?: string }) {
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
      <path d="M26.0005 13.3333C26.0005 8.30497 26.0005 5.79083 24.4385 4.22872C22.8764 2.66663 20.3623 2.66663 15.3339 2.66663H14.0007C8.97242 2.66663 6.45829 2.66663 4.8962 4.22871C3.33409 5.79079 3.33408 8.30492 3.33404 13.3332L3.33398 18.6665C3.33394 23.6949 3.33392 26.209 4.89602 27.7712C6.45812 29.3333 8.97229 29.3333 14.0007 29.3333H16.0007" />
      <path d="M9.33398 9.33337H20.0007M9.33398 16H18.0007" />
      <path d="M21.149 29.3334H26.8522C28.0324 29.3334 29.0304 28.5316 28.5392 27.6707C27.752 26.2915 26.0158 25.3334 24.0006 25.3334C21.9854 25.3334 20.2493 26.2915 19.4621 27.6707C18.9709 28.5316 19.9689 29.3334 21.149 29.3334Z" />
      <path d="M23.9965 22C25.2858 22 26.3309 20.9554 26.3309 19.6667C26.3309 18.378 25.2858 17.3334 23.9965 17.3334C22.7073 17.3334 21.6621 18.378 21.6621 19.6667C21.6621 20.9554 22.7073 22 23.9965 22Z" />
    </svg>
  );
}

// /icons/laurel-wreath-01.svg — laurel wreath quality emblem.
function LaurelWreathIcon({ className }: { className?: string }) {
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
      <path d="M8.58152 10.6666C8.20651 11.7896 8 13.0171 8 14.303C8 19.6585 11.5817 24 16 24C20.4183 24 24 19.6585 24 14.303C24 13.0171 23.7935 11.7896 23.4185 10.6666" />
      <path d="M19.3327 28C19.3327 28 18.4233 24 15.9993 24C13.5753 24 12.666 28 12.666 28" />
      <path d="M24.6934 6.97289C25.0826 9.19512 23.3337 10.6667 23.3337 10.6667C23.3337 10.6667 21.1957 9.916 20.8065 7.69377C20.4173 5.47155 22.1662 4 22.1662 4C22.1662 4 24.3044 4.75068 24.6934 6.97289Z" />
      <path d="M28.1258 16.1857C26.4173 17.8748 24.104 17.2004 24.104 17.2004C24.104 17.2004 23.499 14.8368 25.2076 13.1477C26.916 11.4585 29.2294 12.133 29.2294 12.133C29.2294 12.133 29.8344 14.4965 28.1258 16.1857Z" />
      <path d="M24.3113 24.2528C22.3113 23.4853 22 21.3333 22 21.3333C22 21.3333 23.6887 19.9488 25.6887 20.7162C27.6887 21.4837 28 23.6357 28 23.6357C28 23.6357 26.3113 25.0202 24.3113 24.2528Z" />
      <path d="M7.68868 24.2527C9.68868 23.4852 10 21.3332 10 21.3332C10 21.3332 8.31132 19.9487 6.31132 20.7161C4.31132 21.4836 4 23.6356 4 23.6356C4 23.6356 5.68868 25.0201 7.68868 24.2527Z" />
      <path d="M3.87354 16.1857C5.58202 17.8748 7.89539 17.2004 7.89539 17.2004C7.89539 17.2004 8.5003 14.8368 6.79182 13.1477C5.08335 11.4585 2.76998 12.133 2.76998 12.133C2.76998 12.133 2.16507 14.4965 3.87354 16.1857Z" />
      <path d="M7.3065 6.97289C6.91732 9.19512 8.66624 10.6667 8.66624 10.6667C8.66624 10.6667 10.8043 9.916 11.1935 7.69377C11.5827 5.47155 9.83376 4 9.83376 4C9.83376 4 7.69567 4.75068 7.3065 6.97289Z" />
    </svg>
  );
}

// /icons/chat-secure-01.svg — chat bubble with a shield (secure support).
function ChatSecureIcon({ className }: { className?: string }) {
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
      <path d="M16.007 14.6666H16.019M10.6797 14.6666H10.6916" />
      <path d="M15.9993 4C14.0272 4 12.1262 4.0412 10.3409 4.11759C7.08695 4.2568 5.45995 4.32641 4.17278 5.62327C2.8856 6.92012 2.82978 8.50244 2.71814 11.6671C2.68396 12.6357 2.66602 13.6389 2.66602 14.6667C2.66602 15.6944 2.68396 16.6976 2.71814 17.6663C2.82978 20.8309 2.8856 22.4132 4.17278 23.71C5.45995 25.0069 7.08694 25.0765 10.3409 25.2157C10.4489 25.2204 10.5572 25.2248 10.666 25.2292V28.3601C10.666 28.8976 11.1017 29.3333 11.6392 29.3333C11.8716 29.3333 12.0963 29.2501 12.2727 29.0989L15.1787 26.6071C15.9093 25.9807 16.2745 25.6675 16.7087 25.5021C17.1428 25.3368 17.6369 25.3273 18.6251 25.3087C19.6657 25.2889 20.6791 25.2576 21.6576 25.2157C24.9117 25.0765 26.5388 25.0069 27.8259 23.7101C29.1131 22.4132 29.1689 20.8309 29.2805 17.6663C29.3073 16.9081 29.3241 16.1289 29.3301 15.3333" />
      <path d="M28.1453 3.46415C27.1641 2.962 25.9635 2.66663 24.6667 2.66663C23.3699 2.66663 22.1692 2.962 21.188 3.46415C20.7068 3.71039 20.4663 3.83352 20.2331 4.22064C20 4.60777 20 4.98261 20 5.73229V7.59305C20 10.6242 22.3553 12.3095 23.7193 13.0313C24.0997 13.2326 24.29 13.3333 24.6667 13.3333C25.0433 13.3333 25.2336 13.2326 25.614 13.0313C26.978 12.3095 29.3333 10.6242 29.3333 7.59305V5.73231C29.3333 4.98261 29.3333 4.60777 29.1003 4.22064C28.8671 3.83352 28.6265 3.71039 28.1453 3.46415Z" />
    </svg>
  );
}

// /icons/star-award-01.svg — star medal with ribbon tails (quality award).
function StarAwardIcon({ className }: { className?: string }) {
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
      <path d="M15.5588 6.94966C15.7428 6.5726 16.2585 6.57262 16.4425 6.94966L17.5272 9.17303C17.5992 9.3206 17.7344 9.42331 17.8911 9.44936L20.2489 9.84161C20.6485 9.90809 20.8079 10.4196 20.522 10.7189L18.834 12.4868C18.7223 12.6039 18.6707 12.7698 18.6953 12.9332L19.0673 15.4005C19.1304 15.8184 18.7133 16.1347 18.3524 15.9427L16.2257 14.8111C16.0844 14.7357 15.9169 14.7357 15.7756 14.8111L13.6489 15.9427C13.288 16.1347 12.8709 15.8184 12.9339 15.4005L13.306 12.9332C13.3306 12.7698 13.2791 12.6039 13.1673 12.4868L11.4793 10.7189C11.1935 10.4196 11.3528 9.90809 11.7524 9.84161L14.1103 9.44936C14.2669 9.42331 14.4021 9.3206 14.4741 9.17303L15.5588 6.94966Z" />
      <path d="M25.3327 12C25.3327 17.1546 21.154 21.3333 15.9993 21.3333C10.8447 21.3333 6.66602 17.1546 6.66602 12C6.66602 6.84531 10.8447 2.66663 15.9993 2.66663C21.154 2.66663 25.3327 6.84531 25.3327 12Z" />
      <path d="M17.334 21.7898L19.5025 27.535C19.9395 28.6926 20.158 29.2714 20.538 29.3333C20.9189 29.277 21.3856 28.6405 21.8417 27.4896C22.1684 26.6654 22.3316 26.2534 22.668 26.0313C22.7712 25.9632 22.884 25.9093 23.0033 25.8713C23.3921 25.7477 23.8393 25.8686 24.7336 26.1104C25.6899 26.3689 26.3541 26.2968 26.6164 26.1104C26.6936 26.0556 26.6164 26.1062 26.6164 26.1062C26.7708 25.8324 26.5624 25.4052 26.1457 24.5508L23.2755 18.6666" />
      <path d="M14.6673 21.7894L12.4988 27.5337C12.0619 28.691 11.6296 29.2714 11.2496 29.3333C10.8686 29.277 10.6405 28.7017 10.1844 27.5509C9.85781 26.727 9.66965 26.2524 9.33329 26.0301C9.23016 25.962 9.11725 25.9082 8.99803 25.8702C8.60916 25.7466 8.162 25.8676 7.26768 26.1093C6.31143 26.3677 5.64719 26.2914 5.38485 26.105C5.23048 25.8313 5.43887 25.4041 5.85563 24.5498L8.72581 18.6666" />
    </svg>
  );
}

// /icons/ai-dna.svg — DNA helix paired with an AI chip (innovation).
function AiDnaIcon({ className }: { className?: string }) {
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
      <path d="M9.98811 18.6686C4.00117 15.4686 4.00117 13.8686 4.00117 13.3353C4.00117 12.8019 4.00117 11.2019 9.98811 8.00191M9.98811 18.6686C4.00117 21.8686 4 22.9353 4 24.002M9.98811 18.6686C15.9738 15.4693 15.9738 13.8693 15.9738 13.3356C15.9738 12.8019 15.9738 11.2013 9.98811 8.00191M9.98811 8.00191C15.975 4.80191 15.975 3.73525 15.975 2.66858M9.98811 8.00191L7.07708 6.32765C4.00076 4.37723 4 3.52291 4 2.66858" />
      <path d="M19.2157 16.0006V18.6393M14.5664 20.6678H17.3023M25.2637 20.6678H27.9997M25.2637 24.6321H27.9997M14.5664 24.6321H17.3023M19.2157 26.6929V29.3315M23.2496 26.6929V29.3315M23.2353 16.0006V18.6393M18.6356 26.6239H23.9304C24.6668 26.6239 25.2637 26.027 25.2637 25.2906V19.9726C25.2637 19.2362 24.6668 18.6393 23.9304 18.6393H18.6356C17.8993 18.6393 17.3023 19.2362 17.3023 19.9726V25.2906C17.3023 26.027 17.8993 26.6239 18.6356 26.6239Z" />
    </svg>
  );
}

import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/about")({
  head: () =>
    pageSeoHead({
      path: "/about",
      title: "About Simpletide | Precision Research Compounds",
      description:
        "Simpletide delivers high-purity research compounds backed by transparent testing, scientific rigor, and uncompromising quality standards.",
    }),
  component: AboutPage,
});

// Light card treatment — the product page's WHY_CARD_CLASS look (subtle blue
// wash, 2px translucent blue border, soft layered shadow, hover glow). This is
// our brand-blue equivalent of Peptora's teal-tinted card; radius is applied
// per use to match Peptora's 24px corners.
// Structural classes only (no border-color / shadow) so the active and inactive
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

// Full resting card (used for the non-interactive treatments).
const LIGHT_CARD = `${LIGHT_CARD_BASE} ${LIGHT_CARD_INACTIVE}`;

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

function AboutPage() {
  useReveal();

  // Sticky tap-glow for the stat + value cards on mobile: a tapped card keeps
  // glowing (mirrors the desktop hover) until another card is tapped, the user
  // taps elsewhere, or scrolls.
  const [activeStat, setActiveStat] = useState<string | null>(null);
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  useEffect(() => {
    const make =
      (selector: string, setter: (v: string | null) => void) => (e?: Event) => {
        if (e && e.type === "pointerdown") {
          const target = e.target as HTMLElement | null;
          if (target && target.closest(selector)) return;
        }
        setter(null);
      };
    const clearStat = make("[data-stat-card]", setActiveStat);
    const clearValue = make("[data-value-card]", setActiveValue);
    const clearProcess = make("[data-process-card]", setActiveProcess);
    const onScroll = () => {
      setActiveStat(null);
      setActiveValue(null);
      setActiveProcess(null);
    };
    document.addEventListener("pointerdown", clearStat, { passive: true });
    document.addEventListener("pointerdown", clearValue, { passive: true });
    document.addEventListener("pointerdown", clearProcess, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", clearStat);
      document.removeEventListener("pointerdown", clearValue);
      document.removeEventListener("pointerdown", clearProcess);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const stats = [
    { value: "99%+", label: "Purity Standard" },
    { value: "25,000+", label: "Researchers Served" },
    { value: "50+", label: "Research Compounds" },
    { value: "2-3hr", label: "Average Response Time" },
  ];

  const values = [
    {
      icon: FlaskIcon,
      title: "Methodical Precision",
      desc: "Each compound meets stringent research-grade purity specifications, verified through independent and reproducible laboratory testing.",
    },
    {
      icon: LicenseThirdPartyIcon,
      title: "Open Documentation",
      desc: "We openly publish Certificates of Analysis, batch records, and independent test results for every product we offer.",
    },
    {
      icon: LaurelWreathIcon,
      title: "Built for the Lab",
      desc: "Our focus is the researcher. Each choice we make is guided by what meaningfully advances scientific discovery.",
    },
    {
      icon: ChatSecureIcon,
      title: "Dedicated Support",
      desc: "Our very quick responsive research support team is ready to assist with product questions, reconstitution guidance, and order tracking.",
    },
    {
      icon: StarAwardIcon,
      title: "Consistent Quality",
      desc: "Our compounds are manufactured in accredited U.S. facilities under documented process controls that ensure batch-to-batch consistency.",
    },
    {
      icon: AiDnaIcon,
      title: "Research-Driven Innovation",
      desc: "We regularly introduce emerging research compounds, ensuring your lab has access to the latest tools in the field.",
    },
  ];

  const process = [
    {
      step: "01",
      title: "Synthesis & Manufacturing",
      desc: "Compounds are synthesized in accredited, U.S.-based facilities using tightly controlled processes built for molecular accuracy.",
    },
    {
      step: "02",
      title: "In-House Quality Check",
      desc: "Each batch passes an internal quality-assurance review against our benchmarks before it moves on to outside testing.",
    },
    {
      step: "03",
      title: "Third-Party Lab Testing",
      desc: "Independent accredited laboratories run HPLC purity checks and Mass Spectrometry identity confirmation on every batch.",
    },
    {
      step: "04",
      title: "Certificate of Analysis",
      desc: "A detailed COA is produced for each batch, posted to our public archive, and shipped alongside the order it belongs to.",
    },
    {
      step: "05",
      title: "Secure Packaging & Shipping",
      desc: "Finished vials are kept under controlled conditions, packed with insulated materials, and shipped with temperature protection.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1">
        {/* ─── HERO — light blue gradient (matches product-page newsletter card) ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgb(221,214,254) 11%, rgb(237,233,254) 100%)" }}
        >
          {/* Faint floating vials, low opacity (Peptora uses small decorative vials) */}
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
                About Simpletide
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Simple Research,{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Backed by Science</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Our commitment is simple: provide researchers with the highest-purity peptides and compounds, backed by transparent testing and quality standards we never compromise.
              </p>
            </div>
          </div>
        </section>

        {/* ─── OUR MISSION — white ─── */}
        <section className="bg-white px-5 pt-6 pb-6 md:px-20 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            {/* Stat cards — single row */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:gap-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  data-stat-card
                  data-reveal
                  style={revealDelay((i % 6) * 70)}
                  onPointerDown={(e) => {
                    // Desktop (mouse): no click effect — glow is hover-only via
                    // CSS. Touch/pen: sticky tap-glow that mirrors hover.
                    if (e.pointerType !== "mouse") setActiveStat(s.label);
                  }}
                  className={`${LIGHT_CARD_BASE} ${
                    activeStat === s.label ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
                  } flex flex-col items-start gap-1 rounded-[16px] p-3 lg:gap-1.5 lg:rounded-[18px] lg:p-4 [-webkit-tap-highlight-color:transparent]`}
                >
                  <span className="text-[20px] font-bold leading-[1.1] tracking-[-0.03em] text-[#141414] lg:text-[30px]">
                    {s.value}
                  </span>
                  <span className="text-[11px] leading-tight text-[#555] lg:text-[13px]">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Mission statement — below the cards */}
            <div data-reveal className="mx-auto mt-12 max-w-[860px] text-center lg:mt-14">
              <h2 className="mb-5 text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414] md:text-[40px] lg:text-[48px]">
                Our <span className={`inline-block ${GRADIENT_TEXT}`}>Mission</span>
              </h2>
              <div className="flex flex-col gap-4">
                <p className="text-[16px] leading-7 tracking-[-0.01em] text-[#333333] lg:text-[18px]">
                  Simpletide was founded on a simple conviction: researchers deserve materials they can trust completely. Too often across the industry, purity is assumed rather than demonstrated, and sourcing is left poorly documented. We built our company around the opposite principle — verifiable quality and full transparency at every step.
                </p>
                <p className="text-[16px] leading-7 tracking-[-0.01em] text-[#333333] lg:text-[18px]">
                  Every compound we offer is validated by independent, accredited laboratories, and each batch is accompanied by a complete Certificate of Analysis. We believe that dependable, well-characterized inputs are the foundation of reproducible science.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WHAT WE STAND FOR — white on mobile, #FAFAFA on desktop ─── */}
        <section className="bg-white md:bg-[#FAFAFA] px-5 pt-4 pb-12 md:px-20 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <div data-reveal className="mb-12 text-center md:mb-10 lg:mb-12">
              <h2 className="text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414] md:text-[40px] lg:text-[48px]">
                What We <span className={`inline-block ${GRADIENT_TEXT}`}>Stand For</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-4 lg:grid-cols-3 lg:gap-6">
              {values.map((v, i) => (
                <div
                  key={v.title}
                  data-value-card
                  data-reveal
                  style={revealDelay((i % 6) * 70)}
                  onPointerDown={(e) => {
                    if (e.pointerType !== "mouse") setActiveValue(v.title);
                  }}
                  className={`${LIGHT_CARD_BASE} ${
                    activeValue === v.title ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
                  } group flex flex-col items-start gap-2 rounded-[16px] p-3.5 lg:gap-2.5 lg:rounded-[18px] lg:p-4 [-webkit-tap-highlight-color:transparent]`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#a78bfa]/12 transition-colors duration-300 group-hover:bg-[#a78bfa]/20 lg:h-10 lg:w-10 lg:rounded-[11px]">
                    <v.icon className="h-5 w-5 text-[#8b5cf6] lg:h-[22px] lg:w-[22px]" />
                  </div>
                  <h3 className="text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#242424] lg:text-[16px] lg:leading-6">
                    {v.title}
                  </h3>
                  <p className="text-[12px] leading-[1.4] tracking-[-0.01em] text-[#555] lg:text-[13.5px] lg:leading-5">
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── OUR QUALITY PROCESS — white ─── */}
        <section className="bg-white px-5 pt-4 pb-12 md:px-20 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <div data-reveal className="mb-12 text-center md:mb-10">
              <h2 className="text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-[#141414] md:text-[40px] lg:text-[48px]">
                Our Quality <span className={`inline-block ${GRADIENT_TEXT}`}>Process</span>
              </h2>
            </div>

            <div className="flex flex-col gap-2.5 md:gap-4">
              {process.map((item, i) => (
                <div
                  key={item.step}
                  data-process-card
                  data-reveal
                  style={revealDelay((i % 6) * 70)}
                  onPointerDown={(e) => {
                    if (e.pointerType !== "mouse") setActiveProcess(item.step);
                  }}
                  className={`${LIGHT_CARD_BASE} ${
                    activeProcess === item.step ? LIGHT_CARD_ACTIVE : LIGHT_CARD_INACTIVE
                  } flex items-start gap-3 rounded-[16px] p-3.5 lg:gap-4 lg:rounded-[18px] lg:p-4 [-webkit-tap-highlight-color:transparent]`}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white lg:h-10 lg:w-10 lg:text-[15px]"
                    style={{ background: "linear-gradient(135deg, #a78bfa 0%, #a78bfa 100%)" }}
                  >
                    {item.step}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#242424] lg:text-[16px] lg:leading-6">
                      {item.title}
                    </h3>
                    <p className="text-[12px] leading-[1.4] tracking-[-0.01em] text-[#555] lg:text-[14px] lg:leading-6">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA BANNER — blue radial card (mirrors Peptora's teal banner) ─── */}
        <section className="px-5 py-16 md:px-20">
          <div className="mx-auto max-w-[1280px]">
            <div
              data-reveal="fade"
              className="flex flex-col items-center gap-4 rounded-[20px] px-6 py-8 text-center shadow-[0_10px_30px_rgba(167,139,250,0.25)] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] lg:px-10 lg:py-10"
              style={{ background: "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 50%, #93c5fd 100%)" }}
            >
              <h2 className="text-[20px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-[24px] lg:text-[26px]">
                Ready to Simplify Your{" "}
                <span className="text-white/75">Research?</span>
              </h2>
              <p className="mx-auto max-w-[560px] text-[13px] leading-[1.6] text-white/85 lg:text-[15px]">
                Browse our catalog of high-purity research compounds, every one accompanied by a published Certificate of Analysis and backed by fast, reliable shipping.
              </p>
              <Link
                to="/products"
                className="group mt-1 inline-flex h-11 items-center justify-center rounded-[99px] bg-white px-7 text-[14px] font-semibold text-[#8b5cf6] transition-colors hover:bg-white/90 lg:h-12 lg:text-[15px]"
              >
                <span>Shop Products</span>
                <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:w-5">
                  <ArrowRight className="h-5 w-5 flex-shrink-0 -translate-x-2 opacity-0 transition-all duration-300 ease-in-out group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── NEWSLETTER — white (Peptora's About page ends here) ─── */}
        <NewsletterSection variant="light" vialsOnMobile className="bg-white px-0 py-6 md:py-8" />
      </main>
    </div>
  );
}
