/**
 * Rewrites the lot / purity / testDate on each catalog variant to the values
 * printed on that variant's certificate.
 *
 * The catalog shipped with invented placeholders ("ST-CJC-31A", "99.08%"), and
 * a product page quoting a lot number that no certificate backs is worse than
 * quoting none. Variants with no certificate on file are left alone and listed
 * at the end — they need a decision, not a guess.
 *
 *   node scripts/sync-catalog-coa.mjs [--write]
 */
import { readFile, writeFile } from "node:fs/promises";

const write = process.argv.includes("--write");
const CATALOG = "src/lib/catalog.ts";

const data = await readFile("src/lib/coa-data.ts", "utf8");

// slug -> size -> { lot, purity, tested }
const real = {};
{
  let slug = null;
  let size = null;
  for (const line of data.split("\n")) {
    const s = /^  "([^"]+)": \{/.exec(line);
    if (s) {
      slug = s[1];
      real[slug] = {};
      continue;
    }
    const sz = /^        size: "([^"]+)"/.exec(line);
    if (sz) {
      size = sz[1];
      real[slug][size] = {};
      continue;
    }
    for (const key of ["lot", "purity", "tested"]) {
      const m = new RegExp(`^        ${key}: "([^"]*)"`).exec(line);
      if (m && slug && size) real[slug][size][key] = m[1];
    }
  }
}

let src = await readFile(CATALOG, "utf8");

// Walk the file slug block by slug block so a variant is matched against the
// product it belongs to rather than the first size of that name anywhere.
const marks = [...src.matchAll(/slug: "([^"]+)"|ph\("([^"]+)"/g)].map((m) => ({
  slug: m[1] ?? m[2],
  at: m.index,
}));

const edits = [];
const orphans = [];
for (let i = 0; i < marks.length; i++) {
  const start = marks[i].at;
  const end = marks[i + 1]?.at ?? src.length;
  const block = src.slice(start, end);
  const slug = marks[i].slug;

  for (const v of block.matchAll(
    /\{ size: "([^"]+)", price: ([\d.]+), lot: "([^"]+)", purity: "([^"]+)", testDate: "([^"]+)"/g,
  )) {
    const [match, size, price, lot, purity, testDate] = v;
    const truth = real[slug]?.[size];
    if (!truth) {
      // No certificate: blank the invented values rather than leave a batch
      // number on the page that nothing backs. The UI hides a variant's COA
      // card when it has no certificate, so these render nothing.
      if (lot || purity || testDate) {
        orphans.push(`${slug} ${size} (cleared lot ${lot}, purity ${purity})`);
        edits.push({
          at: start + v.index,
          length: match.length,
          replacement: `{ size: "${size}", price: ${price}, lot: "", purity: "", testDate: ""`,
          label: `${slug} ${size}: ${lot}/${purity} -> cleared (no certificate)`,
        });
      }
      continue;
    }
    if (truth.lot === lot && truth.purity === purity) continue;
    edits.push({
      at: start + v.index,
      length: match.length,
      replacement: `{ size: "${size}", price: ${price}, lot: "${truth.lot}", purity: "${truth.purity}", testDate: "${truth.tested}"`,
      label: `${slug} ${size}: ${lot}/${purity} -> ${truth.lot}/${truth.purity}`,
    });
  }
}

// Apply back-to-front so earlier offsets stay valid.
for (const e of [...edits].sort((a, b) => b.at - a.at)) {
  src = src.slice(0, e.at) + e.replacement + src.slice(e.at + e.length);
}

for (const e of edits) console.log(`  ${e.label}`);
console.log(`\n${edits.length} variants updated to their certificate's values`);

if (orphans.length) {
  console.log(`\n${orphans.length} variants have no certificate:`);
  for (const o of orphans) console.log(`  - ${o}`);
}

if (write) {
  await writeFile(CATALOG, src, "utf8");
  console.log(`\nwrote ${CATALOG}`);
} else {
  console.log(`\n(dry run — pass --write to apply)`);
}
