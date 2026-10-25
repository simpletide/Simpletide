export type CoaData = { name: string; url: string; file: string };

type CoaCardProps = {
  coa: CoaData;
  onClick?: (coa: CoaData) => void;
};

export function CoaCard({ coa, onClick }: CoaCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <button
        type="button"
        onClick={() => onClick?.(coa)}
        className="group relative block w-full focus:outline-none focus:ring-2 focus:ring-st-cyan/60 rounded-xl overflow-hidden border border-slate-200"
        aria-label={`View COA for ${coa.name}`}
      >
        <img
          src={coa.url}
          alt={`COA for ${coa.name}`}
          loading="lazy"
          className="w-full object-contain bg-white"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium px-3 py-1 rounded-full border border-white/40 bg-white/10 backdrop-blur-md">
            Click to enlarge
          </span>
        </span>
      </button>
      <h3 className="text-base font-semibold text-slate-900 mt-4">{coa.name}</h3>
    </div>
  );
}
