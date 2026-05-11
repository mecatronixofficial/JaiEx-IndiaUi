"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/lib/toast";
import { handleApiError } from "@/lib/error-handler";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Img_Helper from "@/helper/img_helper";

type Step = "login" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();

  const { isAuthenticated, isLoading, login } = useAuth();

  /* =========================
     STATE
  ========================= */

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* =========================
     AUTO REDIRECT IF ALREADY LOGGED IN
  ========================= */

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  /* =========================
     LOGIN (FIXED FLOW)
  ========================= */

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) return setErrors({ email: "Email is required" });
    if (!password.trim())
      return setErrors({ password: "Password is required" });

    try {
      setLoading(true);

      // ✅ IMPORTANT: use AuthContext login (not raw API)
      await login(email, password);

      showToast.success("Login successful");

      router.replace("/dashboard");
    } catch (err: any) {
      setErrors({
        general: err?.response?.data?.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     FORGOT PASSWORD
  ========================= */

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) {
      return setErrors({ email: "Email is required" });
    }

    try {
      setLoading(true);

      // If you still use authApi here it's fine
      const { authApi } = await import("@/lib/api");
      await authApi.forgotPassword(email);

      showToast.success("Reset instructions sent");

      setStep("reset");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     RESET PASSWORD
  ========================= */

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!resetToken.trim()) {
      return setErrors({ resetToken: "OTP required" });
    }

    if (newPass.length < 8) {
      return setErrors({ newPass: "Minimum 8 characters required" });
    }

    try {
      setLoading(true);

      const { authApi } = await import("@/lib/api");

      await authApi.resetPassword({
        email,
        otp: resetToken,
        newPassword: newPass,
      });

      showToast.success("Password reset successful");

      setStep("login");
      setPassword("");
      setNewPass("");
      setResetToken("");
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOADING
  ========================= */

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="flex items-center gap-3 text-lg font-medium">
          <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-6 py-10">
      {/* Background Glow */}

      <div className="absolute top-[-120px] left-[-120px] h-[300px] w-[300px] rounded-full bg-orange-500/20 blur-3xl" />

      <div className="absolute bottom-[-120px] right-[-120px] h-[300px] w-[300px] rounded-full bg-orange-400/10 blur-3xl" />

      {/* Card */}

      <div
        className="
          relative z-10
          w-full max-w-md
          rounded-3xl
          border border-gray-200 dark:border-gray-800
          bg-white/80 dark:bg-gray-900/80
          backdrop-blur-xl
          shadow-2xl
          p-8
          animate-scale-up
        "
      >
        {/* Header */}

        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-inner ">
            <Image
              src={Img_Helper.logo.jai_logo}
              alt="jai-india"
              className="object-contain w-10 h-10"
            />
          </div>
          <p className="text-md font-semibold text-gray-500">
            File Transfer Service
          </p>

          <h1 className="font-display text-2xl font-semibold text-[var(--text)]">
            Jai Export Enterprises
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {step === "login" && "Sign in to your account"}

            {step === "forgot" && "Reset your password"}

            {step === "reset" && "Create a new password"}
          </p>
        </div>

        {/* LOGIN */}

        {step === "login" && (
          <form onSubmit={handleLogin} className="space-y-5">
            {errors.general && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {errors.general}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
              leftIcon={<Mail size={18} />}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                error={errors.password}
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPass(!showPass)}
                    className="
    h-8 w-8
    rounded-xl
    border-0
    bg-transparent
    shadow-none

    hover:bg-orange-500/10
    hover:text-orange-500

    dark:hover:bg-orange-500/10
  "
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </Button>
                }
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              fullWidth
              rightIcon={<ArrowRight size={18} />}
            >
              Sign In
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setStep("forgot")}
            >
              Forgot Password?
            </Button>
          </form>
        )}

        {/* FORGOT PASSWORD */}

        {step === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              error={errors.email}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              fullWidth
            >
              Send Reset Link
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => setStep("login")}
            >
              ← Back to login
            </Button>
          </form>
        )}

        {/* RESET PASSWORD */}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <Input
              label="Reset Token"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Enter OTP"
              error={errors.resetToken}
            />

            <Input
              label="New Password"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Create new password"
              error={errors.newPass}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              fullWidth
            >
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
