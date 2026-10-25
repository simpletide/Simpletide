export type ShopBadge = "BEST SELLING!" | "SALE!" | "OUT OF STOCK" | null;
export type ShopCategory =
  | "Metabolic Research"
  | "Tissue Repair Research"
  | "Cellular Research"
  | "GH Research"
  | "Neuro Research"
  | "Bundles";

export type ShopProduct = {
  name: string;
  price: string;
  originalPrice?: string;
  badge: ShopBadge;
  /** Omit to exclude a product from every category tab (still shows under "All products"). */
  category?: ShopCategory;
  image: string;
  outOfStock?: boolean;
};

export type ShopVariant = { size: string; price: number };

export const SHOP_VARIANTS: Record<string, ShopVariant[]> = {
  "GLP-3 RT (RETA)": [
    { size: "10mg", price: 65 },
    { size: "20mg", price: 120 },
    { size: "30mg", price: 150 },
    { size: "60mg", price: 240 },
  ],
  "GLP-2 TZ": [
    { size: "10mg", price: 60 },
    { size: "20mg", price: 110 },
    { size: "30mg", price: 140 },
    { size: "60mg", price: 220 },
  ],
  "MOTS-c": [
    { size: "10mg", price: 65 },
    { size: "40mg", price: 160 },
  ],
  "CJC-1295 + Ipamorelin": [
    { size: "10mg", price: 75 },
    { size: "20mg", price: 120 },
  ],
  "Wolverine Blend": [
    { size: "10mg", price: 70 },
    { size: "20mg", price: 120 },
    { size: "40mg", price: 200 },
  ],
  Wolverine: [
    { size: "10mg", price: 70 },
    { size: "20mg", price: 120 },
    { size: "40mg", price: 200 },
  ],
};

export const SHOP_PRODUCTS: ShopProduct[] = [
  { name: "GLP-3 RT (RETA)", price: "From $65.00", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/glp-3-rt.jpg" },
  { name: "GLP-2 TZ", price: "From $60.00", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/glp-2-tz.jpg" },
  { name: "Tesamorelin", price: "$85.00", originalPrice: "$95.00", badge: "SALE!", category: "GH Research", image: "/images/cards/tesamorelin.jpg" },
  { name: "MOTS-c", price: "From $65.00", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/mots-c.jpg" },
  { name: "Adamax", price: "$65.00", badge: "BEST SELLING!", category: "Neuro Research", image: "/images/cards/adamax.jpg" },
  { name: "Wolverine", price: "From $70.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/wolverine.jpg" },
  { name: "CJC-1295 + Ipamorelin", price: "From $75.00", originalPrice: "$85.00", badge: "SALE!", category: "GH Research", image: "/images/cards/cjc-1295-ipamorelin.jpg" },
  { name: "MT1", price: "$50.00", badge: null, image: "/images/cards/mt1.jpg" },
  { name: "MT2", price: "$40.00", badge: null, image: "/images/cards/melanotan-2.jpg" },
  { name: "KPV", price: "$55.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/kpv.jpg" },
  { name: "BPC-157", price: "$65.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/bpc-157.jpg" },
  { name: "TB-500", price: "$70.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/tb-500.jpg" },
  { name: "Semax", price: "$50.00", badge: null, category: "Neuro Research", image: "/images/cards/semax.jpg" },
  { name: "Selank", price: "$55.00", badge: null, category: "Neuro Research", image: "/images/cards/selank.jpg" },
  { name: "SS-31", price: "$60.00", badge: null, category: "Cellular Research", image: "/images/cards/ss-31.jpg" },
  { name: "Ipamorelin", price: "$70.00", badge: null, category: "GH Research", image: "/images/cards/ipamorelin.jpg" },
  { name: "IGF1-LR3", price: "$85.00", badge: null, category: "GH Research", image: "/images/cards/igf1-lr3.jpg" },
  { name: "Cagrilintide", price: "$90.00", badge: null, category: "Metabolic Research", image: "/images/cards/cagrilintide.jpg" },
  { name: "GLP-1 SM", price: "$0.00", badge: null, category: "Metabolic Research", image: "/images/cards/glp-1-sm.jpg" },
  { name: "Elora", price: "$0.00", badge: null, image: "/images/cards/elora.jpg" },
  { name: "Selank + Semax", price: "$0.00", badge: null, category: "Neuro Research", image: "/images/cards/selank-semax.jpg" },
  { name: "Snap 8", price: "$0.00", badge: null, image: "/images/cards/snap-8.jpg" },
  { name: "VIP", price: "$0.00", badge: null, image: "/images/cards/vip.jpg" },
  { name: "SS-31 + MOTS-c", price: "$0.00", badge: null, category: "Cellular Research", image: "/images/cards/ss-31-mots-c.jpg" },
];

const byName = new Map(SHOP_PRODUCTS.map((p) => [p.name, p]));

export function getShopProductByName(name: string): ShopProduct | undefined {
  return byName.get(name);
}

export function shopProductId(name: string): string {
  return `products-${name}`;
}
