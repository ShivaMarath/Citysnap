import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import ReportCard from '../components/reports/ReportCard';
import { api, getErrorMessage } from '../utils/api';

const CATEGORIES = ['', 'pothole', 'garbage', 'streetlight', 'flooding', 'infrastructure', 'other'];
const STATUSES = ['', 'pending', 'acknowledged', 'in_progress', 'resolved', 'rejected'];
const SORTS = [
  { v: 'new', l: 'Newest' },
  { v: 'upvotes', l: 'Most upvotes' },
];

export default function Feed() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const res = await api.get('/reports', { params: { category, status, sort, page, limit } });
        if (alive) setData(res.data);
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [category, status, sort, page, limit]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.items;
    return data.items.filter((r) => (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q));
  }, [data.items, search]);

  const totalPages = Math.max(1, Math.ceil((data.total || 0) / limit));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="font-display text-5xl tracking-wide leading-none">Feed</div>
          <div className="text-sm text-black/70 mt-2">One issue, one record. Nearby duplicates become upvotes.</div>
        </div>
      </div>

      <div className="card p-4 mt-6">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <div className="font-mono text-xs text-black/60">Search</div>
            <input className="input mt-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="title / description" />
          </div>
          <div>
            <div className="font-mono text-xs text-black/60">Category</div>
            <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c || 'all'} value={c}>
                  {c ? c : 'All'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="font-mono text-xs text-black/60">Status</div>
            <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s || 'all'} value={s}>
                  {s ? s : 'All'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="font-mono text-xs text-black/60">Sort</div>
            <select className="input mt-1" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center font-mono text-sm text-black/60">Loading…</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {filtered.map((r) => (
              <ReportCard key={r._id} report={r} />
            ))}
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="font-mono text-xs text-black/60">
              Page {page} of {totalPages} · {data.total} total
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Prev
              </button>
              <button className="btn-ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

