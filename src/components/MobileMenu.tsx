import { Link } from "@tanstack/react-router";
import { X, LogOut, User } from "lucide-react";
import { useEffect } from "react";
import { preloadAuthHeroImages } from "@/lib/auth-hero";
import { useEntered } from "@/lib/use-overlay-mount";
import { OverlayPortal } from "@/components/OverlayPortal";

const MOBILE_LINKS = [
  { to: "/", label: "Home", exact: true },
  { to: "/products", label: "Shop", exact: false },
  { to: "/coa-archive", label: "COA", exact: false },
  { to: "/track-order", label: "Track My Order", exact: false },
  { to: "/about", label: "About Us", exact: false },
  { to: "/contact", label: "Contact Us", exact: false },
  { to: "/account", label: "My Account", exact: false },
] as const;

/**
 * Slide-in nav drawer. Mounted only while open (plus its close transition), so
 * its markup isn't shipped in every page's HTML.
 */
export default function MobileMenu({
  open,
  onClose,
  signedIn,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  signedIn: boolean;
  onLogout: () => void;
}) {
  const entered = useEntered(open);
  const shown = open && entered;

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <OverlayPortal>
      <div
        onClick={onClose}
        aria-hidden="true"
        data-testid="mobile-menu-scrim"
        className={`md:hidden fixed inset-0 z-[60] cursor-pointer bg-black/50 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`md:hidden fixed inset-y-0 right-0 z-[70] flex w-[300px] max-w-[85%] flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[4.25rem] items-center justify-between border-b border-slate-200 px-5">
          <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">MENU</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:text-slate-900 active:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {MOBILE_LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              activeOptions={{ exact: item.exact }}
              className="block rounded-lg px-4 py-3.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100 active:bg-slate-200"
              activeProps={{ className: "bg-slate-100 text-violet-700" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Safe-area padding keeps the last button clear of the iOS home bar. */}
        <div className="mt-auto border-t border-slate-200 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {signedIn ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-3.5 text-left text-base font-semibold text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
            >
              <LogOut className="h-4 w-4 -scale-x-100" strokeWidth={1.75} /> Log Out
            </button>
          ) : (
            <Link
              to="/auth/login"
              onClick={onClose}
              onMouseEnter={preloadAuthHeroImages}
              onFocus={preloadAuthHeroImages}
              className="flex items-center gap-2 rounded-lg px-4 py-3.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100 active:bg-slate-200"
            >
              <User className="h-4 w-4" /> Log In
            </Link>
          )}
        </div>
      </aside>
    </OverlayPortal>
  );
}
