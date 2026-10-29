import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Ban,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Droplet,
  Fingerprint,
  FlaskConical,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

type QualityTest = { icon: LucideIcon; title: string; desc: string };

const TESTS: QualityTest[] = [
  { icon: Droplet, title: "Purity", desc: "HPLC-UV quantification against a certified reference standard." },
  { icon: Scale, title: "Content Verification", desc: "Mass and concentration verified to the labeled potency." },
  { icon: Fingerprint, title: "Identity Confirmation", desc: "Mass spectrometry confirms the exact molecular structure." },
  { icon: FlaskConical, title: "Heavy Metals Screening", desc: "ICP-MS screen for Pb, As, Cd, and Hg below USP <232> limits." },
  { icon: ShieldCheck, title: "Sterility Testing", desc: "USP <71> compliant sterility screen on every fill." },
  { icon: Activity, title: "Endotoxin Testing", desc: "LAL kinetic chromogenic assay on each production lot." },
  { icon: ClipboardCheck, title: "Batch Conformity Verification", desc: "Independent batch review confirming every lot matches its release spec and COA." },
  { icon: Ban, title: "Fentanyl Screen", desc: "LC-MS/MS screen confirms no fentanyl or fentanyl-analog contamination." },
];

const STATS = [
  { value: "99%+", label: "Purity Guaranteed" },
  { value: "8", label: "Quality Checks" },
  { value: "100%", label: "U.S. Verified" },
];

export function QualityTestsCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const cards = Array.from(track.children) as HTMLElement[];
      const left = track.scrollLeft;
      let nearest = 0;
      cards.forEach((card, i) => {
        if (Math.abs(card.offsetLeft - track.offsetLeft - left) < Math.abs(cards[nearest].offsetLeft - track.offsetLeft - left)) nearest = i;
      });
      setActive(nearest);
      setAtStart(left <= 4);
      setAtEnd(left + track.clientWidth >= track.scrollWidth - 4);
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollToCard = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: "smooth" });
  };

  const step = (dir: 1 | -1) => scrollToCard(Math.min(TESTS.length - 1, Math.max(0, active + dir)));

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 bg-white/70 border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-violet-500">
            <ShieldCheck className="w-3.5 h-3.5" /> Quality Control
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            <span className="text-slate-800">Every batch, </span>
            <span className="inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
              8× tested.
            </span>
          </h2>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            We don't grade our own work. Every batch clears eight independent lab tests at accredited third-party
            facilities, and each result is published on the Certificate of Analysis tied to that exact lot number.
          </p>
          <div className="flex justify-center gap-10 md:gap-16 mt-6">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-xs md:text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div data-reveal className="flex items-center gap-3 lg:gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label="Previous test"
            className="hidden md:flex shrink-0 w-10 h-10 rounded-full bg-white/90 border border-white shadow-[0_8px_30px_rgba(167,139,250,0.25)] items-center justify-center text-violet-500 transition-opacity hover:bg-white disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div
            ref={trackRef}
            className="flex-1 min-w-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Quality tests"
          >
            {TESTS.map((test, i) => (
              <div
                key={test.title}
                className="snap-start shrink-0 basis-[82%] sm:basis-[calc(50%-8px)] lg:basis-[calc(33.333%-11px)] flex flex-col rounded-2xl bg-white/60 backdrop-blur-md border border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] p-5 md:p-6 transition-all duration-200 hover:bg-white/85 hover:border-[#d8b4fe] hover:shadow-[0_0_30px_rgba(216,180,254,0.45)]"
              >
                <div className="relative w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4">
                  <test.icon className="w-5 h-5 text-violet-400" strokeWidth={1.75} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1.5">{test.title}</h3>
                <p className="text-[13px] text-slate-600 leading-relaxed">{test.desc}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label="Next test"
            className="hidden md:flex shrink-0 w-10 h-10 rounded-full bg-white/90 border border-white shadow-[0_8px_30px_rgba(167,139,250,0.25)] items-center justify-center text-violet-500 transition-opacity hover:bg-white disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center gap-1.5 mt-2">
          {TESTS.map((t, i) => (
            <button
              key={t.title}
              type="button"
              onClick={() => scrollToCard(i)}
              aria-label={`Go to ${t.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd]" : "w-1.5 bg-violet-200"
              }`}
            />
          ))}
        </div>

        <div
          data-reveal
          className="mt-8 rounded-2xl bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] ring-1 ring-white/70 shadow-[0_0_30px_rgba(196,181,253,0.5)] px-5 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
        >
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-full bg-white/30 items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)]">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-90">Proof, on demand</p>
              <p className="font-bold text-sm md:text-base">Verify any batch — full COA, signed and dated.</p>
            </div>
          </div>
          <Link
            to="/coa-archive"
            className="group inline-flex items-center bg-white text-violet-600 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.03] shrink-0"
          >
            Verify a batch
            <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
