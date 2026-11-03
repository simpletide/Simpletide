/**
 * Drives a real Chrome against the running site and checks the flows that the
 * lazy-loading work could plausibly have broken.
 *
 * Usage: node scripts/verify-functionality.mjs [baseUrl]
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:8080";
const CHROME =
  process.env.CHROME_PATH ?? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";

const IPHONE = {
  viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function newPage({ mobile = false } = {}) {
  const page = await browser.newPage();
  // The 21+ researcher gate is a full-screen modal that swallows clicks. Mark
  // it accepted up front so these checks exercise the page behind it.
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("simpletide-researcher-verified", "true");
    } catch {
      /* ignore */
    }
  });
  if (mobile) {
    await page.setViewport(IPHONE.viewport);
    await page.setUserAgent(IPHONE.ua);
  } else {
    await page.setViewport({ width: 1440, height: 900 });
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  return { page, errors, requests };
}

const noise = (e) =>
  /favicon|Download the React DevTools|net::ERR_|Failed to load resource/i.test(e);

// ---------------------------------------------------------------- homepage
{
  const { page, errors, requests } = await newPage({ mobile: true });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });

  check("homepage renders hero", (await page.$("img[alt*='research vial']")) !== null);
  check("no JS errors on homepage", errors.filter((e) => !noise(e)).length === 0, errors.filter((e) => !noise(e))[0] ?? "");

  // A signed-out visitor has no session to restore, so the SDK must NOT be
  // fetched here. (Signed-in visitors are covered by the session test below.)
  const supabaseFetched = requests.some((u) => /supabase/i.test(u));
  check("signed-out homepage skips the supabase chunk", !supabaseFetched);

  // Search dropdown must not exist until opened.
  const searchBefore = await page.$eval("body", (b) => b.innerText.includes("Search for a product"));
  check("search panel absent before opening", !searchBefore);

  await page.click("button[aria-label='Search']");
  await page.waitForFunction(
    () => document.querySelector("input[aria-label='Search for a product']") !== null,
    { timeout: 15000 },
  );
  check("search opens on click", true);

  await page.type("input[aria-label='Search for a product']", "tesa");
  await new Promise((r) => setTimeout(r, 600));
  const hasResult = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a,div")).some((n) => /Tesamorelin/i.test(n.textContent ?? "")),
  );
  check("search returns results", hasResult);
  await page.keyboard.press("Escape");

  // Mobile menu
  await page.click("button[aria-label='Toggle menu']");
  await page.waitForFunction(
    () => document.querySelector("aside[aria-label='Menu']") !== null,
    { timeout: 15000 },
  );
  check("mobile menu opens", true);
  await page.click("button[aria-label='Close menu']");

  await page.close();
}

// ---------------------------------------------------------------- cart
{
  const { page, errors } = await newPage({ mobile: true });
  await page.goto(`${BASE}/products`, { waitUntil: "networkidle0", timeout: 60000 });

  // Cards with sizes open a picker first; the second "Add to cart" (inside the
  // picker) is the one that actually adds.
  const added = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      /add to cart/i.test(b.textContent ?? ""),
    );
    if (!btn) return false;
    btn.click();
    return true;
  });
  check("found an Add to cart button", added);

  await new Promise((r) => setTimeout(r, 500));
  await page.evaluate(() => {
    const picker = document.querySelector(".pointer-events-auto");
    const confirm = picker
      ? Array.from(picker.querySelectorAll("button")).find((b) => /add to cart/i.test(b.textContent ?? ""))
      : null;
    if (confirm) confirm.click();
  });

  await page.waitForFunction(
    () => document.querySelector("aside[aria-label='Shopping Cart']") !== null,
    { timeout: 15000 },
  );
  check("cart drawer opens after add", true);

  const countAfterAdd = await page.evaluate(
    () => JSON.parse(localStorage.getItem("simpletide_cart_v1") || "[]").length,
  );
  check("item persisted to localStorage", countAfterAdd > 0, `${countAfterAdd} line(s)`);

  const subtotalShown = await page.evaluate(
    () => /\$\d/.test(document.querySelector("aside[aria-label='Shopping Cart']")?.textContent ?? ""),
  );
  check("cart drawer shows a price", subtotalShown);

  // Reload: cart must survive and the badge must reflect it.
  await page.reload({ waitUntil: "networkidle0", timeout: 60000 });
  const countAfterReload = await page.evaluate(
    () => JSON.parse(localStorage.getItem("simpletide_cart_v1") || "[]").length,
  );
  check("cart survives refresh", countAfterReload === countAfterAdd, `${countAfterReload} line(s)`);

  const badge = await page.evaluate(() => {
    const b = document.querySelector("button[aria-label='Open cart'] span");
    return b ? b.textContent.trim() : null;
  });
  check("header cart badge renders", badge !== null && badge !== "", `badge="${badge}"`);

  // Remove the item again.
  await page.click("button[aria-label='Open cart']");
  await page.waitForFunction(
    () => document.querySelector("aside[aria-label='Shopping Cart']") !== null,
    { timeout: 15000 },
  );
  check("cart reopens from header icon", true);
  check("no JS errors in cart flow", errors.filter((e) => !noise(e)).length === 0, errors.filter((e) => !noise(e))[0] ?? "");

  await page.close();
}

// ------------------------------------------- signed-in session still refreshes
{
  const { page, errors, requests } = await newPage({ mobile: true });
  await page.evaluateOnNewDocument(() => {
    // Shape only — enough for the stored-session probe to fire. The SDK will
    // reject it as expired, which is exactly the refresh path we want exercised.
    localStorage.setItem(
      "sb-btnkmungslabzsszpbhv-auth-token",
      JSON.stringify({ access_token: "x", refresh_token: "y", expires_at: 1 }),
    );
  });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 60000 });
  check(
    "signed-in homepage loads supabase after paint",
    requests.some((u) => /supabase/i.test(u)),
  );
  const real = errors.filter((e) => !noise(e));
  check("signed-in homepage has no JS errors", real.length === 0, real[0] ?? "");
  await page.close();
}

// ---------------------------------------------------- supabase-backed pages
// `needsSdk` is false for order tracking: it posts to /api/order-track so a
// guest can look up an order without the browser SDK.
for (const [label, path, marker, needsSdk] of [
  ["login page", "/auth/login", /sign in|log in|email/i, true],
  ["signup page", "/auth/signup", /sign up|create|email/i, true],
  ["account page", "/account", /account|sign in|log in/i, true],
  ["checkout page", "/checkout", /checkout|cart|shipping/i, true],
  ["order tracking", "/track-order", /track|order/i, false],
]) {
  const { page, errors, requests } = await newPage();
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 60000 });
  const text = await page.evaluate(() => document.body.innerText);
  check(`${label} renders`, marker.test(text));
  if (needsSdk) {
    check(
      `${label} loads supabase`,
      requests.some((u) => /supabase/i.test(u)),
    );
  }
  const real = errors.filter((e) => !noise(e));
  check(`${label} has no JS errors`, real.length === 0, real[0] ?? "");
  await page.close();
}

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("\nFAILURES:");
  for (const f of failed) console.log(`  - ${f.name}${f.detail ? `: ${f.detail}` : ""}`);
  process.exit(1);
}
