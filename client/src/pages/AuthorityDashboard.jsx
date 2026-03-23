import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, getErrorMessage } from '../utils/api';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/common/Badges';

const STATUS = ['', 'pending', 'acknowledged', 'in_progress', 'resolved', 'rejected'];
const PRIORITY = ['', 'low', 'medium', 'high', 'critical'];
const CATEGORY = ['', 'pothole', 'garbage', 'streetlight', 'flooding', 'infrastructure', 'other'];

export default function AuthorityDashboard() {
  const [dash, setDash] = useState(null);
  const [reports, setReports] = useState({ items: [], total: 0, page: 1, limit: 20 });
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [modal, setModal] = useState({ open: false, report: null, status: 'acknowledged', note: '' });

  async function loadDash() {
    const res = await api.get('/authority/dashboard');
    setDash(res.data);
  }

  async function loadReports(page = 1) {
    const res = await api.get('/authority/reports', { params: { ...filters, page, limit: 20 } });
    setReports(res.data);
  }

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadDash(), loadReports(1)]);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadReports(1);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.category]);

  const byCategory = useMemo(() => dash?.byCategory || [], [dash]);
  const resolutionPie = useMemo(() => {
    const r = dash?.stats?.resolved || 0;
    const t = dash?.stats?.total || 0;
    const u = Math.max(0, t - r);
    return [
      { name: 'Resolved', value: r },
      { name: 'Unresolved', value: u },
    ];
  }, [dash]);

  async function openUpdate(r) {
    setModal({ open: true, report: r, status: r.status, note: '' });
  }

  async function saveUpdate() {
    try {
      await api.patch(`/authority/reports/${modal.report._id}/status`, { status: modal.status, note: modal.note });
      toast.success('Updated.');
      setModal({ open: false, report: null, status: 'acknowledged', note: '' });
      await Promise.all([loadDash(), loadReports(reports.page)]);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (!dash) return <div className="py-20 text-center font-mono text-sm text-black/60">Loading…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="font-display text-5xl tracking-wide leading-none">Authority dashboard</div>
      <div className="text-sm text-black/70 mt-2">Prioritize by upvotes. Resolve with one update—emails go out automatically.</div>

      <div className="grid md:grid-cols-4 gap-4 mt-6">
        {[
          { k: 'Total', v: dash.stats.total },
          { k: 'Pending', v: dash.stats.pending },
          { k: 'In progress', v: dash.stats.inProgress },
          { k: 'Resolved', v: dash.stats.resolved },
        ].map((s) => (
          <div key={s.k} className="card p-5">
            <div className="font-mono text-xs text-black/60">{s.k}</div>
            <div className="font-display text-4xl tracking-wide">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="card p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="font-mono text-xs text-black/60">Chart</div>
              <div className="font-display text-2xl tracking-wide">Issues by category</div>
            </div>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d0d0d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-mono text-xs text-black/60">Chart</div>
          <div className="font-display text-2xl tracking-wide">Resolution rate</div>
          <div className="text-sm text-black/70 mt-1">{dash.stats.resolutionRate}%</div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={resolutionPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {resolutionPie.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? '#10b981' : '#e84b2e'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="font-mono text-xs text-black/60">Queue</div>
            <div className="font-display text-2xl tracking-wide">Reports</div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <select className="input" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
              {STATUS.map((s) => (
                <option key={s || 'all'} value={s}>
                  {s ? s : 'All status'}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={filters.priority}
              onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
            >
              {PRIORITY.map((p) => (
                <option key={p || 'all'} value={p}>
                  {p ? p : 'All priority'}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={filters.category}
              onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
            >
              {CATEGORY.map((c) => (
                <option key={c || 'all'} value={c}>
                  {c ? c : 'All category'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-auto mt-5">
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-xs text-black/60">
              <tr>
                <th className="py-2 pr-3">Issue</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Location</th>
                <th className="py-2 pr-3">Reports</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.items.map((r) => (
                <tr key={r._id} className="border-t border-black/10">
                  <td className="py-3 pr-3">
                    <div className="font-display text-lg tracking-wide leading-none">{r.title}</div>
                    <div className="text-xs text-black/60 clamp-1">{r.description}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <CategoryBadge category={r.category} />
                  </td>
                  <td className="py-3 pr-3 text-xs text-black/70">
                    {[r.location?.ward ? `Ward ${r.location.ward}` : '', r.location?.city || ''].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="py-3 pr-3 font-mono text-xs">▲ {r.upvotes || 0}</td>
                  <td className="py-3 pr-3">
                    <PriorityBadge priority={r.priority} />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3 pr-3">
                    <button className="btn-ghost" onClick={() => openUpdate(r)}>
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="font-mono text-xs text-black/60">
            Page {reports.page} · {reports.total} total
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => loadReports(Math.max(1, reports.page - 1))} disabled={reports.page <= 1}>
              Prev
            </button>
            <button
              className="btn-ghost"
              onClick={() => loadReports(reports.page + 1)}
              disabled={reports.page * reports.limit >= reports.total}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="font-display text-3xl tracking-wide">Update status</div>
            <div className="text-sm text-black/70 mt-1">{modal.report.title}</div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="font-mono text-xs text-black/60">Status</div>
                <select className="input mt-1" value={modal.status} onChange={(e) => setModal((p) => ({ ...p, status: e.target.value }))}>
                  {STATUS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="font-mono text-xs text-black/60">Note</div>
                <textarea
                  className="input mt-1 min-h-28"
                  value={modal.note}
                  onChange={(e) => setModal((p) => ({ ...p, note: e.target.value }))}
                  placeholder="What changed? Any instructions?"
                />
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setModal({ open: false, report: null, status: 'acknowledged', note: '' })}>
                  Cancel
                </button>
                <button className="btn-primary flex-1" onClick={saveUpdate}>
                  Save
                </button>
              </div>
              <div className="text-xs font-mono text-black/60">
                Setting status to <b>resolved</b> will trigger resolution emails to all upvoters.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

