// Lists the images a mobile browser actually downloads for a URL.
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
});
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await page.setUserAgent(
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
);

const images = [];
page.on("response", async (res) => {
  const type = res.headers()["content-type"] ?? "";
  if (!/^image\//.test(type)) return;
  let size = 0;
  try {
    size = (await res.buffer()).length;
  } catch {}
  images.push({ url: res.url().replace(/^https?:\/\/[^/]+/, ""), size });
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 90000 });
await browser.close();

images.sort((a, b) => b.size - a.size);
let total = 0;
for (const i of images) {
  total += i.size;
  console.log(`${String(Math.round(i.size / 1024)).padStart(6)} KB  ${i.url}`);
}
console.log(`\n${images.length} images, ${(total / 1024).toFixed(0)} KB total`);
