// Supabase Edge Function: send-order-confirmation-email
// Simpletide — Paid Order Confirmation email via PrivateEmail SMTP.
//
// Protected: requires `x-webhook-secret: <EMAIL_WEBHOOK_SECRET>` or
// `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` so it cannot be abused
// as an open email relay.
//
// Accepts EITHER:
//   1. Direct JSON payload:
//      { orderNumber, orderDate?, email, items, subtotal, discount?, shipping?,
//        total, paymentMethod?, shippingAddress }
//   2. Supabase Database Webhook payload on `orders` (INSERT or UPDATE):
//      { type: "INSERT" | "UPDATE", table: "orders", record, old_record }
//      Sends only when `record.payment_status === "paid"` and it wasn't already paid.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  COLORS,
  CORS_HEADERS,
  SHIPPING_PROMISE,
  SUPPORT_EMAIL,
  TRACK_URL,
  type EmailOrderItem,
  type EmailShippingAddress,
  escapeHtml,
  isAuthorizedInternalRequest,
  isValidEmail,
  money,
  renderAddressBlock,
  renderCtaButton,
  renderOrderItemsTable,
  sendViaPrivateEmail,
  wrapEmailShell,
} from "../_shared/email.ts";

export interface OrderConfirmationInput {
  orderNumber: string;
  orderDate?: string;
  email: string;
  items: EmailOrderItem[];
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  paymentMethod?: string;
  shippingAddress?: EmailShippingAddress | null;
}

function normalizeWebhookOrDirect(body: Record<string, unknown>): {
  skip?: string;
  data?: OrderConfirmationInput;
} {
  // Supabase Database Webhook envelope
  if (body && typeof body.record === "object" && body.record !== null) {
    const rec = body.record as Record<string, unknown>;
    const oldRec = (body.old_record as Record<string, unknown> | null) ?? null;

    const isNowPaid = String(rec.payment_status ?? "").toLowerCase() === "paid";
    const wasAlreadyPaid = String(oldRec?.payment_status ?? "").toLowerCase() === "paid";
    if (!isNowPaid || wasAlreadyPaid) {
      return { skip: "Order did not transition to paid." };
    }

    const items = Array.isArray(rec.line_items_snapshot)
      ? (rec.line_items_snapshot as EmailOrderItem[])
      : Array.isArray(rec.items)
        ? (rec.items as EmailOrderItem[])
        : [];
    const discount =
      (Number(rec.affiliate_discount) || 0) +
      (Number(rec.credits_discount) || 0) +
      (Number(rec.discount) || 0);

    return {
      data: {
        orderNumber: String(rec.order_number ?? rec.id ?? ""),
        orderDate: typeof rec.created_at === "string" ? rec.created_at : undefined,
        email: String(rec.email ?? ""),
        items,
        subtotal: Number(rec.subtotal) || Number(rec.total) || 0,
        discount,
        shipping: Number(rec.shipping_cost ?? rec.shipping) || 0,
        total: Number(rec.total) || 0,
        paymentMethod: typeof rec.payment_method === "string" ? rec.payment_method : undefined,
        shippingAddress: (rec.shipping_address as EmailShippingAddress | null) ?? null,
      },
    };
  }

  // Direct API call
  return {
    data: {
      orderNumber: String(body?.orderNumber ?? body?.order_number ?? ""),
      orderDate: typeof body?.orderDate === "string" ? body.orderDate : undefined,
      email: String(body?.email ?? ""),
      items: Array.isArray(body?.items) ? (body.items as EmailOrderItem[]) : [],
      subtotal: Number(body?.subtotal) || Number(body?.total) || 0,
      discount: Number(body?.discount) || 0,
      shipping: Number(body?.shipping ?? body?.shipping_cost) || 0,
      total: Number(body?.total) || 0,
      paymentMethod: typeof body?.paymentMethod === "string" ? body.paymentMethod : undefined,
      shippingAddress: (body?.shippingAddress ?? body?.shipping_address ?? null) as EmailShippingAddress | null,
    },
  };
}

export function buildOrderConfirmationEmail(data: OrderConfirmationInput) {
  const orderNumber = data.orderNumber.trim();
  const safeShipping = Number(data.shipping) || 0;
  const safeDiscount = Math.max(0, Number(data.discount) || 0);
  const shippingDisplay = safeShipping === 0 ? "FREE" : money(safeShipping);
  const formattedDate = data.orderDate
    ? new Date(data.orderDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

  const subject = `Simpletide — Order Confirmed (${orderNumber})`;

  const itemsTable = renderOrderItemsTable(data.items);
  const addressHtml = renderAddressBlock(data.shippingAddress);

  const bodyHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background-color:${COLORS.tintBg};border:1px solid ${COLORS.tintBorder};border-radius:14px;">
            <tr>
              <td align="center" style="padding:16px 34px;">
                <div style="font-size:11px;color:${COLORS.violet};text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:4px;">Order Number</div>
                <div style="font-size:26px;line-height:1.2;font-weight:800;color:${COLORS.ink};letter-spacing:.04em;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${escapeHtml(orderNumber)}</div>
                <div style="font-size:12px;color:${COLORS.muted};margin-top:6px;">Placed ${escapeHtml(formattedDate)}${data.paymentMethod ? ` &bull; ${escapeHtml(data.paymentMethod)}` : ""}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;">
      <tr>
        <td style="background-color:${COLORS.greenBg};border:1px solid ${COLORS.greenBorder};border-radius:12px;padding:14px 18px;text-align:center;">
          <p style="margin:0;font-size:13px;color:${COLORS.greenText};line-height:1.55;">
            <strong>Payment received.</strong> ${SHIPPING_PROMISE} We'll email your tracking number as soon as your package leaves our facility.
          </p>
        </td>
      </tr>
    </table>

    ${
      itemsTable
        ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 10px 0;">
      <tr><td align="left"><h3 style="margin:0;font-size:17px;font-weight:800;color:${COLORS.ink};">Order Summary</h3></td></tr>
    </table>
    ${itemsTable}`
        : ""
    }

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
      <tr>
        <td align="left" style="padding:6px 2px;font-size:14px;color:${COLORS.body};font-weight:600;">Subtotal</td>
        <td align="right" style="padding:6px 2px;font-size:14px;color:${COLORS.ink};font-weight:600;">${money(data.subtotal)}</td>
      </tr>
      ${
        safeDiscount > 0
          ? `
      <tr>
        <td align="left" style="padding:6px 2px;font-size:14px;color:${COLORS.body};font-weight:600;">Discount</td>
        <td align="right" style="padding:6px 2px;font-size:14px;color:${COLORS.greenText};font-weight:700;">-${money(safeDiscount)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td align="left" style="padding:6px 2px;font-size:14px;color:${COLORS.body};font-weight:600;">Shipping (USPS Priority)</td>
        <td align="right" style="padding:6px 2px;font-size:14px;color:${shippingDisplay === "FREE" ? COLORS.greenText : COLORS.ink};font-weight:700;">${shippingDisplay}</td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
      <tr>
        <td style="background-color:${COLORS.tintBg};border:1px solid ${COLORS.tintBorder};border-radius:12px;padding:14px 18px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="left" style="font-size:13px;color:${COLORS.violetDeep};font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Total Paid</td>
              <td align="right" style="font-size:24px;line-height:1.1;color:${COLORS.ink};font-weight:800;">${money(data.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 10px 0;">
      <tr><td align="left"><h3 style="margin:0;font-size:17px;font-weight:800;color:${COLORS.ink};">Shipping Address</h3></td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:#ffffff;border:1px solid ${COLORS.line};border-radius:12px;padding:16px;font-size:14px;">
          ${addressHtml}
        </td>
      </tr>
    </table>

    ${renderCtaButton("Track Your Order", TRACK_URL)}
  `;

  const html = wrapEmailShell({
    preheader: `Order ${orderNumber} is confirmed! We're preparing your Simpletide shipment.`,
    badge: "Order Confirmed",
    badgeTone: "green",
    title: "Thank You for Your Order",
    subtitle: "Your payment is confirmed and your research compounds are being prepared for dispatch.",
    bodyHtml,
  });

  const itemLines = (data.items || []).map((item) => {
    const name = item.name || item.product_name || "Research Compound";
    const variant = item.variant || item.variant_spec ? ` (${item.variant || item.variant_spec})` : "";
    const qty = Math.max(1, Number(item.quantity ?? item.qty ?? 1) || 1);
    return `- ${name}${variant} x${qty} — ${money((Number(item.price) || 0) * qty)}`;
  });

  const text = [
    `SIMPLETIDE — ORDER CONFIRMED`,
    "",
    `Order Number: ${orderNumber}`,
    `Date: ${formattedDate}`,
    "",
    `Payment received. ${SHIPPING_PROMISE}`,
    "We'll email your tracking number as soon as your package ships.",
    "",
    ...(itemLines.length ? ["ORDER SUMMARY", ...itemLines, ""] : []),
    `Subtotal: ${money(data.subtotal)}`,
    ...(safeDiscount > 0 ? [`Discount: -${money(safeDiscount)}`] : []),
    `Shipping: ${shippingDisplay}`,
    `Total Paid: ${money(data.total)}`,
    "",
    `Track your order: ${TRACK_URL}`,
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

    if (!isValidEmail(data.email)) {
      return new Response(JSON.stringify({ success: false, error: "A valid customer email is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const { subject, text, html } = buildOrderConfirmationEmail(data);
    const info = await sendViaPrivateEmail({
      to: data.email.trim().toLowerCase(),
      subject,
      text,
      html,
    });

    console.log(`Order confirmation email sent for ${data.orderNumber}: ${info.messageId}`);

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending order confirmation email:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
