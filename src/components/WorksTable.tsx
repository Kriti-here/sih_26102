import type { ScoredWork } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { formatINR, formatINRFull } from "@/lib/format";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function WorksTable({ works, compact }: { works: ScoredWork[]; compact?: boolean }) {
  if (works.length === 0) {
    return <div className="p-8 text-center text-sm text-slate-500">No works match the current filters.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 font-medium">Work Code</th>
            <th className="px-3 py-2 font-medium">Title</th>
            {!compact && <th className="px-3 py-2 font-medium">State / District</th>}
            {!compact && <th className="px-3 py-2 font-medium">Contractor</th>}
            <th className="px-3 py-2 text-right font-medium">Sanctioned</th>
            {!compact && <th className="px-3 py-2 text-right font-medium">Expenditure</th>}
            {!compact && <th className="px-3 py-2 text-center font-medium">Progress</th>}
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Risk</th>
            {!compact && <th className="px-3 py-2 text-center font-medium">Flags</th>}
          </tr>
        </thead>
        <tbody>
          {works.map((w) => (
            <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">
                <Link to={`/works/${w.id}`} className="text-sky-700 hover:underline">{w.work_code}</Link>
              </td>
              <td className="max-w-[18rem] truncate px-3 py-2 text-slate-800" title={w.title}>{w.title}</td>
              {!compact && (
                <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                  <div>{w.state}</div>
                  <div className="text-xs text-slate-400">{w.district}</div>
                </td>
              )}
              {!compact && <td className="max-w-[12rem] truncate px-3 py-2 text-slate-600" title={w.implementing_agency}>{w.implementing_agency}</td>}
              <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-slate-700">{formatINR(w.sanctioned_amount)}</td>
              {!compact && <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">{formatINR(w.expenditure_to_date)}</td>}
              {!compact && (
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                      <div className={`h-full ${w.progress_percent >= 100 ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${w.progress_percent}%` }} />
                    </div>
                    <span className="text-xs text-slate-500">{w.progress_percent}%</span>
                  </div>
                </td>
              )}
              <td className="whitespace-nowrap px-3 py-2"><StatusBadge status={w.status} /></td>
              <td className="whitespace-nowrap px-3 py-2"><RiskBadge level={w.riskLevel} score={w.riskScore} /></td>
              {!compact && (
                <td className="px-3 py-2 text-center">
                  {w.flaggedRules.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {w.flaggedRules.length}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-slate-400">{works.length} work{works.length !== 1 ? "s" : ""} shown</div>
    </div>
  );
}

export { formatINRFull };
