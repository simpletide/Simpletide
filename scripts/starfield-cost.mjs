import puppeteer from "puppeteer-core";

const url = process.argv[2] || "http://localhost:3100/";
const throttle = Number(process.argv[3] || 4);

const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
await page.emulateCPUThrottling(throttle);
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

// Replicate the site's own draw call against a matching canvas so we can time
// it synchronously; rAF deltas are useless in headless (no real vsync).
const result = await page.evaluate((density) => {
  const live = document.querySelector("canvas");
  if (!live) return { error: "no canvas" };
  const w = live.width;
  const h = live.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const count = Math.round(((w * h) / (1000 * dpr * dpr)) * density);

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const ps = Array.from({ length: count }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.5 + Math.random(),
    fill: "rgba(255,255,255,0.6)",
  }));

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const base = 1.2 * dpr;
    for (const p of ps) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, base * p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.fill;
      ctx.fill();
    }
  };

  draw();
  const t0 = performance.now();
  for (let i = 0; i < 30; i++) draw();
  const perFrame = (performance.now() - t0) / 30;

  return {
    canvas: `${w}x${h}`,
    estimatedParticles: count,
    msPerFrame: Math.round(perFrame * 100) / 100,
    pctOfA60fpsBudget: Math.round((perFrame / 16.7) * 100) + "%",
  };
}, 0.65);

console.log(`CPU throttle: ${throttle}x`);
console.log(JSON.stringify(result, null, 2));
await browser.close();
