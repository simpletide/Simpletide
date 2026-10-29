import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  X,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { useCart, parsePrice } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { slugFor, descriptorFor, seoProductSlug } from "@/lib/catalog";
import { pageSeoHead } from "@/lib/site-seo";
import { NewsletterSection } from "@/components/NewsletterSection";
import { QualityTestsCarousel } from "@/components/QualityTestsCarousel";
import { useReveal, revealDelay } from "@/lib/use-reveal";

const HERO_VIAL_CENTER = "/images/hero-vials/simpletide-selank-semax-20mg.png";
const HERO_VIAL_LEFT = "/images/hero-vials/simpletide-bpc157-10mg.png";
const HERO_VIAL_RIGHT = "/images/hero-vials/simpletide-selank-10mg.png";

// Home "feature" card icons
// Peptora ships on their live homepage trust/feature cards
// (peptoralabs.com /icons/trust-*.svg, the Hugeicons set Peptora uses), in the
// same card order. These are the homepage's own exports (native 40x40 viewBox,
// 2.5 stroke), the same shapes used on our product/about pages but at the
// homepage's scale. Each keeps its native viewBox + stroke width so the
// proportions match Peptora exactly, and uses `stroke="currentColor"` so the
// surrounding text color class drives the color (pastel violet on the frosted
// white cards; Peptora renders them in #2B848F teal).

// /icons/trust-truck-delivery.svg — delivery truck (Fast Shipping).
function TruckDeliveryIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M28.3333 33.3333C30.1743 33.3333 31.6667 31.8409 31.6667 30C31.6667 28.159 30.1743 26.6667 28.3333 26.6667C26.4924 26.6667 25 28.159 25 30C25 31.8409 26.4924 33.3333 28.3333 33.3333Z" />
      <path d="M11.6673 33.3333C13.5083 33.3333 15.0007 31.8409 15.0007 30C15.0007 28.159 13.5083 26.6667 11.6673 26.6667C9.82637 26.6667 8.33398 28.159 8.33398 30C8.33398 31.8409 9.82637 33.3333 11.6673 33.3333Z" />
      <path d="M8.33398 29.954C6.50612 29.863 5.36582 29.591 4.55437 28.7797C3.74292 27.9682 3.47102 26.8278 3.3799 25M15.0007 30H25.0007M31.6673 29.954C33.4952 29.863 34.6355 29.591 35.447 28.7797C36.6673 27.5592 36.6673 25.595 36.6673 21.6667V18.3333H28.834C27.5931 18.3333 26.9727 18.3333 26.4707 18.1702C25.4558 17.8405 24.6602 17.0448 24.3305 16.03C24.1673 15.5279 24.1673 14.9075 24.1673 13.6667C24.1673 11.8054 24.1673 10.8747 23.9227 10.1216C23.428 8.5994 22.2347 7.40596 20.7125 6.91138C19.9593 6.66666 19.0287 6.66666 17.1673 6.66666H3.33398" />
      <path d="M3.33398 13.3333H13.334" />
      <path d="M3.33398 18.3333H10.0007" />
      <path d="M24.166 10H27.2013C29.627 10 30.8397 10 31.8267 10.5895C32.8137 11.179 33.3887 12.2469 34.5387 14.3825L36.666 18.3333" />
    </svg>
  );
}

// /icons/trust-checkmark-badge.svg — scalloped verification seal with a check
// (Safe Payments; the half-scale trust-checkmark-badge-2.svg also drives the
// 24/7 Support card — identical shape, so this component serves both).
function CheckmarkBadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path d="M31.6515 31.6667H31.6673M31.6515 31.6667C30.6136 32.6958 28.7328 32.4395 27.4138 32.4395C25.7948 32.4395 25.0152 32.7562 23.8597 33.9117C22.8758 34.8957 21.5568 36.6667 20.0007 36.6667C18.4445 36.6667 17.1255 34.8957 16.1416 33.9117C14.9861 32.7562 14.2065 32.4395 12.5874 32.4395C11.2685 32.4395 9.38762 32.6958 8.3498 31.6667C7.30367 30.6293 7.56112 28.7407 7.56112 27.4132C7.56112 25.7357 7.19425 24.9643 5.99962 23.7697C4.22255 21.9927 3.33402 21.104 3.33398 20C3.334 18.8958 4.22252 18.0073 5.99957 16.2303C7.06598 15.1639 7.56112 14.1071 7.56112 12.5868C7.56112 11.2678 7.3048 9.3869 8.33398 8.34907C9.37137 7.30297 11.26 7.56044 12.5875 7.56044C14.1078 7.56044 15.1645 7.06534 16.2309 5.99895C18.008 4.22187 18.8965 3.33334 20.0007 3.33334C21.1048 3.33334 21.9933 4.22187 23.7703 5.99895C24.8365 7.06512 25.8932 7.56044 27.4138 7.56044C28.7328 7.56044 30.6138 7.30412 31.6517 8.33334C32.6977 9.37072 32.4401 11.2593 32.4401 12.5868C32.4401 14.2643 32.8072 15.0356 34.0017 16.2303C35.7788 18.0073 36.6673 18.8958 36.6673 20C36.6673 21.104 35.7788 21.9927 34.0017 23.7697C32.807 24.9643 32.4401 25.7357 32.4401 27.4132C32.4401 28.7407 32.6976 30.6293 31.6515 31.6667Z" />
      <path
        d="M15 21.4882C15 21.4882 17 22.5745 18 24.1667C18 24.1667 21 17.9167 25 15.8333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// /icons/trust-laurel-wreath.svg — laurel wreath quality emblem (Quality; the
// identical trust-laurel-wreath-2.svg also drives the "Our Promise" card).
function LaurelWreathIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.7269 13.3333C10.2581 14.737 10 16.2714 10 17.8788C10 24.5732 14.4771 30 20 30C25.5228 30 30 24.5732 30 17.8788C30 16.2714 29.7418 14.737 29.2732 13.3333" />
      <path d="M24.1673 35C24.1673 35 23.0307 30 20.0007 30C16.9707 30 15.834 35 15.834 35" />
      <path d="M30.8668 8.71612C31.3533 11.4939 29.1671 13.3333 29.1671 13.3333C29.1671 13.3333 26.4946 12.395 26.0081 9.61722C25.5216 6.83943 27.7078 5 27.7078 5C27.7078 5 30.3805 5.93835 30.8668 8.71612Z" />
      <path d="M35.1573 20.2322C33.0216 22.3435 30.13 21.5005 30.13 21.5005C30.13 21.5005 29.3738 18.546 31.5095 16.4346C33.645 14.3231 36.5368 15.1662 36.5368 15.1662C36.5368 15.1662 37.293 18.1207 35.1573 20.2322Z" />
      <path d="M30.3892 30.316C27.8892 29.3567 27.5 26.6667 27.5 26.6667C27.5 26.6667 29.6108 24.936 32.1108 25.8954C34.6108 26.8547 35 29.5447 35 29.5447C35 29.5447 32.8892 31.2754 30.3892 30.316Z" />
      <path d="M9.61085 30.3158C12.1108 29.3565 12.5 26.6665 12.5 26.6665C12.5 26.6665 10.3891 24.9358 7.88915 25.8952C5.38915 26.8545 5 29.5445 5 29.5445C5 29.5445 7.11085 31.2752 9.61085 30.3158Z" />
      <path d="M4.84339 20.2322C6.97899 22.3435 9.8707 21.5005 9.8707 21.5005C9.8707 21.5005 10.6268 18.546 8.49124 16.4346C6.35565 14.3231 3.46394 15.1662 3.46394 15.1662C3.46394 15.1662 2.7078 18.1207 4.84339 20.2322Z" />
      <path d="M9.13312 8.71612C8.64665 11.4939 10.8328 13.3333 10.8328 13.3333C10.8328 13.3333 13.5054 12.395 13.9919 9.61722C14.4784 6.83943 12.2922 5 12.2922 5C12.2922 5 9.61959 5.93835 9.13312 8.71612Z" />
    </svg>
  );
}

// /icons/trust-star-award.svg — star medal with ribbon tails (lab testing award).
function StarAwardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19.447 8.68712C19.677 8.21581 20.3217 8.21582 20.5517 8.68712L21.9075 11.4663C21.9975 11.6508 22.1665 11.7792 22.3624 11.8118L25.3097 12.3021C25.8092 12.3852 26.0083 13.0246 25.651 13.3987L23.541 15.6086C23.4014 15.755 23.3369 15.9623 23.3677 16.1666L23.8327 19.2507C23.9115 19.773 23.3902 20.1684 22.939 19.9284L20.2807 18.5139C20.104 18.4197 19.8947 18.4197 19.718 18.5139L17.0597 19.9284C16.6086 20.1684 16.0872 19.773 16.1659 19.2507L16.631 16.1666C16.6618 15.9623 16.5974 15.755 16.4576 15.6086L14.3476 13.3987C13.9904 13.0246 14.1895 12.3852 14.689 12.3021L17.6363 11.8118C17.8322 11.7792 18.0012 11.6508 18.0912 11.4663L19.447 8.68712Z" />
      <path d="M31.6673 15C31.6673 21.4433 26.444 26.6667 20.0007 26.6667C13.5573 26.6667 8.33398 21.4433 8.33398 15C8.33398 8.55669 13.5573 3.33334 20.0007 3.33334C26.444 3.33334 31.6673 8.55669 31.6673 15Z" />
      <path d="M21.666 27.2373L24.3767 34.4188C24.9228 35.8658 25.196 36.5893 25.671 36.6667C26.1472 36.5963 26.7305 35.8007 27.3007 34.362C27.709 33.3318 27.913 32.8168 28.3335 32.5392C28.4625 32.454 28.6035 32.3867 28.7527 32.3392C29.2387 32.1847 29.7977 32.3358 30.9155 32.638C32.1108 32.9612 32.9412 32.871 33.269 32.638C33.3655 32.5695 33.269 32.6328 33.269 32.6328C33.462 32.2905 33.2015 31.7565 32.6807 30.6885L29.0928 23.3333" />
      <path d="M18.3327 27.2368L15.622 34.4172C15.0759 35.8638 14.5355 36.5893 14.0605 36.6667C13.5843 36.5963 13.2992 35.8772 12.729 34.4387C12.3208 33.4088 12.0856 32.8155 11.6652 32.5377C11.5362 32.4525 11.3951 32.3853 11.2461 32.3378C10.76 32.1833 10.201 32.3345 9.08314 32.6367C7.88782 32.9597 7.05752 32.8643 6.7296 32.6313C6.53664 32.2892 6.79712 31.7552 7.31807 30.6873L10.9058 23.3333" />
    </svg>
  );
}

// Hero "trust pill" icons — exact SVG path data extracted VERBATIM from the
// icons Peptora ships on their live homepage hero pills (peptoralabs.com
// /icons/*.svg), matched to our pills by the corresponding Peptora pill:
//   • /icons/test-tube.svg       → Peptora's "Lab-Tested & Documented" pill
//   • /icons/checkmark-badge.svg → Peptora's "99% verified purity" pill
//     (the same rosette glyph as CheckmarkBadgeIcon above — the trust-checkmark-
//     badge.svg is identical at 2x scale — so that component is reused here)
//   • /icons/discover-square.svg → Peptora's "Controlled Manufacturing" pill
// Each keeps its native viewBox + per-path stroke width/linecap/linejoin so the
// proportions match Peptora exactly, and uses `stroke="currentColor"` so the
// surrounding text color class drives the color (pastel violet on the frosted
// white pills; Peptora renders them in #242424).

// /icons/test-tube.svg — capped test tube with liquid + bubbles (Lab-Tested).
function TestTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        d="M12.1177 1.66669V3.73854C12.1177 5.19516 12.1177 5.92347 12.2961 6.62264C12.4744 7.32182 12.8239 7.9638 13.5229 9.24777L14.4701 10.9877C16.2513 14.2596 17.142 15.8956 16.4113 17.1084L16.4 17.1269C15.6586 18.3334 13.7726 18.3334 10.0006 18.3334C6.22862 18.3334 4.34262 18.3334 3.60132 17.1269L3.59002 17.1084C2.85936 15.8956 3.74997 14.2596 5.5312 10.9877L6.4784 9.24777C7.17739 7.9638 7.52689 7.32182 7.70522 6.62264C7.88354 5.92347 7.88354 5.19516 7.88354 3.73854V1.66669"
        strokeWidth={1.5}
      />
      <path
        d="M7.5 13.3354L7.50853 13.333"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 15.0021L12.5085 14.9997"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.66602 1.66669H13.3327"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 9.63028C7.08333 8.66911 8.41617 9.36194 10 10.2652C12.0833 11.4533 13.3333 10.5417 13.75 9.67936"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

export const Route = createFileRoute("/")({
  head: () =>
    pageSeoHead({
      path: "/",
      title: "Simpletide | Premium Research Compounds",
      description:
        "High-purity molecular compounds manufactured for advanced research and innovation in certified USA laboratories.",
    }),
  component: SimpletideHome,
});

type Variant = { size: string; price: number };
const HOME_VARIANTS: Record<string, Variant[]> = {
  "GLP-3 RT (RETA)": [
    { size: "10mg", price: 65 },
    { size: "20mg", price: 120 },
    { size: "30mg", price: 150 },
    { size: "60mg", price: 240 },
  ],
  "GLP-2 TZ": [
    { size: "10mg", price: 60 },
    { size: "20mg", price: 110 },
    { size: "30mg", price: 140 },
    { size: "60mg", price: 220 },
  ],
  "CJC-1295 + Ipamorelin": [
    { size: "10mg", price: 75 },
    { size: "20mg", price: 120 },
  ],
  "MOTS-c": [
    { size: "10mg", price: 65 },
    { size: "40mg", price: 160 },
  ],
  "Wolverine": [
    { size: "10mg", price: 70 },
    { size: "20mg", price: 120 },
    { size: "40mg", price: 200 },
  ],
};

function SimpletideHome() {
  const { openCart, addItem, count: cartCount } = useCart();

  const [openVariantId, setOpenVariantId] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Card "sticky" highlight: a tapped feature/product card stays highlighted
  // until the user taps another card, taps elsewhere, or scrolls (mirrors the
  // desktop hover glow). Cards are keyed as `feature-N` / `product-N`.
  const [activeCard, setActiveCard] = useState<string | null>(null);
  useEffect(() => {
    const clear = (e?: Event) => {
      if (e && e.type === "pointerdown") {
        const target = e.target as HTMLElement | null;
        if (target && target.closest("[data-card]")) return; // tap on a card → keep
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

  // Peptora-style entrance + scroll reveals (see useReveal / styles.css).
  useReveal();

  useEffect(() => {
    if (!openVariantId) return;
    const onClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenVariantId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenVariantId(null);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [openVariantId]);



  const features = [
    { icon: TruckDeliveryIcon, title: "Fast Shipping", desc: "Orders processed and shipped within 24 hours with full tracking." },
    { icon: CheckmarkBadgeIcon, title: "100% Safe Payments", desc: "All transactions are secured with industry-standard encryption." },
    { icon: LaurelWreathIcon, title: "Premium Research Grade Quality", desc: "Every compound undergoes extensive third party testing for guaranteed quality and consistency." },
    { icon: StarAwardIcon, title: "Verified in Accredited U.S. Laboratories", desc: "Every batch is screened by independent labs, so purity and potency are never left to chance." },
    { icon: CheckmarkBadgeIcon, title: "24/7 Support", desc: "Our in-house research experts are available to guide you with any questions." },
    { icon: LaurelWreathIcon, title: "Our Promise to You", desc: "We stand behind every product, so you can buy with confidence." },
  ];

  const products = [
    { name: "GLP-3 RT (RETA)", tag: "Metabolic Research", price: "From $65.00", badge: "BEST SELLING!", image: "/images/cards/glp-3-rt.jpg" },
    { name: "Tesamorelin", tag: "Growth Hormone Research", price: "$85.00", compareAt: "$95.00", badge: "SALE!", image: "/images/cards/tesamorelin.jpg" },
    { name: "GLP-2 TZ", tag: "Metabolic Research", price: "From $60.00", badge: "BEST SELLING!", image: "/images/cards/glp-2-tz.jpg" },
    { name: "CJC-1295 + Ipamorelin", tag: "Research Blend", price: "From $75.00", compareAt: "$85.00", badge: "SALE!", image: "/images/cards/cjc-1295-ipamorelin.jpg" },
    { name: "MOTS-c", tag: "Cellular Energy Research", price: "From $65.00", badge: "BEST SELLING!", image: "/images/cards/mots-c.jpg" },
    { name: "Wolverine", tag: "Tissue Repair Blend", price: "From $70.00", image: "/images/cards/wolverine.jpg" },
    { name: "BPC-157", tag: "Tissue Repair Research", price: "$65.00", image: "/images/cards/bpc-157.jpg" },
    { name: "Adamax", tag: "Neuro Research", price: "$65.00", badge: "BEST SELLING!", image: "/images/cards/adamax.jpg" },
  ];

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-[#e9d5ff] selection:text-slate-900">
      <Header light />
      <main className="min-h-screen relative z-[1] overflow-hidden">




      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[124px] md:pt-4 lg:pt-6 pb-2 md:pb-4 lg:pb-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4 lg:gap-12 items-center">

        <div className="relative z-10 space-y-6 lg:max-w-2xl text-center lg:text-left">
          <h1 data-reveal style={revealDelay(0)} className="text-[34px] sm:text-5xl lg:text-5xl xl:text-6xl font-bold leading-tight text-center lg:text-left text-slate-800 max-md:-mt-2 md:mt-0">
            <span className="text-slate-800">Keep it</span>{" "}
            <span className="inline-block bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] bg-clip-text text-transparent">
              Simple.
            </span>
          </h1>
          <p data-reveal style={revealDelay(90)} className="text-sm lg:text-lg text-slate-600 max-w-md mx-auto lg:mx-0">
            High-purity molecular compounds manufactured for advanced research and innovation in certified USA laboratories.
          </p>
          <div data-reveal style={revealDelay(180)}>
            <Link to="/products" className="group inline-flex items-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-8 py-3 rounded-full font-bold transition-all duration-300 ease-in-out hover:scale-[1.02] shadow-[0_0_20px_rgba(196,181,253,0.7)]">
              <span className="transition-transform duration-300 ease-in-out">Shop Products</span>
              <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:w-5 group-hover:ml-2">
                <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
              </div>
            </Link>
          </div>

          <div data-reveal style={revealDelay(260)} className="flex flex-wrap justify-center lg:justify-start gap-1.5 lg:gap-4 text-[11px] lg:text-xs font-medium text-slate-700 pt-2">
            <div className="flex items-center gap-1 lg:gap-1.5 bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] rounded-full px-2.5 py-1 lg:px-4 lg:py-1.5">
              <TestTubeIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-violet-400" /> Lab-Tested & Documented
            </div>
            <div className="flex items-center gap-1 lg:gap-1.5 bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] rounded-full px-2.5 py-1 lg:px-4 lg:py-1.5">
              <CheckmarkBadgeIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-violet-400" /> 99% + Purity Guaranteed
            </div>
            <div className="flex items-center gap-1 lg:gap-1.5 bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] rounded-full px-2.5 py-1 lg:px-4 lg:py-1.5">
              <MapPin strokeWidth={1.5} className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-violet-400" /> Based in FL, USA
            </div>
          </div>
        </div>

        {/* Mobile-only vial floating up by the header — mirrors Peptora's mobile hero
            (one vial up top + two at the bottom). Hidden on lg where the 3-vial cluster is used. */}
        <div data-reveal="fade" style={revealDelay(200)} className="lg:hidden pointer-events-none absolute top-3 right-[12%] z-0 w-[22%] max-w-[96px] rotate-[10deg]">
          <img
            src={HERO_VIAL_CENTER}
            alt=""
            aria-hidden="true"
            className="w-full object-contain animate-vial-center"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Hero Image — Three Independently Floating Vials */}
        <div className="relative z-10 -mt-14 sm:mt-0 h-[200px] sm:h-[520px] lg:h-[600px] flex items-start sm:items-center justify-center overflow-visible">
          <div className="relative w-full h-full bg-transparent border-none overflow-visible scale-95 lg:scale-[1.3]">
            {/* Center vial — GLP-3 RT, tallest, back layer (desktop only; on mobile the
                GLP-3 vial floats up by the header instead, leaving two vials at the bottom) */}
            <div data-reveal style={revealDelay(220)} className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] w-[60%] z-10 bg-transparent border-none p-0 m-0">
              <img
                src={HERO_VIAL_CENTER}
                alt="Simpletide Selank + Semax research vial"
                className="w-full object-contain bg-transparent border-none animate-vial-center"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
            {/* Left vial — Adamax, tilted left, foreground */}
            <div data-reveal style={revealDelay(320)} className="absolute left-[-3%] lg:left-[-5%] top-1/2 -translate-y-[40%] w-[48%] lg:w-[50%] z-20 bg-transparent border-none p-0 m-0">
              <img
                src={HERO_VIAL_LEFT}
                alt="Simpletide BPC-157 research vial"
                className="w-full object-contain bg-transparent border-none animate-vial-left"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
            {/* Right vial — MOTS-c, tilted right, foreground. Extra clockwise tilt
                on mobile only (lg:rotate-0 keeps the desktop cluster unchanged)
                to mirror Peptora's dynamic diagonal vial. */}
            <div data-reveal style={revealDelay(400)} className="absolute right-[-3%] lg:right-[-5%] top-1/2 -translate-y-[40%] rotate-[16deg] lg:rotate-0 w-[48%] lg:w-[50%] z-20 bg-transparent border-none p-0 m-0">
              <img
                src={HERO_VIAL_RIGHT}
                alt="Simpletide Selank research vial"
                className="w-full object-contain bg-transparent border-none animate-vial-right"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>

      </section>

      {/* Feature Grid (Glassmorphism) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 md:pt-0 md:pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              data-card
              data-reveal
              style={revealDelay(idx * 70)}
              onPointerDown={(e) => {
                // Desktop (mouse): no click effect — glow is hover-only via CSS.
                // Touch/pen: sticky tap-glow that mirrors hover.
                if (e.pointerType !== "mouse") setActiveCard(`feature-${idx}`);
              }}
              className={`rounded-[12px] md:rounded-[20px] border p-3.5 md:py-5 md:px-6 transition-all duration-200 [-webkit-tap-highlight-color:transparent] text-center md:text-left ${
                activeCard === `feature-${idx}`
                  ? "bg-white/85 border-[#d8b4fe] shadow-[0_0_30px_rgba(216,180,254,0.45)] scale-[1.03]"
                  : "bg-white/60 backdrop-blur-md border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] hover:bg-white/85 hover:border-[#d8b4fe] hover:shadow-[0_0_30px_rgba(216,180,254,0.45)] hover:scale-[1.03]"
              }`}
            >
              <feature.icon className="w-7 h-7 text-violet-400 mb-3 mx-auto md:mx-0" />
              <h2 className="text-base font-semibold mb-1.5">{feature.title}</h2>
              <p className="text-[13px] text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="pt-8 md:pt-12 pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-sans mb-4">
              <span className="inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
                Featured Products
              </span>
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Explore our premium research peptides, each formulated for exceptional purity, consistency, and quality.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
          {products.map((product, idx) => {
            const id = `home-${product.name}`;
            const variants = HOME_VARIANTS[product.name];
            const selectedSize = variants ? (selectedSizes[id] ?? variants[0].size) : null;
            const selectedVariant = variants?.find((v) => v.size === selectedSize) ?? null;
            const isOpen = openVariantId === id;
            const slug = slugFor(product.name);
            const productSlug = slug ? seoProductSlug(slug) : null;
            return (
            <div
              key={idx}
              data-reveal
              style={revealDelay((idx % 4) * 80)}
              className="relative bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] rounded-2xl text-slate-800 group flex flex-col h-full hover:bg-white/80 transition-colors overflow-hidden"
            >
              {/* Product Image */}
              <div className="relative w-full aspect-[4/5] overflow-hidden rounded-t-xl">
                <img
                  src={product.image}
                  srcSet={(product as { srcSet?: string }).srcSet}
                  sizes={(product as { sizes?: string }).sizes}
                  alt={product.name}
                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                {productSlug && (
                  <Link to="/product/$slug" params={{ slug: productSlug }} className="absolute inset-0 z-0" aria-label={`View ${product.name}`} />
                )}
              </div>


              <div className="flex-grow px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col">
                <div className="flex flex-col gap-0.5 mb-1">
                  {(() => {
                    const slug = slugFor(product.name);
                    const productSlug = slug ? seoProductSlug(slug) : null;
                    const heading = (
                      <h3 className="font-bold text-[13px] sm:text-base text-slate-800 leading-snug">
                        {product.name}
                      </h3>
                    );
                    return productSlug ? (
                      <Link to="/product/$slug" params={{ slug: productSlug }} className="min-w-0">
                        {heading}
                      </Link>
                    ) : <div className="min-w-0">{heading}</div>;
                  })()}
                  <span className="font-bold text-[13px] sm:text-base text-slate-800 whitespace-nowrap">{product.price}</span>
                </div>
                <p className="text-[11px] tracking-wider text-slate-500 mb-2 sm:mb-2.5">{descriptorFor(product.name) ?? product.tag}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (variants) {
                      setOpenVariantId(isOpen ? null : id);
                    } else {
                      const cartName =
                        product.name === "GLOW"
                          ? "GLOW - 70mg"
                          : product.name === "KLOW"
                            ? "KLOW - 80mg"
                            : product.name;
                      const variant =
                        product.name === "GLOW" ? "70mg" : product.name === "KLOW" ? "80mg" : undefined;
                      addItem({
                        id: product.name === "KLOW" ? `${id}--80mg` : id,
                        name: cartName,
                        tag: product.tag,
                        price: parsePrice(product.price),
                        variant,
                      });
                      openCart();
                    }
                  }}
                  className="group/cart w-full mt-auto inline-flex items-center justify-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] py-2.5 sm:py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90 hover:shadow-[0_0_18px_rgba(196,181,253,0.7)]"
                >
                  <span>Add to cart</span>
                  <div className="w-0 overflow-hidden transition-all duration-200 ease-out group-hover/cart:ml-2 group-hover/cart:w-4">
                    <ArrowRight className="h-4 w-4 flex-shrink-0 -translate-x-2 opacity-0 transition-all duration-200 ease-out group-hover/cart:translate-x-0 group-hover/cart:opacity-100" />
                  </div>
                </button>
              </div>


              {/* Variant Popover — dark glass to match home backdrop */}
              {variants && (
                <div
                  ref={isOpen ? popoverRef : undefined}
                  className={`absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 rounded-b-2xl shadow-[0_-10px_30px_-15px_rgba(167,139,250,0.45)] p-5 transform transition-all duration-300 ease-out ${
                    isOpen
                      ? "translate-y-0 opacity-100 pointer-events-auto"
                      : "translate-y-full opacity-0 pointer-events-none"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Select Size</p>
                    <button
                      onClick={() => setOpenVariantId(null)}
                      className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                      aria-label="Close size selector"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  <div
                    className={`mb-4 grid w-full gap-2 ${
                      variants.length <= 1
                        ? "grid-cols-1"
                        : variants.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-2"
                    } max-sm:[&>button]:min-w-0 sm:flex sm:flex-wrap`}
                  >
                    {variants.map((v) => {
                      const active = selectedSize === v.size;
                      return (
                        <button
                          key={v.size}
                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setSelectedSizes((s) => ({ ...s, [id]: v.size })); }}
                          className={`flex w-full min-w-0 flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-xs font-semibold transition-all sm:min-w-[64px] sm:w-auto sm:px-3 sm:py-2 ${
                            active
                              ? "border-[#c4b5fd] bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)]"
                              : "border-slate-200 bg-white text-slate-800 hover:border-[#c4b5fd]"
                          }`}
                        >
                          <span className="leading-tight">{v.size}</span>
                          <span className={`mt-0.5 text-[10px] leading-tight ${active ? "text-white/90" : "text-slate-500"}`}>
                            ${v.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (!selectedVariant) return;
                      addItem({
                        id: `${id}--${selectedVariant.size}`,
                        name: `${product.name} - ${selectedVariant.size}`,
                        tag: product.tag,
                        price: selectedVariant.price,
                        variant: selectedVariant.size,
                      });
                      setOpenVariantId(null);
                      openCart();
                    }}
                    className="group/cart w-full inline-flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 leading-tight ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] py-2.5 sm:py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(196,181,253,0.7)]"
                  >
                    <span>Add to cart</span>
                    <span className="hidden sm:inline">—</span>
                    <span>${selectedVariant?.price.toFixed(2)}</span>
                  </button>
                </div>
              )}
            </div>
            );
          })}


        </div>

        <div className="mt-10 text-center">
          <Link
            to="/products"
            className="group inline-flex items-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-8 py-3 rounded-full font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(196,181,253,0.7)]"
          >
            <span className="transition-transform duration-300 ease-in-out">See all products</span>
            <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:w-5 group-hover:ml-2">
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
            </div>
          </Link>
        </div>
      </div>
      </section>

      <QualityTestsCarousel />

      {/* Explore — curated CTA banner with floating vials */}
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Floating vials around the banner */}
            <img
              src="/images/vials/simpletide_glp2_tz_10mg_transparent.webp"
              alt="Simpletide Tirzepatide research vial"
              className="pointer-events-none absolute z-20 w-[44px] md:w-[80px] lg:w-[104px] left-1 md:left-6 lg:left-12 bottom-1 top-auto md:bottom-auto md:top-2 lg:top-4 object-contain drop-shadow-2xl rotate-[10deg]"
              loading="lazy"
              decoding="async"
            />
            <img
              src="/images/vials/simpletide_nad_plus_500mg_transparent.webp"
              alt="Simpletide NAD+ research vial"
              className="pointer-events-none absolute z-20 w-[44px] md:w-[80px] lg:w-[104px] right-1 md:right-6 lg:right-12 top-1 md:top-2 lg:top-4 object-contain drop-shadow-2xl -rotate-[8deg]"
              loading="lazy"
              decoding="async"
            />
            <img
              src="/images/vials/simpletide_wolverine_10mg_transparent.webp"
              alt="Simpletide Wolverine research vial"
              className="pointer-events-none absolute z-20 w-[44px] md:w-[80px] lg:w-[104px] right-1 md:right-6 lg:right-12 bottom-1 md:bottom-2 lg:bottom-4 object-contain drop-shadow-2xl rotate-[8deg]"
              loading="lazy"
              decoding="async"
            />

            {/* Glass banner */}
            <div data-reveal className="relative z-10 bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] rounded-3xl px-6 sm:px-12 py-12 md:py-20 text-center">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight">
                <span className="text-slate-800">Browse Our Research-</span>
                <br className="md:hidden" />
                <span className="text-slate-800">Grade </span>
                <br className="hidden md:block" />
                <span className="inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
                  Peptide Catalog
                </span>
              </h2>
              <p className="text-slate-600 text-sm md:text-lg max-w-2xl mx-auto mt-5 leading-relaxed">
                A precision-selected range of high-purity compounds, designed for consistency, accuracy,{" "}
                <br className="md:hidden" />
                and laboratory research.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/products"
                  className="group inline-flex items-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-8 py-3 rounded-full font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(196,181,253,0.7)]"
                >
                  <span className="transition-transform duration-300 ease-in-out">See all products</span>
                  <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:w-5 group-hover:ml-2">
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSection className="pb-10 md:pb-14" showVials={false} variant="mist" />
      </main>
    </div>
  );
}
