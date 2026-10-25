// Supabase Edge Function: send-newsletter-welcome-email
// Simpletide — "Welcome to the newsletter" email.
// Sent the moment a visitor subscribes via the Newsletter section.
//
// Design mirrors the dark "Welcome" layout (teal header banner, "What you'll get"
// list, blue Browse Products button) but is fully branded as Simpletide.
//
// Payload: { email: string }
//
// On subscribe this function does three things (storage steps are non-blocking —
// a failure there never prevents the welcome email from sending):
//   1. Stores the email in Supabase (public.newsletter_subscribers, self-created)
//   2. Adds/updates the contact in Omnisend (subscribed) for email campaigns
//   3. Sends the branded welcome email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from 'npm:nodemailer'
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js'

const SITE_URL = 'https://simpletide.com'
const SHOP_URL = `${SITE_URL}/products`
const SUPPORT_EMAIL = 'support@simpletide.com'

const OMNISEND_API = 'https://api.omnisend.com/v5'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Store the subscriber in Supabase. Uses the auto-injected SUPABASE_DB_URL so we
 * can create the table on demand (no separate migration needed) and upsert by email.
 */
async function storeSubscriberInSupabase(email: string): Promise<void> {
  const dbUrl = Deno.env.get('SUPABASE_DB_URL')
  if (!dbUrl) {
    console.warn('⚠️ SUPABASE_DB_URL not set; skipping Supabase storage')
    return
  }

  const sql = postgres(dbUrl, { prepare: false })
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        source text NOT NULL DEFAULT 'newsletter',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `
    await sql`
      INSERT INTO public.newsletter_subscribers (email, source)
      VALUES (${email}, 'newsletter')
      ON CONFLICT (email) DO NOTHING
    `
    console.log(`✅ Subscriber stored in Supabase: ${email}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

/** Add/update the contact in Omnisend (status: subscribed) — mirrors lib/omnisend.ts. */
async function pushContactToOmnisend(email: string): Promise<void> {
  const key = Deno.env.get('OMNISEND_API_KEY')?.trim()
  if (!key) {
    console.warn('⚠️ OMNISEND_API_KEY not set; skipping Omnisend sync')
    return
  }

  const statusDate = new Date().toISOString()
  const res = await fetch(`${OMNISEND_API}/contacts`, {
    method: 'POST',
    headers: {
      'X-API-KEY': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      identifiers: [
        {
          type: 'email',
          id: email,
          channels: { email: { status: 'subscribed', statusDate } },
        },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Omnisend ${res.status}: ${errText}`)
  }
  console.log(`✅ Omnisend contact synced: ${email}`)
}

function buildNewsletterEmail() {
  const subject = 'Welcome to Simpletide'

  const text = `Welcome to Simpletide!

Thank you for subscribing to the Simpletide newsletter. You're now part of our research community.

WHAT YOU'LL GET
- Early access to new compounds & research
- Research insights & industry updates
- Exclusive subscriber-only offers

Browse products: ${SHOP_URL}

Questions? ${SUPPORT_EMAIL}
Simpletide • Research Use Only (RUO) • Third-Party Lab Tested`

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .pad-32 { padding: 28px 22px !important; }
      .hero-title { font-size: 26px !important; }
      .brand-mark { font-size: 26px !important; letter-spacing: 0.14em !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0e1116; line-height: 1.6;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">You're in. Here's what to expect from the Simpletide newsletter.</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #0e1116;">
    <tr>
      <td align="center" style="padding: 28px 12px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" class="email-shell" style="max-width: 600px; width: 600px;">
          <tr>
            <td style="background-color: #161a21; border: 1px solid #232a34; border-radius: 18px; overflow: hidden;">

              <!-- Teal header banner -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="background: linear-gradient(90deg, #4f97ec 0%, #2a6ad0 100%); padding: 42px 24px;">
                    <span class="brand-mark" style="font-size: 30px; font-weight: 700; letter-spacing: 0.18em; color: #ffffff; text-transform: uppercase;">
                      Simpletide
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="pad-32" style="padding: 40px 36px 8px 36px;">
                    <h1 class="hero-title" style="margin: 0 0 14px 0; font-size: 30px; line-height: 1.2; font-weight: 800; color: #f5f7fa;">
                      Welcome to Simpletide!
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #9aa6b6; line-height: 1.65;">
                      Thank you for subscribing to the Simpletide newsletter. You're now part of our research community.
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td class="pad-32" style="padding: 28px 36px 0 36px;">
                    <div style="border-top: 1px solid #262d38; font-size: 0; line-height: 0;">&nbsp;</div>
                  </td>
                </tr>

                <!-- What you'll get -->
                <tr>
                  <td class="pad-32" style="padding: 26px 36px 0 36px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #5aa6f2; font-weight: 700;">
                      What you'll get
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 1px solid #262d38; font-size: 15px; color: #dfe5ee;">
                          Early access to new compounds &amp; research
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 1px solid #262d38; font-size: 15px; color: #dfe5ee;">
                          Research insights &amp; industry updates
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 18px 0; border-bottom: 1px solid #262d38; font-size: 15px; color: #dfe5ee;">
                          Exclusive subscriber-only offers
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td align="center" class="pad-32" style="padding: 34px 36px 44px 36px;">
                    <a href="${SHOP_URL}" style="display: inline-block; background: linear-gradient(90deg, #4f97ec 0%, #2a6ad0 100%); color: #ffffff !important; text-decoration: none; padding: 15px 56px; border-radius: 10px; font-size: 16px; font-weight: 700;">
                      Browse Products
                    </a>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 0 36px 34px 36px;" class="pad-32">
                    <div style="border-top: 1px solid #262d38; padding-top: 22px; text-align: center; font-size: 12px; line-height: 1.7; color: #6b7686;">
                      <a href="mailto:${SUPPORT_EMAIL}" style="color: #5aa6f2; text-decoration: none;">${SUPPORT_EMAIL}</a><br>
                      Simpletide &bull; Research Use Only (RUO) &bull; Third-Party Lab Tested
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, htmlContent }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new Error('A valid email address is required.')
    }

    const emailUser = Deno.env.get('EMAIL_USER')
    const emailPass = Deno.env.get('EMAIL_PASS')
    if (!emailUser || !emailPass) {
      throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in Supabase Edge Function secrets.')
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Storage steps are non-blocking: log failures but still send the welcome email.
    const [supabaseResult, omnisendResult] = await Promise.allSettled([
      storeSubscriberInSupabase(normalizedEmail),
      pushContactToOmnisend(normalizedEmail),
    ])
    if (supabaseResult.status === 'rejected') {
      console.error('⚠️ Supabase storage failed (non-blocking):', supabaseResult.reason)
    }
    if (omnisendResult.status === 'rejected') {
      console.error('⚠️ Omnisend sync failed (non-blocking):', omnisendResult.reason)
    }

    const { subject, text, htmlContent } = buildNewsletterEmail()

    const transporter = nodemailer.createTransport({
      host: 'mail.privateemail.com',
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
    })

    const info = await transporter.sendMail({
      from: `"Simpletide" <${emailUser}>`,
      to: normalizedEmail,
      subject,
      text,
      html: htmlContent,
    })

    console.log(`✅ Newsletter welcome email sent to: ${normalizedEmail}`)

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      status: 200,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error:', error)
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      status: 500,
    })
  }
})
