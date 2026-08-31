import { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Download, Map as MapIcon, IndianRupee, AlertTriangle, Building } from "lucide-react";
import type { ScoredWork } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { WorksTable } from "@/components/WorksTable";
import { districtRiskBreakdown, fundsAtRisk } from "@/lib/anomaly";
import { formatINR, formatNum } from "@/lib/format";
import { toCSV, downloadCSV } from "@/lib/csv";

export function StateView({ works }: { works: ScoredWork[] }) {
  const [params, setParams] = useSearchParams();
  const states = useMemo(() => [...new Set(works.map((w) => w.state))].sort(), [works]);
  const selected = params.get("state") ?? states[0] ?? "";
  const stateWorks = useMemo(() => works.filter((w) => w.state === selected), [works, selected]);
  const districts = useMemo(() => districtRiskBreakdown(works, selected), [works, selected]);
  const flagged = stateWorks.filter((w) => w.flaggedRules.length > 0);
  const far = useMemo(() => fundsAtRisk(stateWorks), [stateWorks]);

  function selectState(s: string) {
    setParams(s ? { state: s } : {});
  }

  function exportCSV() {
    const rows = stateWorks.map((w) => ({
      work_code: w.work_code,
      title: w.title,
      category: w.category,
      district: w.district,
      mp_name: w.mp_name,
      implementing_agency: w.implementing_agency,
      sanctioned_amount: w.sanctioned_amount,
      expenditure_to_date: w.expenditure_to_date,
      progress_percent: w.progress_percent,
      status: w.status,
      risk_score: w.riskScore,
      risk_level: w.riskLevel,
      flagged_rules: w.flaggedRules.map((r) => r.rule).join("; "),
    }));
    downloadCSV(`mplads_${selected.replace(/\s/g, "_")}_works.csv`, toCSV(rows));
  }

  if (works.length === 0) return <p className="text-sm text-slate-500">No data available.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">State Nodal Authority</h2>
          <p className="text-sm text-slate-500">Drill into a single state's risk picture and export flagged works.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selected}
            onChange={(e) => selectState(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Works in State" value={formatNum(stateWorks.length)} icon={MapIcon} accent="text-slate-800" />
        <StatCard label="Flagged" value={formatNum(flagged.length)} icon={AlertTriangle} accent="text-orange-600" />
        <StatCard label="Critical" value={formatNum(stateWorks.filter((w) => w.riskLevel === "Critical").length)} icon={AlertTriangle} accent="text-red-600" />
        <StatCard label="Funds at Risk" value={formatINR(far)} icon={IndianRupee} accent="text-red-600" />
      </div>

      {/* District-wise breakdown */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Building className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">District-wise Risk Breakdown — {selected}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 font-medium">District</th>
                <th className="px-3 py-2 text-center font-medium">Total</th>
                <th className="px-3 py-2 text-center font-medium text-red-600">Critical</th>
                <th className="px-3 py-2 text-center font-medium text-orange-600">High</th>
                <th className="px-3 py-2 text-center font-medium text-amber-600">Medium</th>
                <th className="px-3 py-2 text-center font-medium text-emerald-600">Low</th>
                <th className="px-3 py-2 text-right font-medium">Funds at Risk</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {districts.map((d) => (
                <tr key={d.district} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{d.district}</td>
                  <td className="px-3 py-2 text-center text-slate-600">{d.total}</td>
                  <td className="px-3 py-2 text-center font-semibold text-red-600">{d.critical}</td>
                  <td className="px-3 py-2 text-center font-semibold text-orange-600">{d.high}</td>
                  <td className="px-3 py-2 text-center text-amber-600">{d.medium}</td>
                  <td className="px-3 py-2 text-center text-emerald-600">{d.low}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatINR(d.fundsAtRisk)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link to={`/district?state=${encodeURIComponent(selected)}&district=${encodeURIComponent(d.district)}`} className="text-xs font-medium text-sky-700 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagged works for state */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Flagged Works in {selected} ({flagged.length})</h3>
        </div>
        <WorksTable works={flagged.length > 0 ? flagged : stateWorks} />
      </div>
    </div>
  );
}
