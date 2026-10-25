import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CoaCard } from "@/components/CoaCard";
import { CoaLightbox } from "@/components/CoaLightbox";

import { Header } from "@/components/Header";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import { pageSeoHead } from "@/lib/site-seo";

import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

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

type CoaEntry = { name: string; batch: string; url: string; file: string };


const COAS: CoaEntry[] = [];

function CoaArchivePage() {
  useReveal();

  const [lightbox, setLightbox] = useState<import("@/components/CoaCard").CoaData | null>(null);

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

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      <Header />

      <main className="flex-1">
        {/* ─── HERO — identical to About page header ─── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(180deg, rgb(221,214,254) 11%, rgb(237,233,254) 100%)" }}
        >
          {/* Faint floating vials, low opacity (same positions as About) */}
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
              <span data-reveal style={revealDelay(0)} className="mb-4 md:mb-5 inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-xs md:px-[22px] md:py-2.5 md:text-sm font-semibold text-[#19276E] shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-[8px]">
                Full Transparency
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Certificates of{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>Analysis</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Every batch of Simpletide compounds is independently third-party tested for purity and identity. Certificates of Analysis (COAs) for each batch are posted below.
              </p>
            </div>
          </div>
        </section>

        {/* ─── ARCHIVE — white ─── */}
        <section className="bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {COAS.length === 0 ? (
            <div data-reveal className="mx-auto max-w-[560px] rounded-[24px] border border-white bg-white/60 px-6 py-12 text-center shadow-[0_8px_30px_rgba(167,139,250,0.12)] backdrop-blur-md">
              <h2 className="text-xl font-bold text-slate-800">Certificates coming soon</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Third-party test results for every Simpletide batch will be posted here as they are released.
              </p>
            </div>
          ) : (
            <div data-reveal className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {COAS.map((coa) => (
                <CoaCard key={coa.file} coa={coa} onClick={(c) => setLightbox(c)} />
              ))}
            </div>
          )}
        </section>

        {lightbox && (
          <CoaLightbox coa={lightbox} onClose={() => setLightbox(null)} />
        )}
      </main>
    </div>
  );
}
