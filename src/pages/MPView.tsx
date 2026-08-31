import { useMemo, useState } from "react";
import { Users, IndianRupee, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ScoredWork } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { WorksTable } from "@/components/WorksTable";
import { formatINR, formatNum } from "@/lib/format";

export function MPView({ works }: { works: ScoredWork[] }) {
  const mps = useMemo(() => {
    const seen = new Map<string, { name: string; constituency: string; state: string }>();
    for (const w of works) {
      const k = `${w.mp_name}|${w.constituency}`;
      if (!seen.has(k)) seen.set(k, { name: w.mp_name, constituency: w.constituency, state: w.state });
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [works]);

  const [selected, setSelected] = useState(mps[0]?.name ?? "");
  const mp = mps.find((m) => m.name === selected);
  const mpWorks = useMemo(() => works.filter((w) => w.mp_name === selected), [works, selected]);
  const flagged = mpWorks.filter((w) => w.flaggedRules.length > 0);
  const sanctioned = mpWorks.reduce((s, w) => s + w.sanctioned_amount, 0);
  const completed = mpWorks.filter((w) => w.status === "Completed").length;

  if (works.length === 0) return <p className="text-sm text-slate-500">No data available.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">MP View — Self-Monitoring</h2>
          <p className="text-sm text-slate-500">An MP's own recommended works, sanctioned amounts, and flagged items.</p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          {mps.map((m) => (
            <option key={m.name} value={m.name}>{m.name} — {m.constituency}, {m.state}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Works Recommended" value={formatNum(mpWorks.length)} icon={Users} accent="text-slate-800" />
        <StatCard label="Total Sanctioned" value={formatINR(sanctioned)} icon={IndianRupee} accent="text-slate-700" />
        <StatCard label="Flagged Items" value={formatNum(flagged.length)} icon={AlertTriangle} accent="text-orange-600" />
        <StatCard label="Completed" value={formatNum(completed)} icon={CheckCircle2} accent="text-emerald-600" />
      </div>

      {mp && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span className="font-semibold text-slate-700">{mp.name}</span>
            <span className="text-slate-500">Constituency: <span className="text-slate-700">{mp.constituency}</span></span>
            <span className="text-slate-500">State: <span className="text-slate-700">{mp.state}</span></span>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">Flagged Items Relevant to You ({flagged.length})</h3>
        </div>
        {flagged.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No flagged items — all your works look clean.</div>
        ) : (
          <WorksTable works={flagged} />
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-700">All Your Works ({mpWorks.length})</h3>
        </div>
        <WorksTable works={mpWorks} compact />
      </div>
    </div>
  );
}
