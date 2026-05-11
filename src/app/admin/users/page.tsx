'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { Badge, Avatar, Modal, Input, EmptyState, SearchInput } from '@/components/ui';
import { formatBytes, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit3, Power, PowerOff, Trash2, HardDrive, RefreshCw } from 'lucide-react';
import { handleApiError } from '@/lib/error-handler';
import { error } from 'console';
import { showToast } from '@/lib/toast';
import Button from '@/components/ui/Button';

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showQuota, setShowQuota] = useState(false);
  const [quotaUser, setQuotaUser] = useState<User | null>(null);
  const [quotaGB, setQuotaGB] = useState('10');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });

  useEffect(() => {
    if (me && me.role !== 'admin') { router.push('/dashboard'); return; }
  }, [me, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ limit: 100 });
      const u = res.data?.users || res.data?.data || res.data || [];
      setUsers(Array.isArray(u) ? u : []);
    } catch { handleApiError(error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return handleApiError(error);
    setCreating(true);
    try {
      await usersApi.create(form);
      showToast.success('User created');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'user' });
      load();
    } catch (err: any) {handleApiError(err);}
    finally { setCreating(false); }
  }

  async function toggleActive(user: User) {
    try {
      if (user.isActive) await usersApi.deactivate(user.id);
      else await usersApi.activate(user.id);
      showToast.success( `User ${user.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { handleApiError(error) }
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This will delete all their files too.`)) return;
    try {
      await usersApi.delete(id);
      showToast.success('User deleted');
      load();
    } catch {  handleApiError(error) }
  }

  async function updateQuota(e: React.FormEvent) {
    e.preventDefault();
    if (!quotaUser) return;
    const bytes = parseFloat(quotaGB) * 1024 * 1024 * 1024;
    if (isNaN(bytes) || bytes <= 0) return  handleApiError(error);
    setCreating(true);
    try {
      await usersApi.updateQuota(quotaUser.id, bytes);
      showToast.success('Quota updated');
      setShowQuota(false);
      load();
    } catch {  handleApiError(error)}
    finally { setCreating(false); }
  }

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>User Management</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{users.length} total users</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchInput value={search} onChange={setSearch} placeholder="Search users..." />
              <Button icon={<RefreshCw size={14} />} variant="secondary" onClick={load}>Refresh</Button>
              <Button icon={<UserPlus size={15} />} onClick={() => setShowCreate(true)}>New User</Button>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="👤" title="No users found" description="No users match your search" />
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Storage Used</th>
                    <th>Quota</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ width: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} size={34} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={u.role === 'admin' ? 'info' : 'default'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {formatBytes(u.storageUsed || 0)}
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                          {u.storageQuota ? `${Math.round(((u.storageUsed || 0) / u.storageQuota) * 100)}%` : '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{u.storageQuota ? formatBytes(u.storageQuota) : '—'}</td>
                      <td>
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(u.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setQuotaUser(u); setQuotaGB(String(Math.round((u.storageQuota || 10737418240) / 1073741824))); setShowQuota(true); }}
                            title="Edit Quota" style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <HardDrive size={13} />
                          </button>
                          <button onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}
                            style={{ background: u.isActive ? 'var(--yellow-bg)' : 'var(--green-bg)', border: `1px solid ${u.isActive ? 'rgba(251,191,36,0.2)' : 'rgba(52,211,153,0.2)'}`, borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: u.isActive ? 'var(--yellow)' : 'var(--green)', display: 'flex', alignItems: 'center' }}>
                            {u.isActive ? <PowerOff size={13} /> : <Power size={13} />}
                          </button>
                          {u.id !== me?.id && (
                            <button onClick={() => deleteUser(u.id, u.name)} title="Delete User"
                              style={{ background: 'var(--red-bg)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
          <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating} icon={<UserPlus size={15} />}>Create User</Button>
            </div>
          </form>
        </Modal>

        {/* Quota Modal */}
        <Modal open={showQuota} onClose={() => setShowQuota(false)} title="Update Storage Quota">
          <form onSubmit={updateQuota} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 12, background: 'var(--bg-3)', borderRadius: 8, fontSize: 13 }}>
              Updating quota for: <strong>{quotaUser?.name}</strong>
            </div>
            <Input label="Quota (GB)" type="number" value={quotaGB} onChange={e => setQuotaGB(e.target.value)} min="1" max="10240" step="1" />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setShowQuota(false)}>Cancel</Button>
              <Button type="submit" loading={creating} icon={<HardDrive size={15} />}>Update Quota</Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
