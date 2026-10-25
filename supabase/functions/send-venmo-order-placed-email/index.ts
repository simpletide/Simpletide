// Supabase Edge Function: send-venmo-order-placed-email
// Simpletide — "Order Placed / Payment Pending" (Venmo), new light brand theme.
// Drop-in replacement for the old dark "Simpletide" template.
//
// Receives the same payload create-venmo-order.ts already sends:
//   { orderNumber, orderDate?, email, items[{name,variant,quantity,price,image}],
//     subtotal, shipping, total, shippingAddress{firstName,lastName,street,apartment,city,state,zipCode,country,phone} }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from 'npm:nodemailer'

const IMAGE_BASE = 'https://simpletide.com'
const EMAIL_SAFE_FALLBACK_IMAGE = `${IMAGE_BASE}/images/email-products/vial.jpg`

const BRAND = {
  support: 'support@simpletide.com',
  venmoHandle: '@REPLACE-WITH-SIMPLETIDE-VENMO',
  venmoQr: 'https://simpletide.com/images/venmo-qr.jpg',
}

const C = {
  pageBg: '#eef2f9', card: '#ffffff', cardBorder: '#e3e9f3', ink: '#0f172a',
  body: '#475569', muted: '#7e8aa0', line: '#e6ecf5', blue: '#2f6ac6', navy: '#1c3faa',
  tintBg: '#eef4ff', tintBorder: '#d8e5ff', green: '#0f9d6f', red: '#dc2626',
  amberBg: '#fff7ed', amberBorder: '#fcd9a8',
}
const GRADIENT = 'linear-gradient(90deg,#1f4f97 0%,#27599f 50%,#2f6ac6 100%)'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function money(n: unknown): string {
  const num = Number(n) || 0
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toEmailSafeImageUrl(input: string | null | undefined): string {
  if (!input) return EMAIL_SAFE_FALLBACK_IMAGE
  const absolute = input.startsWith('http')
    ? input
    : `${IMAGE_BASE}${input.startsWith('/') ? '' : '/'}${input}`
  if (absolute.includes('/images/email-products/')) return absolute
  return /\.webp(?:$|\?)/i.test(absolute) ? EMAIL_SAFE_FALLBACK_IMAGE : absolute
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const orderData = await req.json()

    const emailUser = Deno.env.get('EMAIL_USER')
    const emailPass = Deno.env.get('EMAIL_PASS')
    if (!emailUser || !emailPass) {
      throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.')
    }

    const orderNumber = orderData.orderNumber
    const addr = orderData.shippingAddress
    const safeShipping = Number(orderData.shipping) || 0
    const shippingDisplay = safeShipping === 0 ? 'FREE' : money(safeShipping)

    const itemsHTML = (orderData.items || []).map((item: any) => {
      const name = escapeHtml(item.name || item.product_name || '')
      const variant = escapeHtml(item.variant || item.variant_spec || '')
      const qty = Number(item.quantity ?? item.qty ?? 1)
      const lineTotal = money((Number(item.price) || 0) * qty)
      const img = toEmailSafeImageUrl(item.image || item.imageUrl)
      return `
      <tr>
        <td style="padding:14px;border-bottom:1px solid ${C.line};">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;width:56px;">
                <img src="${img}" alt="${name}" width="56" height="56" style="width:56px;height:56px;border-radius:10px;object-fit:cover;display:block;border:1px solid ${C.line};background-color:#ffffff;" />
              </td>
              <td style="vertical-align:middle;">
                <span style="color:${C.ink};font-size:15px;font-weight:700;display:block;line-height:1.35;">${name}</span>
                ${variant ? `<span style="font-size:12px;color:${C.muted};display:block;margin-top:2px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${variant}</span>` : ''}
              </td>
            </tr>
          </table>
        </td>
        <td align="center" style="padding:14px 10px;border-bottom:1px solid ${C.line};vertical-align:middle;color:${C.ink};font-weight:600;font-size:14px;">${qty}</td>
        <td align="right" style="padding:14px;border-bottom:1px solid ${C.line};vertical-align:middle;color:${C.ink};font-weight:700;font-size:14px;white-space:nowrap;">${lineTotal}</td>
      </tr>`
    }).join('')

    const addressHTML = addr ? `
            <div style="font-weight:700;color:${C.ink};margin-bottom:4px;">${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}</div>
            <div style="color:${C.body};line-height:1.6;">${escapeHtml(addr.street)}${addr.apartment ? `, ${escapeHtml(addr.apartment)}` : ''}</div>
            <div style="color:${C.body};line-height:1.6;">${escapeHtml(addr.city)}${addr.state ? ', ' + escapeHtml(addr.state) : ''} ${escapeHtml(addr.zipCode)}</div>
            ${addr.country ? `<div style="color:${C.body};line-height:1.6;">${escapeHtml(addr.country)}</div>` : ''}
            ${addr.phone ? `<div style="color:${C.body};line-height:1.6;margin-top:4px;">${escapeHtml(addr.phone)}</div>` : ''}` : 'Address on file'

    const htmlContent = `<!DOCTYPE html>
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
      .hero{font-size:28px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.pageBg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.pageBg};font-size:1px;line-height:1px;">Order ${escapeHtml(orderNumber)} placed — send your Venmo payment to finish.</div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.pageBg};">
    <tr><td align="center" style="padding:28px 12px;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" class="shell" style="max-width:600px;width:600px;">
        <tr><td style="background-color:${C.card};border:1px solid ${C.cardBorder};border-radius:18px;overflow:hidden;box-shadow:0 6px 22px rgba(15,23,42,.06);">
          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:6px;line-height:6px;font-size:6px;background:${GRADIENT};">&nbsp;</td></tr></table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="pad" style="padding:38px 34px 30px 34px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td align="center" style="padding-bottom:14px;"><span style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:${C.navy};font-weight:800;">SIMPLETIDE</span></td></tr>
              <tr><td align="center" style="padding-bottom:14px;"><span style="display:inline-block;background-color:#fff4e5;color:#b4690e;border:1px solid ${C.amberBorder};border-radius:999px;padding:6px 14px;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">Payment Pending</span></td></tr>
              <tr><td align="center" style="padding-bottom:8px;"><h1 class="hero" style="margin:0;font-size:32px;line-height:1.15;font-weight:800;color:${C.ink};">Order Placed</h1></td></tr>
              <tr><td align="center" style="padding-bottom:26px;"><p style="margin:0;font-size:16px;color:${C.body};">Almost there — complete your Venmo payment to confirm your order.</p></td></tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background-color:${C.tintBg};border:1px solid ${C.tintBorder};border-radius:14px;">
                <tr><td align="center" style="padding:16px 34px;">
                  <div style="font-size:11px;color:#5f79b5;text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:4px;">Order Number</div>
                  <div style="font-size:27px;line-height:1.2;font-weight:800;color:${C.ink};letter-spacing:.04em;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${escapeHtml(orderNumber)}</div>
                  <div style="font-size:12px;color:#5f79b5;margin-top:6px;font-weight:600;">Add this number to your Venmo note</div>
                </td></tr>
              </table>
            </td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td style="background-color:#ffffff;border:1px solid ${C.line};border-radius:14px;padding:22px 22px 6px 22px;">
              <p style="margin:0 0 4px 0;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:${C.muted};font-weight:700;">Payment Instructions</p>
              <p style="margin:0 0 18px 0;text-align:center;font-size:16px;color:${C.ink};font-weight:700;">Open Venmo and send your payment to</p>
              <p style="margin:0 0 18px 0;text-align:center;font-size:22px;color:${C.blue};font-weight:800;">${BRAND.venmoHandle}</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding-bottom:18px;">
                <img src="${BRAND.venmoQr}" alt="Venmo QR code" width="240" style="max-width:240px;width:100%;border:1px solid ${C.line};border-radius:12px;display:block;" />
              </td></tr></table>
              <p style="margin:0 0 18px 0;text-align:center;font-size:13px;color:${C.muted};">Scan the QR code to auto-fill our profile.</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;"><tr><td style="background-color:${C.tintBg};border:1px solid ${C.tintBorder};border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:13px;color:#36517f;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Amount to send</div>
                <div style="font-size:30px;color:${C.blue};font-weight:800;">${money(orderData.total)}</div>
              </td></tr></table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;"><tr><td style="background-color:#f8fafd;border:1px solid ${C.line};border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:13px;color:${C.body};font-weight:700;margin-bottom:6px;">In the payment note, enter only your order number</div>
                <div style="font-size:18px;color:${C.ink};font-weight:800;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${escapeHtml(orderNumber)}</div>
              </td></tr></table>
              <p style="margin:0 0 18px 0;text-align:center;font-size:13px;color:${C.red};font-weight:600;line-height:1.6;">Only include your order number in the note. Payments without an order number may be refunded.</p>
            </td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px 0;"><tr><td align="left"><h3 style="margin:0;font-size:18px;line-height:1.2;font-weight:800;color:${C.ink};">Order Summary</h3></td></tr></table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:0;border:1px solid ${C.line};border-radius:12px;overflow:hidden;">
              <thead><tr style="background-color:#f8fafd;">
                <th align="left" style="padding:12px 14px;font-size:11px;text-transform:uppercase;color:${C.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${C.line};">Item</th>
                <th align="center" style="padding:12px 10px;font-size:11px;text-transform:uppercase;color:${C.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${C.line};">Qty</th>
                <th align="right" style="padding:12px 14px;font-size:11px;text-transform:uppercase;color:${C.muted};font-weight:700;letter-spacing:.09em;border-bottom:1px solid ${C.line};">Price</th>
              </tr></thead>
              <tbody>${itemsHTML}</tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td align="left" style="padding:7px 2px;font-size:14px;color:${C.body};font-weight:600;">Subtotal</td><td align="right" style="padding:7px 2px;font-size:14px;color:${C.ink};font-weight:600;">${money(orderData.subtotal)}</td></tr>
                <tr><td align="left" style="padding:7px 2px;font-size:14px;color:${C.body};font-weight:600;">Shipping</td><td align="right" style="padding:7px 2px;font-size:14px;color:${shippingDisplay === 'FREE' ? C.green : C.ink};font-weight:700;">${shippingDisplay}</td></tr>
              </table>
            </td></tr></table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr><td style="background-color:${C.tintBg};border:1px solid ${C.tintBorder};border-radius:12px;padding:14px 18px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
                <td align="left" style="font-size:13px;color:#36517f;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Total</td>
                <td align="right" style="font-size:24px;line-height:1.1;color:${C.blue};font-weight:800;">${money(orderData.total)}</td>
              </tr></table>
            </td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px 0;"><tr><td align="left"><h3 style="margin:0;font-size:18px;line-height:1.2;font-weight:800;color:${C.ink};">Shipping Address</h3></td></tr></table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#ffffff;border:1px solid ${C.line};border-radius:12px;padding:16px;font-size:14px;">${addressHTML}</td></tr></table>

            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr><td style="background-color:${C.amberBg};border:1px solid ${C.amberBorder};border-radius:12px;padding:16px 18px;">
              <p style="margin:0;font-size:13px;color:#7c5310;line-height:1.6;text-align:center;"><strong>Your order is reserved but not yet processed.</strong> We'll confirm and ship once your Venmo payment is received.</p>
            </td></tr></table>
          </td></tr></table>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafd;border-top:1px solid ${C.line};"><tr><td align="center" style="padding:26px 28px 24px 28px;">
            <p style="margin:0 0 8px 0;font-size:16px;color:${C.ink};font-weight:800;">Simpletide</p>
            <p style="margin:0 0 14px 0;font-size:12px;color:${C.muted};line-height:1.6;">Third-Party Lab Tested &bull; ISO 17025 Certified &bull; Research-Grade Peptides</p>
            <p style="margin:0 0 8px 0;padding-top:14px;border-top:1px solid ${C.line};font-size:12px;color:${C.muted};line-height:1.6;">These products are for research use only. Not for human consumption.</p>
            <p style="margin:0;font-size:12px;color:${C.muted};">Questions? Email <a href="mailto:${BRAND.support}" style="color:${C.blue};text-decoration:none;">${BRAND.support}</a></p>
          </td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding:18px 10px 4px 10px;"><p style="margin:0;font-size:11px;color:${C.muted};">&copy; ${new Date().getFullYear()} Simpletide. All rights reserved.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
    })

    const info = await transporter.sendMail({
      from: `"Simpletide" <${emailUser}>`,
      to: orderData.email,
      subject: `Simpletide — Order Placed (Payment Pending): ${orderNumber}`,
      html: htmlContent,
    })

    console.log('✅ Venmo Order Placed email sent:', info.messageId)

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('❌ Error sending Venmo order placed email:', error)
    return new Response(JSON.stringify({ success: false, error: error.message || 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
