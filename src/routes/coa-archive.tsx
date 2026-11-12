import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown, ArrowUpDown } from "lucide-react";
import { CoaCard, type CoaCardProduct } from "@/components/CoaCard";
import { CoaLightbox, type CoaReport } from "@/components/CoaLightbox";

import { Header } from "@/components/Header";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import { pageSeoHead } from "@/lib/site-seo";

import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

import { COA_PRODUCTS, COA_REPORT_COUNT, coaReports } from "@/lib/coa-data";
import { CATALOG, descriptorFor, slugFor } from "@/lib/catalog";
import { SHOP_PRODUCTS } from "@/lib/shop-products";

export const Route = createFileRoute("/coa-archive")({
  head: () =>
    pageSeoHead({
      path: "/coa-archive",
      title: "Complete COA Archive | Simpletide",
      description: "Browse all batch Certificate of Analysis results for our research-grade peptides.",
    }),
  component: CoaArchivePage,
});

const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

// Derived on first use rather than at module scope: CATALOG lives in another
// chunk, and the SSR router chunks import each other cyclically, so reading it
// during module evaluation can find it still undefined.
let cardsCache: CoaCardProduct[] | undefined;

function coaCards(): CoaCardProduct[] {
  if (cardsCache) return cardsCache;

  cardsCache = Object.entries(COA_PRODUCTS).map(([slug, data]) => {
    const product = CATALOG.find((p) => p.slug === slug);
    return {
      slug,
      // The catalog's name wins where there is one, so the COA page and the
      // shop agree; certificates for compounds not (or no longer) on the shop
      // fall back to the name printed on the certificate.
      name: product?.name ?? data.name,
      descriptor: descriptorFor(product?.name ?? data.name) ?? product?.category ?? "Research Compound",
      image: product?.heroImage ?? product?.image ?? null,
      sizes: data.panels.map((p) => p.size),
    };
  });
  return cardsCache;
}

// ── Sorting
type SortKey = "popular" | "alphabetical" | "recent";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "Popular" },
  { key: "alphabetical", label: "Alphabetical" },
  { key: "recent", label: "Recent" },
];

// Popular = the shop grid's order; anything not on the shop sorts to the end.
let popularRankCache: Record<string, number> | undefined;
const popularRank = (slug: string) => {
  if (!popularRankCache) {
    const ranks: Record<string, number> = {};
    SHOP_PRODUCTS.forEach((p, i) => {
      const shopSlug = slugFor(p.name);
      if (shopSlug && !(shopSlug in ranks)) ranks[shopSlug] = i;
    });
    popularRankCache = ranks;
  }
  return popularRankCache[slug] ?? Number.MAX_SAFE_INTEGER;
};

// Recent = newest certificate for the product, read off the certificates
// themselves so it stays right without a hand-maintained list.
const testedAt = (slug: string) =>
  Math.max(...(COA_PRODUCTS[slug]?.panels.map((p) => Date.parse(p.tested) || 0) ?? [0]));

function CoaArchivePage() {
  useReveal();

  const [lightbox, setLightbox] = useState<{ slug: string; size: string } | null>(null);
  const [coaQuery, setCoaQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const onDown = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [sortOpen]);

  const filtered = useMemo(() => {
    const q = coaQuery.trim().toLowerCase();
    const base = q ? coaCards().filter((c) => c.name.toLowerCase().includes(q)) : coaCards().slice();
    return base.sort((a, b) => {
      if (sort === "alphabetical") return a.name.localeCompare(b.name);
      if (sort === "recent") return testedAt(b.slug) - testedAt(a.slug) || a.name.localeCompare(b.name);
      const r = popularRank(a.slug) - popularRank(b.slug);
      return r !== 0 ? r : a.name.localeCompare(b.name);
    });
  }, [coaQuery, sort]);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Popular";

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  const openCoa = lightbox
    ? {
        name: coaCards().find((c) => c.slug === lightbox.slug)?.name ?? "",
        reports: coaReports(lightbox.slug) as CoaReport[],
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900">
      <Header />

      <main className="flex-1">
        {/* ─── HERO — identical to About page header ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgb(221,214,254) 11%, rgb(237,233,254) 100%)" }}
        >
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

          <div className="relative z-[1] mx-auto flex max-w-[1280px] items-center justify-center md:items-start min-h-[285px] md:min-h-[clamp(320px,44vh,440px)]">
            <div className="mx-auto max-w-[700px] px-6 pt-2 pb-12 text-center md:pt-11 md:pb-24">
              <span
                data-reveal
                style={revealDelay(0)}
                className="mb-4 md:mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-xs md:px-[22px] md:py-2.5 md:text-sm font-semibold text-[#19276E] shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-[8px]"
              >
                Full Transparency
              </span>
              <h1
                data-reveal
                className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]"
                style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}
              >
                Certificates of <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Analysis</span>
              </h1>
              <p
                data-reveal
                className="mx-auto mt-4 leading-[1.55] text-[#555]"
                style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}
              >
                Every batch of Simpletide compounds is independently tested by ILS Laboratories, an ISO/IEC 17025
                accredited lab. Every certificate we hold is published below — read them before you research with us.
              </p>
            </div>
          </div>
        </section>

        {/* ─── ARCHIVE ─── */}
        <section className="bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 md:pt-8 md:pb-16">
          <div data-reveal className="mx-auto mb-4 flex max-w-[620px] items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <label htmlFor="coa-search" className="sr-only">
                Search Certificates of Analysis
              </label>
              <input
                id="coa-search"
                type="text"
                value={coaQuery}
                onChange={(e) => setCoaQuery(e.target.value)}
                placeholder="Search by product name..."
                aria-label="Search Certificates of Analysis"
                className="w-full bg-slate-50 border border-slate-300 rounded-full pl-11 pr-5 py-2.5 text-sm focus:outline-none focus:border-[#a78bfa] focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <div ref={sortRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSortOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <span className="hidden sm:inline text-slate-400 font-medium">Sort:</span>
                {sortLabel}
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                />
              </button>
              {sortOpen && (
                <div
                  role="listbox"
                  aria-label="Sort certificates"
                  className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                >
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      role="option"
                      aria-selected={sort === o.key}
                      onClick={() => {
                        setSort(o.key);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        sort === o.key
                          ? "bg-[#f5f3ff] font-semibold text-[#7c3aed]"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {o.label}
                      {sort === o.key && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p data-reveal className="mx-auto mb-8 max-w-[520px] text-center text-xs font-medium text-slate-500 md:mb-10">
            {coaCards().length} products &middot; {COA_REPORT_COUNT} published reports
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product, i) => (
              <div key={product.slug} data-reveal style={revealDelay(Math.min(i, 8) * 40)} className="h-full">
                <CoaCard product={product} onView={(slug, size) => setLightbox({ slug, size })} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-14 text-center md:py-20">
              <p className="text-sm text-slate-500 md:text-base">
                No certificates match <span className="font-semibold text-slate-700">"{coaQuery}"</span>.
              </p>
              <button
                type="button"
                onClick={() => setCoaQuery("")}
                className="mt-3 text-sm font-semibold text-[#7c3aed] hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </section>

        {lightbox && openCoa && (
          <CoaLightbox
            key={lightbox.slug}
            name={openCoa.name}
            reports={openCoa.reports}
            initialSize={lightbox.size}
            onClose={() => setLightbox(null)}
          />
        )}
      </main>
    </div>
  );
}
