import React, { useEffect, useRef } from "react";

/**
 * Scrolling announcement bar.
 *
 * The track is duplicated once and translated -50%, so a seamless loop only
 * needs each half to be at least as wide as the viewport. It used to repeat the
 * pair of sentences six times per half (24 spans); three covers a ~2900px
 * viewport with room to spare. The duration is halved alongside it so the
 * on-screen scroll speed is unchanged.
 */
const REPEATS = 3;

export function MarqueeBanner({ light = false }: { light?: boolean }) {
  const sentenceOne = "Free Priority Shipping On All Orders";
  const sentenceTwo = "Third Party Tested | 99% Purity Guaranteed";
  const items = Array.from({ length: REPEATS });
  const trackRef = useRef<HTMLDivElement>(null);

  // The banner sits at the very top of the page, so it spends most of a visit
  // scrolled out of view. Pausing it off-screen keeps the compositor idle.
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
      className={`w-full border-b overflow-hidden whitespace-nowrap py-2.5 min-h-[40px] flex items-center text-xs md:text-sm tracking-wide font-medium ${
        light
          ? "bg-gradient-to-r from-[#fce7f3] via-[#ede9fe] to-[#e0f2fe] border-white text-slate-700"
          : "bg-[#0f2e5c] border-white/10 text-white"
      }`}
    >
      <div className="marquee-track" ref={trackRef}>
        <div className="flex shrink-0">
          {items.map((_, i) => (
            <React.Fragment key={`a-${i}`}>
              <span className="flex-shrink-0 pr-28 md:pr-44 lg:pr-60">{sentenceOne}</span>
              <span className="flex-shrink-0 pr-28 md:pr-44 lg:pr-60">{sentenceTwo}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex shrink-0" aria-hidden="true">
          {items.map((_, i) => (
            <React.Fragment key={`b-${i}`}>
              <span className="flex-shrink-0 pr-28 md:pr-44 lg:pr-60">{sentenceOne}</span>
              <span className="flex-shrink-0 pr-28 md:pr-44 lg:pr-60">{sentenceTwo}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
