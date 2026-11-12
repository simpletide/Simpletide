import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { PdfCanvas } from "@/components/PdfCanvas";

export type CoaReport = {
  size: string;
  /** Batch/lot the certificate was issued against. */
  lot: string;
  url: string;
};

type CoaLightboxProps = {
  name: string;
  reports: CoaReport[];
  initialSize?: string;
  onClose: () => void;
};

/** "10mg" -> "10 mg", "10ML" -> "10 ML" */
export function sizeLabel(size: string): string {
  return size.replace(/(\d)([a-zA-Z])/, "$1 $2");
}

export function CoaLightbox({ name, reports, initialSize, onClose }: CoaLightboxProps) {
  const startIdx = reports.findIndex((r) => r.size === initialSize);
  const [idx, setIdx] = useState(startIdx >= 0 ? startIdx : 0);

  const report = reports[idx];
  const multiSize = reports.length > 1;
  // Legacy certificates are scans; everything parsed from a PDF is a PDF.
  const isImage = !!report && /\.(png|jpe?g|webp|gif|avif)$/i.test(report.url);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Certificate of Analysis: ${name}`}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="truncate text-base font-semibold text-slate-900 md:text-lg">
            {name}
            {report ? ` ${sizeLabel(report.size)}` : ""} — Certificate of Analysis
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {multiSize && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">Size</span>
            {reports.map((r, i) => (
              <button
                key={r.size}
                type="button"
                onClick={() => setIdx(i)}
                aria-pressed={i === idx}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  i === idx
                    ? "border-[#7c3aed] bg-white text-[#7c3aed]"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                }`}
              >
                {sizeLabel(r.size)}
              </button>
            ))}
          </div>
        )}

        {report && (
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-400">Batch</span>
            <span className="rounded-full bg-[#141414] px-3.5 py-1.5 text-xs font-semibold text-white">
              Current batch · {report.lot}
            </span>
          </div>
        )}

        <div className="relative flex-1 bg-slate-100" style={{ minHeight: "60vh" }}>
          {report ? (
            isImage ? (
              <img
                key={report.url}
                src={report.url}
                alt={`${name} — Certificate of Analysis`}
                className="absolute inset-0 h-full w-full bg-white object-contain"
              />
            ) : (
              <PdfCanvas key={report.url} url={report.url} />
            )
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-sm text-slate-500">
              No certificate available.
            </div>
          )}
        </div>

        {report && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-5 py-3">
            <p className="truncate text-xs text-slate-500">Certificate of Analysis</p>
            <a
              href={report.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#7c3aed] hover:underline"
            >
              <ExternalLink className="h-4 w-4" /> Open in new tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
