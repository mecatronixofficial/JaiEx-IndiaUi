"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Lock,
  Bell,
  Shield,
  Check,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  Building2,
  ChevronRight,
  User as UserIcon,
  Globe,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Tab = "password" | "notifications" | "security" | "preferences";

interface PasswordRule {
  label: string;
  test: (v: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[\W_]/.test(v) },
];

export default function SettingsPage() {
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("password");

  /* =========================
     PASSWORD STATE
  ========================= */
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  /* =========================
     DERIVED
  ========================= */
  const passedRules = useMemo(
    () => PASSWORD_RULES.filter((r) => r.test(newPass)).length,
    [newPass],
  );

  const strengthLabel = useMemo(() => {
    if (newPass.length === 0) return "";
    if (passedRules <= 2) return "Weak";
    if (passedRules === 3) return "Fair";
    if (passedRules === 4) return "Good";
    return "Strong";
  }, [newPass.length, passedRules]);

  const strengthColor = useMemo(() => {
    if (passedRules <= 2) return "bg-red-500";
    if (passedRules === 3) return "bg-yellow-500";
    if (passedRules === 4) return "bg-blue-500";
    return "bg-green-500";
  }, [passedRules]);

  /* =========================
     SAVE PASSWORD
  ========================= */
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setPassErrors({});

    if (!oldPass) {
      return setPassErrors({ oldPass: "Current password required" });
    }
    if (passedRules < PASSWORD_RULES.length) {
      return setPassErrors({
        newPass: "Password does not meet all requirements",
      });
    }
    if (newPass !== confirmPass) {
      return setPassErrors({ confirmPass: "Passwords do not match" });
    }
    if (oldPass === newPass) {
      return setPassErrors({
        newPass: "New password must be different from current",
      });
    }

    try {
      setSavingPass(true);
      await usersApi.updatePassword({
        currentPassword: oldPass,
        newPassword: newPass,
      });
      showToast.success("Password updated successfully");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSavingPass(false);
    }
  }

  /* =========================
     TABS CONFIG
  ========================= */
  const tabs = [
    {
      id: "password",
      label: "Password",
      icon: Lock,
      desc: "Account security",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      desc: "Email & alerts",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      desc: "Sessions & 2FA",
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: Globe,
      desc: "Language & theme",
    },
  ] as const;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in mx-auto px-4 py-6 sm:px-6">
          {/* ============== HEADER ============== */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
              Manage account security and preferences
            </p>
          </div>

          {/* Quick link to profile (since we removed the profile tab) */}
          <Card className="mb-6 p-4">
            <Link
              href="/profile"
              className="group flex items-center justify-between gap-4 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <UserIcon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Looking for profile info?
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    Update your name, email, phone, and department on the
                    profile page
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
              />
            </Link>
          </Card>

          {/* ============== LAYOUT ============== */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
            {/* ============== SIDEBAR ============== */}
            <aside>
              <Card className="p-2 lg:sticky lg:top-6">
                <nav className="space-y-1">
                  {tabs.map((item) => {
                    const Icon = item.icon;
                    const active = tab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-200 ${
                          active
                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-9 h-9 rounded-md flex-shrink-0 transition-colors ${
                            active
                              ? "bg-white/15"
                              : "bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700"
                          }`}
                        >
                          <Icon size={17} />
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.label}</div>
                          <div
                            className={`text-xs mt-0.5 ${
                              active
                                ? "text-white/80"
                                : "text-gray-500 dark:text-gray-500"
                            }`}
                          >
                            {item.desc}
                          </div>
                        </div>

                        <ChevronRight
                          size={16}
                          className={`flex-shrink-0 transition-transform ${
                            active
                              ? "opacity-100"
                              : "opacity-0 -translate-x-1 group-hover:opacity-50 group-hover:translate-x-0"
                          }`}
                        />
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            {/* ============== CONTENT ============== */}
            <div className="min-w-0">
              {/* ===================== PASSWORD TAB ===================== */}
              {tab === "password" && (
                <Card className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Change Password
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose a strong password to keep your account secure
                    </p>
                  </div>

                  <form onSubmit={savePassword} className="space-y-5" noValidate>
                    {/* Current password */}
                    <div className="relative">
                      <Input
                        label="Current Password"
                        type={showOldPass ? "text" : "password"}
                        value={oldPass}
                        onChange={(e) => setOldPass(e.target.value)}
                        error={passErrors.oldPass}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPass((s) => !s)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        tabIndex={-1}
                        aria-label={
                          showOldPass ? "Hide password" : "Show password"
                        }
                      >
                        {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* New password */}
                    <div>
                      <div className="relative">
                        <Input
                          label="New Password"
                          type={showNewPass ? "text" : "password"}
                          value={newPass}
                          onChange={(e) => setNewPass(e.target.value)}
                          error={passErrors.newPass}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass((s) => !s)}
                          className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          tabIndex={-1}
                          aria-label={
                            showNewPass ? "Hide password" : "Show password"
                          }
                        >
                          {showNewPass ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>

                      {/* Strength meter */}
                      {newPass.length > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Password strength
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                passedRules <= 2
                                  ? "text-red-500"
                                  : passedRules === 3
                                  ? "text-yellow-500"
                                  : passedRules === 4
                                  ? "text-blue-500"
                                  : "text-green-500"
                              }`}
                            >
                              {strengthLabel}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors ${
                                  i < passedRules
                                    ? strengthColor
                                    : "bg-gray-200 dark:bg-gray-700"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm */}
                    <div className="relative">
                      <Input
                        label="Confirm New Password"
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        error={passErrors.confirmPass}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass((s) => !s)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        tabIndex={-1}
                        aria-label={
                          showConfirmPass ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirmPass ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {/* Rules checklist */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                        Password requirements
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PASSWORD_RULES.map((rule) => {
                          const passed = rule.test(newPass);
                          return (
                            <li
                              key={rule.label}
                              className={`flex items-center gap-2 text-sm transition-colors ${
                                passed
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-500 dark:text-gray-500"
                              }`}
                            >
                              <span
                                className={`flex items-center justify-center w-4 h-4 rounded-full ${
                                  passed
                                    ? "bg-green-100 dark:bg-green-900/40"
                                    : "bg-gray-200 dark:bg-gray-800"
                                }`}
                              >
                                {passed ? (
                                  <Check size={11} />
                                ) : (
                                  <X size={11} className="opacity-40" />
                                )}
                              </span>
                              {rule.label}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        loading={savingPass}
                        leftIcon={<Lock size={16} />}
                      >
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* ===================== NOTIFICATIONS TAB ===================== */}
              {tab === "notifications" && (
                <Card className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notification Preferences
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Choose what you want to be notified about
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        title: "File Shared",
                        desc: "When someone shares a file with you",
                        icon: Mail,
                      },
                      {
                        title: "Upload Complete",
                        desc: "When your uploads finish processing",
                        icon: Check,
                      },
                      {
                        title: "Download Activity",
                        desc: "When your files are downloaded",
                        icon: Smartphone,
                      },
                      {
                        title: "System Updates",
                        desc: "Maintenance and platform updates",
                        icon: Building2,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <label
                          key={item.title}
                          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex-shrink-0">
                            <Icon size={18} />
                          </span>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.desc}
                            </p>
                          </div>

                          <span className="relative inline-flex flex-shrink-0">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="peer sr-only"
                            />
                            <span className="h-6 w-11 rounded-full bg-gray-300 dark:bg-gray-700 peer-checked:bg-orange-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-5" />
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                    Notification preferences are not yet saved to the server.
                  </p>
                </Card>
              )}

              {/* ===================== SECURITY TAB ===================== */}
              {tab === "security" && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <Shield size={20} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              Two-Factor Authentication
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Add an extra layer of security to your account
                              with OTP verification
                            </p>
                          </div>
                          <Button variant="outline" className="flex-shrink-0">
                            Enable 2FA
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex-shrink-0">
                        <Smartphone size={20} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              Active Sessions
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              View and revoke devices currently signed in to
                              your account
                            </p>
                          </div>
                          <Button variant="secondary" className="flex-shrink-0">
                            View Sessions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10">
                    <div className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex-shrink-0">
                        <AlertTriangle size={20} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
                              Delete Account
                            </h3>
                            <p className="mt-1 text-sm text-red-600/80 dark:text-red-300/70">
                              Permanently delete your account and all associated
                              files. This action cannot be undone.
                            </p>
                          </div>
                          <Button variant="danger" className="flex-shrink-0">
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* ===================== PREFERENCES TAB ===================== */}
              {tab === "preferences" && (
                <Card className="p-6 sm:p-8">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Preferences
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Personalize your workspace
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Language
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Display language for the interface
                        </p>
                      </div>
                      <select
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        defaultValue="en"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                        <option value="ta">தமிழ்</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Time format
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Choose 12-hour or 24-hour clock
                        </p>
                      </div>
                      <select
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        defaultValue="12"
                      >
                        <option value="12">12-hour</option>
                        <option value="24">24-hour</option>
                      </select>
                    </div>
                  </div>

                  <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                    Preferences are not yet saved to the server.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}