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
  "GLP-3 RT": [
    { size: "10mg", price: 39.99 },
    { size: "20mg", price: 119.99 },
    { size: "30mg", price: 149.99 },
    { size: "60mg", price: 259.99 },
  ],
  "GLP-2 TZ": [
    { size: "10mg", price: 35.99 },
    { size: "20mg", price: 59.99 },
    { size: "30mg", price: 89.99 },
    { size: "60mg", price: 139.99 },
  ],
  "MOTS-c": [
    { size: "10mg", price: 39.99 },
    { size: "40mg", price: 99.99 },
  ],
  "CJC-1295 + Ipamorelin": [
    { size: "10mg", price: 49.99 },
  ],
  "NAD+": [
    { size: "500mg", price: 49.99 },
    { size: "1000mg", price: 69.99 },
  ],
  "GHK-Cu": [
    { size: "50mg", price: 31.99 },
    { size: "100mg", price: 43.99 },
  ],
  "Wolverine Blend": [
    { size: "10mg", price: 39.99 },
    { size: "20mg", price: 59.99 },
    { size: "40mg", price: 109.99 },
  ],
  Wolverine: [
    { size: "10mg", price: 39.99 },
    { size: "20mg", price: 59.99 },
    { size: "40mg", price: 109.99 },
  ],
};

export const SHOP_PRODUCTS: ShopProduct[] = [
  { name: "GLP-3 RT", price: "From $39.99", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/glp-3-rt.webp" },
  { name: "GLP-2 TZ", price: "From $35.99", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/glp-2-tz.webp" },
  { name: "GLP-1 SM", price: "$39.99", badge: null, category: "Metabolic Research", image: "/images/cards/glp-1-sm.webp" },
  { name: "Tesamorelin", price: "$59.99", badge: null, category: "GH Research", image: "/images/cards/tesamorelin.webp" },
  { name: "MOTS-c", price: "From $39.99", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/mots-c.webp" },
  { name: "GLOW", price: "$74.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/glow.webp" },
  { name: "KLOW", price: "$94.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/klow.webp" },
  { name: "KPV", price: "$39.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/kpv.webp" },
  { name: "KPV + GHK-Cu", price: "$69.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/kpv-ghk-cu.webp" },
  { name: "Wolverine", price: "From $39.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/wolverine.webp" },
  { name: "Bac Water", price: "$24.99", badge: null, image: "/images/cards/bac-water.webp" },
  { name: "CJC-1295 + Ipamorelin", price: "$49.99", badge: null, category: "GH Research", image: "/images/cards/cjc-1295-ipamorelin.webp" },
  { name: "NAD+", price: "From $49.99", badge: null, category: "Cellular Research", image: "/images/cards/nad-plus.webp" },
  { name: "SS-31", price: "$49.99", badge: null, category: "Cellular Research", image: "/images/cards/ss-31.webp" },
  { name: "GHK-Cu", price: "From $31.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/ghk-cu.webp" },
  { name: "MT1", price: "$33.99", badge: null, image: "/images/cards/mt1.webp" },
  { name: "MT2", price: "$29.99", badge: null, image: "/images/cards/melanotan-2.webp" },
  { name: "Glutathione", price: "$59.99", badge: null, category: "Cellular Research", image: "/images/cards/glutathione.webp" },
  { name: "Adamax", price: "$30.99", badge: "BEST SELLING!", category: "Neuro Research", image: "/images/cards/adamax.webp", outOfStock: true },
  { name: "ARA-290", price: "$49.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/ara-290.webp" },
  { name: "SS-31 + MOTS-c", price: "$53.99", badge: null, category: "Cellular Research", image: "/images/cards/ss-31-mots-c.webp", outOfStock: true },
  { name: "VIP", price: "$44.99", badge: null, image: "/images/cards/vip.webp", outOfStock: true },
  { name: "AHK-Cu", price: "$43.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/ahk-cu.webp" },
  { name: "BPC-157", price: "$45.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/bpc-157.webp" },
  { name: "TB-500", price: "$30.99", badge: null, category: "Tissue Repair Research", image: "/images/cards/tb-500.webp", outOfStock: true },
  { name: "Semax", price: "$45.99", badge: null, category: "Neuro Research", image: "/images/cards/semax.webp" },
  { name: "Selank", price: "$45.99", badge: null, category: "Neuro Research", image: "/images/cards/selank.webp" },
  { name: "Selank + Semax", price: "$69.99", badge: null, category: "Neuro Research", image: "/images/cards/selank-semax.webp" },
  { name: "5-Amino-1MQ", price: "$41.99", badge: null, category: "Metabolic Research", image: "/images/cards/5-amino-1mq.webp" },
  { name: "Ipamorelin", price: "$49.99", badge: null, category: "GH Research", image: "/images/cards/ipamorelin.webp" },
  { name: "IGF1-LR3", price: "$69.99", badge: null, category: "GH Research", image: "/images/cards/igf1-lr3.webp" },
  { name: "Snap 8", price: "$49.99", badge: null, category: "Metabolic Research", image: "/images/cards/snap-8.webp" },
  { name: "Cagrilintide", price: "$57.99", badge: null, category: "Metabolic Research", image: "/images/cards/cagrilintide.webp", outOfStock: true },
  { name: "Kisspeptin", price: "$63.99", badge: null, category: "Metabolic Research", image: "/images/cards/kisspeptin.webp" },
  { name: "PT-141", price: "$59.99", badge: null, category: "Metabolic Research", image: "/images/cards/pt-141.webp" },
  { name: "Thymosin Alpha-1", price: "$39.99", badge: null, category: "Cellular Research", image: "/images/cards/thymosin-alpha-1.webp", outOfStock: true },
  { name: "DSIP", price: "$44.99", badge: null, category: "Neuro Research", image: "/images/cards/dsip.webp" },
  { name: "Sermorelin", price: "$55.99", badge: null, category: "GH Research", image: "/images/cards/sermorelin.webp" },
  { name: "Epithalon", price: "$35.99", badge: null, category: "Cellular Research", image: "/images/cards/epithalon.webp", outOfStock: true },
  { name: "Elora", price: "$66.99", badge: null, category: "Metabolic Research", image: "/images/cards/elora.webp", outOfStock: true },
];

const byName = new Map(SHOP_PRODUCTS.map((p) => [p.name, p]));

export function getShopProductByName(name: string): ShopProduct | undefined {
  return byName.get(name);
}

export function shopProductId(name: string): string {
  return `products-${name}`;
}
