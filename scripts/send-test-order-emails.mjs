/**
 * Send (or preview) the two new Simpletide order emails.
 *
 *   Preview only (no credentials, writes HTML files you can open):
 *     node scripts/send-test-order-emails.mjs --preview
 *
 *   Send real test emails (needs mailbox credentials):
 *     EMAIL_USER=support@simpletide.com EMAIL_PASS=*** \
 *       node scripts/send-test-order-emails.mjs ransom123devon@gmail.com
 *
 * Credentials are read from the environment, or from a local .env in this repo
 * or the backend repo (../simpletide-api/.env). Uses Namecheap Private
 * Email SMTP — the same path the live order emails use. This script does NOT
 * touch the old site or its deployed functions.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderCardEmail, renderVenmoEmail, sampleCardOrder, sampleVenmoOrder } from "./order-emails.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const args = process.argv.slice(2);
const previewOnly = args.includes("--preview");
const toArg = args.find((a) => a.includes("@"));
const TO = toArg || "ransom123devon@gmail.com";

/** Minimal .env loader (no dependency). Does not overwrite existing env vars. */
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(repoRoot, ".env"));
loadEnvFile(resolve(repoRoot, "..", "simpletide-api", ".env"));

// --- Render both emails -----------------------------------------------------
const cardHtml = renderCardEmail({ ...sampleCardOrder, email: TO });
const venmoHtml = renderVenmoEmail({ ...sampleVenmoOrder, email: TO });

// Always write previews you can open in a browser.
const previewDir = join(repoRoot, "scripts", "preview");
mkdirSync(previewDir, { recursive: true });
const cardPath = join(previewDir, "order-confirmation-card.html");
const venmoPath = join(previewDir, "order-placed-venmo.html");
writeFileSync(cardPath, cardHtml, "utf8");
writeFileSync(venmoPath, venmoHtml, "utf8");
console.log("Previews written:");
console.log("  Card  :", cardPath);
console.log("  Venmo :", venmoPath);

if (previewOnly) {
  console.log("\n--preview set; not sending. Open the files above to review.");
  process.exit(0);
}

// --- Send -------------------------------------------------------------------
const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.trim();
const emailHost =
  process.env.PRIVATEEMAIL_SMTP_HOST?.trim() ||
  process.env.EMAIL_HOST?.trim() ||
  "mail.privateemail.com";
const emailPort = parseInt(process.env.EMAIL_PORT?.trim() || "587", 10);

if (!emailUser || !emailPass) {
  console.error("\n❌ EMAIL_USER / EMAIL_PASS not found in environment or .env.");
  console.error("   Set them and re-run, e.g. (PowerShell):");
  console.error('     $env:EMAIL_USER="support@simpletide.com"');
  console.error('     $env:EMAIL_PASS="<mailbox app password>"');
  console.error("     node scripts/send-test-order-emails.mjs " + TO);
  process.exit(1);
}

let nodemailer;
try {
  nodemailer = (await import("nodemailer")).default;
} catch {
  console.error("\n❌ nodemailer is not installed. Run:  npm i -D nodemailer");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  auth: { user: emailUser, pass: emailPass },
  tls: { rejectUnauthorized: false },
});

const stamp = new Date().toISOString().slice(0, 10);

async function send(subject, html) {
  const info = await transporter.sendMail({
    from: `"Simpletide" <${emailUser}>`,
    to: TO,
    subject,
    html,
  });
  console.log(`✅ Sent "${subject}" -> ${TO} (${info.messageId})`);
}

try {
  await send(`[TEST ${stamp}] Simpletide — Order Confirmed ${sampleCardOrder.orderNumber}`, cardHtml);
  await send(`[TEST ${stamp}] Simpletide — Order Placed (Venmo) ${sampleVenmoOrder.orderNumber}`, venmoHtml);
  console.log("\nDone. Check the inbox for", TO);
} catch (err) {
  console.error("\n❌ Send failed:", err?.message || err);
  process.exit(1);
}
