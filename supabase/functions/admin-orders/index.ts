// Supabase Edge Function: admin-orders
// Admin order management backed directly by Simpletide's `public.orders` table.
//
// Security: verifies the caller's Supabase Auth JWT via `getUser(token)` and
// confirms their email is in the `ADMIN_EMAILS` secret (comma-separated).
//
// Actions:
//   - { action: "list", limit?: number }
//   - { action: "mark_paid", orderNumber: string }
//       -> updates payment_status='paid', status='processing' (fires Order Confirmation webhook)
//   - { action: "mark_shipped", orderNumber: string, trackingNumber: string, carrier?: string }
//       -> updates status='shipped', tracking_number, carrier (fires Shipping Confirmation webhook)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { CORS_HEADERS, normalizeCarrier } from "../_shared/email.ts";

function getAllowedAdminEmails(): Set<string> {
  const raw = Deno.env.get("ADMIN_EMAILS") || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase environment not configured.");
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Sign in required." }),
        { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const callerEmail = userData?.user?.email?.trim().toLowerCase() || "";
    const allowed = getAllowedAdminEmails();

    if (userErr || !callerEmail || !allowed.has(callerEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden. Admin access required." }),
        { status: 403, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
      );
    }

    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "list") {
      const limit = Math.min(200, Math.max(1, Number(body?.limit) || 100));
      const { data, error } = await admin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, orders: data ?? [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (action === "mark_paid") {
      const orderNumber = String(body?.orderNumber || "").trim();
      if (!orderNumber) {
        return new Response(
          JSON.stringify({ success: false, error: "orderNumber is required." }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
        );
      }
      const { data, error } = await admin
        .from("orders")
        .update({ payment_status: "paid", status: "processing" })
        .eq("order_number", orderNumber)
        .select("order_number, status, payment_status")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return new Response(
          JSON.stringify({ success: false, error: `Order ${orderNumber} not found.` }),
          { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
        );
      }
      return new Response(JSON.stringify({ success: true, order: data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (action === "mark_shipped") {
      const orderNumber = String(body?.orderNumber || "").trim();
      const trackingNumber = String(body?.trackingNumber || "").trim();
      if (!orderNumber || !trackingNumber) {
        return new Response(
          JSON.stringify({ success: false, error: "orderNumber and trackingNumber are required." }),
          { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
        );
      }
      const carrier = normalizeCarrier(body?.carrier, trackingNumber);
      const { data, error } = await admin
        .from("orders")
        .update({
          status: "shipped",
          tracking_number: trackingNumber,
          carrier,
        })
        .eq("order_number", orderNumber)
        .select("order_number, status, tracking_number, carrier")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        return new Response(
          JSON.stringify({ success: false, error: `Order ${orderNumber} not found.` }),
          { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
        );
      }
      return new Response(JSON.stringify({ success: true, order: data }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
      { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin request failed.";
    console.error("admin-orders error:", error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } },
    );
  }
});
