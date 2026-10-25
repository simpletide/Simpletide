const BLOBS = [
  { color: "#fbcfe8", size: "55vmax", top: "-15%", left: "-10%", duration: "34s", delay: "0s" },
  { color: "#fed7aa", size: "45vmax", top: "5%", left: "55%", duration: "40s", delay: "-8s" },
  { color: "#fef3c7", size: "40vmax", top: "40%", left: "-15%", duration: "38s", delay: "-15s" },
  { color: "#bbf7d0", size: "50vmax", top: "55%", left: "40%", duration: "44s", delay: "-4s" },
  { color: "#bae6fd", size: "48vmax", top: "25%", left: "20%", duration: "36s", delay: "-20s" },
  { color: "#ddd6fe", size: "52vmax", top: "70%", left: "-5%", duration: "42s", delay: "-12s" },
  { color: "#f5d0fe", size: "42vmax", top: "-5%", left: "30%", duration: "46s", delay: "-26s" },
];

/**
 * Full-viewport white background with slowly drifting pastel rainbow mist.
 * Renders behind all content (home page only).
 */
export function RainbowMist() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-white" aria-hidden="true">
      <style>{`
        @keyframes rainbow-mist-drift {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          33%  { transform: translate3d(6vw, -5vh, 0) scale(1.08); }
          66%  { transform: translate3d(-5vw, 4vh, 0) scale(0.94); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        .rainbow-mist-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.75;
          will-change: transform;
          animation: rainbow-mist-drift linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .rainbow-mist-blob { animation: none; }
        }
      `}</style>
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className="rainbow-mist-blob"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: `radial-gradient(circle, ${b.color} 0%, ${b.color}00 70%)`,
            animationDuration: b.duration,
            animationDelay: b.delay,
          }}
        />
      ))}
      {/* Soft white veil keeps the page reading as white with mist, not a solid rainbow. */}
      <div className="absolute inset-0 bg-white/35" />
    </div>
  );
}
