"use client";
import { useState, useCallback, useRef } from "react";
import { Modal } from "@/components/ui";
import { Upload, X, CheckCircle, AlertCircle, File } from "lucide-react";
import { uploadApi, filesApi } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import axios from "axios";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";
import Button from "../ui/Button";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  folderId?: string;
  onUploadComplete?: () => void;
}

const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadModal({
  open,
  onClose,
  folderId,
  onUploadComplete,
}: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploading = files.some((f) => f.status === "uploading");
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [
      ...prev,
      ...arr.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        progress: 0,
        status: "pending" as const,
      })),
    ]);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function updateFile(id: string, patch: Partial<UploadFile>) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function uploadSingle(uf: UploadFile) {
    try {
      updateFile(uf.id, { status: "uploading", progress: 5 });
      // Get presigned URL
      const res = await uploadApi.getPresignedUrl({
        filename: uf.file.name,
        contentType: uf.file.type || "application/octet-stream",
        size: uf.file.size,
        folderId,
      });
      const { url, key, fileId } = res.data;

      updateFile(uf.id, { progress: 20 });

      // Upload to S3-compatible storage
      await axios.put(url, uf.file, {
        headers: { "Content-Type": uf.file.type || "application/octet-stream" },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / (e.total || uf.file.size)) * 70);
          updateFile(uf.id, { progress: 20 + pct });
        },
      });

      // Register file in backend
      await filesApi.create({
        key,
        originalName: uf.file.name,
        size: uf.file.size,
        mimeType: uf.file.type,
        folderId,
        fileId,
      });

      updateFile(uf.id, { status: "done", progress: 100 });
    } catch (err: unknown) {
      handleApiError(err);
      const msg =
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as Error)?.message ||
        "Upload failed";
      updateFile(uf.id, { status: "error", error: msg });
    }
  }

  async function uploadMultipart(uf: UploadFile) {
    try {
      updateFile(uf.id, { status: "uploading", progress: 2 });
      const res = await uploadApi.initiateMultipart({
        filename: uf.file.name,
        contentType: uf.file.type || "application/octet-stream",
        size: uf.file.size,
        folderId,
      });
      const { uploadId, key, urls } = res.data;

      const parts: { ETag: string; PartNumber: number }[] = [];
      const totalChunks = Math.ceil(uf.file.size / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, uf.file.size);
        const chunk = uf.file.slice(start, end);
        const partUrl = urls?.[i] || "";

        const r = await axios.put(partUrl, chunk, {
          headers: { "Content-Type": uf.file.type },
        });
        parts.push({ PartNumber: i + 1, ETag: r.headers.etag });
        updateFile(uf.id, {
          progress: Math.round(((i + 1) / totalChunks) * 90),
        });
      }

      await uploadApi.completeMultipart({ uploadId, key, parts });
      updateFile(uf.id, { status: "done", progress: 100 });
    } catch (err: unknown) {
      handleApiError(err);
      const msg =
        (
          err as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (err as Error)?.message ||
        "Upload failed";
      updateFile(uf.id, { status: "error", error: msg });
    }
  }

  async function startUpload() {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;
    await Promise.all(
      pending.map((f) =>
        f.file.size > MULTIPART_THRESHOLD
          ? uploadMultipart(f)
          : uploadSingle(f),
      ),
    );
    const allDone = files.every(
      (f) => f.status === "done" || f.status === "error",
    );
    if (allDone) {
      showToast.success(`${pending.length} file(s) uploaded`);
      onUploadComplete?.();
    }
  }

  function handleClose() {
    if (!uploading) {
      setFiles([]);
      onClose();
    }
  }

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Modal open={open} onClose={handleClose} title="Upload Files" width={520}>
      {/* Drop zone */}
      <div
        className={`drop-zone ${isDragging ? "active" : ""}`}
        style={{
          padding: 32,
          textAlign: "center",
          marginBottom: 16,
          cursor: "pointer",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload
          size={32}
          style={{
            color: isDragging ? "var(--accent)" : "var(--text-dim)",
            margin: "0 auto 12px",
          }}
        />
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
          {isDragging ? "Drop files here" : "Drag & drop files here"}
        </div>
        <div
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}
        >
          or click to browse • Files up to 10GB supported
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <span
          style={{
            fontSize: 11,
            background: "var(--bg-3)",
            border: "1px solid var(--border)",
            borderRadius: 100,
            padding: "3px 12px",
            color: "var(--text-muted)",
          }}
        >
          Choose Files
        </span>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 20,
          }}
        >
          {files.map((f) => (
            <div
              key={f.id}
              style={{
                background: "var(--bg-3)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: f.status === "uploading" ? 8 : 0,
                }}
              >
                <File
                  size={16}
                  style={{ color: "var(--text-muted)", flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.file.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {formatBytes(f.file.size)}
                  </div>
                </div>
                {f.status === "done" && (
                  <CheckCircle size={16} style={{ color: "var(--green)" }} />
                )}
                {f.status === "error" && (
                  <AlertCircle size={16} style={{ color: "var(--red)" }} />
                )}
                {f.status === "pending" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(f.id)}
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
              {f.status === "uploading" && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              )}
              {f.status === "error" && (
                <div
                  style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}
                >
                  {f.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {(doneCount > 0 || errorCount > 0) && (
        <div
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}
        >
          {doneCount > 0 && (
            <span style={{ color: "var(--green)" }}>{doneCount} uploaded</span>
          )}
          {doneCount > 0 && errorCount > 0 && " · "}
          {errorCount > 0 && (
            <span style={{ color: "var(--red)" }}>{errorCount} failed</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="secondary" onClick={handleClose} disabled={uploading}>
          Cancel
        </Button>
        <Button
          onClick={startUpload}
          loading={uploading}
          disabled={files.filter((f) => f.status === "pending").length === 0}
          leftIcon={<Upload size={15} />}
        >
          Upload{" "}
          {files.filter((f) => f.status === "pending").length > 0
            ? `(${files.filter((f) => f.status === "pending").length} files)`
            : ""}
        </Button>
      </div>
    </Modal>
  );
}
