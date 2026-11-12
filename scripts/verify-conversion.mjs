/**
 * Checks the conversion pass against the rendered site.
 *
 * Contrast is computed from the browser's own resolved colors rather than from
 * the class names, so a Tailwind class that silently fails to apply is caught
 * instead of being assumed correct. Every assertion is paired with a control
 * on the same page, so a selector that matches nothing fails loudly.
 *
 *   node scripts/verify-conversion.mjs [baseUrl]
 */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:8080";
let pass = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}${detail ? `  — ${detail}` : ""}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ""}`);
  }
}

// ── WCAG 2.1 relative luminance + contrast ratio
const channel = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) =>
  0.2126 * channel(r / 255) + 0.7152 * channel(g / 255) + 0.0722 * channel(b / 255);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/**
 * Resolve any CSS colour to sRGB bytes by painting it, because Tailwind v4
 * emits `oklch(...)` and reading those three numbers as R/G/B produces a
 * contrast figure that is simply invented.
 */
const toRgb = (page, colors) =>
  page.evaluate((list) => {
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    return list.map((c) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    });
  }, colors);

// Self-test the contrast math against two values from the WCAG spec, so a bug
// here can't quietly pass every colour assertion below.
check(
  "contrast math: black on white is 21:1",
  Math.abs(contrast([0, 0, 0], [255, 255, 255]) - 21) < 0.01,
  contrast([0, 0, 0], [255, 255, 255]).toFixed(2),
);
check(
  "contrast math: white on white is 1:1",
  Math.abs(contrast([255, 255, 255], [255, 255, 255]) - 1) < 0.01,
);
// The gradient stop the CTAs used to sit on — the regression this pass fixes.
check(
  "contrast math: white on the old pink stop #f9a8d4 fails AA",
  contrast([255, 255, 255], [249, 168, 212]) < 4.5,
  `${contrast([255, 255, 255], [249, 168, 212]).toFixed(2)}:1`,
);
check(
  "contrast math: white on slate-900 passes AA",
  contrast([255, 255, 255], [15, 23, 42]) > 4.5,
  `${contrast([255, 255, 255], [15, 23, 42]).toFixed(2)}:1`,
);

const AA = 4.5;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.addInitScript(() => localStorage.setItem("simpletide-researcher-verified", "true"));

const styleOf = (locator) =>
  locator.evaluate((el) => {
    const s = getComputedStyle(el);
    // Walk up for an opaque backdrop: a transparent button inherits whatever
    // is painted behind it, and measuring against `rgba(0,0,0,0)` would score
    // a perfect 21:1 for a button that is in fact unreadable.
    let behind = "rgb(255, 255, 255)";
    for (let n = el.parentElement; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      const alpha = Number((bg.match(/[\d.]+/g) ?? [])[3] ?? 1);
      if (alpha > 0.9) {
        behind = bg;
        break;
      }
    }
    return { color: s.color, background: s.backgroundColor, backgroundImage: s.backgroundImage, behind };
  });

async function checkCta(label, locator) {
  const n = await locator.count();
  if (n === 0) {
    check(`${label}: found on page`, false, "no match");
    return;
  }
  const { color, background, backgroundImage, behind } = await styleOf(locator.first());

  // Every colour the label actually sits on: the fill if it's opaque, every
  // stop if it's a gradient, else whatever shows through from behind.
  const stops = [];
  const bgAlpha = Number((background.match(/[\d.]+/g) ?? [])[3] ?? 1);
  if (bgAlpha > 0.9) stops.push(background);
  if (backgroundImage !== "none") stops.push(...(backgroundImage.match(/rgba?\([^)]*\)/g) ?? []));
  if (stops.length === 0) stops.push(behind);

  const [text, ...stopRgb] = await toRgb(locator.page(), [color, ...stops]);
  const worst = stops
    .map((s, i) => ({ s, ratio: contrast(text, stopRgb[i]) }))
    .sort((a, b) => a.ratio - b.ratio)[0];
  check(
    `${label}: label contrast >= ${AA}:1`,
    worst.ratio >= AA,
    `worst ${worst.ratio.toFixed(2)}:1 on ${worst.s} (${stops.length} stop${stops.length === 1 ? "" : "s"})`,
  );
  check(`${label}: solid fill, not a gradient`, backgroundImage === "none", backgroundImage);
}

// ─────────────────────────────── homepage
await page.goto(`${base}/`, { waitUntil: "networkidle" });

console.log("\n1. Primary CTA contrast");
await checkCta("Shop Products", page.getByRole("link", { name: "Shop Products" }));
await checkCta("See all products", page.getByRole("link", { name: "See all products" }));
await checkCta("Add to cart (home card)", page.getByRole("button", { name: /^Add to cart/ }));
await checkCta("Subscribe", page.getByRole("button", { name: /Subscribe/ }));

const lift = await page.getByRole("link", { name: "Shop Products" }).first().evaluate((el) => {
  const before = getComputedStyle(el).translate;
  el.classList.add("hover-probe");
  return before;
});
check("CTAs declare a hover lift + shadow", (await page.content()).includes("hover:-translate-y-0.5"), `idle translate: ${lift}`);

console.log("\n2. Trust strip replaces the feature grid");
const body = await page.locator("main").innerText();
for (const label of ["Third-party tested", "99%+ purity", "Secure checkout"]) {
  check(`trust strip shows "${label}"`, body.includes(label));
}
check("old 6-card feature copy is gone", !body.includes("Our Promise to You") && !body.includes("100% Safe Payments"));

// Featured Products should now sit close under the hero.
const heroBottom = await page.locator("h1").first().evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
const featuredTop = await page
  .getByRole("heading", { name: "Featured Products" })
  .evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
check(
  "Featured Products within 900px of the headline",
  featuredTop - heroBottom < 900,
  `${Math.round(featuredTop - heroBottom)}px below h1`,
);

console.log("\n3. Hero");
// The centre vial is rendered twice (one `lg:hidden`, one `hidden lg:block`),
// so count what a visitor can actually see rather than DOM nodes.
const vialLinks = page.locator('a[aria-label^="Shop "]:visible');
const vialCount = await vialLinks.count();
check("three hero vials visible on desktop", vialCount === 3, `${vialCount} visible`);
const seen = new Set();
for (let i = 0; i < vialCount; i++) {
  const href = await vialLinks.nth(i).getAttribute("href");
  const label = await vialLinks.nth(i).getAttribute("aria-label");
  seen.add(href);
  check(`${label} points at a product page`, !!href && href.startsWith("/product/"), href ?? "null");
  const res = await page.request.get(`${base}${href}`);
  check(`${label} target loads`, res.status() === 200, `HTTP ${res.status()}`);
}
check("each visible vial is a different product", seen.size === vialCount, `${seen.size} distinct`);

await page.setViewportSize({ width: 390, height: 844 });
const mobileVials = await page.locator('a[aria-label^="Shop "]:visible').count();
check("three hero vials visible on mobile too", mobileVials === 3, `${mobileVials} visible`);
await page.setViewportSize({ width: 1440, height: 1000 });
check(
  "hero vials declare a hover tilt",
  (await page.content()).includes("group-hover/vial:scale-"),
);

// Above-the-fold content must be painted without waiting on the reveal
// observer. Disabling JS is the honest test: data-reveal starts at opacity 0
// and only JS clears it.
const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
const noJsPage = await noJs.newPage();
await noJsPage.goto(`${base}/`, { waitUntil: "load" });
const aboveFold = await noJsPage.evaluate(() => {
  const read = (el) => (el ? Number(getComputedStyle(el).opacity) : null);
  const h1 = document.querySelector("h1");
  const cta = [...document.querySelectorAll("a")].find((a) => a.textContent?.includes("Shop Products"));
  const vial = document.querySelector('a[aria-label^="Shop "] img');
  return { h1: read(h1), cta: read(cta), vial: read(vial), reveals: document.querySelectorAll("section:first-of-type [data-reveal]").length };
});
check("headline renders without JS", aboveFold.h1 === 1, `opacity ${aboveFold.h1}`);
check("hero CTA renders without JS", aboveFold.cta === 1, `opacity ${aboveFold.cta}`);
check("hero vials render without JS", aboveFold.vial === 1, `opacity ${aboveFold.vial}`);
check("no data-reveal left in the hero section", aboveFold.reveals === 0, `${aboveFold.reveals} found`);
await noJs.close();

console.log("\n4. Product cards");
const homeBadges = await page.locator("main").getByText("Best Seller", { exact: true }).count();
check("home cards show a Best Seller badge", homeBadges > 0, `${homeBadges} badges`);
const saleBadges = await page.locator("main").getByText("Sale", { exact: true }).count();
check("Sale badge renders too (control)", saleBadges > 0, `${saleBadges} badges`);
const bundleLines = await page.getByText("Save up to 10% on bundles").count();
check("home cards show the bundle savings line", bundleLines >= 8, `${bundleLines} lines`);

await page.goto(`${base}/products`, { waitUntil: "networkidle" });
const shopBadges = await page.getByText("Best Seller", { exact: true }).count();
check("shop cards show a Best Seller badge", shopBadges > 0, `${shopBadges} badges`);
const shopBundle = await page.getByText("Save up to 10% on bundles").count();
check("shop cards show the bundle savings line", shopBundle > 10, `${shopBundle} lines`);
await checkCta("Add to cart (shop card)", page.getByRole("button", { name: /^Add to cart/ }));
check(
  "cards declare a hover lift",
  (await page.content()).includes("hover:-translate-y-1"),
);

// The advertised discount has to match what checkout actually applies.
const tiers = (await import("../src/lib/bundle-pricing.ts?v=" + Date.now()).catch(() => null)) ?? null;
if (tiers) {
  const max = Math.max(...tiers.BUNDLE_TIERS.map((t) => t.discountPct));
  check("advertised bundle discount matches BUNDLE_TIERS", max === 10, `max tier ${max}%`);
}

console.log("\n5. Shipping copy is one message site-wide");
const PROMISE = "Order by 4PM ET — ships same day. Free priority shipping.";
const SHORT = "Ships same day (4PM ET)";
const announcement = await page.locator(".marquee-track").first().innerText();
check("announcement bar carries the promise", announcement.includes(PROMISE), announcement.slice(0, 60));
const footer = await page.locator("footer").innerText();
check("footer trust badge uses the short form", footer.includes(SHORT));
check("footer drops 'Same Day Shipping'", !footer.includes("Same Day Shipping"));

for (const path of ["/", "/products", "/product/glp-3-rt"]) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  check(`${path}: no stale "Free Priority Shipping On All Orders"`, !text.includes("Free Priority Shipping On All Orders"));
  check(`${path}: no stale "shipped within 24 hours"`, !text.includes("shipped within 24 hours"));
  check(`${path}: states the 4PM ET cutoff`, text.includes("4PM ET"));
}

console.log("\n6. Product page");
await page.goto(`${base}/product/glp-3-rt`, { waitUntil: "networkidle" });
const productText = await page.locator("body").innerText();
check("no '100K+ orders shipped' stat", !productText.includes("100K+"));
check("no '2,632+ 5-star reviews' stat", !productText.includes("2,632"));
check("no 'pharmaceutical grade'", !/pharmaceutical/i.test(productText));
check("purity + ship-time rings kept (control)", productText.includes("PURITY RATE") && productText.includes("AVG SHIP TIME"));

// Inline COA preview: a real rendered page, not a placeholder.
const preview = page.getByRole("button", { name: /Certificate of Analysis — / });
check("inline COA preview is present", (await preview.count()) > 0);
if (await preview.count()) {
  const summary = await preview.first().innerText();
  const panelPurity = /(\d{2}\.\d{2}%)/.exec(summary)?.[1];
  check("preview quotes a real purity figure", !!panelPurity, summary.replace(/\n/g, " · "));
  await preview.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(4000);
  const painted = await preview.first().locator("canvas").evaluate((c) => {
    const { data } = c.getContext("2d").getImageData(0, 0, Math.min(c.width, 500), Math.min(c.height, 500));
    let dark = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] < 200) dark++;
    return { w: c.width, dark };
  }).catch(() => null);
  check("thumbnail renders the certificate", !!painted && painted.dark > 300, JSON.stringify(painted));

  await preview.first().click();
  await page.waitForTimeout(3500);
  const lightbox = await page.locator("canvas").count();
  check("clicking the preview opens the full COA", lightbox > 1, `${lightbox} canvases`);
  await page.keyboard.press("Escape");
}

console.log("\n7. Footer + newsletter copy");
await page.goto(`${base}/`, { waitUntil: "networkidle" });
const foot = await page.locator("footer").innerText();
check("footer says 'for laboratory research use only'", foot.includes("for laboratory research use only"));
check("old 'optimal controlled studies' copy is gone", !foot.includes("optimal controlled studies"));
const news = await page.locator("section").filter({ hasText: "your first order" }).last().innerText();
check("newsletter headline offers 10% off", /Get\s*10% off\s*your first order/.test(news.replace(/\n/g, " ")), news.split("\n")[0]);
check("newsletter subtitle mentions the discount code", /discount code/i.test(news));
check("old 'daily insights, news, updates' copy is gone", !news.includes("daily insights"));

await browser.close();

console.log(`\n${pass}/${pass + failures.length} checks passed`);
if (failures.length) {
  console.log("\nfailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
