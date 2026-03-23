import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CategoryBadge, PriorityBadge, StatusBadge } from '../components/common/Badges';
import SLABadge from '../components/SLABadge';
import RTISection from '../components/RTISection';
import MunicipalInfo from '../components/MunicipalInfo';

const STEPS = ['pending', 'acknowledged', 'in_progress', 'resolved'];

function Stepper({ status }) {
  const idx = Math.max(0, STEPS.indexOf(status));
  return (
    <div className="grid grid-cols-4 gap-2">
      {STEPS.map((s, i) => (
        <div key={s} className={`rounded-lg border px-3 py-2 ${i <= idx ? 'bg-black text-white border-black' : 'bg-white/60 border-black/10'}`}>
          <div className="font-mono text-xs opacity-70">{String(i + 1).padStart(2, '0')}</div>
          <div className="font-display text-lg tracking-wide leading-none mt-1">{s}</div>
        </div>
      ))}
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${id}`);
      setReport(res.data.report);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canUpvote = useMemo(() => {
    if (!user || !report) return false;
    const isSelf = String(report.reporter?._id || report.reporter) === String(user._id);
    const already = (report.upvotedBy || []).some((u) => String(u) === String(user._id));
    return !isSelf && !already;
  }, [user, report]);

  async function upvote() {
    setUpvoting(true);
    try {
      await api.post(`/reports/${id}/upvote`);
      toast.success('Upvoted.');
      await load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUpvoting(false);
    }
  }

  if (loading) return <div className="py-20 text-center font-mono text-sm text-black/60">Loading…</div>;
  if (!report) return <div className="py-20 text-center font-mono text-sm text-black/60">Not found.</div>;

  const img = report.images?.[0];
  const loc = report.location || {};
  const coords = [loc.coordinates?.[1] || 0, loc.coordinates?.[0] || 0];
  const created = report.createdAt ? new Date(report.createdAt).toLocaleString() : '';
  const mlShow =
    typeof report.mlConfidence === 'number' ||
    Boolean(report.mlCategory) ||
    Boolean(report.mlRawClass);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          {img ? <img src={img} alt={report.title} className="w-full h-[420px] object-cover" /> : <div className="h-[420px] bg-black/5" />}
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge category={report.category} />
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
              <SLABadge createdAt={report.createdAt} status={report.status} resolvedAt={report.resolvedAt} />
              <span className="font-mono text-xs text-black/60">▲ {report.upvotes || 0}</span>
              <span className="font-mono text-xs text-black/50">{created}</span>
            </div>
            <div className="font-display text-4xl tracking-wide leading-none">{report.title}</div>
            <div className="text-black/80 whitespace-pre-wrap">{report.description}</div>
            <div className="text-sm text-black/70">
              <b>Location:</b> {[loc.address, loc.ward ? `Ward ${loc.ward}` : '', loc.city].filter(Boolean).join(' · ')}
            </div>
            <div className="rounded-lg border border-black/10 bg-white/60 p-3">
              <div className="font-mono text-xs text-black/60">Reported to</div>
              <div className="text-sm mt-1">
                {report.municipalName || 'Municipal Corporation'}
                {(loc.city || report.municipalState) ? ` · ${[loc.city, report.municipalState].filter(Boolean).join(', ')}` : ''}
              </div>
            </div>
            {!report.municipalName ? <MunicipalInfo city={loc.city || ''} /> : null}

            {mlShow && (
              <div className="border border-black/10 rounded-lg p-4 bg-white/60">
                <div className="font-mono text-xs text-black/60">ML detection</div>
                <div className="text-sm mt-1">
                  Category: <b>{report.mlCategory || 'other'}</b> · Confidence:{' '}
                  <b>{Math.round(Number(report.mlConfidence || 0) * 100)}%</b>{' '}
                  {report.mlRawClass ? (
                    <>
                      · Class: <span className="font-mono">{report.mlRawClass}</span>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {user ? (
              <button className="btn-primary w-full" disabled={!canUpvote || upvoting} onClick={upvote}>
                {!canUpvote ? 'Upvoted / Not allowed' : upvoting ? 'Upvoting…' : 'Upvote'}
              </button>
            ) : (
              <div className="text-sm text-black/70">Login to upvote and track updates.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="font-mono text-xs text-black/60">Status timeline</div>
            <div className="mt-3">
              <Stepper status={report.status} />
            </div>
            <div className="mt-4">
              <div className="font-mono text-xs text-black/60 mb-2">History</div>
              <div className="space-y-2">
                {(report.statusHistory || [])
                  .slice()
                  .reverse()
                  .map((h, idx) => (
                    <div key={idx} className="rounded-lg border border-black/10 bg-white/60 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-xs">
                          <b>{h.status}</b> {h.updatedBy?.name ? `· ${h.updatedBy.name}` : ''}
                        </div>
                        <div className="font-mono text-xs text-black/50">{h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</div>
                      </div>
                      {h.note ? <div className="text-sm text-black/80 mt-1">{h.note}</div> : null}
                    </div>
                  ))}
              </div>
            </div>
            {report.authorityNote ? (
              <div className="mt-4 rounded-lg border border-black/10 bg-white/60 p-3">
                <div className="font-mono text-xs text-black/60">Authority note</div>
                <div className="text-sm mt-1">{report.authorityNote}</div>
              </div>
            ) : null}
            <div className="mt-4 font-mono text-xs text-black/60">Witnesses: {report.witnesses?.length || 0}</div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-black/60">Map</div>
                <div className="font-display text-2xl tracking-wide">Exact location</div>
              </div>
              <div className="font-mono text-xs text-black/60">
                {coords[0].toFixed(5)}, {coords[1].toFixed(5)}
              </div>
            </div>
            <div className="mt-4 h-[340px] rounded-xl overflow-hidden border border-black/10">
              <MapContainer center={coords} zoom={17} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <Marker position={coords} />
              </MapContainer>
            </div>
          </div>

          <RTISection report={report} onRefresh={load} />
        </div>
      </div>
    </div>
  );
}

