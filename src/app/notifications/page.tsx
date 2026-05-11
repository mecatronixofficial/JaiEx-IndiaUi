"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { notificationsApi } from "@/lib/api";
import { Notification } from "@/types";
import { Button, EmptyState } from "@/components/ui";
import { formatRelative } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import { handleApiError } from "@/lib/error-handler";
import { showToast } from "@/lib/toast";

const NOTIF_ICONS: Record<string, string> = {
  share: "📤",
  upload: "⬆️",
  download: "⬇️",
  system: "🔔",
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await notificationsApi.list();
      const n = res.data?.notifications || res.data?.data || res.data || [];
      setNotifs(Array.isArray(n) ? n : []);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      handleApiError(err);
    }
  }

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast.success("All notifications marked as read");
    } catch (err) {
      handleApiError(err);
    }
  }

  const unread = notifs.filter((n) => !n.isRead).length;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in" style={{ maxWidth: 680 }}>
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
                Notifications
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {unread > 0 ? `${unread} unread` : "All caught up"}
              </p>
            </div>
            {unread > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<CheckCheck size={14} />}
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 72 }} />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <EmptyState
              icon={<Bell size={32} />}
              title="No notifications"
              description="You're all caught up! New notifications will appear here."
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
              {notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    gap: 14,
                    cursor: n.isRead ? "default" : "pointer",
                    background: n.isRead ? "transparent" : "var(--accent-glow)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!n.isRead)
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(108,99,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    if (!n.isRead)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--accent-glow)";
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: "var(--bg-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {NOTIF_ICONS[n.type] || "🔔"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontWeight: n.isRead ? 500 : 700,
                          fontSize: 14,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-dim)",
                          flexShrink: 0,
                        }}
                      >
                        {formatRelative(n.createdAt)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginTop: 3,
                        lineHeight: 1.4,
                      }}
                    >
                      {n.message}
                    </div>
                  </div>
                  {!n.isRead && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
