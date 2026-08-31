import { useMemo, useState } from "react";
import { Search, Download, TableProperties } from "lucide-react";
import type { ScoredWork, RiskLevel, WorkStatus } from "@/lib/types";
import { WorksTable } from "@/components/WorksTable";
import { toCSV, downloadCSV } from "@/lib/csv";
import { formatNum } from "@/lib/format";

const RISK_LEVELS: (RiskLevel | "All")[] = ["All", "Critical", "High", "Medium", "Low"];
const STATUSES: (WorkStatus | "All")[] = ["All", "Recommended", "Sanctioned", "In Progress", "Delayed", "Completed", "Stalled"];

export function WorksRegister({ works }: { works: ScoredWork[] }) {
  const states = useMemo(() => [...new Set(works.map((w) => w.state))].sort(), [works]);
  const [q, setQ] = useState("");
  const [state, setState] = useState("All");
  const [risk, setRisk] = useState<RiskLevel | "All">("All");
  const [status, setStatus] = useState<WorkStatus | "All">("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return works.filter((w) => {
      if (state !== "All" && w.state !== state) return false;
      if (risk !== "All" && w.riskLevel !== risk) return false;
      if (status !== "All" && w.status !== status) return false;
      if (needle) {
        const hay = `${w.work_code} ${w.title} ${w.implementing_agency} ${w.mp_name}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [works, q, state, risk, status]);

  function exportCSV() {
    const rows = filtered.map((w) => ({
      work_code: w.work_code,
      title: w.title,
      category: w.category,
      state: w.state,
      district: w.district,
      mp_name: w.mp_name,
      implementing_agency: w.implementing_agency,
      sanctioned_amount: w.sanctioned_amount,
      expenditure_to_date: w.expenditure_to_date,
      unit_of_measure: w.unit_of_measure,
      quantity: w.quantity,
      progress_percent: w.progress_percent,
      status: w.status,
      risk_score: w.riskScore,
      risk_level: w.riskLevel,
      flagged_rules: w.flaggedRules.map((r) => r.rule).join("; "),
    }));
    downloadCSV("mplads_works_register.csv", toCSV(rows));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Works Register</h2>
          <p className="text-sm text-slate-500">Full searchable register of all {formatNum(works.length)} works.</p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code, title, contractor, MP..."
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <select value={state} onChange={(e) => setState(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none">
            <option value="All">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel | "All")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none">
            {RISK_LEVELS.map((r) => <option key={r} value={r}>{r === "All" ? "All Risk Levels" : r}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as WorkStatus | "All")} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none">
            {STATUSES.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <TableProperties className="h-3.5 w-3.5" />
          {formatNum(filtered.length)} matching works
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <WorksTable works={filtered} />
      </div>
    </div>
  );
}
