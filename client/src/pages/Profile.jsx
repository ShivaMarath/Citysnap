import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { api, getErrorMessage } from '../utils/api';
import ReportCard from '../components/reports/ReportCard';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('reports');
  const [my, setMy] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', ward: '', city: '', phone: '', avatar: '' });

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || '', ward: user.ward || '', city: user.city || '', phone: user.phone || '', avatar: user.avatar || '' });
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/reports/my');
        if (alive) setMy(res.data.items || []);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const initials = useMemo(() => {
    const parts = String(user?.name || '').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';
  }, [user?.name]);

  async function save() {
    setSaving(true);
    try {
      await updateUser(form);
      toast.success('Profile updated.');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-black text-white grid place-items-center font-display text-2xl">{initials}</div>
          <div>
            <div className="font-display text-5xl tracking-wide leading-none">Profile</div>
            <div className="text-sm text-black/70 mt-2">
              {user.email} · <span className="font-mono">{user.role}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="font-mono text-xs text-black/60">Reports submitted</div>
            <div className="font-display text-3xl tracking-wide">{user.reportsCount || 0}</div>
          </div>
          <div className="card p-4">
            <div className="font-mono text-xs text-black/60">Upvotes given</div>
            <div className="font-display text-3xl tracking-wide">{user.upvotesGiven || 0}</div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        <button className={tab === 'reports' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('reports')}>
          My reports
        </button>
        <button className={tab === 'settings' ? 'btn-primary' : 'btn-ghost'} onClick={() => setTab('settings')}>
          Settings
        </button>
      </div>

      {tab === 'reports' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {my.map((r) => (
            <ReportCard key={r._id} report={r} />
          ))}
        </div>
      ) : (
        <div className="card p-6 mt-6 max-w-xl">
          <div className="font-display text-3xl tracking-wide">Edit profile</div>
          <div className="grid gap-4 mt-5">
            <div>
              <div className="font-mono text-xs text-black/60">Name</div>
              <input className="input mt-1" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-mono text-xs text-black/60">Ward</div>
                <input className="input mt-1" value={form.ward} onChange={(e) => setForm((p) => ({ ...p, ward: e.target.value }))} />
              </div>
              <div>
                <div className="font-mono text-xs text-black/60">City</div>
                <input className="input mt-1" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
              </div>
            </div>
            <div>
              <div className="font-mono text-xs text-black/60">Phone</div>
              <input className="input mt-1" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <div className="font-mono text-xs text-black/60">Avatar URL (optional)</div>
              <input className="input mt-1" value={form.avatar} onChange={(e) => setForm((p) => ({ ...p, avatar: e.target.value }))} />
            </div>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

