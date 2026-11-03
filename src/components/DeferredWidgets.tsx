import { lazy, Suspense, useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useOverlayMount } from "@/lib/use-overlay-mount";
import { afterFirstPaint } from "@/lib/after-first-paint";

const CartDrawer = lazy(() =>
  import("@/components/CartDrawer").then((m) => ({ default: m.CartDrawer })),
);
const ChatBot = lazy(() => import("@/components/ChatBot").then((m) => ({ default: m.ChatBot })));
const Toaster = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

/**
 * Cart drawer, mounted only while open.
 *
 * It pulls in the product catalog for bundle pricing and vial art, which is why
 * it can't live in the always-rendered tree. The chunk is prefetched once the
 * page is idle, so opening the cart is still instant — it just no longer blocks
 * first paint.
 */
function DeferredCartDrawer() {
  const { isOpen } = useCart();
  const mounted = useOverlayMount(isOpen, 350);

  useEffect(() => afterFirstPaint(() => void import("@/components/CartDrawer")), []);

  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <CartDrawer />
    </Suspense>
  );
}

/**
 * Chat launcher and toast host. Neither is needed for first paint, and the
 * toast host renders nothing until something raises a toast, so both are held
 * back until the browser is idle.
 */
export function DeferredWidgets() {
  const [idle, setIdle] = useState(false);

  useEffect(() => afterFirstPaint(() => setIdle(true)), []);

  return (
    <>
      <DeferredCartDrawer />
      {idle && (
        <Suspense fallback={null}>
          <ChatBot />
          <Toaster position="top-center" richColors closeButton />
        </Suspense>
      )}
    </>
  );
}
