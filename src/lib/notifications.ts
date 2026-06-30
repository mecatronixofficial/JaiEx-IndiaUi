import { Notification } from "@/types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function readBoolean(...values: unknown[]): boolean {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
  }
  return false;
}

function readNumber(...values: unknown[]): number {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function unwrap(payload: unknown): unknown {
  const root = asRecord(payload);
  const first = root.data ?? root;
  const second = asRecord(first).data ?? first;
  return second;
}

function readNotificationArray(payload: unknown): unknown[] {
  const data = unwrap(payload);
  if (Array.isArray(data)) return data;

  const record = asRecord(data);
  const candidates = [
    record.notifications,
    record.items,
    record.results,
    record.docs,
    asRecord(record.data).notifications,
    asRecord(record.data).items,
  ];

  return candidates.find(Array.isArray) ?? [];
}

export function normalizeNotification(item: unknown): Notification {
  const record = asRecord(item);
  const id = readString(record.id, record._id, record.notificationId);
  const message = readString(record.message, record.body, record.description, record.text);

  return {
    id,
    organizationId: readString(record.organizationId) || null,
    type: readString(record.type, record.category, record.eventType) || "system",
    title: readString(record.title, record.subject, message) || "Notification",
    message,
    isRead: readBoolean(record.isRead, record.read, record.seen, record.is_read),
    userId: readString(record.userId, record.user),
    targetType: (readString(record.targetType, record.resourceType) || null) as Notification["targetType"],
    targetId: readString(record.targetId, record.resourceId) || null,
    metadata: asRecord(record.metadata),
    createdAt: readString(record.createdAt, record.created_at, record.time, record.date) || new Date().toISOString(),
  };
}

export function getNotificationsFromResponse(payload: unknown): Notification[] {
  return readNotificationArray(payload)
    .map(normalizeNotification)
    .filter((notification) => notification.id);
}

export function getUnreadCountFromResponse(payload: unknown): number {
  const data = unwrap(payload);
  if (typeof data === "number") return data;

  const record = asRecord(data);
  return readNumber(
    record.count,
    record.unreadCount,
    record.unread,
    record.totalUnread,
    record.notificationsUnread,
    asRecord(record.notifications).unread,
    asRecord(record.data).count,
  );
}
