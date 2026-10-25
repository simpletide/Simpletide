import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Loader2,
  Package,
  ChevronLeft,
  Home,
  MapPin,
  ShoppingBag,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, profileInitialsFor } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { TrackOrderPanel } from "@/components/TrackOrderPanel";
import { AccountAddressesSection } from "@/components/AccountAddressesSection";
import { AccountProfileSection } from "@/components/AccountProfileSection";
import { labelsForOrder, isConfirmedOrder } from "@/lib/order-track";
import { formatSavedAddressLines } from "@/lib/saved-addresses";
import {
  ACCOUNT_FONT,
  accountBody,
  accountBreadcrumb,
  accountBreadcrumbCurrent,
  accountCaption,
  accountCard,
  accountLink,
  accountLabel,
  accountMuted,
  accountNavActive,
  accountNavIdle,
  accountNavItem,
  AVATAR_GRADIENT,
  accountPageClass,
  accountEmptyStateCard,
  accountSectionSubtitle,
  accountSectionTitle,
  CTA_BUTTON,
} from "@/lib/account-ui";
import { pageSeoHead } from "@/lib/site-seo";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/account")({
  validateSearch: (search: Record<string, unknown>) => {
    const legacyTab = search.tab === "track" ? "track" : search.tab === "orders" ? "orders" : null;
    const raw = (search.section as string) || legacyTab || "dashboard";
    const allowed = ["dashboard", "orders", "track", "addresses", "profile"] as const;
    const section = allowed.includes(raw as (typeof allowed)[number])
      ? (raw as (typeof allowed)[number])
      : "dashboard";
    const profileTabRaw = search.profileTab as string;
    const profileTab =
      profileTabRaw === "payment-admin" ? ("payment-admin" as const) : ("profile" as const);
    return { section, profileTab };
  },
  head: () =>
    pageSeoHead({
      path: "/account",
      title: "My Account — Simpletide",
      description: "View your Simpletide orders and account details.",
      noindex: true,
    }),
  component: AccountPage,
});

type AccountSection = "dashboard" | "orders" | "track" | "addresses" | "profile";
type ProfileTab = "profile" | "payment-admin";

type OrderItem = {
  id?: string;
  product_name?: string;
  product_id?: string;
  variant_spec?: string;
  quantity?: number;
  price?: number;
};

type Order = {
  id: string;
  order_number?: string;
  created_at?: string;
  total?: number;
  subtotal?: number;
  shipping_cost?: number;
  processing_fee?: number;
  status?: string;
  payment_status?: string;
  tracking_number?: string;
  shipping_address?: Record<string, unknown> | null;
  order_items?: OrderItem[];
};

const SECTION_LABELS: Record<AccountSection, string> = {
  dashboard: "Overview",
  orders: "My Orders",
  track: "Track Order",
  addresses: "My Addresses",
  profile: "My Profile",
};

function money(n: number | undefined | null): string {
  return `$${(Number(n) || 0).toFixed(2)}`;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function firstName(user: { user_metadata?: Record<string, unknown>; email?: string | null }): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const raw = meta?.full_name || meta?.name || user.email?.split("@")[0] || "there";
  return raw.split(/\s+/)[0] || "there";
}


function AccountPage() {
  const navigate = useNavigate();
  const { section, profileTab } = Route.useSearch();
  const { user, loading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  // Composite dep re-runs the reveal observer as auth resolves and the user
  // switches sections / selects an order, so newly mounted nodes still animate.
  useReveal(`${section}:${authLoading}:${loadingOrders}:${selected?.id ?? ""}`);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    setSelected(null);
  }, [section]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const sb = supabase as unknown as {
          from: (t: string) => {
            select: (q: string) => {
              eq: (
                c: string,
                v: string,
              ) => {
                eq: (
                  c: string,
                  v: string,
                ) => {
                  order: (c: string, o: { ascending: boolean }) => Promise<{ data: Order[] | null }>;
                };
                order: (c: string, o: { ascending: boolean }) => Promise<{ data: Order[] | null }>;
              };
              ilike: (c: string, v: string) => {
                eq: (
                  c: string,
                  v: string,
                ) => {
                  order: (c: string, o: { ascending: boolean }) => Promise<{ data: Order[] | null }>;
                };
                order: (c: string, o: { ascending: boolean }) => Promise<{ data: Order[] | null }>;
              };
            };
          };
        };

        const byId = await sb
          .from("orders")
          .select("*, order_items(*)")
          .eq("user_id", user.id)
          .eq("payment_status", "paid")
          .order("created_at", { ascending: false });

        const merged = new Map<string, Order>();
        for (const o of byId.data || []) merged.set(o.id, o);

        const email = (user.email || "").trim().toLowerCase();
        if (email) {
          const byEmail = await sb
            .from("orders")
            .select("*, order_items(*)")
            .ilike("email", email)
            .eq("payment_status", "paid")
            .order("created_at", { ascending: false });
          for (const o of byEmail.data || []) if (!merged.has(o.id)) merged.set(o.id, o);
        }

        const list = Array.from(merged.values())
          .filter(isConfirmedOrder)
          .sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
          );
        if (active) setOrders(list);
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        if (active) setLoadingOrders(false);
      }
    };

    fetchOrders();
    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const goSection = (next: AccountSection) => {
    navigate({ to: "/account", search: { section: next, profileTab: "profile" } });
  };

  const goProfileTab = (tab: ProfileTab) => {
    navigate({ to: "/account", search: { section: "profile", profileTab: tab } });
  };

  if (authLoading) {
    return (
      <div className={accountPageClass} style={{ fontFamily: ACCOUNT_FONT }}>
        <Header opaque />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={accountPageClass} style={{ fontFamily: ACCOUNT_FONT }}>
        <Header opaque />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className={`w-full max-w-md p-8 text-center ${accountCard}`}>
            <h1 className={accountSectionTitle}>You're signed out</h1>
            <p className={`mt-2 ${accountMuted}`}>Sign in to view your account and order history.</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/auth/login" })}
              className={`mt-6 inline-flex w-full items-center justify-center ${CTA_BUTTON}`}
            >
              Go to sign in
            </button>
          </div>
        </main>
      </div>
    );
  }

  const profileInitials = profileInitialsFor(user);
  const greeting = firstName(user);

  const navItems: { id: AccountSection; label: string; icon: ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Home className="h-[18px] w-[18px]" /> },
    { id: "orders", label: "My Orders", icon: <Package className="h-[18px] w-[18px]" /> },
    { id: "addresses", label: "Addresses", icon: <MapPin className="h-[18px] w-[18px]" /> },
    { id: "profile", label: "My Profile", icon: <span className="text-[11px] font-semibold">{profileInitials}</span> },
  ];

  return (
    <div className={accountPageClass} style={{ fontFamily: ACCOUNT_FONT }}>
      <Header opaque />

      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-1 flex-row gap-3 px-3 py-6 md:min-h-0 md:gap-10 md:px-6 md:py-10 lg:max-w-7xl">
        {/* Sidebar — vertical icon rail on mobile (Peptora-style), labeled list on desktop */}
        <aside className="shrink-0 md:w-56 lg:w-60">
          <nav className="sticky top-24 flex flex-col gap-1">
            {navItems.map((item) => {
              const active = section === item.id;
              const isProfile = item.id === "profile";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goSection(item.id)}
                  aria-label={item.label}
                  title={item.label}
                  className={`${accountNavItem} ${active ? accountNavActive : accountNavIdle}`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isProfile
                        ? `${AVATAR_GRADIENT} text-[11px] font-semibold`
                        : active
                          ? "text-neutral-900"
                          : "text-neutral-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Log Out"
              title="Log Out"
              className={`${accountNavItem} ${accountNavIdle}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-500">
                <LogOut className="h-[18px] w-[18px] -translate-x-1 -scale-x-100" strokeWidth={1.75} />
              </span>
              <span className="hidden md:inline">Log Out</span>
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <Breadcrumbs section={section} profileTab={profileTab} />

          {section === "dashboard" && (
            <>
              <header className="mb-8" data-reveal>
                <h2 className={accountSectionTitle}>Welcome back, {greeting}.</h2>
                <p className={accountSectionSubtitle}>You can manage your account and orders here.</p>
              </header>
              <OrdersSection
                title="Orders"
                orders={orders}
                loading={loadingOrders}
                limit={5}
                onViewAll={() => goSection("orders")}
                onSelect={setSelected}
                selected={selected}
              />
            </>
          )}

          {section === "orders" && (
            <>
              <header className="mb-8" data-reveal>
                <h2 className={accountSectionTitle}>My Orders</h2>
                <p className={accountSectionSubtitle}>View and track your past purchases.</p>
              </header>
              <OrdersSection
                title="Orders"
                orders={orders}
                loading={loadingOrders}
                onSelect={setSelected}
                selected={selected}
                hideSectionTitle
              />
            </>
          )}

          {section === "track" && (
            <section>
              <h2 className={`mb-4 ${accountSectionTitle}`} data-reveal>Track Order</h2>
              <div className={`${accountCard} p-4 md:p-6`}>
                <TrackOrderPanel embedded defaultEmail={user.email || ""} />
              </div>
            </section>
          )}

          {section === "addresses" && <AccountAddressesSection user={user} />}

          {section === "profile" && (
            <AccountProfileSection
              user={user}
              tab={profileTab}
              onTabChange={goProfileTab}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Breadcrumbs({ section, profileTab }: { section: AccountSection; profileTab?: ProfileTab }) {
  const label =
    section === "profile" && profileTab === "payment-admin" ? "Payment Admin" : SECTION_LABELS[section];
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1 md:mb-7" aria-label="Breadcrumb">
      <Link to="/" className={accountBreadcrumb}>
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
      <Link to="/account" search={{ section: "dashboard", profileTab: "profile" }} className={accountBreadcrumb}>
        Account
      </Link>
      <ChevronRight className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
      <span className={accountBreadcrumbCurrent}>{label}</span>
    </nav>
  );
}

function EmptyCard({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-16 text-center ${accountEmptyStateCard}`} data-reveal>
      <div className="mb-4">{icon}</div>
      <h3 className={accountSectionTitle}>{title}</h3>
      <p className={`mt-2 max-w-sm ${accountSectionSubtitle}`}>{description}</p>
      <Link to={actionTo} className={`mt-6 ${CTA_BUTTON}`}>
        {actionLabel}
      </Link>
    </div>
  );
}

function OrdersSection({
  title,
  orders,
  loading,
  limit,
  onViewAll,
  onSelect,
  selected,
  hideSectionTitle,
}: {
  title: string;
  orders: Order[];
  loading: boolean;
  limit?: number;
  onViewAll?: () => void;
  onSelect: (order: Order | null) => void;
  selected: Order | null;
  hideSectionTitle?: boolean;
}) {
  const confirmedOrders = orders.filter(isConfirmedOrder);
  const visible = limit ? confirmedOrders.slice(0, limit) : confirmedOrders;
  const hasMore = limit != null && confirmedOrders.length > limit;
  const isEmpty = !loading && !selected && visible.length === 0;

  return (
    <section>
      {!hideSectionTitle && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className={accountSectionTitle}>{title}</h2>
        </div>
      )}

      {isEmpty ? (
        <EmptyCard
          icon={<ShoppingBag className="h-10 w-10 text-neutral-300" strokeWidth={1.5} />}
          title="No orders yet"
          description="When you make a purchase, your orders will appear here."
          actionLabel="Start shopping"
          actionTo="/products"
        />
      ) : (
      <div className={accountCard}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#7c3aed]" />
            <p className={accountMuted}>Loading your orders…</p>
          </div>
        ) : selected ? (
          <div className="p-4 md:p-6">
            <OrderDetail order={selected} onBack={() => onSelect(null)} />
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {visible.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => onSelect(order)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-neutral-50 md:px-6 md:py-5"
                >
                  <div className="min-w-0">
                    <span className={`block truncate font-mono font-semibold text-neutral-900 ${accountBody}`}>
                      {order.order_number || `#${order.id.slice(0, 8)}`}
                    </span>
                    <p className={`mt-1 ${accountCaption}`}>{formatDate(order.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-semibold text-neutral-900 ${accountBody}`}>{money(order.total)}</p>
                    <span className={`${accountCaption} font-medium text-[#7c3aed]`}>View details</span>
                  </div>
                </button>
            ))}
            {hasMore && onViewAll && (
              <div className="border-t border-neutral-100 px-4 py-3 text-center md:px-6">
                <button type="button" onClick={onViewAll} className={`${accountLink} font-semibold`}>
                  View all {confirmedOrders.length} orders
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      )}
    </section>
  );
}

function OrderDetail({ order, onBack }: { order: Order; onBack: () => void }) {
  const { paymentLabel } = labelsForOrder(order);
  const addr = (order.shipping_address || {}) as Record<string, string>;
  const hasAddr = addr && Object.keys(addr).length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className={`mb-5 inline-flex items-center gap-1 font-semibold text-neutral-600 transition-colors hover:text-[#7c3aed] ${accountBody}`}
      >
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </button>

      <div className={`rounded-xl border border-neutral-200 bg-neutral-50/80 p-5 md:p-6`} data-reveal>
        <div className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className={`font-mono font-semibold text-neutral-900 ${accountBody}`}>
              {order.order_number || `#${order.id.slice(0, 8)}`}
            </h3>
            <p className={`mt-1 ${accountMuted}`}>{formatDate(order.created_at)}</p>
            <p className={`mt-1 font-semibold text-[#7c3aed] ${accountBody}`}>
              {paymentLabel}
            </p>
          </div>
          <p className={`font-semibold text-neutral-900 ${accountSectionTitle}`}>{money(order.total)}</p>
        </div>

        {order.order_items && order.order_items.length > 0 && (
          <div className="mb-6">
            <h4 className={`mb-3 uppercase tracking-wider ${accountLabel}`}>Items</h4>
            <div className="space-y-2">
              {order.order_items.map((item, idx) => (
                <div key={item.id || idx} className={`flex justify-between gap-3 ${accountBody}`}>
                  <span className="min-w-0">
                    {item.product_name || item.product_id}
                    {item.variant_spec ? ` (${item.variant_spec})` : ""} × {item.quantity || 1}
                  </span>
                  <span className="shrink-0 font-medium">
                    {money((item.price || 0) * (item.quantity || 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className={`mb-2 uppercase tracking-wider ${accountLabel}`}>Shipping address</h4>
            {hasAddr ? (
              <div className={accountBody}>
                {formatSavedAddressLines({
                  id: "",
                  firstName: addr.firstName || "",
                  lastName: addr.lastName || "",
                  street: addr.street || "",
                  apartment: addr.apartment || "",
                  city: addr.city || "",
                  state: addr.state || "",
                  zipCode: addr.zipCode || "",
                  country: addr.country || "US",
                  phone: addr.phone || "",
                  isDefault: false,
                }).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : (
              <p className={accountMuted}>—</p>
            )}
          </div>

          <div>
            <h4 className={`mb-2 uppercase tracking-wider ${accountLabel}`}>Order summary</h4>
            <div className={`space-y-1 ${accountBody}`}>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{money(order.shipping_cost)}</span>
              </div>
              {(order.processing_fee || 0) > 0 && (
                <div className="flex justify-between">
                  <span>Processing</span>
                  <span>{money(order.processing_fee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
