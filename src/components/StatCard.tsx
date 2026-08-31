import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "text-slate-700",
  sub,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className="rounded-md bg-slate-50 p-2">
          <Icon className="h-5 w-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
