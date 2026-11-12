/**
 * Reads every certificate PDF and generates `src/lib/coa-data.ts`.
 *
 * The figures on the COA page are lab results, so none of them are typed by
 * hand: this parses the certificates themselves and regenerates the data file.
 * Re-run it whenever certificates are added or replaced.
 *
 *   node scripts/build-coa-data.mjs [sourceDir]
 *
 * Product and size come from the file NAME, not the heading inside the PDF.
 * The headings are inconsistent between certificates — some repeat the size
 * ("GLP-3 RT 20 mg - 20mg"), some are lowercase ("bac water", "selank"), and
 * blends state their split rather than their total ("Selank + Semax - 10/10mg",
 * where the product sells as 20mg). The filenames follow one shape. As a guard
 * against a mis-named file, the lot and COA number parsed from the name must
 * match the ones printed inside the certificate, or the build fails.
 *
 * PDFs are copied to `public/coa/<slug>/<size>.pdf`; the originals' names are
 * human-friendly but make for fragile URLs.
 */
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readdir, readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const SRC = process.argv[2] ?? "C:/Users/motom/Downloads/simpletidecoa";
const ROOT = resolve(import.meta.dirname, "..");
const PUBLIC_COA = join(ROOT, "public", "coa");

/** Certificate product names that differ from the catalog's slug for it. */
const SLUG_OVERRIDES = {
  "GHK-Cu + KPV": "kpv-ghk-cu",
  "IGF-1 LR3": "igf1-lr3",
  MT2: "melanotan-2",
  "NAD+": "nad-plus",
};

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\+/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Catalog spells millilitres "10ML" and milligrams "10mg". */
const normalizeSize = (value, unit) => `${value}${/^m[lL]$/.test(unit) ? "ML" : "mg"}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "07/26/2026" -> "Jul 26, 2026", matching how dates read on the cards. */
function niceDate(mdy) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(mdy);
  return m ? `${MONTHS[Number(m[1]) - 1]} ${Number(m[2])}, ${m[3]}` : mdy;
}

async function pdfText(path) {
  const doc = await getDocument({ data: new Uint8Array(await readFile(path)), useSystemFonts: true }).promise;
  let out = "";
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    out += content.items.map((i) => i.str).join("|") + "\n";
  }
  return out;
}

/** Pull `Label: value` out of the certificate's header block. */
const field = (text, label) =>
  new RegExp(`${label}:\\|? ?\\|?([^|]+)`).exec(text)?.[1]?.trim() ?? "";

/**
 * The result cell of an analyte row. Rows are pipe-separated runs of
 * `analyte | specification | result | [unit] | status`, so the result is always
 * the third non-empty cell.
 *
 * The analyte must be followed immediately by a cell break. Certificates also
 * name their assays in prose — Bac Water's method line reads "Sterility (PCR),
 * Heavy Metals (ICP-MS), Water Analysis" — and an unanchored match lands there
 * and reads the next three fragments of the sentence as a lab result.
 */
function result(text, analytePattern) {
  const at = text.search(new RegExp(`${analytePattern}\\|`));
  if (at === -1) return "";
  const cells = text
    .slice(at, at + 220)
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  return cells[2] ?? "";
}

const files = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".pdf")).sort();
if (files.length === 0) throw new Error(`no PDFs found in ${SRC}`);

const entries = [];
const problems = [];

for (const file of files) {
  // "<Product> <size> <unit> - <lot> - <COA number>.pdf"
  const parts = file.replace(/\.pdf$/i, "").split(" - ");
  if (parts.length !== 3) {
    problems.push(`${file}: filename is not "<product> <size> - <lot> - <coa number>"`);
    continue;
  }
  const [head, lot, coaNumber] = parts.map((p) => p.trim());
  const named = /^(.+?) (\d+(?:\.\d+)?) ?(mg|ml|mL|ML)$/.exec(head);
  if (!named) {
    problems.push(`${file}: could not read a product and size from "${head}"`);
    continue;
  }
  const product = named[1].trim();
  const size = normalizeSize(named[2], named[3]);

  const text = await pdfText(join(SRC, file));

  // Guard: the name must describe the certificate it is attached to.
  const pdfLot = field(text, "Lot Number");
  const pdfCoa = field(text, "COA #");
  if (pdfLot !== lot) problems.push(`${file}: lot is "${pdfLot}" inside the PDF, "${lot}" in the filename`);
  if (pdfCoa !== coaNumber) problems.push(`${file}: COA number is "${pdfCoa}" inside, "${coaNumber}" in the filename`);

  // Most certificates read "Not Detected" across the panel, but a few report a
  // real figure that still passes its limit (Semax: 1.411 ppm chromium). Those
  // are named rather than folded into a blanket "Not Detected".
  const METALS = [["Arsenic", "As"], ["Cadmium", "Cd"], ["Lead", "Pb"], ["Mercury", "Hg"], ["Chromium", "Cr"]];
  const metalResults = METALS.map(([metal, symbol]) => ({
    symbol,
    value: result(text, `${metal} \\([^)]+\\)`),
  })).filter((m) => m.value);
  const detected = metalResults.filter((m) => /\d/.test(m.value));
  const heavyMetals =
    metalResults.length === 0
      ? ""
      : detected.length === 0
        ? "Not Detected"
        : detected.map((m) => `${m.symbol} ${m.value} ppm`).join(", ");

  entries.push({
    product,
    slug: SLUG_OVERRIDES[product] ?? slugify(product),
    size,
    lot,
    coaNumber,
    accessCode: field(text, "Access Code"),
    lab: /ILS Laboratories/.test(text) ? "ILS Laboratories" : "",
    method: field(text, "Method"),
    tested: niceDate(field(text, "Analysis Date")),
    // Certificates state their own assay count ("10X TESTED", "4X TESTED");
    // a few state none. Blanket claims are not safe to apply across the set.
    assayCount: /\|(\d+)X TESTED\|/.exec(text)?.[1] ?? "",
    // Non-peptides label the row "Purity (HPLC)" (NAD+, GHK-Cu); peptides
    // "Peptide Purity (HPLC)". The shorter pattern matches inside the longer.
    purity: result(text, "Purity \\(HPLC\\)"),
    // Reported as a bare number and a separate unit cell ("10.41" + "mg").
    netContent: (() => {
      const at = text.search(/Net Peptide Content\|/);
      if (at === -1) return "";
      const cells = text.slice(at, at + 220).split("|").map((c) => c.trim()).filter(Boolean);
      return /^[\d.]+$/.test(cells[2] ?? "") ? `${cells[2]}${cells[3] ?? ""}` : "";
    })(),
    identity: result(text, "Identity \\([^)]+\\)"),
    fentanyl: result(text, "Fentanyl Screen"),
    sterility: result(text, "Sterility \\(PCR\\)"),
    endotoxin: result(text, "Endotoxin \\(USP <85>\\)"),
    heavyMetals,
    sourceFile: file,
  });
}

// ── group by product; sizes ascend by their leading number
const bySlug = new Map();
for (const e of entries) {
  if (!bySlug.has(e.slug)) bySlug.set(e.slug, { name: e.product, lab: e.lab, sizes: [] });
  bySlug.get(e.slug).sizes.push(e);
}
for (const group of bySlug.values()) {
  group.sizes.sort((a, b) => (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0));
}

// ── copy the PDFs to stable, URL-safe paths
await rm(PUBLIC_COA, { recursive: true, force: true });
for (const [slug, group] of bySlug) {
  await mkdir(join(PUBLIC_COA, slug), { recursive: true });
  for (const e of group.sizes) {
    e.file = `/coa/${slug}/${e.size}.pdf`;
    await copyFile(join(SRC, e.sourceFile), join(PUBLIC_COA, slug, `${e.size}.pdf`));
  }
}

// ── reconcile against the catalog
const catalog = await readFile(join(ROOT, "src", "lib", "catalog.ts"), "utf8");
const catalogSlugs = new Set([
  ...[...catalog.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]),
  ...[...catalog.matchAll(/ph\("([^"]+)"/g)].map((m) => m[1]),
]);
const noCatalogEntry = [...bySlug.keys()].filter((s) => !catalogSlugs.has(s)).sort();
const noCertificate = [...catalogSlugs].filter((s) => !bySlug.has(s)).sort();

// ── emit
const field_ = (e, k) => JSON.stringify(e[k] ?? "");
const out = [
  `// GENERATED by scripts/build-coa-data.mjs — do not edit by hand.`,
  `// Parsed from ${entries.length} certificates in ${SRC}.`,
  `// Re-run the script after adding or replacing a certificate.`,
  ``,
  `export type CoaPanel = {`,
  `  size: string;`,
  `  lot: string;`,
  `  coaNumber: string;`,
  `  accessCode: string;`,
  `  tested: string;`,
  `  /** Assay count the certificate states for itself, e.g. "10". Blank if it states none. */`,
  `  assayCount: string;`,
  `  purity: string;`,
  `  netContent: string;`,
  `  identity: string;`,
  `  fentanyl: string;`,
  `  sterility: string;`,
  `  endotoxin: string;`,
  `  heavyMetals: string;`,
  `  method: string;`,
  `  file: string;`,
  `};`,
  ``,
  `export type CoaProductData = { name: string; lab: string; panels: CoaPanel[] };`,
  ``,
  `export const COA_PRODUCTS: Record<string, CoaProductData> = {`,
];
for (const [slug, group] of [...bySlug].sort((a, b) => a[0].localeCompare(b[0]))) {
  out.push(`  ${JSON.stringify(slug)}: {`);
  out.push(`    name: ${JSON.stringify(group.name)},`);
  out.push(`    lab: ${JSON.stringify(group.lab)},`);
  out.push(`    panels: [`);
  for (const e of group.sizes) {
    out.push(`      {`);
    for (const k of [
      "size", "lot", "coaNumber", "accessCode", "tested", "assayCount",
      "purity", "netContent", "identity", "fentanyl", "sterility",
      "endotoxin", "heavyMetals", "method", "file",
    ]) {
      out.push(`        ${k}: ${field_(e, k)},`);
    }
    out.push(`      },`);
  }
  out.push(`    ],`);
  out.push(`  },`);
}
out.push(
  `};`,
  ``,
  `export const COA_REPORT_COUNT = ${entries.length};`,
  ``,
  `export function coaPanel(slug: string, size: string): CoaPanel | undefined {`,
  `  return COA_PRODUCTS[slug]?.panels.find((p) => p.size === size);`,
  `}`,
  ``,
  `export function coaSizes(slug: string): string[] {`,
  `  return COA_PRODUCTS[slug]?.panels.map((p) => p.size) ?? [];`,
  `}`,
  ``,
  `/** Every certificate on file for a product, in size order, for the viewer. */`,
  `export function coaReports(slug: string): { size: string; lot: string; url: string }[] {`,
  `  return COA_PRODUCTS[slug]?.panels.map((p) => ({ size: p.size, lot: p.lot, url: p.file })) ?? [];`,
  `}`,
  ``,
  `export function hasCoaData(slug: string): boolean {`,
  `  return slug in COA_PRODUCTS;`,
  `}`,
  ``,
);

await writeFile(join(ROOT, "src", "lib", "coa-data.ts"), out.join("\n"), "utf8");

console.log(`parsed ${entries.length} certificates across ${bySlug.size} products`);
console.log(`wrote src/lib/coa-data.ts and public/coa/<slug>/<size>.pdf`);

if (noCatalogEntry.length) {
  console.log(`\ncertificate but no catalog product (${noCatalogEntry.length}):`);
  for (const s of noCatalogEntry) console.log(`  - ${s}  (${bySlug.get(s).name})`);
}
if (noCertificate.length) {
  console.log(`\ncatalog product with no certificate (${noCertificate.length}):`);
  for (const s of noCertificate) console.log(`  - ${s}`);
}
if (problems.length) {
  console.log(`\nproblems (${problems.length}):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}
