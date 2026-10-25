import { useEffect } from "react";
import type { CSSProperties } from "react";

/**
 * Stagger helper: sets the `--reveal-delay` custom property consumed by the
 * `[data-reveal]` CSS (see styles.css). Use on a revealed element to delay its
 * entrance, e.g. `style={revealDelay(120)}`.
 */
export const revealDelay = (ms: number): CSSProperties =>
  ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

/**
 * Peptora-style entrance + scroll reveals (all screen sizes).
 *
 * Elements tagged with `data-reveal` start hidden (opacity 0, nudged down — see
 * styles.css) and animate in when an IntersectionObserver sets the
 * `data-reveal-shown` attribute. Above-the-fold elements reveal immediately on
 * load; the rest reveal as they scroll into view. Use `data-reveal="fade"` for
 * an opacity-only reveal (no rise). With reduced-motion (or no
 * IntersectionObserver) everything is shown at once, and a 2.5s failsafe
 * guarantees content is never left invisible.
 *
 * The revealed state is an ATTRIBUTE (not a class) on purpose: React only
 * manages props it renders, so a re-render that rewrites an element's
 * `className` (e.g. an interactive card toggling its hover/active glow) can't
 * strip the revealed state and make the element disappear.
 *
 * Pass `dep` when the set of `[data-reveal]` nodes changes after mount (e.g. a
 * product slug or async data) so newly rendered nodes get observed too;
 * already-revealed nodes are skipped via `:not([data-reveal-shown])`.
 */
export function useReveal(dep?: unknown) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reveal = (n: Element) => n.setAttribute("data-reveal-shown", "");
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-reveal]:not([data-reveal-shown])",
      ),
    );
    if (nodes.length === 0) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    nodes.forEach((n) => io.observe(n));

    // Failsafe: if anything is still hidden after 2.5s (e.g. observer missed),
    // reveal it so content can never get stuck invisible.
    const failsafe = window.setTimeout(() => {
      nodes.forEach(reveal);
    }, 2500);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, [dep]);
}
