"use client";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { FileCard, FileRow } from "@/components/files/FileCard";
import { EmptyState, SearchInput, Modal } from "@/components/ui";
import { filesApi } from "@/lib/api";
import { FileItem } from "@/types";
import UploadModal from "@/components/modals/UploadModal";
import {
  Upload,
  LayoutGrid,
  List,
  Trash2,
  Move,
  Share2,
  RefreshCw,
  X,
  UserPlus,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareFileId, setShareFileId] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await filesApi.list({ page, limit, q: search || undefined });
      const data = res.data;
      const f = data?.files || data?.data || data || [];
      setFiles(Array.isArray(f) ? f : []);
      setTotal(data?.total || f.length);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  function toggleSelect(id: string, sel: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      sel ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === files.length) setSelected(new Set());
    else setSelected(new Set(files.map((f) => f.id)));
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} files?`)) return;
    try {
      await filesApi.bulkDelete(Array.from(selected));
      showToast.success(`${selected.size} files moved to trash`);
      setSelected(new Set());
      load();
    } catch (error) {
      handleApiError(error);
    }
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setSharing(true);
    try {
      await filesApi.share(shareFileId, { emails: [shareEmail] });
      showToast.success("File shared successfully");
      setShowShare(false);
      setShareEmail("");
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSharing(false);
    }
  }

  const filtered = files.filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>
                My Files
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {total} files total
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search files..."
              />
              <div
                style={{
                  display: "flex",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                }}
              >
                {(["grid", "list"] as const).map((v) => (
                  <Button
                    key={v}
                    variant={view === v ? "primary" : "ghost"}
                    size="icon"
                    onClick={() => setView(v)}
                    className="rounded-none"
                  >
                    {v === "grid" ? (
                      <LayoutGrid size={15} />
                    ) : (
                      <List size={15} />
                    )}
                  </Button>
                ))}
              </div>
              <Button
                leftIcon={<Upload size={16} />}
                onClick={() => setShowUpload(true)}
              >
                Upload
              </Button>
            </div>
          </div>

          {/* Bulk actions bar */}
          {selected.size > 0 && (
            <div
              className="animate-fade-in"
              style={{
                background: "var(--accent-glow)",
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {selected.size} selected
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(new Set())}
                className="h-8 w-8"
              >
                <X size={15} />
              </Button>
              <div style={{ flex: 1 }} />
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={handleBulkDelete}
              >
                Delete
              </Button>
            </div>
          )}

          {/* Select all */}
          {files.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <input
                type="checkbox"
                checked={selected.size === files.length && files.length > 0}
                onChange={toggleAll}
                className="
    h-4 w-4 rounded
    border-gray-300
    text-orange-500
    focus:ring-orange-500
  "
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Select all
              </span>
            </div>
          )}

          {loading ? (
            view === "grid" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 150 }} />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 52 }} />
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📁"
              title={search ? "No files found" : "No files yet"}
              description={
                search
                  ? "Try a different search term"
                  : "Upload files to get started"
              }
              action={
                !search && (
                  <Button
                    onClick={() => setShowUpload(true)}
                    leftIcon={<Upload size={15} />}
                  >
                    Upload Files
                  </Button>
                )
              }
            />
          ) : view === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {filtered.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  onRefresh={load}
                  selected={selected.has(f.id)}
                  onSelect={toggleSelect}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                overflow: "hidden",
              }}
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Modified</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <FileRow
                      key={f.id}
                      file={f}
                      onRefresh={load}
                      selected={selected.has(f.id)}
                      onSelect={toggleSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 24,
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  padding: "0 12px",
                }}
              >
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onUploadComplete={load}
        />

        {/* Share Modal */}
        <Modal
          open={showShare}
          onClose={() => setShowShare(false)}
          title="Share File"
        >
          <form
            onSubmit={handleShare}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Share with"
              type="email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="user@example.com"
              leftIcon={<UserPlus size={16} />}
              required
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowShare(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={sharing}
                leftIcon={<Share2 size={15} />}
              >
                Share
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
