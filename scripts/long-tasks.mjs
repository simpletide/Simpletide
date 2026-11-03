import puppeteer from "puppeteer-core";

const url = process.argv[2] || "http://localhost:3100/";
const chrome =
  process.env.CHROME_PATH ||
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.emulateCPUThrottling(4);

const scripts = [];
page.on("response", (r) => {
  const u = r.url();
  if (/\.(js|mjs)(\?|$)/.test(u)) scripts.push(u.split("/").pop());
});

await page.evaluateOnNewDocument(() => {
  window.__long = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries())
      window.__long.push({ start: Math.round(e.startTime), dur: Math.round(e.duration) });
  }).observe({ type: "longtask", buffered: true });
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3000));

const long = await page.evaluate(() => window.__long);
console.log("scripts requested:");
for (const s of [...new Set(scripts)]) console.log("  " + s);
console.log("\nlong tasks (>50ms):");
for (const t of long) console.log(`  start ${t.start}ms  dur ${t.dur}ms`);
console.log(
  "\ntotal long-task time:",
  long.reduce((a, t) => a + t.dur, 0),
  "ms"
);

await browser.close();
