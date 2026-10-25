import { Star } from "lucide-react";
import { useState, useEffect } from "react";

type Review = {
  text: string;
  name: string;
  username: string;
  color: string;
};

// Distinct avatar colors — cycled so adjacent reviewers never match.
const AVATAR_COLORS = [
  "#2d68c4", // blue
  "#1f9d8f", // teal
  "#7c5cd6", // purple
  "#d6427a", // rose
  "#2f9e44", // green
  "#e0843a", // orange
  "#3a7bd5", // sky
  "#9d2d6b", // magenta
  "#d6a02d", // amber
  "#4453c9", // indigo
  "#1aa3c4", // cyan
  "#b5453a", // red
];

const REVIEW_DATA: Omit<Review, "color">[] = [
  // --- Pricing (affordable) ---
  {
    text: "Genuinely the most affordable pricing I've found anywhere, and the quality didn't drop to match it. Unbeatable value for a research budget.",
    name: "Marcus Delgado",
    username: "@marcus.delgado",
  },
  // --- Ryan / customer service ---
  {
    text: "Ryan in customer service is awesome. He patiently answered every question I had and made sure my order was exactly right before it shipped.",
    name: "Hannah Cole",
    username: "@hannahcole",
  },
  // --- Shipping (short) ---
  {
    text: "Free priority shipping that actually shows up fast. Can't beat it.",
    name: "Devin Park",
    username: "@devin_park",
  },
  // --- Packaging ---
  {
    text: "The packaging was super secure. Everything arrived sealed, padded, and completely intact in transit.",
    name: "Olivia Brennan",
    username: "@obrennan",
  },
  // --- Site (short) ---
  {
    text: "Easiest site I've ever ordered from. In and out in two minutes.",
    name: "Raj Patel",
    username: "@rajpatel",
  },
  // --- COA ---
  {
    text: "Every product has a COA that actually matches the batch. That kind of transparency is exactly why I keep coming back.",
    name: "VialViking42",
    username: "@VialViking42",
  },
  // --- Pricing (short) ---
  {
    text: "Best prices, period.",
    name: "BudgetBeaker",
    username: "@budgetbeaker",
  },
  // --- Ryan / customer service (short) ---
  {
    text: "Devon is the man. 10/10 support.",
    name: "Greg Mason",
    username: "@gmason",
  },
  // --- Shipping ---
  {
    text: "Love that priority shipping is free on all orders, no minimums and no surprise fees at checkout. Made me a repeat customer.",
    name: "Nina Volkov",
    username: "@nina.volkov",
  },
  // --- COA (long) ---
  {
    text: "I always verify COAs before I trust a supplier, and theirs are legit, third-party tested and easy to download right from the product page. Huge green flag.",
    name: "xLabRat99",
    username: "@xLabRat99",
  },
  // --- Packaging (short) ---
  {
    text: "Arrived sealed, secure, and perfectly packed. Perfect.",
    name: "Sofia Marin",
    username: "@sofia.marin",
  },
  // --- Site ---
  {
    text: "Clean, simple layout that's so easy to navigate. Everything I needed was a click away and reordering takes seconds.",
    name: "Tyler Quinn",
    username: "@tylerquinn",
  },
  // --- Pricing ---
  {
    text: "Affordable pricing without cutting corners. I'm getting lab-grade quality for less than I used to pay elsewhere.",
    name: "Bianca Russo",
    username: "@bianca.russo",
  },
  // --- COA (short) ---
  {
    text: "COAs for every batch. Love the transparency.",
    name: "PeptidePilot",
    username: "@peptidepilot",
  },
  // --- Ryan / customer service ---
  {
    text: "Shout out to Ryan, top-tier support. Quick, friendly, and he clearly knows the products inside and out.",
    name: "NightOwlBio",
    username: "@nightowlbio",
  },
  // --- Shipping (short) ---
  {
    text: "Fast, free shipping every single time. A+.",
    name: "QuantumQuokka",
    username: "@quantumquokka",
  },
  // --- Packaging ---
  {
    text: "Whoever handles packaging deserves a raise. Vials were cushioned and sealed tight, nothing damaged after a long trip.",
    name: "Andre Lewis",
    username: "@andrelewis",
  },
  // --- Site (short) ---
  {
    text: "So easy to use. Found everything fast.",
    name: "ZeroDarkLabs",
    username: "@zerodarklabs",
  },
  // --- COA ---
  {
    text: "Being able to pull up a certificate of analysis for exactly what I ordered gives me total peace of mind. More companies should do this.",
    name: "Caleb Foster",
    username: "@caleb.foster",
  },
  // --- Pricing (short) ---
  {
    text: "Cheapest quality source I've found. Sold.",
    name: "GainsGoblin",
    username: "@gainsgoblin",
  },
];

const REVIEWS: Review[] = REVIEW_DATA.map((r, i) => ({
  ...r,
  color: AVATAR_COLORS[i % AVATAR_COLORS.length],
}));

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ReviewCard({
  review,
  active,
  onSelect,
  light,
}: {
  review: Review;
  active: boolean;
  onSelect: () => void;
  light: boolean;
}) {
  const activeClass = light
    ? "bg-white/85 border-[#d8b4fe] shadow-[0_0_30px_rgba(216,180,254,0.45)] scale-[1.03]"
    : "bg-white/[0.16] border-st-cyan/70 shadow-[0_0_30px_rgba(127,211,255,0.40)] scale-[1.03]";
  const idleClass = light
    ? "bg-white/60 backdrop-blur-md border-white shadow-[0_8px_30px_rgba(167,139,250,0.12)] hover:bg-white/85 hover:border-[#d8b4fe] hover:shadow-[0_0_30px_rgba(216,180,254,0.45)] hover:scale-[1.03]"
    : "bg-white/[0.07] border-white/[0.18] shadow-[inset_0_4px_74px_0_rgba(34,138,227,0.05)] hover:bg-white/[0.16] hover:border-st-cyan/70 hover:shadow-[0_0_30px_rgba(127,211,255,0.40)] hover:scale-[1.03]";
  return (
    <div
      data-review-card
      onClick={onSelect}
      className={`group/review shrink-0 w-[280px] sm:w-[340px] mx-3 rounded-2xl p-5 flex flex-col gap-3 border transition-all duration-300 cursor-pointer [-webkit-tap-highlight-color:transparent] ${
        active ? activeClass : idleClass
      }`}
    >
      <p className={`text-sm leading-relaxed line-clamp-3 min-h-[60px] ${light ? "text-slate-700" : "text-white"}`}>
        {review.text}
      </p>
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-current" />
        ))}
      </div>
      <div className="flex items-center gap-2.5 mt-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ backgroundColor: review.color }}
        >
          {initials(review.name)}
        </div>
        <span className={`text-sm font-medium truncate ${light ? "text-slate-500" : "text-white/80"}`}>
          {review.username}
        </span>
      </div>
    </div>
  );
}

export function ReviewsMarquee({ light = false }: { light?: boolean }) {
  const rowOne = REVIEWS.slice(0, 10);
  const rowTwo = REVIEWS.slice(10);

  // Sticky glow on tap. The active review's key is prefixed by its row
  // ("r1-"/"r2-") so we can pause ONLY that row — the other keeps scrolling.
  const [activeReview, setActiveReview] = useState<string | null>(null);
  useEffect(() => {
    const clear = (e?: Event) => {
      if (e && e.type === "pointerdown") {
        const t = e.target as HTMLElement | null;
        if (t && t.closest("[data-review-card]")) return; // tap on a review → keep
      }
      setActiveReview(null);
    };
    document.addEventListener("pointerdown", clear, { passive: true });
    window.addEventListener("scroll", clear, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", clear);
      window.removeEventListener("scroll", clear);
    };
  }, []);

  const row1Paused = activeReview?.startsWith("r1-") ? "reviews-paused" : "";
  const row2Paused = activeReview?.startsWith("r2-") ? "reviews-paused" : "";

  return (
    <section className="py-10 md:py-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-sans mb-4 ${light ? "text-slate-800" : "text-white"}`}>
          What Researchers Say About{" "}
          <span
            className={`inline-block bg-gradient-to-r bg-clip-text text-transparent ${
              light ? "from-[#f472b6] via-[#a78bfa] to-[#38bdf8]" : "from-[#a78bfa] via-[#8cc6fa] to-[#c2e2ff]"
            }`}
          >
            Simpletide
          </span>
        </h2>
        <p className={`text-base md:text-lg max-w-2xl mx-auto leading-relaxed ${light ? "text-slate-600" : "text-[#ffffff]"}`}>
          Real feedback from the labs and researchers who trust our product and service.
        </p>
      </div>

      <style>{`
        @keyframes reviews-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes reviews-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .reviews-track {
          display: flex;
          width: max-content;
        }
        .reviews-row-1 { animation: reviews-left 60s linear infinite; }
        .reviews-row-2 { animation: reviews-right 65s linear infinite; }
        .reviews-track:hover { animation-play-state: paused; }
        .reviews-track.reviews-paused { animation-play-state: paused; }
        .reviews-fade {
          -webkit-mask-image: linear-gradient(to right, transparent 0, #000 22%, #000 78%, transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 22%, #000 78%, transparent 100%);
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="overflow-hidden reviews-fade py-8 -my-4">
          <div className={`reviews-track reviews-row-1 ${row1Paused}`}>
            {[...rowOne, ...rowOne].map((r, i) => {
              const key = `r1-${i}`;
              return (
                <ReviewCard
                  key={key}
                  review={r}
                  active={activeReview === key}
                  onSelect={() => setActiveReview(key)}
                  light={light}
                />
              );
            })}
          </div>
        </div>
        <div className="overflow-hidden reviews-fade py-8 -my-4">
          <div className={`reviews-track reviews-row-2 ${row2Paused}`}>
            {[...rowTwo, ...rowTwo].map((r, i) => {
              const key = `r2-${i}`;
              return (
                <ReviewCard
                  key={key}
                  review={r}
                  active={activeReview === key}
                  onSelect={() => setActiveReview(key)}
                  light={light}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
