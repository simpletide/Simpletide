/**
 * Fire a test request at the DEPLOYED Supabase function
 * `send-venmo-order-placed-email` to confirm the new design renders live.
 *
 *   node scripts/test-live-venmo-email.mjs [recipient@example.com]
 *
 * Reads SUPABASE_URL + anon key from this repo's .env. Does not send via SMTP
 * directly — it invokes your live edge function exactly like the backend does.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sampleVenmoOrder } from "./order-emails.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
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

const TO = process.argv[2] || "ransom123devon@gmail.com";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anon =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("❌ Missing SUPABASE_URL or anon key in .env");
  process.exit(1);
}

const endpoint = `${url}/functions/v1/send-venmo-order-placed-email`;
const payload = { ...sampleVenmoOrder, email: TO };

console.log("POST", endpoint);
console.log("Recipient:", TO);

const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: anon,
    Authorization: `Bearer ${anon}`,
  },
  body: JSON.stringify(payload),
});

const text = await res.text();
console.log("Status:", res.status);
console.log("Response:", text);
process.exit(res.ok ? 0 : 1);
