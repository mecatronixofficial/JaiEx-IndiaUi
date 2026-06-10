"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Send, Search, RefreshCw, ChevronLeft, ChevronRight,
  Mail, Link as LinkIcon, QrCode, Clock, CheckCircle2,
  Ban, Eye, Users, Download, Filter,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { EmptyState, Spinner, Avatar } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { formatBytes, formatRelative, formatDateTime } from "@/lib/utils";
import { handleApiError } from "@/lib/error-handler";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";

/* ─── Types ─── */
interface AdminTransfer {
  id: string;
  title?: string;
  method?: string;
  status?: string;
  fileCount?: number;
  totalSize?: number;
  recipients?: string[];
  views?: number;
  downloads?: number;
  sender?: { id?: string; name?: string; email?: string };
  senderId?: string;
  expiresAt?: string;
  hasPassword?: boolean;
  privacy?: string;
  createdAt: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTransfer(raw: any): AdminTransfer {
  return {
    id:         raw.id ?? raw._id ?? "",
    title:      raw.title ?? "Untitled transfer",
    method:     raw.method,
    status:     raw.status ?? "active",
    fileCount:  raw.fileCount ?? raw.files?.length ?? 0,
    totalSize:  raw.totalSize,
    recipients: raw.recipients ?? [],
    views:      raw.views ?? 0,
    downloads:  raw.downloads ?? 0,
    sender:     raw.sender,
    senderId:   raw.senderId ?? raw.sender?.id,
    expiresAt:  raw.expiresAt,
    hasPassword:raw.hasPassword ?? false,
    privacy:    raw.privacy ?? "public",
    createdAt:  raw.createdAt ?? new Date().toISOString(),
  };
}

function parseTransfers(data: any): AdminTransfer[] {
  const arr =
    Array.isArray(data?.transfers)       ? data.transfers       :
    Array.isArray(data?.data?.transfers) ? data.data.transfers  :
    Array.isArray(data?.data?.items)     ? data.data.items      :
    Array.isArray(data?.items)           ? data.items           :
    Array.isArray(data?.data)            ? data.data            :
    Array.isArray(data)                  ? data                 : [];
  return arr.map(mapTransfer).filter((t: AdminTransfer) => t.id);
}

function parseTotal(data: any): number {
  return data?.total ?? data?.data?.total ?? data?.meta?.total ?? data?.count ?? 0;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─── Helpers ─── */
function methodIcon(method?: string) {
  if (method === "email") return <Mail size={13} className="text-blue-500" />;
  if (method === "qr")    return <QrCode size={13} className="text-purple-500" />;
  return <LinkIcon size={13} className="text-orange-500" />;
}

function statusBadge(status?: string): string {
  const map: Record<string, string> = {
    active:   "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400",
    expired:  "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400",
    disabled: "bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400",
    pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400",
  };
  return map[status ?? "active"] ?? map.active;
}

const STATUS_FILTERS = ["all", "active", "expired", "disabled"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];
const PAGE_SIZE = 20;

/* ════════════════════════════════════════
   PAGE
════════════════════════════════════════ */
export default function AdminTransfersPage() {
  const { user: me } = useAuth();
  const router = useRouter();

  const role = me?.role?.toLowerCase();
  const isAdmin = role === "admin" || role === "superadmin";

  const [transfers,  setTransfers]  = useState<AdminTransfer[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [fetchKey,   setFetchKey]   = useState(0);
  const [search,     setSearch]     = useState("");
  const [status,     setStatus]     = useState<StatusFilter>("all");
  const [method,     setMethod]     = useState("all");
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    if (me && !isAdmin) router.replace("/dashboard");
  }, [me, isAdmin, router]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (search.trim())  params.search = search.trim();
      if (status !== "all") params.status = status;
      if (method !== "all") params.method = method;

      const res = await adminApi.transfers(params);
      setTransfers(parseTransfers(res.data));
      setTotal(parseTotal(res.data));
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, search, status, method]);

  useEffect(() => { load(); }, [load, fetchKey]);
  useEffect(() => { setPage(1); }, [search, status, method]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 pb-10">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/20 ring-1 ring-orange-200 dark:ring-orange-800/30">
                <Send size={18} className="text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transfers</h1>
                <p className="text-xs text-gray-400 dark:text-gray-500">All platform transfers</p>
              </div>
            </div>
            <button type="button" onClick={() => setFetchKey((k) => k + 1)} disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-400 dark:hover:border-orange-700 dark:hover:text-orange-400">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total",    value: total,                                              icon: <Send size={13} />,         color: "text-orange-500" },
              { label: "Active",   value: transfers.filter((t) => t.status === "active").length, icon: <CheckCircle2 size={13} />, color: "text-green-500" },
              { label: "Expired",  value: transfers.filter((t) => t.status === "expired").length, icon: <Clock size={13} />,        color: "text-gray-500" },
              { label: "Disabled", value: transfers.filter((t) => t.status === "disabled").length, icon: <Ban size={13} />,          color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className={`mb-2 flex items-center gap-1.5 text-xs font-medium ${s.color}`}>{s.icon} {s.label}</div>
                {loading ? <div className="h-6 w-12 animate-pulse rounded bg-gray-100 dark:bg-zinc-800" />
                  : <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>}
              </div>
            ))}
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search transfers…"
                  className="h-9 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <Filter size={12} className="text-gray-400" />
                  {STATUS_FILTERS.map((s) => (
                    <button key={s} type="button" onClick={() => setStatus(s)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition ${
                        status === s
                          ? "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-400"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                {(["all", "email", "link", "qr"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMethod(m)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize transition ${
                      method === m
                        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-400"
                    }`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {loading ? (
              <div className="flex h-52 items-center justify-center"><Spinner size={24} /></div>
            ) : transfers.length === 0 ? (
              <EmptyState icon={<Send size={32} />} title="No transfers found" description="Try adjusting your filters" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <tr>
                        {["Transfer", "Sender", "Method", "Files", "Views", "Downloads", "Status", "Created"].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                      {transfers.map((t) => (
                        <tr key={t.id} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                          <td className="px-5 py-3.5">
                            <p className="max-w-44 truncate text-xs font-semibold text-gray-800 dark:text-gray-200">{t.title}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{t.id.slice(0, 10)}…</p>
                          </td>
                          <td className="px-5 py-3.5">
                            {t.sender ? (
                              <div className="flex items-center gap-2">
                                <Avatar name={t.sender.name ?? "?"} size={24} />
                                <div>
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.sender.name ?? "Unknown"}</p>
                                  <p className="text-[11px] text-gray-400">{t.sender.email}</p>
                                </div>
                              </div>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 capitalize">
                              {methodIcon(t.method)}
                              <span className="text-xs text-gray-600 dark:text-gray-400">{t.method ?? "link"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.fileCount ?? 0}</p>
                            {t.totalSize !== undefined && (
                              <p className="text-[11px] text-gray-400">{formatBytes(t.totalSize)}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Eye size={11} /> {t.views ?? 0}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Download size={11} /> {t.downloads ?? 0}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadge(t.status)}`}>
                              {t.status ?? "active"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <p className="text-xs text-gray-500">{formatRelative(t.createdAt)}</p>
                            <p className="text-[11px] text-gray-400">{formatDateTime(t.createdAt)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 dark:border-zinc-800">
                    <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} total</p>
                    <div className="flex items-center gap-1.5">
                      <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-40 dark:border-zinc-700">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{page} / {totalPages}</span>
                      <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-500 disabled:opacity-40 dark:border-zinc-700">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
