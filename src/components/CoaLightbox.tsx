import { X } from "lucide-react";

export type CoaData = { name: string; url: string; file: string };

type CoaLightboxProps = {
  coa: CoaData;
  onClose: () => void;
};

export function CoaLightbox({ coa, onClose }: CoaLightboxProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`COA preview: ${coa.name}`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label="Close preview"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="relative max-w-5xl w-full max-h-[90vh] bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-center">
          <h2 className="text-lg font-semibold text-white">{coa.name}</h2>
        </div>
        <img
          src={coa.url}
          alt={`COA for ${coa.name}`}
          className="w-full max-h-[75vh] object-contain bg-white rounded-lg"
        />
      </div>
    </div>
  );
}
