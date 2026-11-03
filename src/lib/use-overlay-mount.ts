import { useEffect, useState } from "react";

/**
 * Keeps a lazily-mounted overlay in the tree for the length of its close
 * transition, so unmounting doesn't cut the animation short.
 *
 * Overlays here (search, mobile menu, cart drawer) used to render on every page
 * and were merely hidden with opacity/transform, which meant their markup and
 * images were downloaded by visitors who never opened them.
 */
export function useOverlayMount(open: boolean, exitMs = 300): boolean {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(t);
  }, [open, exitMs]);

  return mounted;
}

/**
 * Flips to true one frame after mount so an element that is mounted already in
 * its "open" state still plays its entrance transition. Without this, lazily
 * mounting an overlay makes it appear instantly instead of sliding/fading in.
 */
export function useEntered(active: boolean): boolean {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!active) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return entered;
}
