import { Link, useNavigate } from "@tanstack/react-router";
import { Search, User, ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth, displayNameFor, profileInitialsFor } from "@/lib/auth-context";
import { MarqueeBanner } from "@/components/MarqueeBanner";
import { AVATAR_GRADIENT } from "@/lib/account-ui";
import { preloadAuthHeroImages } from "@/lib/auth-hero";
import { useOverlayMount } from "@/lib/use-overlay-mount";
import { useState, useEffect, lazy, Suspense } from "react";

// Both overlays are code-split: the search panel carries the product catalog
// and card components, which is the bulk of what used to sit in the header
// chunk on every page. Neither is needed until the user opens it.
const SearchOverlay = lazy(() => import("@/components/SearchOverlay"));
const MobileMenu = lazy(() => import("@/components/MobileMenu"));

const preloadSearch = () => void import("@/components/SearchOverlay");
const preloadMobileMenu = () => void import("@/components/MobileMenu");

export function Header({ opaque = false, light = true }: { opaque?: boolean; light?: boolean }) {
  const { openCart, count: cartCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const profileInitials = profileInitialsFor(user);

  const searchMounted = useOverlayMount(searchOpen, 250);
  const mobileMounted = useOverlayMount(mobileOpen, 350);

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
        onMouseEnter={preloadSearch}
        onFocus={preloadSearch}
        onTouchStart={preloadSearch}
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
        onTouchStart={preloadMobileMenu}
        onMouseEnter={preloadMobileMenu}
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
      {mobileMounted && (
        <Suspense fallback={null}>
          <MobileMenu
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            signedIn={!!user}
            onLogout={handleLogout}
          />
        </Suspense>
      )}

      {searchMounted && (
        <Suspense fallback={null}>
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
  );
}
