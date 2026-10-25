/**
 * Simpletide — order email templates (new-site theme).
 *
 * Two transactional emails, both in the new light "Simpletide" brand:
 *   - renderCardEmail(order)  -> "Order Confirmed" (card / KeyBilling, paid)
 *   - renderVenmoEmail(order) -> "Order Placed — Payment Pending" (Venmo)
 *
 * Pure functions (no dependencies) so they can be previewed or sent from a
 * standalone script. Nothing here touches the live site or its backend.
 */

const BRAND = {
  name: "Simpletide",
  support: "support@simpletide.com",
  venmoHandle: "@REPLACE-WITH-SIMPLETIDE-VENMO",
  venmoQr: "https://simpletide.com/images/venmo-qr.jpg",
  imageBase: "https://simpletide.com",
  fallbackImage: "https://simpletide.com/images/cards/glp-3-rt.jpg",
};

const C = {
  pageBg: "#eef2f9",
  card: "#ffffff",
  cardBorder: "#e3e9f3",
  ink: "#0f172a",
  body: "#475569",
  muted: "#7e8aa0",
  line: "#e6ecf5",
  blue: "#2f6ac6",
  navy: "#1c3faa",
  tintBg: "#eef4ff",
  tintBorder: "#d8e5ff",
  green: "#0f9d6f",
  red: "#dc2626",
  amberBg: "#fff7ed",
  amberBorder: "#fcd9a8",
};

const GRADIENT = "linear-gradient(90deg,#1f4f97 0%,#27599f 50%,#2f6ac6 100%)";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(n) {
  const num = Number(n) || 0;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toAbsoluteImage(input) {
  if (!input) return BRAND.fallbackImage;
  const absolute = input.startsWith("http")
    ? input
    : `${BRAND.imageBase}${input.startsWith("/") ? "" : "/"}${input}`;
  // .webp often doesn't render in email clients — fall back when not an email-safe asset.
  if (absolute.includes("/images/email-products/")) return absolute;
  return /\.webp(?:$|\?)/i.test(absolute) ? BRAND.fallbackImage : absolute;
}

function itemRow(item) {
  const name = escapeHtml(item.name || item.product_name || "");
  const variant = escapeHtml(item.variant || item.variant_spec || "");
  const qty = Number(item.quantity ?? item.qty ?? 1);
  const lineTotal = money((Number(item.price) || 0) * qty);
  const img = toAbsoluteImage(item.image || item.imageUrl);

  return `
      <tr>
        <td style="padding:14px 14px;border-bottom:1px solid ${C.line};">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;width:56px;">
                <img src="${img}" alt="${name}" width="56" height="56" style="width:56px;height:56px;border-radius:10px;object-fit:cover;display:block;border:1px solid ${C.line};background-color:#ffffff;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="color:${C.ink};font-size:15px;font-weight:700;display:block;line-height:1.35;">${name}</span>
                ${variant ? `<span style="font-size:12px;color:${C.muted};display:block;margin-top:2px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${variant}</span>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td align="center" style="padding:14px 10px;border-bottom:1px solid ${C.line};vertical-align:middle;color:${C.ink};font-weight:600;font-size:14px;">${qty}</td>
        <td align="right" style="padding:14px 14px;border-bottom:1px solid ${C.line};vertical-align:middle;color:${C.ink};font-weight:700;font-size:14px;white-space:nowrap;">${lineTotal}</td>
      </tr>`;
}

function itemsTable(items) {
  const rows = (items || []).map(itemRow).join("");
  return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;border:1px solid ${C.line};border-radius:12px;overflow:hidden;">
              <thead>
                <tr style="background-color:#f8fafd;">
                  <th align="left" style="padding:12px 14px;font-size:11px;text-transform:uppercase;color:${C.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${C.line};">Item</th>
                  <th align="center" style="padding:12px 10px;font-size:11px;text-transform:uppercase;color:${C.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${C.line};">Qty</th>
                  <th align="right" style="padding:12px 14px;font-size:11px;text-transform:uppercase;color:${C.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${C.line};">Price</th>
                </tr>
              </thead>
              <tbody>${rows}
              </tbody>
            </table>`;
}

function totals({ subtotal, shippingDisplay, total, savings }) {
  const savingsRow =
    savings && savings > 0
      ? `
                <tr>
                  <td align="left" style="padding:7px 2px;font-size:14px;color:${C.green};font-weight:700;">Bundle savings</td>
                  <td align="right" style="padding:7px 2px;font-size:14px;color:${C.green};font-weight:700;">-${money(savings)}</td>
                </tr>`
      : "";
  return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="padding:7px 2px;font-size:14px;color:${C.body};font-weight:600;">Subtotal</td>
                      <td align="right" style="padding:7px 2px;font-size:14px;color:${C.ink};font-weight:600;">${money(subtotal)}</td>
                    </tr>${savingsRow}
                    <tr>
                      <td align="left" style="padding:7px 2px;font-size:14px;color:${C.body};font-weight:600;">Shipping</td>
                      <td align="right" style="padding:7px 2px;font-size:14px;color:${shippingDisplay === "FREE" ? C.green : C.ink};font-weight:700;">${shippingDisplay}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
              <tr>
                <td style="background-color:${C.tintBg};border:1px solid ${C.tintBorder};border-radius:12px;padding:14px 18px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="font-size:13px;color:#36517f;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Total</td>
                      <td align="right" style="font-size:24px;line-height:1.1;color:${C.blue};font-weight:800;">${money(total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;
}

function addressBlock(addr) {
  if (!addr) return "Address on file";
  const line2 = [
    escapeHtml(addr.city),
    addr.state ? escapeHtml(addr.state) : "",
  ]
    .filter(Boolean)
    .join(", ");
  return `
            <div style="font-weight:700;color:${C.ink};margin-bottom:4px;">${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}</div>
            <div style="color:${C.body};line-height:1.6;">${escapeHtml(addr.street)}${addr.apartment ? `, ${escapeHtml(addr.apartment)}` : ""}</div>
            <div style="color:${C.body};line-height:1.6;">${line2} ${escapeHtml(addr.zipCode)}</div>
            ${addr.country ? `<div style="color:${C.body};line-height:1.6;">${escapeHtml(addr.country)}</div>` : ""}
            ${addr.phone ? `<div style="color:${C.body};line-height:1.6;margin-top:4px;">${escapeHtml(addr.phone)}</div>` : ""}`;
}

function sectionHeading(text) {
  return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px 0;">
              <tr><td align="left"><h3 style="margin:0;font-size:18px;line-height:1.2;font-weight:800;color:${C.ink};">${text}</h3></td></tr>
            </table>`;
}

/** Shared email shell: gradient bar, brand wordmark, hero title, body, footer. */
function emailShell({ preheader, badge, badgeColor, title, subtitle, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <style>
    @media only screen and (max-width:620px){
      .shell{width:100% !important;}
      .pad{padding:26px 18px !important;}
      .hero{font-size:28px !important;}
      .stack{display:block !important;width:100% !important;padding:0 0 12px 0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.pageBg};font-size:1px;line-height:1px;">${escapeHtml(preheader)}</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.pageBg};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" class="shell" style="max-width:600px;width:600px;">
          <tr>
            <td style="background-color:${C.card};border:1px solid ${C.cardBorder};border-radius:18px;overflow:hidden;box-shadow:0 6px 22px rgba(15,23,42,.06);">
              <!-- gradient brand bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:6px;line-height:6px;font-size:6px;background:${GRADIENT};">&nbsp;</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad" style="padding:38px 34px 30px 34px;">
                    <!-- header -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td align="center" style="padding-bottom:14px;">
                        <span style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:${C.navy};font-weight:800;">SIMPLETIDE</span>
                      </td></tr>
                      ${badge ? `<tr><td align="center" style="padding-bottom:14px;">
                        <span style="display:inline-block;background-color:${badgeColor.bg};color:${badgeColor.fg};border:1px solid ${badgeColor.border};border-radius:999px;padding:6px 14px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">${badge}</span>
                      </td></tr>` : ""}
                      <tr><td align="center" style="padding-bottom:8px;">
                        <h1 class="hero" style="margin:0;font-size:32px;line-height:1.15;font-weight:800;color:${C.ink};">${title}</h1>
                      </td></tr>
                      <tr><td align="center" style="padding-bottom:26px;">
                        <p style="margin:0;font-size:16px;color:${C.body};">${subtitle}</p>
                      </td></tr>
                    </table>

                    ${bodyHtml}
                  </td>
                </tr>
              </table>

              <!-- footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafd;border-top:1px solid ${C.line};">
                <tr>
                  <td align="center" style="padding:26px 28px 24px 28px;">
                    <p style="margin:0 0 8px 0;font-size:16px;color:${C.ink};font-weight:800;">Simpletide</p>
                    <p style="margin:0 0 14px 0;font-size:12px;color:${C.muted};line-height:1.6;">Third-Party Lab Tested &bull; ISO 17025 Certified &bull; Research-Grade Peptides</p>
                    <p style="margin:0 0 8px 0;padding-top:14px;border-top:1px solid ${C.line};font-size:12px;color:${C.muted};line-height:1.6;">These products are for research use only. Not for human consumption.</p>
                    <p style="margin:0;font-size:12px;color:${C.muted};">Questions? Email <a href="mailto:${BRAND.support}" style="color:${C.blue};text-decoration:none;">${BRAND.support}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td align="center" style="padding:18px 10px 4px 10px;"><p style="margin:0;font-size:11px;color:${C.muted};">&copy; ${new Date().getFullYear()} Simpletide. All rights reserved.</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function orderNumberCard(orderNumber, caption) {
  return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center">
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background-color:${C.tintBg};border:1px solid ${C.tintBorder};border-radius:14px;">
                  <tr><td align="center" style="padding:16px 34px;">
                    <div style="font-size:11px;color:#5f79b5;text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:4px;">Order Number</div>
                    <div style="font-size:27px;line-height:1.2;font-weight:800;color:${C.ink};letter-spacing:.04em;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${escapeHtml(orderNumber)}</div>
                    ${caption ? `<div style="font-size:12px;color:#5f79b5;margin-top:6px;font-weight:600;">${caption}</div>` : ""}
                  </td></tr>
                </table>
              </td></tr>
            </table>`;
}

function infoRow(orderDate, estimatedDelivery) {
  return `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
              <tr>
                <td class="stack" width="50%" style="padding-right:8px;vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid ${C.line};border-radius:12px;">
                    <tr><td style="padding:15px 16px;">
                      <div style="font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:.09em;font-weight:700;margin-bottom:5px;">Order Date</div>
                      <div style="font-size:15px;font-weight:700;color:${C.ink};">${escapeHtml(orderDate)}</div>
                    </td></tr>
                  </table>
                </td>
                <td class="stack" width="50%" style="padding-left:8px;vertical-align:top;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border:1px solid ${C.line};border-radius:12px;">
                    <tr><td style="padding:15px 16px;">
                      <div style="font-size:11px;color:${C.muted};text-transform:uppercase;letter-spacing:.09em;font-weight:700;margin-bottom:5px;">Estimated Delivery</div>
                      <div style="font-size:15px;font-weight:700;color:${C.ink};">${escapeHtml(estimatedDelivery)}</div>
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>`;
}

/** Card / KeyBilling confirmation — payment already captured. */
export function renderCardEmail(order) {
  const shippingDisplay =
    !order.shipping || Number(order.shipping) === 0 ? "FREE" : money(order.shipping);

  const body = `
            ${orderNumberCard(order.orderNumber)}
            ${infoRow(order.orderDate, order.estimatedDelivery)}
            ${sectionHeading("Order Summary")}
            ${itemsTable(order.items)}
            ${totals({ subtotal: order.subtotal, shippingDisplay, total: order.total, savings: order.savings })}
            ${sectionHeading("Shipping Address")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="background-color:#ffffff;border:1px solid ${C.line};border-radius:12px;padding:16px;font-size:14px;">
                ${addressBlock(order.shippingAddress)}
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
              <tr><td style="background-color:${C.amberBg};border:1px solid ${C.amberBorder};border-radius:12px;padding:16px 18px;">
                <p style="margin:0;font-size:13px;color:#7c5310;line-height:1.6;">
                  Your card statement may show <strong>&ldquo;Advance Care&rdquo;</strong> or <strong>&ldquo;Wellness System&rdquo;</strong> — these are authorized billing descriptors for your purchase.
                </p>
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
              <tr><td align="center" style="padding-bottom:8px;">
                <a href="mailto:${BRAND.support}" style="display:inline-block;background:${GRADIENT};color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:10px;font-size:15px;font-weight:700;">Contact Support</a>
              </td></tr>
              <tr><td align="center"><p style="margin:0;font-size:13px;color:${C.muted};">A receipt has been sent to ${escapeHtml(order.email)}.</p></td></tr>
            </table>`;

  return emailShell({
    preheader: `Order ${order.orderNumber} confirmed — thank you for your order.`,
    badge: "Payment Confirmed",
    badgeColor: { bg: "#e7f8f0", fg: "#0f7a52", border: "#bce8d5" },
    title: "Order Confirmed",
    subtitle: "Thank you! Your payment was received and your order is being prepared.",
    bodyHtml: body,
  });
}

/** Venmo order placed — payment still pending; includes pay instructions. */
export function renderVenmoEmail(order) {
  const shippingDisplay =
    !order.shipping || Number(order.shipping) === 0 ? "FREE" : money(order.shipping);

  const body = `
            ${orderNumberCard(order.orderNumber, "Add this number to your Venmo note")}

            <!-- Pay instructions -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
              <tr><td style="background-color:#ffffff;border:1px solid ${C.line};border-radius:14px;padding:22px 22px 6px 22px;">
                <p style="margin:0 0 4px 0;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:${C.muted};font-weight:700;">Payment Instructions</p>
                <p style="margin:0 0 18px 0;text-align:center;font-size:16px;color:${C.ink};font-weight:700;">Open Venmo and send your payment to</p>
                <p style="margin:0 0 18px 0;text-align:center;font-size:22px;color:${C.blue};font-weight:800;">${BRAND.venmoHandle}</p>

                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td align="center" style="padding-bottom:18px;">
                    <img src="${BRAND.venmoQr}" alt="Venmo QR code for Simpletide" width="240" style="max-width:240px;width:100%;border:1px solid ${C.line};border-radius:12px;display:block;" />
                  </td></tr>
                </table>
                <p style="margin:0 0 18px 0;text-align:center;font-size:13px;color:${C.muted};">Scan the QR code to auto-fill our profile.</p>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                  <tr><td style="background-color:${C.tintBg};border:1px solid ${C.tintBorder};border-radius:12px;padding:16px;text-align:center;">
                    <div style="font-size:13px;color:#36517f;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Amount to send</div>
                    <div style="font-size:30px;color:${C.blue};font-weight:800;">${money(order.total)}</div>
                  </td></tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
                  <tr><td style="background-color:#f8fafd;border:1px solid ${C.line};border-radius:12px;padding:16px;text-align:center;">
                    <div style="font-size:13px;color:${C.body};font-weight:700;margin-bottom:6px;">In the payment note, enter only your order number</div>
                    <div style="font-size:18px;color:${C.ink};font-weight:800;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${escapeHtml(order.orderNumber)}</div>
                  </td></tr>
                </table>

                <p style="margin:0 0 18px 0;text-align:center;font-size:13px;color:${C.red};font-weight:600;line-height:1.6;">
                  Only include your order number in the note. Payments without an order number may be refunded.
                </p>
              </td></tr>
            </table>

            ${sectionHeading("Order Summary")}
            ${itemsTable(order.items)}
            ${totals({ subtotal: order.subtotal, shippingDisplay, total: order.total, savings: order.savings })}

            ${sectionHeading("Shipping Address")}
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="background-color:#ffffff;border:1px solid ${C.line};border-radius:12px;padding:16px;font-size:14px;">
                ${addressBlock(order.shippingAddress)}
              </td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;">
              <tr><td style="background-color:${C.amberBg};border:1px solid ${C.amberBorder};border-radius:12px;padding:16px 18px;">
                <p style="margin:0;font-size:13px;color:#7c5310;line-height:1.6;text-align:center;">
                  <strong>Your order is reserved but not yet processed.</strong> We'll confirm and ship once your Venmo payment is received.
                </p>
              </td></tr>
            </table>`;

  return emailShell({
    preheader: `Order ${order.orderNumber} placed — send your Venmo payment to finish.`,
    badge: "Payment Pending",
    badgeColor: { bg: "#fff4e5", fg: "#b4690e", border: "#fcd9a8" },
    title: "Order Placed",
    subtitle: "Almost there — complete your Venmo payment to confirm your order.",
    bodyHtml: body,
  });
}

const today = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const sampleAddress = {
  firstName: "Devon",
  lastName: "Ransom",
  street: "1287 Lakeview Ave",
  apartment: "Apt 4B",
  city: "Austin",
  state: "TX",
  zipCode: "78704",
  country: "US",
  phone: "(512) 555-0199",
};

const sampleItems = [
  {
    name: "GLP-3 RT (RETA)",
    variant: "20mg",
    quantity: 1,
    price: 120,
    image: "https://simpletide.com/images/cards/glp-3-rt.jpg",
  },
  {
    name: "BPC-157",
    variant: "10mg",
    quantity: 2,
    price: 60,
    image: "https://simpletide.com/images/cards/bpc-157.jpg",
  },
];

export const sampleCardOrder = {
  orderNumber: "AS-104839",
  orderDate: today,
  email: "ransom123devon@gmail.com",
  items: sampleItems,
  subtotal: 240,
  shipping: 0,
  total: 240,
  savings: 0,
  estimatedDelivery: "2-3 business days (USPS Priority)",
  shippingAddress: sampleAddress,
};

export const sampleVenmoOrder = {
  orderNumber: "AS-104840",
  orderDate: today,
  email: "ransom123devon@gmail.com",
  items: sampleItems,
  subtotal: 240,
  shipping: 0,
  total: 240,
  savings: 0,
  estimatedDelivery: "2-3 business days (USPS Priority)",
  shippingAddress: sampleAddress,
};
