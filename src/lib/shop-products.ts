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
    { size: "10mg", price: 45 },
    { size: "20mg", price: 85 },
    { size: "30mg", price: 110 },
    { size: "60mg", price: 175 },
  ],
  "GLP-2 TZ": [
    { size: "10mg", price: 35 },
    { size: "20mg", price: 65 },
    { size: "30mg", price: 105 },
    { size: "60mg", price: 170 },
  ],
  "MOTS-c": [
    { size: "10mg", price: 40 },
    { size: "40mg", price: 110 },
  ],
  "CJC-1295 + Ipamorelin": [
    { size: "10mg", price: 45 },
  ],
  "Wolverine Blend": [
    { size: "10mg", price: 40 },
    { size: "20mg", price: 60 },
    { size: "40mg", price: 90 },
  ],
  Wolverine: [
    { size: "10mg", price: 40 },
    { size: "20mg", price: 60 },
    { size: "40mg", price: 90 },
  ],
};

export const SHOP_PRODUCTS: ShopProduct[] = [
  { name: "GLP-3 RT", price: "From $45.00", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/glp-3-rt.webp" },
  { name: "GLP-2 TZ", price: "From $35.00", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/glp-2-tz.webp" },
  { name: "GLP-1 SM", price: "$35.00", badge: null, category: "Metabolic Research", image: "/images/cards/glp-1-sm.webp" },
  { name: "Elora", price: "$75.00", badge: null, image: "/images/cards/elora.webp" },
  { name: "Tesamorelin", price: "$85.00", originalPrice: "$95.00", badge: "SALE!", category: "GH Research", image: "/images/cards/tesamorelin.webp" },
  { name: "MOTS-c", price: "From $40.00", badge: "BEST SELLING!", category: "Metabolic Research", image: "/images/cards/mots-c.webp" },
  { name: "GLOW", price: "$55.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/glow.webp" },
  { name: "KLOW", price: "$70.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/klow.webp" },
  { name: "KPV", price: "$40.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/kpv.webp" },
  { name: "KPV + GHK-Cu", price: "$55.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/kpv-ghk-cu.webp" },
  { name: "Wolverine", price: "From $40.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/wolverine.webp" },
  { name: "Bac Water", price: "$15.00", badge: null, image: "/images/cards/bac-water.webp" },
  { name: "CJC-1295 + Ipamorelin", price: "$45.00", badge: null, category: "GH Research", image: "/images/cards/cjc-1295-ipamorelin.webp" },
  { name: "NAD+", price: "From $45.00", badge: null, category: "Cellular Research", image: "/images/cards/nad-plus.webp" },
  { name: "SS-31", price: "$45.00", badge: null, category: "Cellular Research", image: "/images/cards/ss-31.webp" },
  { name: "GHK-Cu", price: "From $25.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/ghk-cu.webp" },
  { name: "MT1", price: "$25.00", badge: null, image: "/images/cards/mt1.webp" },
  { name: "MT2", price: "$20.00", badge: null, image: "/images/cards/melanotan-2.webp" },
  { name: "Glutathione", price: "$50.00", badge: null, category: "Cellular Research", image: "/images/cards/glutathione.webp" },
  { name: "Adamax", price: "$35.00", badge: "BEST SELLING!", category: "Neuro Research", image: "/images/cards/adamax.webp" },
  { name: "ARA-290", price: "$55.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/ara-290.webp" },
  { name: "SS-31 + MOTS-c", price: "$60.00", badge: null, category: "Cellular Research", image: "/images/cards/ss-31-mots-c.webp" },
  { name: "VIP", price: "$50.00", badge: null, image: "/images/cards/vip.webp" },
  { name: "AHK-Cu", price: "$30.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/ahk-cu.webp" },
  { name: "BPC-157", price: "$30.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/bpc-157.webp" },
  { name: "TB-500", price: "$35.00", badge: null, category: "Tissue Repair Research", image: "/images/cards/tb-500.webp" },
  { name: "Semax", price: "$30.00", badge: null, category: "Neuro Research", image: "/images/cards/semax.webp" },
  { name: "Selank", price: "$35.00", badge: null, category: "Neuro Research", image: "/images/cards/selank.webp" },
  { name: "Selank + Semax", price: "$60.00", badge: null, category: "Neuro Research", image: "/images/cards/selank-semax.webp" },
  { name: "5-Amino-1MQ", price: "$30.00", badge: null, category: "Metabolic Research", image: "/images/cards/5-amino-1mq.webp" },
  { name: "Ipamorelin", price: "$40.00", badge: null, category: "GH Research", image: "/images/cards/ipamorelin.webp" },
  { name: "IGF1-LR3", price: "$60.00", badge: null, category: "GH Research", image: "/images/cards/igf1-lr3.webp" },
  { name: "Snap 8", price: "$35.00", badge: null, image: "/images/cards/snap-8.webp" },
  { name: "Cagrilintide", price: "$65.00", badge: null, category: "Metabolic Research", image: "/images/cards/cagrilintide.webp" },
  { name: "Kisspeptin", price: "$40.00", badge: null, image: "/images/cards/kisspeptin.webp" },
  { name: "PT-141", price: "$45.00", badge: null, image: "/images/cards/pt-141.webp" },
  { name: "Thymosin Alpha-1", price: "$45.00", badge: null, category: "Cellular Research", image: "/images/cards/thymosin-alpha-1.webp" },
  { name: "DSIP", price: "From $45.00", badge: null, category: "Neuro Research", image: "/images/cards/dsip.webp" },
  { name: "Sermorelin", price: "$45.00", badge: null, category: "GH Research", image: "/images/cards/sermorelin.webp" },
  { name: "Epithalon", price: "$40.00", badge: null, category: "Cellular Research", image: "/images/cards/epithalon.webp" },
];

const byName = new Map(SHOP_PRODUCTS.map((p) => [p.name, p]));

export function getShopProductByName(name: string): ShopProduct | undefined {
  return byName.get(name);
}

export function shopProductId(name: string): string {
  return `products-${name}`;
}
