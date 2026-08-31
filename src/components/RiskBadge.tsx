import type { RiskLevel } from "@/lib/types";

const STYLES: Record<RiskLevel, string> = {
  Critical: "bg-red-100 text-red-800 border-red-300",
  High: "bg-orange-100 text-orange-800 border-orange-300",
  Medium: "bg-amber-100 text-amber-800 border-amber-300",
  Low: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const DOT: Record<RiskLevel, string> = {
  Critical: "bg-red-600",
  High: "bg-orange-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[level]}`}
    >
      <span className={`h-2 w-2 rounded-full ${DOT[level]}`} />
      {level}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
