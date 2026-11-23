// Supabase Edge Function: create-card-order
// Processor-ready server-side checkout endpoint for Simpletide.
//
// Once your card processor (e.g., Clear Finance/Veyra, NMI, Authorize.net) is
// approved:
//   1. Store processor API credentials via `supabase secrets set ...`.
//   2. Replace the processor placeholder block below with the charge API call.
//   3. On approval, insert into `public.orders` with `payment_status: "paid"`
//      — the live `send_order_confirmation_email` Database Webhook will
//      automatically email the customer with product thumbnails & receipt.
//   4. Flip `CARD_PROCESSING_LIVE = true` in `src/lib/payment-config.ts`.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { CORS_HEADERS, isValidEmail } from "../_shared/email.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const processor = (Deno.env.get("CARD_PROCESSOR") || "").trim().toLowerCase();
    if (!processor) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Online card processing is not yet enabled on Simpletide. Please contact support@simpletide.com.",
        }),
        { status: 503, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const orderData = body?.orderData ?? {};
    const items = Array.isArray(orderData?.items) ? orderData.items : [];

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email address is required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    if (items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Order must include at least one item." }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase environment not configured.");
    }

    // Keep reference for future processor integration (lint-clean).
    const _admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    void _admin;

    // -------------------------------------------------------------------------
    // PROCESSOR HOOK:
    // Plug the approved merchant gateway API call here, then insert the paid
    // row into `public.orders` (which triggers `send-order-confirmation-email`).
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: false,
        error: `Card processor "${processor}" integration is not wired yet.`,
      }),
      { status: 501, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed. Please try again.";
    console.error("create-card-order error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }
});
