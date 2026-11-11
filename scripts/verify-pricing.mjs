/**
 * Confirms the Nov 11 price update landed everywhere a price is stated.
 *
 * Prices are duplicated across three files — catalog.ts (product pages),
 * shop-products.ts (shop grid) and index.tsx (home page) — so the first two
 * sections check all three agree with the intended list, which is what stops
 * the copies drifting apart.
 *
 * Note on what can be checked live: product detail pages render their tagline,
 * lot and purity server-side but compute the hero price on the client from the
 * selected size, so the figure is not in the SSR HTML. Rather than scrape it,
 * this fetches `/src/lib/catalog.ts` from the dev server — the actual module
 * the browser imports — and asserts the prices in it. The shop and home cards
 * do render their labels server-side, so those are read off the page directly.
 *
 * Every "new price is present" assertion is paired with "the old price is gone"
 * from the same scoped block, so a half-applied edit fails instead of passing
 * on the strength of the new value alone.
 *
 * Usage: node scripts/verify-pricing.mjs [baseUrl]
 */
import { readFile } from "node:fs/promises";

const BASE = process.argv[2] || "http://localhost:8080";

let pass = 0;
let fail = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  — ${extra}` : ""}`);
  ok ? pass++ : fail++;
};

/** slug, display name, [[size, newPrice, oldPrice], ...]. oldPrice 0 = was unpriced. */
const EXPECTED = [
  ["glp-3-rt", "GLP-3 RT", [["10mg", 45, 65], ["20mg", 85, 120], ["30mg", 110, 150], ["60mg", 175, 240]]],
  ["glp-2-tz", "GLP-2 TZ", [["10mg", 35, 60], ["20mg", 65, 110], ["30mg", 105, 140], ["60mg", 170, 220]]],
  ["glp-1-sm", "GLP-1 SM", [["10mg", 35, 0]]],
  ["elora", "Elora", [["10mg", 75, 0]]],
  ["mots-c", "MOTS-c", [["10mg", 40, 65], ["40mg", 110, 160]]],
  ["glow", "GLOW", [["70mg", 55, 85]]],
  ["klow", "KLOW", [["80mg", 70, 105]]],
  ["kpv", "KPV", [["10mg", 40, 55]]],
  ["kpv-ghk-cu", "KPV + GHK-Cu", [["60mg", 55, 0]]],
  ["wolverine", "Wolverine", [["10mg", 40, 70], ["20mg", 60, 120], ["40mg", 90, 200]]],
  // Nov 11, second round
  ["cjc-1295-ipamorelin", "CJC-1295 + Ipamorelin", [["10mg", 45, 75]]],
  ["nad-plus", "NAD+", [["500mg", 45, 65], ["1000mg", 65, 1000]]],
  ["vip", "VIP", [["10mg", 50, 0]]],
  ["ss-31", "SS-31", [["10mg", 45, 60]]],
  ["ghk-cu", "GHK-Cu", [["50mg", 25, 40], ["100mg", 35, 55]]],
  ["mt1", "MT1", [["10mg", 25, 50]]],
  ["melanotan-2", "Melanotan 2", [["10mg", 20, 40]]],
  ["glutathione", "Glutathione", [["1500mg", 50, 0]]],
  ["adamax", "Adamax", [["10mg", 35, 65]]],
  ["ara-290", "ARA-290", [["10mg", 55, 70]]],
  ["ss-31-mots-c", "SS-31 + MOTS-c", [["40mg", 60, 0]]],
  ["ahk-cu", "AHK-Cu", [["50mg", 30, 0]]],
  ["bpc-157", "BPC-157", [["10mg", 30, 65]]],
  ["tb-500", "TB-500", [["10mg", 35, 70]]],
  ["semax", "Semax", [["10mg", 30, 50]]],
  ["selank", "Selank", [["10mg", 35, 55]]],
  ["selank-semax", "Selank + Semax", [["20mg", 60, 0]]],
  ["5-amino-1mq", "5-Amino-1MQ", [["5mg", 30, 0]]],
  ["ipamorelin", "Ipamorelin", [["10mg", 40, 70]]],
  ["igf1-lr3", "IGF1-LR3", [["10mg", 60, 85]]],
  ["snap-8", "Snap 8", [["10mg", 35, 0]]],
  ["cagrilintide", "Cagrilintide", [["10mg", 65, 90]]],
  ["kisspeptin", "Kisspeptin", [["10mg", 40, 50]]],
  ["pt-141", "PT-141", [["10mg", 45, 60]]],
  ["thymosin-alpha-1", "Thymosin Alpha-1", [["10mg", 45, 80]]],
  ["sermorelin", "Sermorelin", [["10mg", 45, 65]]],
  ["epithalon", "Epithalon", [["10mg", 40, 55]]],
  ["bac-water", "Bac Water", [["10ML", 15, 20]]],
];

/** Sizes that must no longer exist anywhere. */
const RETIRED_SIZES = [["cjc-1295-ipamorelin", "CJC-1295 + Ipamorelin", "20mg"]];

/** Card label shown on the shop grid and home page. */
const LABELS = [
  ["GLP-3 RT", "From $45.00", "From $65.00"],
  ["GLP-2 TZ", "From $35.00", "From $60.00"],
  ["GLP-1 SM", "$35.00", "$0.00"],
  ["Elora", "$75.00", "$0.00"],
  ["MOTS-c", "From $40.00", "From $65.00"],
  ["GLOW", "$55.00", "$85.00"],
  ["KLOW", "$70.00", "$105.00"],
  ["KPV", "$40.00", "$55.00"],
  ["KPV + GHK-Cu", "$55.00", "$0.00"],
  ["Wolverine", "From $40.00", "From $70.00"],
  // Nov 11, second round. CJC drops its "From" prefix — one size left.
  ["Bac Water", "$15.00", "$20.00"],
  ["CJC-1295 + Ipamorelin", "$45.00", "From $75.00"],
  ["NAD+", "From $45.00", "From $65.00"],
  ["SS-31", "$45.00", "$60.00"],
  ["GHK-Cu", "From $25.00", "From $40.00"],
  ["MT1", "$25.00", "$50.00"],
  ["MT2", "$20.00", "$40.00"],
  ["Glutathione", "$50.00", "$0.00"],
  ["Adamax", "$35.00", "$65.00"],
  ["ARA-290", "$55.00", "$70.00"],
  ["SS-31 + MOTS-c", "$60.00", "$0.00"],
  ["AHK-Cu", "$30.00", "$0.00"],
  ["BPC-157", "$30.00", "$65.00"],
  ["TB-500", "$35.00", "$70.00"],
  ["Semax", "$30.00", "$50.00"],
  ["Selank", "$35.00", "$55.00"],
  ["Selank + Semax", "$60.00", "$0.00"],
  ["5-Amino-1MQ", "$30.00", "$0.00"],
  ["Ipamorelin", "$40.00", "$70.00"],
  ["IGF1-LR3", "$60.00", "$85.00"],
  ["Snap 8", "$35.00", "$0.00"],
  ["Cagrilintide", "$65.00", "$90.00"],
  ["Kisspeptin", "$40.00", "$50.00"],
  ["PT-141", "$45.00", "$60.00"],
  ["Thymosin Alpha-1", "$45.00", "$80.00"],
  ["Sermorelin", "$45.00", "$65.00"],
  ["Epithalon", "$40.00", "$55.00"],
  ["VIP", "$50.00", "$0.00"],
];

const esc = (s) => s.replace(/[+]/g, "\\+");
const read = (p) => readFile(new URL(`../src/${p}`, import.meta.url), "utf8");
const get = (p) => fetch(`${BASE}${p}`).then((r) => r.text());

/**
 * One product's declaration. Full entries start `slug: "x"` and run to the next
 * one; placeholder products are a single `ph(...)` call instead.
 */
function productBlock(src, slug) {
  const ph = new RegExp(`ph\\("${esc(slug)}",[^)]*\\)`).exec(src);
  if (ph) return { text: ph[0], placeholder: true };
  const i = src.indexOf(`slug: "${slug}"`);
  if (i === -1) return null;
  const next = src.indexOf('slug: "', i + 10);
  return { text: src.slice(i, next === -1 ? i + 5000 : next), placeholder: false };
}

/**
 * One entry of a `Record<string, Variant[]>` map, bounded at its closing
 * bracket. A fixed-width window would run into the next product — and the
 * neighbour's sizes would then satisfy assertions about this one.
 */
function variantBlock(text, name) {
  // Anchored to the start of its line: an unanchored match finds "Ipamorelin"
  // inside the "CJC-1295 + Ipamorelin" key and reads the wrong product.
  const key = new RegExp(`^\\s*"?${esc(name)}"?: \\[`, "m").exec(text);
  if (!key) return null;
  const end = text.indexOf("]", key.index);
  return text.slice(key.index, end === -1 ? key.index + 400 : end);
}

/** Does a block price `size` at `price`? Handles both source and served layouts. */
const priced = (block, size, price) =>
  block.placeholder
    ? new RegExp(`"${size}",\\s*${price}\\s*\\)`).test(block.text)
    : new RegExp(`size: "${size}",\\s*price: ${price}\\b`).test(block.text);

// ──────────────────────────────────────────────── 1. catalog source
console.log("catalog.ts — the source product pages read from");
const catalog = await read("lib/catalog.ts");
for (const [slug, name, sizes] of EXPECTED) {
  const block = productBlock(catalog, slug);
  check(`${name}: present in catalog`, !!block);
  if (!block) continue;
  for (const [size, next, prev] of sizes) {
    check(`${name} ${size}: catalog $${next}`, priced(block, size, next));
    if (prev && prev !== next) {
      check(`${name} ${size}: old $${prev} gone`, !priced(block, size, prev));
    }
  }
}

// ──────────────────────────────────────────────── 2. the duplicate copies
console.log("\nshop-products.ts and index.tsx — the duplicated variant maps");
const shopSrc = await read("lib/shop-products.ts");
const homeSrc = await read("routes/index.tsx");
for (const [, name, sizes] of EXPECTED) {
  for (const [label, text] of [["shop-products.ts", shopSrc], ["index.tsx", homeSrc]]) {
    const block = variantBlock(text, name);
    if (!block) continue; // not every product is listed in every file
    for (const [size, next, prev] of sizes) {
      check(`${name} ${size}: ${label} $${next}`, new RegExp(`size: "${size}", price: ${next}\\b`).test(block));
      if (prev && prev !== next) {
        check(`${name} ${size}: ${label} dropped $${prev}`, !new RegExp(`size: "${size}", price: ${prev}\\b`).test(block));
      }
    }
  }
}

// ──────────────────────────────────────────────── 3. the module the browser runs
console.log("\n/src/lib/catalog.ts served to the browser");
const served = await get("/src/lib/catalog.ts");
check("dev server returns a JS module", served.length > 1000 && !served.includes("<!DOCTYPE"), `${served.length} bytes`);
for (const [slug, name, sizes] of EXPECTED) {
  const block = productBlock(served, slug);
  check(`${name}: present in served module`, !!block);
  if (!block) continue;
  for (const [size, next, prev] of sizes) {
    check(`${name} ${size}: browser gets $${next}`, priced(block, size, next));
    if (prev && prev !== next) {
      check(`${name} ${size}: browser has no $${prev}`, !priced(block, size, prev));
    }
  }
}

// ──────────────────────────────────────────────── 4. rendered cards
/** The price label inside a named product card, scoped so a price belonging to
 *  a neighbouring card can't satisfy the assertion. */
function cardLabel(html, name) {
  const i = html.indexOf(`>${name}</`);
  if (i === -1) return null;
  return /(?:From )?\$\d[\d,]*\.\d\d/.exec(html.slice(i, i + 400))?.[0] ?? null;
}

console.log("\nshop grid cards (/products)");
const shopPage = await get("/products");
check("shop page renders", shopPage.length > 1000, `${shopPage.length} bytes`);
for (const [name, next, prev] of LABELS) {
  const got = cardLabel(shopPage, name);
  check(`${name} card reads ${next}`, got === next, `got ${got ?? "nothing"}`);
  check(`${name} card is not ${prev}`, got !== prev);
}

console.log("\nhome page featured cards (/)");
const homePage = await get("/");
check("home page renders", homePage.length > 1000, `${homePage.length} bytes`);
for (const name of ["GLP-3 RT", "GLP-2 TZ", "MOTS-c", "Wolverine", "CJC-1295 + Ipamorelin", "BPC-157", "Adamax"]) {
  const expected = LABELS.find((l) => l[0] === name);
  const got = cardLabel(homePage, name);
  check(`${name} home card reads ${expected[1]}`, got === expected[1], `got ${got ?? "nothing"}`);
  check(`${name} home card is not ${expected[2]}`, got !== expected[2]);
}

// ──────────────────────────────────────────────── retired sizes
console.log("\nretired sizes");
for (const [slug, name, size] of RETIRED_SIZES) {
  for (const [label, text] of [["catalog source", catalog], ["served module", served]]) {
    const block = productBlock(text, slug);
    check(`${name}: ${size} gone from ${label}`, !!block && !new RegExp(`size: "${size}"`).test(block.text));
  }
  for (const [label, text] of [["shop-products.ts", shopSrc], ["index.tsx", homeSrc]]) {
    const block = variantBlock(text, name);
    if (!block) continue;
    check(`${name}: ${size} gone from ${label}`, !new RegExp(`size: "${size}"`).test(block));
  }
}

// ──────────────────────────────────────────────── retired CJC sale
// Asserted against source, not markup: no card component reads `badge`,
// `compareAt` or `originalPrice`, so these never reach the page either way.
console.log("\nCJC sale fields retired");
check("no card grid renders a SALE! badge today", !shopPage.includes("SALE!") && !homePage.includes("SALE!"));
for (const [label, text] of [["shop-products.ts", shopSrc], ["index.tsx", homeSrc]]) {
  const line = text.split("\n").find((l) => l.includes('name: "CJC-1295 + Ipamorelin"'));
  check(`${label} has a CJC card entry`, !!line);
  if (!line) continue;
  check(`${label} CJC priced $45.00`, line.includes('"$45.00"'));
  check(`${label} CJC has no $85.00 compare-at`, !line.includes("$85.00"));
  check(`${label} CJC has no SALE! badge`, !line.includes("SALE!"));
  // Control: Tesamorelin keeps its sale fields, so the above can't pass by
  // a blanket strip of every badge in the file.
  const tesa = text.split("\n").find((l) => l.includes('name: "Tesamorelin"'));
  check(`${label} Tesamorelin keeps SALE! and $95.00`, !!tesa && tesa.includes("SALE!") && tesa.includes("$95.00"));
}

console.log("\nno unpriced products remain");
for (const [label, html] of [["shop", shopPage], ["home", homePage]]) {
  check(`${label} page has no $0.00 card`, !html.includes("$0.00"));
}

// Control: products nobody asked me to change must be untouched, so a careless
// find-and-replace across the price tables fails here.
console.log("\ncontrol — untouched products");
for (const [name, label] of [["Tesamorelin", "$85.00"], ["DSIP", "From $45.00"]]) {
  check(`${name} still reads ${label}`, cardLabel(shopPage, name) === label, `got ${cardLabel(shopPage, name)}`);
}
check("LL-37 still priced at $70 in catalog", /ph\("ll-37",[^)]*70\)/.test(catalog));
check("HCG still priced at $65 in catalog", /ph\("hcg",[^)]*65\)/.test(catalog));

// ──────────────────────────────────────────────── 5. detail pages still load
console.log("\nproduct detail pages load");
for (const [slug, name] of EXPECTED) {
  const html = await get(`/product/${slug}`);
  check(`/product/${slug} renders ${name}`, html.length > 1000 && html.includes(name), `${html.length} bytes`);
}

console.log(`\n${pass}/${pass + fail} checks passed`);
if (fail) process.exit(1);
