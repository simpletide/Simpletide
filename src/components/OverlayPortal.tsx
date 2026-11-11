import { createPortal } from "react-dom";
import { useState, type ReactNode } from "react";

/**
 * Renders an overlay into <body>.
 *
 * The header is `backdrop-blur`, and a backdrop-filter makes an element the
 * containing block for its `position: fixed` descendants. An overlay left
 * inside the header is therefore sized and positioned against the header box
 * rather than the viewport: a `fixed inset-0` scrim only covers the header
 * strip, and `h-full` resolves to the header's height instead of the screen's.
 *
 * Overlays here mount on interaction, never during SSR, so `document` is
 * available on the first render. Reading it there rather than in an effect
 * keeps the entrance transition intact — a null first render would let the
 * "entered" frame pass before the element existed, and it would pop open.
 */
export function OverlayPortal({ children }: { children: ReactNode }) {
  const [host] = useState(() => (typeof document === "undefined" ? null : document.body));
  return host ? createPortal(children, host) : null;
}
