import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProductBySlug } from "@/lib/catalog";
import { productSeoHead, pageSeoHead } from "@/lib/site-seo";
import { ProductDetail } from "@/routes/products_.$slug";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const p = getProductBySlug(params.slug);
    if (!p) {
      return pageSeoHead({
        path: `/product/${params.slug}`,
        title: "Product | Simpletide",
        description: "Premium research compound by Simpletide.",
      });
    }
    return productSeoHead(p);
  },
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  notFoundComponent: () => (
    <div className="min-h-screen text-white flex items-center justify-center px-6 relative z-[1]">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3">Product not found</h1>
        <Link to="/products" className="text-st-cyan underline">
          Back to catalog
        </Link>
      </div>
    </div>
  ),
  component: ProductDetail,
});
