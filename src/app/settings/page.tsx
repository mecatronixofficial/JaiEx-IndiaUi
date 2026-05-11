"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { User, Lock, Bell, Shield, Save } from "lucide-react";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Card from "@/components/ui/Card";
import { Avatar } from "@/components/ui";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Tab = "profile" | "password" | "notifications" | "security";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [tab, setTab] = useState<Tab>("profile");

  /* =========================
     PROFILE
  ========================= */

  const [name, setName] = useState(user?.name || "");

  const [email, setEmail] = useState(user?.email || "");

  const [savingProfile, setSavingProfile] = useState(false);

  /* =========================
     PASSWORD
  ========================= */

  const [oldPass, setOldPass] = useState("");

  const [newPass, setNewPass] = useState("");

  const [confirmPass, setConfirmPass] = useState("");

  const [savingPass, setSavingPass] = useState(false);

  const [passErrors, setPassErrors] = useState<Record<string, string>>({});

  /* =========================
     SAVE PROFILE
  ========================= */

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      return showToast.error("error");
    }

    try {
      setSavingProfile(true);

      await usersApi.update(user!.id, {
        name,
        email,
      });

      await refreshUser();

      showToast.success("Profile updated successfully");
    } catch (err) {
      handleApiError(err);
    } finally {
      setSavingProfile(false);
    }
  }

  /* =========================
     SAVE PASSWORD
  ========================= */

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();

    setPassErrors({});

    if (!oldPass) {
      return setPassErrors({
        oldPass: "Current password required",
      });
    }

    if (!newPass || newPass.length < 8) {
      return setPassErrors({
        newPass: "Password must be at least 8 characters",
      });
    }

    if (newPass !== confirmPass) {
      return setPassErrors({
        confirmPass: "Passwords do not match",
      });
    }

    try {
      setSavingPass(true);

      await usersApi.updatePassword({
        oldPassword: oldPass,
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
     TABS
  ========================= */

  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: <User size={18} />,
    },
    {
      id: "password",
      label: "Password",
      icon: <Lock size={18} />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell size={18} />,
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield size={18} />,
    },
  ] as const;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in max-w-7xl mx-auto">
          {/* Header */}

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
              Settings
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Manage your account preferences and security
            </p>
          </div>

          {/* Layout */}

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            {/* Sidebar */}

            <Card className="p-3 h-fit">
              <div className="space-y-1">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`
                      w-full flex items-center gap-3
                      px-4 py-3 rounded-xl
                      text-sm font-medium
                      transition-all duration-200
                      ${
                        tab === item.id
                          ? `
                            bg-orange-500
                            text-white
                            shadow-accent
                          `
                          : `
                            text-gray-600
                            hover:bg-gray-100
                            dark:text-gray-300
                            dark:hover:bg-gray-800
                          `
                      }
                    `}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Content */}

            <div>
              {/* PROFILE */}

              {tab === "profile" && (
                <Card className="p-8">
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Profile Information
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Update your personal details
                    </p>
                  </div>

                  {/* User Card */}

                  <div
                    className="
                    flex items-center gap-5
                    p-5 rounded-2xl
                    bg-gray-50 dark:bg-gray-900
                    border border-gray-200 dark:border-gray-700
                    mb-8
                  "
                  >
                    <Avatar name={user?.name || ""} size={70} />

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user?.name}
                      </h3>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user?.email}
                      </p>

                      <span
                        className="
                        inline-flex mt-3
                        px-3 py-1 rounded-full
                        text-xs font-semibold uppercase tracking-wide
                        bg-orange-100 text-orange-700
                        dark:bg-orange-900/30 dark:text-orange-400
                      "
                      >
                        {user?.role}
                      </span>
                    </div>
                  </div>

                  {/* Form */}

                  <form onSubmit={saveProfile} className="space-y-5">
                    <Input
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        loading={savingProfile}
                        className="gap-2"
                      >
                        <Save size={16} />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* PASSWORD */}

              {tab === "password" && (
                <Card className="p-8">
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Change Password
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Keep your account secure
                    </p>
                  </div>

                  <form onSubmit={savePassword} className="space-y-5">
                    <Input
                      label="Current Password"
                      type="password"
                      value={oldPass}
                      onChange={(e) => setOldPass(e.target.value)}
                      error={passErrors.oldPass}
                    />

                    <Input
                      label="New Password"
                      type="password"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      error={passErrors.newPass}
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      error={passErrors.confirmPass}
                    />

                    <div
                      className="
                      p-4 rounded-xl
                      bg-orange-50
                      dark:bg-orange-900/20
                      border border-orange-200
                      dark:border-orange-800
                    "
                    >
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Password should contain at least 8 characters with
                        letters and numbers.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        loading={savingPass}
                        className="gap-2"
                      >
                        <Lock size={16} />
                        Update Password
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* NOTIFICATIONS */}

              {tab === "notifications" && (
                <Card className="p-8">
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notification Preferences
                    </h2>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Manage email and system notifications
                    </p>
                  </div>

                  <div className="space-y-5">
                    {[
                      {
                        title: "File Shared",
                        desc: "Notify when someone shares a file",
                      },
                      {
                        title: "Upload Complete",
                        desc: "Notify after uploads finish",
                      },
                      {
                        title: "Download Activity",
                        desc: "Notify when files are downloaded",
                      },
                      {
                        title: "System Updates",
                        desc: "Receive maintenance updates",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="
                          flex items-center justify-between
                          p-4 rounded-xl
                          border border-gray-200
                          dark:border-gray-700
                        "
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </h3>

                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.desc}
                          </p>
                        </div>

                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="peer sr-only"
                          />

                          <div
                            className="
                            h-6 w-11 rounded-full
                            bg-gray-300
                            peer-checked:bg-orange-500
                            after:absolute after:left-[2px] after:top-[2px]
                            after:h-5 after:w-5
                            after:rounded-full
                            after:bg-white
                            after:transition-all
                            peer-checked:after:translate-x-5
                          "
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* SECURITY */}

              {tab === "security" && (
                <div className="space-y-5">
                  <Card className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Two-Factor Authentication
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Add OTP verification for extra security
                        </p>
                      </div>

                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Active Sessions
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Manage logged-in devices
                        </p>
                      </div>

                      <Button variant="secondary">View Sessions</Button>
                    </div>
                  </Card>

                  <Card
                    className="
                    p-6 border-red-200
                    dark:border-red-800
                  "
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                          Delete Account
                        </h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Permanently delete your account and all files
                        </p>
                      </div>

                      <Button variant="danger">Delete</Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
