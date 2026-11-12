/**
 * Checks the COA page against the certificates it claims to be quoting.
 *
 * The figures are lab results, so "it renders" is not the bar — a card showing
 * the wrong batch's purity looks perfectly fine. Every number on screen is
 * therefore compared against a fresh read of the source PDF, parsed here with
 * different expressions than the generator uses, so a mistake in the generator
 * cannot quietly satisfy its own test.
 *
 * Playwright and the dev server are both required:
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/verify-coa.mjs [baseUrl] [sourceDir]
 */
import { chromium } from "playwright";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const base = process.argv[2] ?? "http://localhost:8080";
const SRC = process.argv[3] ?? "C:/Users/motom/Downloads/simpletidecoa";

let pass = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) pass++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ""}`);
}

// ── read the certificates independently of the generator
async function rawText(path) {
  const doc = await getDocument({ data: new Uint8Array(await readFile(path)), useSystemFonts: true }).promise;
  let out = "";
  for (let n = 1; n <= doc.numPages; n++) {
    out += (await (await doc.getPage(n)).getTextContent()).items.map((i) => i.str).join("|") + "\n";
  }
  return out;
}

const certs = new Map(); // lot -> { purity, tested, coaNumber, product, size }
for (const file of (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".pdf"))) {
  const text = await rawText(join(SRC, file));
  const lot = /Lot Number:\|[^|]*\|([^|]+)\|/.exec(text)?.[1]?.trim();
  certs.set(lot, {
    file,
    lot,
    coaNumber: /COA #:\|[^|]*\|([^|]+)\|/.exec(text)?.[1]?.trim(),
    purity: /Purity \(HPLC\)\|[^|]*\|[^|]*\|[^|]*\|\s*([\d.]+%)/.exec(text)?.[1],
    tested: /Analysis Date:\|[^|]*\|([^|]+)\|/.exec(text)?.[1]?.trim(),
  });
}
check("certificates read from source", certs.size === 48, `${certs.size} read`);

// ── the page
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => localStorage.setItem("simpletide-researcher-verified", "true"));
await page.goto(`${base}/coa-archive`, { waitUntil: "networkidle" });

const cards = page.locator("h3").locator("..").locator("..").locator(".."); // card root
const headline = await page.locator("text=/\\d+ products · \\d+ published reports/").first().innerText();
check("page states its totals", /\d+ products · \d+ published reports/.test(headline), headline);
check("page publishes all 48 reports", headline.includes("48 published reports"), headline);

// Each card: read its lot, purity and tested date off the DOM, then compare
// with the certificate carrying that lot.
const shown = await page.evaluate(() => {
  const out = [];
  for (const h of document.querySelectorAll("h3")) {
    const card = h.closest("div.flex.h-full.flex-col");
    if (!card) continue;
    const text = card.innerText;
    out.push({
      name: h.innerText.trim(),
      lot: /Batch \/ Lot\s*\n\s*(.+)/.exec(text)?.[1]?.trim(),
      purity: /([\d.]+%)\s*\n\s*Purity/.exec(text)?.[1],
      tested: /Tested\s*\n\s*(.+)/.exec(text)?.[1]?.trim(),
      assays: (text.match(/\(HPLC\)|\(HPLC-RTM\)|\(ICP-MS\)|\(PCR\)|USP <85>|Net Peptide Content|Fentanyl Screen/g) ?? [])
        .length,
    });
  }
  return out;
});

check("every certificate product has a card", shown.length === 36, `${shown.length} cards`);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const toNice = (mdy) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(mdy ?? "");
  return m ? `${MONTHS[Number(m[1]) - 1]} ${Number(m[2])}, ${m[3]}` : mdy;
};

for (const card of shown) {
  const cert = certs.get(card.lot);
  check(`${card.name}: lot ${card.lot} is a real certificate`, !!cert);
  if (!cert) continue;
  check(`${card.name}: purity matches certificate`, card.purity === cert.purity, `card ${card.purity}, PDF ${cert.purity}`);
  check(
    `${card.name}: tested date matches certificate`,
    card.tested === toNice(cert.tested),
    `card ${card.tested}, PDF ${toNice(cert.tested)}`,
  );
  check(`${card.name}: lists at least one assay`, card.assays > 0, `${card.assays}`);
}

// ── control: a product with no certificate must not appear
for (const absent of ["Adamax", "Epithalon", "Cagrilintide"]) {
  check(`${absent} has no card (no certificate on file)`, !shown.some((c) => c.name === absent));
}
// ── control: one that does
check("GLP-2 TZ has a card", shown.some((c) => c.name === "GLP-2 TZ"));

// ── every linked PDF is actually served
const urls = await page.evaluate(async () => {
  const mod = await import("/src/lib/coa-data.ts");
  return Object.values(mod.COA_PRODUCTS).flatMap((p) => p.panels.map((x) => x.file));
});
check("page links 48 certificate files", urls.length === 48, `${urls.length}`);
let served = 0;
for (const url of urls) {
  const res = await page.request.get(base + url);
  const head = (await res.body()).subarray(0, 4).toString();
  if (res.status() === 200 && head === "%PDF") served++;
}
check("every linked certificate downloads as a PDF", served === urls.length, `${served}/${urls.length}`);

// ── the product pages quote the same lot and purity as the certificates.
// They are rendered from the catalog, not from the COA data, so the two can
// drift apart and each page stays internally consistent while disagreeing.
{
  const catalog = await readFile("src/lib/catalog.ts", "utf8");
  const marks = [...catalog.matchAll(/slug: "([^"]+)"|ph\("([^"]+)"/g)].map((m) => ({
    slug: m[1] ?? m[2],
    at: m.index,
  }));
  let checked = 0;
  const orphans = [];
  for (let i = 0; i < marks.length; i++) {
    const block = catalog.slice(marks[i].at, marks[i + 1]?.at ?? catalog.length);
    for (const v of block.matchAll(/\{ size: "([^"]+)", price: [\d.]+, lot: "([^"]*)", purity: "([^"]*)"/g)) {
      const [, size, lot, purity] = v;
      const cert = certs.get(lot);
      if (!cert) {
        // A variant with no certificate must carry no batch number at all.
        check(`catalog ${marks[i].slug} ${size}: no invented lot number`, lot === "", `lot "${lot}"`);
        orphans.push(`${marks[i].slug} ${size}`);
        continue;
      }
      checked++;
      check(
        `catalog ${marks[i].slug} ${size}: purity matches certificate ${lot}`,
        purity === cert.purity,
        `catalog ${purity}, PDF ${cert.purity}`,
      );
    }
  }
  check("catalog variants were checked against certificates", checked === 21, `${checked} checked`);
  // Known gap, asserted so it can't grow silently.
  check(
    "only the 6 known variants lack a certificate",
    orphans.length === 6,
    orphans.join("; ") || "none",
  );
}

// ── the viewer opens and renders the certificate inline
await page.locator("text=View COA").first().click();
const dialog = page.getByRole("dialog");
await dialog.waitFor({ state: "visible" });
await page.waitForSelector("canvas", { timeout: 30_000 }).catch(() => {});
// "Loading certificate…" must clear: a <canvas> element exists from the moment
// the page is appended, well before pdf.js has painted anything into it.
const finished = await page
  .locator("text=Loading certificate")
  .waitFor({ state: "hidden", timeout: 60_000 })
  .then(() => true)
  .catch(() => false);
check("viewer finishes loading the certificate", finished);

const canvases = await page.locator("canvas").count();
check("viewer renders every page of the PDF", canvases >= 2, `${canvases} page canvases`);

// And the canvas has ink on it, not just dimensions.
const painted = await page.evaluate(() => {
  const c = document.querySelector("canvas");
  if (!c) return null;
  const ctx = c.getContext("2d");
  const { data } = ctx.getImageData(0, 0, Math.min(c.width, 600), Math.min(c.height, 600));
  let dark = 0;
  for (let i = 0; i < data.length; i += 4) if (data[i] < 200) dark++;
  return { width: c.width, dark };
});
check("rendered certificate has visible content", !!painted && painted.dark > 500, JSON.stringify(painted));
check("viewer offers the file in a new tab", await dialog.locator("text=Open in new tab").isVisible());
await page.screenshot({ path: "./.coa-shots/viewer.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: "./.coa-shots/archive.png", fullPage: false });

await browser.close();

console.log(`\n${pass}/${pass + failures.length} checks passed`);
if (failures.length) {
  console.log("\nfailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
