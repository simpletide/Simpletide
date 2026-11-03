import { Link } from "@tanstack/react-router";
import { X, LogOut, User } from "lucide-react";
import { useEffect } from "react";
import { preloadAuthHeroImages } from "@/lib/auth-hero";
import { useEntered } from "@/lib/use-overlay-mount";

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
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-[60] cursor-pointer bg-black/40 transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`md:hidden fixed right-0 top-0 z-[70] flex h-full w-[280px] max-w-[80%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[4.25rem] items-center justify-between border-b border-slate-200 px-5">
          <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">MENU</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="text-slate-500 transition-colors hover:text-slate-900"
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
              className="block rounded-lg px-4 py-3 text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              activeProps={{ className: "bg-slate-100" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 px-3 py-4">
          {signedIn ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-[15px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 -scale-x-100" strokeWidth={1.75} /> Log Out
            </button>
          ) : (
            <Link
              to="/auth/login"
              onClick={onClose}
              onMouseEnter={preloadAuthHeroImages}
              onFocus={preloadAuthHeroImages}
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <User className="h-4 w-4" /> Log In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
