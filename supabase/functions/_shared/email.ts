// Shared Simpletide email styling, HTML helpers, auth guard, and PrivateEmail SMTP transport.
// Used by all transactional Supabase Edge Functions in supabase/functions/.

import nodemailer from "npm:nodemailer";

export const SITE_URL = "https://simpletide.com";
export const SHOP_URL = `${SITE_URL}/products`;
export const TRACK_URL = `${SITE_URL}/track-order`;
export const SUPPORT_EMAIL = "support@simpletide.com";

export const SHIPPING_PROMISE = "Order by 4PM ET — ships same day. Free priority shipping.";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

/** Simpletide light brand tokens matching the storefront's pastel + slate-900 look. */
export const COLORS = {
  pageBg: "#f6f5fb",
  card: "#ffffff",
  cardBorder: "#e9e5f5",
  ink: "#0f172a",
  body: "#475569",
  muted: "#64748b",
  line: "#ece9f6",
  violet: "#7c3aed",
  violetDeep: "#5b21b6",
  tintBg: "#f5f3ff",
  tintBorder: "#ddd6fe",
  greenBg: "#ecfdf5",
  greenBorder: "#a7f3d0",
  greenText: "#047857",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  amberText: "#b45309",
  ctaBg: "#0f172a",
  ctaText: "#ffffff",
} as const;

export const PASTEL_BAR = "linear-gradient(90deg, #f472b6 0%, #a78bfa 50%, #38bdf8 100%)";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

export function money(n: unknown): string {
  const num = Number(n) || 0;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Maps normalized product names/aliases to their live Simpletide card image
 * under https://simpletide.com/images/cards/<slug>.webp.
 * Keys are lowercased with all non-alphanumeric characters stripped so minor
 * naming differences ("BPC-157", "bpc 157", "BPC157") all match cleanly.
 */
const PRODUCT_CARD_SLUG: Record<string, string> = {
  glp3rt: "glp-3-rt",
  retatrutide: "glp-3-rt",
  glp2tz: "glp-2-tz",
  tirzepatide: "glp-2-tz",
  glp1sm: "glp-1-sm",
  semaglutide: "glp-1-sm",
  elora: "elora",
  tesamorelin: "tesamorelin",
  motsc: "mots-c",
  glow: "glow",
  klow: "klow",
  kpv: "kpv",
  kpvghkcu: "kpv-ghk-cu",
  wolverine: "wolverine",
  wolverineblend: "wolverine",
  bpc157tb500: "wolverine",
  bacwater: "bac-water",
  bacteriostaticwater: "bac-water",
  cjc1295ipamorelin: "cjc-1295-ipamorelin",
  cjcipamorelin: "cjc-1295-ipamorelin",
  nad: "nad-plus",
  nadplus: "nad-plus",
  ss31: "ss-31",
  ghkcu: "ghk-cu",
  mt1: "mt1",
  melanotan1: "mt1",
  mt2: "melanotan-2",
  melanotan2: "melanotan-2",
  glutathione: "glutathione",
  adamax: "adamax",
  ara290: "ara-290",
  ss31motsc: "ss-31-mots-c",
  vip: "vip",
  ahkcu: "ahk-cu",
  bpc157: "bpc-157",
  tb500: "tb-500",
  semax: "semax",
  selank: "selank",
  selanksemax: "selank-semax",
  "5amino1mq": "5-amino-1mq",
  ipamorelin: "ipamorelin",
  igf1lr3: "igf1-lr3",
  snap8: "snap-8",
  cagrilintide: "cagrilintide",
  kisspeptin: "kisspeptin",
  pt141: "pt-141",
  thymosinalpha1: "thymosin-alpha-1",
  ta1: "thymosin-alpha-1",
  dsip: "dsip",
  sermorelin: "sermorelin",
  epithalon: "epithalon",
};

function normalizeProductKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Resolves the accurate product thumbnail URL for an email line item:
 * 1. Explicit item image URL (made absolute against simpletide.com if relative)
 * 2. Catalog card image lookup by product name (matches all 40 live products)
 * 3. Returns null if unknown — caller renders a clean Simpletide monogram badge
 *    instead of showing a broken image or the wrong compound's label.
 */
export function resolveProductImageUrl(item: EmailOrderItem): string | null {
  const explicit = (item.image || item.imageUrl || "").trim();
  if (explicit && !explicit.includes("/images/email-products/")) {
    return explicit.startsWith("http")
      ? explicit
      : `${SITE_URL}${explicit.startsWith("/") ? "" : "/"}${explicit}`;
  }

  const rawName = String(item.name || item.product_name || "").trim();
  if (!rawName) return null;

  const key = normalizeProductKey(rawName);
  const slug = PRODUCT_CARD_SLUG[key];
  if (slug) return `${SITE_URL}/images/cards/${slug}.webp`;

  // Also check if the product name includes a trailing dosage like "BPC-157 10mg"
  const withoutDose = normalizeProductKey(rawName.replace(/\b\d+(\.\d+)?\s*(mg|mcg|ml|iu)\b/gi, ""));
  const doseSlug = PRODUCT_CARD_SLUG[withoutDose];
  if (doseSlug) return `${SITE_URL}/images/cards/${doseSlug}.webp`;

  return null;
}

export interface EmailOrderItem {
  name?: string;
  product_name?: string;
  variant?: string;
  variant_spec?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  image?: string;
  imageUrl?: string;
}

export interface EmailShippingAddress {
  firstName?: string;
  lastName?: string;
  name?: string;
  street?: string;
  line1?: string;
  apartment?: string;
  line2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  zip?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
}

export function normalizeCarrier(carrier: unknown, trackingNumber: string): string {
  const raw = String(carrier ?? "").trim();
  if (raw) return raw;
  const t = trackingNumber.trim().toUpperCase();
  if (/^1Z[0-9A-Z]{16}$/.test(t)) return "UPS";
  if (/^\d{12}$|^\d{15}$|^\d{20}$/.test(t)) return "FedEx";
  return "USPS Priority";
}

export function carrierTrackingUrl(carrier: string, trackingNumber: string): string {
  const code = encodeURIComponent(trackingNumber.trim());
  const c = carrier.toLowerCase();
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${code}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${code}`;
  if (c.includes("dhl")) return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${code}`;
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${code}`;
}

export function renderOrderItemsTable(items: EmailOrderItem[]): string {
  if (!items || items.length === 0) return "";
  const rows = items
    .map((item) => {
      const name = escapeHtml(item.name || item.product_name || "Research Compound");
      const variant = escapeHtml(item.variant || item.variant_spec || "");
      const qty = Math.max(1, Number(item.quantity ?? item.qty ?? 1) || 1);
      const lineTotal = money((Number(item.price) || 0) * qty);
      const img = resolveProductImageUrl(item);
      const thumbHtml = img
        ? `<img src="${escapeHtml(img)}" alt="${name}" width="56" height="56" style="width:56px;height:56px;border-radius:10px;object-fit:cover;display:block;border:1px solid ${COLORS.line};background-color:#ffffff;" />`
        : `<div style="width:56px;height:56px;border-radius:10px;background-color:${COLORS.tintBg};border:1px solid ${COLORS.tintBorder};color:${COLORS.violetDeep};font-size:13px;font-weight:800;letter-spacing:.08em;line-height:56px;text-align:center;">ST</div>`;
      return `
      <tr>
        <td style="padding:14px;border-bottom:1px solid ${COLORS.line};">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;width:56px;">
                ${thumbHtml}
              </td>
              <td style="vertical-align:middle;">
                <span style="color:${COLORS.ink};font-size:15px;font-weight:700;display:block;line-height:1.35;">${name}</span>
                ${variant ? `<span style="font-size:12px;color:${COLORS.muted};display:block;margin-top:2px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${variant}</span>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td align="center" style="padding:14px 10px;border-bottom:1px solid ${COLORS.line};vertical-align:middle;color:${COLORS.ink};font-weight:600;font-size:14px;">${qty}</td>
        <td align="right" style="padding:14px;border-bottom:1px solid ${COLORS.line};vertical-align:middle;color:${COLORS.ink};font-weight:700;font-size:14px;white-space:nowrap;">${lineTotal}</td>
      </tr>`;
    })
    .join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;border:1px solid ${COLORS.line};border-radius:12px;overflow:hidden;">
    <thead>
      <tr style="background-color:#faf9fe;">
        <th align="left" style="padding:12px 14px;font-size:11px;text-transform:uppercase;color:${COLORS.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${COLORS.line};">Item</th>
        <th align="center" style="padding:12px 10px;font-size:11px;text-transform:uppercase;color:${COLORS.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${COLORS.line};">Qty</th>
        <th align="right" style="padding:12px 14px;font-size:11px;text-transform:uppercase;color:${COLORS.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${COLORS.line};">Price</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function renderAddressBlock(addr: EmailShippingAddress | null | undefined): string {
  if (!addr) return `<div style="color:${COLORS.body};">Address on file</div>`;
  const fullName =
    [addr.firstName, addr.lastName].filter(Boolean).join(" ").trim() || addr.name || "";
  const street = addr.street || addr.line1 || "";
  const apt = addr.apartment || addr.line2 || "";
  const zip = addr.zipCode || addr.zip || addr.postal_code || "";
  const cityStateZip = [
    addr.city ? `${addr.city}${addr.state ? `, ${addr.state}` : ""}` : addr.state || "",
    zip,
  ]
    .filter(Boolean)
    .join(" ");

  return [
    fullName ? `<div style="font-weight:700;color:${COLORS.ink};margin-bottom:4px;">${escapeHtml(fullName)}</div>` : "",
    street ? `<div style="color:${COLORS.body};line-height:1.6;">${escapeHtml(street)}${apt ? `, ${escapeHtml(apt)}` : ""}</div>` : "",
    cityStateZip ? `<div style="color:${COLORS.body};line-height:1.6;">${escapeHtml(cityStateZip)}</div>` : "",
    addr.country ? `<div style="color:${COLORS.body};line-height:1.6;">${escapeHtml(addr.country)}</div>` : "",
    addr.phone ? `<div style="color:${COLORS.body};line-height:1.6;margin-top:4px;">${escapeHtml(addr.phone)}</div>` : "",
  ]
    .filter(Boolean)
    .join("");
}

export function renderCtaButton(label: string, href: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:26px 0 8px 0;">
        <a href="${escapeHtml(href)}" style="display:inline-block;background-color:${COLORS.ctaBg};color:${COLORS.ctaText} !important;text-decoration:none;padding:14px 36px;border-radius:999px;font-size:15px;font-weight:700;letter-spacing:.01em;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export type BadgeTone = "violet" | "green" | "amber";

const BADGE_STYLES: Record<BadgeTone, { bg: string; border: string; color: string }> = {
  violet: { bg: COLORS.tintBg, border: COLORS.tintBorder, color: COLORS.violet },
  green: { bg: COLORS.greenBg, border: COLORS.greenBorder, color: COLORS.greenText },
  amber: { bg: COLORS.amberBg, border: COLORS.amberBorder, color: COLORS.amberText },
};

export function wrapEmailShell(opts: {
  preheader: string;
  badge: string;
  badgeTone?: BadgeTone;
  title: string;
  subtitle: string;
  bodyHtml: string;
}): string {
  const badgeStyle = BADGE_STYLES[opts.badgeTone ?? "violet"];
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <style>
    @media only screen and (max-width:620px){
      .shell{width:100% !important;}
      .pad{padding:26px 18px !important;}
      .hero{font-size:26px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.pageBg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:${COLORS.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${COLORS.pageBg};font-size:1px;line-height:1px;">${escapeHtml(opts.preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.pageBg};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" class="shell" style="max-width:600px;width:600px;">
          <tr>
            <td style="background-color:${COLORS.card};border:1px solid ${COLORS.cardBorder};border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(124,58,237,0.06);">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:6px;line-height:6px;font-size:6px;background:${PASTEL_BAR};">&nbsp;</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:36px 34px 30px 34px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom:14px;">
                          <span style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:${COLORS.violetDeep};font-weight:800;">SIMPLETIDE</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:14px;">
                          <span style="display:inline-block;background-color:${badgeStyle.bg};color:${badgeStyle.color};border:1px solid ${badgeStyle.border};border-radius:999px;padding:6px 14px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(opts.badge)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:8px;">
                          <h1 class="hero" style="margin:0;font-size:30px;line-height:1.18;font-weight:800;color:${COLORS.ink};">${escapeHtml(opts.title)}</h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:24px;">
                          <p style="margin:0;font-size:15px;color:${COLORS.body};line-height:1.6;">${escapeHtml(opts.subtitle)}</p>
                        </td>
                      </tr>
                    </table>

                    ${opts.bodyHtml}
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#faf9fe;border-top:1px solid ${COLORS.line};">
                <tr>
                  <td align="center" style="padding:24px 28px 22px 28px;">
                    <p style="margin:0 0 6px 0;font-size:15px;color:${COLORS.ink};font-weight:800;">Simpletide</p>
                    <p style="margin:0 0 12px 0;font-size:12px;color:${COLORS.muted};line-height:1.6;">Third-Party Lab Tested &bull; 99%+ Purity &bull; ${SHIPPING_PROMISE}</p>
                    <p style="margin:0 0 8px 0;padding-top:12px;border-top:1px solid ${COLORS.line};font-size:12px;color:${COLORS.muted};line-height:1.6;">For laboratory research use only. Not for human consumption.</p>
                    <p style="margin:0;font-size:12px;color:${COLORS.muted};">Questions? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:${COLORS.violet};text-decoration:none;font-weight:600;">${SUPPORT_EMAIL}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 10px 4px 10px;">
              <p style="margin:0;font-size:11px;color:${COLORS.muted};">&copy; ${year} Simpletide. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Constant-time string compare so secret checks don't leak timing info. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Protects internal transactional email functions (order & shipping confirmations)
 * so they cannot be abused as an open spam relay.
 *
 * Accepts either:
 *   1. `x-webhook-secret: <EMAIL_WEBHOOK_SECRET>` (for Supabase Database Webhooks or backend calls)
 *   2. `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (for trusted server-side calls)
 */
export function isAuthorizedInternalRequest(req: Request): boolean {
  const webhookSecret = Deno.env.get("EMAIL_WEBHOOK_SECRET")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();

  const providedWebhook = req.headers.get("x-webhook-secret")?.trim() || "";
  if (webhookSecret && providedWebhook && timingSafeEqual(providedWebhook, webhookSecret)) {
    return true;
  }

  const authHeader = req.headers.get("authorization")?.trim() || "";
  const bearer = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (serviceRoleKey && bearer && timingSafeEqual(bearer, serviceRoleKey)) {
    return true;
  }

  return false;
}

/** Sends an email via PrivateEmail SMTP (mail.privateemail.com, port 587 by default). */
export async function sendViaPrivateEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<{ messageId: string }> {
  const emailUser = Deno.env.get("EMAIL_USER")?.trim();
  const emailPass = Deno.env.get("EMAIL_PASS")?.trim();
  if (!emailUser || !emailPass) {
    throw new Error(
      "Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in Supabase Edge Function secrets.",
    );
  }

  const host = Deno.env.get("EMAIL_HOST")?.trim() || "mail.privateemail.com";
  const port = Number(Deno.env.get("EMAIL_PORT")?.trim() || "587");
  const fromName = Deno.env.get("EMAIL_FROM_NAME")?.trim() || "Simpletide";

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: emailUser, pass: emailPass },
    tls: { rejectUnauthorized: false },
  });

  const info = await transporter.sendMail({
    from: `"${fromName}" <${emailUser}>`,
    to: opts.to,
    replyTo: opts.replyTo || SUPPORT_EMAIL,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });

  return { messageId: info.messageId };
}
