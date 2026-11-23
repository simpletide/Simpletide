// Supabase Edge Function: send-shipping-confirmation-email
// Simpletide — Shipping Confirmation email with carrier tracking link via PrivateEmail SMTP.
//
// Protected: requires `x-webhook-secret: <EMAIL_WEBHOOK_SECRET>` or
// `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` so it cannot be abused
// as an open email relay.
//
// Accepts EITHER:
//   1. Direct JSON payload:
//      { orderNumber, email, trackingNumber, carrier?, trackingUrl?,
//        estimatedDelivery?, items?, shippingAddress? }
//   2. Supabase Database Webhook payload on `orders` (UPDATE):
//      { type: "UPDATE", table: "orders", record, old_record }
//      Sends only when `record.tracking_number` is present AND either the
//      tracking number was just added/changed OR `status` just moved to "shipped".

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  COLORS,
  CORS_HEADERS,
  SUPPORT_EMAIL,
  TRACK_URL,
  type EmailOrderItem,
  type EmailShippingAddress,
  carrierTrackingUrl,
  escapeHtml,
  isAuthorizedInternalRequest,
  isValidEmail,
  normalizeCarrier,
  renderAddressBlock,
  renderCtaButton,
  renderOrderItemsTable,
  sendViaPrivateEmail,
  wrapEmailShell,
} from "../_shared/email.ts";

export interface ShippingConfirmationInput {
  orderNumber: string;
  email: string;
  trackingNumber: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  items?: EmailOrderItem[];
  shippingAddress?: EmailShippingAddress | null;
}

function normalizeWebhookOrDirect(body: Record<string, unknown>): {
  skip?: string;
  data?: ShippingConfirmationInput;
} {
  if (body && typeof body.record === "object" && body.record !== null) {
    const rec = body.record as Record<string, unknown>;
    const oldRec = (body.old_record as Record<string, unknown> | null) ?? null;

    const tracking = String(rec.tracking_number ?? "").trim();
    const oldTracking = String(oldRec?.tracking_number ?? "").trim();
    const isShipped = String(rec.status ?? "").toLowerCase() === "shipped";
    const wasShipped = String(oldRec?.status ?? "").toLowerCase() === "shipped";

    const trackingAddedOrChanged = Boolean(tracking) && tracking !== oldTracking;
    const newlyShipped = isShipped && !wasShipped && Boolean(tracking);

    if (!trackingAddedOrChanged && !newlyShipped) {
      return { skip: "Order did not gain a new tracking number or move to shipped." };
    }

    const items = Array.isArray(rec.line_items_snapshot)
      ? (rec.line_items_snapshot as EmailOrderItem[])
      : Array.isArray(rec.items)
        ? (rec.items as EmailOrderItem[])
        : [];

    return {
      data: {
        orderNumber: String(rec.order_number ?? rec.id ?? ""),
        email: String(rec.email ?? ""),
        trackingNumber: tracking,
        carrier: typeof rec.carrier === "string" ? rec.carrier : undefined,
        items,
        shippingAddress: (rec.shipping_address as EmailShippingAddress | null) ?? null,
      },
    };
  }

  return {
    data: {
      orderNumber: String(body?.orderNumber ?? body?.order_number ?? ""),
      email: String(body?.email ?? ""),
      trackingNumber: String(body?.trackingNumber ?? body?.tracking_number ?? ""),
      carrier: typeof body?.carrier === "string" ? body.carrier : undefined,
      trackingUrl: typeof body?.trackingUrl === "string" ? body.trackingUrl : undefined,
      estimatedDelivery:
        typeof body?.estimatedDelivery === "string" ? body.estimatedDelivery : undefined,
      items: Array.isArray(body?.items) ? (body.items as EmailOrderItem[]) : [],
      shippingAddress: (body?.shippingAddress ?? body?.shipping_address ?? null) as EmailShippingAddress | null,
    },
  };
}

export function buildShippingConfirmationEmail(data: ShippingConfirmationInput) {
  const orderNumber = data.orderNumber.trim();
  const trackingNumber = data.trackingNumber.trim();
  const carrier = normalizeCarrier(data.carrier, trackingNumber);
  const trackingUrl =
    data.trackingUrl?.trim() || carrierTrackingUrl(carrier, trackingNumber);
  const eta = data.estimatedDelivery?.trim() || "2–3 business days";

  const subject = `Simpletide — Your Order Has Shipped (${orderNumber})`;

  const itemsTable = renderOrderItemsTable(data.items ?? []);
  const addressHtml = data.shippingAddress ? renderAddressBlock(data.shippingAddress) : "";

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="background-color:${COLORS.tintBg};border:1px solid ${COLORS.tintBorder};border-radius:14px;padding:20px 24px;">
          <div style="font-size:11px;color:${COLORS.violet};text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:4px;">${escapeHtml(carrier)} Tracking Number</div>
          <div style="font-size:21px;line-height:1.3;font-weight:800;color:${COLORS.ink};letter-spacing:.03em;font-family:'SFMono-Regular',Menlo,Consolas,monospace;word-break:break-all;">${escapeHtml(trackingNumber)}</div>
          <div style="font-size:12px;color:${COLORS.muted};margin-top:8px;">Order <strong>${escapeHtml(orderNumber)}</strong> &bull; Estimated transit: ${escapeHtml(eta)}</div>
        </td>
      </tr>
    </table>

    ${renderCtaButton("Track Your Package", trackingUrl)}

    <p style="margin:10px 0 0 0;text-align:center;font-size:12px;color:${COLORS.muted};">
      Carrier scans can take a few hours to appear after label creation. You can also check status anytime on our <a href="${TRACK_URL}" style="color:${COLORS.violet};text-decoration:none;font-weight:600;">Order Tracking page</a>.
    </p>

    ${
      itemsTable
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 10px 0;">
      <tr><td align="left"><h3 style="margin:0;font-size:17px;font-weight:800;color:${COLORS.ink};">Items in This Shipment</h3></td></tr>
    </table>
    ${itemsTable}`
        : ""
    }

    ${
      addressHtml
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 10px 0;">
      <tr><td align="left"><h3 style="margin:0;font-size:17px;font-weight:800;color:${COLORS.ink};">Shipping To</h3></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:#ffffff;border:1px solid ${COLORS.line};border-radius:12px;padding:16px;font-size:14px;">
          ${addressHtml}
        </td>
      </tr>
    </table>`
        : ""
    }
  `;

  const html = wrapEmailShell({
    preheader: `Order ${orderNumber} has shipped via ${carrier}. Tracking: ${trackingNumber}`,
    badge: "Order Shipped",
    badgeTone: "violet",
    title: "Your Order Is On the Way",
    subtitle: `Order ${orderNumber} has been packed and handed off to ${carrier}.`,
    bodyHtml,
  });

  const text = [
    `SIMPLETIDE — YOUR ORDER HAS SHIPPED`,
    "",
    `Order Number: ${orderNumber}`,
    `Carrier: ${carrier}`,
    `Tracking Number: ${trackingNumber}`,
    `Estimated Delivery: ${eta}`,
    "",
    `Track your package: ${trackingUrl}`,
    `Or check status on Simpletide: ${TRACK_URL}`,
    "",
    "Carrier scans can take a few hours to appear after label creation.",
    `Questions? ${SUPPORT_EMAIL}`,
    "Simpletide • For laboratory research use only. Not for human consumption.",
  ].join("\n");

  return { subject, text, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (!isAuthorizedInternalRequest(req)) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Provide x-webhook-secret or service role Bearer token." }),
      { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }

  try {
    const raw = await req.json();
    const { skip, data } = normalizeWebhookOrDirect(raw);

    if (skip || !data) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: skip }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (!data.orderNumber.trim()) {
      return new Response(JSON.stringify({ success: false, error: "orderNumber is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (!data.trackingNumber.trim()) {
      return new Response(JSON.stringify({ success: false, error: "trackingNumber is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (!isValidEmail(data.email)) {
      return new Response(JSON.stringify({ success: false, error: "A valid customer email is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const { subject, text, html } = buildShippingConfirmationEmail(data);
    const info = await sendViaPrivateEmail({
      to: data.email.trim().toLowerCase(),
      subject,
      text,
      html,
    });

    console.log(`Shipping confirmation email sent for ${data.orderNumber}: ${info.messageId}`);

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending shipping confirmation email:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
