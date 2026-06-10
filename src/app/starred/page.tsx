"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Star,
  Send,
  Download,
  ExternalLink,
  MoreHorizontal,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Spinner } from "@/components/ui";
import { transfersApi } from "@/lib/api";
import { Transfer } from "@/types";
import { formatBytes, formatRelative } from "@/lib/utils";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";

export default function StarredPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [menuOpen, setMenuOpen]   = useState<string | null>(null);
  const [removing, setRemoving]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res   = await transfersApi.starred();
      const inner = res.data?.data ?? res.data ?? {};
      const list  = inner?.transfers ?? (Array.isArray(inner) ? inner : []);
      setTransfers(Array.isArray(list) ? list : []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!menuOpen) return;
    const fn = () => setMenuOpen(null);
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, [menuOpen]);

  async function handleUnstar(transfer: Transfer) {
    setRemoving(transfer.id);
    setTransfers((prev) => prev.filter((t) => t.id !== transfer.id));
    try {
      await transfersApi.unstar(transfer.id);
      showToast.success(`"${transfer.title}" removed from starred`);
    } catch (err) {
      setTransfers((prev) => [...prev, transfer]);
      handleApiError(err);
    } finally {
      setRemoving(null);
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in space-y-6 pb-10">

          {/* ── Header ── */}
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900 dark:text-white">
              <Star size={22} className="fill-yellow-400 text-yellow-400" />
              Starred Transfers
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {loading
                ? "Loading…"
                : `${transfers.length} transfer${transfers.length !== 1 ? "s" : ""} starred for quick access`}
            </p>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Spinner size={30} />
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/70 bg-white py-24 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <Star size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
              <p className="font-semibold text-gray-600 dark:text-gray-400">No starred transfers</p>
              <p className="mt-1 text-sm text-gray-400">Star transfers from any view to find them quickly here.</p>
              <Link
                href="/transfers"
                className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Browse Transfers
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Transfer</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Files</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Size</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sent</th>
                      <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                      <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/70">
                    {transfers.map((t) => (
                      <tr
                        key={t.id}
                        className="group transition-colors hover:bg-orange-50/30 dark:hover:bg-orange-500/5"
                      >
                        {/* Title */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500 dark:bg-orange-900/20">
                              <Send size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{t.title}</p>
                              {t.recipients?.length > 0 && (
                                <p className="text-xs text-gray-400 truncate max-w-40">{t.recipients[0]}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Files */}
                        <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                          {t.fileCount ?? t.files?.length ?? 0} file{(t.fileCount ?? t.files?.length ?? 0) !== 1 ? "s" : ""}
                        </td>

                        {/* Size */}
                        <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
                          {formatBytes(t.totalSize ?? 0)}
                        </td>

                        {/* Sent at */}
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {formatRelative(t.createdAt)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            t.status === "active"   ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            t.status === "expired"  ? "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400" :
                            t.status === "disabled" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500"
                          }`}>
                            {t.status ?? "pending"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            {/* View transfer */}
                            <Link
                              href={`/transfers/${t.id}`}
                              title="View transfer"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-zinc-800"
                            >
                              <ExternalLink size={14} />
                            </Link>

                            {/* Unstar */}
                            <button
                              type="button"
                              title="Remove from starred"
                              disabled={removing === t.id}
                              onClick={() => handleUnstar(t)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-yellow-400 transition-colors hover:bg-yellow-50 hover:text-yellow-500 disabled:opacity-40 dark:hover:bg-yellow-900/20"
                            >
                              <Star size={15} className="fill-yellow-400" />
                            </button>

                            {/* More menu */}
                            <div className="relative">
                              <button
                                type="button"
                                title="More options"
                                aria-label="More options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpen(menuOpen === t.id ? null : t.id);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
                              >
                                <MoreHorizontal size={14} />
                              </button>

                              {menuOpen === t.id && (
                                <div
                                  className="absolute right-0 top-9 z-20 min-w-40 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Link
                                    href={`/transfers/${t.id}`}
                                    onClick={() => setMenuOpen(null)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
                                  >
                                    <ExternalLink size={13} /> View Transfer
                                  </Link>
                                  <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />
                                  <button
                                    type="button"
                                    onClick={() => { handleUnstar(t); setMenuOpen(null); }}
                                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  >
                                    <X size={13} /> Remove from starred
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
