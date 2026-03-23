import { useEffect, useMemo, useState } from 'react';

function dayDiff(start, end) {
  return Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function SLABadge({ createdAt, status, resolvedAt }) {
  const [, tick] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => tick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const view = useMemo(() => {
    if (!createdAt) return { label: 'Within SLA', cls: 'bg-zinc-200 text-zinc-800' };
    const end = status === 'resolved' && resolvedAt ? resolvedAt : new Date();
    const days = dayDiff(createdAt, end);

    if (status === 'resolved') return { label: `✅ Resolved in ${days} days`, cls: 'bg-zinc-200 text-zinc-800' };
    if (days < 3) return { label: 'Within SLA', cls: 'bg-emerald-200 text-emerald-900' };
    if (days < 7) return { label: `⏰ ${days} days`, cls: 'bg-amber-200 text-amber-900' };
    return { label: `🚨 ${days} days - SLA Breached`, cls: 'bg-red-200 text-red-900' };
  }, [createdAt, resolvedAt, status]);

  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-mono ${view.cls}`}>{view.label}</span>;
}
