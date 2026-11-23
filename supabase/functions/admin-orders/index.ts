// Supabase Edge Function: admin-orders
// Full backend for Simpletide Payment Admin, strictly locked to simpletidebusiness@gmail.com.
//
// Security:
//   - Verifies caller's Supabase Auth JWT via `admin.auth.getUser(token)`.
//   - Confirms caller email is strictly in the allowed admin set (defaults to
//     `simpletidebusiness@gmail.com`, optionally overridden by `ADMIN_EMAILS`).
//
// Actions:
//   - { action: "dashboard", limit?: number }
//   - { action: "list", limit?: number }
//   - { action: "mark_paid", orderNumber: string }
//   - { action: "mark_shipped", orderNumber: string, trackingNumber: string, carrier?: string }
//   - { action: "update_status", orderNumber: string, status?: string, paymentStatus?: string }
//   - { action: "resend_email", orderNumber: string, emailType: "order_confirmation" | "shipping_confirmation" }
//   - { action: "set_stock", productKey: string, outOfStock: boolean }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { CORS_HEADERS, normalizeCarrier } from "../_shared/email.ts";

const DEFAULT_ADMIN_EMAILS = ["simpletidebusiness@gmail.com"];

function getAllowedAdminEmails(): Set<string> {
  const raw = (Deno.env.get("ADMIN_EMAILS") || "").trim();
  const list = raw ? raw.split(",") : DEFAULT_ADMIN_EMAILS;
  return new Set(list.map((s) => s.trim().toLowerCase()).filter(Boolean));
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

type VisitRow = {
  visitor_id: string;
  path: string;
  stage: string;
  created_at: string;
};

function computeTrafficWindow(rows: VisitRow[], sinceMs: number) {
  const uniqueAll = new Set<string>();
  const uniqueProduct = new Set<string>();
  const uniqueCheckout = new Set<string>();
  let pageviews = 0;

  for (const r of rows) {
    const t = Date.parse(r.created_at);
    if (Number.isNaN(t) || t < sinceMs) continue;
    pageviews += 1;
    uniqueAll.add(r.visitor_id);
    if (r.stage === "product" || r.path.startsWith("/product")) {
      uniqueProduct.add(r.visitor_id);
    }
    if (r.stage === "checkout" || r.path.startsWith("/checkout")) {
      uniqueCheckout.add(r.visitor_id);
    }
  }

  return {
    pageviews,
    uniqueVisitors: uniqueAll.size,
    productVisitors: uniqueProduct.size,
    checkoutVisitors: uniqueCheckout.size,
  };
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
      return jsonResponse({ success: false, error: "Sign in required." }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const callerEmail = userData?.user?.email?.trim().toLowerCase() || "";
    const allowed = getAllowedAdminEmails();

    if (userErr || !callerEmail || !allowed.has(callerEmail)) {
      return jsonResponse({ success: false, error: "Forbidden. Admin access required." }, 403);
    }

    const body = await req.json();
    const action = String(body?.action || "");

    // -------------------------------------------------------------------------
    // FULL DASHBOARD SNAPSHOT (orders + customers + subscribers + traffic + stock)
    // -------------------------------------------------------------------------
    if (action === "dashboard") {
      const limit = Math.min(500, Math.max(1, Number(body?.limit) || 250));
      const now = Date.now();
      const sevenDaysAgoIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [ordersRes, usersRes, subsRes, visitsRes, stockRes] = await Promise.all([
        admin
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
        admin
          .from("newsletter_subscribers")
          .select("id, email, source, created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
        admin
          .from("site_visits")
          .select("visitor_id, path, stage, created_at")
          .gte("created_at", sevenDaysAgoIso)
          .order("created_at", { ascending: false })
          .limit(10000),
        admin
          .from("product_stock_overrides")
          .select("product_key, out_of_stock, updated_at"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      const orders = ordersRes.data ?? [];

      // Aggregate per-customer spend from orders
      const statsByEmail = new Map<
        string,
        { orderCount: number; paidOrderCount: number; totalSpend: number; lastOrderAt: string | null }
      >();
      for (const o of orders) {
        const em = String(o.email || "").trim().toLowerCase();
        if (!em) continue;
        const cur = statsByEmail.get(em) ?? {
          orderCount: 0,
          paidOrderCount: 0,
          totalSpend: 0,
          lastOrderAt: null,
        };
        cur.orderCount += 1;
        if (String(o.payment_status || "").toLowerCase() === "paid") {
          cur.paidOrderCount += 1;
          cur.totalSpend += Number(o.total) || 0;
        }
        if (!cur.lastOrderAt || (o.created_at && o.created_at > cur.lastOrderAt)) {
          cur.lastOrderAt = o.created_at ?? cur.lastOrderAt;
        }
        statsByEmail.set(em, cur);
      }

      const authUsers = usersRes.error ? [] : usersRes.data?.users ?? [];
      const customers = authUsers
        .map((u) => {
          const em = (u.email || "").trim().toLowerCase();
          const st = statsByEmail.get(em);
          const meta = (u.user_metadata || {}) as Record<string, unknown>;
          return {
            id: u.id,
            email: u.email || "",
            fullName: String(meta.full_name || meta.name || "").trim(),
            phone: String(meta.phone || u.phone || "").trim(),
            city: String(meta.city || "").trim(),
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at ?? null,
            orderCount: st?.orderCount ?? 0,
            paidOrderCount: st?.paidOrderCount ?? 0,
            totalSpend: Math.round((st?.totalSpend ?? 0) * 100) / 100,
            lastOrderAt: st?.lastOrderAt ?? null,
          };
        })
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

      const subscribers = subsRes.error ? [] : subsRes.data ?? [];
      const visits = (visitsRes.error ? [] : visitsRes.data ?? []) as VisitRow[];

      const dayAgoMs = now - 24 * 60 * 60 * 1000;
      const weekAgoMs = now - 7 * 24 * 60 * 60 * 1000;
      const paidOrders24h = orders.filter(
        (o) =>
          String(o.payment_status || "").toLowerCase() === "paid" &&
          Date.parse(o.created_at) >= dayAgoMs,
      ).length;
      const paidOrders7d = orders.filter(
        (o) =>
          String(o.payment_status || "").toLowerCase() === "paid" &&
          Date.parse(o.created_at) >= weekAgoMs,
      ).length;

      const traffic = {
        last24h: { ...computeTrafficWindow(visits, dayAgoMs), paidOrders: paidOrders24h },
        last7d: { ...computeTrafficWindow(visits, weekAgoMs), paidOrders: paidOrders7d },
      };

      const stockOverrides: Record<string, boolean> = {};
      if (!stockRes.error && Array.isArray(stockRes.data)) {
        for (const row of stockRes.data) {
          stockOverrides[String(row.product_key)] = Boolean(row.out_of_stock);
        }
      }

      return jsonResponse({
        success: true,
        orders,
        customers,
        subscribers,
        traffic,
        stockOverrides,
      });
    }

    if (action === "list") {
      const limit = Math.min(200, Math.max(1, Number(body?.limit) || 100));
      const { data, error } = await admin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return jsonResponse({ success: true, orders: data ?? [] });
    }

    if (action === "mark_paid") {
      const orderNumber = String(body?.orderNumber || "").trim();
      if (!orderNumber) return jsonResponse({ success: false, error: "orderNumber is required." }, 400);
      const { data, error } = await admin
        .from("orders")
        .update({ payment_status: "paid", status: "processing" })
        .eq("order_number", orderNumber)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ success: false, error: `Order ${orderNumber} not found.` }, 404);
      return jsonResponse({ success: true, order: data });
    }

    if (action === "mark_shipped") {
      const orderNumber = String(body?.orderNumber || "").trim();
      const trackingNumber = String(body?.trackingNumber || "").trim();
      if (!orderNumber || !trackingNumber) {
        return jsonResponse({ success: false, error: "orderNumber and trackingNumber are required." }, 400);
      }
      const carrier = normalizeCarrier(body?.carrier, trackingNumber);
      const { data, error } = await admin
        .from("orders")
        .update({ status: "shipped", tracking_number: trackingNumber, carrier })
        .eq("order_number", orderNumber)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ success: false, error: `Order ${orderNumber} not found.` }, 404);
      return jsonResponse({ success: true, order: data });
    }

    if (action === "update_status") {
      const orderNumber = String(body?.orderNumber || "").trim();
      if (!orderNumber) return jsonResponse({ success: false, error: "orderNumber is required." }, 400);

      const allowedStatuses = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);
      const allowedPayments = new Set(["pending", "paid", "failed", "refunded"]);
      const patch: Record<string, unknown> = {};
      if (body?.status) {
        const s = String(body.status).toLowerCase();
        if (!allowedStatuses.has(s)) return jsonResponse({ success: false, error: "Invalid status." }, 400);
        patch.status = s;
      }
      if (body?.paymentStatus) {
        const p = String(body.paymentStatus).toLowerCase();
        if (!allowedPayments.has(p)) return jsonResponse({ success: false, error: "Invalid paymentStatus." }, 400);
        patch.payment_status = p;
      }
      if (Object.keys(patch).length === 0) {
        return jsonResponse({ success: false, error: "No status update provided." }, 400);
      }

      const { data, error } = await admin
        .from("orders")
        .update(patch)
        .eq("order_number", orderNumber)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonResponse({ success: false, error: `Order ${orderNumber} not found.` }, 404);
      return jsonResponse({ success: true, order: data });
    }

    if (action === "resend_email") {
      const orderNumber = String(body?.orderNumber || "").trim();
      const emailType = String(body?.emailType || "");
      if (!orderNumber) return jsonResponse({ success: false, error: "orderNumber is required." }, 400);

      const { data: order, error } = await admin
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) throw error;
      if (!order) return jsonResponse({ success: false, error: `Order ${orderNumber} not found.` }, 404);

      const fnName =
        emailType === "shipping_confirmation"
          ? "send-shipping-confirmation-email"
          : emailType === "order_confirmation"
            ? "send-order-confirmation-email"
            : "";
      if (!fnName) {
        return jsonResponse({ success: false, error: "Invalid emailType." }, 400);
      }
      if (emailType === "shipping_confirmation" && !order.tracking_number) {
        return jsonResponse(
          { success: false, error: "Add a tracking number before resending a shipping confirmation email." },
          400,
        );
      }

      const payload = {
        email: order.email,
        orderNumber: order.order_number,
        items: Array.isArray(order.line_items_snapshot) ? order.line_items_snapshot : [],
        subtotal: order.subtotal,
        shippingCost: order.shipping_cost,
        discountAmount: (Number(order.affiliate_discount) || 0) + (Number(order.credits_discount) || 0),
        discountCode: order.affiliate_code || undefined,
        total: order.total,
        shippingAddress: order.shipping_address || undefined,
        shippingMethod: order.shipping_method || undefined,
        trackingNumber: order.tracking_number || undefined,
        carrier: order.carrier || undefined,
      };

      const fnRes = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify(payload),
      });
      const fnJson = await fnRes.json().catch(() => ({}));
      if (!fnRes.ok || fnJson?.error) {
        throw new Error(fnJson?.error || `Failed to send ${emailType} (${fnRes.status}).`);
      }

      return jsonResponse({ success: true, sentTo: order.email, emailType });
    }

    if (action === "set_stock") {
      const productKey = String(body?.productKey || "").trim();
      const outOfStock = Boolean(body?.outOfStock);
      if (!productKey) return jsonResponse({ success: false, error: "productKey is required." }, 400);

      const { error } = await admin.from("product_stock_overrides").upsert(
        {
          product_key: productKey,
          out_of_stock: outOfStock,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_key" },
      );
      if (error) throw error;
      return jsonResponse({ success: true, productKey, outOfStock });
    }

    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin request failed.";
    console.error("admin-orders error:", error);
    return jsonResponse({ success: false, error: message }, 500);
  }
});
