import type { AlertItem } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const RULE_COLORS: Record<string, string> = {
  "Cost Overrun": "text-red-700",
  "Cost/Unit Outlier": "text-red-700",
  "Payment Ahead of Progress": "text-orange-700",
  "Delayed": "text-orange-700",
  "Stalled": "text-red-700",
  "Duplicate-Suspect": "text-red-700",
  "Completion Without Evidence": "text-amber-700",
};

export function AlertCard({ alert }: { alert: AlertItem }) {
  const w = alert.work;
  return (
    <Link
      to={`/works/${w.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${RULE_COLORS[alert.rule.rule] ?? "text-slate-700"}`}>{alert.rule.rule}</span>
            <span className="text-xs text-slate-400">+{alert.rule.points} pts</span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-800" title={w.title}>{w.title}</p>
          <p className="mt-0.5 font-mono text-xs text-slate-400">{w.work_code}</p>
          <p className="mt-2 text-sm text-slate-600">{alert.rule.detail}</p>
          <p className="mt-1 text-xs text-slate-400">
            {w.state} · {w.district} · {w.implementing_agency}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <RiskBadge level={w.riskLevel} score={w.riskScore} />
          <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
      </div>
    </Link>
  );
}
