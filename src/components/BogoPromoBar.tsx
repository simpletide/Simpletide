import { useEffect, useState, type CSSProperties } from "react";
import { Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { BOGO_CODE } from "@/lib/promo-codes";

const CYCLE_MS = 7 * 24 * 60 * 60 * 1000;
const EPOCH_ANCHOR_MS = Date.UTC(2026, 0, 5, 0, 0, 0);

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
 * Static, Simpletide-themed Buy 1 Get 1 Free promo ribbon placed directly below the navbar.
 * Clicking anywhere activates code `BOGO` in cart state and copies it to clipboard.
 */
export function BogoPromoBar() {
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
      aria-label="Buy 1 Get 1 Free — click to apply code BOGO to your cart"
      className="group relative w-full overflow-hidden border-y border-white/40 bg-gradient-to-r from-[#ec7ab8] via-[#9b82f6] to-[#60b6fa] text-white cursor-pointer select-none transition-[filter] duration-200 hover:brightness-[1.03]"
    >
      {/* Subtle luminous shimmer highlight across the ribbon */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 120% at 50% 0%, rgba(255,255,255,0.65) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[42px] sm:min-h-[46px] max-w-7xl items-center justify-center gap-2.5 sm:gap-4 px-3 sm:px-6 py-1">
        {/* Crisp editorial Buy 1 Get 1 Free copy */}
        <div className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-2.5 text-left leading-tight [text-shadow:0_1px_2px_rgba(76,29,149,0.28)]">
          <span
            className="font-serif italic font-bold text-[14px] sm:text-[16px] text-white tracking-[-0.01em] whitespace-nowrap"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Buy 1 Get 1 Free.
          </span>
          <span className="text-[11px] sm:text-[13px] text-white/95 truncate sm:whitespace-nowrap">
            {justApplied || bogoActive ? (
              <span className="inline-flex items-center gap-1 font-semibold text-white">
                <Check className="h-3.5 w-3.5 shrink-0" />
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
                <strong className="font-extrabold text-white underline decoration-white/80 underline-offset-2">
                  {BOGO_CODE}
                </strong>
                <span className="hidden lg:inline"> at checkout.</span>
              </>
            )}
          </span>
        </div>

        {/* Subtle divider */}
        <span className="hidden sm:block h-6 w-px shrink-0 bg-white/30" aria-hidden="true" />

        {/* Right notched cinema-ticket countdown stub */}
        <div
          style={TICKET_MASK_STYLE}
          className="flex shrink-0 flex-col items-center justify-center rounded-md bg-white px-3 sm:px-4 py-1 sm:py-1.5 text-center shadow-[0_4px_14px_rgba(76,29,149,0.2)]"
        >
          <span className="text-[9px] sm:text-[10px] font-medium leading-none text-slate-500">
            Ends in
          </span>
          <span className="mt-0.5 text-[10.5px] sm:text-[12.5px] font-extrabold leading-none tracking-tight tabular-nums text-violet-950 whitespace-nowrap">
            {timerText}
          </span>
        </div>
      </div>
    </div>
  );
}
