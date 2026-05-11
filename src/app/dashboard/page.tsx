"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import {
  Files,
  Upload,
  Download,
  Share2,
  ArrowUpRight,
  HardDrive,
  Trash2,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";

import { filesApi, usersApi, transactionsApi } from "@/lib/api";

import { FileItem, Transaction } from "@/types";

import { formatBytes, formatRelative, getFileIcon } from "@/lib/utils";

import { useAuth } from "@/contexts/AuthContext";

import { Badge } from "@/components/ui";
import Card from "@/components/ui/Card";

interface Stats {
  totalFiles: number;
  storageUsed: number;
  storageQuota: number;
  sharedFiles: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    storageUsed: 0,
    storageQuota: 10737418240,
    sharedFiles: 0,
  });

  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    async function load() {
      try {
        const [filesRes, storageRes, txRes] = await Promise.allSettled([
          filesApi.list({
            limit: 8,
            sort: "createdAt",
            order: "desc",
          }),

          user?.id ? usersApi.getStorage(user.id) : Promise.resolve(null),

          transactionsApi.list({
            limit: 5,
          }),
        ]);

        /* Files */

        if (filesRes.status === "fulfilled") {
          const data = filesRes.value.data;

          const files = data?.files || data?.data || data || [];

          setRecentFiles(Array.isArray(files) ? files.slice(0, 8) : []);

          setStats((prev) => ({
            ...prev,
            totalFiles: data?.total || files.length,
          }));
        }

        /* Storage */

        if (storageRes.status === "fulfilled" && storageRes.value) {
          const s = storageRes.value.data?.storage || storageRes.value.data;

          setStats((prev) => ({
            ...prev,
            storageUsed: s?.used || 0,
            storageQuota: s?.quota || 10737418240,
          }));
        }

        /* Transactions */

        if (txRes.status === "fulfilled") {
          const t =
            txRes.value.data?.transactions ||
            txRes.value.data?.data ||
            txRes.value.data ||
            [];

          setTransactions(Array.isArray(t) ? t.slice(0, 5) : []);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.id]);

  /* =========================
     STORAGE %
  ========================= */

  const usedPct = Math.min((stats.storageUsed / stats.storageQuota) * 100, 100);

  /* =========================
     STATS
  ========================= */

  const statCards = [
    {
      label: "Total Files",
      value: stats.totalFiles.toLocaleString(),
      icon: <Files size={22} />,
      color: "from-orange-500 to-orange-600",
    },

    {
      label: "Storage Used",
      value: formatBytes(stats.storageUsed),
      icon: <HardDrive size={22} />,
      color: "from-blue-500 to-cyan-500",
    },

    {
      label: "Shared Files",
      value: stats.sharedFiles.toLocaleString(),
      icon: <Share2 size={22} />,
      color: "from-green-500 to-emerald-500",
    },

    {
      label: "Storage Free",
      value: formatBytes(Math.max(0, stats.storageQuota - stats.storageUsed)),
      icon: <Upload size={22} />,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  /* =========================
     TX ICONS
  ========================= */

  const txIcons: Record<string, React.ReactNode> = {
    upload: <Upload size={16} className="text-green-500" />,

    download: <Download size={16} className="text-blue-500" />,

    share: <Share2 size={16} className="text-orange-500" />,

    delete: <Trash2 size={16} className="text-red-500" />,
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div
          className="
    space-y-8
    animate-fade-in
    pb-10
  "
        >
          {/* HEADER */}

          <div className="flex flex-col gap-2">
            <h1
              className="
    text-3xl
    font-bold
    tracking-tight
    text-[var(--text)]
  "
            >
              Welcome back,
              <span className="gradient-text ml-2">
                {user?.name?.split(" ")[0]}
              </span>
              👋
            </h1>

            <p
              className="
    text-sm
    leading-relaxed
    text-[var(--text-muted)]
  "
            >
              Here&apos;s what&apos;s happening with your files today
            </p>
          </div>

          {/* STATS */}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-2xl skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((s, i) => (
                <Card key={i} hover glass padding>
                  <div
                    className={`
    mb-5 flex h-14 w-14
    items-center justify-center
    rounded-2xl
    bg-gradient-to-br
    ${s.color}

    text-white
    shadow-lg
    transition-all duration-300

    group-hover:scale-110
  `}
                  >
                    {s.icon}
                  </div>

                  <h3 className="text-3xl font-bold text-[var(--text)]">
                    {s.value}
                  </h3>

                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {s.label}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* MAIN GRID */}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
            {/* RECENT FILES */}

            <Card glass className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <h2 className="text-lg font-semibold">Recent Files</h2>

                <Link
                  href="/files"
                  className="
                    flex items-center gap-1
                    text-sm font-medium
                    text-orange-500
                    hover:text-orange-600
                  "
                >
                  View all
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4 p-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 rounded-xl skeleton" />
                  ))}
                </div>
              ) : recentFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 text-5xl">📂</div>

                  <p className="text-sm text-[var(--text-muted)]">
                    No files uploaded yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentFiles.map((file) => (
                    <div
                      key={file.id}
                      className="
                          flex items-center gap-4
                          px-6 py-4
                          transition-colors
                         hover:bg-orange-50/60
dark:hover:bg-orange-500/5
                        "
                    >
                      <div
                        className="
                            flex h-12 w-12
                            items-center justify-center
                            rounded-2xl
                            border border-gray-200
                            bg-gray-100
                            shadow-sm
                            text-xl
                            dark:border-gray-700
                            dark:bg-gray-800
                          "
                      >
                        {getFileIcon(file.mimeType, file.extension || "")}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {file.name}
                        </p>

                        <p className="text-xs text-[var(--text-muted)]">
                          {formatBytes(file.size)} •{" "}
                          {formatRelative(file.createdAt)}
                        </p>
                      </div>

                      {file.isShared && <Badge variant="info">Shared</Badge>}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* RIGHT SIDE */}

            <div className="space-y-6">
              {/* STORAGE */}

              <Card glass padding>
                <h3 className="mb-5 text-lg font-semibold">Storage Usage</h3>

                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-semibold">
                    {formatBytes(stats.storageUsed)}
                  </span>

                  <span className="text-[var(--text-muted)]">
                    {formatBytes(stats.storageQuota)}
                  </span>
                </div>

                <div
                  className="
    h-3 overflow-hidden
    rounded-full
    bg-gray-200/70
    backdrop-blur-sm

    dark:bg-gray-800
  "
                >
                  <div
                    className="
                      h-full rounded-full
                      bg-gradient-to-r
                     from-orange-500
via-orange-400
to-amber-400
                      transition-all duration-500
                    "
                    style={{
                      width: `${usedPct}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  {usedPct.toFixed(1)}% of quota used
                </p>
              </Card>

              {/* ACTIVITY */}

              <Card hover glass padding>
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>

                  <Link
                    href="/transactions"
                    className="
                      text-sm text-orange-500
                      hover:text-orange-600
                    "
                  >
                    View all
                  </Link>
                </div>

                {transactions.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">
                    No activity yet
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 px-5 py-4"
                      >
                        <div
                          className="
                              flex h-10 w-10
                              items-center justify-center
                             rounded-2xl shadow-sm
                              bg-gray-100
                              dark:bg-gray-800
                            "
                        >
                          {txIcons[tx.type] || "•"}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}

                            {tx.file && `: ${tx.file.name}`}
                          </p>

                          <p className="text-xs text-[var(--text-muted)]">
                            {formatRelative(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
