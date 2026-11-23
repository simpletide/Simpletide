import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ClipboardCopy,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  Truck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase-lazy";
import { useAuth } from "@/lib/auth-context";
import { canAccessPaymentAdmin } from "@/lib/admin";
import { SHOP_PRODUCTS } from "@/lib/shop-products";
import { setLocalStockOverride } from "@/lib/stock-overrides";
import {
  LIVE_VISITORS_CHANNEL,
  type LiveVisitorPresence,
} from "@/components/SitePresenceTracker";

type ShippingAddress = {
  firstName?: string;
  lastName?: string;
  street?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
};

type LineItem = {
  product_id?: string;
  product_name?: string;
  name?: string;
  variant_spec?: string;
  variant?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  image?: string;
};

type AdminOrder = {
  id: string;
  order_number: string;
  user_id?: string | null;
  email: string;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  subtotal: number;
  shipping_cost: number;
  affiliate_code?: string | null;
  affiliate_discount: number;
  credits_discount: number;
  processing_fee: number;
  refunded_amount: number;
  total: number;
  shipping_method?: string | null;
  carrier?: string | null;
  tracking_number?: string | null;
  shipping_address?: ShippingAddress | null;
  line_items_snapshot?: LineItem[] | null;
  created_at: string;
  updated_at?: string;
};

type AdminCustomer = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  createdAt: string;
  lastSignInAt: string | null;
  orderCount: number;
  paidOrderCount: number;
  totalSpend: number;
  lastOrderAt: string | null;
};

type AdminSubscriber = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

type TrafficWindow = {
  pageviews: number;
  uniqueVisitors: number;
  productVisitors: number;
  checkoutVisitors: number;
  paidOrders: number;
};

type TrafficStats = {
  last24h: TrafficWindow;
  last7d: TrafficWindow;
};

type RangeKey = "today" | "7d" | "30d" | "all";
type AdminTab = "orders" | "picklist" | "traffic" | "customers" | "inventory";
type OrderFilter = "all" | "needs_shipping" | "paid" | "pending" | "shipped" | "closed";

function money(n: number | undefined | null): string {
  return `$${(Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

function getItems(order: AdminOrder): Array<{ name: string; variant: string; qty: number; price: number }> {
  const raw = Array.isArray(order.line_items_snapshot) ? order.line_items_snapshot : [];
  return raw.map((it) => ({
    name: String(it.product_name || it.name || "Research Compound"),
    variant: String(it.variant_spec || it.variant || "").trim(),
    qty: Math.max(1, Number(it.quantity ?? it.qty ?? 1) || 1),
    price: Number(it.price) || 0,
  }));
}

function customerName(order: AdminOrder): string {
  const a = order.shipping_address;
  const full = [a?.firstName, a?.lastName].filter(Boolean).join(" ").trim();
  return full || order.email.split("@")[0] || "Customer";
}

function formatAddressBlock(a?: ShippingAddress | null): string {
  if (!a) return "";
  const name = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
  const street = [a.street, a.apartment].filter(Boolean).join(", ").trim();
  const csz = [a.city, a.state, a.zipCode].filter(Boolean).join(" ").trim();
  return [name, street, csz, a.country && a.country !== "US" ? a.country : ""]
    .filter(Boolean)
    .join("\n");
}

function trackingUrl(carrier?: string | null, tracking?: string | null): string | null {
  const t = (tracking || "").trim();
  if (!t) return null;
  const c = (carrier || "").toUpperCase();
  if (c === "UPS" || t.startsWith("1Z")) return `https://www.ups.com/track?tracknum=${encodeURIComponent(t)}`;
  if (c === "FEDEX") return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(t)}`;
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(t)}`;
}

function csvEscape(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

function rangeStartMs(range: RangeKey): number {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start.getTime();
  }
  if (range === "7d") return Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return Date.now() - 30 * 24 * 60 * 60 * 1000;
  return 0;
}

function PaymentBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "paid"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "refunded"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : s === "failed"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

function FulfillmentBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "delivered"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "shipped"
        ? "bg-sky-50 text-sky-700 border-sky-200"
        : s === "processing"
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : s === "cancelled"
            ? "bg-neutral-100 text-neutral-500 border-neutral-200"
            : "bg-neutral-100 text-neutral-700 border-neutral-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${cls}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

const PaymentAdmin: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = canAccessPaymentAdmin(user?.email);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [traffic, setTraffic] = useState<TrafficStats>({
    last24h: { pageviews: 0, uniqueVisitors: 0, productVisitors: 0, checkoutVisitors: 0, paidOrders: 0 },
    last7d: { pageviews: 0, uniqueVisitors: 0, productVisitors: 0, checkoutVisitors: 0, paidOrders: 0 },
  });
  const [stockOverrides, setStockOverrides] = useState<Record<string, boolean>>({});
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitorPresence[]>([]);

  const [range, setRange] = useState<RangeKey>("30d");
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, { tracking: string; carrier: string }>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const callAdmin = useCallback(async <T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> => {
    const supabase = await getSupabase();
    let { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.access_token) {
      const refreshed = await supabase.auth.refreshSession();
      sess = refreshed.data;
    }
    const token = sess.session?.access_token;
    if (!token) throw new Error("Please sign in as simpletidebusiness@gmail.com.");

    const { data, error: fnErr } = await supabase.functions.invoke<T & { success?: boolean; error?: string }>(
      "admin-orders",
      {
        body,
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (fnErr) throw new Error(fnErr.message || "Admin request failed.");
    if (!data || data.success === false) {
      throw new Error(data?.error || "Admin request failed.");
    }
    return data;
  }, []);

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (!isAdmin) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await callAdmin<{
          orders: AdminOrder[];
          customers: AdminCustomer[];
          subscribers: AdminSubscriber[];
          traffic: TrafficStats;
          stockOverrides: Record<string, boolean>;
        }>({ action: "dashboard", limit: 500 });

        setOrders(res.orders ?? []);
        setCustomers(res.customers ?? []);
        setSubscribers(res.subscribers ?? []);
        if (res.traffic) setTraffic(res.traffic);
        setStockOverrides(res.stockOverrides ?? {});
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not load Payment Admin data.";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [callAdmin, isAdmin],
  );

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  // Live Visitors via Supabase Realtime Presence (read-only listener — admin never tracks itself)
  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    let cleanup: (() => void) | undefined;

    void (async () => {
      try {
        const supabase = await getSupabase();
        if (!active) return;
        const channel = supabase.channel(LIVE_VISITORS_CHANNEL);

        const syncPresence = () => {
          const state = channel.presenceState<LiveVisitorPresence>();
          const list: LiveVisitorPresence[] = [];
          for (const entries of Object.values(state)) {
            if (Array.isArray(entries) && entries.length > 0) {
              list.push(entries[entries.length - 1]);
            }
          }
          list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
          if (active) setLiveVisitors(list);
        };

        channel
          .on("presence", { event: "sync" }, syncPresence)
          .on("presence", { event: "join" }, syncPresence)
          .on("presence", { event: "leave" }, syncPresence)
          .subscribe();

        cleanup = () => {
          void supabase.removeChannel(channel);
        };
      } catch {
        /* ignore */
      }
    })();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [isAdmin]);

  // Derived metrics for selected timeframe
  const metrics = useMemo(() => {
    const startMs = rangeStartMs(range);
    const inRange = orders.filter((o) => Date.parse(o.created_at) >= startMs);
    const paidInRange = inRange.filter((o) => o.payment_status.toLowerCase() === "paid");
    const revenue = paidInRange.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const aov = paidInRange.length > 0 ? revenue / paidInRange.length : 0;

    const needsShipping = orders.filter(
      (o) =>
        o.payment_status.toLowerCase() === "paid" &&
        !["shipped", "delivered", "cancelled"].includes(o.status.toLowerCase()),
    );

    return {
      revenue,
      paidCount: paidInRange.length,
      totalOrdersInRange: inRange.length,
      aov,
      needsShippingCount: needsShipping.length,
      needsShipping,
    };
  }, [orders, range]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const p = o.payment_status.toLowerCase();
      const s = o.status.toLowerCase();
      if (orderFilter === "needs_shipping" && !(p === "paid" && !["shipped", "delivered", "cancelled"].includes(s))) {
        return false;
      }
      if (orderFilter === "paid" && p !== "paid") return false;
      if (orderFilter === "pending" && p !== "pending") return false;
      if (orderFilter === "shipped" && !["shipped", "delivered"].includes(s)) return false;
      if (orderFilter === "closed" && !(s === "cancelled" || p === "refunded")) return false;

      if (!q) return true;
      const name = customerName(o).toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        name.includes(q) ||
        (o.tracking_number || "").toLowerCase().includes(q)
      );
    });
  }, [orders, orderFilter, orderSearch]);

  // Unshipped Pick-List (total vials to pack)
  const pickList = useMemo(() => {
    const map = new Map<string, { name: string; variant: string; qty: number; orderCount: number }>();
    for (const o of metrics.needsShipping) {
      const seenInOrder = new Set<string>();
      for (const it of getItems(o)) {
        const key = `${it.name}::${it.variant}`;
        const cur = map.get(key) ?? { name: it.name, variant: it.variant, qty: 0, orderCount: 0 };
        cur.qty += it.qty;
        if (!seenInOrder.has(key)) {
          cur.orderCount += 1;
          seenInOrder.add(key);
        }
        map.set(key, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty);
  }, [metrics.needsShipping]);

  // Top-Selling Compounds across paid orders
  const topProducts = useMemo(() => {
    const startMs = rangeStartMs(range);
    const map = new Map<string, { name: string; units: number; revenue: number }>();
    for (const o of orders) {
      if (o.payment_status.toLowerCase() !== "paid") continue;
      if (Date.parse(o.created_at) < startMs) continue;
      for (const it of getItems(o)) {
        const cur = map.get(it.name) ?? { name: it.name, units: 0, revenue: 0 };
        cur.units += it.qty;
        cur.revenue += it.qty * it.price;
        map.set(it.name, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue || b.units - a.units);
  }, [orders, range]);

  // Filtered customers + inventory
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q),
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return SHOP_PRODUCTS;
    return SHOP_PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q),
    );
  }, [inventorySearch]);

  // Order mutation helpers
  const patchOrderInState = (updated: AdminOrder) => {
    setOrders((prev) => prev.map((o) => (o.order_number === updated.order_number ? updated : o)));
  };

  const handleMarkPaid = async (orderNumber: string) => {
    setBusyKey(`paid:${orderNumber}`);
    try {
      const res = await callAdmin<{ order: AdminOrder }>({ action: "mark_paid", orderNumber });
      patchOrderInState(res.order);
      toast.success(`${orderNumber} marked Paid — confirmation email triggered.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark paid.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleMarkShipped = async (orderNumber: string) => {
    const draft = trackingDrafts[orderNumber];
    const tracking = (draft?.tracking || "").trim();
    if (!tracking) {
      toast.error("Enter a tracking number first.");
      return;
    }
    setBusyKey(`ship:${orderNumber}`);
    try {
      const res = await callAdmin<{ order: AdminOrder }>({
        action: "mark_shipped",
        orderNumber,
        trackingNumber: tracking,
        carrier: draft?.carrier || undefined,
      });
      patchOrderInState(res.order);
      toast.success(`${orderNumber} marked Shipped — shipping email triggered.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark shipped.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpdateStatus = async (
    orderNumber: string,
    patch: { status?: string; paymentStatus?: string },
    label: string,
  ) => {
    setBusyKey(`status:${orderNumber}:${label}`);
    try {
      const res = await callAdmin<{ order: AdminOrder }>({
        action: "update_status",
        orderNumber,
        ...patch,
      });
      patchOrderInState(res.order);
      toast.success(`${orderNumber} updated (${label}).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleResendEmail = async (
    orderNumber: string,
    emailType: "order_confirmation" | "shipping_confirmation",
  ) => {
    setBusyKey(`email:${orderNumber}:${emailType}`);
    try {
      const res = await callAdmin<{ sentTo: string }>({
        action: "resend_email",
        orderNumber,
        emailType,
      });
      toast.success(
        `${emailType === "shipping_confirmation" ? "Shipping" : "Order"} confirmation sent to ${res.sentTo}.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resend email.");
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleStock = async (productName: string, currentlyOut: boolean) => {
    const nextOut = !currentlyOut;
    setBusyKey(`stock:${productName}`);
    try {
      await callAdmin({ action: "set_stock", productKey: productName, outOfStock: nextOut });
      setStockOverrides((prev) => ({ ...prev, [productName]: nextOut }));
      setLocalStockOverride(productName, nextOut);
      toast.success(`${productName} is now ${nextOut ? "Out of Stock" : "In Stock"}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update stock status.");
    } finally {
      setBusyKey(null);
    }
  };

  const exportPirateShipCsv = (list: AdminOrder[], filenamePrefix: string) => {
    if (list.length === 0) {
      toast.error("No orders to export.");
      return;
    }
    const headers = [
      "Order Number",
      "Name",
      "Email",
      "Phone",
      "Address 1",
      "Address 2",
      "City",
      "State",
      "Zip",
      "Country",
      "Items",
      "Total",
      "Shipping Method",
    ];
    const rows = list.map((o) => {
      const a = o.shipping_address || {};
      const itemSummary = getItems(o)
        .map((i) => `${i.qty}x ${i.name}${i.variant ? ` (${i.variant})` : ""}`)
        .join("; ");
      return [
        o.order_number,
        customerName(o),
        o.email,
        a.phone || "",
        a.street || "",
        a.apartment || "",
        a.city || "",
        a.state || "",
        a.zipCode || "",
        a.country || "US",
        itemSummary,
        Number(o.total || 0).toFixed(2),
        o.shipping_method || "priority",
      ];
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${filenamePrefix}-${stamp}.csv`, headers, rows);
    toast.success(`Exported ${list.length} order${list.length === 1 ? "" : "s"} for Pirate Ship / Shippo.`);
  };

  const exportCustomersCsv = () => {
    const headers = ["Name", "Email", "Phone", "City", "Orders", "Paid Spend", "Signed Up"];
    const rows = customers.map((c) => [
      c.fullName,
      c.email,
      c.phone,
      c.city,
      c.paidOrderCount,
      c.totalSpend.toFixed(2),
      formatShortDate(c.createdAt),
    ]);
    downloadCsv(`simpletide-customers-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success(`Exported ${customers.length} customer records.`);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-neutral-400" />
        <p className="mt-3 text-sm font-semibold text-neutral-900">Restricted to Simpletide Admin</p>
        <p className="mt-1 text-xs text-neutral-500">
          Sign in with your authorized business account to access Payment Admin.
        </p>
      </div>
    );
  }

  const liveCheckoutCount = liveVisitors.filter((v) => v.stage === "checkout").length;
  const liveCartCount = liveVisitors.filter((v) => v.cartCount > 0).length;

  return (
    <div className="space-y-5 text-neutral-900">
      {/* Top status & controls bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab("traffic")}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {liveVisitors.length} Live on Site
            {liveCartCount > 0 && <span className="text-emerald-700/80">· {liveCartCount} with cart</span>}
            {liveCheckoutCount > 0 && <span className="text-emerald-700/80">· {liveCheckoutCount} checkout</span>}
          </button>

          {metrics.needsShippingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("orders");
                setOrderFilter("needs_shipping");
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
            >
              <Truck className="h-3.5 w-3.5" />
              {metrics.needsShippingCount} ready to ship (4PM ET cutoff)
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-0.5 text-xs">
            {(
              [
                ["today", "Today"],
                ["7d", "7D"],
                ["30d", "30D"],
                ["all", "All"],
              ] as [RangeKey, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                  range === k ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Revenue</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">{money(metrics.revenue)}</p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {metrics.paidCount} paid order{metrics.paidCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Avg Order Value</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">{money(metrics.aov)}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{metrics.totalOrdersInRange} total placed</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Needs Shipping</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
            {metrics.needsShippingCount}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            {pickList.reduce((s, p) => s + p.qty, 0)} vials to pack
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Visits (24h / 7D)</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
            {traffic.last24h.uniqueVisitors}{" "}
            <span className="text-sm font-semibold text-neutral-400">/ {traffic.last7d.uniqueVisitors}</span>
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            7D conv: {pct(traffic.last7d.paidOrders, traffic.last7d.uniqueVisitors)}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 lg:col-span-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Accounts &amp; Leads</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">{customers.length}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{subscribers.length} email subscribers</p>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-3">
        {(
          [
            { id: "orders", label: `Orders (${orders.length})`, icon: Package },
            { id: "picklist", label: `Pick-List & Top Sellers`, icon: ShoppingBag },
            { id: "traffic", label: `Live Traffic (${liveVisitors.length})`, icon: Activity },
            { id: "customers", label: `Customers (${customers.length})`, icon: Users },
            { id: "inventory", label: `Stock Toggle`, icon: ToggleRight },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-neutral-200 bg-white py-16 text-sm text-neutral-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Simpletide backend…
        </div>
      ) : null}

      {/* ===================== TAB 1: ORDERS ===================== */}
      {!loading && activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order #, name, email, or tracking…"
                className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportPirateShipCsv(metrics.needsShipping, "simpletide-unshipped")}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                <Download className="h-3.5 w-3.5" />
                Pirate Ship CSV ({metrics.needsShippingCount})
              </button>
              <button
                type="button"
                onClick={() => exportPirateShipCsv(filteredOrders, "simpletide-orders")}
                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export View
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["all", "All"],
                ["needs_shipping", `Needs Shipping (${metrics.needsShippingCount})`],
                ["paid", "Paid"],
                ["pending", "Pending"],
                ["shipped", "Shipped / Delivered"],
                ["closed", "Cancelled / Refunded"],
              ] as [OrderFilter, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setOrderFilter(k)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  orderFilter === k
                    ? "bg-[#7c3aed] text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
              <Package className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-2 text-sm font-semibold text-neutral-800">No orders match this filter yet</p>
              <p className="mt-1 text-xs text-neutral-500">
                New orders placed on simpletide.com will show up here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const items = getItems(order);
                const isOpen = expandedOrder === order.order_number;
                const addrText = formatAddressBlock(order.shipping_address);
                const draft = trackingDrafts[order.order_number] ?? {
                  tracking: order.tracking_number || "",
                  carrier: order.carrier || "USPS",
                };
                const trackHref = trackingUrl(order.carrier, order.tracking_number);

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrder(isOpen ? null : order.order_number)}
                      className="flex w-full flex-col gap-2 px-4 py-3.5 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-neutral-900">{order.order_number}</span>
                          <PaymentBadge status={order.payment_status} />
                          <FulfillmentBadge status={order.status} />
                          {order.affiliate_code && (
                            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                              Code: {order.affiliate_code}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-neutral-600">
                          <span className="font-semibold text-neutral-900">{customerName(order)}</span> · {order.email} ·{" "}
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <p className="text-base font-bold text-neutral-900">{money(order.total)}</p>
                          <p className="text-[11px] text-neutral-500">
                            {items.reduce((s, i) => s + i.qty, 0)} vial{items.reduce((s, i) => s + i.qty, 0) === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#7c3aed]">{isOpen ? "Hide" : "Manage"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/60 px-4 py-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {/* Items */}
                          <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                              Items Ordered
                            </p>
                            <ul className="mt-2 divide-y divide-neutral-100 text-sm">
                              {items.map((it, idx) => (
                                <li key={idx} className="flex items-center justify-between py-1.5">
                                  <div>
                                    <span className="font-semibold text-neutral-900">{it.name}</span>
                                    {it.variant && (
                                      <span className="ml-1.5 text-xs text-neutral-500">({it.variant})</span>
                                    )}
                                    <span className="ml-2 text-xs font-semibold text-violet-700">×{it.qty}</span>
                                  </div>
                                  <span className="font-semibold text-neutral-800">{money(it.price * it.qty)}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 space-y-1 border-t border-neutral-100 pt-2 text-xs text-neutral-600">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{money(order.subtotal)}</span>
                              </div>
                              {(order.affiliate_discount > 0 || order.credits_discount > 0) && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>Discount</span>
                                  <span>-{money((order.affiliate_discount || 0) + (order.credits_discount || 0))}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-neutral-900">
                                <span>Total</span>
                                <span>{money(order.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Customer & Shipping Address */}
                          <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Customer &amp; Shipping Address
                              </p>
                              {addrText && (
                                <button
                                  type="button"
                                  onClick={() => void copyText(addrText, "Shipping address")}
                                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50"
                                >
                                  <ClipboardCopy className="h-3 w-3" />
                                  Copy Address
                                </button>
                              )}
                            </div>
                            <div className="mt-2 space-y-1 text-xs text-neutral-700">
                              <p className="font-semibold text-neutral-900">{customerName(order)}</p>
                              <p>{order.email}</p>
                              {order.shipping_address?.phone && <p>{order.shipping_address.phone}</p>}
                              {addrText ? (
                                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-50 p-2.5 font-sans text-xs text-neutral-800">
                                  {addrText}
                                </pre>
                              ) : (
                                <p className="italic text-neutral-400">No shipping address saved.</p>
                              )}
                              {order.tracking_number && (
                                <p className="pt-1.5 text-xs">
                                  <span className="font-semibold text-neutral-700">Tracking:</span>{" "}
                                  {trackHref ? (
                                    <a
                                      href={trackHref}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 font-mono font-semibold text-[#7c3aed] hover:underline"
                                    >
                                      {order.carrier || "USPS"} · {order.tracking_number}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    <span className="font-mono">{order.tracking_number}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Fulfillment & Tracking Bar */}
                        <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            Fulfillment &amp; Email Actions
                          </p>
                          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                            <select
                              value={draft.carrier}
                              onChange={(e) =>
                                setTrackingDrafts((prev) => ({
                                  ...prev,
                                  [order.order_number]: { ...draft, carrier: e.target.value },
                                }))
                              }
                              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-800"
                            >
                              <option value="USPS">USPS</option>
                              <option value="UPS">UPS</option>
                              <option value="FedEx">FedEx</option>
                              <option value="DHL">DHL</option>
                            </select>
                            <input
                              value={draft.tracking}
                              onChange={(e) =>
                                setTrackingDrafts((prev) => ({
                                  ...prev,
                                  [order.order_number]: { ...draft, tracking: e.target.value },
                                }))
                              }
                              placeholder="Enter tracking number…"
                              className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs text-neutral-900 placeholder:font-sans placeholder:text-neutral-400 focus:border-[#7c3aed] focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={busyKey === `ship:${order.order_number}`}
                              onClick={() => void handleMarkShipped(order.order_number)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
                            >
                              {busyKey === `ship:${order.order_number}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Truck className="h-3.5 w-3.5" />
                              )}
                              Mark Shipped &amp; Email
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.payment_status.toLowerCase() !== "paid" && (
                              <button
                                type="button"
                                disabled={busyKey === `paid:${order.order_number}`}
                                onClick={() => void handleMarkPaid(order.order_number)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark Paid
                              </button>
                            )}

                            {order.status.toLowerCase() !== "delivered" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleUpdateStatus(order.order_number, { status: "delivered" }, "Delivered")
                                }
                                className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Mark Delivered
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={busyKey === `email:${order.order_number}:order_confirmation`}
                              onClick={() => void handleResendEmail(order.order_number, "order_confirmation")}
                              className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-100"
                            >
                              <Mail className="h-3.5 w-3.5" />
                              Resend Order Email
                            </button>

                            {order.tracking_number && (
                              <button
                                type="button"
                                disabled={busyKey === `email:${order.order_number}:shipping_confirmation`}
                                onClick={() => void handleResendEmail(order.order_number, "shipping_confirmation")}
                                className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Resend Shipping Email
                              </button>
                            )}

                            {order.payment_status.toLowerCase() !== "refunded" && (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleUpdateStatus(
                                    order.order_number,
                                    { status: "cancelled", paymentStatus: "refunded" },
                                    "Refunded / Cancelled",
                                  )
                                }
                                className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Cancel / Refund
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: PICK-LIST & TOP SELLERS ===================== */}
      {!loading && activeTab === "picklist" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Unshipped Vial Pick-List</h3>
                <p className="text-xs text-neutral-500">
                  Total vials needed to pack all {metrics.needsShippingCount} paid, unshipped orders.
                </p>
              </div>
              <div className="flex gap-1.5">
                {pickList.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(
                        pickList
                          .map((p) => `${p.qty}x ${p.name}${p.variant ? ` (${p.variant})` : ""}`)
                          .join("\n"),
                        "Pick-list",
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => exportPirateShipCsv(metrics.needsShipping, "simpletide-pack-queue")}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              </div>
            </div>

            {pickList.length === 0 ? (
              <p className="mt-6 rounded-xl bg-neutral-50 p-6 text-center text-xs text-neutral-500">
                All caught up — zero paid orders waiting to be packed.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-neutral-100">
                {pickList.map((row) => (
                  <li key={`${row.name}-${row.variant}`} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {row.name}{" "}
                        {row.variant && <span className="text-xs font-medium text-neutral-500">({row.variant})</span>}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        Across {row.orderCount} order{row.orderCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="rounded-full bg-violet-100 px-3 py-1 font-mono text-sm font-bold text-violet-900">
                      ×{row.qty}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-bold text-neutral-900">Top-Selling Compounds ({range.toUpperCase()})</h3>
            <p className="text-xs text-neutral-500">Ranked by paid revenue in your selected date window.</p>
            {topProducts.length === 0 ? (
              <p className="mt-6 rounded-xl bg-neutral-50 p-6 text-center text-xs text-neutral-500">
                No paid product sales in this date range yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-neutral-100">
                {topProducts.slice(0, 12).map((p, idx) => (
                  <li key={p.name} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-neutral-900">{p.name}</p>
                        <p className="text-[11px] text-neutral-500">{p.units} units sold</p>
                      </div>
                    </div>
                    <span className="font-semibold text-neutral-900">{money(p.revenue)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: LIVE TRAFFIC & FUNNEL ===================== */}
      {!loading && activeTab === "traffic" && (
        <div className="space-y-5">
          {/* Real-time visitors */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Active Visitors Right Now ({liveVisitors.length})
                </h3>
                <p className="text-xs text-neutral-500">
                  Real-time browser sessions on simpletide.com (your admin session is excluded).
                </p>
              </div>
            </div>

            {liveVisitors.length === 0 ? (
              <p className="mt-5 rounded-xl bg-neutral-50 p-6 text-center text-xs text-neutral-500">
                No other active visitors right now. Open simpletide.com in an incognito tab to see yourself pop up live.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="py-2 pr-4">Current Page</th>
                      <th className="py-2 pr-4">Stage</th>
                      <th className="py-2 pr-4">Cart</th>
                      <th className="py-2 text-right">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {liveVisitors.map((v) => (
                      <tr key={v.visitorId}>
                        <td className="py-2.5 pr-4 font-mono font-semibold text-neutral-900">{v.path || "/"}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                              v.stage === "checkout"
                                ? "bg-emerald-50 text-emerald-700"
                                : v.stage === "product"
                                  ? "bg-violet-50 text-violet-700"
                                  : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {v.stage}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-semibold text-neutral-700">
                          {v.cartCount > 0 ? `${v.cartCount} item${v.cartCount === 1 ? "" : "s"}` : "Empty"}
                        </td>
                        <td className="py-2.5 text-right text-neutral-500">{timeAgo(v.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 24h & 7D Conversion Funnels */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {(
              [
                ["Last 24 Hours Funnel", traffic.last24h],
                ["Last 7 Days Funnel", traffic.last7d],
              ] as [string, TrafficWindow][]
            ).map(([title, w]) => {
              const steps = [
                { label: "Unique Site Visitors", value: w.uniqueVisitors, base: w.uniqueVisitors },
                { label: "Viewed a Product Page", value: w.productVisitors, base: w.uniqueVisitors },
                { label: "Reached Checkout", value: w.checkoutVisitors, base: w.uniqueVisitors },
                { label: "Completed Paid Order", value: w.paidOrders, base: w.uniqueVisitors },
              ];
              return (
                <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
                    <span className="text-xs text-neutral-500">{w.pageviews} total pageviews</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {steps.map((s) => {
                      const width = w.uniqueVisitors > 0 ? Math.min(100, Math.round((s.value / w.uniqueVisitors) * 100)) : 0;
                      return (
                        <div key={s.label}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-700">{s.label}</span>
                            <span className="font-bold text-neutral-900">
                              {s.value}{" "}
                              <span className="font-normal text-neutral-400">({pct(s.value, s.base)})</span>
                            </span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#f472b6] via-[#a78bfa] to-[#38bdf8]"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: CUSTOMERS & LEADS ===================== */}
      {!loading && activeTab === "customers" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer name, email, or city…"
                className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={exportCustomersCsv}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export Customers CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Lifetime Spend</th>
                  <th className="px-4 py-3 text-right">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900">{c.fullName || "—"}</span>
                        {c.paidOrderCount >= 2 && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                            Repeat
                          </span>
                        )}
                      </div>
                      {c.city && <p className="text-[11px] text-neutral-500">{c.city}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-800">{c.email}</p>
                      {c.phone && <p className="text-[11px] text-neutral-500">{c.phone}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-neutral-800">
                      {c.paidOrderCount} paid
                      {c.orderCount > c.paidOrderCount && (
                        <span className="ml-1 text-neutral-400">({c.orderCount} total)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-neutral-900">{money(c.totalSpend)}</td>
                    <td className="px-4 py-3 text-right text-neutral-500">{formatShortDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subscribers.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Newsletter &amp; Email Subscribers ({subscribers.length})
                  </h3>
                  <p className="text-xs text-neutral-500">Captured from footer signups and new accounts.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsv(
                      `simpletide-subscribers-${new Date().toISOString().slice(0, 10)}.csv`,
                      ["Email", "Source", "Subscribed At"],
                      subscribers.map((s) => [s.email, s.source, formatShortDate(s.created_at)]),
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Emails
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {subscribers.slice(0, 40).map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                  >
                    {s.email}
                  </span>
                ))}
                {subscribers.length > 40 && (
                  <span className="px-2 py-1 text-xs text-neutral-400">
                    +{subscribers.length - 40} more in CSV
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 5: QUICK STOCK TOGGLE ===================== */}
      {!loading && activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Quick Out-of-Stock Controls</h3>
              <p className="text-xs text-neutral-500">
                Flip any compound to Out of Stock instantly — updates product cards and product pages live without a
                redeploy.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Filter compounds…"
                className="w-full rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-4 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filteredProducts.map((p) => {
              const isOut = p.name in stockOverrides ? stockOverrides[p.name] : Boolean(p.outOfStock);
              const busy = busyKey === `stock:${p.name}`;
              return (
                <div
                  key={p.name}
                  className={`flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 ${
                    isOut ? "border-amber-200 bg-amber-50/40" : "border-neutral-200"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-10 w-10 shrink-0 rounded-lg border border-neutral-100 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900">{p.name}</p>
                      <p className="text-[11px] text-neutral-500">
                        {p.price} {p.category ? `· ${p.category}` : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleToggleStock(p.name, isOut)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      isOut
                        ? "border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
                        : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isOut ? (
                      <ToggleLeft className="h-4 w-4" />
                    ) : (
                      <ToggleRight className="h-4 w-4" />
                    )}
                    {isOut ? "Out of Stock" : "In Stock"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAdmin;
