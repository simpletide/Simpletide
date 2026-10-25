import React from "react";

export function MarqueeBanner({ light = false }: { light?: boolean }) {
  const sentenceOne = "Free Priority Shipping On All Orders";
  const sentenceTwo = "Third Party Tested | 99% Purity Guaranteed";
  const repeats = 6;
  const items = Array.from({ length: repeats });

  return (
    <div
      className={`w-full border-b overflow-hidden whitespace-nowrap py-2.5 min-h-[40px] flex items-center text-xs md:text-sm tracking-wide font-medium ${
        light
          ? "bg-gradient-to-r from-[#fce7f3] via-[#ede9fe] to-[#e0f2fe] border-white text-slate-700"
          : "bg-[#0f2e5c] border-white/10 text-white"
      }`}
    >
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll 120s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="marquee-track">
        <div className="flex shrink-0">
          {items.map((_, i) => (
            <React.Fragment key={`a-${i}`}>
              <span className="flex-shrink-0 pr-28 md:pr-44 lg:pr-60">{sentenceOne}</span>
              <span className="flex-shrink-0 pr-28 md:pr-44 lg:pr-60">{sentenceTwo}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex shrink-0">
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
