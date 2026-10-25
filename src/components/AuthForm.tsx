import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { toast } from "sonner";
import { CTA_GRADIENT } from "@/lib/account-ui";
import {
  AUTH_HERO_VIAL,
  preloadAuthHeroImages,
} from "@/lib/auth-hero";

type Mode = "login" | "signup";

const FIELD_CLASS = "auth-field";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="auth-label">
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  );
}

export function AuthForm({
  initialMode,
  redirectTo,
}: {
  initialMode: Mode;
  redirectTo?: string;
}) {
  const navigate = useNavigate();

  const postAuthDestination = redirectTo ?? "/account";
  const authSearch = redirectTo ? { redirect: redirectTo } : undefined;
  // Computed lazily inside client-only handlers so SSR never references `window`.
  const getOAuthRedirectTo = () =>
    redirectTo ? `${window.location.origin}${redirectTo}` : window.location.origin;

  useEffect(() => {
    preloadAuthHeroImages();
  }, []);
  const isLogin = initialMode === "login";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [remember, setRemember] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!isLogin) {
      if (!acceptTerms) {
        toast.error("Please accept the Terms of Service and Privacy Policy.");
        return;
      }
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        toast.error("Passwords don't match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back");
        navigate({ to: postAuthDestination });
      } else {
        const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getOAuthRedirectTo(),
            data: {
              ...(fullName ? { full_name: fullName } : {}),
              marketing_opt_in: marketingOptIn,
            },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) {
          toast.success("Account created — you're all set!");
          navigate({ to: postAuthDestination });
        } else {
          setSentTo(email);
          toast.success("Account created. Check your inbox to confirm your email.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getOAuthRedirectTo() },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex min-h-screen flex-col font-sans text-neutral-900 antialiased">
      <Header opaque />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left — floating Simpletide vial over the pastel mist */}
        <div
          className="relative hidden min-h-[280px] overflow-hidden bg-white/30 lg:flex lg:w-[44%] lg:flex-none"
          aria-hidden
          data-reveal="fade"
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

        {/* Right — form panel */}
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
                  We sent a confirmation link to{" "}
                  <span className="font-semibold text-neutral-800">{sentTo}</span>. Click it to verify
                  your account, then sign in.
                </p>
                <Link
                  to="/auth/login"
                  search={authSearch}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-[15px] font-semibold ${CTA_GRADIENT}`}
                >
                  Back to sign in
                </Link>
                <p className="mt-4 text-xs text-neutral-400">
                  Didn&apos;t get it? Check your spam folder, or email support@simpletide.com
                </p>
              </div>
            ) : (
              <>
                <header className="mb-8" data-reveal>
                  <h1 className="text-[1.75rem] font-bold leading-tight text-neutral-900 sm:text-[2rem]">
                    {isLogin ? "Login" : "Sign Up"}
                  </h1>
                  {!isLogin && (
                    <p className="mt-2 text-[15px] font-normal leading-snug text-neutral-500">
                      Create your account to get started.
                    </p>
                  )}
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <FieldLabel required>First name</FieldLabel>
                        <input
                          type="text"
                          required
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={FIELD_CLASS}
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <FieldLabel required>Last name</FieldLabel>
                        <input
                          type="text"
                          required
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={FIELD_CLASS}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={FIELD_CLASS}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <FieldLabel>Password</FieldLabel>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={isLogin ? undefined : 8}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${FIELD_CLASS} pr-11`}
                        placeholder={isLogin ? "Enter your password" : "Create a password"}
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

                  {!isLogin && (
                    <div>
                      <FieldLabel required>Confirm password</FieldLabel>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          autoComplete="new-password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          className={`${FIELD_CLASS} pr-11`}
                          placeholder="Confirm your password"
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
                  )}

                  {isLogin && (
                    <div className="flex items-center justify-between text-[14px]">
                      <label className="flex cursor-pointer items-center gap-2 text-neutral-500">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 accent-[#a78bfa] text-[#8b5cf6] focus:ring-[#a78bfa]"
                        />
                        Remember me
                      </label>
                      <a href="#" className="font-medium text-[#8b5cf6] hover:underline">
                        Forgot password?
                      </a>
                    </div>
                  )}

                  {!isLogin && (
                    <div className="space-y-4">
                      <label className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-snug text-neutral-500">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-[#8b5cf6] focus:ring-[#a78bfa]"
                        />
                        <span>
                          I agree to the{" "}
                          <a href="#" className="font-medium text-[#8b5cf6] hover:underline">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="font-medium text-[#8b5cf6] hover:underline">
                            Privacy Policy
                          </a>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-2.5 text-[14px] leading-snug text-neutral-500">
                        <input
                          type="checkbox"
                          checked={marketingOptIn}
                          onChange={(e) => setMarketingOptIn(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-[#8b5cf6] focus:ring-[#a78bfa]"
                        />
                        <span>
                          Send me research updates, new product alerts, and exclusive offers from
                          Simpletide. Unsubscribe anytime.
                        </span>
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`auth-btn-primary ${CTA_GRADIENT}`}
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading
                      ? isLogin
                        ? "Signing in…"
                        : "Creating account…"
                      : isLogin
                        ? "Sign in"
                        : "Sign up"}
                  </button>
                </form>

                <div className="my-7 flex items-center gap-3">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-[13px] font-normal lowercase text-neutral-400">or</span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                <div className="space-y-3">
                  <button type="button" onClick={() => void handleOAuth("google")} className="auth-btn-social">
                    <GoogleIcon />
                    {isLogin ? "Sign in with Google" : "Sign up with Google"}
                  </button>
                </div>

                <p className="mt-8 text-[15px] text-neutral-500">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Link
                    to={isLogin ? "/auth/signup" : "/auth/login"}
                    search={authSearch}
                    className="font-medium text-[#8b5cf6] hover:underline"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </Link>
                </p>
              </>
            )}
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C40.9 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
