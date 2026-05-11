"use client";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { foldersApi, filesApi } from "@/lib/api";
import { Folder, FileItem } from "@/types";
import { formatRelative } from "@/lib/utils";
import { EmptyState, Modal } from "@/components/ui";
import { FileCard } from "@/components/files/FileCard";
import UploadModal from "@/components/modals/UploadModal";
import {
  FolderOpen,
  FolderPlus,
  ChevronRight,
  Home,
  MoreVertical,
  Edit3,
  Trash2,
  Upload,
} from "lucide-react";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function FoldersPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (currentFolder) {
        const [folderRes, filesRes] = await Promise.allSettled([
          foldersApi.getById(currentFolder.id),
          foldersApi.getFiles(currentFolder.id),
        ]);
        if (folderRes.status === "fulfilled") {
          const f = folderRes.value.data?.folder || folderRes.value.data;
          setFolders(f?.children || []);
        }
        if (filesRes.status === "fulfilled") {
          const fi =
            filesRes.value.data?.files ||
            filesRes.value.data?.data ||
            filesRes.value.data ||
            [];
          setFiles(Array.isArray(fi) ? fi : []);
        }
      } else {
        const res = await foldersApi.list({ parentId: "root" });
        const f = res.data?.folders || res.data?.data || res.data || [];
        setFolders(Array.isArray(f) ? f : []);
        setFiles([]);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    load();
  }, [load]);

  function navigateTo(folder: Folder | null) {
    if (!folder) {
      setCurrentFolder(null);
      setBreadcrumb([]);
    } else {
      setCurrentFolder(folder);
      setBreadcrumb((prev) => {
        const idx = prev.findIndex((f) => f.id === folder.id);
        if (idx >= 0) return prev.slice(0, idx + 1);
        return [...prev, folder];
      });
    }
  }

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!folderName.trim()) return;
    setCreating(true);
    try {
      await foldersApi.create({
        name: folderName.trim(),
        parentId: currentFolder?.id,
      });
      showToast.success("Folder created");
      setShowCreate(false);
      setFolderName("");
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setCreating(false);
    }
  }

  async function renameFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !folderName.trim()) return;
    setCreating(true);
    try {
      await foldersApi.update(renameTarget.id, { name: folderName.trim() });
      showToast.success("Folder renamed");
      setShowRename(false);
      setRenameTarget(null);
      setFolderName("");
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setCreating(false);
    }
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder and all its contents?")) return;
    try {
      await foldersApi.delete(id);
      showToast.success("Folder deleted");
      load();
    } catch (error) {
      handleApiError(error);
    }
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in">
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
                Folders
              </h1>
              {/* Breadcrumb */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Home size={13} />}
                  onClick={() => navigateTo(null)}
                >
                  Root
                </Button>
                {breadcrumb.map((b, i) => (
                  <span
                    key={b.id}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <ChevronRight
                      size={12}
                      style={{ color: "var(--text-dim)" }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateTo(b)}
                    >
                      {b.name}
                    </Button>
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                variant="secondary"
                leftIcon={<Upload size={15} />}
                onClick={() => setShowUpload(true)}
              >
                Upload Here
              </Button>
              <Button
                leftIcon={<FolderPlus size={15} />}
                onClick={() => setShowCreate(true)}
              >
                New Folder
              </Button>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 80 }} />
              ))}
            </div>
          ) : (
            <>
              {/* Folders grid */}
              {folders.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    FOLDERS ({folders.length})
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: 12,
                      marginBottom: 24,
                    }}
                  >
                    {folders.map((folder) => (
                      <div
                        key={folder.id}
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          padding: "14px 16px",
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          position: "relative",
                        }}
                        onClick={() => navigateTo(folder)}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor =
                            "var(--accent)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.borderColor =
                            "var(--border)")
                        }
                      >
                        <div style={{ fontSize: 32, flexShrink: 0 }}>📁</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {folder.name}
                          </div>
                          <div
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {folder.fileCount !== undefined
                              ? `${folder.fileCount} files`
                              : "—"}{" "}
                            · {formatRelative(folder.createdAt)}
                          </div>
                        </div>
                        {/* Folder menu */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setRenameTarget(folder);
                              setFolderName(folder.name);
                              setShowRename(true);
                            }}
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteFolder(folder.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Files in current folder */}
              {files.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-dim)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    FILES ({files.length})
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                  >
                    {files.map((f) => (
                      <FileCard key={f.id} file={f} onRefresh={load} />
                    ))}
                  </div>
                </>
              )}

              {folders.length === 0 && files.length === 0 && (
                <EmptyState
                  icon={<FolderOpen size={32} />}
                  title="Empty folder"
                  description="Create a new folder or upload files here"
                  action={
                    <Button
                      leftIcon={<FolderPlus size={15} />}
                      onClick={() => setShowCreate(true)}
                    >
                      New Folder
                    </Button>
                  }
                />
              )}
            </>
          )}
        </div>

        <Modal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          title="New Folder"
        >
          <form
            onSubmit={createFolder}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              id="folder-name"
              label="Folder Name"
              placeholder="Enter folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
              autoFocus
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                loading={creating}
                leftIcon={<FolderPlus size={15} />}
              >
                Create Folder
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={showRename}
          onClose={() => setShowRename(false)}
          title="Rename Folder"
        >
          <form
            onSubmit={renameFolder}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              id="rename-folder"
              label="New Folder Name"
              placeholder="Enter new folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
              autoFocus
            />
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowRename(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                Rename
              </Button>
            </div>
          </form>
        </Modal>

        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          folderId={currentFolder?.id}
          onUploadComplete={load}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
