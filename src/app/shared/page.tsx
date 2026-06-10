"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { filesApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handler";
import { FileItem } from "@/types";
import { FileCard } from "@/components/files/FileCard";
import { EmptyState, Badge, Spinner } from "@/components/ui";
import {
  Share2, Users, HardDrive, ArrowUpDown, Search, X as XIcon,
  ChevronDown,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";

type SortKey = "name" | "size" | "owner" | "date";
type SortDir = "asc" | "desc";

export default function SharedPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [ownerMenuOpen, setOwnerMenuOpen] = useState(false);

  async function loadSharedFiles() {
    try {
      setLoading(true);
      const res = await filesApi.sharedWithMe();
      const data = res.data?.files || res.data?.data || res.data || [];
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSharedFiles();
  }, []);

  /* ── Close owner dropdown on outside click ── */
  useEffect(() => {
    if (!ownerMenuOpen) return;
    const fn = () => setOwnerMenuOpen(false);
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, [ownerMenuOpen]);

  /* ── Derived stats ── */
  const owners = useMemo(
    () =>
      Array.from(
        new Map(
          files
            .filter((f) => f.owner?.id)
            .map((f) => [f.owner!.id, f.owner!]),
        ).values(),
      ),
    [files],
  );

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + (f.size ?? 0), 0),
    [files],
  );

  /* ── Filtered + sorted ── */
  const displayed = useMemo(() => {
    let list = files;

    if (ownerFilter !== "all") {
      list = list.filter((f) => f.owner?.id === ownerFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) =>
        (f.name ?? f.originalName ?? "").toLowerCase().includes(q) ||
        (f.owner?.name ?? "").toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      let va: string | number, vb: string | number;
      switch (sortKey) {
        case "name":
          va = (a.name ?? a.originalName ?? "").toLowerCase();
          vb = (b.name ?? b.originalName ?? "").toLowerCase();
          break;
        case "size":
          va = a.size ?? 0;
          vb = b.size ?? 0;
          break;
        case "owner":
          va = (a.owner?.name ?? "").toLowerCase();
          vb = (b.owner?.name ?? "").toLowerCase();
          break;
        default:
          va = new Date(a.createdAt).getTime();
          vb = new Date(b.createdAt).getTime();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [files, ownerFilter, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const selectedOwner = owners.find((o) => o.id === ownerFilter);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in space-y-6">

          {/* ── Header ── */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Shared with Me</h1>
              <p className="mt-1 text-sm text-(--text-muted)">
                Files and folders shared with you by other users
              </p>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Files stat */}
                <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--bg-card) px-4 py-2">
                  <Share2 size={16} className="text-orange-500" />
                  <div>
                    <p className="text-xs text-(--text-muted)">Shared Files</p>
                    <p className="text-sm font-semibold">{files.length}</p>
                  </div>
                </div>

                {/* Shared by stat */}
                <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--bg-card) px-4 py-2">
                  <Users size={16} className="text-blue-500" />
                  <div>
                    <p className="text-xs text-(--text-muted)">Shared By</p>
                    <p className="text-sm font-semibold">
                      {owners.length} user{owners.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Total size stat */}
                {totalSize > 0 && (
                  <div className="flex items-center gap-2 rounded-2xl border border-(--border) bg-(--bg-card) px-4 py-2">
                    <HardDrive size={16} className="text-purple-500" />
                    <div>
                      <p className="text-xs text-(--text-muted)">Total Size</p>
                      <p className="text-sm font-semibold">{formatBytes(totalSize)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Filters & Sort ── */}
          {files.length > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                {/* Owner filter */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setOwnerMenuOpen((o) => !o)}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-(--border) bg-(--bg-card) px-3 text-sm font-medium text-(--text-secondary) transition-colors hover:text-(--text-primary)"
                  >
                    <Users size={13} className="text-blue-500" />
                    {selectedOwner ? selectedOwner.name : "All users"}
                    <ChevronDown size={12} className="text-(--text-muted)" />
                  </button>
                  {ownerMenuOpen && (
                    <div className="absolute left-0 top-10 z-20 min-w-48 rounded-xl border border-(--border) bg-(--bg-card) py-1.5 shadow-xl">
                      <button
                        type="button"
                        onClick={() => { setOwnerFilter("all"); setOwnerMenuOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-(--bg-hover) ${ownerFilter === "all" ? "font-semibold text-orange-500" : "text-(--text-secondary)"}`}
                      >
                        <Users size={13} /> All users
                      </button>
                      {owners.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => { setOwnerFilter(o.id); setOwnerMenuOpen(false); }}
                          className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-(--bg-hover) ${ownerFilter === o.id ? "font-semibold text-orange-500" : "text-(--text-secondary)"}`}
                        >
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                            {o.name.slice(0, 2).toUpperCase()}
                          </div>
                          {o.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort */}
                {(["name", "size", "date", "owner"] as SortKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSort(key)}
                    className={`flex h-9 items-center gap-1 rounded-xl border px-3 text-xs font-medium capitalize transition-colors ${
                      sortKey === key
                        ? "border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                        : "border-(--border) bg-(--bg-card) text-(--text-muted) hover:text-(--text-primary)"
                    }`}
                  >
                    {key}
                    {sortKey === key && (
                      <ArrowUpDown size={10} className="text-orange-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search files or users…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-(--border) bg-(--bg-card) pl-8 pr-8 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15 sm:w-56"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary)"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <Spinner size={30} />
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              icon={<Share2 size={34} />}
              title="No shared files yet"
              description="Files shared with you by other users will appear here."
            />
          ) : displayed.length === 0 ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
              <Search size={32} className="text-(--text-muted)" />
              <p className="text-sm font-medium text-(--text-secondary)">No files match your filters</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setOwnerFilter("all"); }}
                className="text-xs text-orange-500 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Result count */}
              {(search || ownerFilter !== "all") && (
                <p className="text-xs text-(--text-muted)">
                  Showing{" "}
                  <span className="font-semibold text-(--text-primary)">{displayed.length}</span>
                  {" "}of{" "}
                  <span className="font-semibold text-(--text-primary)">{files.length}</span>
                  {" "}files
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {displayed.map((file) => (
                  <div key={file.id} className="group relative">
                    {file.owner && (
                      <div className="absolute left-3 top-3 z-10 flex items-center gap-1">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-sm">
                          {file.owner.name.slice(0, 2).toUpperCase()}
                        </div>
                        <Badge variant="info" className="text-[10px]">{file.owner.name}</Badge>
                      </div>
                    )}
                    <FileCard file={file} onRefresh={loadSharedFiles} isShared />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
