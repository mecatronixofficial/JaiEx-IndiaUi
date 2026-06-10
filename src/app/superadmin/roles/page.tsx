"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCheck, Shield, Crown, Users, CheckCircle, XCircle, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { usersApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handler";

interface RolePermission { key: string; label: string; allowed: boolean; }
interface Role {
  id: string; name: string; displayName: string; userCount: number;
  color: string; bgColor: string; borderColor: string; iconColor: string;
  description: string; permissions: RolePermission[];
  createdAt: string; isSystem: boolean;
}

const PERMISSIONS_MASTER = [
  { key: "send_transfer",      label: "Send transfers" },
  { key: "receive_transfer",   label: "Receive transfers" },
  { key: "create_link",        label: "Create share links" },
  { key: "manage_own_files",   label: "Manage own files" },
  { key: "delete_own_files",   label: "Delete own files" },
  { key: "view_team_files",    label: "View team files" },
  { key: "manage_team_files",  label: "Manage team files" },
  { key: "manage_users",       label: "Manage users" },
  { key: "view_all_transfers", label: "View all transfers" },
  { key: "disable_any_link",   label: "Disable any link" },
  { key: "view_audit_log",     label: "View audit log" },
  { key: "manage_admins",      label: "Manage admins" },
  { key: "system_settings",    label: "System settings" },
  { key: "view_analytics",     label: "View analytics" },
];

const ROLES: Role[] = [
  {
    id: "r1", name: "superadmin", displayName: "Super Admin", userCount: 2,
    color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20", borderColor: "border-red-200 dark:border-red-800/40", iconColor: "text-red-500",
    description: "Full platform access. Can manage all users, settings, and system configuration.",
    isSystem: true, createdAt: "2026-01-01T00:00:00Z",
    permissions: PERMISSIONS_MASTER.map((p) => ({ ...p, allowed: true })),
  },
  {
    id: "r2", name: "admin", displayName: "Admin", userCount: 14,
    color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-900/20", borderColor: "border-orange-200 dark:border-orange-800/40", iconColor: "text-orange-500",
    description: "Team management access. Can manage users and view team activity but cannot change system settings.",
    isSystem: true, createdAt: "2026-01-01T00:00:00Z",
    permissions: PERMISSIONS_MASTER.map((p) => ({ ...p, allowed: !["manage_admins","system_settings"].includes(p.key) })),
  },
  {
    id: "r3", name: "user", displayName: "User", userCount: 1831,
    color: "text-gray-700 dark:text-gray-300", bgColor: "bg-gray-50 dark:bg-zinc-800/60", borderColor: "border-gray-200 dark:border-zinc-700", iconColor: "text-gray-500",
    description: "Standard access. Can send/receive transfers, manage own files and links.",
    isSystem: true, createdAt: "2026-01-01T00:00:00Z",
    permissions: PERMISSIONS_MASTER.map((p) => ({ ...p, allowed: ["send_transfer","receive_transfer","create_link","manage_own_files","delete_own_files"].includes(p.key) })),
  },
];

function RoleIcon({ name }: { name: string }) {
  if (name === "superadmin") return <Shield size={18} />;
  if (name === "admin")      return <Crown  size={18} />;
  return <Users size={18} />;
}

type RoleCounts = Record<string, number>;

export default function RolesPage() {
  const [selected, setSelected] = useState<string>("r1");
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<RoleCounts>({});

  const load = useCallback(async () => {
    try {
      const res = await usersApi.adminStats();
      const d = res.data?.data ?? res.data ?? {};
      const byRole = d.byRole ?? {};
      setCounts({
        superadmin: byRole.superadmin ?? byRole.SUPERADMIN ?? d.totalSuperAdmins ?? 0,
        admin:      byRole.admin      ?? byRole.ADMIN      ?? d.totalAdmins      ?? 0,
        user:       byRole.user       ?? byRole.USER       ?? d.totalUsers       ?? d.total ?? 0,
      });
    } catch (err) {
      handleApiError(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const role = ROLES.find((r) => r.id === selected)!;
  const filtered = role.permissions.filter((p) =>
    !search.trim() || p.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in space-y-6 pb-10">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-white">
                <UserCheck size={22} className="text-orange-500" /> Role Manager
              </h1>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">View and manage role permissions across the platform</p>
            </div>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {ROLES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelected(r.id)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  selected === r.id
                    ? `${r.bgColor} ${r.borderColor} shadow-md`
                    : "border-gray-200/70 bg-white hover:border-gray-300 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.bgColor} ${r.color} ${selected === r.id ? "ring-2 ring-offset-1 ring-current/20" : ""}`}>
                    <RoleIcon name={r.name} />
                  </div>
                  {r.isSystem && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500 dark:bg-zinc-800 dark:text-gray-400">
                      System
                    </span>
                  )}
                </div>
                <h3 className={`font-bold ${r.color}`}>{r.displayName}</h3>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{r.description}</p>
                <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {(counts[r.name] ?? r.userCount).toLocaleString()} user{(counts[r.name] ?? r.userCount) !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>

          {/* Permissions panel */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {role.displayName} Permissions
                </h2>
                <p className="text-xs text-gray-500">
                  {role.permissions.filter((p) => p.allowed).length} / {role.permissions.length} permissions granted
                </p>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Filter permissions…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 text-xs outline-none focus:border-orange-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white sm:w-52" />
              </div>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-zinc-800/70">
              {filtered.map((p) => (
                <div key={p.key} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${p.allowed ? "bg-emerald-100 dark:bg-emerald-900/20" : "bg-gray-100 dark:bg-zinc-800"}`}>
                      {p.allowed
                        ? <CheckCircle size={13} className="text-emerald-600 dark:text-emerald-400" />
                        : <XCircle    size={13} className="text-gray-400" />}
                    </div>
                    <span className={`text-sm ${p.allowed ? "font-medium text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                      {p.label}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold ${p.allowed ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                    {p.allowed ? "Allowed" : "Denied"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
