"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { transactionsApi } from "@/lib/api";
import { Transaction } from "@/types";
import { Badge, Button, EmptyState } from "@/components/ui";
import { formatRelative, formatBytes, getFileIcon } from "@/lib/utils";
import { Activity, Upload, Download, Share2, Trash2 } from "lucide-react";
import { handleApiError } from "@/lib/error-handler";

const TX_ICONS: Record<string, React.ReactNode> = {
  upload: <Upload size={14} style={{ color: "var(--green)" }} />,
  download: <Download size={14} style={{ color: "var(--blue)" }} />,
  share: <Share2 size={14} style={{ color: "var(--accent)" }} />,
  delete: <Trash2 size={14} style={{ color: "var(--red)" }} />,
};
const TX_BADGE: Record<string, "success" | "info" | "warning" | "danger"> = {
  upload: "success",
  download: "info",
  share: "warning",
  delete: "danger",
};

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await transactionsApi.list({ limit: 50 });
        const t = res.data?.transactions || res.data?.data || res.data || [];
        setTxs(Array.isArray(t) ? t : []);
      } catch (err) {
        handleApiError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered =
    filter === "all" ? txs : txs.filter((t) => t.type === filter);

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
                Activity Log
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                All file operations tracked here
              </p>
            </div>
            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: 6,
                background: "var(--bg-3)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: 4,
              }}
            >
              {["all", "upload", "download", "share", "delete"].map((f) => (
                <Button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: filter === f ? "var(--accent)" : "transparent",
                    color: filter === f ? "white" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Activity size={32} />}
              title="No activity"
              description="File operations will be logged here"
            />
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
                    <th>Action</th>
                    <th>File</th>
                    <th>User</th>
                    <th>Size</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 8,
                              background: "var(--bg-3)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {TX_ICONS[tx.type] || "•"}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              textTransform: "capitalize",
                            }}
                          >
                            {tx.type}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {tx.file && (
                            <span style={{ fontSize: 18 }}>
                              {getFileIcon(
                                tx.file.mimeType,
                                tx.file.extension || "",
                              )}
                            </span>
                          )}
                          <span
                            style={{ fontSize: 13, color: "var(--text-muted)" }}
                          >
                            {tx.file?.name || tx.fileId || "—"}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {tx.user?.name || tx.userId || "—"}
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {tx.file?.size ? formatBytes(tx.file.size) : "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        {formatRelative(tx.createdAt)}
                      </td>
                      <td>
                        <Badge variant={TX_BADGE[tx.type] || "default"}>
                          {tx.type}
                        </Badge>
                      </td>
                    </tr>
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
