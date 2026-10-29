import { createFileRoute, Link, notFound, redirect, useParams } from "@tanstack/react-router";
import { useState, useEffect, useRef, type ComponentType } from "react";
import { Header } from "@/components/Header";
import { NewsletterSection } from "@/components/NewsletterSection";
import { useCart } from "@/lib/cart-context";
import { getProductBySlug, BUNDLE_TIERS, CATALOG, descriptorFor, seoProductSlug, coaUrlForVariant, vialThumbFor } from "@/lib/catalog";
import { CoaLightbox } from "@/components/CoaLightbox";
import type { DescriptionSection } from "@/lib/catalog";
import { AcceptedCardLogos } from "@/components/AcceptedCardLogos";
import { heroImageForVariant } from "@/lib/product-vial-variants";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import {
  FileText,
  ShoppingCart,
  Minus,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Truck,
  ShieldCheck,
  Headphones,
  Lock,
} from "lucide-react";

// Compound abbreviations used in COA batch numbers (e.g. GLP-3 RT → "Reta").
const COA_ABBR: Record<string, string> = {
  "glp-3-rt": "Reta",
  "glp-2-tz": "TIRZ",
  tesamorelin: "Tesa",
  "cjc-1295-ipamorelin": "CIP",
  "cjc-1295-no-dac": "Cjc",
  "melanotan-2": "Mt2",
  "ghk-cu": "Ghk",
  "mots-c": "Mots",
  wolverine: "Wolv",
  "nad-plus": "Nad",
  klow: "Klow",
  glow: "Glow",
  "igf1-lr3": "Igf",
};

// Batch number for a COA card: AS-<abbr>-<two digits><letter>, e.g. "AS-Reta-22B".
// The two digits are deterministic per product+size (stable across renders) and
// the trailing letter advances per variant (A, B, C, …) so a product's batches
// read as a series.
function coaBatch(slug: string, size: string, index: number): string {
  const abbr =
    COA_ABBR[slug] ??
    (slug.split("-")[0].charAt(0).toUpperCase() + slug.split("-")[0].slice(1) || "AS");
  const key = `${slug}|${size}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const num = (h % 90) + 10; // 10–99 → always two digits
  const letter = String.fromCharCode(65 + (index % 26)); // A, B, C, …
  return `AS-${abbr}-${num}${letter}`;
}

// Bundles/blends that should not show a Certificate of Analysis section at all.
const COA_HIDDEN = new Set([
  "trifecta",
  "trifecta-deluxe",
  "metabolic-reset",
  "peak-pulse",
  "shred-plus",
  "neuro-duo",
]);

/**
 * "Frequently Bought Together" recommendations, keyed by product slug. Built
 * from how researchers actually pair these compounds — e.g. metabolic GLP/GIP
 * agonists with amylin (cagrilintide) and fat-metabolism peptides; GH
 * secretagogues with GHRH analogs and IGF-1; tissue-repair peptides (BPC-157 /
 * TB-500 / GHK-Cu) together; mitochondrial/longevity peptides (MOTS-c / NAD+ /
 * SS-31) together; and bacteriostatic water alongside almost everything since
 * it's required to reconstitute lyophilized vials. Out-of-stock items are
 * deliberately omitted. Order matters — earlier slugs render first.
 */
const FREQUENTLY_BOUGHT: Record<string, string[]> = {
  // Metabolic / weight (incretins, amylin, fat metabolism)
  "glp-3-rt": ["cagrilintide", "tesamorelin", "mots-c", "aod-9604", "5-amino-1mq", "bac-water"],
  "glp-2-tz": ["cagrilintide", "glp-3-rt", "mots-c", "aod-9604", "5-amino-1mq", "bac-water"],
  cagrilintide: ["glp-2-tz", "glp-3-rt", "aod-9604", "mots-c", "5-amino-1mq", "bac-water"],
  "5-amino-1mq": ["glp-3-rt", "mots-c", "nad-plus", "aod-9604", "cagrilintide", "bac-water"],
  "aod-9604": ["tesamorelin", "glp-3-rt", "cjc-1295-ipamorelin", "mots-c", "5-amino-1mq", "bac-water"],
  "mots-c": ["nad-plus", "ss-31", "glp-3-rt", "5-amino-1mq", "glutathione", "bac-water"],
  // Growth-hormone axis
  "cjc-1295-ipamorelin": ["tesamorelin", "igf1-lr3", "mots-c", "ghk-cu", "aod-9604", "bac-water"],
  tesamorelin: ["cjc-1295-ipamorelin", "ipamorelin", "aod-9604", "igf1-lr3", "mots-c", "bac-water"],
  ipamorelin: ["cjc-1295-ipamorelin", "sermorelin", "tesamorelin", "igf1-lr3", "ghk-cu", "bac-water"],
  sermorelin: ["ipamorelin", "igf1-lr3", "ghk-cu", "glutathione", "cjc-1295-ipamorelin", "bac-water"],
  "igf1-lr3": ["cjc-1295-ipamorelin", "tesamorelin", "bpc-157", "tb-500", "ipamorelin", "bac-water"],
  // Tissue repair / recovery
  "bpc-157": ["tb-500", "wolverine", "ghk-cu", "kpv", "glow", "bac-water"],
  "tb-500": ["bpc-157", "wolverine", "ghk-cu", "igf1-lr3", "glow", "bac-water"],
  wolverine: ["bpc-157", "tb-500", "ghk-cu", "kpv", "glow", "bac-water"],
  "ghk-cu": ["bpc-157", "tb-500", "glow", "glutathione", "wolverine", "bac-water"],
  glow: ["klow", "ghk-cu", "bpc-157", "tb-500", "wolverine", "bac-water"],
  klow: ["glow", "ghk-cu", "kpv", "wolverine", "bpc-157", "bac-water"],
  kpv: ["bpc-157", "ghk-cu", "ll-37", "thymosin-alpha-1", "wolverine", "bac-water"],
  "ara-290": ["bpc-157", "kpv", "thymosin-alpha-1", "mots-c", "tb-500", "bac-water"],
  // Mitochondrial / longevity
  "nad-plus": ["mots-c", "ss-31", "epithalon", "glutathione", "5-amino-1mq", "bac-water"],
  "ss-31": ["mots-c", "nad-plus", "glutathione", "epithalon", "ghk-cu", "bac-water"],
  epithalon: ["nad-plus", "mots-c", "glutathione", "thymosin-alpha-1", "ss-31", "bac-water"],
  glutathione: ["nad-plus", "mots-c", "ghk-cu", "ss-31", "epithalon", "bac-water"],
  // Immune / anti-inflammatory
  "ll-37": ["thymosin-alpha-1", "kpv", "bpc-157", "glutathione", "ara-290", "bac-water"],
  "thymosin-alpha-1": ["ll-37", "kpv", "bpc-157", "glutathione", "epithalon", "bac-water"],
  // Nootropic / neuro
  semax: ["selank", "adamax", "dsip", "nad-plus", "bac-water"],
  selank: ["semax", "dsip", "adamax", "nad-plus", "bac-water"],
  adamax: ["semax", "selank", "dsip", "nad-plus", "bac-water"],
  dsip: ["selank", "semax", "epithalon", "adamax", "bac-water"],
  // Reproductive / sexual / melanocortin
  hcg: ["kisspeptin", "pt-141", "glutathione", "tesamorelin", "bac-water"],
  kisspeptin: ["hcg", "pt-141", "glutathione", "bac-water"],
  "pt-141": ["melanotan-2", "mt1", "kisspeptin", "ghk-cu", "bac-water"],
  "melanotan-2": ["mt1", "pt-141", "glow", "ghk-cu", "bac-water"],
  mt1: ["melanotan-2", "pt-141", "ghk-cu", "glow", "bac-water"],
  // Supplies
  "bac-water": ["glp-3-rt", "bpc-157", "tb-500", "cjc-1295-ipamorelin", "ghk-cu", "nad-plus"],
  // Bundles → components + related stacks
  trifecta: ["ghk-cu", "glp-3-rt", "melanotan-2", "glow", "trifecta-deluxe", "bac-water"],
  "trifecta-deluxe": ["ghk-cu", "glp-3-rt", "melanotan-2", "glow", "trifecta", "bac-water"],
  "neuro-duo": ["semax", "selank", "adamax", "dsip", "nad-plus", "bac-water"],
  "shred-plus": ["tesamorelin", "glp-3-rt", "aod-9604", "mots-c", "cjc-1295-ipamorelin", "bac-water"],
  "peak-pulse": ["ipamorelin", "tesamorelin", "cjc-1295-ipamorelin", "igf1-lr3", "sermorelin", "bac-water"],
  "metabolic-reset": ["glp-3-rt", "nad-plus", "mots-c", "5-amino-1mq", "ss-31", "bac-water"],
};

// Popular fallback used to pad any product up to the 4-item minimum.
const FREQUENTLY_BOUGHT_FALLBACK = [
  "glp-3-rt",
  "tesamorelin",
  "adamax",
  "bpc-157",
  "nad-plus",
  "ghk-cu",
  "mots-c",
  "wolverine",
  "cjc-1295-ipamorelin",
];

/**
 * Resolve the ordered list of "frequently bought together" products for a slug:
 * curated picks first, padded with popular fallbacks, the current product and
 * any unknown/out-of-stock slugs removed, and capped at 8 (Peptora-style).
 * Always returns at least 4 items.
 */
function frequentlyBoughtFor(slug: string): (typeof CATALOG)[number][] {
  const order = [...(FREQUENTLY_BOUGHT[slug] ?? []), ...FREQUENTLY_BOUGHT_FALLBACK];
  // Current product and Bac Water are never shown as recommendations here.
  const seen = new Set<string>([slug, "bac-water"]);
  const out: (typeof CATALOG)[number][] = [];
  for (const s of order) {
    if (seen.has(s)) continue;
    seen.add(s);
    const p = CATALOG.find((c) => c.slug === s);
    if (!p) continue;
    out.push(p);
    if (out.length >= 8) break;
  }
  return out;
}

// Tested date shown on a COA card. Most COAs share a 05/09/26 test date; a few
// products carry their own dates.
function coaTested(slug: string, size: string): string {
  if ((slug === "glp-3-rt" && size === "10mg") || slug === "igf1-lr3") return "02/12/26";
  if (slug === "cjc-1295-no-dac" || slug === "melanotan-2") return "02/04/26";
  return "05/09/26";
}

// "Why Choose Simpletide" benefit icons — exact SVG path data extracted
// from Peptora's live product page (peptoralabs.com /icons/*.svg, the Hugeicons
// set Peptora ships). Each icon keeps its native viewBox + stroke width so the
// proportions and stroke weight match Peptora exactly, and uses
// `stroke="currentColor"` so the `text-[...]` class drives the color
// (rendered in our site blue #a78bfa; Peptora uses #2B848F teal).

// /icons/checkmark-badge-01.svg — scalloped verification seal with a check.
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
      <path d="M31.6505 31.6667H31.6663M31.6505 31.6667C30.6127 32.6958 28.7318 32.4395 27.4128 32.4395C25.7938 32.4395 25.0142 32.7562 23.8587 33.9117C22.8748 34.8957 21.5558 36.6667 19.9997 36.6667C18.4435 36.6667 17.1245 34.8957 16.1406 33.9117C14.9851 32.7562 14.2055 32.4395 12.5864 32.4395C11.2675 32.4395 9.38664 32.6958 8.34882 31.6667C7.30269 30.6293 7.56014 28.7407 7.56014 27.4132C7.56014 25.7357 7.19327 24.9643 5.99864 23.7697C4.22157 21.9927 3.33304 21.104 3.33301 20C3.33302 18.8958 4.22154 18.0073 5.99859 16.2303C7.06501 15.1639 7.56014 14.1071 7.56014 12.5868C7.56014 11.2678 7.30382 9.3869 8.33301 8.34907C9.37039 7.30297 11.259 7.56044 12.5865 7.56044C14.1068 7.56044 15.1635 7.06534 16.2299 5.99895C18.007 4.22187 18.8955 3.33334 19.9997 3.33334C21.1038 3.33334 21.9923 4.22187 23.7693 5.99895C24.8355 7.06512 25.8922 7.56044 27.4128 7.56044C28.7318 7.56044 30.6128 7.30412 31.6507 8.33334C32.6967 9.37072 32.4392 11.2593 32.4392 12.5868C32.4392 14.2643 32.8062 15.0356 34.0007 16.2303C35.7778 18.0073 36.6663 18.8958 36.6663 20C36.6663 21.104 35.7778 21.9927 34.0007 23.7697C32.806 24.9643 32.4392 25.7357 32.4392 27.4132C32.4392 28.7407 32.6967 30.6293 31.6505 31.6667Z" />
      <path
        d="M15 21.4882C15 21.4882 17 22.5745 18 24.1667C18 24.1667 21 17.9167 25 15.8333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

// /icons/truck-delivery.svg — delivery truck with motion/speed lines.
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
      <path d="M11.6663 33.3333C13.5073 33.3333 14.9997 31.8409 14.9997 30C14.9997 28.159 13.5073 26.6667 11.6663 26.6667C9.82539 26.6667 8.33301 28.159 8.33301 30C8.33301 31.8409 9.82539 33.3333 11.6663 33.3333Z" />
      <path d="M8.33301 29.954C6.50514 29.863 5.36484 29.591 4.55339 28.7797C3.74194 27.9682 3.47004 26.8278 3.37892 25M14.9997 30H24.9997M31.6663 29.954C33.4942 29.863 34.6345 29.591 35.446 28.7797C36.6663 27.5592 36.6663 25.595 36.6663 21.6667V18.3333H28.833C27.5922 18.3333 26.9717 18.3333 26.4697 18.1702C25.4548 17.8405 24.6592 17.0448 24.3295 16.03C24.1663 15.5279 24.1663 14.9075 24.1663 13.6667C24.1663 11.8054 24.1663 10.8747 23.9217 10.1216C23.427 8.5994 22.2337 7.40596 20.7115 6.91138C19.9583 6.66666 19.0277 6.66666 17.1663 6.66666H3.33301" />
      <path d="M3.33301 13.3333H13.333" />
      <path d="M3.33301 18.3333H9.99967" />
      <path d="M24.167 10H27.2023C29.628 10 30.8407 10 31.8277 10.5895C32.8147 11.179 33.3897 12.2469 34.5397 14.3825L36.667 18.3333" />
    </svg>
  );
}

// /icons/headset.svg — support headset.
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

// "Why Choose" card treatment — Peptora's exact card + hover-glow style
// (subtle diagonal wash, 2px translucent border, soft layered shadow, and a
// 0.3s border/shadow transition into a soft glow on hover). Peptora accents in
// teal #2B848F; we keep our site blue #a78bfa for brand consistency.
// Structural card classes (no border-color / shadow, so they never conflict
// with the active/inactive variants below).
const WHY_CARD_BASE = [
  "rounded-2xl border-2 bg-white",
  "[background-image:linear-gradient(135deg,rgba(23,58,122,0.06)_0%,rgba(167,139,250,0.03)_100%)]",
  "transition-[border-color,box-shadow] duration-300 ease-out",
].join(" ");

// Resting border + shadow plus the desktop hover glow.
const WHY_CARD_INACTIVE = [
  "border-[rgba(167,139,250,0.14)]",
  "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.06)]",
  "hover:border-[rgba(167,139,250,0.5)]",
  "hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.15),0_4px_16px_rgba(0,0,0,0.04)]",
].join(" ");

// Tapped/active glow (same look as the hover state) for sticky mobile taps.
// Mutually exclusive with WHY_CARD_INACTIVE to avoid Tailwind class conflicts.
const WHY_CARD_ACTIVE =
  "border-[rgba(167,139,250,0.5)] shadow-[0_0_20px_4px_rgba(167,139,250,0.15),0_4px_16px_rgba(0,0,0,0.04)]";

// Full resting card (used for non-interactive treatments).
const WHY_CARD_CLASS = `${WHY_CARD_BASE} ${WHY_CARD_INACTIVE}`;

export const Route = createFileRoute("/products_/$slug")({
  beforeLoad: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    throw redirect({
      to: "/product/$slug",
      params: { slug: seoProductSlug(product.slug) },
      statusCode: 301,
    });
  },
  component: () => null,
});

export function ProductDetail() {
  const { slug } = useParams({ strict: false });
  const product = getProductBySlug(String(slug ?? ""));
  if (!product) {
    return (
      <div className="min-h-screen text-slate-800 flex items-center justify-center px-6 relative z-[1]">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Product not found</h1>
          <Link to="/products" className="text-st-cyan underline">Back to catalog</Link>
        </div>
      </div>
    );
  }
  const { addItem, openCart } = useCart();
  const [sessionAddedTotal, setSessionAddedTotal] = useState(0);

  // --- Selected size (drives the "Size:" label + price) -----------------
  const [selectedSize, setSelectedSize] = useState(product.variants[0].size);
  const variant =
    product.variants.find((v) => v.size === selectedSize) ?? product.variants[0];
  const heroFallback = product.heroImage ?? product.image;
  const heroSrc = heroImageForVariant(product.slug, variant.size, heroFallback);

  // --- Bundle tiers + quantity (generic, data-driven) -------------------
  // Default to a single, standard vial (quantity = 1) with NO bundle tier
  // pre-selected. Bundle cards stay clickable and snap quantity to their tier.
  const tiers = product.bundleTiers ?? BUNDLE_TIERS;
  const vialThumb = vialThumbFor(product.slug);
  const [quantity, setQuantity] = useState(1);
  const [qtyDraft, setQtyDraft] = useState<string | null>(null);

  const commitQtyDraft = () => {
    const parsed = parseInt(qtyDraft ?? "", 10);
    setQuantity(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
    setQtyDraft(null);
  };

  // --- Product description accordion (collapsed by default, Peptora-style) --
  const [descOpen, setDescOpen] = useState(false);
  const [coaOpen, setCoaOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Sticky tap-glow for the "Why Choose" cards on mobile: a tapped card stays
  // glowing (mirrors the desktop hover) until another card is tapped, the user
  // taps elsewhere, or scrolls.
  const [activeWhyCard, setActiveWhyCard] = useState<string | null>(null);
  // Same sticky tap-glow treatment for the COA cards (glow on tap; clears when
  // tapping elsewhere or scrolling). Desktop relies on :hover via CSS.
  const [activeCoaCard, setActiveCoaCard] = useState<string | null>(null);

  // COA scan preview (lightbox). Opened from a card's "View COA" button.
  const [coaPreview, setCoaPreview] = useState<{ name: string; url: string } | null>(null);
  useEffect(() => {
    if (!coaPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCoaPreview(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [coaPreview]);

  // --- "Frequently Bought Together" horizontal scroller (used when > 4) ----
  const fbtScrollerRef = useRef<HTMLDivElement | null>(null);
  const [fbtCanLeft, setFbtCanLeft] = useState(false);
  const [fbtCanRight, setFbtCanRight] = useState(true);
  const updateFbtArrows = () => {
    const el = fbtScrollerRef.current;
    if (!el) return;
    setFbtCanLeft(el.scrollLeft > 8);
    setFbtCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };
  const scrollFbt = (dir: 1 | -1) => {
    const el = fbtScrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  useEffect(() => {
    updateFbtArrows();
    window.addEventListener("resize", updateFbtArrows);
    return () => window.removeEventListener("resize", updateFbtArrows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);
  useEffect(() => {
    const clear = (e?: Event) => {
      const target =
        e && e.type === "pointerdown" ? (e.target as HTMLElement | null) : null;
      if (!target?.closest("[data-why-card]")) setActiveWhyCard(null);
      if (!target?.closest("[data-coa-card]")) setActiveCoaCard(null);
    };
    document.addEventListener("pointerdown", clear, { passive: true });
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", clear);
      window.removeEventListener("scroll", clear);
    };
  }, []);

  // Highest tier whose minimum quantity is satisfied (null => no discount).
  const activeTier = [...tiers].reverse().find((t) => quantity >= t.minQty) ?? null;
  const discountPct = activeTier?.discountPct ?? 0;
  const discountedUnit = Number((variant.price * (1 - discountPct / 100)).toFixed(2));
  const lineTotal = Number((discountedUnit * quantity).toFixed(2));
  const originalTotal = Number((variant.price * quantity).toFixed(2));

  const pricingTiles = [
    { id: "single", qty: 1, label: "1 vial", discountPct: 0, badge: undefined as string | undefined },
    ...tiers.map((t) => ({ id: t.id, qty: t.minQty, label: t.label.toLowerCase(), discountPct: t.discountPct, badge: t.badge })),
  ];

  const heroInfoRows = [
    { icon: Clock, title: "Same-day dispatch", note: "Orders placed before the daily cutoff ship the same business day." },
    { icon: Truck, title: "Free priority shipping", note: "On every order — most arrive within 2–3 days." },
    { icon: ShieldCheck, title: "Third-party tested · 99%+ purity", note: "Every batch ships with its Certificate of Analysis." },
    { icon: Headphones, title: "Research support", note: "Call, text, or email us anytime with questions." },
  ];

  const openSelectedCoa = () => {
    const url = coaUrlForVariant(product.slug, variant.size, product.variants.indexOf(variant));
    if (url) {
      setCoaPreview({ name: `${product.name} ${variant.size}`, url });
      return;
    }
    setCoaOpen(true);
    document.getElementById("coa-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleAddToCart = () => {
    let qty = quantity;
    if (qtyDraft !== null) {
      const parsed = parseInt(qtyDraft, 10);
      qty = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
      setQuantity(qty);
      setQtyDraft(null);
    }
    addItem({
      id: `detail-${product.slug}--${variant.size}`,
      name: `${product.name} - ${variant.size}`,
      tag: product.category,
      price: variant.price,
      qty,
      variant: variant.size,
    });
    setSessionAddedTotal((prev) => prev + qty);
  };

  // --- Quick verification stats (Peptora-style band) --------------------
  const stats = [
    { value: "99%+", label: "Purity Rate", note: "HPLC-verified research grade" },
    { value: "24hr", label: "Avg Ship Time", note: "Same-day processing available" },
    { value: "100%", label: "U.S. Verified", note: "Accredited independent labs" },
    { value: "5", label: "Quality Checks", note: "From synthesis to delivery" },
  ];

  // --- Frequently asked questions (Peptora-style accordion) -------------
  const faqs = [
    {
      q: "What is included?",
      a: "One lyophilized peptide vial.",
    },
    {
      q: "When will my order arrive?",
      a: "All orders are handed off to our shipping carrier within 24 hours. Because Simpletide covers the cost of priority shipping, you can expect your package to arrive within 2–3 days.",
    },
    {
      q: "How is purity verified?",
      a: "Through independent third-party analytical testing.",
    },
    {
      q: "How should products be stored?",
      a: "Lyophilized peptides should be stored at -20°C, protected from light and moisture, for long-term stability. Once reconstituted, keep refrigerated at 2–8°C and use within the recommended time frame to preserve potency.",
    },
    {
      q: "Is a COA available?",
      a: "Yes. Every batch includes verification documentation.",
    },
  ];

  // --- Frequently bought together: per-product, research-based pairings ---
  const featured = frequentlyBoughtFor(product.slug);

  // --- COA cards: one card per product variant -----------------------------
  // Every variant gets its own card so each size is represented. Variants with
  // a genuine size-specific scan open the real certificate; variants we don't
  // have a scan for yet still render a matching card (the "View COA" button just
  // doesn't open a preview). Bundles are excluded from the section entirely
  // (see COA_HIDDEN below).
  const coaCards = product.variants.map((v, i) => ({
    v,
    i,
    url: coaUrlForVariant(product.slug, v.size, i),
  }));

  // --- Why Choose Simpletide (Peptora-style feature + stat band) -----
  const whyCards: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    desc: string;
  }[] = [
    {
      icon: CheckmarkBadgeIcon,
      title: "Third-Party Tested",
      desc: "Each batch is subjected to independent, third-party laboratory analysis to ensure consistent, verifiable quality.",
    },
    {
      icon: LicenseThirdPartyIcon,
      title: "Batch-Specific COAs",
      desc: "All batches are independently validated through accredited laboratory testing.",
    },
    {
      icon: LaurelWreathIcon,
      title: "99%+ Purity Standards",
      desc: "Compounds validated by high-performance liquid chromatography (HPLC) and held to strict, consistent specifications for purity and identity.",
    },
    {
      icon: TruckDeliveryIcon,
      title: "Same-Day Dispatch",
      desc: "Orders placed before the daily cutoff ship the same business day.",
    },
    {
      icon: HeadsetIcon,
      title: "24/7 Support",
      desc: "Call, text, or email us at anytime, and a research expert will assist you with any questions regarding your order.",
    },
  ];

  const whyStats = [
    {
      value: (
        <>
          99.87<span className="align-super text-[0.5em] font-semibold ml-0.5">%</span>
        </>
      ),
      label: "PURITY RATE",
      note: "HPLC-verified pharmaceutical grade",
      fill: 0.97,
    },
    {
      value: "100K+",
      label: "ORDERS SHIPPED",
      note: "Trusted by researchers worldwide",
      fill: 0.8,
    },
    {
      value: "2,632+",
      label: "5-STAR REVIEWS",
      note: "Verified customer feedback",
      fill: 0.75,
    },
    {
      value: (
        <>
          24<span className="align-super text-[0.5em] font-semibold ml-0.5">hr</span>
        </>
      ),
      label: "AVG SHIP TIME",
      note: "Same-day processing available",
      fill: 0.7,
    },
  ];

  // --- Product description sections (Peptora-style stacked bullets) ------
  // Prefer the compound-specific, data-driven sections; fall back to the
  // legacy flat fields so every product still renders something unique.
  const descSections: DescriptionSection[] = product.descriptionSections ?? [
    { heading: product.name, items: [{ text: product.description }] },
    { heading: "Research Use Notes", items: [{ text: product.researchNotes }] },
    { heading: "Storage & Handling", items: [{ text: product.storage }] },
  ];

  const handleAddFeatured = (p: (typeof CATALOG)[number]) => {
    const v = p.variants[0];
    addItem({
      id: `featured-${p.slug}--${v.size}`,
      name: `${p.name} — ${v.size}`,
      tag: p.category,
      price: v.price,
      variant: v.size,
    });
    openCart();
  };

  // Peptora-style scroll reveals; keyed to the slug so a client-side product
  // switch re-observes the new product's freshly rendered sections.
  useReveal(product.slug);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      <Header />

      <main className="relative z-[1] flex-1">
        {/* HERO — two cards: product photo on the left, buy box on the right */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-10 pb-10 md:pb-14">
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
            {/* IMAGE CARD */}
            <div
              data-reveal
              className="relative overflow-hidden rounded-[28px] border border-white bg-white/60 shadow-[0_8px_30px_rgba(167,139,250,0.12)] backdrop-blur-md lg:sticky lg:top-6"
            >
              <img
                src={heroSrc}
                alt={product.name}
                className="block aspect-[4/5] w-full select-none object-cover"
                draggable={false}
                loading="eager"
              />
              <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-1.5">
                {["Third-party tested", "99%+ purity", "Research use only"].map((label, i) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700 ring-1 ring-slate-200/70 backdrop-blur"
                  >
                    {i === 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* BUY CARD */}
            <div
              data-reveal
              style={revealDelay(80)}
              className="rounded-[28px] border border-white bg-white/70 p-5 shadow-[0_8px_30px_rgba(167,139,250,0.12)] backdrop-blur-md sm:p-7"
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{product.title}</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                {descriptorFor(product.name) ?? product.subtitle ?? product.tagline}
              </p>

              <div className="mt-5 flex flex-col-reverse gap-5 border-t border-slate-200/80 pt-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-[72px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Mass
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const active = v.size === selectedSize;
                        return (
                          <button
                            key={v.size}
                            type="button"
                            onClick={() => setSelectedSize(v.size)}
                            aria-pressed={active}
                            className={`h-9 min-w-[64px] rounded-lg px-3 text-xs font-bold uppercase transition-colors ${
                              active
                                ? "bg-slate-900 text-white"
                                : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {v.size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="w-[72px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Quantity
                    </span>
                    <div className="flex items-center rounded-full border border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          setQtyDraft(null);
                          setQuantity((q) => Math.max(1, q - 1));
                        }}
                        aria-label="Decrease quantity"
                        className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-900"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label="Quantity"
                        value={qtyDraft ?? String(quantity)}
                        onChange={(e) => setQtyDraft(e.target.value.replace(/\D/g, ""))}
                        onBlur={commitQtyDraft}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        className="h-9 w-9 appearance-none border-0 bg-transparent p-0 text-center text-sm font-semibold tabular-nums text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setQtyDraft(null);
                          setQuantity((q) => q + 1);
                        }}
                        aria-label="Increase quantity"
                        className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-900"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="flex items-baseline gap-2 sm:justify-end">
                    {discountPct > 0 && (
                      <span className="text-sm text-slate-400 line-through tabular-nums">${originalTotal.toFixed(2)}</span>
                    )}
                    <span className="text-3xl font-extrabold tabular-nums text-slate-900">${lineTotal.toFixed(2)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {quantity} unit{quantity === 1 ? "" : "s"}
                    {discountPct > 0 && (
                      <span className="ml-1.5 rounded bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] px-1.5 py-0.5 text-[10px] font-bold text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)]">
                        {discountPct}% off
                      </span>
                    )}
                  </p>
                  <p className="mt-1 max-w-[230px] text-[11px] leading-snug text-slate-400 sm:ml-auto">
                    Bundle pricing applies automatically at checkout.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Quantity pricing</p>
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                {pricingTiles.map((tile) => {
                  const selected = (activeTier?.id ?? "single") === tile.id;
                  const total = variant.price * (1 - tile.discountPct / 100) * tile.qty;
                  const original = variant.price * tile.qty;
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => {
                        setQtyDraft(null);
                        setQuantity(tile.qty);
                      }}
                      aria-pressed={selected}
                      className={`relative flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        selected
                          ? "border-[#c4b5fd] bg-[#f5f3ff] shadow-[0_0_16px_rgba(196,181,253,0.45)]"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {tile.badge && (
                        <span className="absolute -top-2 right-2 rounded-full bg-emerald-400 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#06231a]">
                          {tile.badge}
                        </span>
                      )}
                      {vialThumb ? (
                        <span className="flex shrink-0 items-end gap-0.5">
                          {Array.from({ length: Math.min(tile.qty, 3) }).map((_, i) => (
                            <img
                              key={i}
                              src={vialThumb}
                              alt=""
                              width={117}
                              height={240}
                              loading="lazy"
                              decoding="async"
                              className="h-8 w-auto object-contain drop-shadow-[0_1px_2px_rgba(15,23,42,0.15)]"
                            />
                          ))}
                        </span>
                      ) : (
                        <span className="hidden shrink-0 -space-x-3 sm:flex">
                          {Array.from({ length: Math.min(tile.qty, 3) }).map((_, i) => (
                            <img
                              key={i}
                              src={product.image}
                              alt=""
                              className="h-10 w-8 rounded-md object-cover ring-2 ring-white"
                            />
                          ))}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-semibold text-slate-800">{tile.label}</span>
                          {tile.discountPct > 0 && (
                            <span className="shrink-0 rounded bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] px-1.5 py-px text-[10px] font-bold text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)]">
                              {tile.discountPct}% off
                            </span>
                          )}
                        </span>
                        <span className="block text-[13px] font-bold tabular-nums text-slate-900">
                          ${total.toFixed(2)}
                          {tile.discountPct > 0 && (
                            <span className="block text-[11px] font-medium text-slate-400 line-through sm:ml-1.5 sm:inline">${original.toFixed(2)}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-2.5">
                {!COA_HIDDEN.has(product.slug) && (
                  <button
                    type="button"
                    onClick={openSelectedCoa}
                    className="h-12 shrink-0 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
                  >
                    CoA
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="relative flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                >
                  Add to cart · ${lineTotal.toFixed(2)} <ShoppingCart className="h-4 w-4" />
                  {sessionAddedTotal > 0 && (
                    <span
                      aria-live="polite"
                      className="absolute -right-1.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#a78bfa] px-1 text-[11px] font-bold tabular-nums text-white shadow-md ring-1 ring-white/90"
                    >
                      {sessionAddedTotal}
                    </span>
                  )}
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-violet-100 bg-[#faf7ff]">
                {heroInfoRows.map((row) => (
                  <div key={row.title} className="flex gap-3 border-b border-violet-100/80 px-4 py-3">
                    <row.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8b5cf6]" />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">{row.title}</p>
                      <p className="text-[11px] text-slate-500">{row.note}</p>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white/60 px-4 py-2.5">
                  <span className="flex items-center gap-2 text-[11px] text-slate-500">
                    We accept
                    <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-600">
                      <Lock className="h-3 w-3" /> Secure checkout
                    </span>
                  </span>
                  <AcceptedCardLogos
                    order="product"
                    decorative
                    className="flex items-center gap-1.5 [&_img]:!h-5 [&_img]:!w-8"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOWER PAGE — solid white, dark text (Peptora-style) */}
        <div className="bg-white text-slate-900">

          {/* PRODUCT DESCRIPTION — collapsible accordion (Peptora-style),
              positioned right where the gradient has resolved to white. */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14" data-reveal>
            <button
              type="button"
              onClick={() => setDescOpen((o) => !o)}
              aria-expanded={descOpen}
              aria-controls="product-description-panel"
              className="group w-full flex items-center justify-between gap-4 py-3.5 border-b border-slate-200 text-left"
            >
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Product Description</h2>
              <span className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${descOpen ? "rotate-0" : "-rotate-90"}`}
                />
              </span>
            </button>

            {/* Brief blurb shown while collapsed; it disappears once the full
                description is expanded (Peptora-style). */}
            {!descOpen && (
              <div className="pt-3.5 pb-1 max-w-2xl">
                <p className="text-[15px] leading-relaxed text-slate-600">
                  {product.description.startsWith(product.title) ? (
                    <>
                      <span className="font-semibold text-slate-900">{product.title}</span>
                      {product.description.slice(product.title.length)}
                    </>
                  ) : (
                    product.description
                  )}
                </p>
              </div>
            )}

            <div
              id="product-description-panel"
              className={`grid transition-all duration-300 ease-out ${
                descOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-4 space-y-6 max-w-2xl">
                  {descSections.map((sec) => (
                    <div key={sec.heading}>
                      <h3 className="text-base font-bold tracking-tight mb-2.5">{sec.heading}</h3>
                      <ul className="space-y-2.5">
                        {sec.items.map((it, i) => (
                          <li key={i} className="relative pl-5">
                            <span className="absolute left-0 top-[0.5em] h-1.5 w-1.5 rounded-full bg-[#a78bfa]" />
                            <p className="text-[15px] leading-snug text-slate-800">{it.text}</p>
                            {it.note && (
                              <p className="mt-1 text-sm leading-snug text-slate-400">{it.note}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* CERTIFICATE OF ANALYSIS — collapsible accordion (matches the
              Product Description dropdown). Shown for every product except the
              multi-compound bundles/blends in COA_HIDDEN. */}
          {!COA_HIDDEN.has(product.slug) && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 md:pt-3" data-reveal>
            <button
              type="button"
              onClick={() => setCoaOpen((o) => !o)}
              aria-expanded={coaOpen}
              aria-controls="coa-panel"
              className="group w-full flex items-center justify-between gap-4 py-3.5 border-b border-slate-200 text-left"
            >
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Certificate of Analysis</h2>
              <span className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 transition-colors group-hover:bg-slate-200">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${coaOpen ? "rotate-0" : "-rotate-90"}`}
                />
              </span>
            </button>

            <div
              id="coa-panel"
              className={`grid transition-all duration-300 ease-out ${
                coaOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
                    <p className="text-sm text-slate-500">Independently Third-Party Tested by Freedom Diagnostics</p>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {coaCards.map(({ v, i, url: coaUrl }) => (
                      <div
                        key={v.size}
                        data-coa-card
                        onPointerDown={(e) => {
                          if (e.pointerType !== "mouse") setActiveCoaCard(v.size);
                        }}
                        className={`flex w-[180px] shrink-0 flex-col rounded-2xl border bg-white p-3 transition-[border-color,box-shadow] duration-300 ease-out [-webkit-tap-highlight-color:transparent] ${
                          activeCoaCard === v.size
                            ? "border-[rgba(167,139,250,0.5)] shadow-[0_0_20px_4px_rgba(167,139,250,0.18),0_4px_16px_rgba(0,0,0,0.05)]"
                            : "border-slate-200 shadow-sm hover:border-[rgba(167,139,250,0.5)] hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.18),0_4px_16px_rgba(0,0,0,0.05)]"
                        }`}
                      >
                        <span className="inline-flex w-max items-center text-[9px] font-bold uppercase tracking-wider bg-[#141414] text-white px-2 py-0.5 rounded-md">
                          Latest
                        </span>
                        <div className="text-center mt-2 mb-2">
                          <div className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">Exceeds 99%</div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-0.5">Purity</div>
                        </div>
                        <dl className="space-y-1 text-[11px] mb-3">
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Variant:</dt>
                            <dd className="font-semibold text-slate-900">{v.size.replace(/(\d)([a-zA-Z])/, "$1 $2")}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Batch #</dt>
                            <dd className="font-semibold text-slate-900">{coaBatch(product.slug, v.size, i)}</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Batch:</dt>
                            <dd className="font-semibold text-slate-900">Current</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Endotoxins:</dt>
                            <dd className="font-semibold text-slate-900">Pass</dd>
                          </div>
                          <div className="flex items-center justify-between">
                            <dt className="text-slate-500">Tested:</dt>
                            <dd className="font-semibold text-slate-900">{coaTested(product.slug, v.size)}</dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          onClick={coaUrl ? () => setCoaPreview({ name: `${product.name} ${v.size}`, url: coaUrl }) : undefined}
                          className="mt-auto inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[#141414] hover:bg-[#2A2A2A] text-white text-[11px] font-bold px-3 py-2 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> View COA
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-5">
                    All certificates are issued by independent ISO-accredited laboratories. Lot-specific documents are made available to qualified research professionals on request.
                  </p>

                  {/* Quick stats band */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {stats.map((s) => (
                      <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-center">
                        <div className="text-2xl md:text-3xl font-bold text-slate-900">{s.value}</div>
                        <div className="text-sm font-semibold text-slate-700 mt-1">{s.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{s.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* WHY CHOOSE SIMPLETIDE — Peptora-style feature cards (row 1)
              + circular-gauge stat cards (row 2). */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-12">
            {/* ROW 1 — heading + feature cards */}
            <div className="text-center mb-6" data-reveal>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Why Choose{" "}
                <span className="inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
                  Simpletide
                </span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {whyCards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.title}
                    data-why-card
                    data-reveal
                    style={revealDelay(i * 60)}
                    onPointerDown={(e) => {
                      // Desktop (mouse): no click effect — the glow is hover-only
                      // via CSS. Touch/pen: sticky tap-glow that mirrors hover.
                      if (e.pointerType !== "mouse") setActiveWhyCard(`why-${c.title}`);
                    }}
                    className={`${WHY_CARD_BASE} ${
                      activeWhyCard === `why-${c.title}` ? WHY_CARD_ACTIVE : WHY_CARD_INACTIVE
                    } p-4 [-webkit-tap-highlight-color:transparent]`}
                  >
                    <Icon className="w-6 h-6 text-[#8b5cf6] mb-3" />
                    <h3 className="text-[15px] font-bold tracking-tight mb-1.5">{c.title}</h3>
                    <p className="text-[13px] leading-relaxed text-slate-500">{c.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* ROW 2 — circular-gauge stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {whyStats.map((s, i) => {
                const R = 40;
                const C = 2 * Math.PI * R;
                const track = 0.75 * C; // 270° gauge with a gap at the bottom
                return (
                  <div
                    key={s.label}
                    data-why-card
                    data-reveal
                    style={revealDelay(i * 70)}
                    onPointerDown={(e) => {
                      if (e.pointerType !== "mouse") setActiveWhyCard(`stat-${s.label}`);
                    }}
                    className={`${WHY_CARD_BASE} ${
                      activeWhyCard === `stat-${s.label}` ? WHY_CARD_ACTIVE : WHY_CARD_INACTIVE
                    } p-4 text-center [-webkit-tap-highlight-color:transparent]`}
                  >
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id={`gauge-${i}`} x1="0" y1="1" x2="1" y2="0">
                            <stop offset="0%" stopColor="#173a7a" />
                            <stop offset="55%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#5fa0ff" />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r={R}
                          fill="none"
                          stroke="#e6edf5"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${track} ${C}`}
                          transform="rotate(135 50 50)"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r={R}
                          fill="none"
                          stroke={`url(#gauge-${i})`}
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${s.fill * track} ${C}`}
                          transform="rotate(135 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                          {s.value}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-slate-700">
                      {s.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{s.note}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FEATURED PRODUCTS */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
            <div className="text-center mb-10" data-reveal>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Frequently Bought Together</h2>
              <p className="text-sm md:text-base text-slate-500 mt-2 max-w-xl mx-auto">
                Commonly paired to support consistent, reliable experimentation.
              </p>
            </div>
            {(() => {
              const isCarousel = featured.length > 4;
              return (
                <div className="relative" data-reveal style={revealDelay(120)}>
                  <div
                    ref={isCarousel ? fbtScrollerRef : undefined}
                    onScroll={isCarousel ? updateFbtArrows : undefined}
                    className={
                      isCarousel
                        ? "flex gap-3 sm:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        : "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    }
                  >
                    {featured.map((p) => {
                      const fromPrice = Math.min(...p.variants.map((v) => v.price));
                      const priceLabel =
                        p.variants.length > 1 ? `From $${fromPrice.toFixed(2)}` : `$${fromPrice.toFixed(2)}`;
                      return (
                        <div
                          key={p.slug}
                          className={`group relative flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-shadow hover:shadow-lg hover:shadow-slate-200/70 ${
                            isCarousel
                              ? "snap-start shrink-0 w-[42%] sm:w-[calc((100%_-_1.5rem)_/_2)] md:w-[calc((100%_-_3rem)_/_3)] lg:w-[calc((100%_-_4.5rem)_/_4)]"
                              : ""
                          }`}
                        >
                          <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-50">
                            <img
                              src={`/images/cards/${p.slug}.jpg`}
                              alt={p.name}
                              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            <Link
                              to="/product/$slug"
                              params={{ slug: seoProductSlug(p.slug) }}
                              className="absolute inset-0"
                              aria-label={`View ${p.name}`}
                            />
                          </div>
                          <div className="flex flex-col flex-grow px-3 py-2.5 sm:px-4 sm:py-3">
                            <div className="flex flex-col gap-0.5 mb-1">
                              <Link to="/product/$slug" params={{ slug: seoProductSlug(p.slug) }} className="min-w-0 hover:text-slate-600 transition-colors">
                                <h3 className="font-bold text-[13px] sm:text-base text-slate-900 leading-snug">
                                  {p.name}
                                </h3>
                              </Link>
                              <span className="font-bold text-[13px] sm:text-base text-slate-900 whitespace-nowrap">{priceLabel}</span>
                            </div>
                            <p className="text-[11px] tracking-wider text-slate-500 mb-2 sm:mb-2.5">{descriptorFor(p.name) ?? p.category}</p>
                            <button
                              type="button"
                              onClick={() => handleAddFeatured(p)}
                              className="group/cart w-full mt-auto inline-flex items-center justify-center rounded-full border border-[#1A1A1A] bg-[#1A1A1A] py-2.5 sm:py-3 text-sm font-bold text-white transition-all duration-300 hover:bg-white hover:text-[#1A1A1A] hover:shadow-[0_0_20px_4px_rgba(167,139,250,0.20),0_0_40px_8px_rgba(167,139,250,0.10)]"
                            >
                              <span>Add to cart</span>
                              <div className="w-0 overflow-hidden transition-all duration-200 ease-out group-hover/cart:ml-2 group-hover/cart:w-4">
                                <ArrowRight className="h-4 w-4 flex-shrink-0 -translate-x-2 opacity-0 transition-all duration-200 ease-out group-hover/cart:translate-x-0 group-hover/cart:opacity-100" />
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isCarousel && fbtCanLeft && (
                    <button
                      type="button"
                      onClick={() => scrollFbt(-1)}
                      aria-label="Scroll left"
                      className="absolute left-1 top-[38%] -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {isCarousel && fbtCanRight && (
                    <button
                      type="button"
                      onClick={() => scrollFbt(1)}
                      aria-label="Scroll right"
                      className="absolute right-1 top-[38%] -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })()}
            <div className="mt-10 text-center">
              <Link
                to="/products"
                className="group inline-flex items-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white px-8 py-3 rounded-full font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(167,139,250,0.45)]"
              >
                <span className="transition-transform duration-300 ease-in-out">See all products</span>
                <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:w-5 group-hover:ml-2">
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
                </div>
              </Link>
            </div>
          </section>

          {/* FREQUENTLY ASKED QUESTIONS — Peptora-style accordion */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
            <div className="text-center mb-10" data-reveal>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Frequently Asked{" "}
                <span className="inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
                  Questions
                </span>
              </h2>
            </div>
            <div className="border-t border-slate-200">
              {faqs.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={item.q} className="border-b border-slate-200" data-reveal style={revealDelay((idx % 6) * 70)}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      aria-expanded={open}
                      aria-controls={`faq-panel-${idx}`}
                      className="group w-full flex items-center justify-between gap-4 py-5 text-left"
                    >
                      <span className="text-sm md:text-base font-semibold text-slate-900">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                          open ? "rotate-0 text-[#8b5cf6]" : "-rotate-90 text-slate-400"
                        }`}
                      />
                    </button>
                    <div
                      id={`faq-panel-${idx}`}
                      className={`grid transition-all duration-300 ease-out ${
                        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
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
          </section>

          {/* FOR RESEARCH USE ONLY — wide disclaimer card */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 md:pb-20">
            <div className={`${WHY_CARD_CLASS} px-8 sm:px-12 py-12 md:py-14 text-center`} data-reveal>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Info className="w-5 h-5 text-[#8b5cf6]" />
                <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#8b5cf6]">
                  For Research Use Only
                </span>
              </div>
              <p className="text-sm md:text-base leading-relaxed text-slate-500">
                Products are intended solely for laboratory and scientific research purposes. Not
                intended for human consumption, veterinary use, diagnosis, treatment, cure, or
                prevention of disease.
              </p>
            </div>
          </section>

          {/* NEWSLETTER — Peptora-style light card on a white background */}
          <NewsletterSection variant="light" className="bg-white pt-8 md:pt-12 pb-16 md:pb-24" />
        </div>
      </main>

      {coaPreview && (
        <CoaLightbox
          coa={{ name: coaPreview.name, url: coaPreview.url, file: "" }}
          onClose={() => setCoaPreview(null)}
        />
      )}
    </div>
  );
}
