import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { AUTH_HERO_HEAD_LINKS } from "@/lib/auth-hero";
import { validateAuthSearch } from "@/lib/auth-redirect";
import { pageSeoHead } from "@/lib/site-seo";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/auth/login")({
  validateSearch: validateAuthSearch,
  head: () => {
    const seo = pageSeoHead({
      path: "/auth/login",
      title: "Log In — Simpletide",
      description: "Sign in to your Simpletide account to access premium research compounds.",
      noindex: true,
    });
    return { ...seo, links: [...(seo.links ?? []), ...AUTH_HERO_HEAD_LINKS] };
  },
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  useReveal();
  return <AuthForm initialMode="login" redirectTo={redirect} />;
}
