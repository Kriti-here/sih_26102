import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Building2, IndianRupee, AlertTriangle, CheckCircle2, ArrowUpCircle } from "lucide-react";
import type { ScoredWork, ReviewState } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge, ReviewBadge } from "@/components/StatusBadge";
import { formatINR, formatNum } from "@/lib/format";

export function DistrictView({
  works,
  onReview,
}: {
  works: ScoredWork[];
  onReview: (id: string, state: ReviewState) => void;
}) {
  const [params] = useSearchParams();
  const state = params.get("state") ?? "";
  const district = params.get("district") ?? "";

  const districtWorks = useMemo(
    () => works.filter((w) => (!state || w.state === state) && (!district || w.district === district)),
    [works, state, district]
  );
  const flagged = districtWorks.filter((w) => w.flaggedRules.length > 0);
  const far = flagged.filter((w) => w.riskLevel === "Critical" || w.riskLevel === "High").reduce((s, w) => s + w.sanctioned_amount, 0);

  if (!state || !district) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">District Authority</h2>
          <p className="text-sm text-slate-500">Select a district from the State Nodal view to see its works.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Go to <Link to="/state" className="text-sky-700 hover:underline">State Nodal Authority</Link> and click "View" on a district to inspect its works here.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to={`/state?state=${encodeURIComponent(state)}`} className="hover:text-sky-700 hover:underline">{state}</Link>
          <span>/</span>
          <span className="text-slate-600">{district}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800">District Authority — {district}</h2>
        <p className="text-sm text-slate-500">Works under your jurisdiction. Mark flagged items as reviewed or escalated.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Works in District" value={formatNum(districtWorks.length)} icon={Building2} accent="text-slate-800" />
        <StatCard label="Flagged" value={formatNum(flagged.length)} icon={AlertTriangle} accent="text-orange-600" />
        <StatCard label="Critical" value={formatNum(districtWorks.filter((w) => w.riskLevel === "Critical").length)} icon={AlertTriangle} accent="text-red-600" />
        <StatCard label="Funds at Risk" value={formatINR(far)} icon={IndianRupee} accent="text-red-600" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Flagged Works — Review / Escalate</h3>
          <p className="text-xs text-slate-400">Only flagged works are shown. Use the actions to record your review status.</p>
        </div>
        {flagged.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No flagged works in this district.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2 font-medium">Work</th>
                  <th className="px-3 py-2 font-medium">Risk</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Flags</th>
                  <th className="px-3 py-2 font-medium">Review</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      <Link to={`/works/${w.id}`} className="font-mono text-xs text-sky-700 hover:underline">{w.work_code}</Link>
                      <div className="max-w-[18rem] truncate text-xs text-slate-500" title={w.title}>{w.title}</div>
                      <div className="text-xs text-slate-400">{w.implementing_agency}</div>
                    </td>
                    <td className="px-3 py-2"><RiskBadge level={w.riskLevel} score={w.riskScore} /></td>
                    <td className="px-3 py-2"><StatusBadge status={w.status} /></td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {w.flaggedRules.map((r) => (
                          <span key={r.rule} className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">{r.rule}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2"><ReviewBadge state={w.review_state} /></td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onReview(w.id, "reviewed")}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${w.review_state === "reviewed" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Reviewed
                        </button>
                        <button
                          onClick={() => onReview(w.id, "escalated")}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition ${w.review_state === "escalated" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                        >
                          <ArrowUpCircle className="h-3 w-3" /> Escalate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All works (non-flagged too) */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">All Works in {district} ({districtWorks.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">Work Code</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 text-right font-medium">Sanctioned</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {districtWorks.map((w) => (
                <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs"><Link to={`/works/${w.id}`} className="text-sky-700 hover:underline">{w.work_code}</Link></td>
                  <td className="max-w-[18rem] truncate px-3 py-2 text-slate-700" title={w.title}>{w.title}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-700">{formatINR(w.sanctioned_amount)}</td>
                  <td className="px-3 py-2"><StatusBadge status={w.status} /></td>
                  <td className="px-3 py-2"><RiskBadge level={w.riskLevel} score={w.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
