import puppeteer from "puppeteer-core";

const url = process.argv[2] || "http://localhost:3100/";
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));

const out = await page.evaluate(() => {
  const all = [...document.querySelectorAll("*")];
  const count = (pred) => all.filter(pred).length;

  const cs = (el) => getComputedStyle(el);
  const backdrop = all.filter((el) => {
    const v = cs(el).backdropFilter || cs(el).webkitBackdropFilter;
    return v && v !== "none";
  });
  const filtered = all.filter((el) => {
    const v = cs(el).filter;
    return v && v !== "none";
  });
  const shadows = all.filter((el) => {
    const v = cs(el).boxShadow;
    return v && v !== "none";
  });
  const gradients = all.filter((el) => (cs(el).backgroundImage || "").includes("gradient"));
  const animating = all.filter((el) => {
    const s = cs(el);
    return (s.animationName && s.animationName !== "none") || (s.transitionProperty && s.transitionProperty !== "none" && s.transitionDuration !== "0s");
  });
  const willChange = all.filter((el) => cs(el).willChange !== "auto");

  let maxDepth = 0;
  for (const el of all) {
    let d = 0;
    let p = el;
    while (p) {
      d++;
      p = p.parentElement;
    }
    if (d > maxDepth) maxDepth = d;
  }

  const sheetRules = [...document.styleSheets].reduce((n, s) => {
    try {
      return n + s.cssRules.length;
    } catch {
      return n;
    }
  }, 0);

  return {
    domElements: all.length,
    maxDepth,
    cssRules: sheetRules,
    backdropFilter: backdrop.length,
    backdropSamples: backdrop.slice(0, 6).map((e) => e.className?.toString?.().slice(0, 90)),
    filter: filtered.length,
    filterSamples: filtered.slice(0, 6).map((e) => e.className?.toString?.().slice(0, 90)),
    boxShadow: shadows.length,
    gradients: gradients.length,
    animatingOrTransitioning: animating.length,
    willChange: willChange.length,
  };
});

// Time a forced style recalc + layout of the whole document.
const recalc = await page.evaluate(() => {
  const t0 = performance.now();
  for (let i = 0; i < 10; i++) {
    document.documentElement.style.setProperty("--probe", String(i));
    void document.body.offsetHeight;
  }
  return Math.round(((performance.now() - t0) / 10) * 100) / 100;
});

console.log(JSON.stringify({ ...out, msPerFullRecalc: recalc }, null, 2));
await browser.close();
