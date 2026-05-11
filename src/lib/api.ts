import axios, { AxiosError, AxiosInstance, AxiosProgressEvent } from "axios";

/* =========================
   CONFIG
========================= */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/* =========================
   SINGLETON STATE
========================= */

let api: AxiosInstance;
let isRefreshing = false;

type QueueItem = {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
};

let failedQueue: QueueItem[] = [];

/* =========================
   QUEUE HANDLER
========================= */

function processQueue(error?: unknown) {
  failedQueue.forEach((p) => {
    error ? p.reject(error) : p.resolve();
  });
  failedQueue = [];
}

/* =========================
   REDIRECT HANDLER
========================= */

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/* =========================
   AXIOS INSTANCE
========================= */

export function getApi(): AxiosInstance {
  if (api) return api;

  api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 60000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  /* =========================
     RESPONSE INTERCEPTOR
  ========================= */
  api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const originalRequest: any = error.config;
      const status = error.response?.status;

      if (!originalRequest) return Promise.reject(error);

      const excludedRoutes = [
        "/auth/login",
        "/auth/logout",
        "/auth/refresh",
        "/auth/forgot-password",
        "/auth/reset-password",
        "/auth/me",
      ];

      const isExcluded = excludedRoutes.some((r) =>
        originalRequest.url?.includes(r),
      );

      /* =========================
         RATE LIMIT HANDLING
      ========================= */
      if (status === 429) {
        const retryAfter = error.response?.headers?.["retry-after"];
        const wait = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

        await new Promise((r) => setTimeout(r, wait));
        return api(originalRequest);
      }

      /* =========================
         REFRESH TOKEN FLOW
      ========================= */
      if (status === 401 && !originalRequest._retry && !isExcluded) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: () => resolve(api(originalRequest)),
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await api.post("/auth/refresh");

          processQueue();
          return api(originalRequest);
        } catch (err) {
          processQueue(err);
          redirectToLogin();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
}

/* =========================
   AUTH API
   ✅ No token storage needed - cookies handled by browser
========================= */

export const authApi = {
  login: (email: string, password: string) =>
    getApi().post("/auth/login", { email, password }),

  logout: () => getApi().post("/auth/logout"),

  me: () => getApi().get("/auth/me"),

  refresh: () => getApi().post("/auth/refresh"),

  forgotPassword: (email: string) =>
    getApi().post("/auth/forgot-password", { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    getApi().post("/auth/reset-password", data),

  verifyEmail: (otp: string) => getApi().post("/auth/verify-email", { otp }),

  sendVerificationOTP: () => getApi().post("/auth/send-verification-otp"),
};

/* =========================
   USERS API
========================= */

export const usersApi = {
  create: (data: Record<string, unknown>) => getApi().post("/users", data),

  list: (params?: Record<string, unknown>) =>
    getApi().get("/users", { params }),

  me: () => getApi().get("/users/me"),

  getById: (id: string) => getApi().get(`/users/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    getApi().patch(`/users/${id}`, data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    getApi().put("/users/me/password", data),

  activate: (id: string) => getApi().patch(`/users/${id}/activate`),

  deactivate: (id: string) => getApi().patch(`/users/${id}/deactivate`),

  delete: (id: string) => getApi().delete(`/users/${id}`),

  getStorage: (id: string) => getApi().get(`/users/${id}/storage`),

  updateQuota: (id: string, quotaBytes: number) =>
    getApi().patch(`/users/${id}/quota`, { quotaBytes }),
};

/* =========================
   FILES API
========================= */

export const filesApi = {
  list: (params?: Record<string, unknown>, signal?: AbortSignal) =>
    getApi().get("/files", { params, signal }),

  getById: (id: string) => getApi().get(`/files/${id}`),

  getTrash: () => getApi().get("/files/trash"),

  download: (id: string, signal?: AbortSignal) =>
    getApi().get(`/files/${id}/download`, {
      responseType: "blob",
      signal,
    }),

  delete: (id: string) => getApi().delete(`/files/${id}`),

  restore: (id: string) => getApi().patch(`/files/${id}/restore`),

  permanentDelete: (id: string) => getApi().delete(`/files/${id}/permanent`),

  rename: (id: string, name: string) =>
    getApi().patch(`/files/${id}/rename`, { name }),

  move: (id: string, folderId: string | null) =>
    getApi().patch(`/files/${id}/move`, { folderId }),

  share: (id: string, data: { userId: string; permission: string }) =>
    getApi().post(`/files/${id}/share`, data),

  star: (id: string) => getApi().post(`/files/${id}/star`),

  bulkDelete: (ids: string[]) => getApi().post("/files/bulk-delete", { ids }),

  bulkRestore: (ids: string[]) => getApi().post("/files/bulk-restore", { ids }),
};

/* =========================
   UPLOAD API
========================= */

export const uploadApi = {
  uploadFile: (
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    if (folderId) formData.append("folderId", folderId);

    return getApi().post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        }
      },
    });
  },

  getPresignedUrl: (data: {
    filename: string;
    contentType: string;
    size: number;
    folderId?: string;
  }) => getApi().post("/upload/presigned-url", data),

  initiateMultipart: (data: {
    filename: string;
    contentType: string;
    size: number;
    folderId?: string;
  }) => getApi().post("/upload/multipart/initiate", data),

  completeMultipart: (data: {
    uploadId: string;
    key: string;
    parts: { ETag: string; PartNumber: number }[];
  }) => getApi().post("/upload/multipart/complete", data),
};

/* =========================
   FOLDERS API
========================= */

export const foldersApi = {
  create: (data: { name: string; parentId?: string }) =>
    getApi().post("/folders", data),

  list: (params?: Record<string, unknown>) =>
    getApi().get("/folders", { params }),

  tree: () => getApi().get("/folders/tree"),

  getById: (id: string) => getApi().get(`/folders/${id}`),

  getContents: (id: string) => getApi().get(`/folders/${id}/contents`),

  update: (id: string, data: { name: string }) =>
    getApi().put(`/folders/${id}`, data),

  delete: (id: string) => getApi().delete(`/folders/${id}`),

  move: (id: string, parentId: string | null) =>
    getApi().patch(`/folders/${id}/move`, { parentId }),
};

/* =========================
   SEARCH API
========================= */

export const searchApi = {
  search: (q: string, params?: Record<string, unknown>) =>
    getApi().get("/search", { params: { q, ...params } }),
};

/* =========================
   NOTIFICATIONS API
========================= */

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    getApi().get("/notifications", { params }),

  markRead: (id: string) => getApi().patch(`/notifications/${id}/read`),

  markAllRead: () => getApi().patch("/notifications/read-all"),

  getUnreadCount: () => getApi().get("/notifications/unread/count"),
};

/* =========================
   TRANSACTIONS API
========================= */

export const transactionsApi = {
  list: (params?: Record<string, unknown>) =>
    getApi().get("/transactions", { params }),

  getById: (id: string) => getApi().get(`/transactions/${id}`),

  getByUser: (userId: string) => getApi().get(`/transactions/user/${userId}`),

  getByFile: (fileId: string) => getApi().get(`/transactions/file/${fileId}`),
};

/* =========================
   ADMIN API
========================= */

export const adminApi = {
  overview: () => getApi().get("/admin/overview"),
  storage: () => getApi().get("/admin/storage"),
  activity: (params?: { days?: number }) =>
    getApi().get("/admin/activity", { params }),
  users: (params?: { page?: number; limit?: number }) =>
    getApi().get("/admin/users", { params }),
  companies: (params?: Record<string, unknown>) =>
    getApi().get("/admin/companies", { params }),
};

/* =========================
   DASHBOARD API
========================= */

export const dashboardApi = {
  getStats: () => getApi().get("/dashboard/stats"),
  getRecentActivity: (limit?: number) =>
    getApi().get("/dashboard/recent-activity", { params: { limit } }),
  getStorageAnalytics: () => getApi().get("/dashboard/storage"),
};

/* =========================
   EXPORT ALL
========================= */

export default {
  auth: authApi,
  users: usersApi,
  files: filesApi,
  folders: foldersApi,
  upload: uploadApi,
  search: searchApi,
  notifications: notificationsApi,
  transactions: transactionsApi,
  admin: adminApi,
  dashboard: dashboardApi,
};
