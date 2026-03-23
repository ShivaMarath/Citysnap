import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../utils/api';

function dayDiff(start, end) {
  return Math.max(1, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function RTISection({ report, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(report?.rtiPdfUrl || '');

  const meta = useMemo(() => {
    const days = dayDiff(report.createdAt, new Date());
    const unresolved = ['pending', 'acknowledged'].includes(report.status);
    return { days, unresolved };
  }, [report.createdAt, report.status]);

  if (!meta.unresolved) return null;

  async function generateNow() {
    setBusy(true);
    try {
      const res = await api.post(`/reports/${report._id}/generate-rti`);
      setPdfUrl(res.data.pdfUrl);
      toast.success('RTI generated successfully.');
      if (onRefresh) await onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <div className="font-mono text-xs text-black/60">Escalation timeline</div>
      <div className="mt-2 h-2 w-full rounded bg-black/10 overflow-hidden">
        <div className="h-full bg-civic-red" style={{ width: `${Math.min(100, (meta.days / 7) * 100)}%` }} />
      </div>
      <div className="mt-2 text-xs text-black/60 font-mono">Day 1 → Day 3 (reminder) → Day 5 (warning) → Day 7 (RTI)</div>

      {meta.days < 5 ? (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          RTI option available after 5 days if unresolved.
        </div>
      ) : null}

      {meta.days >= 5 && meta.days < 7 ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          ⚠️ This issue is {meta.days} days old. Authorities have been warned that RTI will be filed in {7 - meta.days} days.
          <div className="mt-3">
            <button className="btn-primary" onClick={generateNow} disabled={busy}>
              {busy ? 'Generating…' : 'Generate RTI Now'}
            </button>
          </div>
        </div>
      ) : null}

      {meta.days >= 7 ? (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          🚨 RTI Available — This issue has been unresolved for {meta.days} days.
          <div className="mt-3 flex flex-wrap gap-2">
            {pdfUrl || report.rtiGenerated ? (
              <a className="btn-primary" href={`/api/reports/${report._id}/rti-download`}>
                Download RTI Application
              </a>
            ) : (
              <button className="btn-primary" onClick={generateNow} disabled={busy}>
                {busy ? 'Generating…' : 'Generate RTI Application'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
