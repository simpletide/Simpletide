import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";

import { markAgeVerifiedClient, sanitizeReturnPath } from "@/lib/age-gate";

const SUPPORT_EMAIL = "support@simpletide.com";

export const Route = createFileRoute("/age")({
  validateSearch: (search: Record<string, unknown>) => ({
    return: sanitizeReturnPath(search.return),
  }),
  head: () => ({
    meta: [
      { title: "Researcher Verification | Simpletide" },
      { name: "description", content: "Simpletide researcher verification." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AgeGatePage,
});

const GRADIENT_TEXT =
  "bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent";

function CheckRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all duration-200 [-webkit-tap-highlight-color:transparent] ${
        checked
          ? "border-[#a78bfa] shadow-[0_0_0_1px_rgba(167,139,250,0.35),0_4px_16px_rgba(167,139,250,0.12)]"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${
          checked
            ? "border-[#8b5cf6] bg-[#8b5cf6] text-white"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-[13.5px] leading-snug text-slate-700">{children}</span>
    </button>
  );
}

/**
 * Dedicated `/age?return=...` verification page.
 * Intentionally contains zero store UI, zero product imagery, and zero compound names.
 */
function AgeGatePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const returnTo = sanitizeReturnPath(search.return);

  const [age, setAge] = useState(false);
  const [researcher, setResearcher] = useState(false);

  const canEnter = age && researcher;

  const handleEnter = () => {
    if (!canEnter) return;
    markAgeVerifiedClient();
    if (typeof window !== "undefined") {
      window.location.replace(returnTo);
      return;
    }
    navigate({ to: returnTo as "/" });
  };

  const handleExit = () => {
    if (typeof window !== "undefined") {
      window.location.href = "https://www.google.com";
    }
  };

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden font-sans text-slate-900"
      style={{
        background:
          "linear-gradient(180deg, #fdf2f8 0%, #f3e8ff 46%, #eef4ff 100%)",
      }}
    >
      {/* Subtle decorative pastel waves — zero store/product imagery */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-55 blur-3xl"
          style={{ background: "radial-gradient(circle, #f9a8d4 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-24 top-1/4 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #c4b5fd 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full opacity-45 blur-3xl"
          style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)" }}
        />
        <svg
          className="absolute bottom-0 left-0 h-44 w-full opacity-35"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
        >
          <path
            fill="#c4b5fd"
            fillOpacity="0.35"
            d="M0,128 C240,72 480,180 720,124 C960,68 1200,168 1440,112 L1440,220 L0,220 Z"
          />
          <path
            fill="#93c5fd"
            fillOpacity="0.3"
            d="M0,164 C300,118 600,204 900,152 C1140,110 1320,174 1440,150 L1440,220 L0,220 Z"
          />
        </svg>
      </div>

      {/* Main centered verification card */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10">
        {/* Wordmark */}
        <div className="mb-6 text-center">
          <span
            className="text-2xl font-light tracking-[0.3em] text-[#344a7c] sm:text-3xl"
            style={{
              fontFamily:
                '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            <span className="bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent">
              SIMPLE
            </span>
            TIDE
          </span>
        </div>

        {/* Card */}
        <section
          aria-labelledby="age-gate-title"
          className="w-full max-w-[460px] rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_20px_60px_-15px_rgba(76,29,149,0.18)] backdrop-blur-sm sm:p-8"
        >
          <h1
            id="age-gate-title"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]"
          >
            Researcher <span className={GRADIENT_TEXT}>Verification</span>
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-slate-500">
            Simpletide sells research material exclusively to qualified researchers and
            laboratories for in vitro and laboratory use. Please confirm before continuing.
          </p>

          <div className="mt-6 space-y-3">
            <CheckRow checked={age} onToggle={() => setAge((v) => !v)}>
              I am at least <span className="font-semibold text-slate-900">21 years of age</span>.
            </CheckRow>
            <CheckRow checked={researcher} onToggle={() => setResearcher((v) => !v)}>
              I confirm I am a{" "}
              <span className="font-semibold text-slate-900">qualified researcher</span> purchasing
              for{" "}
              <span className="font-semibold text-slate-900">in vitro / laboratory research</span>{" "}
              only — not for human or veterinary use.
            </CheckRow>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            disabled={!canEnter}
            className={`group mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-bold transition-all duration-300 ${
              canEnter
                ? "bg-slate-950 text-white shadow-[0_12px_28px_-8px_rgba(15,23,42,0.4)] hover:-translate-y-0.5 hover:bg-slate-900"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            Enter Simpletide
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-300 ${
                canEnter ? "group-hover:translate-x-1" : ""
              }`}
            />
          </button>

          <p className="mt-5 text-[11px] leading-relaxed text-slate-400">
            By proceeding you affirm the statements above are true. Products are not for human or
            veterinary use, not for use in diagnostic procedures, and have not been evaluated by the
            U.S. Food and Drug Administration.{" "}
            <Link
              to="/disclaimer"
              className="font-medium text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              Full disclaimer.
            </Link>
          </p>
        </section>

        {/* Exit link */}
        <button
          type="button"
          onClick={handleExit}
          className="mt-5 text-[13px] text-slate-500 transition-colors hover:text-slate-700"
        >
          Not a researcher? <span className="font-semibold text-[#7c3aed]">Exit</span>
        </button>
      </main>

      {/* Minimal compliance footer */}
      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 px-5 pb-6 text-xs text-slate-500">
        <span>© 2026 Simpletide</span>
        <nav aria-label="Policies" className="flex items-center gap-4">
          <Link to="/terms-of-service" className="hover:text-slate-800 hover:underline">
            Terms
          </Link>
          <Link to="/privacy-policy" className="hover:text-slate-800 hover:underline">
            Privacy
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-slate-800 hover:underline">
            Contact
          </a>
        </nav>
      </footer>
    </div>
  );
}
