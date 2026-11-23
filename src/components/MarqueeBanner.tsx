import { useEffect, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { BOGO_CODE } from "@/lib/promo-codes";

const CYCLE_MS = 7 * 24 * 60 * 60 * 1000;
const EPOCH_ANCHOR_MS = Date.UTC(2026, 0, 5, 0, 0, 0); // Monday 00:00 UTC

type Remaining = { d: number; h: number; m: number; s: number };

function computeRemaining(nowMs: number): Remaining {
  const elapsed = (((nowMs - EPOCH_ANCHOR_MS) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  const leftMs = Math.max(0, CYCLE_MS - elapsed);
  const totalSec = Math.floor(leftMs / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const STARS: Array<{ left: string; top: string; size: number; opacity: number; color: string }> = [
  { left: "4%", top: "24%", size: 2, opacity: 0.7, color: "#ffffff" },
  { left: "9%", top: "72%", size: 1.5, opacity: 0.45, color: "#f9a8d4" },
  { left: "15%", top: "32%", size: 2, opacity: 0.55, color: "#c4b5fd" },
  { left: "22%", top: "68%", size: 1.5, opacity: 0.4, color: "#ffffff" },
  { left: "31%", top: "22%", size: 2, opacity: 0.65, color: "#93c5fd" },
  { left: "43%", top: "18%", size: 1.5, opacity: 0.5, color: "#ffffff" },
  { left: "58%", top: "78%", size: 2, opacity: 0.55, color: "#f9a8d4" },
  { left: "67%", top: "20%", size: 1.5, opacity: 0.45, color: "#c4b5fd" },
  { left: "77%", top: "74%", size: 2, opacity: 0.6, color: "#ffffff" },
  { left: "85%", top: "26%", size: 2, opacity: 0.5, color: "#93c5fd" },
  { left: "91%", top: "66%", size: 1.5, opacity: 0.65, color: "#f9a8d4" },
  { left: "96%", top: "30%", size: 2, opacity: 0.5, color: "#ffffff" },
];

/** True semicircular cinema-ticket notches on left and right edges. */
const TICKET_MASK_STYLE: CSSProperties = {
  WebkitMaskImage:
    "radial-gradient(circle 5px at 0% 50%, transparent 98%, #000 100%), radial-gradient(circle 5px at 100% 50%, transparent 98%, #000 100%)",
  WebkitMaskComposite: "source-in",
  maskImage:
    "radial-gradient(circle 5px at 0% 50%, transparent 98%, #000 100%), radial-gradient(circle 5px at 100% 50%, transparent 98%, #000 100%)",
  maskComposite: "intersect",
};

/**
 * Static Midnight Lavender BOGO top promo ribbon (replaces the old scrolling marquee).
 * Clicking anywhere activates code `BOGO` in cart state and copies it to clipboard.
 */
export function MarqueeBanner(_props: { light?: boolean }) {
  const { promoCode, applyPromoCode } = useCart();
  const bogoActive = promoCode === BOGO_CODE;
  const [justApplied, setJustApplied] = useState(false);
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(computeRemaining(Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleActivate = () => {
    applyPromoCode(BOGO_CODE);
    try {
      void navigator.clipboard?.writeText(BOGO_CODE);
    } catch {
      /* clipboard unavailable */
    }
    setJustApplied(true);
    window.setTimeout(() => setJustApplied(false), 2600);
  };

  const timerText = remaining
    ? `${remaining.d}d ${pad2(remaining.h)}h ${pad2(remaining.m)}m ${pad2(remaining.s)}s`
    : "6d 23h 59m 59s";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate();
        }
      }}
      aria-label="Buy One Get One Free — click to apply code BOGO to your cart"
      className="group relative w-full overflow-hidden border-b border-violet-300/20 bg-gradient-to-r from-[#0d081d] via-[#1a1136] to-[#0d081d] text-white cursor-pointer select-none transition-colors hover:via-[#211644]"
    >
      {/* Subtle ambient nebula glow behind the rising orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-[420px] -translate-x-[72%] -translate-y-1/2 rounded-full opacity-35 blur-2xl"
        style={{ background: "radial-gradient(circle, #c084fc 0%, #f472b6 45%, transparent 72%)" }}
        aria-hidden="true"
      />

      {/* Starfield specks */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STARS.map((star, idx) => (
          <span
            key={idx}
            className="absolute rounded-full"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              backgroundColor: star.color,
            }}
          />
        ))}
      </div>

      {/* Centered content row */}
      <div className="relative mx-auto flex min-h-[52px] sm:min-h-[56px] max-w-7xl items-center justify-center gap-3 sm:gap-4 md:gap-5 px-3 sm:px-6">
        {/* Rising pastel 2-FOR-1 dome — sits flush against bottom edge like a rising moon */}
        <div className="relative flex h-[52px] sm:h-[56px] w-[72px] sm:w-[96px] shrink-0 items-end justify-center overflow-visible">
          <div
            className="flex h-[74px] w-[74px] sm:h-[96px] sm:w-[96px] translate-y-[26px] sm:translate-y-[34px] items-start justify-center rounded-full pt-[18px] sm:pt-[22px] transition-transform duration-300 group-hover:translate-y-[23px] sm:group-hover:translate-y-[31px]"
            style={{
              background:
                "radial-gradient(circle at 50% 24%, #ffffff 0%, #fbcfe8 28%, #c4b5fd 64%, #7dd3fc 100%)",
              boxShadow: "0 0 28px rgba(196, 181, 253, 0.55), 0 0 12px rgba(244, 114, 182, 0.4)",
            }}
          >
            <span
              className="font-serif italic font-bold tracking-tight text-[#140c29] text-[12px] sm:text-[15px] leading-none"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              2-FOR-1
            </span>
          </div>
        </div>

        {/* Center editorial copy */}
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2 text-left leading-tight">
          <span
            className="font-serif italic font-semibold text-[13px] sm:text-[15.5px] text-white tracking-[-0.01em] whitespace-nowrap"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Second vial free.
          </span>
          <span className="text-[11px] sm:text-[13px] text-violet-100/90 truncate sm:whitespace-nowrap">
            {justApplied || bogoActive ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[#f5d0fe]">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#f9a8d4]" />
                <span className="sm:hidden">
                  {justApplied ? `Code ${BOGO_CODE} applied!` : `Code ${BOGO_CODE} active`}
                </span>
                <span className="hidden sm:inline">
                  {justApplied ? `Code ${BOGO_CODE} copied & applied!` : `Code ${BOGO_CODE} active in cart`}
                </span>
              </span>
            ) : (
              <>
                <span className="hidden md:inline">Mix &amp; match site-wide — apply code </span>
                <span className="md:hidden">Use code </span>
                <strong className="font-bold text-white underline decoration-violet-300/60 underline-offset-2">
                  {BOGO_CODE}
                </strong>
                <span className="hidden lg:inline"> at checkout.</span>
              </>
            )}
          </span>
        </div>

        {/* Subtle divider */}
        <span className="hidden sm:block h-6 w-px shrink-0 bg-white/15" aria-hidden="true" />

        {/* Right notched cinema-ticket countdown stub */}
        <div
          style={TICKET_MASK_STYLE}
          className="flex shrink-0 flex-col items-center justify-center rounded-md bg-gradient-to-b from-[#ffffff] to-[#f3edff] px-3 sm:px-4 py-1 sm:py-1.5 text-center shadow-[0_4px_18px_rgba(196,181,253,0.28)]"
        >
          <span className="text-[9px] sm:text-[10px] font-medium leading-none text-slate-500">
            Ends in
          </span>
          <span className="mt-0.5 text-[10.5px] sm:text-[12.5px] font-extrabold leading-none tracking-tight tabular-nums text-[#140c29] whitespace-nowrap">
            {timerText}
          </span>
        </div>
      </div>
    </div>
  );
}
