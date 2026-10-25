import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shared "Subscribe to our Newsletter" banner.
 *
 * - `variant="dark"` (default): glass card for the homepage's blue mist
 *   background. Callers must place it on the Starfield mist (transparent).
 *   The homepage renders identically to before this prop existed.
 * - `variant="light"`: Peptora-style light treatment for the product page —
 *   a white section with a lavender→pink gradient card, dark text, and a hover
 *   glow. Matches peptoralabs.com's product-page newsletter.
 * - `variant="mist"`: light text treatment on a transparent section with a
 *   frosted white card, for the homepage's white rainbow-mist background.
 *
 * `className` overrides the section spacing; it defaults to the homepage value.
 */
export function NewsletterSection({
  className,
  variant = "dark",
  showVials = true,
  vialsOnMobile = false,
}: {
  className?: string;
  variant?: "dark" | "light" | "mist";
  showVials?: boolean;
  vialsOnMobile?: boolean;
}) {
  const onMist = variant === "mist";
  const light = variant === "light" || onMist;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    const trimmed = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const { error } = await supabase.functions.invoke("send-newsletter-welcome-email", {
        body: { email: trimmed },
      });
      if (error) throw error;
      setStatus("success");
      setMessage("You're subscribed! Check your inbox for a welcome email.");
      setEmail("");
    } catch (err) {
      console.error("Newsletter subscribe failed:", err);
      setStatus("error");
      setMessage("Something went wrong. Please try again in a moment.");
    }
  };

  const feedbackColor = light
    ? status === "success"
      ? "text-emerald-600"
      : "text-red-600"
    : status === "success"
      ? "text-emerald-300"
      : "text-red-300";

  return (
    <section className={`${light && !onMist ? "bg-white" : ""} ${className ?? "pb-16 md:pb-24"}`.trim()}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Floating vials on the edges */}
          {showVials && (
            <>
              <img
                src="/images/hero-vials/simpletide-bpc157-10mg.png"
                alt="Simpletide BPC-157 research vial"
                className={`${vialsOnMobile ? "block" : "hidden"} md:block pointer-events-none absolute z-20 -left-8 -top-10 w-[92px] md:-left-10 md:-top-16 md:w-[120px] lg:-left-20 lg:-top-24 lg:w-[150px] object-contain drop-shadow-2xl rotate-[16deg]`}
                loading="lazy"
              />
              <img
                src="/images/hero-vials/simpletide-selank-10mg.png"
                alt="Simpletide Selank research vial"
                className={`${vialsOnMobile ? "block" : "hidden"} md:block pointer-events-none absolute z-20 -right-8 -bottom-6 w-[92px] md:-right-10 md:-bottom-14 md:w-[120px] lg:-right-20 lg:-bottom-20 lg:w-[150px] object-contain drop-shadow-2xl rotate-[12deg] md:rotate-[20deg]`}
                loading="lazy"
              />
            </>
          )}

          {/* Banner — glass on mist (dark) or Peptora light gradient card */}
          <div
            className={`relative z-10 rounded-3xl px-6 sm:px-10 ${
              vialsOnMobile ? "py-20" : "py-10"
            } md:py-12 ${
              onMist
                ? "border border-white bg-white/60 backdrop-blur-md shadow-[0_8px_30px_rgba(167,139,250,0.12)] transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(216,180,254,0.45)]"
                : light
                ? "border-2 border-white [background-image:linear-gradient(rgb(221,214,254)_11%,rgb(237,233,254)_100%)] transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(167,139,250,0.24)]"
                : "bg-white/[0.07] border border-white/[0.18] shadow-[inset_0_4px_74px_0_rgba(34,138,227,0.05)]"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
                  <span className={light ? "text-slate-900" : "text-white"}>Subscribe to our </span>
                  <span
                    className={
                      onMist
                        ? "inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent"
                        : light
                        ? "inline-block bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8] bg-clip-text text-transparent"
                        : "inline-block bg-gradient-to-r from-[#a78bfa] via-[#8cc6fa] to-[#c2e2ff] bg-clip-text text-transparent"
                    }
                  >
                    Newsletter
                  </span>
                </h2>
                <p
                  className={`text-sm md:text-base mt-3 ${light ? "text-slate-500" : "text-white/90"}`}
                >
                  Subscribe to our newsletter to get daily insights, news, updates.
                </p>
              </div>
              <div>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 lg:justify-end"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") {
                        setStatus("idle");
                        setMessage("");
                      }
                    }}
                    placeholder="Enter email address"
                    className={
                      light
                        ? "flex-1 lg:max-w-xs bg-white border border-slate-300 rounded-full px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#a78bfa] transition-colors"
                        : "flex-1 lg:max-w-xs bg-white/[0.05] border border-white/[0.18] rounded-full px-5 py-3 text-white placeholder-white/50 focus:outline-none focus:border-[#6aa8ff]/70 transition-colors"
                    }
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className={
                      (onMist
                        ? "group inline-flex items-center justify-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] text-white [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] px-7 py-3 rounded-full font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(196,181,253,0.7)] whitespace-nowrap"
                        : light
                        ? "group inline-flex items-center justify-center bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white px-7 py-3 rounded-full font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(167,139,250,0.45)] whitespace-nowrap"
                        : "group inline-flex items-center justify-center ring-1 ring-white/70 bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white px-7 py-3 rounded-full font-bold transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(167,139,250,0.45)] whitespace-nowrap") +
                      " disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    }
                  >
                    <span className="transition-transform duration-300 ease-in-out">
                      {status === "loading" ? "Subscribing..." : "Subscribe"}
                    </span>
                    {status !== "loading" && (
                      <div className="w-0 overflow-hidden transition-all duration-300 ease-in-out group-hover:w-5 group-hover:ml-2">
                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
                      </div>
                    )}
                  </button>
                </form>
                {message && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={`mt-3 text-sm lg:text-right ${feedbackColor}`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
