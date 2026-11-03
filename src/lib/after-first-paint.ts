/**
 * Schedules work for just after the browser has painted.
 *
 * Used to move non-critical work (the Supabase SDK, the chat widget, the toast
 * host) off the first-load path without deferring it so far that behaviour
 * changes. `requestIdleCallback` isn't available in Safari, hence the fallback.
 *
 * Returns a cancel function.
 */
export function afterFirstPaint(run: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let idleHandle: number | undefined;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const schedule = () => {
    if (cancelled) return;
    const ric = (window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }).requestIdleCallback;

    if (typeof ric === "function") {
      idleHandle = ric(run, { timeout: 2000 });
    } else {
      timeoutHandle = setTimeout(run, 1);
    }
  };

  // Waiting for `load` before queuing idle work matters more than it looks:
  // parsing a deferred chunk during hydration lands squarely in the window
  // Lighthouse measures as Total Blocking Time, and competes with the main
  // thread while the page is becoming interactive. By `load` the page has
  // painted and hydrated, so this is still "right after first paint" from a
  // visitor's point of view, and sessions still refresh on every page view.
  if (document.readyState === "complete") {
    schedule();
    return () => {
      cancelled = true;
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (idleHandle !== undefined && typeof cic === "function") cic(idleHandle);
    };
  }

  window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    const cic = (window as unknown as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
    if (idleHandle !== undefined && typeof cic === "function") cic(idleHandle);
  };
}
