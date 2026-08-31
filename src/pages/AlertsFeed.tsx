import { useMemo, useState } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import type { AlertItem, ScoredWork } from "@/lib/types";
import { AlertCard } from "@/components/AlertCard";

export function AlertsFeed({ alerts, works }: { alerts: AlertItem[]; works: ScoredWork[] }) {
  const rules = useMemo(() => [...new Set(works.flatMap((w) => w.flaggedRules.map((r) => r.rule)))].sort(), [works]);
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All" ? alerts : alerts.filter((a) => a.rule.rule === filter);
  const critical = filtered.filter((a) => a.work.riskLevel === "Critical").length;
  const high = filtered.filter((a) => a.work.riskLevel === "High").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Alerts Feed</h2>
        <p className="text-sm text-slate-500">All Critical and High severity rule triggers, with numeric evidence per alert.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500"><Bell className="h-4 w-4 text-slate-400" /> Total Alerts</div>
          <p className="mt-1 text-2xl font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-red-600"><AlertTriangle className="h-4 w-4" /> Critical</div>
          <p className="mt-1 text-2xl font-bold text-red-700">{critical}</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-orange-600"><AlertTriangle className="h-4 w-4" /> High</div>
          <p className="mt-1 text-2xl font-bold text-orange-700">{high}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("All")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === "All" ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
        >
          All ({alerts.length})
        </button>
        {rules.map((r) => {
          const count = alerts.filter((a) => a.rule.rule === r).length;
          return (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === r ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"}`}
            >
              {r} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No alerts match this filter.</div>
        ) : (
          filtered.map((a) => <AlertCard key={a.id} alert={a} />)
        )}
      </div>
    </div>
  );
}
