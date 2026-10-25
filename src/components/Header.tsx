import { Link, useNavigate } from "@tanstack/react-router";
import { Search, User, ShoppingCart, Menu, X, LogOut } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth, displayNameFor, profileInitialsFor } from "@/lib/auth-context";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { SearchOverlay } from "@/components/SearchOverlay";
import { AVATAR_GRADIENT } from "@/lib/account-ui";
import { preloadAuthHeroImages } from "@/lib/auth-hero";
import { useState, useEffect } from "react";

export function Header({ opaque = false, light = true }: { opaque?: boolean; light?: boolean }) {
  const { openCart, count: cartCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileInitials = profileInitialsFor(user);

  const handleLogout = async () => {
    setMobileOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open. This only ever fires on
  // mobile because the toggle that sets `mobileOpen` is `md:hidden`.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const mobileLinks = [
    { to: "/", label: "Home", exact: true },
    { to: "/products", label: "Shop", exact: false },
    { to: "/coa-archive", label: "COA", exact: false },
    { to: "/track-order", label: "Track My Order", exact: false },
    { to: "/about", label: "About Us", exact: false },
    { to: "/contact", label: "Contact Us", exact: false },
    { to: "/account", label: "My Account", exact: false },
  ] as const;

  const navLinkClass = light
    ? "relative cursor-pointer text-base font-semibold tracking-wide text-slate-700 hover:text-slate-900 transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-[#f472b6] after:via-[#a78bfa] after:to-[#38bdf8] after:transition-all after:duration-300 hover:after:w-full"
    : "relative cursor-pointer text-base font-semibold tracking-wide text-white hover:text-white transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-white after:transition-all after:duration-300 hover:after:w-full";
  const iconClass = light
    ? "text-slate-600 hover:text-slate-900 transition-colors"
    : "text-white/80 hover:text-white transition-colors";
  const badgeClass = light
    ? "absolute -top-2 -right-2 bg-gradient-to-r from-[#f472b6] to-[#a78bfa] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
    : "absolute -top-2 -right-2 bg-white text-[#0a1a4a] text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center";

  // True-blue name bar with a subtle left->right gradient (slightly darker on the
  // left, lighter toward the right) so it reads as the brand blue, not heavy navy.
  const navGradient = light
    ? "bg-white/60 backdrop-blur-md"
    : "bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] [text-shadow:0_1px_2px_rgba(91,33,182,0.35)]";
  const navBorder = light ? "border-b border-white" : "border-b border-white/10";
  const glass = opaque
    ? `${navGradient} ${navBorder}`
    : scrolled
      ? `${navGradient} shadow-lg ${light ? "shadow-violet-200/40" : "shadow-black/25"} ${navBorder}`
      : `${navGradient} ${navBorder}`;

  const logoLink = (
    <Link to="/" className="flex shrink-0 cursor-pointer items-center gap-2">
      <span
        className={`text-xl sm:text-3xl font-light tracking-widest ${light ? "text-slate-800" : "text-white"}`}
        style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
      >
        <span className="bg-gradient-to-r from-[#f9a8d4] via-[#c4b5fd] to-[#93c5fd] bg-clip-text text-transparent">SIMPLE</span>TIDE
      </span>
    </Link>
  );

  const desktopNav = (
    <nav className="hidden md:flex items-center gap-7">
      <Link to="/" className={navLinkClass}>Home</Link>
      <Link to="/products" className={navLinkClass}>Shop</Link>
      <Link to="/about" className={navLinkClass}>About</Link>
      <Link to="/coa-archive" className={navLinkClass}>COA</Link>
      <Link to="/contact" className={navLinkClass}>Contact</Link>
    </nav>
  );

  const headerActions = (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
        className={`block ${iconClass}`}
      >
        <Search className="w-5 h-5" />
      </button>
      {user ? (
        <Link
          to="/account"
          aria-label="My account"
          title={displayNameFor(user)}
          className={`hidden sm:flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-1 ring-white/30 transition-colors hover:ring-white/50 ${AVATAR_GRADIENT}`}
        >
          {profileInitials}
        </Link>
      ) : (
        <Link
          to="/auth/login"
          aria-label="Account"
          className={`hidden sm:block ${iconClass}`}
          onMouseEnter={preloadAuthHeroImages}
          onFocus={preloadAuthHeroImages}
        >
          <User className="w-5 h-5" />
        </Link>
      )}
      <button
        onClick={openCart}
        className={`relative ${iconClass}`}
        aria-label="Open cart"
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className={badgeClass}>
            {cartCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setMobileOpen((o) => !o)}
        className={`md:hidden ${iconClass}`}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <header className={`relative z-50 transition-all duration-300 ${glass}`}>
      <MarqueeBanner light={light} />
      <div className="max-w-7xl mx-auto pl-5 pr-4 sm:pl-4 sm:pr-6 lg:pl-5 lg:pr-8">
        <div className="flex items-center justify-between h-[4.25rem]">
          {logoLink}
          {desktopNav}
          {headerActions}
        </div>
      </div>

      {/* Mobile slide-in drawer (Peptora-style). Hidden entirely on md+. */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`md:hidden fixed inset-0 z-[60] cursor-pointer bg-black/40 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className={`md:hidden fixed right-0 top-0 z-[70] flex h-full w-[280px] max-w-[80%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-[4.25rem] items-center justify-between border-b border-slate-200 px-5">
          <span className="text-xs font-semibold tracking-[0.2em] text-slate-500">MENU</span>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="text-slate-500 transition-colors hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-3 py-4">
          {mobileLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              activeOptions={{ exact: item.exact }}
              className="block rounded-lg px-4 py-3 text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
              activeProps={{ className: "bg-slate-100" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 px-3 py-4">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-[15px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 -scale-x-100" strokeWidth={1.75} /> Log Out
            </button>
          ) : (
            <Link
              to="/auth/login"
              onClick={() => setMobileOpen(false)}
              onMouseEnter={preloadAuthHeroImages}
              onFocus={preloadAuthHeroImages}
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-[15px] font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              <User className="h-4 w-4" /> Log In
            </Link>
          )}
        </div>
      </aside>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
