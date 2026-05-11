'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { filesApi } from '@/lib/api';
import { FileItem } from '@/types';
import { FileCard } from '@/components/files/FileCard';
import { EmptyState, Badge } from '@/components/ui';
import { Share2 } from 'lucide-react';
import { handleApiError } from '@/lib/error-handler';

export default function SharedPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await filesApi.sharedWithMe();
      const f = res.data?.files || res.data?.data || res.data || [];
      setFiles(Array.isArray(f) ? f : []);
    }  catch (err){ handleApiError(err) }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in">
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Shared with Me</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{files.length} files shared with you</p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              icon={<Share2 size={32} />}
              title="No shared files"
              description="Files shared with you by other users will appear here"
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {files.map(f => (
                <div key={f.id} style={{ position: 'relative' }}>
                  <FileCard file={f} onRefresh={load} isShared />
                  {f.owner && (
                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                      from {f.owner.name}
                    </div>
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
