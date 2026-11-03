/**
 * Meta + TikTok browser pixel events. No-ops until a base pixel (`fbq` / `ttq`)
 * is loaded on the page.
 *
 * Events:
 *  - PageView (Meta) + ttq.page() (TikTok)           — initial load + each SPA route
 *  - AddToCart (Meta)                                — funnelled through cart addItem
 *  - InitiateCheckout + AddPaymentInfo (Meta + TT)   — checkout mount
 *  - Purchase (Meta) + CompletePayment (TikTok)      — order confirmation, once per order
 */

type Fbq = (...args: unknown[]) => void;
type Ttq = {
  page?: () => void;
  track?: (...args: unknown[]) => void;
};

function getFbq(): Fbq | undefined {
  if (typeof window === "undefined") return undefined;
  const fbq = (window as { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : undefined;
}

function getTtq(): Ttq | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as { ttq?: Ttq }).ttq;
}

/**
 * The catalog is loaded on demand rather than imported: this module is reached
 * from the cart context on every page, and a static import pulled the whole
 * product catalog into the first-load bundle. Pixel events are fire-and-forget,
 * so resolving the slug a microtask later keeps the reported ids identical.
 */
let catalogPromise: Promise<typeof import("@/lib/catalog")> | null = null;
function loadCatalog() {
  catalogPromise ??= import("@/lib/catalog");
  return catalogPromise;
}

/**
 * Resolve a stable content id for Meta/TikTok from a cart/order item. Prefers
 * the catalog slug (matches the product page URL + Meta catalog), falls back to
 * the raw cart id.
 */
async function contentIdFor(item: { id?: string; name?: string }): Promise<string> {
  try {
    const name = String(item.name || "").trim();
    if (name) {
      const { slugFor, baseProductName } = await loadCatalog();
      const slug = slugFor(baseProductName(name));
      if (slug) return slug;
    }
  } catch {
    /* ignore */
  }
  return String(item.id || "").trim() || "unknown";
}

export type AddToCartPixelProduct = {
  id: string;
  name: string;
  price: number;
};

/** Meta AddToCart — cards / options / chatbot all funnel through cart `addItem`. */
export function trackAddToCart(product: AddToCartPixelProduct, quantity: number): void {
  if (typeof window === "undefined") return;
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return;
  const price = Number(product.price);
  if (!Number.isFinite(price) || price < 0) return;
  void (async () => {
    const id = await contentIdFor(product);
    if (!id) return;
    try {
      const fbq = getFbq();
      if (fbq) {
        fbq("track", "AddToCart", {
          value: price * qty,
          currency: "USD",
          content_ids: [id],
          content_type: "product",
          contents: [{ id, quantity: qty }],
        });
      }
    } catch {
      /* ignore */
    }
  })();
}

/** Meta PageView + TikTok ttq.page() — fired on each SPA route change. */
export function firePixelsRoutePageView(): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = getFbq();
    if (fbq) fbq("track", "PageView");
  } catch {
    /* ignore */
  }
  try {
    const ttq = getTtq();
    if (ttq && typeof ttq.page === "function") ttq.page();
  } catch {
    /* ignore */
  }
}

/** Meta + TikTok InitiateCheckout + AddPaymentInfo — fired once on checkout mount. */
export function trackInitiateCheckout(): void {
  if (typeof window === "undefined") return;
  try {
    const fbq = getFbq();
    if (fbq) {
      fbq("track", "InitiateCheckout");
      fbq("track", "AddPaymentInfo");
    }
  } catch {
    /* ignore */
  }
  try {
    const ttq = getTtq();
    if (ttq && typeof ttq.track === "function") {
      ttq.track("InitiateCheckout");
      ttq.track("AddPaymentInfo");
    }
  } catch {
    /* ignore */
  }
}

export type PurchasePixelItem = {
  id?: string;
  name?: string;
  price?: number;
  qty?: number;
  quantity?: number;
};

export type PurchasePixelOrder = {
  orderNumber?: string;
  id?: string;
  total?: number | string;
  items?: PurchasePixelItem[];
};

/**
 * Meta Purchase + TikTok CompletePayment, once per order (sessionStorage guard).
 * Mirrors the live site: Meta `eventID` is `purchase_<orderId>` so the server-side
 * Conversions API event (shared Railway backend) deduplicates against it.
 */
export function trackPurchaseOnce(order: PurchasePixelOrder): void {
  if (typeof window === "undefined") return;

  const orderId = String(order.orderNumber || order.id || "").trim();
  if (!orderId) return;

  const orderTotal = Number(order.total);
  if (!Number.isFinite(orderTotal) || orderTotal < 0) return;

  const trackKey = `pixel_tracked_${orderId}`;
  try {
    if (sessionStorage.getItem(trackKey)) return;
    // Claimed up front rather than at the end: slug resolution below is async
    // now, and a second call must not slip through before the guard is written.
    sessionStorage.setItem(trackKey, "1");
  } catch {
    /* ignore */
  }

  void (async () => {
  const rawItems = order.items || [];
  const contents = (
    await Promise.all(
      rawItems.map(async (item) => {
        const quantity = Number(item.quantity ?? item.qty ?? 1);
        if (!Number.isFinite(quantity) || quantity < 1) return null;
        return {
          id: await contentIdFor(item),
          quantity,
          name: String(item.name || "").trim(),
          price: Number(item.price ?? 0),
        };
      }),
    )
  ).filter((c): c is { id: string; quantity: number; name: string; price: number } => c != null);

  const num_items = contents.reduce((s, c) => s + c.quantity, 0);

  try {
    const fbq = getFbq();
    if (fbq) {
      const params: Record<string, unknown> = {
        value: orderTotal,
        currency: "USD",
        content_type: "product",
        num_items,
        order_id: orderId,
      };
      if (contents.length) {
        params.content_ids = contents.map((c) => c.id);
        params.contents = contents.map((c) => ({ id: c.id, quantity: c.quantity }));
      }
      fbq("track", "Purchase", params, { eventID: `purchase_${orderId}` });
    }
  } catch {
    /* ignore */
  }

  try {
    const ttq = getTtq();
    if (ttq && typeof ttq.track === "function") {
      const ttContents = contents.map((c) => ({
        content_id: c.id,
        content_name: (c.name || c.id).slice(0, 120),
        quantity: c.quantity,
        price: Number(c.price ?? 0),
      }));
      ttq.track("CompletePayment", {
        value: orderTotal,
        currency: "USD",
        content_type: "product",
        ...(ttContents.length ? { contents: ttContents } : {}),
        description: orderId,
      });
    }
  } catch {
    /* ignore */
  }
  })();
}
