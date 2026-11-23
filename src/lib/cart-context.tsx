import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { trackAddToCart } from "@/lib/pixel-tracking";
import {
  BOGO_CODE,
  calculateBogo,
  isSupportedPromoCode,
  normalizePromoCode,
  type BogoSummary,
} from "@/lib/promo-codes";

export const FREE_BAC_WATER_THRESHOLD = 150;
export const FREE_BAC_WATER_ID = "free-bac-water-10ml";

export type CartItem = {
  id: string;
  name: string;
  tag?: string;
  price: number;
  qty: number;
  variant?: string;
  isFreeGift?: boolean;
};

const FREE_BAC_WATER_ITEM: CartItem = {
  id: FREE_BAC_WATER_ID,
  name: "BAC Water - 10ML",
  tag: "Free Gift",
  price: 0,
  qty: 1,
  variant: "10ML",
  isFreeGift: true,
};

type AddItemInput = Omit<CartItem, "qty" | "isFreeGift"> & { qty?: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  baseSubtotal: number;
  bundleSavings: number;
  promoCode: string | null;
  promoDiscount: number;
  bogoPreview: BogoSummary;
  hasFreeBacWater: boolean;
  freeBacWaterRemaining: number;
  applyPromoCode: (raw: string) => { ok: boolean; message: string };
  clearPromoCode: () => void;
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "simpletide_cart_v1";
const PROMO_STORAGE_KEY = "simpletide_promo_v1";

function isFreeGiftItem(item: CartItem): boolean {
  return Boolean(item.isFreeGift) || item.id === FREE_BAC_WATER_ID;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [rawItems, setRawItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CartItem[];
          if (Array.isArray(parsed)) {
            setRawItems(parsed.filter((i) => !isFreeGiftItem(i)));
          }
        }
        const savedPromo = window.localStorage.getItem(PROMO_STORAGE_KEY);
        if (savedPromo && isSupportedPromoCode(savedPromo)) {
          setPromoCode(normalizePromoCode(savedPromo));
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawItems));
    } catch {}
  }, [rawItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (promoCode) {
        window.localStorage.setItem(PROMO_STORAGE_KEY, promoCode);
      } else {
        window.localStorage.removeItem(PROMO_STORAGE_KEY);
      }
    } catch {}
  }, [promoCode, hydrated]);

  const addItem: CartContextValue["addItem"] = (item) => {
    try {
      trackAddToCart({ id: item.id, name: item.name, price: item.price }, item.qty ?? 1);
    } catch {
      /* ignore */
    }
    setRawItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
        );
      }
      return [...prev, { ...item, qty: item.qty ?? 1 }];
    });
  };

  // All financials & BOGO pairing operate strictly on paid items so the $0 auto-gift never skews BOGO.
  const paidItems = rawItems.filter((i) => !isFreeGiftItem(i));
  const baseSubtotal = Number(paidItems.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2));
  const bogoPreview = calculateBogo(paidItems);
  const promoDiscount = promoCode === BOGO_CODE ? bogoPreview.discount : 0;
  const subtotal = Math.max(0, Number((baseSubtotal - promoDiscount).toFixed(2)));

  const hasFreeBacWater = subtotal >= FREE_BAC_WATER_THRESHOLD;
  const freeBacWaterRemaining = Math.max(
    0,
    Number((FREE_BAC_WATER_THRESHOLD - subtotal).toFixed(2)),
  );
  const items: CartItem[] = hasFreeBacWater ? [...paidItems, FREE_BAC_WATER_ITEM] : paidItems;

  const applyPromoCode: CartContextValue["applyPromoCode"] = (raw) => {
    const code = normalizePromoCode(raw);
    if (!code) return { ok: false, message: "Enter a promo code." };
    if (!isSupportedPromoCode(code)) {
      return { ok: false, message: "Invalid or expired code" };
    }
    setPromoCode(code);
    if (bogoPreview.totalUnits < 2) {
      return {
        ok: true,
        message: "Code BOGO applied — add 1 more vial to unlock your free vial.",
      };
    }
    return {
      ok: true,
      message: `Code BOGO applied — saving $${bogoPreview.discount.toFixed(2)}!`,
    };
  };

  const clearPromoCode = () => setPromoCode(null);

  const value: CartContextValue = {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal,
    baseSubtotal,
    bundleSavings: 0,
    promoCode,
    promoDiscount,
    bogoPreview,
    hasFreeBacWater,
    freeBacWaterRemaining,
    applyPromoCode,
    clearPromoCode,
    addItem,
    removeItem: (id) => {
      if (id === FREE_BAC_WATER_ID) return;
      setRawItems((prev) => prev.filter((i) => i.id !== id));
    },
    setQty: (id, qty) => {
      if (id === FREE_BAC_WATER_ID) return;
      setRawItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
      );
    },
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function parsePrice(price: string): number {
  const n = parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
