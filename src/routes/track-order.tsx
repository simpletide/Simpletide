import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { TrackOrderPanel } from "@/components/TrackOrderPanel";
import { useReveal, revealDelay } from "@/lib/use-reveal";
import { pageSeoHead } from "@/lib/site-seo";
import vialGlp3 from "@/assets/vial-glp3.png.asset.json";
import vialNad from "@/assets/vial-nad.png.asset.json";
import vialGhkCu from "@/assets/vial-ghkcu.png.asset.json";

export const Route = createFileRoute("/track-order")({
  validateSearch: (search: Record<string, unknown>) => ({
    order: typeof search.order === "string" ? search.order : "",
  }),
  head: () =>
    pageSeoHead({
      path: "/track-order",
      title: "Track Your Order | Simpletide",
      description: "Track your Simpletide order status with your order number and billing email.",
      noindex: true,
    }),
  component: TrackOrderPage,
});

// Brand-blue gradient text (never teal), site-wide light-background style.
const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

function TrackOrderPage() {
  useReveal();

  const { order } = Route.useSearch();

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
                Order Status
              </span>
              <h1 data-reveal className="font-extrabold leading-[1.08] tracking-[-0.03em] text-[#141414]" style={{ fontSize: "clamp(32px, 6vw, 56px)", ...revealDelay(90) }}>
                Track your{" "}
                <span className={`inline-block pb-[0.2em] -mb-[0.2em] ${GRADIENT_TEXT}`}>order</span>
              </h1>
              <p data-reveal className="mx-auto mt-4 leading-[1.55] text-[#555]" style={{ fontSize: "clamp(13.5px, 2vw, 18px)", maxWidth: "620px", ...revealDelay(180) }}>
                Enter your order number and billing email to check status. Your order number was in your confirmation email.
              </p>
            </div>
          </div>
        </section>

        {/* ─── TRACK FORM — flat on a white page ─── */}
        <section data-reveal className="bg-white px-4 py-10 md:py-14">
          <TrackOrderPanel defaultOrderNumber={order} />
        </section>
      </main>
    </div>
  );
}
