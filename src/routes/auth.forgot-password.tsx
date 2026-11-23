import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { CTA_GRADIENT } from "@/lib/account-ui";
import { AUTH_HERO_HEAD_LINKS, AUTH_HERO_VIAL, preloadAuthHeroImages } from "@/lib/auth-hero";
import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => {
    const seo = pageSeoHead({
      path: "/auth/forgot-password",
      title: "Forgot Password — Simpletide",
      description: "Request a password reset link for your Simpletide account.",
      noindex: true,
    });
    return { ...seo, links: [...(seo.links ?? []), ...AUTH_HERO_HEAD_LINKS] };
  },
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    preloadAuthHeroImages();
  }, []);

  const sendReset = async (targetEmail: string) => {
    const clean = targetEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSentTo(clean);
      toast.success("Password reset link sent — check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    await sendReset(email);
  };

  return (
    <div className="flex min-h-screen flex-col font-sans text-neutral-900 antialiased">
      <Header opaque />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div
          className="relative hidden min-h-[280px] overflow-hidden bg-white/30 lg:flex lg:w-[44%] lg:flex-none"
          aria-hidden
        >
          <div className="absolute inset-0 z-10 flex items-center justify-center -translate-y-[clamp(3rem,10vh,6rem)]">
            <div className="animate-auth-vial-float">
              <img
                src={AUTH_HERO_VIAL}
                alt=""
                className="max-h-[min(88vh,820px)] w-auto max-w-[98%] object-contain object-center drop-shadow-[0_28px_48px_rgba(167,139,250,0.22)]"
                loading="eager"
                fetchPriority="high"
                decoding="sync"
              />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-1 bg-white lg:w-[56%] lg:flex-none">
          <div className="flex w-full items-center py-10 pl-6 pr-6 sm:pl-8 sm:pr-10 lg:pl-[clamp(1.25rem,2.5vw,2rem)] lg:pr-[clamp(3.5rem,11vw,9rem)] xl:pr-[clamp(4.5rem,13vw,11rem)]">
            <div className="w-full max-w-[440px]">
              {sentTo ? (
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#a78bfa]/10 text-[#8b5cf6]">
                    <MailCheck className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Check your inbox</h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">
                    If an account exists for{" "}
                    <span className="font-semibold text-neutral-800">{sentTo}</span>, we sent a
                    password reset link. Open it to choose a new password.
                  </p>
                  <Link
                    to="/auth/login"
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[15px] font-semibold ${CTA_GRADIENT}`}
                  >
                    Back to sign in
                  </Link>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void sendReset(sentTo)}
                    className="mt-4 text-xs font-medium text-[#8b5cf6] hover:underline disabled:opacity-50"
                  >
                    {loading ? "Sending again…" : "Didn't receive it? Send link again"}
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>

                  <header className="mb-8">
                    <h1 className="text-[1.75rem] font-bold leading-tight text-neutral-900 sm:text-[2rem]">
                      Reset password
                    </h1>
                    <p className="mt-2 text-[15px] font-normal leading-snug text-neutral-500">
                      Enter the email on your Simpletide account and we&apos;ll send you a link to set a new password.
                    </p>
                  </header>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="auth-label" htmlFor="forgot-email">
                        Email
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="auth-field"
                        placeholder="Enter your email"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`auth-btn-primary ${CTA_GRADIENT}`}
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {loading ? "Sending link…" : "Send reset link"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
