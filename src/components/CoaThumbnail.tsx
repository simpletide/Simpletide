import { useEffect, useRef, useState } from "react";

/**
 * Page-one preview of a certificate, for placing inline next to a product.
 *
 * pdf.js is a large chunk and touches `DOMMatrix` at import time, so it is
 * imported on the client only, and only once this thumbnail has scrolled into
 * view — a product page that nobody scrolls never pays for it.
 */
export function CoaThumbnail({ url, className }: { url: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    let task: { promise: Promise<void>; cancel?: () => void } | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let doc: any = null;

    (async () => {
      const host = hostRef.current;
      if (!host) return;
      try {
        // The LEGACY build, matching PdfCanvas — the modern entry calls newer
        // JS methods some browsers lack and then throws on render().
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default as string;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        doc = await pdfjs.getDocument({
          url,
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
        }).promise;
        if (cancelled || !doc) return;

        const page = await doc.getPage(1);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        // Render well above display size: at thumbnail scale the certificate's
        // body text is sub-pixel, and a 1:1 render reads as grey mush.
        const viewport = page.getViewport({ scale: 640 / base.width });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        // Full width, natural height: the container crops the overflow, so the
        // thumbnail shows the top of the certificate (lab mark, product, PASS).
        canvas.style.width = "100%";
        canvas.style.height = "auto";
        canvas.style.display = "block";
        host.replaceChildren(canvas);

        const render = page.render({ canvas, viewport });
        task = render;
        await render.promise;
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("COA thumbnail render failed:", err);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel?.();
      doc?.destroy?.();
    };
  }, [visible, url]);

  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-white ${className ?? ""}`}>
      {/* The canvas host keeps no React children of its own: the render path
          calls replaceChildren() on it, which would otherwise delete a node
          React still expects to own and crash on the next update. */}
      <div ref={hostRef} className="h-full w-full" />
      {status !== "ready" && <div className="absolute inset-0 animate-pulse bg-slate-100" />}
    </div>
  );
}
