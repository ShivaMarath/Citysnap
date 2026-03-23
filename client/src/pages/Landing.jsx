import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function Landing() {
  const [stats, setStats] = useState({ total: 0, resolved: 0, duplicateRate: 0 });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/reports/stats');
        if (alive) setStats(res.data);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const steps = useMemo(
    () => [
      { k: '01', t: 'Snap', d: 'Photograph the issue.' },
      { k: '02', t: 'Pin', d: 'Drop a location on the map.' },
      { k: '03', t: 'Report', d: 'Submit once. Duplicates become upvotes.' },
      { k: '04', t: 'Resolve', d: 'Track status until fixed.' },
    ],
    []
  );

  const cats = ['pothole', 'garbage', 'streetlight', 'flooding', 'infrastructure', 'other'];

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="min-h-[calc(100vh-72px)] grid lg:grid-cols-2 gap-10 items-center py-14">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 font-mono text-xs">
            <span className="rounded-full border border-black/15 px-3 py-1">OpenStreetMap</span>
            <span className="rounded-full border border-black/15 px-3 py-1">Roboflow ML</span>
            <span className="rounded-full border border-black/15 px-3 py-1">Cloudinary</span>
          </div>

          <h1 className="font-display text-6xl md:text-7xl tracking-wider leading-[0.9]">
            SNAP. <span className="text-civic-red">REPORT.</span> RESOLVE.
          </h1>
          <p className="text-black/70 text-lg max-w-xl">
            CitySnap turns a photo + pin into a tracked civic issue. If multiple people report the same problem nearby, we upvote
            and escalate instead of spamming duplicates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Get started
            </Link>
            <Link to="/feed" className="btn-ghost">
              View the feed
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6">
            <div className="card p-4">
              <div className="font-mono text-xs text-black/60">Total reports</div>
              <div className="font-display text-3xl tracking-wide">{stats.total}</div>
            </div>
            <div className="card p-4">
              <div className="font-mono text-xs text-black/60">Duplicate rate</div>
              <div className="font-display text-3xl tracking-wide">{Math.round((stats.duplicateRate || 0) * 100)}%</div>
            </div>
            <div className="card p-4">
              <div className="font-mono text-xs text-black/60">Resolved</div>
              <div className="font-display text-3xl tracking-wide">{stats.resolved}</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-xs text-black/60">Live preview</div>
              <div className="font-display text-2xl tracking-wide">City feed</div>
            </div>
            <div className="grid gap-3">
              {[
                { c: 'pothole', t: 'Road crater near school', s: 'pending', u: 7 },
                { c: 'garbage', t: 'Overflowing bins', s: 'in_progress', u: 12 },
                { c: 'streetlight', t: 'Light out on Main', s: 'acknowledged', u: 3 },
              ].map((r) => (
                <div key={r.t} className="border border-black/10 rounded-lg p-3 bg-white/60">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-black/60">{r.c}</div>
                    <div className="font-mono text-xs">▲ {r.u}</div>
                  </div>
                  <div className="font-display text-xl tracking-wide leading-none mt-1">{r.t}</div>
                  <div className="font-mono text-xs text-black/50 mt-1">{r.s}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -z-10 -inset-6 bg-civic-red/10 blur-2xl rounded-full" />
        </div>
      </div>

      <div className="py-12 border-t border-black/10">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h2 className="font-display text-4xl tracking-wide">How it works</h2>
          <div className="font-mono text-xs text-black/60">Designed for clarity, not clutter.</div>
        </div>
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {steps.map((s) => (
            <div key={s.k} className="card p-5">
              <div className="font-mono text-xs text-black/60">{s.k}</div>
              <div className="font-display text-2xl tracking-wide mt-2">{s.t}</div>
              <div className="text-sm text-black/70 mt-2">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-12 border-t border-black/10">
        <h2 className="font-display text-4xl tracking-wide">Supported categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {cats.map((c) => (
            <div key={c} className="card p-5 flex items-center justify-between">
              <div className="font-display text-2xl tracking-wide">{c}</div>
              <div className="font-mono text-xs text-black/60">tap to report</div>
            </div>
          ))}
        </div>
      </div>

      <div className="py-12 border-t border-black/10">
        <div className="card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="font-display text-4xl tracking-wide leading-none">Make your ward visible.</div>
            <div className="text-black/70 mt-2">One feed. One source of truth. Prioritized by people.</div>
          </div>
          <Link to="/report/new" className="btn-primary">
            Submit a report
          </Link>
        </div>
      </div>

      <div className="py-10 border-t border-black/10 text-sm text-black/60 flex items-center justify-between flex-wrap gap-3">
        <div className="font-display text-2xl tracking-wide text-black">CitySnap</div>
        <div className="font-mono text-xs">Built with React, Express, MongoDB, Leaflet, Roboflow, Cloudinary.</div>
      </div>
    </div>
  );
}

