/**
 * Mobile menu drawer checks, run against a real browser at phone size.
 *
 * The bug this guards: the header sets `backdrop-blur`, and a backdrop-filter
 * makes an element the containing block for `position: fixed` descendants. The
 * drawer lived inside the header, so `h-full` resolved to the header's height
 * instead of the screen's. The white panel ended after the first two links and
 * the rest sat on bare page content -- unreadable and, where page controls
 * overlapped them, unclickable.
 *
 * Geometry is therefore what gets asserted: the panel must fill the screen and
 * every link must sit inside the panel, not merely exist in the DOM.
 *
 * Playwright is not a project dependency; install it to run this:
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/verify-mobile-menu.mjs [baseUrl] [screenshotDir]
 */
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:8080";
const shotDir = process.argv[3] ?? "./.menu-shots";
await mkdir(shotDir, { recursive: true });

let pass = 0;
const failures = [];
function check(name, ok, detail = "") {
  if (ok) pass++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const LINKS = ["Home", "Shop", "COA", "Track My Order", "About Us", "Contact Us", "My Account"];

const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["iPhone 13"] });
// Skip the age/researcher gate; it is a separate full-screen overlay.
await context.addInitScript(() => {
  localStorage.setItem("simpletide-researcher-verified", "true");
});
const page = await context.newPage();

await page.goto(`${base}/products`, { waitUntil: "networkidle" });
// Measured in the page, not from the Playwright device descriptor: under mobile
// emulation the layout viewport is taller than the descriptor's visual viewport,
// and the drawer is sized against the layout viewport.
const vp = await page.evaluate(() => ({
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
}));

await page.screenshot({ path: `${shotDir}/1-closed.png` });

const toggle = page.getByRole("button", { name: "Toggle menu" });
check("hamburger button is visible", await toggle.isVisible());
await toggle.click();

const drawer = page.getByRole("dialog", { name: "Menu" });
await drawer.waitFor({ state: "visible" });
await page.waitForTimeout(500); // slide-in transition
await page.screenshot({ path: `${shotDir}/2-open.png` });

// ── the panel itself
const box = await drawer.boundingBox();
check("drawer is on screen", !!box, box ? `${Math.round(box.width)}x${Math.round(box.height)}` : "no box");
check(
  "drawer is exactly screen height",
  Math.abs(box.height - vp.height) <= 1,
  `panel ${Math.round(box.height)}px vs screen ${vp.height}px`,
);
check("drawer starts at the top of the screen", Math.abs(box.y) <= 1, `top ${Math.round(box.y)}px`);
check("drawer is anchored to the right edge", Math.abs(box.x + box.width - vp.width) <= 1);

const bg = await drawer.evaluate((el) => getComputedStyle(el).backgroundColor);
check("drawer background is fully opaque", bg === "rgb(255, 255, 255)", bg);

// ── the scrim behind it. Addressed by test id: a class-based locator also
// matches the page's full-screen background, which is the right size whether
// or not the scrim is, and the check passes for the wrong reason.
const scrimBox = await page.getByTestId("mobile-menu-scrim").boundingBox();
check(
  "scrim covers the whole screen",
  scrimBox && scrimBox.width >= vp.width - 1 && scrimBox.height >= vp.height - 1,
  scrimBox ? `${Math.round(scrimBox.width)}x${Math.round(scrimBox.height)}` : "no scrim",
);

// ── every link readable (inside the panel) and clickable (nothing on top)
for (const label of LINKS) {
  const link = drawer.getByRole("link", { name: label, exact: true });
  const lb = await link.boundingBox();
  if (!lb) {
    check(`"${label}" is rendered`, false, "no bounding box");
    continue;
  }
  check(
    `"${label}" sits inside the white panel`,
    lb.y >= box.y - 1 && lb.y + lb.height <= box.y + box.height + 1,
    `link ${Math.round(lb.y)}–${Math.round(lb.y + lb.height)} vs panel ${Math.round(box.y)}–${Math.round(box.y + box.height)}`,
  );
  check(`"${label}" is a comfortable tap target`, lb.height >= 44, `${Math.round(lb.height)}px tall`);

  // Hit-test the centre: whatever the finger lands on must be this link.
  const hit = await page.evaluate(
    ([x, y, text]) => {
      const el = document.elementFromPoint(x, y);
      return el ? { tag: el.tagName, inLink: !!el.closest("a") && el.closest("a").innerText.trim() === text } : null;
    },
    [lb.x + lb.width / 2, lb.y + lb.height / 2, label],
  );
  check(`"${label}" receives the tap`, !!hit && hit.inLink, hit ? `hit <${hit.tag.toLowerCase()}>` : "hit nothing");
}

// ── and it actually navigates
await drawer.getByRole("link", { name: "About Us", exact: true }).click();
await page.waitForURL("**/about", { timeout: 10_000 }).catch(() => {});
check("tapping a link navigates", new URL(page.url()).pathname === "/about", page.url());
// The drawer stays mounted for its close transition, so wait it out.
const closed = await drawer
  .waitFor({ state: "hidden", timeout: 3_000 })
  .then(() => true)
  .catch(() => false);
check("drawer closes after navigating", closed);
await page.screenshot({ path: `${shotDir}/3-after-nav.png` });

await browser.close();

console.log(`\n${pass}/${pass + failures.length} checks passed`);
if (failures.length) {
  console.log("\nfailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
