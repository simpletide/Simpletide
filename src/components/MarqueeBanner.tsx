import React, { useEffect, useRef } from "react";

const REPEATS = 3;

/**
 * Scrolling top announcement bar above the navbar promoting shipping & free Bac Water perks.
 */
export function MarqueeBanner({ light = false }: { light?: boolean }) {
  const sentenceShipping = "Free FedEx 2-Day Shipping on orders $199+";
  const sentenceBacWater = "Free Bac Water on orders $150+";
  const sentencePurity = "Third-Party Tested · 99%+ Purity Guaranteed";
  const items = Array.from({ length: REPEATS });
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        el.dataset.paused = entry.isIntersecting ? "false" : "true";
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`w-full border-b overflow-hidden whitespace-nowrap py-1.5 min-h-[32px] flex items-center text-xs md:text-[13px] tracking-wide font-medium ${
        light
          ? "bg-gradient-to-r from-[#fce7f3] via-[#ede9fe] to-[#e0f2fe] border-white text-slate-700"
          : "bg-[#0f2e5c] border-white/10 text-white"
      }`}
    >
      <div className="marquee-track" ref={trackRef}>
        <div className="flex shrink-0">
          {items.map((_, i) => (
            <React.Fragment key={`a-${i}`}>
              <span className="flex-shrink-0 pr-20 md:pr-32 lg:pr-44 font-semibold">{sentenceShipping}</span>
              <span className="flex-shrink-0 pr-20 md:pr-32 lg:pr-44 font-semibold text-violet-700">{sentenceBacWater}</span>
              <span className="flex-shrink-0 pr-20 md:pr-32 lg:pr-44">{sentencePurity}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {items.map((_, i) => (
            <React.Fragment key={`b-${i}`}>
              <span className="flex-shrink-0 pr-20 md:pr-32 lg:pr-44 font-semibold">{sentenceShipping}</span>
              <span className="flex-shrink-0 pr-20 md:pr-32 lg:pr-44 font-semibold text-violet-700">{sentenceBacWater}</span>
              <span className="flex-shrink-0 pr-20 md:pr-32 lg:pr-44">{sentencePurity}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
