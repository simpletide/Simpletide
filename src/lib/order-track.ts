import { apiUrl } from "@/lib/api";

export type TrackedOrder = {
  orderNumber: string;
  status: string;
  statusLabel: string;
  paymentStatus: string;
  paymentLabel: string;
  trackingNumber: string | null;
  createdAt: string;
  items: { product_name: string; quantity: number }[];
};

export type TrackOrderResponse = {
  success: boolean;
  error?: string;
  order?: TrackedOrder;
};

export function labelsForOrder(order: { status?: string; payment_status?: string }) {
  const status = String(order.status || "pending").toLowerCase();
  const payment = String(order.payment_status || "pending").toLowerCase();

  const statusLabel: Record<string, string> = {
    pending: "Order received",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const paymentLabel: Record<string, string> = {
    pending: "Payment pending",
    pending_payment: "Payment pending",
    paid: "Paid",
    failed: "Payment issue",
    refunded: "Refunded",
  };

  return {
    statusLabel: statusLabel[status] || status.replace(/_/g, " "),
    paymentLabel: paymentLabel[payment] || payment.replace(/_/g, " "),
  };
}

type OrderPaymentFields = {
  payment_status?: string | null;
  paymentStatus?: string | null;
  status?: string | null;
};

function orderPaymentFields(order: OrderPaymentFields) {
  const payment = String(order.payment_status ?? order.paymentStatus ?? "")
    .trim()
    .toLowerCase();
  const status = String(order.status ?? "")
    .trim()
    .toLowerCase();
  return { payment, status };
}

/** Matches Payment Admin — Venmo/Zelle/etc. awaiting manual confirmation. */
export function isPendingPaymentOrder(order: OrderPaymentFields) {
  const { payment, status } = orderPaymentFields(order);
  return (
    payment === "pending_payment" ||
    payment === "pending" ||
    status === "pending_payment" ||
    status === "pending"
  );
}

/** Customer account lists — paid/confirmed orders only (no pending payment). */
export function isConfirmedOrder(order: OrderPaymentFields) {
  if (isPendingPaymentOrder(order)) return false;

  const { payment, status } = orderPaymentFields(order);
  return (
    payment === "paid" ||
    payment === "confirmed" ||
    status === "paid" ||
    status === "confirmed" ||
    status === "processing" ||
    status === "shipped" ||
    status === "delivered"
  );
}

export function uspsTrackingUrl(trackingNumber: string): string {
  const enc = encodeURIComponent(trackingNumber.trim());
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${enc}`;
}

export function formatTrackDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export async function fetchOrderTrack(orderNumber: string, email: string): Promise<TrackedOrder> {
  const res = await fetch(apiUrl("/api/order-track"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber: orderNumber.trim(), email: email.trim() }),
  });
  const json = (await res.json()) as TrackOrderResponse;
  if (!res.ok || !json.success || !json.order) {
    throw new Error(json.error || "We could not find your order. Please check your details and try again.");
  }
  return json.order;
}
