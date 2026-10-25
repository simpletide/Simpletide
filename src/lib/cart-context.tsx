import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { discountedLine } from "@/lib/catalog";
import { trackAddToCart } from "@/lib/pixel-tracking";

export type CartItem = {
  id: string;
  name: string;
  tag?: string;
  price: number;
  qty: number;
  variant?: string;
};

type AddItemInput = Omit<CartItem, "qty"> & { qty?: number };

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  baseSubtotal: number;
  bundleSavings: number;
  addItem: (item: AddItemInput) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "simpletide_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item) => {
    try {
      trackAddToCart({ id: item.id, name: item.name, price: item.price }, item.qty ?? 1);
    } catch {
      /* ignore */
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + (item.qty ?? 1) } : i,
        );
      }
      return [...prev, { ...item, qty: item.qty ?? 1 }];
    });
  };

  const baseSubtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const subtotal = items.reduce(
    (s, i) => s + discountedLine(i.name, i.price, i.qty).lineTotal,
    0,
  );

  const value: CartContextValue = {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal,
    baseSubtotal,
    bundleSavings: Number((baseSubtotal - subtotal).toFixed(2)),
    addItem,
    removeItem: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    setQty: (id, qty) =>
      setItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)),
      ),
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
