// Reports the LCP element under mobile emulation + 4x CPU / slow-4G throttling.
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://localhost:3100/";
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ?? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});

const page = await browser.newPage();
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem("simpletide-researcher-verified", "true");
  } catch {}
  window.__lcp = null;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__lcp = {
        time: Math.round(e.startTime),
        url: e.url || null,
        tag: e.element ? e.element.tagName : null,
        cls: e.element ? (e.element.className || "").toString().slice(0, 90) : null,
        text: e.element ? (e.element.textContent || "").trim().slice(0, 70) : null,
        size: e.size,
      };
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
});

await page.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
const cdp = await page.target().createCDPSession();
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
await new Promise((r) => setTimeout(r, 1500));

const lcp = await page.evaluate(() => {
  if (window.__lcp) return window.__lcp;
  const entries = performance.getEntriesByType("largest-contentful-paint");
  const e = entries[entries.length - 1];
  if (!e) return null;
  return {
    time: Math.round(e.startTime),
    url: e.url || null,
    tag: e.element ? e.element.tagName : null,
    cls: e.element ? (e.element.className || "").toString().slice(0, 90) : null,
    text: e.element ? (e.element.textContent || "").trim().slice(0, 70) : null,
    size: e.size,
  };
});
console.log(JSON.stringify(lcp, null, 2));
await browser.close();
