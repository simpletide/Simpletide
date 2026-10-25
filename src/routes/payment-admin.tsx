import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { canAccessPaymentAdmin } from "@/lib/admin";
import { Header } from "@/components/Header";
import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/payment-admin")({
  head: () =>
    pageSeoHead({
      path: "/payment-admin",
      title: "Payment Admin — Simpletide",
      description: "Simpletide payment administration.",
      noindex: true,
    }),
  component: PaymentAdminRedirectPage,
});

/** Legacy URL — admins land in My Profile → Payment Admin tab inside account. */
function PaymentAdminRedirectPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/login" });
    } else if (canAccessPaymentAdmin(user.email)) {
      navigate({ to: "/account", search: { section: "profile", profileTab: "payment-admin" }, replace: true });
    } else {
      navigate({ to: "/account", search: { section: "profile", profileTab: "profile" }, replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header opaque />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b5cf6]" />
      </div>
    </div>
  );
}
