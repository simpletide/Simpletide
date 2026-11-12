import { useState } from "react";
import { ShieldCheck, Check, FileText, Copy } from "lucide-react";
import { coaPanel, type CoaPanel } from "@/lib/coa-data";
import { sizeLabel } from "@/components/CoaLightbox";

export type CoaCardProduct = {
  slug: string;
  name: string;
  descriptor: string;
  image: string | null;
  sizes: string[];
};

/**
 * The assays a certificate actually ran. Built per certificate rather than
 * from a fixed list: not every compound is screened for everything — Bac Water
 * carries no peptide content, and three certificates run no fentanyl screen —
 * and a static checklist would tick boxes the lab never tested.
 */
function assaysFor(panel: CoaPanel): string[] {
  const assays: string[] = [];
  if (panel.purity) assays.push("Purity (HPLC)");
  if (panel.identity) assays.push("Identity (HPLC-RTM)");
  if (panel.endotoxin) assays.push("Endotoxins (USP <85>)");
  if (panel.heavyMetals) assays.push("Heavy Metals (ICP-MS)");
  if (panel.sterility) assays.push("Sterility (PCR)");
  if (panel.netContent) assays.push("Net Peptide Content");
  if (panel.fentanyl) assays.push("Fentanyl Screen");
  return assays;
}

export function CoaCard({
  product,
  onView,
}: {
  product: CoaCardProduct;
  onView: (slug: string, size: string) => void;
}) {
  const [size, setSize] = useState(product.sizes[0]);
  const [copied, setCopied] = useState(false);

  const panel = coaPanel(product.slug, size);
  if (!panel) return null;

  const assays = assaysFor(panel);

  const copyLot = () => {
    try {
      void navigator.clipboard?.writeText(panel.lot);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-[rgba(124,58,237,0.5)] hover:shadow-[0_0_24px_4px_rgba(124,58,237,0.12),0_6px_20px_rgba(0,0,0,0.05)]">
      {/* Header — vial, name + descriptor, verified badge */}
      <div className="flex items-start gap-3.5">
        <div className="relative isolate flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#ede9fe] to-[#e0f2fe]">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain object-center drop-shadow-[0_10px_20px_rgba(8,20,46,0.18)]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <FileText className="h-7 w-7 text-[#7c3aed]" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{product.name}</h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f3eeff] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed] ring-1 ring-inset ring-[#7c3aed]/15">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          </div>
          {product.descriptor && (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-slate-500">{product.descriptor}</p>
          )}
          {product.sizes.length > 1 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={s === size}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    s === size
                      ? "bg-[#7c3aed] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {sizeLabel(s)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Headline stats — purity + net content */}
      <div className="mt-4 flex items-stretch gap-2.5">
        <div className="flex-1 rounded-xl bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] px-4 py-3 ring-1 ring-inset ring-[#7c3aed]/10">
          <p className="text-[22px] font-semibold leading-none tracking-tight text-[#7c3aed]">{panel.purity || "—"}</p>
          <p className="mt-1.5 text-[11px] font-medium text-slate-500">Purity · HPLC</p>
        </div>
        <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-100">
          {panel.netContent ? (
            <>
              <p className="text-[22px] font-semibold leading-none tracking-tight text-slate-900">
                {panel.netContent}
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-slate-500">Net content</p>
            </>
          ) : (
            <>
              <ShieldCheck className="h-[22px] w-[22px] text-[#7c3aed]" />
              <p className="mt-1.5 text-[11px] font-medium text-slate-500">Lab verified</p>
            </>
          )}
        </div>
      </div>

      {/* Batch + tested */}
      <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100 text-sm">
        <div className="flex items-center justify-between py-2">
          <dt className="text-slate-500">Batch / Lot</dt>
          <dd>
            <button
              type="button"
              onClick={copyLot}
              className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-slate-900 transition-colors hover:text-[#7c3aed]"
              title="Copy lot number"
            >
              {panel.lot}
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[#7c3aed]" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-slate-400" />
              )}
            </button>
          </dd>
        </div>
        <div className="flex items-center justify-between py-2">
          <dt className="text-slate-500">Tested</dt>
          <dd className="font-semibold text-slate-900">{panel.tested}</dd>
        </div>
      </dl>

      {/* Assays performed */}
      <div className="mt-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assays performed</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-slate-600">
          {assays.map((a) => (
            <li key={a} className="flex items-center gap-1.5">
              <Check className="h-3 w-3 shrink-0 text-[#7c3aed]" /> {a}
            </li>
          ))}
        </ul>
      </div>

      {/* Lab attribution. The assay count is whatever this certificate claims
          for itself; many state none, so it is only shown when present. */}
      <p className="mt-3.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#7c3aed]" />
        {panel.assayCount ? `Independently ${panel.assayCount}× tested by` : "Independently tested by"}{" "}
        <span className="font-semibold text-slate-700">ILS Laboratories</span>
      </p>

      {/* Footer — pinned so every card's button aligns */}
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => onView(product.slug, size)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-[1.06]"
        >
          View COA <FileText className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
