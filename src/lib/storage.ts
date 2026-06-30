type StorageRecord = Record<string, unknown>;

export interface StorageUsage {
  used: number;
  quota: number;
}

function asRecord(value: unknown): StorageRecord {
  return value && typeof value === "object" ? (value as StorageRecord) : {};
}

function readNumber(...values: unknown[]): number {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

export function unwrapStoragePayload(payload: unknown): StorageRecord {
  const root = asRecord(payload);
  const data = asRecord(root.data ?? root);
  return asRecord(data.data ?? data);
}

export function readStorageUsed(payload: unknown): number {
  const item = unwrapStoragePayload(payload);
  const storage = asRecord(item.storage);
  const summary = asRecord(item.summary);
  const usage = asRecord(item.usage);

  return readNumber(
    item.usedBytes,
    storage.usedBytes,
    usage.usedBytes,
    summary.totalUsedBytes,
    summary.totalSizeBytes,
    item.totalUsedBytes,
    item.totalSizeBytes,
    item.totalStorageUsed,
    item.totalStorage,
    item.used,
    item.totalUsed,
    item.storageUsed,
    item.storage_used,
  );
}

export function readStorageQuota(payload: unknown): number {
  const item = unwrapStoragePayload(payload);
  const storage = asRecord(item.storage);
  const summary = asRecord(item.summary);
  const usage = asRecord(item.usage);

  return readNumber(
    item.quotaBytes,
    storage.quotaBytes,
    usage.quotaBytes,
    summary.totalQuotaBytes,
    summary.totalAllocatedBytes,
    item.totalQuotaBytes,
    item.storageQuota,
    item.storage_quota,
    item.quota,
    item.totalQuota,
    item.totalAllocated,
  );
}

export function readStorageUsage(payload: unknown, fallback?: Partial<StorageUsage>): StorageUsage {
  const used = readStorageUsed(payload);
  const quota = readStorageQuota(payload);

  return {
    used: used || fallback?.used || 0,
    quota: quota || fallback?.quota || 0,
  };
}
