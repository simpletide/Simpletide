import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { parsePrice } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { SHOP_PRODUCTS } from "@/lib/shop-products";
import { absoluteUrl, pageSeoHead } from "@/lib/site-seo";
import { useReveal, revealDelay } from "@/lib/use-reveal";

type ProductsSearch = { category?: string; page?: number };

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>): ProductsSearch => {
    const out: ProductsSearch = {};
    if (typeof search.category === "string") out.category = search.category;
    const p = Number(search.page);
    if (Number.isFinite(p) && p > 1) out.page = Math.floor(p);
    return out;
  },
  head: () => ({
    ...pageSeoHead({
      path: "/products",
      title: "Products | Simpletide Research Compounds",
      description: "Browse Simpletide's catalog of high-purity research compounds for laboratory use.",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Premium Research Compounds Catalog",
          url: absoluteUrl("/products"),
          description: "Catalog of high-purity research compounds offered by Simpletide.",
        }),
      },
    ],
  }),
  component: ProductsPage,
});

const PER_PAGE = 16;

const FILTERS = [
  "All products",
  "Metabolic Research",
  "GH Research",
  "Tissue Repair Research",
  "Cellular Research",
  "Neuro Research",
] as const;
type Filter = typeof FILTERS[number];

function ProductsPage() {
  const { category, page: pageParam } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const filterFromParam = (value?: string): Filter =>
    (FILTERS as readonly string[]).includes(value ?? "") ? (value as Filter) : "All products";
  const [active, setActive] = useState<Filter>(filterFromParam(category));
  const [query, setQuery] = useState("");

  // Sync the active category when arriving via a deep link (e.g. footer links).
  useEffect(() => {
    setActive(filterFromParam(category));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc" | "newest" | "name-asc" | "name-desc">("popular");

  const filtered = useMemo(() => {
    return SHOP_PRODUCTS.filter((p) => {
      const matchesCat = active === "All products" || p.category === active;
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [active, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "price-asc":
        return arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
      case "price-desc":
        return arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
      case "newest":
        return arr.reverse();
      case "name-asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "popular":
      default:
        return arr;
    }
  }, [filtered, sort]);

  // Page is driven entirely by the URL (?page=N). This keeps it intact when you
  // open a product and come back, and lets the browser Back button step
  // page → page (then off the shop page) the way users expect.
  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const page = Math.min(Math.max(1, pageParam ?? 1), totalPages);

  // Drop ?page (back to page 1) when the filter / query / sort changes.
  const resetPage = () => {
    if (!pageParam) return;
    navigate({ to: "/products", search: (prev) => ({ ...prev, page: undefined }), replace: true });
  };

  const paged = useMemo(
    () => sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [sorted, page],
  );

  // Always start at the top when the page is (re)entered or changed. Scroll
  // restoration is disabled for this route (see router.tsx), so Back lands here
  // instead of at the bottom where the pagination buttons live.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped === page) return;

    // Build hrefs that preserve the current category/search params.
    const base = new URLSearchParams(window.location.search);
    const hrefFor = (p: number) => {
      const params = new URLSearchParams(base.toString());
      if (p > 1) params.set("page", String(p));
      else params.delete("page");
      const qs = params.toString();
      return qs ? `/products?${qs}` : "/products";
    };

    // On an upward jump (e.g. clicking "3" while on page 1), push the in-between
    // pages too so the browser Back button steps one page at a time
    // (3 → 2 → 1 → off the shop) instead of skipping back to where you jumped
    // from. Adjacent / downward clicks are a single push (unchanged).
    if (clamped > page + 1) {
      for (let p = page + 1; p < clamped; p++) router.history.push(hrefFor(p));
    }
    router.history.push(hrefFor(clamped));
  };

  // Re-run reveals whenever the visible set changes (filter / search / sort /
  // page) so freshly rendered cards get observed and animate in.
  useReveal(`${active}|${sort}|${query}|${page}`);

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-st-cyan selection:text-white">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="bg-white text-slate-900 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
            <div className="mb-4" data-reveal>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414]">
                {active === "All products" ? "All Products" : active}
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-1">
                Premium research compounds with 99%+ purity
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <label htmlFor="product-search" className="sr-only">Search products</label>
                <input
                  id="product-search"
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); resetPage(); }}
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full bg-slate-50 border border-slate-300 rounded-full pl-11 pr-5 py-2 text-sm focus:outline-none focus:border-st-cyan focus:bg-white transition-colors text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="product-sort" className="text-sm text-slate-500 whitespace-nowrap">Sort by</label>
                <select
                  id="product-sort"
                  value={sort}
                  onChange={(e) => { setSort(e.target.value as typeof sort); resetPage(); }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-st-cyan transition-colors cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            <div className="-mx-4 flex flex-nowrap justify-start gap-2.5 overflow-x-auto px-4 mb-8 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActive(cat); resetPage(); }}
                className={`shrink-0 whitespace-nowrap cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-all border tracking-wide ${
                  active === cat
                    ? "bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] border-transparent text-white font-bold shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 hover:shadow-sm hover:-translate-y-0.5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {paged.map((product, i) => (
              <div key={product.name} data-reveal style={revealDelay((i % 8) * 60)} className="h-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-2"
              aria-label="Product pagination"
            >
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                    p === page
                      ? "border-transparent bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)] text-white shadow-sm"
                      : "border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                Next
              </button>
            </nav>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
