import puppeteer from "puppeteer-core";
import { gzipSync } from "node:zlib";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const url = process.argv[2] || "http://localhost:3100/";
const dir = ".output/public/assets";
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const names = new Set();
page.on("response", (r) => {
  const u = r.url();
  if (/\.(js|mjs)(\?|$)/.test(u)) names.add(u.split("/").pop());
});
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));
await browser.close();

const rows = [...names]
  .map((n) => {
    const p = join(dir, n);
    if (!existsSync(p)) return { n, raw: 0, gz: 0 };
    const buf = readFileSync(p);
    return { n, raw: buf.length, gz: gzipSync(buf).length };
  })
  .sort((a, b) => b.gz - a.gz);

let tr = 0,
  tg = 0;
for (const r of rows) {
  tr += r.raw;
  tg += r.gz;
  console.log(
    `${(r.gz / 1024).toFixed(1).padStart(8)} KB gz  ${(r.raw / 1024).toFixed(1).padStart(8)} KB raw  ${r.n}`
  );
}
console.log(`\ntotal JS: ${(tg / 1024).toFixed(1)} KB gzipped / ${(tr / 1024).toFixed(1)} KB raw`);
