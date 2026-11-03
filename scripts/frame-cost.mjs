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

const result = await page.evaluate(async () => {
  const canvas = document.querySelector("canvas");
  if (!canvas) return { error: "no canvas" };

  // Sample real frame-to-frame deltas while the site's own loop is running.
  const deltas = await new Promise((resolve) => {
    const out = [];
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      out.push(now - last);
      last = now;
      if (out.length < 90) requestAnimationFrame(tick);
      else resolve(out);
    };
    requestAnimationFrame(tick);
  });

  const sorted = [...deltas].slice(5).sort((a, b) => a - b);
  return {
    canvasPx: `${canvas.width}x${canvas.height}`,
    backingPixels: canvas.width * canvas.height,
    medianFrameMs: Math.round(sorted[Math.floor(sorted.length / 2)]),
    p90FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.9)]),
    effectiveFps: Math.round(1000 / sorted[Math.floor(sorted.length / 2)]),
  };
});

console.log(`CPU throttle: ${throttle}x`);
console.log(JSON.stringify(result, null, 2));
await browser.close();
