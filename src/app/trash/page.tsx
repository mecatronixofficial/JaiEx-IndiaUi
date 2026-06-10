"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trash2, RotateCcw, AlertTriangle, LayoutGrid, List,
  Search, X, CheckSquare, Square, RefreshCw, HardDrive,
  FileX, Folder as FolderIcon, Clock, Filter,
  Image as ImageIcon, Video, FileText, File as GenericFile,
  SortAsc, SortDesc,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Spinner } from "@/components/ui";
import Button from "@/components/ui/Button";
import { FileCard } from "@/components/files/FileCard";
import { FileTypeIcon } from "@/components/ui/FileTypeIcon";
import { filesApi, foldersApi } from "@/lib/api";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import { cn, formatBytes, formatRelative, formatDateTime, truncate } from "@/lib/utils";
import type { FileItem, Folder } from "@/types";

/* ─── Local types ─── */
type ViewMode   = "grid" | "list";
type ActiveTab  = "all" | "files" | "folders";
type SortField  = "name" | "size" | "deleted";
type SortDir    = "asc" | "desc";
type TypeFilter = "all" | "image" | "video" | "document" | "other";

interface TrashedFolder extends Folder {
  trashedAt?: string;
}

/* ─── Helpers ─── */
function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function daysRemaining(trashedAt?: string): number | null {
  if (!trashedAt) return null;
  const expires = new Date(trashedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)));
}

function DaysRemainingBadge({ trashedAt }: { trashedAt?: string }) {
  const days = daysRemaining(trashedAt);
  if (days === null) return null;
  const cls =
    days <= 3
      ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400"
      : days <= 10
      ? "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-400"
      : "border-gray-200 bg-gray-50 text-gray-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-gray-400";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      <Clock size={8} />
      {days}d left
    </span>
  );
}

function fileTypeCategory(mime?: string | null): TypeFilter {
  if (!mime) return "other";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (
    mime.includes("pdf") ||
    mime.includes("word") ||
    mime.startsWith("text/") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation")
  )
    return "document";
  return "other";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function normalizeFileItem(item: any): FileItem | null {
  const id = readString(item?.id ?? item?._id ?? item?.fileId);
  if (!id) return null;

  const originalName = readString(item?.originalName ?? item?.fileName ?? item?.name, "Untitled file");
  const name = readString(item?.name ?? item?.fileName ?? item?.originalName, originalName);

  return {
    ...item,
    id,
    name,
    originalName,
    size: readNumber(item?.size),
    mimeType: readString(item?.mimeType, "application/octet-stream"),
    extension: readString(item?.extension),
    ownerId: readString(item?.ownerId),
    isShared: Boolean(item?.isShared),
    isTrashed: item?.isTrashed ?? true,
    createdAt: readString(item?.createdAt ?? item?.updatedAt ?? item?.trashedAt),
    updatedAt: readString(item?.updatedAt ?? item?.createdAt ?? item?.trashedAt),
  };
}

function normalizeFolder(item: any): TrashedFolder | null {
  const id = readString(item?.id ?? item?._id ?? item?.folderId);
  if (!id) return null;

  return {
    ...item,
    id,
    name: readString(item?.name, "Untitled folder"),
    ownerId: readString(item?.ownerId),
    createdAt: readString(item?.createdAt ?? item?.updatedAt ?? item?.trashedAt),
    updatedAt: readString(item?.updatedAt ?? item?.createdAt ?? item?.trashedAt),
    fileCount: readNumber(item?.fileCount),
    totalSize: readNumber(item?.totalSize),
  };
}

function parseFileArray(data: any): FileItem[] {
  const arr =
    data?.files ?? data?.data?.files ?? data?.data ?? data ?? [];
  return Array.isArray(arr) ? arr.map(normalizeFileItem).filter((item): item is FileItem => item !== null) : [];
}

function parseFolderArray(data: any): TrashedFolder[] {
  const arr =
    data?.folders ?? data?.data?.folders ?? data?.data ?? data ?? [];
  return Array.isArray(arr) ? arr.map(normalizeFolder).filter((item): item is TrashedFolder => item !== null) : [];
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function TrashPage() {
  const [files,            setFiles]            = useState<FileItem[]>([]);
  const [folders,          setFolders]          = useState<TrashedFolder[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [bulkLoading,      setBulkLoading]      = useState(false);
  const [view,             setView]             = useState<ViewMode>("list");
  const [tab,              setTab]              = useState<ActiveTab>("all");
  const [selectedFiles,    setSelectedFiles]    = useState<Set<string>>(new Set());
  const [selectedFolders,  setSelectedFolders]  = useState<Set<string>>(new Set());
  const [search,           setSearch]           = useState("");
  const [typeFilter,       setTypeFilter]       = useState<TypeFilter>("all");
  const [sortField,        setSortField]        = useState<SortField>("deleted");
  const [sortDir,          setSortDir]          = useState<SortDir>("desc");
  const [refreshKey,       setRefreshKey]       = useState(0);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [showDeleteConfirm,setShowDeleteConfirm]= useState(false);

  /* ── Fetch ── */
  const load = useCallback(async () => {
    setLoading(true);
    const [filesRes, foldersRes] = await Promise.allSettled([
      filesApi.getTrash(),
      foldersApi.trash(),
    ]);
    setFiles(filesRes.status === "fulfilled" ? parseFileArray(filesRes.value.data) : []);
    if (filesRes.status === "rejected") handleApiError(filesRes.reason);
    setFolders(foldersRes.status === "fulfilled" ? parseFolderArray(foldersRes.value.data) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [load, refreshKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  /* ── Derived: filtered + sorted ── */
  const filteredFiles = useMemo(() => {
    let items = files;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.originalName?.toLowerCase().includes(q) ||
          f.extension?.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "all") {
      items = items.filter((f) => fileTypeCategory(f.mimeType) === typeFilter);
    }
    return [...items].sort((a, b) => {
      let diff = 0;
      if (sortField === "name")    diff = a.name.localeCompare(b.name);
      if (sortField === "size")    diff = (a.size ?? 0) - (b.size ?? 0);
      if (sortField === "deleted") diff = new Date(a.trashedAt ?? a.updatedAt).getTime() - new Date(b.trashedAt ?? b.updatedAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [files, search, typeFilter, sortField, sortDir]);

  const filteredFolders = useMemo(() => {
    let items = folders;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((f) => f.name.toLowerCase().includes(q));
    }
    return [...items].sort((a, b) => {
      let diff = 0;
      if (sortField === "name")    diff = a.name.localeCompare(b.name);
      if (sortField === "size")    diff = (a.totalSize ?? 0) - (b.totalSize ?? 0);
      if (sortField === "deleted") diff = new Date(a.trashedAt ?? a.updatedAt).getTime() - new Date(b.trashedAt ?? b.updatedAt).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
  }, [folders, search, sortField, sortDir]);

  /* ── Stats ── */
  const totalSize = useMemo(
    () => files.reduce((s, f) => s + (f.size ?? 0), 0) + folders.reduce((s, f) => s + (f.totalSize ?? 0), 0),
    [files, folders],
  );

  const nextExpiry = useMemo(() => {
    const all = [...files.map((f) => f.trashedAt), ...folders.map((f) => f.trashedAt)].filter(Boolean) as string[];
    if (!all.length) return null;
    return daysRemaining(new Date(Math.min(...all.map((d) => new Date(d).getTime()))).toISOString());
  }, [files, folders]);

  /* ── Tab-derived display flags ── */
  const showFiles   = tab === "all" || tab === "files";
  const showFolders = tab === "all" || tab === "folders";

  const hasAnyItems      = files.length > 0 || folders.length > 0;
  const hasFilteredItems = (showFiles && filteredFiles.length > 0) || (showFolders && filteredFolders.length > 0);

  /* ── Selection ── */
  const selFileCount   = selectedFiles.size;
  const selFolderCount = selectedFolders.size;
  const totalSelected  = selFileCount + selFolderCount;

  const allFilesSelected   = filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length;
  const allFoldersSelected = filteredFolders.length > 0 && selectedFolders.size === filteredFolders.length;
  const allCurrentSelected =
    tab === "files"   ? allFilesSelected :
    tab === "folders" ? allFoldersSelected :
    allFilesSelected && allFoldersSelected;

  function toggleFile(id: string, checked: boolean) {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function toggleFolder(id: string, checked: boolean) {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (tab === "files") {
      setSelectedFiles(allFilesSelected ? new Set() : new Set(filteredFiles.map((f) => f.id)));
    } else if (tab === "folders") {
      setSelectedFolders(allFoldersSelected ? new Set() : new Set(filteredFolders.map((f) => f.id)));
    } else {
      const all = allFilesSelected && allFoldersSelected;
      setSelectedFiles(all ? new Set() : new Set(filteredFiles.map((f) => f.id)));
      setSelectedFolders(all ? new Set() : new Set(filteredFolders.map((f) => f.id)));
    }
  }

  /* ── Actions ── */
  async function handleBulkRestore() {
    if (totalSelected === 0) return;
    setBulkLoading(true);
    try {
      const ops: Promise<unknown>[] = [];
      if (selFileCount > 0) ops.push(filesApi.bulkRestore(Array.from(selectedFiles)));
      for (const id of selectedFolders) ops.push(foldersApi.restore(id));
      await Promise.allSettled(ops);
      showToast.success(`${totalSelected} item${totalSelected > 1 ? "s" : ""} restored`);
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
      refresh();
    } catch (err) { handleApiError(err); }
    setBulkLoading(false);
  }

  async function handleBulkDelete() {
    if (totalSelected === 0) return;
    setShowDeleteConfirm(false);
    setBulkLoading(true);
    try {
      const ops: Promise<unknown>[] = [
        ...Array.from(selectedFiles).map((id) => filesApi.permanentDelete(id)),
        ...Array.from(selectedFolders).map((id) => foldersApi.hardDelete(id)),
      ];
      await Promise.allSettled(ops);
      showToast.success(`${totalSelected} item${totalSelected > 1 ? "s" : ""} permanently deleted`);
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
      refresh();
    } catch (err) { handleApiError(err); }
    setBulkLoading(false);
  }

  async function confirmEmptyTrash() {
    setShowEmptyConfirm(false);
    setBulkLoading(true);
    try {
      await Promise.allSettled([
        ...files.map((f) => filesApi.permanentDelete(f.id)),
        ...folders.map((f) => foldersApi.hardDelete(f.id)),
      ]);
      showToast.success("Trash emptied");
      setFiles([]);
      setFolders([]);
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
    } catch (err) { handleApiError(err); }
    setBulkLoading(false);
  }

  async function restoreSingleFile(id: string) {
    try { await filesApi.restore(id); showToast.success("File restored"); refresh(); }
    catch (err) { handleApiError(err); }
  }
  async function deleteSingleFile(id: string) {
    try { await filesApi.permanentDelete(id); showToast.success("File permanently deleted"); refresh(); }
    catch (err) { handleApiError(err); }
  }
  async function restoreSingleFolder(id: string) {
    try { await foldersApi.restore(id); showToast.success("Folder restored"); refresh(); }
    catch (err) { handleApiError(err); }
  }
  async function deleteSingleFolder(id: string) {
    try { await foldersApi.hardDelete(id); showToast.success("Folder permanently deleted"); refresh(); }
    catch (err) { handleApiError(err); }
  }

  /* ── Sort ── */
  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  }

  /* ── Constants ── */
  const TYPE_FILTERS: { value: TypeFilter; label: string; icon: React.ReactNode }[] = [
    { value: "all",      label: "All",       icon: <GenericFile size={11} /> },
    { value: "image",    label: "Images",    icon: <ImageIcon size={11} /> },
    { value: "video",    label: "Videos",    icon: <Video size={11} /> },
    { value: "document", label: "Docs",      icon: <FileText size={11} /> },
    { value: "other",    label: "Other",     icon: <GenericFile size={11} /> },
  ];

  const TABLE_HEADERS: { label: string; field: SortField | null }[] = [
    { label: "Name",    field: "name" },
    { label: "Type",    field: null },
    { label: "Size",    field: "size" },
    { label: "Owner",   field: null },
    { label: "Deleted", field: "deleted" },
    { label: "Expires", field: null },
    { label: "",        field: null },
  ];

  /* ══════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════ */
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-5 pb-12">

          {/* ── Hero header ── */}
          <div className="relative overflow-hidden rounded-2xl border border-red-200/50 bg-linear-to-br from-red-50 via-rose-50/40 to-white px-6 py-6 dark:border-red-900/20 dark:from-red-950/20 dark:via-rose-900/10 dark:to-zinc-900/0">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-red-400/8 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-red-500 to-rose-500 text-white shadow-xl shadow-red-500/25">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-(--text)">Trash</h1>
                  <p className="mt-0.5 text-sm text-(--text-muted)">
                    {loading
                      ? "Loading…"
                      : hasAnyItems
                      ? `${files.length} file${files.length !== 1 ? "s" : ""} · ${folders.length} folder${folders.length !== 1 ? "s" : ""} · ${formatBytes(totalSize)}`
                      : "Trash is empty"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <div className="flex overflow-hidden rounded-xl border border-gray-200/80 bg-white/80 backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/80">
                  {(["list", "grid"] as ViewMode[]).map((mode) => (
                    <button key={mode} type="button" onClick={() => setView(mode)} aria-label={`${mode} view`}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center transition-all",
                        view === mode
                          ? "bg-red-500 text-white"
                          : "text-(--text-muted) hover:bg-gray-100 hover:text-red-500 dark:hover:bg-zinc-800",
                      )}>
                      {mode === "grid" ? <LayoutGrid size={15} /> : <List size={15} />}
                    </button>
                  ))}
                </div>

                <button type="button" onClick={refresh} disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/80 px-3 py-2 text-xs font-semibold text-(--text-muted) shadow-sm backdrop-blur-sm transition-colors hover:text-(--text) disabled:opacity-50 dark:border-zinc-700/60 dark:bg-zinc-900/80">
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
                </button>

                {hasAnyItems && !loading && (
                  <button type="button" onClick={() => setShowEmptyConfirm(true)} disabled={bulkLoading}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                    <Trash2 size={12} /> Empty Trash
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                label: "Files",
                value: loading ? "—" : String(files.length),
                sub: loading ? "" : formatBytes(files.reduce((s, f) => s + (f.size ?? 0), 0)),
                icon: <FileX size={15} />,
                gradient: "from-red-500 to-rose-500",
              },
              {
                label: "Folders",
                value: loading ? "—" : String(folders.length),
                sub: loading ? "" : formatBytes(folders.reduce((s, f) => s + (f.totalSize ?? 0), 0)),
                icon: <FolderIcon size={15} />,
                gradient: "from-orange-500 to-amber-500",
              },
              {
                label: "Total Size",
                value: loading ? "—" : formatBytes(totalSize),
                sub: loading ? "" : `${files.length + folders.length} items`,
                icon: <HardDrive size={15} />,
                gradient: "from-purple-500 to-violet-500",
              },
              {
                label: "Earliest Expiry",
                value: loading ? "—" : nextExpiry !== null ? `${nextExpiry}d` : "—",
                sub: loading ? "" : nextExpiry !== null ? "until auto-delete" : "no items",
                icon: <Clock size={15} />,
                gradient: nextExpiry !== null && nextExpiry <= 5 ? "from-red-500 to-rose-500" : "from-gray-500 to-zinc-500",
              },
            ].map((s) => (
              <div key={s.label} className="relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800/80 dark:bg-zinc-900">
                <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br ${s.gradient} text-white shadow-sm`}>
                  {s.icon}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-muted)">{s.label}</p>
                <p className="mt-0.5 text-lg font-bold text-(--text)">{s.value}</p>
                {s.sub && <p className="mt-0.5 text-[10px] text-(--text-muted)">{s.sub}</p>}
              </div>
            ))}
          </div>

          {/* ── Warning banner ── */}
          {hasAnyItems && !loading && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-900/10">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Items in trash are{" "}
                <span className="font-bold">permanently deleted after 30 days</span>. Restore files or folders you want to keep.
                {nextExpiry !== null && nextExpiry <= 5 && (
                  <span className="ml-2 font-bold text-red-600 dark:text-red-400">
                    Some items expire in {nextExpiry} day{nextExpiry !== 1 ? "s" : ""}!
                  </span>
                )}
              </p>
            </div>
          )}

          {/* ── Bulk action bar ── */}
          {totalSelected > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200/80 bg-orange-50 px-4 py-3 dark:border-orange-900/30 dark:bg-orange-900/10">
              <button type="button" aria-label="Toggle select all" onClick={toggleSelectAll}
                className="text-orange-500 transition-colors hover:text-orange-600">
                {allCurrentSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
              <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                {totalSelected} item{totalSelected !== 1 ? "s" : ""} selected
                {selFileCount > 0 && selFolderCount > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-orange-500">
                    ({selFileCount} file{selFileCount !== 1 ? "s" : ""}, {selFolderCount} folder{selFolderCount !== 1 ? "s" : ""})
                  </span>
                )}
              </span>
              <div className="flex-1" />
              <button type="button"
                onClick={() => { setSelectedFiles(new Set()); setSelectedFolders(new Set()); }}
                className="flex items-center gap-1 text-xs font-semibold text-(--text-muted) hover:text-(--text)">
                <X size={12} /> Clear
              </button>
              <Button size="sm" variant="secondary" loading={bulkLoading}
                leftIcon={<RotateCcw size={13} />} onClick={handleBulkRestore} rounded="xl">
                Restore
              </Button>
              <Button size="sm" variant="danger" loading={bulkLoading}
                leftIcon={<Trash2 size={13} />} onClick={() => setShowDeleteConfirm(true)} rounded="xl">
                Delete Forever
              </Button>
            </div>
          )}

          {/* ── Tabs + filters toolbar ── */}
          {(hasAnyItems || loading) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              {/* Tab bar */}
              <div className="flex items-center gap-1 rounded-xl border border-gray-200/80 bg-white p-1 dark:border-zinc-700/60 dark:bg-zinc-900">
                {([
                  { value: "all",     label: "All",     count: files.length + folders.length },
                  { value: "files",   label: "Files",   count: files.length },
                  { value: "folders", label: "Folders", count: folders.length },
                ] as { value: ActiveTab; label: string; count: number }[]).map((t) => (
                  <button key={t.value} type="button" onClick={() => setTab(t.value)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                      tab === t.value
                        ? "bg-red-500 text-white shadow-sm"
                        : "text-(--text-muted) hover:bg-gray-50 hover:text-(--text) dark:hover:bg-zinc-800",
                    )}>
                    {t.label}
                    {!loading && (
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                        tab === t.value
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500 dark:bg-zinc-700 dark:text-gray-400",
                      )}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Type filter chips — visible on files tab */}
                {tab !== "folders" && (
                  <div className="flex items-center gap-1">
                    <Filter size={11} className="text-gray-400" />
                    {TYPE_FILTERS.map((tf) => (
                      <button key={tf.value} type="button" onClick={() => setTypeFilter(tf.value)}
                        className={cn(
                          "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition",
                          typeFilter === tf.value
                            ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-400"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-400",
                        )}>
                        {tf.icon} {tf.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Sort buttons */}
                <div className="flex items-center gap-1">
                  {(["name", "size", "deleted"] as SortField[]).map((f) => (
                    <button key={f} type="button" onClick={() => handleSort(f)}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium capitalize transition",
                        sortField === f
                          ? "border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-700 dark:bg-orange-950/20 dark:text-orange-400"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-400",
                      )}>
                      {f === "deleted" ? "Date" : f.charAt(0).toUpperCase() + f.slice(1)}
                      {sortField === f && (
                        sortDir === "asc"
                          ? <SortAsc size={10} />
                          : <SortDesc size={10} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 w-48 rounded-xl border border-gray-200 bg-white pl-8 pr-7 text-sm text-(--text) outline-none transition-all placeholder:text-gray-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/10 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  {search && (
                    <button type="button" aria-label="Clear search" onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <Spinner size={28} />
            </div>

          ) : !hasAnyItems ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200/80 bg-white py-24 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 dark:bg-zinc-800">
                <Trash2 size={30} className="text-gray-300 dark:text-zinc-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-(--text)">Trash is empty</p>
                <p className="mt-0.5 text-sm text-(--text-muted)">
                  Deleted files and folders will appear here for 30 days before being permanently removed.
                </p>
              </div>
            </div>

          ) : !hasFilteredItems ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200/80 bg-white py-20 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800">
                <Search size={22} className="text-gray-300 dark:text-zinc-600" />
              </div>
              <div>
                <p className="font-semibold text-(--text)">No items match your filter</p>
                <p className="mt-0.5 text-sm text-(--text-muted)">Try a different keyword or type.</p>
              </div>
            </div>

          ) : view === "grid" ? (
            /* ── Grid view ── */
            <div className="space-y-6">
              {showFolders && filteredFolders.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
                    Folders · {filteredFolders.length}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {filteredFolders.map((folder) => (
                      <div key={folder.id}
                        className={cn(
                          "group relative overflow-hidden rounded-2xl border bg-white p-4 transition-all duration-200 dark:bg-zinc-900",
                          selectedFolders.has(folder.id)
                            ? "border-orange-400 shadow-lg shadow-orange-500/10"
                            : "border-gray-200/80 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg dark:border-zinc-700/60",
                        )}>
                        <input
                          type="checkbox"
                          aria-label={`Select folder ${folder.name}`}
                          checked={selectedFolders.has(folder.id)}
                          onChange={(e) => toggleFolder(folder.id, e.target.checked)}
                          className="absolute left-4 top-4 h-4 w-4 accent-orange-500"
                        />
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/20">
                          <FolderIcon size={24} className="text-orange-500" />
                        </div>
                        <h3 title={folder.name} className="mb-1 truncate text-sm font-semibold text-(--text)">
                          {truncate(folder.name, 22)}
                        </h3>
                        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-(--text-muted)">
                          <span>{folder.fileCount ?? 0} files</span>
                          {folder.totalSize !== undefined && <span>{formatBytes(folder.totalSize)}</span>}
                        </div>
                        <DaysRemainingBadge trashedAt={folder.trashedAt} />
                        <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button type="button" aria-label="Restore folder"
                            onClick={() => restoreSingleFolder(folder.id)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 py-1.5 text-[11px] font-semibold text-green-700 transition hover:bg-green-100 dark:border-green-800/30 dark:bg-green-950/20 dark:text-green-400">
                            <RotateCcw size={11} /> Restore
                          </button>
                          <button type="button" aria-label="Delete folder forever"
                            onClick={() => deleteSingleFolder(folder.id)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showFiles && filteredFiles.length > 0 && (
                <div>
                  {showFolders && filteredFolders.length > 0 && (
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
                      Files · {filteredFiles.length}
                    </p>
                  )}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {filteredFiles.map((file) => (
                      <FileCard key={file.id} file={file} isTrash onRefresh={refresh}
                        selected={selectedFiles.has(file.id)} onSelect={toggleFile} />
                    ))}
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* ── List view ── */
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/80 dark:border-zinc-800 dark:bg-zinc-800/30">
                    <tr>
                      <th className="w-12 px-4 py-3.5 text-left" scope="col">
                        <input
                          type="checkbox"
                          checked={allCurrentSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all"
                          className="h-4 w-4 rounded accent-red-500"
                        />
                      </th>
                      {TABLE_HEADERS.map(({ label, field }, i) => (
                        <th
                          key={i}
                          scope="col"
                          onClick={field ? () => handleSort(field) : undefined}
                          className={cn(
                            "px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-(--text-muted)",
                            field && "cursor-pointer select-none hover:text-(--text)",
                          )}>
                          <span className="flex items-center gap-1">
                            {label}
                            {field && sortField === field && (
                              sortDir === "asc"
                                ? <SortAsc size={11} className="text-orange-500" />
                                : <SortDesc size={11} className="text-orange-500" />
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/60">

                    {/* ── Folder rows ── */}
                    {showFolders && filteredFolders.map((folder) => (
                      <tr key={`folder-${folder.id}`} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3.5">
                          <input type="checkbox"
                            aria-label={`Select folder ${folder.name}`}
                            checked={selectedFolders.has(folder.id)}
                            onChange={(e) => toggleFolder(folder.id, e.target.checked)}
                            className="h-4 w-4 accent-orange-500" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/20">
                              <FolderIcon size={16} className="text-orange-500" />
                            </div>
                            <div>
                              <p title={folder.name} className="max-w-52 truncate text-xs font-semibold text-(--text)">
                                {truncate(folder.name, 36)}
                              </p>
                              <p className="font-mono text-[11px] text-(--text-muted)">{folder.id.slice(0, 12)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
                            Folder
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-(--text-muted)">
                          <span>{folder.totalSize !== undefined ? formatBytes(folder.totalSize) : "—"}</span>
                          {folder.fileCount !== undefined && (
                            <p className="text-[11px]">{folder.fileCount} files</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-(--text-muted)">—</td>
                        <td className="px-4 py-3.5">
                          {folder.trashedAt ? (
                            <>
                              <p className="text-xs text-(--text-muted)">{formatRelative(folder.trashedAt)}</p>
                              <p className="text-[11px] text-(--text-muted)">{formatDateTime(folder.trashedAt)}</p>
                            </>
                          ) : <span className="text-xs text-(--text-muted)">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <DaysRemainingBadge trashedAt={folder.trashedAt} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" aria-label="Restore folder"
                              onClick={() => restoreSingleFolder(folder.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100 dark:border-green-800/30 dark:bg-green-950/20 dark:text-green-400">
                              <RotateCcw size={13} />
                            </button>
                            <button type="button" aria-label="Delete folder forever"
                              onClick={() => deleteSingleFolder(folder.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* ── File rows ── */}
                    {showFiles && filteredFiles.map((file) => (
                      <tr key={`file-${file.id}`} className="transition-colors hover:bg-gray-50/60 dark:hover:bg-zinc-800/30">
                        <td className="px-4 py-3.5">
                          <input type="checkbox"
                            aria-label={`Select ${file.name}`}
                            checked={selectedFiles.has(file.id)}
                            onChange={(e) => toggleFile(file.id, e.target.checked)}
                            className="h-4 w-4 accent-red-500" />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--bg-2)">
                              <FileTypeIcon mime={file.mimeType} ext={file.extension ?? ""} size={18} />
                            </div>
                            <div>
                              <p title={file.name} className="max-w-52 truncate text-xs font-semibold text-(--text)">
                                {truncate(file.name, 36)}
                              </p>
                              <p className="font-mono text-[11px] text-(--text-muted)">{file.id.slice(0, 12)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-(--text-muted) dark:bg-zinc-800">
                            {file.extension?.toUpperCase() || file.mimeType?.split("/")[1]?.toUpperCase() || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-(--text-muted)">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-4 py-3.5">
                          {file.owner ? (
                            <div>
                              <p className="text-xs font-medium text-(--text)">{file.owner.name}</p>
                              <p className="text-[11px] text-(--text-muted)">{file.owner.email}</p>
                            </div>
                          ) : <span className="text-xs text-(--text-muted)">—</span>}
                        </td>
                        <td className="px-4 py-3.5">
                          {file.trashedAt ? (
                            <>
                              <p className="text-xs text-(--text-muted)">{formatRelative(file.trashedAt)}</p>
                              <p className="text-[11px] text-(--text-muted)">{formatDateTime(file.trashedAt)}</p>
                            </>
                          ) : (
                            <span className="text-xs text-(--text-muted)">{formatRelative(file.updatedAt)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <DaysRemainingBadge trashedAt={file.trashedAt} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" aria-label={`Restore ${file.name}`}
                              onClick={() => restoreSingleFile(file.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-600 transition hover:bg-green-100 dark:border-green-800/30 dark:bg-green-950/20 dark:text-green-400">
                              <RotateCcw size={13} />
                            </button>
                            <button type="button" aria-label={`Delete ${file.name} forever`}
                              onClick={() => deleteSingleFile(file.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 dark:border-red-800/30 dark:bg-red-950/20 dark:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>
              {/* Table footer */}
              <div className="border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
                <p className="text-xs text-(--text-muted)">
                  {showFiles && (
                    <><span className="font-semibold text-(--text)">{filteredFiles.length}</span> file{filteredFiles.length !== 1 ? "s" : ""}</>
                  )}
                  {showFiles && showFolders && filteredFolders.length > 0 && " · "}
                  {showFolders && filteredFolders.length > 0 && (
                    <><span className="font-semibold text-(--text)">{filteredFolders.length}</span> folder{filteredFolders.length !== 1 ? "s" : ""}</>
                  )}
                  {" · "}<span className="font-semibold text-(--text)">{formatBytes(totalSize)}</span> total
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── Empty Trash confirmation ── */}
        {showEmptyConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            role="dialog" aria-modal="true" aria-labelledby="empty-trash-title">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowEmptyConfirm(false)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-1 w-full bg-linear-to-r from-red-500 to-rose-500" />
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/20">
                  <Trash2 size={22} />
                </div>
                <h2 id="empty-trash-title" className="mb-1.5 text-lg font-bold text-(--text)">
                  Empty trash?
                </h2>
                <p className="mb-2 text-sm text-(--text-muted)">
                  All{" "}
                  <span className="font-bold text-(--text)">{files.length + folders.length}</span>{" "}
                  item{(files.length + folders.length) !== 1 ? "s" : ""}{" "}
                  (<span className="font-semibold">{formatBytes(totalSize)}</span>) will be permanently deleted.
                </p>
                <p className="mb-5 text-xs font-semibold text-red-500">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth rounded="xl" onClick={() => setShowEmptyConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" fullWidth rounded="xl" leftIcon={<Trash2 size={14} />}
                    onClick={confirmEmptyTrash} loading={bulkLoading}>
                    Empty Trash
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete selected confirmation ── */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(false)} aria-hidden="true" />
            <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="h-1 w-full bg-linear-to-r from-red-500 to-rose-500" />
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/20">
                  <Trash2 size={22} />
                </div>
                <h2 id="delete-confirm-title" className="mb-1.5 text-lg font-bold text-(--text)">
                  Permanently delete?
                </h2>
                <p className="mb-2 text-sm text-(--text-muted)">
                  <span className="font-bold text-(--text)">{totalSelected}</span>{" "}
                  selected item{totalSelected !== 1 ? "s" : ""} will be permanently deleted.
                  {selFileCount > 0 && selFolderCount > 0 && (
                    <span className="mt-1 block text-xs">
                      ({selFileCount} file{selFileCount !== 1 ? "s" : ""},{" "}
                      {selFolderCount} folder{selFolderCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </p>
                <p className="mb-5 text-xs font-semibold text-red-500">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth rounded="xl" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" fullWidth rounded="xl" leftIcon={<Trash2 size={14} />}
                    onClick={handleBulkDelete} loading={bulkLoading}>
                    Delete Forever
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </AuthGuard>
  );
}
