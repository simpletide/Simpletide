import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";

import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialGlp3Rt from "@/assets/vial-glp3-rt.png.asset.json";
import vialNadPlus from "@/assets/vial-nad-plus.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";
import vialKlow from "@/assets/vial-klow.png.asset.json";
import vialTesa from "@/assets/vial-tesamorelin.png.asset.json";
import vialMots from "@/assets/vial-mots-c.png.asset.json";
import vialCjc from "@/assets/vial-cjc-ipa.png.asset.json";
import vialWolverine from "@/assets/vial-wolverine.png.asset.json";

const STORAGE_KEY = "simpletide-researcher-verified";

// Brand-blue gradient text, site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

// Decorative floating vials — zero-gravity drift (same feel as the About hero),
// but scattered in a deliberately irregular layout: each side has different
// heights, sizes and tilts so it never reads as neat mirrored pairs. A mix of
// compounds; sizes use clamp() so the scatter scales from laptops to 4K. The
// negative `delay` desyncs identical animations. Items in the center band sit
// only at the very top/bottom (above/below the card) and are hidden on smaller
// screens where the card fills the width.
type FloatVial = {
  src: string;
  className: string;
  anim: string;
  opacity: number;
  delay: string;
};

const FLOAT_VIALS: FloatVial[] = [
  // Left side — staggered heights
  { src: "/images/hero-vials/simpletide-selank-10mg.png", className: "top-[5%]  left-[9%]  w-[clamp(46px,6vw,118px)] rotate-[7deg] md:rotate-[-13deg]",            anim: "animate-vial-float-1", opacity: 0.68, delay: "0s" },
  { src: vialGhkCu.url,     className: "top-[22%] left-[3%]  w-[clamp(38px,5vw,86px)]  rotate-[24deg] hidden md:block",  anim: "animate-vial-left",    opacity: 0.5,  delay: "-1.5s" },
  { src: vialCjc.url,       className: "top-[30%] left-[21%] w-[clamp(30px,3.6vw,64px)] rotate-[-24deg] hidden lg:block", anim: "animate-vial-float-1", opacity: 0.42, delay: "-5s" },
  { src: vialGlp3Rt.url,    className: "top-[44%] left-[12%] w-[clamp(40px,5.5vw,92px)] rotate-[-7deg] hidden lg:block",  anim: "animate-vial-float-2", opacity: 0.55, delay: "-3s" },
  { src: vialTesa.url,      className: "bottom-[24%] left-[5%] w-[clamp(36px,4.5vw,80px)] rotate-[15deg] hidden md:block", anim: "animate-vial-float-3", opacity: 0.5,  delay: "-2s" },
  { src: vialCjc.url,       className: "bottom-[8%] left-[15%] w-[clamp(44px,6vw,108px)] rotate-[-19deg]",            anim: "animate-vial-center",  opacity: 0.66, delay: "-4s" },
  // Right side — different heights than the left
  { src: vialGlp3.url,      className: "top-[4%]  right-[12%] w-[clamp(46px,6vw,112px)] rotate-[-28deg]",            anim: "animate-vial-float-3", opacity: 0.7,  delay: "-1s" },
  { src: vialWolverine.url, className: "top-[18%] right-[4%]  w-[clamp(38px,5vw,84px)]  rotate-[12deg] hidden md:block",  anim: "animate-vial-right",   opacity: 0.52, delay: "-2.5s" },
  { src: vialMots.url,      className: "top-[37%] right-[9%]  w-[clamp(36px,4.5vw,78px)] rotate-[20deg] hidden lg:block", anim: "animate-vial-float-1", opacity: 0.48, delay: "-3.5s" },
  { src: vialKlow.url,      className: "bottom-[22%] right-[6%] w-[clamp(42px,5.5vw,100px)] rotate-[-9deg]",          anim: "animate-vial-left",    opacity: 0.6,  delay: "-1s" },
  { src: vialNadPlus.url,   className: "bottom-[6%] right-[12%] md:right-[16%] w-[clamp(54px,5.5vw,96px)] rotate-[23deg]",          anim: "animate-vial-float-2", opacity: 0.62, delay: "-4.5s" },
  // Center band — only at the extreme top/bottom, large screens only
  { src: "/images/hero-vials/simpletide-bpc157-10mg.png", className: "top-[3%]  left-[47%] w-[clamp(34px,4vw,74px)]  rotate-[8deg] hidden lg:block",   anim: "animate-vial-float-3", opacity: 0.5,  delay: "-2s" },
  { src: vialGhkCu.url,     className: "bottom-[4%] left-[41%] w-[clamp(32px,3.8vw,68px)] rotate-[-14deg] hidden lg:block", anim: "animate-vial-center",  opacity: 0.45, delay: "-3s" },
  // Mobile-only (md:hidden) — a single distant vial top-center and bottom-center.
  // Kept small + low opacity so they read as far away.
  { src: "/images/hero-vials/simpletide-bpc157-10mg.png", className: "top-[6%]    left-1/2 -translate-x-1/2 w-[clamp(26px,7vw,42px)]  rotate-[6deg] md:hidden",  anim: "animate-vial-float-3", opacity: 0.35, delay: "-2s" },
  { src: vialMots.url,      className: "bottom-[7%] left-1/2 -translate-x-1/2 w-[clamp(24px,6.5vw,38px)] rotate-[-8deg] md:hidden", anim: "animate-vial-float-1", opacity: 0.32, delay: "-3.5s" },
];

function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all duration-200 [-webkit-tap-highlight-color:transparent] ${
        checked
          ? "border-[#a78bfa] shadow-[0_0_0_1px_rgba(167,139,250,0.35),0_4px_16px_rgba(167,139,250,0.12)]"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
          checked
            ? "border-[#a78bfa] bg-[#a78bfa] text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-[13.5px] leading-snug text-slate-700">{children}</span>
    </button>
  );
}

export function ResearcherGate() {
  // SSR-safe: default to verified (hidden) so the server markup and first client
  // render match, then reveal the gate after we can read localStorage.
  const [verified, setVerified] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [age, setAge] = useState(false);
  const [researcher, setResearcher] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = localStorage.getItem(STORAGE_KEY) === "true";
    setVerified(ok);
    if (!ok) requestAnimationFrame(() => setMounted(true));
  }, []);

  // Lock body scroll while the gate is up.
  useEffect(() => {
    if (verified) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [verified]);

  if (verified) return null;

  const canEnter = age && researcher;

  const handleEnter = () => {
    if (!canEnter) return;
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "true");
    setMounted(false);
    setTimeout(() => setVerified(true), 400);
  };

  const handleExit = () => {
    if (typeof window !== "undefined") window.location.href = "https://www.google.com";
  };

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-y-auto transition-opacity duration-[400ms] ease-out ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Researcher verification"
      style={{ background: "linear-gradient(180deg, rgb(221,214,254) 11%, rgb(237,233,254) 100%)" }}
    >
      {/* Floating decorative vials — scattered, irregular zero-gravity drift */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {FLOAT_VIALS.map((v, i) => (
          <div key={i} className={`absolute ${v.className}`} style={{ opacity: v.opacity }}>
            <img
              src={v.src}
              alt=""
              className={`w-full object-contain ${v.anim}`}
              style={{ animationDelay: v.delay }}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Centered content */}
      <div className="relative z-[1] flex min-h-full flex-col items-center justify-center px-5 py-10">
        {/* Brand wordmark above the card */}
        <div className="mb-5 text-center">
          <span
            className="text-2xl sm:text-3xl font-light tracking-[0.3em] text-[#344a7c]"
            style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          >
            SIMPLETIDE
          </span>
        </div>

        {/* Verification card */}
        <div className="w-full max-w-[480px] rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(16,42,100,0.30)] backdrop-blur-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
            Researcher <span className={GRADIENT_TEXT}>Verification</span>
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-slate-500">
            Simpletide sells research peptides exclusively to qualified researchers and
            laboratories for in vitro and laboratory use. Please confirm before continuing.
          </p>

          <div className="mt-6 space-y-3">
            <CheckRow checked={age} onToggle={() => setAge((v) => !v)}>
              I am at least <span className="font-semibold text-slate-900">21 years of age</span>.
            </CheckRow>
            <CheckRow checked={researcher} onToggle={() => setResearcher((v) => !v)}>
              I confirm I am a{" "}
              <span className="font-semibold text-slate-900">qualified researcher</span> purchasing
              for{" "}
              <span className="font-semibold text-slate-900">in vitro / laboratory research</span>{" "}
              only — not for human or veterinary use.
            </CheckRow>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            disabled={!canEnter}
            className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-all duration-300 ${
              canEnter
                ? "bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white shadow-[0_10px_30px_-8px_rgba(167,139,250,0.55)] hover:shadow-[0_14px_36px_-8px_rgba(167,139,250,0.7)]"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            Enter Simpletide
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-300 ${
                canEnter ? "group-hover:translate-x-1" : ""
              }`}
            />
          </button>

          <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
            By proceeding you affirm the statements above are true. Products are not for human or
            veterinary use, not for use in diagnostic procedures, and have not been evaluated by the
            U.S. Food and Drug Administration.{" "}
            <Link
              to="/terms-of-service"
              className="font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              Full disclaimer.
            </Link>
          </p>
        </div>

        {/* Exit */}
        <button
          type="button"
          onClick={handleExit}
          className="mt-6 text-[13px] text-slate-500 transition-colors hover:text-slate-700"
        >
          Not a researcher?{" "}
          <span className="font-semibold text-[#8b5cf6]">Exit</span>
        </button>
      </div>
    </div>
  );
}
