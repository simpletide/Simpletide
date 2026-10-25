import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { AUTH_HERO_HEAD_LINKS } from "@/lib/auth-hero";
import { validateAuthSearch } from "@/lib/auth-redirect";
import { pageSeoHead } from "@/lib/site-seo";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/auth/signup")({
  validateSearch: validateAuthSearch,
  head: () => {
    const seo = pageSeoHead({
      path: "/auth/signup",
      title: "Create Account — Simpletide",
      description: "Create your Simpletide account to access premium research compounds.",
      noindex: true,
    });
    return { ...seo, links: [...(seo.links ?? []), ...AUTH_HERO_HEAD_LINKS] };
  },
  component: SignupPage,
});

function SignupPage() {
  const { redirect } = Route.useSearch();
  useReveal();
  return <AuthForm initialMode="signup" redirectTo={redirect} />;
}
