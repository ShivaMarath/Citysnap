export function CategoryBadge({ category }) {
  const map = {
    pothole: 'bg-black text-white',
    garbage: 'bg-civic-red text-white',
    streetlight: 'bg-amber-500 text-black',
    flooding: 'bg-sky-500 text-white',
    infrastructure: 'bg-emerald-600 text-white',
    other: 'bg-zinc-700 text-white',
  };
  const cls = map[category] || map.other;
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-mono ${cls}`}>{category}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    pending: 'bg-zinc-200 text-zinc-900',
    acknowledged: 'bg-indigo-200 text-indigo-900',
    in_progress: 'bg-amber-200 text-amber-900',
    resolved: 'bg-emerald-200 text-emerald-900',
    rejected: 'bg-rose-200 text-rose-900',
  };
  const cls = map[status] || 'bg-zinc-200 text-zinc-900';
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-mono ${cls}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    low: 'bg-zinc-100 text-zinc-800 border border-black/10',
    medium: 'bg-amber-100 text-amber-900 border border-black/10',
    high: 'bg-orange-200 text-orange-900 border border-black/10',
    critical: 'bg-red-200 text-red-900 border border-black/10',
  };
  const cls = map[priority] || map.low;
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-mono ${cls}`}>{priority}</span>;
}

