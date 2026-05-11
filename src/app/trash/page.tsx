"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { filesApi } from "@/lib/api";
import { FileItem } from "@/types";
import { FileCard, FileRow } from "@/components/files/FileCard";
import { EmptyState, Badge } from "@/components/ui";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  LayoutGrid,
  List,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Button from "@/components/ui/Button";

export default function TrashPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");
  const [bulkLoading, setBulkLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await filesApi.getTrash();
      const f = res.data?.files || res.data?.data || res.data || [];
      setFiles(Array.isArray(f) ? f : []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleSelect(id: string, sel: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      sel ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function handleBulkRestore() {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await filesApi.bulkRestore(Array.from(selected));
      showToast.success(`${selected.size} files restored`);
      setSelected(new Set());
      load();
    } catch (err) {
      handleApiError(err);
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleEmptyTrash() {
    if (
      !confirm("Permanently delete ALL files in trash? This cannot be undone.")
    )
      return;
    setBulkLoading(true);
    try {
      await Promise.all(files.map((f) => filesApi.permanentDelete(f.id)));
      showToast.success("Trash emptied");
      setFiles([]);
      setSelected(new Set());
    } catch (err) {
      handleApiError(err);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                Trash
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {files.length} file{files.length !== 1 ? "s" : ""} in trash
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    style={{
                      padding: "8px 12px",
                      background: view === v ? "var(--accent)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: view === v ? "white" : "var(--text-muted)",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {v === "grid" ? (
                      <LayoutGrid size={15} />
                    ) : (
                      <List size={15} />
                    )}
                  </button>
                ))}
              </div>
              {files.length > 0 && (
                <Button
                  variant="danger"
                  loading={bulkLoading}
                  leftIcon={<Trash2 size={15} />}
                  onClick={handleEmptyTrash}
                >
                  Empty Trash
                </Button>
              )}
            </div>
          </div>

          {/* Warning */}
          {files.length > 0 && (
            <div
              style={{
                background: "var(--yellow-bg)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13,
              }}
            >
              <AlertTriangle
                size={15}
                style={{ color: "var(--yellow)", flexShrink: 0 }}
              />
              <span style={{ color: "var(--yellow)" }}>
                Files in trash will be permanently deleted after 30 days
              </span>
            </div>
          )}

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div
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
              <div style={{ flex: 1 }} />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={13} />}
                onClick={handleBulkRestore}
                loading={bulkLoading}
              >
                Restore Selected
              </Button>
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 52 }} />
              ))}
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              icon={<Trash2 size={32} />}
              title="Trash is empty"
              description="Deleted files will appear here"
            />
          ) : view === "grid" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {files.map((f) => (
                <FileCard
                  key={f.id}
                  file={f}
                  onRefresh={load}
                  isTrash
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
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        className="
    h-4 w-4
    rounded
    border-gray-300

    text-orange-500

    focus:ring-2
    focus:ring-orange-500/20

    dark:border-zinc-600
    dark:bg-zinc-800
  "
                        checked={
                          selected.size === files.length && files.length > 0
                        }
                        onChange={() =>
                          selected.size === files.length
                            ? setSelected(new Set())
                            : setSelected(new Set(files.map((f) => f.id)))
                        }
                      />
                    </th>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Deleted</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <FileRow
                      key={f.id}
                      file={f}
                      onRefresh={load}
                      isTrash
                      selected={selected.has(f.id)}
                      onSelect={toggleSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
