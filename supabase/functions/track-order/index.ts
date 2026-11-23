// Supabase Edge Function: track-order
// Public order-status lookup against Simpletide's `public.orders` table.
//
// Security: requires BOTH a matching `orderNumber` AND matching billing `email`
// (case-insensitive) and returns ONLY non-sensitive fulfillment fields (status,
// tracking number, carrier, item names/quantities, created_at) — never customer
// street address, phone number, or payment details.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { CORS_HEADERS, isValidEmail } from "../_shared/email.ts";

function labelsForOrder(statusRaw: unknown, paymentRaw: unknown) {
  const status = String(statusRaw || "pending").toLowerCase();
  const payment = String(paymentRaw || "pending").toLowerCase();

  const statusMap: Record<string, string> = {
    pending: "Order received",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const paymentMap: Record<string, string> = {
    pending: "Payment pending",
    pending_payment: "Payment pending",
    paid: "Paid",
    failed: "Payment issue",
    refunded: "Refunded",
  };

  return {
    statusLabel: statusMap[status] || status.replace(/_/g, " "),
    paymentLabel: paymentMap[payment] || payment.replace(/_/g, " "),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const orderNumber = String(body?.orderNumber ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!orderNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter your order number." }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter a valid billing email address." }),
        { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase environment not configured.");
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin
      .from("orders")
      .select("order_number, email, status, payment_status, tracking_number, carrier, created_at, line_items_snapshot")
      .ilike("order_number", orderNumber)
      .ilike("email", email)
      .maybeSingle();

    if (error) {
      console.error("track-order query failed:", error);
      throw new Error("Unable to look up order right now. Please try again.");
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "We could not find an order matching that order number and billing email.",
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const labels = labelsForOrder(data.status, data.payment_status);
    const rawItems = Array.isArray(data.line_items_snapshot) ? data.line_items_snapshot : [];
    const items = rawItems.map((it: Record<string, unknown>) => ({
      product_name: String(it?.product_name ?? it?.name ?? "Research Compound"),
      quantity: Math.max(1, Number(it?.quantity ?? it?.qty ?? 1) || 1),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          orderNumber: data.order_number,
          status: data.status,
          statusLabel: labels.statusLabel,
          paymentStatus: data.payment_status,
          paymentLabel: labels.paymentLabel,
          trackingNumber: data.tracking_number ?? null,
          carrier: data.carrier ?? null,
          createdAt: data.created_at,
          items,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to look up order.";
    console.error("track-order error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }
});
