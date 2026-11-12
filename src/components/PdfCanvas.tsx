import { useEffect, useRef, useState } from "react";

/**
 * Renders EVERY page of a PDF into a scrollable column of canvases.
 *
 * Mobile browsers — iOS Safari especially — paint only the FIRST page of a PDF
 * shown in an <iframe>, so the rest of a multi-page certificate is unreachable
 * without opening the file in a new tab. Drawing the pages with pdf.js keeps
 * them all readable inline.
 *
 * pdf.js touches the DOM and `DOMMatrix` at import time, so it is imported on
 * the client inside the effect and never runs during SSR.
 */
export function PdfCanvas({ url, className }: { url: string; className?: string }) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const tasks: Array<{ cancel?: () => void }> = [];
    let doc: { numPages: number; getPage: (n: number) => Promise<unknown>; destroy?: () => void } | null = null;

    async function run() {
      const host = pagesRef.current;
      if (!host) return;
      setStatus("loading");
      host.replaceChildren();

      try {
        // The LEGACY build, not the modern entry: the modern one calls newer JS
        // methods that some browsers lack, and render() then throws.
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default as string;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        // The ILS certificates reference non-embedded standard fonts
        // (Helvetica/Times). Without the matching data files pdf.js throws on
        // render; these are served from public/pdfjs/.
        const loadingTask = pdfjs.getDocument({
          url,
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc = (await loadingTask.promise) as any;
        if (cancelled || !doc) return;

        const cssWidth = Math.max(host.clientWidth, 280);
        // Supersample: a canvas is a raster, so the backing store is rendered
        // larger than its on-screen size and downsampled, which keeps the small
        // print on a COA legible instead of soft.
        const quality = Math.min(Math.max((window.devicePixelRatio || 1) * 2, 3), 4);
        const MAX_BACKING_WIDTH = 3200;

        for (let n = 1; n <= doc.numPages; n++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const page = (await doc.getPage(n)) as any;
          if (cancelled) return;

          const base = page.getViewport({ scale: 1 });
          let renderScale = (cssWidth / base.width) * quality;
          if (base.width * renderScale > MAX_BACKING_WIDTH) {
            renderScale = MAX_BACKING_WIDTH / base.width;
          }
          const viewport = page.getViewport({ scale: renderScale });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block w-full rounded-sm bg-white shadow-sm";
          if (n > 1) canvas.style.marginTop = "10px";
          host.appendChild(canvas);

          const task = page.render({ canvas, viewport });
          tasks.push(task);
          await task.promise;
          if (cancelled) return;
        }

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          console.error("Inline PDF render failed:", err);
          setStatus("error");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      tasks.forEach((t) => t.cancel?.());
      doc?.destroy?.();
    };
  }, [url]);

  return (
    <div className={`absolute inset-0 overflow-auto overscroll-contain bg-slate-100 p-2 sm:p-4 ${className ?? ""}`}>
      <div ref={pagesRef} className="mx-auto w-full max-w-4xl" />
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          Loading certificate…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-slate-500">
          Couldn’t display this PDF inline. Use “Open in new tab” below.
        </div>
      )}
    </div>
  );
}
