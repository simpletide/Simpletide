import { Link, useRouterState } from "@tanstack/react-router";
import { Search, X, ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SHOP_PRODUCTS, type ShopProduct } from "@/lib/shop-products";
import { slugFor, seoProductSlug, descriptorFor } from "@/lib/catalog";
import { useCart } from "@/lib/cart-context";
import { ProductCard } from "@/components/ProductCard";

// Curated "Trending" chips. `product` must match a SHOP_PRODUCTS name so the
// chip can deep-link to that product's detail page.
type TrendItem = { label: string; product: string };

const TRENDING: TrendItem[] = [
  { label: "GLP-3 RT", product: "GLP-3 RT (RETA)" },
  { label: "Tesamorelin", product: "Tesamorelin" },
  { label: "BPC-157", product: "BPC-157" },
  { label: "MOTS-c", product: "MOTS-c" },
];

const MAX_RESULTS = 8;

function trendingLink(name: string) {
  const slug = slugFor(name);
  return slug
    ? ({ to: "/product/$slug" as const, params: { slug: seoProductSlug(slug) } })
    : null;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isOpen: cartOpen } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const prevPath = useRef(pathname);

  // Focus the field when opening; clear the query when closing.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  // Escape to close + lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Close when the cart opens (e.g. after adding a result to the cart).
  useEffect(() => {
    if (open && cartOpen) onClose();
  }, [open, cartOpen, onClose]);

  // Close on any route change (clicking a result card or trending chip).
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const q = query.trim().toLowerCase();

  const results = useMemo<ShopProduct[]>(() => {
    const pool = SHOP_PRODUCTS.filter((p) => !!slugFor(p.name));
    if (!q) {
      return TRENDING.map((t) => pool.find((p) => p.name === t.product)).filter(
        (p): p is ShopProduct => !!p,
      );
    }
    return pool
      .filter((p) => {
        const hay = `${p.name} ${p.category ?? ""} ${descriptorFor(p.name) ?? ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, MAX_RESULTS);
  }, [q]);

  return (
    <div className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Centered floating popover that drops in just under the nav. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className={`absolute left-1/2 top-[3rem] w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="flex max-h-[calc(100dvh-5rem)] flex-col overflow-y-auto">
          {/* Search field */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search for a product..."
              aria-label="Search for a product"
              className="w-full flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-4 sm:px-5 sm:py-5">
            {/* Trending */}
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trending</h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {TRENDING.map((t) => {
                  const link = trendingLink(t.product);
                  if (!link) return null;
                  return (
                    <Link
                      key={t.label}
                      {...link}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      {t.label}
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-slate-900">
                {q ? "Search " : "Relevant "}
                <span className="text-[#8b5cf6]">{q ? "Results" : "Products"}</span>
              </h3>
              {results.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No products match “{query.trim()}”. Try a different name.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  {results.map((p) => (
                    <ProductCard key={p.name} product={p} compact />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
