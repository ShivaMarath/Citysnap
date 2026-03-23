import { Link } from 'react-router-dom';
import { CategoryBadge, StatusBadge } from '../common/Badges';

export default function ReportCard({ report }) {
  const img = report.images?.[0] || '/placeholder.png';
  const loc = report.location || {};
  const date = report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '';

  return (
    <Link to={`/report/${report._id}`} className="card overflow-hidden hover:-translate-y-0.5 transition block">
      <div className="aspect-[4/3] bg-black/5">
        <img src={img} alt={report.title} className="h-full w-full object-cover" />
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CategoryBadge category={report.category} />
          <StatusBadge status={report.status} />
        </div>
        <div className="font-display text-xl tracking-wide leading-none">{report.title}</div>
        <div className="text-sm text-black/70 clamp-2">{report.description}</div>
        <div className="flex items-center justify-between text-xs font-mono text-black/60 pt-1">
          <span className="truncate">
            {(loc.ward ? `Ward ${loc.ward}` : 'Ward?') + (loc.city ? ` · ${loc.city}` : '')}
          </span>
          <span>▲ {report.upvotes || 0}</span>
        </div>
        <div className="text-xs font-mono text-black/50">{date}</div>
      </div>
    </Link>
  );
}

