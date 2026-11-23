import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { getSupabase } from "@/lib/supabase-lazy";
import { useAuth } from "@/lib/auth-context";
import { CTA_GRADIENT } from "@/lib/account-ui";
import { AUTH_HERO_HEAD_LINKS, AUTH_HERO_VIAL, preloadAuthHeroImages } from "@/lib/auth-hero";
import { pageSeoHead } from "@/lib/site-seo";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => {
    const seo = pageSeoHead({
      path: "/auth/reset-password",
      title: "Set New Password — Simpletide",
      description: "Choose a new password for your Simpletide account.",
      noindex: true,
    });
    return { ...seo, links: [...(seo.links ?? []), ...AUTH_HERO_HEAD_LINKS] };
  },
  component: ResetPasswordPage,
});

type RecoveryState = "checking" | "ready" | "invalid" | "done";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { syncSession } = useAuth();
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    preloadAuthHeroImages();

    let active = true;
    let unsubscribe: (() => void) | undefined;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hasHashRecovery =
      hashParams.get("type") === "recovery" || Boolean(hashParams.get("access_token"));

    const resolveSession = async () => {
      try {
        const supabase = await getSupabase();
        if (!active) return;

        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
          if (!active) return;
          if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
            if (session) syncSession(session);
            setState("ready");
          }
        });
        unsubscribe = () => sub.subscription.unsubscribe();

        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });
          if (!active) return;
          if (error) {
            setState("invalid");
            return;
          }
          if (data.session) syncSession(data.session);
          setState("ready");
          return;
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;
          if (error) {
            setState("invalid");
            return;
          }
          if (data.session) syncSession(data.session);
          setState("ready");
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (data.session) {
          syncSession(data.session);
          setState("ready");
          return;
        }

        // If the URL carries a hash recovery token, give supabase-js a moment to finish parsing it.
        if (hasHashRecovery) {
          setTimeout(async () => {
            if (!active) return;
            const retry = await supabase.auth.getSession();
            if (!active) return;
            if (retry.data.session) syncSession(retry.data.session);
            setState(retry.data.session ? "ready" : "invalid");
          }, 800);
          return;
        }

        setState("invalid");
      } catch {
        if (active) setState("invalid");
      }
    };

    void resolveSession();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = await getSupabase();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) syncSession(data.session);
      setState("done");
      toast.success("Password updated!");
      setTimeout(() => {
        navigate({ to: "/account", search: { section: "dashboard", profileTab: "profile" } });
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password. Please try again.");
    } finally {
      setSaving(false);
    }
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
              {state === "checking" && (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#8b5cf6]" />
                  <p className="mt-3 text-sm text-neutral-500">Verifying your reset link…</p>
                </div>
              )}

              {state === "invalid" && (
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Reset link expired
                  </h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">
                    This password reset link is invalid or has already been used. Request a fresh link to continue.
                  </p>
                  <Link
                    to="/auth/forgot-password"
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[15px] font-semibold ${CTA_GRADIENT}`}
                  >
                    Request a new reset link
                  </Link>
                  <Link
                    to="/auth/login"
                    className="mt-4 inline-block text-sm font-medium text-[#8b5cf6] hover:underline"
                  >
                    Back to sign in
                  </Link>
                </div>
              )}

              {state === "done" && (
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Password updated
                  </h1>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">
                    Your password has been changed. Redirecting you to your account…
                  </p>
                  <Link
                    to="/account"
                    search={{ section: "dashboard", profileTab: "profile" }}
                    className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[15px] font-semibold ${CTA_GRADIENT}`}
                  >
                    Go to my account
                  </Link>
                </div>
              )}

              {state === "ready" && (
                <>
                  <header className="mb-8">
                    <h1 className="text-[1.75rem] font-bold leading-tight text-neutral-900 sm:text-[2rem]">
                      Set a new password
                    </h1>
                    <p className="mt-2 text-[15px] font-normal leading-snug text-neutral-500">
                      Choose a strong password of at least 8 characters for your Simpletide account.
                    </p>
                  </header>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="auth-label" htmlFor="new-password">
                        New password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="auth-field pr-11"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-[#8b5cf6]"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="auth-label" htmlFor="confirm-new-password">
                        Confirm new password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-new-password"
                          type={showConfirm ? "text" : "password"}
                          required
                          minLength={8}
                          autoComplete="new-password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className="auth-field pr-11"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-[#8b5cf6]"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className={`auth-btn-primary ${CTA_GRADIENT}`}
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                      {saving ? "Updating password…" : "Update password"}
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
