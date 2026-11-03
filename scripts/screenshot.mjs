/**
 * Deterministic full-page screenshot (animations frozen via reduced-motion).
 * Usage: node scripts/screenshot.mjs <outfile> [url] [width] [height]
 */
import puppeteer from "puppeteer-core";

const out = process.argv[2] || "shot.png";
const url = process.argv[3] || "http://localhost:3100/";
const width = Number(process.argv[4] || 390);
const height = Number(process.argv[5] || 844);

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 700 });
await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await page.evaluateOnNewDocument(() => {
  localStorage.setItem("simpletide-researcher-verified", "true");
});
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
await page.screenshot({ path: out, fullPage: true });
console.log("wrote", out);
await browser.close();
