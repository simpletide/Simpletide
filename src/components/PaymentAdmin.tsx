import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { canAccessPaymentAdmin } from '@/lib/admin';

/** Must match Checkout / LinkMoney — in production the API is on Railway, not the static site domain. */
function getApiBase(): string {
  const fromEnv = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  return 'https://web-production-a7fad.up.railway.app';
}

/**
 * Railway admin APIs validate the JWT with getUser(token). On mobile, storage can hydrate
 * late and access tokens expire before auto-refresh runs — read session first, then refresh.
 */
async function getFreshAccessTokenForAdmin(): Promise<string | null> {
  const { data: first } = await supabase.auth.getSession();
  if (!first.session?.refresh_token && !first.session?.access_token) {
    return null;
  }
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) {
      return data.session.access_token;
    }
  } catch {
    /* fall through */
  }
  const { data: again } = await supabase.auth.getSession();
  return again.session?.access_token ?? null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripVariantFromProductName(productName: unknown, variantSpec: unknown): string {
  const name = String(productName || 'Product').replace(/\s+/g, ' ').trim() || 'Product';
  const variant = String(variantSpec || '').replace(/\s+/g, ' ').trim();
  if (!variant) return name;
  const withoutVariant = name.replace(new RegExp(`\\s*(?:[-·–]\\s*)?${escapeRegExp(variant)}\\s*$`, 'i'), '').trim();
  return withoutVariant || name;
}

interface PaymentOrder {
  id: string;
  order_number: string;
  email: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  credits_discount?: number;
  processing_fee?: number;
  affiliate_discount?: number;
  /** Discount / referral code at checkout (e.g. MOM, SIMPLE20). Stored on `orders.affiliate_code`. */
  affiliate_code?: string | null;
  /** Checkout selection: `priority` vs `express_1day` (1-day). */
  shipping_method?: string | null;
  payment_status: string;
  status: string;
  payment_method: string;
  created_at: string;
  shipping_address: any;
  tracking_number?: string | null;
  gateway_transaction_id?: string | null;
  line_items_snapshot?: unknown[] | null;
  customer_history?: CustomerHistoryResult;
  order_items?: Array<{
    id: string;
    product_id: string | null;
    product_name: string;
    variant_spec: string;
    quantity: number;
    price: number;
    image?: string; // Product image URL
    sb26_bogo_applied?: boolean; // B2G1 or BOGO line promo — ship full quantity as ordered
    bundle_option?: string; // Bundle/variant option if stored separately
  }>;
}

interface CustomerHistoryResult {
  repeatCustomer: boolean;
  previousOrderCount: number;
  previousPaidOrderCount: number;
  totalOrderCount: number;
  paidOrderCount: number;
  totalPaidSpend: number;
  previousPaidSpend: number;
  previousOrders?: Array<{
    orderNumber: string;
    total: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }>;
}

interface ReturningClient {
  email: string;
  name?: string;
  orderCount: number;
  paidOrderCount: number;
  totalPaidSpend: number;
  lastOrderAt?: string | null;
}

interface SalesMetricOrder {
  id: string;
  order_number: string;
  email?: string;
  total: number;
  payment_status: string;
  payment_method?: string | null;
  status?: string | null;
  created_at: string;
  shipping_method?: string | null;
  line_items_snapshot?: unknown[] | null;
  order_items?: PaymentOrder['order_items'];
}

type FilterType =
  | 'all'
  | 'venmo'
  | 'zelle'
  | 'cashapp'
  | 'card'
  | 'stripe'
  | 'square'
  | 'crypto'
  | 'linkmoney'
  | 'bankful'
  | 'pending';

type QueueFilterType = 'all' | 'pending-confirmation' | 'ready-to-ship' | 'express-shipping' | 'shipped';
type SalesRangeType = '24h' | '7d' | '30d';
type PaymentPerformanceRangeType = 'daily' | 'weekly' | 'monthly';
type BusinessInsightsTab = 'top-products' | 'profit-margins';

const PAYMENT_ADMIN_CACHE_TTL_MS = 60_000;
const ORDER_RENDER_BATCH_SIZE = 60;
const paymentAdminOrdersCache = new Map<string, { orders: PaymentOrder[]; returningClients: ReturningClient[]; metricsOrders: SalesMetricOrder[]; fetchedAt: number }>();
const RETURNING_CLIENT_EMAIL_SENT_STORAGE_KEY = 'payment-admin-returning-client-email-sent';
const EMAIL_BLAST_SENT_STORAGE_KEY = 'payment-admin-email-blast-sent';

const readReturningClientEmailSent = () => {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = window.localStorage.getItem(RETURNING_CLIENT_EMAIL_SENT_STORAGE_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.filter((value) => typeof value === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

const saveReturningClientEmailSent = (emails: Set<string>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RETURNING_CLIENT_EMAIL_SENT_STORAGE_KEY, JSON.stringify([...emails]));
};

const readEmailBlastSent = () => {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = window.localStorage.getItem(EMAIL_BLAST_SENT_STORAGE_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.filter((value) => typeof value === 'string') : []);
  } catch {
    return new Set<string>();
  }
};

const saveEmailBlastSent = (emails: Set<string>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EMAIL_BLAST_SENT_STORAGE_KEY, JSON.stringify([...emails]));
};

const isPendingPayment = (order: PaymentOrder) =>
  order.payment_status === 'pending_payment' || order.payment_status === 'pending';

const isManualPaymentMethod = (paymentMethod: string) =>
  paymentMethod === 'venmo' ||
  paymentMethod === 'zelle' ||
  paymentMethod === 'cashapp' ||
  paymentMethod === 'square';

const isReadyToShip = (order: PaymentOrder) =>
  order.payment_status === 'paid' && order.status !== 'shipped';

const isShipped = (order: PaymentOrder) => order.status === 'shipped';

const getPaymentMethodLabel = (paymentMethod: string) => {
  if (paymentMethod === 'all') return 'All';
  if (paymentMethod === 'pending') return 'Pending';
  if (paymentMethod === 'card') return 'Card';
  if (paymentMethod === 'bankful') return 'Bankful';
  if (paymentMethod === 'credit_debit_card') return 'Card';
  if (paymentMethod === 'keybilling') return 'KeyBilling';
  if (paymentMethod === 'bankful_hosted') return 'Bankful';
  if (paymentMethod === 'stripe') return 'Apple Pay';
  if (paymentMethod === 'square') return 'Square';
  if (paymentMethod === 'crypto') return 'Crypto';
  if (paymentMethod === 'linkmoney') return 'Link';
  if (paymentMethod === 'venmo') return 'Venmo';
  if (paymentMethod === 'zelle') return 'Zelle';
  if (paymentMethod === 'cashapp') return 'Cash App';
  return paymentMethod || 'Unknown';
};

const getPaymentPillStyle = (paymentMethod: string) => {
  if (paymentMethod === 'venmo') return { background: 'rgba(0,140,255,0.2)', color: '#38bdf8' };
  if (paymentMethod === 'zelle') return { background: 'rgba(109,30,212,0.2)', color: '#a78bfa' };
  if (paymentMethod === 'cashapp') return { background: 'rgba(0,200,83,0.2)', color: '#4ade80' };
  if (paymentMethod === 'bankful_hosted') return { background: 'rgba(56,189,248,0.22)', color: '#38bdf8' };
  if (paymentMethod === 'credit_debit_card' || paymentMethod === 'keybilling' || paymentMethod === 'stripe') {
    return { background: 'rgba(0,85,255,0.2)', color: '#a78bfa' };
  }
  if (paymentMethod === 'square') return { background: 'rgba(139,92,246,0.22)', color: '#c4b5fd' };
  if (paymentMethod === 'crypto') return { background: 'rgba(247,147,26,0.2)', color: '#fbbf24' };
  if (paymentMethod === 'linkmoney') return { background: 'rgba(0,212,170,0.2)', color: '#34d399' };
  return { background: 'rgba(255,255,255,0.1)', color: '#fff' };
};

const getStatusPill = (order: PaymentOrder) => {
  if (isShipped(order)) return { label: 'Shipped', color: '#a78bfa', background: 'rgba(196,181,253,0.14)', border: 'rgba(196,181,253,0.28)' };
  if (order.payment_status === 'paid') return { label: 'Paid', color: '#22c55e', background: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.3)' };
  if (isPendingPayment(order)) return { label: 'Pending', color: '#f59e0b', background: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.3)' };
  return { label: order.status || order.payment_status || 'Review', color: '#f87171', background: 'rgba(248,113,113,0.14)', border: 'rgba(248,113,113,0.3)' };
};

const getCustomerName = (order: PaymentOrder) => {
  const firstName = String(order.shipping_address?.firstName || '').trim();
  const lastName = String(order.shipping_address?.lastName || '').trim();
  return [firstName, lastName].filter(Boolean).join(' ');
};

const getOrderBadges = (order: PaymentOrder) => {
  const badges: Array<{ label: string; color: string; background: string; border: string }> = [];
  if (isPendingPayment(order) && isManualPaymentMethod(order.payment_method)) {
    badges.push({ label: 'Needs confirmation', color: '#fbbf24', background: 'rgba(245,158,11,0.14)', border: 'rgba(251,191,36,0.28)' });
  }
  if (isReadyToShip(order)) {
    badges.push({ label: 'Ready to ship', color: '#86efac', background: 'rgba(34,197,94,0.14)', border: 'rgba(134,239,172,0.28)' });
  }
  if (order.shipping_method === 'express_1day') {
    badges.push({ label: 'Express', color: '#67e8f9', background: 'rgba(6,182,212,0.14)', border: 'rgba(103,232,249,0.28)' });
  }
  if (Number(order.total) >= 250) {
    badges.push({ label: 'High value', color: '#f0abfc', background: 'rgba(217,70,239,0.14)', border: 'rgba(240,171,252,0.28)' });
  }
  return badges;
};

const isSameLocalDate = (dateA: Date, dateB: Date) =>
  dateA.getFullYear() === dateB.getFullYear() &&
  dateA.getMonth() === dateB.getMonth() &&
  dateA.getDate() === dateB.getDate();

const formatHourLabel = (date: Date) =>
  date.toLocaleTimeString([], { hour: 'numeric' });

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString([], { month: 'short', day: 'numeric' });

function formatShippingMethodAdmin(raw: string | null | undefined): string {
  if (raw === 'express_1day') {
    return 'USPS Next-Day Express (1–2 business days by location).';
  }
  if (raw === 'priority') return 'USPS Priority (~2 business days)';
  if (raw && String(raw).trim()) return String(raw);
  return '— (not recorded)';
}

const PaymentAdmin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [queueFilter, setQueueFilter] = useState<QueueFilterType>('all');
  const [salesRange, setSalesRange] = useState<SalesRangeType>('24h');
  const [paymentPerformanceRange, setPaymentPerformanceRange] = useState<PaymentPerformanceRangeType>('monthly');
  const [businessInsightsTab, setBusinessInsightsTab] = useState<BusinessInsightsTab>('top-products');
  const [paymentPerformanceOpen, setPaymentPerformanceOpen] = useState(true);
  const [businessInsightsOpen, setBusinessInsightsOpen] = useState(false);
  const [workQueuesOpen, setWorkQueuesOpen] = useState(true);
  const [salesChartOpen, setSalesChartOpen] = useState(false);
  const [returningClientsOpen, setReturningClientsOpen] = useState(false);
  const [returningClients, setReturningClients] = useState<ReturningClient[]>([]);
  const [salesMetricOrders, setSalesMetricOrders] = useState<SalesMetricOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleOrderLimit, setVisibleOrderLimit] = useState(ORDER_RENDER_BATCH_SIZE);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [sendingReturningClientEmail, setSendingReturningClientEmail] = useState<string | null>(null);
  const [returningClientEmailSent, setReturningClientEmailSent] = useState<Set<string>>(() => readReturningClientEmailSent());
  const [sendingEmailBlast, setSendingEmailBlast] = useState<string | null>(null);
  const [emailBlastSent, setEmailBlastSent] = useState<Set<string>>(() => readEmailBlastSent());
  const [shipping, setShipping] = useState<{ orderNumber: string; trackingNumber: string } | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const isMobile = windowWidth < 768;
  const isSmallMobile = windowWidth < 480;

  const queueSearchUpdate = (value: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearchTerm(value.trim());
    }, 140);
  };

  const runSearchNow = (value: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchTerm(value.trim());
  };

  const clearSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
      searchInputRef.current.focus();
    }
    runSearchNow('');
  };

  // Depend on user id/email primitives only — not `user`. Supabase fires TOKEN_REFRESHED often and
  // AuthContext does setUser(session.user) each time, so the User object reference changes even when
  // the person did not change. That was re-running this effect → fetchOrders → setLoading(true) → list vanished.
  const userId = user?.id;
  const userEmail = user?.email;

  useEffect(() => {
    // Wait for Supabase to hydrate session from storage (mobile is slower; without this we
    // falsely set access denied while user is still null).
    if (authLoading) {
      return;
    }

    if (!userId || !userEmail) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    if (!canAccessPaymentAdmin(userEmail)) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setAccessDenied(false);
    console.log('✅ PaymentAdmin component loaded - Admin access granted');
    void fetchOrders();
  }, [userId, userEmail, filter, authLoading]);

  const fetchOrders = async () => {
    const cacheKey = filter;
    const cached = paymentAdminOrdersCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < PAYMENT_ADMIN_CACHE_TTL_MS) {
      setOrders(cached.orders);
      setReturningClients(cached.returningClients);
      setSalesMetricOrders(cached.metricsOrders);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const token = await getFreshAccessTokenForAdmin();
      if (!token) {
        throw new Error('Sign in again to load orders');
      }

      const apiBase = getApiBase();
      const fetchOpts: RequestInit = {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      };
      let res = await fetch(
        `${apiBase}/api/payment-admin-orders?filter=${encodeURIComponent(filter)}`,
        fetchOpts
      );
      if (res.status === 401) {
        const retryToken = await getFreshAccessTokenForAdmin();
        if (retryToken) {
          res = await fetch(
            `${apiBase}/api/payment-admin-orders?filter=${encodeURIComponent(filter)}`,
            { ...fetchOpts, headers: { ...fetchOpts.headers, Authorization: `Bearer ${retryToken}` } }
          );
        }
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Could not load orders (${res.status})`);
      }

      const mergeSnapshot = (order: PaymentOrder & { line_items_snapshot?: unknown[] | null }) => {
        let items = order.order_items;
        const snap = order.line_items_snapshot;
        if ((!items || items.length === 0) && Array.isArray(snap) && snap.length > 0) {
          items = snap.map((rawRow: unknown, i: number) => {
            const row = rawRow as Record<string, unknown>;
            const img = row.image;
            return {
              id: `snapshot-${order.id}-${i}`,
              order_id: order.id,
              product_id: (row.product_id != null ? String(row.product_id) : '') || null,
              product_name: String(row.product_name || row.name || 'Product').trim() || 'Product',
              variant_spec: String(row.variant_spec || row.variant || '').trim(),
              quantity: Number(row.quantity) || 1,
              price: Number(row.price) || 0,
              sb26_bogo_applied: !!row.sb26_bogo_applied,
              image: typeof img === 'string' ? img : undefined,
            };
          });
        }
        return { ...order, order_items: items || [] };
      };

      const data = ((json.orders || []) as PaymentOrder[]).map(mergeSnapshot);
      const returningClientData = (Array.isArray(json.returningClients) ? json.returningClients : []) as ReturningClient[];
      const metricOrderData = (Array.isArray(json.metricsOrders) ? json.metricsOrders : []) as SalesMetricOrder[];

      // Helper: resolve image for bundles when product_id is null or not in products
      const BASE = 'https://simpletide.com';
      const getBundleImageFromName = (pid: string | null, name: string) => {
        const n = (name || '').toLowerCase();
        const id = (pid || '').toLowerCase();
        if (id === '5-amino-1mq' || n.includes('5-amino-1mq') || n.includes('5 amino 1mq')) {
          return `${BASE}/images/5-amino-1mq-vial-50mg.png`;
        }
        if (id === 'ss-31' || n.includes('ss-31') || n.includes('ss31')) {
          if (n.includes('50mg')) return `${BASE}/images/ss-31-50mg.png`;
          return `${BASE}/images/ss-31-10mg.png`;
        }
        if (id === 'adamax' || n.includes('adamax')) {
          return `${BASE}/images/adamax-10mg.png`;
        }
        if (id === 'ara-290' || n.includes('ara-290') || n.includes('ara290')) {
          return `${BASE}/images/ara-290-10mg.png`;
        }
        if (
          id === 'glp2-tz' ||
          n.includes('glp2-tz') ||
          n.includes('glp2 tz') ||
          n.includes('glp-2 tz')
        ) {
          return `${BASE}/images/GLP2-TZ-20mg-hero.png`;
        }
        if (id === 'trifecta-deluxe' || n.includes('trifecta deluxe')) return `${BASE}/images/trifectadeluxebackground.webp`;
        if (id === 'metabolic-reset' || n.includes('metabolic reset')) return `${BASE}/images/metabolic-reset.png`;
        if (id === 'trifecta' || n.includes('trifecta')) return `${BASE}/images/trifectabackground.webp`;
        if (id === 'shred-plus' || n.includes('shred+') || n.includes('shred plus')) return `${BASE}/images/SHRED+background.webp`;
        if (id === 'peak-pulse' || n.includes('peak pulse')) return `${BASE}/images/peak-pulse.png`;
        if (id === 'neuro-duo' || n.includes('neuro duo')) return `${BASE}/images/neuro-duo-10mg-10mg.png`;
        return null;
      };

      const absolutizeImage = (src: string) =>
        src.startsWith('http') ? src : `${BASE}${src.startsWith('/') ? src : '/' + src}`;

      const productIds = [
        ...new Set(
          data
            .flatMap((order) => order.order_items || [])
            .map((item) => String(item.product_id || '').trim())
            .filter(Boolean)
        ),
      ];
      const imageByProductId = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id,image')
          .in('id', productIds);
        if (!productsError) {
          for (const product of products || []) {
            if (product?.id && product?.image) {
              imageByProductId.set(String(product.id), absolutizeImage(String(product.image)));
            }
          }
        }
      }

      // Fetch product images for order items
      const ordersWithImages = (data || []).map((order: PaymentOrder) => {
        if (order.order_items && order.order_items.length > 0) {
          const itemsWithImages = order.order_items.map((item: any) => {
            let imageUrl = 'https://simpletide.com/images/cards/glp-3-rt.jpg';

            const pname = String(item.product_name || '').trim();

            // 0. Checkout / line_items_snapshot includes per-line image (KeyBilling sends this) — keep it when present
            const snapSrc = typeof item.image === 'string' ? item.image.trim() : '';
            if (snapSrc) {
              imageUrl = absolutizeImage(snapSrc);
            } else {
              // 1. Bundle image from product_id or product_name
              const bundleImg = getBundleImageFromName(item.product_id, pname);
              if (bundleImg) imageUrl = bundleImg;
              // 2. Products table by id, fetched once above for all visible orders
              else if (item.product_id && imageByProductId.has(String(item.product_id))) {
                imageUrl = imageByProductId.get(String(item.product_id))!;
              }
            }

            return {
              ...item,
              image: imageUrl,
              _displayName: stripVariantFromProductName(
                pname || (item.product_id ? String(item.product_id) : ''),
                item.variant_spec
              ),
            };
          });

          return {
            ...order,
            order_items: itemsWithImages
          };
        }
        return order;
      });

      paymentAdminOrdersCache.set(cacheKey, { orders: ordersWithImages, returningClients: returningClientData, metricsOrders: metricOrderData, fetchedAt: Date.now() });
      setOrders(ordersWithImages);
      setReturningClients(returningClientData);
      setSalesMetricOrders(metricOrderData);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setMessage({ type: 'error', text: 'Failed to load orders: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderNumber: string, paymentMethod: string) => {
    try {
      setConfirming(orderNumber);
      setMessage(null);

      // Card, Crypto, LinkMoney: webhook auto-confirms. Square pending can be confirmed manually if webhook missed.
      if (
        paymentMethod === 'credit_debit_card' ||
        paymentMethod === 'keybilling' ||
        paymentMethod === 'bankful_hosted' ||
        paymentMethod === 'stripe' ||
        paymentMethod === 'crypto' ||
        paymentMethod === 'linkmoney'
      ) {
        setMessage({ type: 'error', text: 'This payment method is automatically confirmed. No manual confirmation needed.' });
        setConfirming(null);
        return;
      }

      const apiBase = getApiBase();
      const endpoint =
        paymentMethod === 'venmo'
          ? `${apiBase}/api/confirm-venmo-payment`
          : paymentMethod === 'cashapp'
            ? `${apiBase}/api/confirm-cashapp-payment`
            : paymentMethod === 'zelle'
              ? `${apiBase}/api/confirm-zelle-payment`
              : paymentMethod === 'square'
                ? `${apiBase}/api/confirm-square-payment`
                : null;

      if (!endpoint) {
        setMessage({ type: 'error', text: 'This order is not a manual Venmo, Zelle, Cash App, or Square payment.' });
        setConfirming(null);
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
      });

      const data = await response.json();

      if (data.success) {
        const text = data.message
          ? `✅ ${data.message}`
          : `✅ Payment confirmed for ${orderNumber}! Confirmation email sent. Research points have been added to the customer's account.`;
        setMessage({ type: 'success', text });
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: `❌ Error: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ Failed to confirm payment: ${error.message}` });
    } finally {
      setConfirming(null);
    }
  };

  const resendCardOrderEmail = async (orderNumber: string) => {
    try {
      setResendingEmail(orderNumber);
      setMessage(null);

      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/resend-card-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ Order confirmation email resent for ${orderNumber}!` });
      } else {
        setMessage({ type: 'error', text: `❌ Error: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ Failed to resend email: ${error.message}` });
    } finally {
      setResendingEmail(null);
    }
  };

  const sendReturningClientEmail = async (client: ReturningClient) => {
    try {
      setSendingReturningClientEmail(client.email);
      setMessage(null);

      const token = await getFreshAccessTokenForAdmin();
      if (!token) {
        throw new Error('Sign in again to send this email');
      }

      const apiBase = getApiBase();
      const firstName = String(client.name || '').trim().split(/\s+/)[0] || '';
      const response = await fetch(`${apiBase}/api/send-returning-client-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: client.email, firstName }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not send returning client email');
      }

      setReturningClientEmailSent((previous) => {
        const next = new Set(previous);
        next.add(client.email);
        saveReturningClientEmailSent(next);
        return next;
      });
      setMessage({ type: 'success', text: `Returning client email sent to ${client.email}.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to send returning client email: ${error.message}` });
    } finally {
      setSendingReturningClientEmail(null);
    }
  };

  const sendEmailBlast = async (client: Pick<ReturningClient, 'email' | 'name'>) => {
    try {
      setSendingEmailBlast(client.email);
      setMessage(null);

      const token = await getFreshAccessTokenForAdmin();
      if (!token) {
        throw new Error('Sign in again to send this email');
      }

      const apiBase = getApiBase();
      const firstName = String(client.name || '').trim().split(/\s+/)[0] || '';
      const response = await fetch(`${apiBase}/api/send-email-blast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: client.email, firstName }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Could not send email blast');
      }

      setEmailBlastSent((previous) => {
        const next = new Set(previous);
        next.add(client.email);
        saveEmailBlastSent(next);
        return next;
      });
      setMessage({ type: 'success', text: `Email blast sent to ${client.email}.` });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Failed to send email blast: ${error.message}` });
    } finally {
      setSendingEmailBlast(null);
    }
  };

  const markAsShipped = async (orderNumber: string, trackingNumber: string) => {
    try {
      setMessage(null);

      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/mark-order-shipped`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber, trackingNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `✅ Order ${orderNumber} marked as shipped! Shipping email sent.` });
        setShipping(null);
        setTimeout(() => {
          fetchOrders();
        }, 1000);
      } else {
        setMessage({ type: 'error', text: `❌ Error: ${data.error || 'Unknown error'}` });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ Failed to mark as shipped: ${error.message}` });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    const parts = [
      `${address.firstName} ${address.lastName}`,
      address.street,
      address.apartment,
      `${address.city}, ${address.state} ${address.zipCode}`,
      address.phone,
      address.email
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatShippingAddress = (address: any) => {
    if (!address) return 'N/A';
    const parts = [
      `${address.firstName} ${address.lastName}`,
      address.street,
      address.apartment,
      `${address.city}, ${address.state} ${address.zipCode}`,
      address.phone
    ].filter(Boolean);
    return parts.join(', ');
  };

  const getBillingAddress = (order: PaymentOrder) => {
    // Check if billing_address is stored separately in shipping_address JSON
    if (order.shipping_address?.billing_address) {
      return order.shipping_address.billing_address;
    }
    // Fallback to shipping address (they're the same in current form)
    return order.shipping_address;
  };

  const toggleOrderDetails = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const now = new Date();
  const salesSourceOrders = salesMetricOrders.length > 0 ? salesMetricOrders : orders;
  const paidSalesSourceOrders = salesSourceOrders.filter(order => order.payment_status === 'paid');
  const todaysPaidOrders = paidSalesSourceOrders.filter(order => isSameLocalDate(new Date(order.created_at), now));
  const pendingConfirmationCount = orders.filter(order => isPendingPayment(order) && isManualPaymentMethod(order.payment_method)).length;
  const readyToShipCount = orders.filter(isReadyToShip).length;
  const expressShippingCount = orders.filter(order => order.shipping_method === 'express_1day' && !isShipped(order)).length;
  const todaySales = todaysPaidOrders
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const todayAverageOrder = todaySales / Math.max(1, todaysPaidOrders.length);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const last7DaysPaidOrders = paidSalesSourceOrders.filter(order => new Date(order.created_at) >= sevenDaysAgo);
  const last30DaysPaidOrders = paidSalesSourceOrders.filter(order => new Date(order.created_at) >= thirtyDaysAgo);
  const last7DaysRevenue = last7DaysPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const last30DaysRevenue = last30DaysPaidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const paymentPerformanceRangeOptions: Array<{ id: PaymentPerformanceRangeType; label: string }> = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];
  const paymentPerformanceOrders =
    paymentPerformanceRange === 'daily'
      ? todaysPaidOrders
      : paymentPerformanceRange === 'weekly'
        ? last7DaysPaidOrders
        : last30DaysPaidOrders;
  const paymentPerformanceLabel =
    paymentPerformanceRange === 'daily'
      ? 'Today'
      : paymentPerformanceRange === 'weekly'
        ? 'Last 7 Days'
        : 'Last 30 Days';
  const paymentPerformanceTotal = paymentPerformanceOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const salesRangeOptions: Array<{ id: SalesRangeType; label: string }> = [
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
  ];
  const salesBuckets = (() => {
    if (salesRange === '24h') {
      const currentHour = new Date(now);
      currentHour.setMinutes(0, 0, 0);
      return Array.from({ length: 24 }, (_, index) => {
        const start = new Date(currentHour);
        start.setHours(currentHour.getHours() - (23 - index));
        const end = new Date(start);
        end.setHours(start.getHours() + 1);
        const ordersInBucket = paidSalesSourceOrders.filter((order) => {
          const createdAt = new Date(order.created_at);
          return createdAt >= start && createdAt < end;
        });
        const revenue = ordersInBucket.reduce((sum, order) => sum + Number(order.total || 0), 0);
        return {
          label: formatHourLabel(start),
          revenue,
          count: ordersInBucket.length,
          isCurrent: index === 23,
        };
      });
    }

    const days = salesRange === '7d' ? 7 : 30;
    const currentDay = new Date(now);
    currentDay.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, index) => {
      const start = new Date(currentDay);
      start.setDate(currentDay.getDate() - (days - 1 - index));
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      const ordersInBucket = paidSalesSourceOrders.filter((order) => {
        const createdAt = new Date(order.created_at);
        return createdAt >= start && createdAt < end;
      });
      const revenue = ordersInBucket.reduce((sum, order) => sum + Number(order.total || 0), 0);
      return {
        label: formatDayLabel(start),
        revenue,
        count: ordersInBucket.length,
        isCurrent: index === days - 1,
      };
    });
  })();
  const salesRangeLabel = salesRange === '24h' ? 'Last 24 Hours' : salesRange === '7d' ? 'Last 7 Days' : 'Last 30 Days';
  const salesAverageLabel = salesRange === '24h' ? 'Hourly Avg' : 'Daily Avg';
  const salesBestLabel = salesRange === '24h' ? 'Best Hour' : 'Best Day';
  const salesRangeRevenue = salesBuckets.reduce((sum, bucket) => sum + bucket.revenue, 0);
  const salesRangeOrderCount = salesBuckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const salesRangeAverage = salesRangeRevenue / Math.max(1, salesBuckets.length);
  const bestSalesBucket = salesBuckets.reduce((best, bucket) => (bucket.revenue > best.revenue ? bucket : best), salesBuckets[0]);
  const maxSalesBucketRevenue = Math.max(1, ...salesBuckets.map(bucket => bucket.revenue));
  const summaryCards = [
    { label: 'Today Revenue', value: `$${todaySales.toFixed(2)}`, sub: `${todaysPaidOrders.length} paid orders`, color: '#e5e7eb' },
    { label: 'Orders Today', value: todaysPaidOrders.length, sub: 'Paid orders', color: '#ddd6fe' },
    { label: 'Avg Order', value: `$${todayAverageOrder.toFixed(2)}`, sub: 'Today AOV', color: '#c4b5fd' },
    { label: 'Ready To Ship', value: readyToShipCount, sub: 'Paid and unshipped', color: '#86efac' },
    { label: 'Pending Payments', value: pendingConfirmationCount, sub: 'Needs confirmation', color: '#fbbf24' },
    { label: 'Express Shipping', value: expressShippingCount, sub: 'Open express orders', color: '#67e8f9' },
  ];
  const paymentMethodGroups: Array<{
    label: string;
    methods: string[];
    color: string;
    note: string;
  }> = [
    { label: 'Zelle', methods: ['zelle'], color: '#a78bfa', note: 'Bank transfer' },
    { label: 'Venmo', methods: ['venmo'], color: '#38bdf8', note: 'P2P payments' },
    { label: 'KeyBilling / Card', methods: ['keybilling', 'credit_debit_card', 'card', 'bankful_hosted', 'bankful'], color: '#a78bfa', note: 'Card checkout' },
  ];
  const paymentMethodPerformance = paymentMethodGroups.map((group) => {
    const groupOrders = paymentPerformanceOrders.filter(order => group.methods.includes(order.payment_method || ''));
    const revenue = groupOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const average = revenue / Math.max(1, groupOrders.length);
    return { ...group, revenue, count: groupOrders.length, average };
  });
  const getInsightLineItems = (order: SalesMetricOrder | PaymentOrder) => {
    const directItems = Array.isArray(order.order_items) ? order.order_items : [];
    if (directItems.length > 0) {
      return directItems.map((item: any) => ({
        productId: String(item.product_id || '').trim(),
        productName: String(item.product_name || item.name || 'Product').trim() || 'Product',
        variantSpec: String(item.variant_spec || item.variant || '').trim(),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }));
    }

    const snapshot = Array.isArray(order.line_items_snapshot) ? order.line_items_snapshot : [];
    return snapshot.map((rawRow: unknown) => {
      const row = rawRow as Record<string, unknown>;
      return {
        productId: String(row.product_id || '').trim(),
        productName: String(row.product_name || row.name || 'Product').trim() || 'Product',
        variantSpec: String(row.variant_spec || row.variant || '').trim(),
        quantity: Number(row.quantity) || 1,
        price: Number(row.price) || 0,
      };
    });
  };
  const detailedPaidOrders = orders.filter(order => order.payment_status === 'paid');
  const detailedPaymentPerformanceOrders =
    paymentPerformanceRange === 'daily'
      ? detailedPaidOrders.filter(order => isSameLocalDate(new Date(order.created_at), now))
      : paymentPerformanceRange === 'weekly'
        ? detailedPaidOrders.filter(order => new Date(order.created_at) >= sevenDaysAgo)
        : detailedPaidOrders.filter(order => new Date(order.created_at) >= thirtyDaysAgo);
  const paymentPerformanceHasDetail = paymentPerformanceOrders.some(order => getInsightLineItems(order).length > 0);
  const businessInsightOrders = paymentPerformanceHasDetail ? paymentPerformanceOrders : detailedPaymentPerformanceOrders;
  const topProducts = Array.from(
    businessInsightOrders.reduce((acc, order) => {
      for (const item of getInsightLineItems(order)) {
        const key = item.productId || item.productName.toLowerCase();
        const existing = acc.get(key) || {
          name: item.productName,
          quantity: 0,
          revenue: 0,
          orders: new Set<string>(),
        };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
        existing.orders.add(order.id);
        acc.set(key, existing);
      }
      return acc;
    }, new Map<string, { name: string; quantity: number; revenue: number; orders: Set<string> }>())
  )
    .map(([key, value]) => ({ key, ...value, orderCount: value.orders.size }))
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 6);
  const isBacWaterLineItem = (item: ReturnType<typeof getInsightLineItems>[number]) => {
    const text = `${item.productId} ${item.productName} ${item.variantSpec}`.toLowerCase();
    return text.includes('bac-water') || text.includes('bac water') || text.includes('bacteriostatic water') || text.includes('ebac');
  };
  const isBacWaterOnlyOrder = (order: SalesMetricOrder | PaymentOrder) => {
    const items = getInsightLineItems(order);
    return items.length > 0 && items.every(isBacWaterLineItem);
  };
  const paymentFeeRateForOrder = (order: SalesMetricOrder | PaymentOrder) => {
    const method = String(order.payment_method || '').toLowerCase();
    if (method === 'venmo' || method === 'zelle') return 0.05;
    if (['keybilling', 'credit_debit_card', 'card', 'bankful_hosted', 'bankful'].includes(method)) return 0.10;
    return 0;
  };
  const mainPaymentMethodSet = new Set(paymentMethodGroups.flatMap(group => group.methods));
  const profitSourceOrders = businessInsightOrders.filter(order => mainPaymentMethodSet.has(order.payment_method || ''));
  const profitRows = profitSourceOrders.map((order) => {
    const gross = Number(order.total || 0);
    const paymentFees = gross * paymentFeeRateForOrder(order);
    const shippingReserve = isBacWaterOnlyOrder(order) ? 0 : 12;
    const estimatedProfit = gross - paymentFees - shippingReserve;
    return { order, gross, paymentFees, shippingReserve, estimatedProfit };
  });
  const profitGross = profitRows.reduce((sum, row) => sum + row.gross, 0);
  const profitPaymentFees = profitRows.reduce((sum, row) => sum + row.paymentFees, 0);
  const profitShippingReserve = profitRows.reduce((sum, row) => sum + row.shippingReserve, 0);
  const estimatedProfit = profitRows.reduce((sum, row) => sum + row.estimatedProfit, 0);
  const estimatedProfitMargin = profitGross > 0 ? (estimatedProfit / profitGross) * 100 : 0;
  const profitBreakdown = paymentMethodGroups.map((group) => {
    const groupRows = profitRows.filter(row => group.methods.includes(row.order.payment_method || ''));
    const gross = groupRows.reduce((sum, row) => sum + row.gross, 0);
    const net = groupRows.reduce((sum, row) => sum + row.estimatedProfit, 0);
    return {
      label: group.label,
      color: group.color,
      count: groupRows.length,
      gross,
      net,
      margin: gross > 0 ? (net / gross) * 100 : 0,
    };
  });
  const queueOptions: Array<{ id: QueueFilterType; label: string; count: number; description: string }> = [
    { id: 'all', label: 'All Orders', count: orders.length, description: 'Every loaded order' },
    { id: 'pending-confirmation', label: 'Needs Payment', count: pendingConfirmationCount, description: 'Manual payments waiting' },
    { id: 'ready-to-ship', label: 'Ready To Ship', count: readyToShipCount, description: 'Paid and unshipped' },
    { id: 'express-shipping', label: 'Express Shipping', count: expressShippingCount, description: 'Open express orders' },
    { id: 'shipped', label: 'Shipped', count: orders.filter(isShipped).length, description: 'Completed orders' },
  ];

  const orderSearchIndex = useMemo(() => {
    const index = new Map<string, string>();
    for (const order of orders) {
      const methodLabel =
        order.payment_method === 'venmo'
          ? 'venmo'
          : order.payment_method === 'zelle'
            ? 'zelle'
            : order.payment_method === 'cashapp'
              ? 'cashapp cash app'
              : order.payment_method === 'bankful_hosted'
                ? 'bankful bankful_hosted'
                : order.payment_method === 'square'
                  ? 'square'
                  : order.payment_method || '';
      const shipSearch =
        order.shipping_method === 'express_1day'
          ? 'express next-day next day 1-day 1day usps'
          : order.shipping_method === 'priority'
            ? 'priority 2-day usps'
            : '';
      const itemSearch = (order.order_items || [])
        .map((item: any) => `${item.product_name || ''} ${item.variant_spec || ''} ${item.product_id || ''}`)
        .join(' ');
      index.set(
        order.id,
        [
          order.order_number,
          order.email,
          methodLabel,
          shipSearch,
          order.affiliate_code,
          order.shipping_address?.firstName,
          order.shipping_address?.lastName,
          itemSearch,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
      );
    }
    return index;
  }, [orders]);

  // Filter orders by search term and work queue.
  const filteredOrders = useMemo(() => orders.filter(order => {
    if (queueFilter === 'pending-confirmation' && !(isPendingPayment(order) && isManualPaymentMethod(order.payment_method))) return false;
    if (queueFilter === 'ready-to-ship' && !isReadyToShip(order)) return false;
    if (queueFilter === 'express-shipping' && !(order.shipping_method === 'express_1day' && !isShipped(order))) return false;
    if (queueFilter === 'shipped' && !isShipped(order)) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (orderSearchIndex.get(order.id) || '').includes(search);
  }), [orders, orderSearchIndex, queueFilter, searchTerm]);
  const visibleOrders = useMemo(
    () => filteredOrders.slice(0, visibleOrderLimit),
    [filteredOrders, visibleOrderLimit]
  );
  const hasMoreOrders = visibleOrders.length < filteredOrders.length;

  useEffect(() => {
    setVisibleOrderLimit(ORDER_RENDER_BATCH_SIZE);
  }, [filter, queueFilter, searchTerm, orders.length]);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#020617',
          color: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontSize: '16px',
        }}
      >
        Loading session…
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#0B0E14', 
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
      }}>
        <div style={{ 
          textAlign: 'center',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '40px',
          maxWidth: '500px'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 900, 
            color: '#ef4444',
            marginBottom: '20px'
          }}>
            Access Denied
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px' }}>
            You do not have permission to access this page.
          </p>
          {user && (
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginTop: '10px' }}>
              Logged in as: {user.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      color: '#FFFFFF',
      padding: isMobile ? '16px 10px 24px' : '32px 24px',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '18px' : '28px' }}>
          <h1 style={{ 
            fontSize: isMobile ? '22px' : '28px', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            marginBottom: '6px',
            color: '#FFFFFF'
          }}>
            Payment Admin
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: isMobile ? '12px' : '14px', lineHeight: 1.5 }}>
            {isMobile ? 'Quick payment, outreach, and shipping controls.' : 'Venmo · Zelle · Cash App · Card · Bankful · Apple Pay · Square · Crypto · LinkMoney'}
          </p>
        </div>

        {/* Operations Overview */}
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '6px',
          marginBottom: '10px',
        }}>
          <div>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 900, letterSpacing: '-0.01em' }}>
              Operations Overview
            </div>
            <div style={{ marginTop: '3px', color: 'rgba(226,232,240,0.54)', fontSize: '12px' }}>
              Today&apos;s money, order volume, and fulfillment pressure at a glance.
            </div>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))',
          gap: isMobile ? '8px' : '10px',
          marginBottom: '16px',
        }}>
          {summaryCards.map((card) => (
            <div
              key={card.label}
              style={{
                padding: isMobile ? '11px 12px' : '13px 14px',
                borderRadius: '10px',
                background: 'rgba(15,23,42,0.72)',
                border: '1px solid rgba(148, 163, 184, 0.14)',
              }}
            >
              <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.58)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>
                {card.label}
              </div>
              <div style={{ fontSize: isMobile ? '18px' : '22px', color: card.color, fontWeight: 800, letterSpacing: '-0.03em' }}>
                {card.value}
              </div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(226,232,240,0.48)' }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Method Performance */}
        <div style={{
          marginBottom: '18px',
          padding: isMobile ? '14px' : '18px',
          borderRadius: '12px',
          background: 'rgba(15,23,42,0.64)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
        }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setPaymentPerformanceOpen(!paymentPerformanceOpen)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setPaymentPerformanceOpen(!paymentPerformanceOpen);
              }
            }}
            style={{
              width: '100%',
              padding: 0,
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '8px',
            marginBottom: paymentPerformanceOpen ? '14px' : 0,
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Payment Performance · {paymentPerformanceLabel}
              </div>
              <div style={{ marginTop: '4px', color: 'rgba(226,232,240,0.58)', fontSize: '12px' }}>
                Revenue and order count for the main payment methods: Zelle, Venmo, and KeyBilling.
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: isMobile ? 'flex-start' : 'flex-end',
              gap: '6px',
            }}>
              <span style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(226,232,240,0.78)',
                fontSize: '12px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}>
                {paymentPerformanceOpen ? 'Collapse' : 'Expand'}
              </span>
              {paymentPerformanceRangeOptions.map((option) => {
                const active = paymentPerformanceRange === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPaymentPerformanceRange(option.id);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: active ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.045)',
                      border: `1px solid ${active ? 'rgba(196,181,253,0.55)' : 'rgba(255,255,255,0.1)'}`,
                      color: active ? '#fff' : 'rgba(226,232,240,0.78)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
              <span style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(196,181,253,0.22)',
                color: '#ddd6fe',
                fontSize: '12px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}>
                ${paymentPerformanceTotal.toFixed(2)} total
              </span>
            </div>
          </div>
          </div>

          {paymentPerformanceOpen && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
            gap: '8px',
          }}>
            {paymentMethodPerformance.map((method) => (
              <div
                key={method.label}
                style={{
                  padding: isMobile ? '11px 12px' : '12px 13px',
                  borderRadius: '11px',
                  background: 'rgba(2,6,23,0.34)',
                  border: '1px solid rgba(255,255,255,0.09)',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '7px',
                }}>
                  <div style={{ color: method.color, fontSize: '12px', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {method.label}
                  </div>
                  <div style={{ color: 'rgba(226,232,240,0.48)', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {method.count} order{method.count === 1 ? '' : 's'}
                  </div>
                </div>
                <div style={{ color: '#fff', fontSize: isMobile ? '18px' : '21px', fontWeight: 900, letterSpacing: '-0.035em' }}>
                  ${method.revenue.toFixed(2)}
                </div>
                <div style={{ marginTop: '5px', color: 'rgba(226,232,240,0.5)', fontSize: '11px', lineHeight: 1.35 }}>
                  {method.note} · Avg ${method.average.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Business Insights */}
        <div style={{
          marginBottom: '18px',
          padding: isMobile ? '14px' : '18px',
          borderRadius: '12px',
          background: 'rgba(15,23,42,0.64)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
        }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setBusinessInsightsOpen(!businessInsightsOpen)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setBusinessInsightsOpen(!businessInsightsOpen);
              }
            }}
            style={{
              width: '100%',
              padding: 0,
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
          <div style={{
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '10px',
            marginBottom: businessInsightsOpen ? '14px' : 0,
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Business Insights · {paymentPerformanceLabel}
              </div>
              <div style={{ marginTop: '4px', color: 'rgba(226,232,240,0.58)', fontSize: '12px' }}>
                Top products and estimated profit using the selected daily, weekly, or monthly range.
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{
                padding: '7px 11px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.045)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(226,232,240,0.78)',
                fontSize: '12px',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}>
                {businessInsightsOpen ? 'Collapse' : 'Expand'}
              </span>
              {([
                { id: 'top-products', label: 'Top Products' },
                { id: 'profit-margins', label: 'Profit Margins' },
              ] as Array<{ id: BusinessInsightsTab; label: string }>).map((tab) => {
                const active = businessInsightsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      setBusinessInsightsTab(tab.id);
                      setBusinessInsightsOpen(true);
                    }}
                    style={{
                      padding: '7px 11px',
                      borderRadius: '999px',
                      background: active ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.045)',
                      border: `1px solid ${active ? 'rgba(196,181,253,0.55)' : 'rgba(255,255,255,0.1)'}`,
                      color: active ? '#fff' : 'rgba(226,232,240,0.78)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          {businessInsightsOpen && (businessInsightsTab === 'top-products' ? (
            topProducts.length === 0 ? (
              <div style={{
                padding: '18px 14px',
                borderRadius: '10px',
                background: 'rgba(2,6,23,0.28)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(226,232,240,0.62)',
                fontSize: '13px',
              }}>
                No product line items found for this range yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topProducts.map((product, index) => (
                  <div
                    key={product.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '34px minmax(0, 1fr)' : '42px minmax(0, 1fr) 90px 120px 110px',
                      gap: isMobile ? '8px' : '12px',
                      alignItems: 'center',
                      padding: isMobile ? '11px 12px' : '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(2,6,23,0.32)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '999px',
                      background: index === 0 ? 'rgba(251,191,36,0.18)' : 'rgba(196,181,253,0.13)',
                      border: `1px solid ${index === 0 ? 'rgba(251,191,36,0.32)' : 'rgba(196,181,253,0.22)'}`,
                      color: index === 0 ? '#fde68a' : '#ddd6fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 950,
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: '13px', fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {product.name}
                      </div>
                      <div style={{ marginTop: '3px', color: 'rgba(226,232,240,0.48)', fontSize: '11px' }}>
                        {product.orderCount} order{product.orderCount === 1 ? '' : 's'} in range
                      </div>
                    </div>
                    {!isMobile && (
                      <>
                        <div style={{ color: '#ddd6fe', fontSize: '13px', fontWeight: 850 }}>
                          {product.quantity} sold
                        </div>
                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 850 }}>
                          ${product.revenue.toFixed(2)}
                        </div>
                        <div style={{ color: 'rgba(226,232,240,0.52)', fontSize: '12px', fontWeight: 750 }}>
                          Avg ${(product.revenue / Math.max(1, product.quantity)).toFixed(2)}
                        </div>
                      </>
                    )}
                    {isMobile && (
                      <div style={{ gridColumn: '2 / -1', color: 'rgba(226,232,240,0.62)', fontSize: '12px', fontWeight: 750 }}>
                        {product.quantity} sold · ${product.revenue.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
                gap: '8px',
              }}>
                {[
                  { label: 'Gross Sales', value: `$${profitGross.toFixed(2)}`, sub: `${profitRows.length} main-method orders`, color: '#e5e7eb' },
                  { label: 'Payment Fees', value: `-$${profitPaymentFees.toFixed(2)}`, sub: '10% card, 5% Venmo/Zelle', color: '#fca5a5' },
                  { label: 'Shipping Reserve', value: `-$${profitShippingReserve.toFixed(2)}`, sub: '$12 except BAC-only', color: '#fde68a' },
                  { label: 'Estimated Profit', value: `$${estimatedProfit.toFixed(2)}`, sub: 'After fees + shipping', color: '#86efac' },
                  { label: 'Est. Margin', value: `${estimatedProfitMargin.toFixed(1)}%`, sub: 'Net / gross', color: '#67e8f9' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '10px',
                      background: 'rgba(2,6,23,0.32)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ color: 'rgba(226,232,240,0.5)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {stat.label}
                    </div>
                    <div style={{ marginTop: '5px', color: stat.color, fontSize: isMobile ? '17px' : '20px', fontWeight: 950, letterSpacing: '-0.04em' }}>
                      {stat.value}
                    </div>
                    <div style={{ marginTop: '3px', color: 'rgba(226,232,240,0.46)', fontSize: '11px', lineHeight: 1.3 }}>
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                gap: '8px',
              }}>
                {profitBreakdown.map((method) => (
                  <div
                    key={method.label}
                    style={{
                      padding: '11px 12px',
                      borderRadius: '10px',
                      background: 'rgba(2,6,23,0.28)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <div style={{ color: method.color, fontSize: '12px', fontWeight: 900 }}>
                        {method.label}
                      </div>
                      <div style={{ color: 'rgba(226,232,240,0.48)', fontSize: '11px', fontWeight: 850 }}>
                        {method.count} order{method.count === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div style={{ marginTop: '7px', color: '#fff', fontSize: '18px', fontWeight: 950, letterSpacing: '-0.035em' }}>
                      ${method.net.toFixed(2)}
                    </div>
                    <div style={{ marginTop: '4px', color: 'rgba(226,232,240,0.5)', fontSize: '11px' }}>
                      ${method.gross.toFixed(2)} gross · {method.margin.toFixed(1)}% margin
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ color: 'rgba(226,232,240,0.48)', fontSize: '11px', lineHeight: 1.45 }}>
                Estimate only: subtracts payment processing fees and a $12 shipping reserve. It does not subtract product cost, packaging, refunds, or chargebacks.
              </div>
            </div>
          )
          )}
        </div>

        {/* Sales Performance */}
        <div style={{
          marginBottom: '14px',
          padding: isMobile ? '14px' : '16px',
          borderRadius: '12px',
          background: 'rgba(15,23,42,0.64)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Accurate Sales Performance · {salesRangeLabel}
              </div>
              <div style={{ marginTop: '4px', color: 'rgba(226,232,240,0.58)', fontSize: '12px' }}>
                Based on all paid orders from the last 30 days, not just the selected payment filter.
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
                {salesRangeOptions.map((option) => {
                  const active = salesRange === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSalesRange(option.id)}
                      style={{
                        padding: '7px 11px',
                        borderRadius: '999px',
                        background: active ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.045)',
                        border: `1px solid ${active ? 'rgba(196,181,253,0.55)' : 'rgba(255,255,255,0.1)'}`,
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => setSalesChartOpen(!salesChartOpen)}
                  style={{
                    padding: '7px 11px',
                    borderRadius: '999px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(226,232,240,0.78)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {salesChartOpen ? 'Hide chart' : 'Show chart'}
                </button>
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, auto)',
              gap: '8px',
            }}>
              {[
                { label: salesRangeLabel, value: `$${salesRangeRevenue.toFixed(2)}` },
                { label: salesAverageLabel, value: `$${salesRangeAverage.toFixed(2)}` },
                { label: salesBestLabel, value: `${bestSalesBucket.label} · $${bestSalesBucket.revenue.toFixed(2)}` },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: '9px 11px',
                    borderRadius: '10px',
                    background: 'rgba(2,6,23,0.34)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  <div style={{ color: 'rgba(226,232,240,0.52)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {stat.label}
                  </div>
                  <div style={{ marginTop: '4px', color: '#e5e7eb', fontSize: '13px', fontWeight: 800, whiteSpace: isMobile ? 'normal' : 'nowrap' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {salesChartOpen && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${salesBuckets.length}, minmax(${salesRange === '30d' ? '34px' : '44px'}, 1fr))`,
            gap: '6px',
            alignItems: 'end',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            {salesBuckets.map((bucket, index) => (
              <div key={`${bucket.label}-${index}`} style={{ minWidth: salesRange === '30d' ? '34px' : '44px' }}>
                <div style={{
                  height: '92px',
                  display: 'flex',
                  alignItems: 'end',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.035)',
                  border: bucket.isCurrent ? '1px solid rgba(196,181,253,0.55)' : '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}>
                  <div
                    title={`${bucket.label}: $${bucket.revenue.toFixed(2)} from ${bucket.count} order${bucket.count === 1 ? '' : 's'}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(6, (bucket.revenue / maxSalesBucketRevenue) * 100)}%`,
                      background: bucket.revenue > 0
                        ? 'rgba(196,181,253,0.82)'
                        : 'rgba(148,163,184,0.12)',
                      borderRadius: '8px 8px 0 0',
                      transition: 'height 0.2s ease',
                    }}
                  />
                </div>
                <div style={{ marginTop: '6px', color: bucket.isCurrent ? '#93c5fd' : 'rgba(226,232,240,0.58)', fontSize: '10px', fontWeight: 800, textAlign: 'center' }}>
                  {bucket.label}
                </div>
                <div style={{ marginTop: '2px', color: '#fff', fontSize: '10px', fontWeight: 800, textAlign: 'center' }}>
                  ${Math.round(bucket.revenue)}
                </div>
              </div>
            ))}
          </div>
          )}
          <div style={{ marginTop: '10px', color: 'rgba(226,232,240,0.52)', fontSize: '12px' }}>
            {salesRangeOrderCount} paid order{salesRangeOrderCount === 1 ? '' : 's'} in {salesRangeLabel.toLowerCase()}.
          </div>
        </div>

        {/* Work Queues */}
        <div style={{
          marginBottom: '18px',
          padding: isMobile ? '12px' : '16px',
          borderRadius: '12px',
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
        }}>
          <button
            onClick={() => setWorkQueuesOpen(!workQueuesOpen)}
            style={{
              width: '100%',
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '6px',
            marginBottom: workQueuesOpen ? '13px' : 0,
          }}>
            <div>
              <div style={{ color: '#fff', fontSize: '13px', fontWeight: 800 }}>
                Work Queues
              </div>
              <div style={{ marginTop: '3px', color: 'rgba(226,232,240,0.56)', fontSize: '12px' }}>
                Jump straight to payment checks, shipping work, express orders, or completed orders.
              </div>
            </div>
            <span style={{
              padding: '7px 11px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(226,232,240,0.78)',
              fontSize: '12px',
              fontWeight: 800,
              whiteSpace: 'nowrap',
            }}>
              {workQueuesOpen ? 'Collapse' : 'Expand'}
            </span>
          </div>
          </button>
          {workQueuesOpen && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, 1fr))',
            gap: isMobile ? '8px' : '9px',
          }}>
            {queueOptions.map((queue) => {
              const active = queueFilter === queue.id;
              return (
                <button
                  key={queue.id}
                  onClick={() => setQueueFilter(queue.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '7px',
                    padding: isMobile ? '10px 11px' : '11px 12px',
                    borderRadius: '11px',
                    background: active ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.045)',
                    border: `1px solid ${active ? 'rgba(196,181,253,0.55)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: 0,
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', width: '100%', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{queue.label}</span>
                    <span style={{
                      minWidth: '24px',
                      textAlign: 'center',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: active ? 'rgba(196,181,253,0.35)' : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 900,
                    }}>
                      {queue.count}
                    </span>
                  </span>
                  <span style={{ color: 'rgba(226,232,240,0.5)', fontSize: '11px', lineHeight: 1.3 }}>
                    {queue.description}
                  </span>
                </button>
              );
            })}
          </div>
          )}
        </div>

        {/* Filters and Search - Sticky toolbar */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '8px' : '12px', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          padding: isMobile ? '8px' : '10px',
          marginLeft: isMobile ? '-4px' : '-12px',
          marginRight: isMobile ? '-4px' : '-12px',
          background: 'rgba(2,6,23,0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: '10px',
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            flexWrap: isMobile ? 'nowrap' : 'wrap',
            flex: isMobile ? '1 1 100%' : '1',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '2px' : 0,
          }}>
            {(['all', 'venmo', 'zelle', 'cashapp', 'card', 'bankful', 'stripe', 'square', 'crypto', 'linkmoney', 'pending'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: isMobile ? '8px 11px' : '8px 14px',
                  background: filter === f ? 'rgba(167,139,250,0.22)' : 'rgba(255, 255, 255, 0.045)',
                  color: filter === f ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                  border: `1px solid ${filter === f ? 'rgba(196,181,253,0.55)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {f === 'card'
                  ? 'Card'
                  : f === 'bankful'
                    ? 'Bankful'
                    : f === 'stripe'
                      ? 'Apple Pay'
                      : f === 'square'
                        ? 'Square'
                        : f === 'crypto'
                          ? 'Crypto'
                          : f === 'linkmoney'
                            ? 'Link'
                            : f === 'cashapp'
                              ? 'Cash App'
                              : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{
            flex: isMobile ? '1 1 100%' : '1 1 260px',
            minWidth: isMobile ? 0 : '260px',
            width: isMobile ? '100%' : 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '8px 9px' : '8px 10px',
            background: 'rgba(15,23,42,0.88)',
            border: `1px solid ${searchTerm ? 'rgba(196,181,253,0.55)' : 'rgba(255, 255, 255, 0.12)'}`,
            borderRadius: '12px',
            boxShadow: searchTerm ? '0 0 0 1px rgba(196,181,253,0.14)' : 'none',
          }}>
            <span style={{
              width: '26px',
              height: '26px',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'rgba(167,139,250,0.14)',
              color: '#ddd6fe',
              fontSize: '13px',
              fontWeight: 900,
            }}>
              S
            </span>
            <input
              ref={searchInputRef}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              placeholder={isMobile ? 'Search name, order #, email...' : 'Search name, order #, email, code, product, payment...'}
              defaultValue={searchTerm}
              onChange={(e) => queueSearchUpdate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  runSearchNow(e.currentTarget.value);
                  e.currentTarget.blur();
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '5px 0',
                background: 'transparent',
                color: '#fff',
                border: 'none',
                outline: 'none',
                fontSize: isMobile ? '16px' : '14px',
                lineHeight: 1.35,
              }}
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                style={{
                  padding: '6px 9px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(226,232,240,0.86)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Returning Clients */}
        <div style={{
          marginTop: isMobile ? '18px' : '6px',
          marginBottom: '14px',
          borderRadius: '12px',
          background: 'rgba(15,23,42,0.56)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setReturningClientsOpen(!returningClientsOpen)}
            style={{
              width: '100%',
              padding: isMobile ? '13px 14px' : '14px 16px',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800 }}>
                Returning / Past Clients
              </div>
              <div style={{ marginTop: '3px', color: 'rgba(226,232,240,0.56)', fontSize: '12px' }}>
                Every paid customer email, ranked by paid order count.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(167,139,250,0.16)',
                border: '1px solid rgba(196,181,253,0.24)',
                color: '#ddd6fe',
                fontSize: '12px',
                fontWeight: 800,
              }}>
                {returningClients.length}
              </span>
              <span style={{ color: 'rgba(226,232,240,0.7)', fontSize: '12px', fontWeight: 800 }}>
                {returningClientsOpen ? 'Hide' : 'Open'}
              </span>
            </div>
          </button>

          {returningClientsOpen && (
            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <div style={{
                padding: '12px 16px',
                color: 'rgba(226,232,240,0.58)',
                fontSize: '12px',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                gap: '10px',
                alignItems: isMobile ? 'stretch' : 'center',
              }}>
                <span>
                  Includes one-time and repeat buyers. Send the return offer or the SIMPLE20 thank-you email from each row.
                </span>
                <button
                  onClick={() => {
                    const next = new Set<string>();
                    setReturningClientEmailSent(next);
                    saveReturningClientEmailSent(next);
                    setEmailBlastSent(next);
                    saveEmailBlastSent(next);
                  }}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.045)',
                    color: 'rgba(226,232,240,0.78)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Reset sent markers
                </button>
              </div>
              {returningClients.length === 0 ? (
                <div style={{ padding: '18px 16px', color: 'rgba(226,232,240,0.62)', fontSize: '13px' }}>
                  No past paid clients found yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {returningClients.map((client, index) => {
                    const sent = returningClientEmailSent.has(client.email);
                    const blastSent = emailBlastSent.has(client.email);
                    return (
                      <div
                        key={client.email}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '1fr' : '48px minmax(0, 1fr) 110px 130px minmax(250px, 280px)',
                          gap: isMobile ? '10px' : '12px',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderBottom: index === returningClients.length - 1 ? 'none' : '1px solid rgba(148, 163, 184, 0.08)',
                        }}
                      >
                        <div style={{ color: 'rgba(226,232,240,0.48)', fontSize: '12px', fontWeight: 800 }}>
                          #{index + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontSize: '13px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {client.name || 'Customer'}
                          </div>
                          <div style={{ marginTop: '3px', color: 'rgba(226,232,240,0.55)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {client.email}
                          </div>
                        </div>
                        <div style={{ color: '#ddd6fe', fontSize: '13px', fontWeight: 800 }}>
                          {client.paidOrderCount} paid
                        </div>
                        <div style={{ color: 'rgba(226,232,240,0.78)', fontSize: '13px', fontWeight: 700 }}>
                          ${Number(client.totalPaidSpend || 0).toFixed(2)}
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: '8px',
                        }}>
                          {sent ? (
                            <span style={{
                              padding: '8px 10px',
                              borderRadius: '999px',
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.18)',
                              color: '#86efac',
                              fontSize: '12px',
                              fontWeight: 800,
                              textAlign: 'center',
                            }}>
                              Email sent
                            </span>
                          ) : (
                            <button
                              onClick={() => sendReturningClientEmail(client)}
                              disabled={sendingReturningClientEmail === client.email}
                              style={{
                                padding: '9px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(196,181,253,0.24)',
                                background: sendingReturningClientEmail === client.email
                                  ? 'rgba(148, 163, 184, 0.16)'
                                  : 'rgba(167,139,250,0.14)',
                                color: '#ddd6fe',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: sendingReturningClientEmail === client.email ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {sendingReturningClientEmail === client.email ? 'Sending...' : 'Return Offer'}
                            </button>
                          )}
                          {blastSent ? (
                            <span style={{
                              padding: '8px 10px',
                              borderRadius: '999px',
                              background: 'rgba(34,197,94,0.1)',
                              border: '1px solid rgba(34,197,94,0.18)',
                              color: '#86efac',
                              fontSize: '12px',
                              fontWeight: 800,
                              textAlign: 'center',
                            }}>
                              Blast sent
                            </span>
                          ) : (
                            <button
                              onClick={() => sendEmailBlast(client)}
                              disabled={sendingEmailBlast === client.email}
                              style={{
                                padding: '9px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(251,191,36,0.22)',
                                background: sendingEmailBlast === client.email
                                  ? 'rgba(148, 163, 184, 0.16)'
                                  : 'rgba(245,158,11,0.12)',
                                color: '#fde68a',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: sendingEmailBlast === client.email ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {sendingEmailBlast === client.email ? 'Sending...' : 'Send SIMPLE20'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {message && (
          <div style={{
            padding: isMobile ? '12px 16px' : '15px 20px',
            marginBottom: isMobile ? '16px' : '20px',
            borderRadius: '8px',
            background: message.type === 'success' 
              ? 'rgba(34, 197, 94, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: message.type === 'success' ? '#22c55e' : '#ef4444',
            fontSize: isMobile ? '13px' : '14px',
          }}>
            {message.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.7)' }}>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '18px' }}>
              {searchTerm
                ? 'No orders found matching your search'
                : queueFilter === 'all'
                  ? 'No orders found'
                  : `No ${queueOptions.find(queue => queue.id === queueFilter)?.label.toLowerCase() || 'matching'} orders found`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '6px',
              padding: isMobile ? '2px 2px 6px' : '2px 4px 8px',
              color: 'rgba(226,232,240,0.56)',
              fontSize: '12px',
            }}>
              <span>
                {queueOptions.find(queue => queue.id === queueFilter)?.label || 'Orders'} · Showing {visibleOrders.length} of {filteredOrders.length} matching order{filteredOrders.length === 1 ? '' : 's'}.
              </span>
              {searchTerm && (
                <span style={{ color: '#ddd6fe', fontWeight: 700 }}>
                  Search: {searchTerm}
                </span>
              )}
            </div>
            {visibleOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(15,23,42,0.46)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                  borderLeft: `3px solid ${getStatusPill(order).color}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* Order summary row */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '10px' : '10px',
                  padding: isMobile ? '12px' : '14px 18px', 
                  alignItems: isMobile ? 'stretch' : 'center',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '7px 8px' : '10px 14px', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#93c5fd', fontFamily: 'monospace' }}>
                        {order.order_number}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        padding: '2px 8px', 
                        borderRadius: '999px',
                        ...getPaymentPillStyle(order.payment_method),
                      }}>
                        {getPaymentMethodLabel(order.payment_method)}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        color: getStatusPill(order).color,
                        background: getStatusPill(order).background,
                        border: `1px solid ${getStatusPill(order).border}`,
                      }}>
                        {getStatusPill(order).label}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: 'rgba(255,255,255,0.6)', marginTop: '6px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {getCustomerName(order) ? `${getCustomerName(order)} · ` : ''}{order.email} · {formatDate(order.created_at)}
                    </div>
                    {getOrderBadges(order).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {getOrderBadges(order).map((badge) => (
                          <span
                            key={badge.label}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '999px',
                              background: badge.background,
                              border: `1px solid ${badge.border}`,
                              color: badge.color,
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    display: isMobile ? 'grid' : 'flex', 
                    gridTemplateColumns: isMobile ? `repeat(${isSmallMobile ? 2 : 3}, minmax(0, 1fr))` : undefined,
                    width: isMobile ? '100%' : 'auto',
                    gap: '8px', 
                    alignItems: isMobile ? 'stretch' : 'center',
                    flexWrap: 'wrap',
                  }}>
                    {order.customer_history && (
                      <span
                        title={
                          order.customer_history.repeatCustomer
                            ? `${order.customer_history.previousOrderCount} previous order(s), $${order.customer_history.previousPaidSpend.toFixed(2)} previous paid spend`
                            : 'No previous orders found for this email'
                        }
                        style={{
                          padding: isMobile ? '9px 8px' : '8px 10px',
                          color: order.customer_history.repeatCustomer ? '#ddd6fe' : 'rgba(226,232,240,0.72)',
                          background: order.customer_history.repeatCustomer ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.045)',
                          border: `1px solid ${order.customer_history.repeatCustomer ? 'rgba(196,181,253,0.24)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        {order.customer_history.repeatCustomer
                          ? `Repeat · ${order.customer_history.previousOrderCount} prior`
                          : 'First order'}
                      </span>
                    )}
                    {isPendingPayment(order) && isManualPaymentMethod(order.payment_method) && (
                      <button
                        onClick={() => confirmPayment(order.order_number, order.payment_method)}
                        disabled={confirming === order.order_number}
                        style={{
                          padding: isMobile ? '10px 8px' : '12px 24px',
                          background: confirming === order.order_number 
                            ? 'rgba(167, 139, 250, 0.5)' 
                            : '#8B5CF6',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: confirming === order.order_number ? 'not-allowed' : 'pointer',
                          opacity: confirming === order.order_number ? 0.7 : 1,
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto',
                        }}
                        onMouseEnter={(e) => {
                          if (confirming !== order.order_number) {
                            e.currentTarget.style.background = '#7C3AED';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (confirming !== order.order_number) {
                            e.currentTarget.style.background = '#8B5CF6';
                          }
                        }}
                      >
                        {confirming === order.order_number ? 'Confirming...' : 'Confirm Payment'}
                      </button>
                    )}
                    {(order.payment_method === 'credit_debit_card' ||
                      order.payment_method === 'keybilling' ||
                      order.payment_method === 'bankful_hosted' ||
                      order.payment_method === 'stripe' ||
                      order.payment_method === 'square') &&
                      order.payment_status === 'paid' && (
                      <button
                        onClick={() => resendCardOrderEmail(order.order_number)}
                        disabled={resendingEmail === order.order_number}
                        style={{
                          padding: isMobile ? '10px 8px' : '12px 24px',
                          background: resendingEmail === order.order_number 
                            ? 'rgba(167, 139, 250, 0.5)' 
                            : '#8B5CF6',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 700,
                          cursor: resendingEmail === order.order_number ? 'not-allowed' : 'pointer',
                          opacity: resendingEmail === order.order_number ? 0.7 : 1,
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto',
                        }}
                        onMouseEnter={(e) => {
                          if (resendingEmail !== order.order_number) {
                            e.currentTarget.style.background = '#7C3AED';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (resendingEmail !== order.order_number) {
                            e.currentTarget.style.background = '#8B5CF6';
                          }
                        }}
                      >
                        {resendingEmail === order.order_number ? 'Sending...' : 'Resend Email'}
                      </button>
                    )}
                    {order.payment_status === 'paid' && order.email && !emailBlastSent.has(order.email.toLowerCase()) && (
                      <button
                        onClick={() => sendEmailBlast({ email: order.email.toLowerCase(), name: getCustomerName(order) })}
                        disabled={sendingEmailBlast === order.email.toLowerCase()}
                        style={{
                          padding: isMobile ? '10px 8px' : '12px 20px',
                          background: sendingEmailBlast === order.email.toLowerCase()
                            ? 'rgba(148, 163, 184, 0.18)'
                            : 'rgba(245,158,11,0.12)',
                          color: '#fde68a',
                          border: '1px solid rgba(251,191,36,0.22)',
                          borderRadius: '8px',
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 700,
                          cursor: sendingEmailBlast === order.email.toLowerCase() ? 'not-allowed' : 'pointer',
                          opacity: sendingEmailBlast === order.email.toLowerCase() ? 0.7 : 1,
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto',
                        }}
                      >
                        {sendingEmailBlast === order.email.toLowerCase() ? 'Sending...' : 'Send SIMPLE20'}
                      </button>
                    )}
                    {order.payment_status === 'paid' && order.email && emailBlastSent.has(order.email.toLowerCase()) && (
                      <span
                        style={{
                          padding: isMobile ? '9px 8px' : '8px 10px',
                          color: '#86efac',
                          background: 'rgba(34, 197, 94, 0.1)',
                          border: '1px solid rgba(34, 197, 94, 0.18)',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        Blast sent
                      </span>
                    )}
                    {order.payment_status === 'paid' && order.status !== 'shipped' && (
                      <button
                        onClick={() => setShipping({ orderNumber: order.order_number, trackingNumber: '' })}
                        style={{
                          padding: isMobile ? '10px 8px' : '12px 24px',
                          background: '#22c55e',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: isMobile ? '12px' : '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          width: isMobile ? '100%' : 'auto',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#16a34a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#22c55e';
                        }}
                      >
                        Mark as Shipped
                      </button>
                    )}
                    <button
                      onClick={() => toggleOrderDetails(order.id)}
                      style={{
                        padding: isMobile ? '10px 8px' : '8px 14px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: isMobile ? '100%' : 'auto',
                      }}
                    >
                      {expandedOrders.has(order.id) ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {expandedOrders.has(order.id) && (
                  <div style={{
                    padding: isMobile ? '14px 12px' : '20px 24px',
                    background: 'rgba(0,0,0,0.2)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {(order.payment_method === 'venmo' || order.payment_method === 'zelle' || order.payment_method === 'cashapp') && (
                      <div
                        style={{
                          marginBottom: '20px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(167, 139, 250, 0.08)',
                          border: '1px solid rgba(167, 139, 250, 0.25)',
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.88)',
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#93c5fd' }}>P2P payment reference</div>
                        {order.payment_method === 'venmo' && (
                          <span>Venmo: customer should pay @REPLACE-WITH-SIMPLETIDE-VENMO and put order <strong>{order.order_number}</strong> in the note.</span>
                        )}
                        {order.payment_method === 'zelle' && (
                          <span>Zelle: customer should pay REPLACE-WITH-SIMPLETIDE-VENMO and put order <strong>{order.order_number}</strong> in the memo.</span>
                        )}
                        {order.payment_method === 'cashapp' && (
                          <span>Cash App: customer should pay <strong>$REPLACE-WITH-SIMPLETIDE-CASHAPP</strong> and put order <strong>{order.order_number}</strong> in For / Note.</span>
                        )}
                      </div>
                    )}
                    {order.payment_method === 'square' && (
                      <div
                        style={{
                          marginBottom: '20px',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          background: 'rgba(139, 92, 246, 0.1)',
                          border: '1px solid rgba(167, 139, 250, 0.35)',
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.88)',
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#c4b5fd' }}>Square checkout</div>
                        {order.gateway_transaction_id ? (
                          <span>
                            Square payment ID:{' '}
                            <strong style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                              {order.gateway_transaction_id}
                            </strong>
                          </span>
                        ) : order.payment_status === 'pending_payment' ? (
                          <span>
                            Customer may still be on Square, or the webhook has not marked this order paid yet. If you
                            verified payment in Square, use <strong>Confirm Payment</strong> above, then{' '}
                            <strong>Mark as Shipped</strong> when ready. You can also check Railway logs for{' '}
                            <code style={{ fontFamily: 'monospace' }}>/api/square-webhook</code>.
                          </span>
                        ) : (
                          <span>No Square payment ID stored on this order yet.</span>
                        )}
                      </div>
                    )}
                    {/* Addresses */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Billing</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{formatAddress(getBillingAddress(order))}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>Shipping</div>
                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>{formatShippingAddress(order.shipping_address)}</div>
                        {order.tracking_number && (
                          <div style={{ marginTop: '8px', fontSize: '13px', color: '#0055ff', fontFamily: 'monospace' }}>
                            Tracking: {order.tracking_number}
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>
                      Order Items
                    </h3>
                    {order.order_items && order.order_items.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {order.order_items.map((item, index) => (
                          <div 
                            key={index}
                            style={{
                              padding: isMobile ? '10px' : '12px 14px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: isMobile ? 'flex-start' : 'center',
                              gap: isMobile ? '10px' : '14px',
                            }}
                          >
                            <div style={{
                              width: isMobile ? '42px' : '48px',
                              height: isMobile ? '42px' : '48px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              background: 'rgba(255,255,255,0.05)',
                            }}>
                              <img 
                                src={item.image || 'https://simpletide.com/images/cards/glp-3-rt.jpg'}
                                alt={(item as any)._displayName || item.product_name}
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://simpletide.com/images/cards/glp-3-rt.jpg';
                                }}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 600, color: '#fff', lineHeight: 1.35 }}>
                                {(item as any)._displayName || item.product_name || '—'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', lineHeight: 1.35 }}>
                                {(item.variant_spec || item.bundle_option || '').trim() || '—'} · Qty {item.quantity}
                                {item.sb26_bogo_applied && <span style={{ color: '#22c55e', marginLeft: '6px' }}>Qty deal</span>}
                              </div>
                            </div>
                            <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: 700, color: '#0055ff', flexShrink: 0 }}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>No items in this order</p>
                    )}

                    {/* Price breakdown */}
                    <div style={{
                      marginTop: '20px',
                      padding: isMobile ? '12px' : '16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Breakdown
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '6px', fontSize: isMobile ? '13px' : '14px' }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: '3px' }}>
                          <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Shipping method</span>
                          <span
                            style={{
                              color: order.shipping_method === 'express_1day' ? '#38bdf8' : 'rgba(255,255,255,0.95)',
                              fontWeight: order.shipping_method === 'express_1day' ? 600 : 400,
                              lineHeight: 1.35,
                            }}
                          >
                            {formatShippingMethodAdmin(order.shipping_method)}
                          </span>
                        </div>
                        {(order.subtotal != null && order.subtotal >= 0) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Subtotal</span>
                            <span>${Number(order.subtotal).toFixed(2)}</span>
                          </div>
                        )}
                        {(order.credits_discount != null && order.credits_discount > 0) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                            <span>Credits applied</span>
                            <span>-${Number(order.credits_discount).toFixed(2)}</span>
                          </div>
                        )}
                        {order.affiliate_code && String(order.affiliate_code).trim() && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Discount / promo code</span>
                            <span style={{ fontWeight: 700, color: '#93c5fd', fontFamily: 'monospace' }}>
                              {String(order.affiliate_code).trim()}
                            </span>
                          </div>
                        )}
                        {(order.affiliate_discount != null && order.affiliate_discount > 0) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#22c55e' }}>
                            <span>Affiliate % discount ($)</span>
                            <span>-${Number(order.affiliate_discount).toFixed(2)}</span>
                          </div>
                        )}
                        {(order.shipping_cost != null && order.shipping_cost > 0) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Shipping</span>
                            <span>${Number(order.shipping_cost).toFixed(2)}</span>
                          </div>
                        )}
                        {(order.processing_fee != null && order.processing_fee > 0) && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Processing fee (6%)</span>
                            <span>${Number(order.processing_fee).toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: isMobile ? '15px' : '16px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <span>Total</span>
                          <span style={{ color: '#8B5CF6' }}>${Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Modal */}
                {shipping && shipping.orderNumber === order.order_number && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                  }}
                  onClick={() => setShipping(null)}
                  >
                    <div 
                      style={{
                        background: '#0B0E14',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: isMobile ? '20px' : '30px',
                        maxWidth: '500px',
                        width: isMobile ? '95%' : '90%',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h2 style={{ 
                        fontSize: isMobile ? '18px' : '20px', 
                        fontWeight: 'bold', 
                        marginBottom: isMobile ? '16px' : '20px',
                        color: '#FFFFFF'
                      }}>
                        Mark Order as Shipped
                      </h2>
                      <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                        <label style={{ 
                          display: 'block', 
                          fontSize: isMobile ? '11px' : '12px', 
                          color: 'rgba(255, 255, 255, 0.7)',
                          marginBottom: '8px',
                          textTransform: 'uppercase'
                        }}>
                          USPS Tracking Number
                        </label>
                        <input
                          type="text"
                          value={shipping.trackingNumber}
                          onChange={(e) => setShipping({ ...shipping, trackingNumber: e.target.value })}
                          placeholder="9400111899223197428490"
                          style={{
                            width: '100%',
                            padding: isMobile ? '12px' : '12px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            fontSize: isMobile ? '13px' : '14px',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '10px' : '10px', 
                        justifyContent: 'flex-end' 
                      }}>
                        <button
                          onClick={() => setShipping(null)}
                          style={{
                            padding: isMobile ? '12px 20px' : '10px 20px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            fontSize: isMobile ? '13px' : '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            width: isMobile ? '100%' : 'auto',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => markAsShipped(shipping.orderNumber, shipping.trackingNumber)}
                          disabled={!shipping.trackingNumber.trim()}
                          style={{
                            padding: isMobile ? '12px 20px' : '10px 20px',
                            background: shipping.trackingNumber.trim() ? '#22c55e' : 'rgba(34, 197, 94, 0.5)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: isMobile ? '13px' : '14px',
                            fontWeight: 'bold',
                            width: isMobile ? '100%' : 'auto',
                            cursor: shipping.trackingNumber.trim() ? 'pointer' : 'not-allowed',
                          }}
                        >
                          Mark as Shipped
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {hasMoreOrders && (
              <button
                onClick={() => setVisibleOrderLimit((current) => current + ORDER_RENDER_BATCH_SIZE)}
                style={{
                  marginTop: '8px',
                  padding: isMobile ? '13px 16px' : '12px 18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(196,181,253,0.28)',
                  background: 'rgba(167,139,250,0.12)',
                  color: '#ddd6fe',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Load {Math.min(ORDER_RENDER_BATCH_SIZE, filteredOrders.length - visibleOrders.length)} more orders
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={fetchOrders}
            style={{
              padding: '10px 24px',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentAdmin;

