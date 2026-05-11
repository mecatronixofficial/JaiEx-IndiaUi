'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { adminApi, usersApi } from '@/lib/api';
import { User } from '@/types';
import { Card, Spinner, Badge, Avatar } from '@/components/ui';
import { formatBytes } from '@/lib/utils';
import { HardDrive, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { handleApiError } from '@/lib/error-handler';
import { error } from 'console';

export default function AdminStoragePage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const [storageData, setStorageData] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (me && me.role !== 'admin') { router.push('/dashboard'); return; }
    (async () => {
      setLoading(true);
      try {
        const [storRes, usersRes] = await Promise.allSettled([adminApi.storage(), usersApi.list({ limit: 50 })]);
        if (storRes.status === 'fulfilled') setStorageData(storRes.value.data?.storage || storRes.value.data);
        if (usersRes.status === 'fulfilled') {
          const u = usersRes.value.data?.users || usersRes.value.data?.data || usersRes.value.data || [];
          setUsers(Array.isArray(u) ? u : []);
        }
      } catch {handleApiError(error) }
      finally { setLoading(false); }
    })();
  }, [me, router]);

  const totalUsed = users.reduce((sum, u) => sum + (u.storageUsed || 0), 0);
  const totalQuota = users.reduce((sum, u) => sum + (u.storageQuota || 0), 0);
  const usedPct = totalQuota > 0 ? Math.min((totalUsed / totalQuota) * 100, 100) : 0;

  const breakdown = storageData?.breakdown || {
    images: 0, videos: 0, documents: 0, other: 0,
  };
  const breakdownTotal = Object.values(breakdown).reduce((s: number, v) => s + (v as number), 0) || 1;

  const cats = [
    { label: 'Images', value: breakdown.images || 0, color: '#f59e0b', emoji: '🖼️' },
    { label: 'Videos', value: breakdown.videos || 0, color: '#8b5cf6', emoji: '🎬' },
    { label: 'Documents', value: breakdown.documents || 0, color: '#3b82f6', emoji: '📄' },
    { label: 'Other', value: breakdown.other || 0, color: 'var(--text-dim)', emoji: '📁' },
  ];

  const topUsers = [...users].sort((a, b) => (b.storageUsed || 0) - (a.storageUsed || 0)).slice(0, 8);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Storage Report</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Platform-wide storage usage breakdown</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>
          ) : (
            <>
              {/* Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Used</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{formatBytes(totalUsed)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>across {users.length} users</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Total Quota</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{formatBytes(totalQuota)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>allocated to all users</div>
                </div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Utilization</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: usedPct > 80 ? 'var(--red)' : usedPct > 60 ? 'var(--yellow)' : 'var(--green)' }}>
                    {usedPct.toFixed(1)}%
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div className="storage-bar">
                      <div className="storage-fill" style={{ width: `${usedPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* File type breakdown */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Storage by File Type</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {cats.map(cat => {
                      const pct = ((cat.value / (breakdownTotal || 1)) * 100);
                      return (
                        <div key={cat.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{cat.emoji}</span> {cat.label}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {formatBytes(cat.value)} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="storage-bar">
                            <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top users by storage */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700 }}>Top Users by Storage</h3>
                  </div>
                  {topUsers.map((u, i) => {
                    const pct = u.storageQuota ? Math.min(((u.storageUsed || 0) / u.storageQuota) * 100, 100) : 0;
                    return (
                      <div key={u.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', width: 18, textAlign: 'right' }}>#{i + 1}</span>
                        <Avatar name={u.name} size={28} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <div style={{ flex: 1, height: 3, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--red)' : 'var(--accent)', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatBytes(u.storageUsed || 0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
