/**
 * Runs scripts/measure.mjs N times and reports medians.
 *
 * A single Lighthouse run swings by several hundred ms on LCP, which is wide
 * enough to invert a real improvement. Medians of three are stable enough to
 * compare before/after honestly.
 *
 * Usage: node scripts/measure-runs.mjs <label> <url> [runs]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const label = process.argv[2] ?? "run";
const url = process.argv[3] ?? "http://localhost:3100/";
const runs = Number(process.argv[4] ?? 3);

const all = [];
for (let i = 1; i <= runs; i++) {
  execFileSync(process.execPath, ["scripts/measure.mjs", `${label}-${i}`, url], { stdio: "ignore" });
  all.push(JSON.parse(readFileSync(`lh.${label}-${i}.json`, "utf8")));
  process.stdout.write(`  ${label} run ${i}/${runs} done\n`);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const summary = {
  label,
  runs,
  score: median(all.map((r) => r.score)),
  lcp: median(all.map((r) => r.lcp)),
  tbt: median(all.map((r) => r.tbt)),
  fcp: median(all.map((r) => r.fcp)),
  speedIndex: median(all.map((r) => r.speedIndex)),
  cls: median(all.map((r) => r.cls)),
  totalBytes: median(all.map((r) => r.totalBytes)),
  requests: median(all.map((r) => r.requests)),
  byType: all[all.length - 1].byType,
  lcpElement: all.map((r) => r.lcpElement).find(Boolean) ?? null,
  rawLcp: all.map((r) => Math.round(r.lcp)),
  rawTbt: all.map((r) => Math.round(r.tbt)),
};

writeFileSync(`lh.${label}.median.json`, JSON.stringify(summary, null, 2));

console.log(`\n=== ${label} :: median of ${runs} Lighthouse mobile runs ===`);
console.log(`performance score   ${summary.score}`);
console.log(`LCP                 ${Math.round(summary.lcp)} ms   (runs: ${summary.rawLcp.join(", ")})`);
console.log(`Total Blocking Time ${Math.round(summary.tbt)} ms   (runs: ${summary.rawTbt.join(", ")})`);
console.log(`FCP                 ${Math.round(summary.fcp)} ms`);
console.log(`Speed Index         ${Math.round(summary.speedIndex)} ms`);
console.log(`CLS                 ${summary.cls.toFixed(3)}`);
console.log(`page weight         ${(summary.totalBytes / 1024).toFixed(0)} KB over ${summary.requests} requests`);
if (summary.lcpElement) console.log(`LCP element         ${summary.lcpElement.slice(0, 120)}`);
