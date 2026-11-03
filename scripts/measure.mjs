/**
 * Lighthouse mobile run + transferred-bytes breakdown for one URL.
 * Usage: node scripts/measure.mjs <label> [url]
 */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { writeFileSync } from "node:fs";

const label = process.argv[2] ?? "run";
const url = process.argv[3] ?? "http://localhost:3000/";

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"],
  chromePath:
    process.env.CHROME_PATH ?? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
});

const runnerResult = await lighthouse(
  url,
  {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    // Lighthouse's default mobile emulation: Moto G Power, 4x CPU throttle,
    // simulated slow 4G. The same settings for both runs.
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
    onlyCategories: ["performance"],
  },
);

await chrome.kill();

const lhr = runnerResult.lhr;
const a = lhr.audits;

const num = (id) => a[id]?.numericValue ?? null;
const ms = (v) => (v == null ? "n/a" : `${Math.round(v)} ms`);

const byType = {};
for (const item of a["network-requests"]?.details?.items ?? []) {
  const t = item.resourceType ?? "Other";
  byType[t] = (byType[t] ?? 0) + (item.transferSize ?? 0);
}
const totalBytes = Object.values(byType).reduce((s, n) => s + n, 0);

// The element audit nests its table differently across Lighthouse versions, so
// walk the details looking for the first node snippet.
function findSnippet(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  if (obj.type === "node" && obj.snippet) return obj.snippet;
  for (const v of Object.values(obj)) {
    const hit = findSnippet(v, depth + 1);
    if (hit) return hit;
  }
  return null;
}
const lcpEl = findSnippet(a["largest-contentful-paint-element"]?.details) ?? null;

const summary = {
  label,
  url,
  lcpElement: lcpEl,
  score: Math.round((lhr.categories.performance.score ?? 0) * 100),
  lcp: num("largest-contentful-paint"),
  tbt: num("total-blocking-time"),
  fcp: num("first-contentful-paint"),
  cls: num("cumulative-layout-shift"),
  speedIndex: num("speed-index"),
  totalBytes,
  byType,
  requests: (a["network-requests"]?.details?.items ?? []).length,
};

writeFileSync(`lh.${label}.json`, JSON.stringify(summary, null, 2));

console.log(`\n=== ${label} (Lighthouse mobile) ===`);
console.log(`performance score   ${summary.score}`);
console.log(`LCP                 ${ms(summary.lcp)}`);
console.log(`Total Blocking Time ${ms(summary.tbt)}`);
console.log(`FCP                 ${ms(summary.fcp)}`);
console.log(`Speed Index         ${ms(summary.speedIndex)}`);
console.log(`CLS                 ${summary.cls?.toFixed(3) ?? "n/a"}`);
console.log(`page weight         ${(totalBytes / 1024).toFixed(0)} KB over ${summary.requests} requests`);
if (lcpEl) console.log(`LCP element         ${lcpEl.slice(0, 110)}`);
for (const [t, b] of Object.entries(byType).sort((x, y) => y[1] - x[1])) {
  console.log(`   ${t.padEnd(12)} ${(b / 1024).toFixed(0).padStart(6)} KB`);
}
