// Reports client chunk sizes (raw + gzip) for the last build.
// Usage: node scripts/chunk-sizes.mjs [label]
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const label = process.argv[2] ?? "current";
const dir = [".vercel/output/static/assets", "dist/client/assets"].find((d) => existsSync(d));
if (!dir) {
  console.error("No client build found. Run `npm run build` first.");
  process.exit(1);
}

const rows = readdirSync(dir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => {
    const buf = readFileSync(`${dir}/${f}`);
    return { name: f.replace(/-[A-Za-z0-9_-]{8}\.js$/, ".js"), raw: buf.length, gz: gzipSync(buf).length };
  })
  .sort((a, b) => b.raw - a.raw);

const totalRaw = rows.reduce((s, r) => s + r.raw, 0);
const totalGz = rows.reduce((s, r) => s + r.gz, 0);

const kb = (n) => (n / 1024).toFixed(0).padStart(6);
console.log(`\n=== ${label} :: client JS ===`);
console.log(`${"chunk".padEnd(42)}${"raw".padStart(8)}${"gzip".padStart(9)}`);
for (const r of rows.slice(0, 18)) console.log(`${r.name.padEnd(42)}${kb(r.raw)} KB${kb(r.gz)} KB`);
console.log("-".repeat(59));
console.log(`${`TOTAL (${rows.length} chunks)`.padEnd(42)}${kb(totalRaw)} KB${kb(totalGz)} KB`);

writeFileSync(`chunk-sizes.${label}.json`, JSON.stringify({ label, totalRaw, totalGz, rows }, null, 2));
