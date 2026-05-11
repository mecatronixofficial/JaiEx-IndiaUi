'use client';

import {
  useState,
  useEffect,
  useCallback,
} from 'react';

import Sidebar from './Sidebar';
import Header from './Header';

import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

import UploadModal from '@/components/modals/UploadModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [storageUsed, setStorageUsed] =
    useState(0);

  const [storageQuota, setStorageQuota] =
    useState(10737418240);

  const [showUpload, setShowUpload] =
    useState(false);

  /* =========================
     LOAD STORAGE
  ========================= */

  const loadStorage = useCallback(
    async () => {
      if (!user?._id) return;

      try {
        const res =
          await usersApi.getStorage(
            user._id,
          );

        const storage =
          res.data?.storage ||
          res.data;

        setStorageUsed(
          storage?.used || 0,
        );

        setStorageQuota(
          storage?.quota ||
            10737418240,
        );
      } catch {
        // silent
      }
    },
    [user?._id],
  );

  /* =========================
     EFFECT
  ========================= */

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  /* =========================
     UI
  ========================= */

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">

      {/* Sidebar */}
      <Sidebar
        storageUsed={storageUsed}
        storageQuota={storageQuota}
        onUpload={() =>
          setShowUpload(true)
        }
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>

      {/* Upload Modal */}
      <UploadModal
        open={showUpload}
        onClose={() =>
          setShowUpload(false)
        }
        onUploadComplete={
          loadStorage
        }
      />
    </div>
  );
}