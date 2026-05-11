export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  storageUsed: number;
  storageQuota: number;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  extension: string;
  url?: string;
  thumbnailUrl?: string;
  folderId?: string;
  ownerId: string;
  owner?: User;
  isShared: boolean;
  sharedWith?: ShareEntry[];
  isTrashed: boolean;
  trashedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareEntry {
  userId: string;
  user?: User;
  permission: 'view' | 'edit' | 'admin';
  sharedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  parent?: Folder;
  children?: Folder[];
  files?: FileItem[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  fileCount?: number;
  totalSize?: number;
}

export interface Transaction {
  id: string;
  type: 'upload' | 'download' | 'share' | 'delete';
  fileId: string;
  file?: FileItem;
  userId: string;
  user?: User;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'share' | 'upload' | 'download' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
  breakdown?: {
    images: number;
    videos: number;
    documents: number;
    other: number;
  };
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  totalFiles: number;
  totalStorage: number;
  recentUploads: number;
  recentDownloads: number;
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}
