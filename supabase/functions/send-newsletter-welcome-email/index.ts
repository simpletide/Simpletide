// Supabase Edge Function: send-newsletter-welcome-email
// Simpletide — Branded Welcome Email (newsletter subscribe or new account).
// Sent when a visitor subscribes via NewsletterSection (or optionally on signup).
//
// Payload: { email: string, firstName?: string, type?: "newsletter" | "account" }
//
// Optional secret:
//   WELCOME_DISCOUNT_CODE — if set (e.g. WELCOME10), shows a highlighted 10%
//   off promo code box in the email. Left hidden until a real promo code is active.
//
// Storage steps are non-blocking — a failure there never blocks the email:
//   1. Stores the email in Supabase (public.newsletter_subscribers, self-created)
//   2. Syncs the contact in Omnisend (if OMNISEND_API_KEY is configured)
//   3. Sends the Simpletide welcome email via PrivateEmail SMTP

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";
import {
  COLORS,
  CORS_HEADERS,
  SHOP_URL,
  SITE_URL,
  SUPPORT_EMAIL,
  escapeHtml,
  isValidEmail,
  renderCtaButton,
  sendViaPrivateEmail,
  wrapEmailShell,
} from "../_shared/email.ts";

const OMNISEND_API = "https://api.omnisend.com/v5";

async function storeSubscriberInSupabase(email: string, source: string): Promise<void> {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    console.warn("SUPABASE_DB_URL not set; skipping Supabase storage");
    return;
  }

  const sql = postgres(dbUrl, { prepare: false });
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL UNIQUE,
        source text NOT NULL DEFAULT 'newsletter',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `;
    await sql`
      INSERT INTO public.newsletter_subscribers (email, source)
      VALUES (${email}, ${source})
      ON CONFLICT (email) DO NOTHING
    `;
    console.log(`Subscriber stored in Supabase: ${email}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function pushContactToOmnisend(email: string): Promise<void> {
  const key = Deno.env.get("OMNISEND_API_KEY")?.trim();
  if (!key) {
    console.warn("OMNISEND_API_KEY not set; skipping Omnisend sync");
    return;
  }

  const statusDate = new Date().toISOString();
  const res = await fetch(`${OMNISEND_API}/contacts`, {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      identifiers: [
        {
          type: "email",
          id: email,
          channels: { email: { status: "subscribed", statusDate } },
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Omnisend ${res.status}: ${errText}`);
  }
  console.log(`Omnisend contact synced: ${email}`);
}

export function buildWelcomeEmail(opts: {
  firstName?: string;
  discountCode?: string;
  type?: "newsletter" | "account";
}) {
  const cleanName = opts.firstName?.trim() || "";
  const code = opts.discountCode?.trim() || "";
  const isAccount = opts.type === "account";

  const subject = code
    ? `Welcome to Simpletide — here's your 10% off code`
    : "Welcome to Simpletide";

  const greeting = cleanName ? `Welcome, ${cleanName}!` : "Welcome to Simpletide";
  const subtitle = isAccount
    ? "Your Simpletide account is active. Track orders, browse third-party lab COAs, and reorder in seconds."
    : "You're subscribed to the Simpletide research list — new batch releases, restock alerts, and subscriber-only offers.";

  const discountBlock = code
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" style="background-color:${COLORS.tintBg};border:1px solid ${COLORS.tintBorder};border-radius:14px;padding:18px 24px;">
          <div style="font-size:11px;color:${COLORS.violet};text-transform:uppercase;letter-spacing:.12em;font-weight:700;margin-bottom:6px;">Your 10% Off First-Order Code</div>
          <div style="font-size:26px;line-height:1.2;font-weight:800;color:${COLORS.ink};letter-spacing:.08em;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${escapeHtml(code)}</div>
          <div style="font-size:12px;color:${COLORS.body};margin-top:6px;">Enter this code at checkout on your first order.</div>
        </td>
      </tr>
    </table>`
    : "";

  const bodyHtml = `
    ${discountBlock}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${COLORS.line};border-radius:14px;overflow:hidden;">
      <tr>
        <td style="padding:18px 22px 8px 22px;background-color:#faf9fe;border-bottom:1px solid ${COLORS.line};">
          <span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${COLORS.violet};font-weight:800;">What to expect</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 22px;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};">
          <strong>Third-party verified purity</strong><br />
          <span style="color:${COLORS.body};font-size:13px;">Every batch is independently tested by ILS Laboratories with public COAs in our <a href="${SITE_URL}/coa-archive" style="color:${COLORS.violet};text-decoration:none;font-weight:600;">COA Archive</a>.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 22px;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};">
          <strong>Same-day priority shipping</strong><br />
          <span style="color:${COLORS.body};font-size:13px;">Order by 4PM ET — ships same day with free USPS Priority delivery.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 22px;font-size:14px;color:${COLORS.ink};">
          <strong>Early restock &amp; batch alerts</strong><br />
          <span style="color:${COLORS.body};font-size:13px;">First notice when new research compounds drop or popular vials restock.</span>
        </td>
      </tr>
    </table>

    ${renderCtaButton("Shop Research Compounds", SHOP_URL)}
  `;

  const html = wrapEmailShell({
    preheader: code
      ? `Welcome to Simpletide — use code ${code} at checkout.`
      : "Welcome to Simpletide. Third-party tested research compounds with same-day shipping.",
    badge: isAccount ? "Account Ready" : "Welcome",
    badgeTone: "violet",
    title: greeting,
    subtitle,
    bodyHtml,
  });

  const text = [
    greeting,
    "",
    subtitle,
    ...(code ? ["", `YOUR 10% OFF CODE: ${code}`, "Enter this code at checkout on your first order."] : []),
    "",
    "WHAT TO EXPECT",
    `- Third-party verified purity (ILS Laboratories COAs): ${SITE_URL}/coa-archive`,
    "- Order by 4PM ET — ships same day. Free shipping over $199.",
    "- Early access to restocks, new batches, and subscriber offers.",
    "",
    `Browse products: ${SHOP_URL}`,
    "",
    `Questions? ${SUPPORT_EMAIL}`,
    "Simpletide • For laboratory research use only. Not for human consumption.",
  ].join("\n");

  return { subject, text, html };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const { email, firstName, type } = body ?? {};

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "A valid email address is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const source = type === "account" ? "account" : "newsletter";

    const [supabaseResult, omnisendResult] = await Promise.allSettled([
      storeSubscriberInSupabase(normalizedEmail, source),
      pushContactToOmnisend(normalizedEmail),
    ]);
    if (supabaseResult.status === "rejected") {
      console.error("Supabase storage failed (non-blocking):", supabaseResult.reason);
    }
    if (omnisendResult.status === "rejected") {
      console.error("Omnisend sync failed (non-blocking):", omnisendResult.reason);
    }

    const discountCode = Deno.env.get("WELCOME_DISCOUNT_CODE")?.trim() || undefined;
    const { subject, text, html } = buildWelcomeEmail({
      firstName: typeof firstName === "string" ? firstName : undefined,
      discountCode,
      type: source,
    });

    const info = await sendViaPrivateEmail({
      to: normalizedEmail,
      subject,
      text,
      html,
    });

    console.log(`Welcome email sent to: ${normalizedEmail}`);

    return new Response(JSON.stringify({ success: true, messageId: info.messageId }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      status: 500,
    });
  }
});
