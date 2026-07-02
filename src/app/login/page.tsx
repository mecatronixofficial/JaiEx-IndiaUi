"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Shield,
  Globe,
  CheckCircle2,
  Home,
  Sparkles,
  Check,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import { handleApiError } from "@/lib/error-handler";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Img_Helper from "@/helper/img_helper";

type Step = "login" | "forgot" | "reset";

/* ─────────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────────── */

function getStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak", color: "bg-red-500" };
  if (s <= 2) return { score: s, label: "Fair", color: "bg-yellow-500" };
  if (s <= 3) return { score: s, label: "Good", color: "bg-blue-500" };
  return { score: s, label: "Strong", color: "bg-emerald-500" };
}

/* ─────────────────────────────────────────────
   OTP INPUT
───────────────────────────────────────────── */

function OtpInput({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    const next = value.substring(0, i) + char + value.substring(i + 1);
    onChange(next.substring(0, 6));
    if (i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (value[i]) {
        onChange(value.substring(0, i) + value.substring(i + 1));
      } else if (i > 0) {
        onChange(value.substring(0, i - 1) + value.substring(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div>
      <div className="flex gap-2.5 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            aria-label={`OTP digit ${i + 1}`}
            title={`OTP digit ${i + 1}`}
            placeholder="·"
            value={value[i] || ""}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`
              w-11 h-13 text-center text-lg font-bold
              rounded-2xl border-2 bg-white text-gray-900 dark:bg-zinc-900 dark:text-white
              transition-all duration-200 outline-none shadow-sm
              focus:ring-4
              ${error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                : value[i]
                  ? "border-orange-400 focus:border-orange-500 focus:ring-orange-500/15"
                  : "border-gray-200 hover:border-orange-300 focus:border-orange-500 focus:ring-orange-500/15 dark:border-zinc-700"
              }
            `}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-center text-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

const FEATURES = [
  { Icon: Shield, label: "End-to-end encryption" },
  { Icon: Globe, label: "Access from anywhere" },
  { Icon: Lock, label: "Granular access control" },
];

const STATS = [
  { value: "2M+", label: "Files transferred" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "AES-256", label: "Encryption" },
];

const TRUST = [
  { Icon: Shield, label: "SSL secured" },
  { Icon: Zap, label: "AES-256" },
  { Icon: CheckCircle2, label: "SOC 2 ready" },
];

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  const strength = newPass ? getStrength(newPass) : null;

  function goToStep(s: Step) {
    setErrors({});
    setStep(s);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) return setErrors({ email: "Email is required" });
    if (!password.trim()) return setErrors({ password: "Password is required" });
    try {
      setLoading(true);
      // AuthContext.login() calls router.replace("/dashboard") internally — no need to do it here
      await login(email, password);
      showToast.success("Login successful");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || "Invalid email or password";
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) return setErrors({ email: "Email is required" });
    try {
      setLoading(true);
      const { authApi } = await import("@/lib/api");
      await authApi.forgotPassword(email);
      showToast.success("Reset instructions sent");
      setStep("reset");
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    if (resetToken.length < 6) return setErrors({ resetToken: "Enter all 6 digits" });
    if (newPass.length < 8) return setErrors({ newPass: "Minimum 8 characters required" });
    try {
      setLoading(true);
      const { authApi } = await import("@/lib/api");
      await authApi.resetPassword({ email, otp: resetToken, newPassword: newPass });
      showToast.success("Password reset successful");
      setStep("login");
      setPassword("");
      setNewPass("");
      setResetToken("");
    } catch (err: unknown) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  /* ── Loading screen ── */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-400 tracking-wide dark:text-gray-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">

      {/* ══════════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[46%] flex-col overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400">

        {/* Grid overlay */}
        <div className="login-grid-overlay absolute inset-0 opacity-[0.06]" />

        {/* Glow blobs */}
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 -right-28 h-80 w-80 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute top-1/2 -right-10 h-64 w-64 -translate-y-1/2 rounded-full bg-orange-300/20 blur-2xl" />

        <div className="relative z-10 flex h-full flex-col p-10">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shadow-lg">
                <Image
                  src={Img_Helper.logo.jai_logo}
                  alt="Jai India"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-white">
                  JAI INDIA
                </p>
                <p className="text-[11px] text-white/55">File Transfer Service</p>
              </div>
            </div>

            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/30"
            >
              <Home size={14} />
              Home
            </Link>
          </div>

          {/* Center */}
          <div className="flex flex-1 flex-col justify-center gap-10 py-10">

            {/* Badge + headline */}
            <div className="space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-semibold backdrop-blur-sm ring-1 ring-white/30">
                <Sparkles size={14} />
                Enterprise-grade file transfer
              </span>

              <div>
                <h1 className="text-[2.7rem] font-extrabold leading-[1.12] tracking-tight text-white">
                  Send. Store.
                  <br />
                  <span className="text-white/75">Share securely.</span>
                </h1>
                <p className="mt-4 max-w-[280px] text-[15px] leading-relaxed text-white/60">
                  A modern workspace for your team — encrypted at rest, audited end to end, and built for scale.
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="space-y-2.5">
              {FEATURES.map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon size={15} />
                  </span>
                  {label}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center rounded-2xl bg-white/10 py-4 text-center ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <p className="text-xl font-extrabold text-white">{value}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>© 2026 Jai Export Enterprises</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="transition hover:text-white/70">Privacy</Link>
              <Link href="/terms" className="transition hover:text-white/70">Terms</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          RIGHT PANEL
      ══════════════════════════════════════ */}
      <div className="login-right-bg flex flex-1 items-center justify-center px-5 py-12 dark:bg-zinc-950 lg:px-14">
        <div className="animate-fade-in w-full max-w-md">
          {/* Card */}
          <div className="rounded-3xl bg-white p-8 shadow-xl shadow-gray-200/80 ring-1 ring-gray-100 dark:bg-zinc-900 dark:shadow-none dark:ring-zinc-800 lg:p-10">

            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 shadow-lg shadow-orange-500/30">
                <Image
                  src={Img_Helper.logo.jai_logo}
                  alt="Jai India"
                  width={22}
                  height={22}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Jai India</span>
            </div>

            {/* Multi-step indicator */}
            {step !== "login" && (
              <div className="mb-8 flex items-center gap-2">
                {(["forgot", "reset"] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        step === s || (s === "forgot" && step === "reset")
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                          : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-gray-500"
                      }`}
                    >
                      {s === "forgot" && step === "reset" ? (
                        <Check size={13} strokeWidth={3} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    {i === 0 && (
                      <div
                        className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step === "reset" ? "bg-orange-500" : "bg-gray-200 dark:bg-zinc-700"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Header */}
            <div className="mb-7">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-900/40">
                <Lock size={11} />
                {step === "login"
                  ? "Secure sign-in"
                  : step === "forgot"
                  ? "Account recovery — step 1"
                  : "Account recovery — step 2"}
              </span>

              <h1 className="text-[1.85rem] font-bold tracking-tight text-gray-900 dark:text-white">
                {step === "login" && "Welcome back"}
                {step === "forgot" && "Forgot password?"}
                {step === "reset" && "Create new password"}
              </h1>

              <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {step === "login" && "Sign in to access your secure workspace."}
                {step === "forgot" && "Enter your email and we'll send reset instructions."}
                {step === "reset" && (
                  <>
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{email || "your email"}</span>.
                  </>
                )}
              </p>
            </div>

            {/* ── LOGIN ── */}
            {step === "login" && (
              <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                {errors.general && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900/50 dark:bg-red-950/30">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500">
                      <span className="text-[10px] font-extrabold text-white">!</span>
                    </div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{errors.general}</p>
                  </div>
                )}

                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  error={errors.email}
                  leftIcon={<Mail size={16} />}
                  autoComplete="email"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={errors.password}
                  leftIcon={<Lock size={16} />}
                  autoComplete="current-password"
                />

                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer select-none items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                        rememberMe
                          ? "border-orange-500 bg-orange-500 shadow-md shadow-orange-500/30"
                          : "border-gray-300 bg-white dark:border-zinc-600 dark:bg-zinc-800"
                      }`}
                    >
                      {rememberMe && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => goToStep("forgot")}
                    className="text-sm font-semibold text-orange-500 transition hover:text-orange-600"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  fullWidth
                  rightIcon={<ArrowRight size={18} />}
                  rounded="xl"
                >
                  Sign In
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-medium text-gray-400 dark:bg-zinc-900 dark:text-gray-500">
                      Don&apos;t have an account?
                    </span>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Contact your{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">administrator</span>{" "}
                  to get access.
                </p>
              </form>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {step === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-5 animate-fade-in">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  error={errors.email}
                  leftIcon={<Mail size={16} />}
                  autoComplete="email"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  fullWidth
                  rightIcon={<ArrowRight size={18} />}
                  rounded="xl"
                >
                  Send Reset Instructions
                </Button>

                <button
                  type="button"
                  onClick={() => goToStep("login")}
                  className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft size={15} />
                  Back to sign in
                </button>
              </form>
            )}

            {/* ── RESET PASSWORD ── */}
            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-6 animate-fade-in">
                <div className="space-y-3">
                  <label className="block text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Enter 6-digit OTP
                  </label>
                  <OtpInput
                    value={resetToken}
                    onChange={setResetToken}
                    error={errors.resetToken}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    label="New password"
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Create a strong password"
                    error={errors.newPass}
                    leftIcon={<Lock size={16} />}
                    autoComplete="new-password"
                  />

                  {newPass && strength && (
                    <div className="space-y-1.5 px-0.5">
                      <div className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < strength.score ? strength.color : "bg-gray-200 dark:bg-zinc-700"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Strength:{" "}
                        <span
                          className={
                            strength.score <= 1
                              ? "font-semibold text-red-500"
                              : strength.score <= 2
                              ? "font-semibold text-yellow-500"
                              : strength.score <= 3
                              ? "font-semibold text-blue-500"
                              : "font-semibold text-emerald-500"
                          }
                        >
                          {strength.label}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  fullWidth
                  rightIcon={<CheckCircle2 size={18} />}
                  rounded="xl"
                >
                  Reset Password
                </Button>

                <button
                  type="button"
                  onClick={() => goToStep("login")}
                  className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <ArrowLeft size={15} />
                  Back to sign in
                </button>
              </form>
            )}

            {/* Trust row */}
            {step === "login" && (
              <div className="mt-6 flex items-center justify-center gap-5">
                {TRUST.map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                    <Icon size={13} />
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
