import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";
import {
  Briefcase,
  AlertTriangle,
  ShieldAlert,
  IndianRupee,
  TrendingUp,
  Flag,
} from "lucide-react";
import type { ScoredWork } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { RiskBadge } from "@/components/RiskBadge";
import {
  fundsAtRisk,
  ruleFrequency,
  stateRiskBreakdown,
  sanctionExpenditureTrend,
  topFlaggedWorks,
} from "@/lib/anomaly";
import { formatINR, formatNum } from "@/lib/format";

const RISK_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export function MinistryOverview({ works }: { works: ScoredWork[] }) {
  const total = works.length;
  const flagged = works.filter((w) => w.flaggedRules.length > 0).length;
  const critical = works.filter((w) => w.riskLevel === "Critical").length;
  const far = useMemo(() => fundsAtRisk(works), [works]);
  const rules = useMemo(() => ruleFrequency(works), [works]);
  const states = useMemo(() => stateRiskBreakdown(works), [works]);
  const trend = useMemo(() => sanctionExpenditureTrend(works), [works]);
  const top = useMemo(() => topFlaggedWorks(works, 10), [works]);

  const maxStateTotal = Math.max(...states.map((s) => s.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Ministry / National Overview</h2>
        <p className="text-sm text-slate-500">Aggregate anomaly picture across all states and works.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Works" value={formatNum(total)} icon={Briefcase} accent="text-slate-800" sub={`across ${states.length} states`} />
        <StatCard label="Flagged Works" value={formatNum(flagged)} icon={Flag} accent="text-orange-600" sub={`${((flagged / total) * 100).toFixed(0)}% of total`} />
        <StatCard label="Critical Risk" value={formatNum(critical)} icon={ShieldAlert} accent="text-red-600" sub="risk score 80-100" />
        <StatCard label="Funds at Risk" value={formatINR(far)} icon={IndianRupee} accent="text-red-600" sub="High + Critical sanctioned" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* State risk heatmap (horizontal bars) */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">State-wise Risk Distribution</h3>
          <div className="space-y-2">
            {states.slice(0, 16).map((s) => (
              <div key={s.state}>
                <div className="flex items-center justify-between text-xs">
                  <Link to={`/state?state=${encodeURIComponent(s.state)}`} className="font-medium text-slate-700 hover:text-sky-700 hover:underline">{s.state}</Link>
                  <span className="text-slate-400">{s.total} works · {formatINR(s.fundsAtRisk)} at risk</span>
                </div>
                <div className="mt-1 flex h-4 w-full overflow-hidden rounded-sm bg-slate-100" title={`Total ${s.total}`}>
                  {(["critical", "high", "medium", "low"] as const).map((lvl) => {
                    const v = s[lvl];
                    if (v === 0) return null;
                    return (
                      <div
                        key={lvl}
                        style={{ width: `${(v / maxStateTotal) * 100}%` }}
                        className={`h-full ${lvl === "critical" ? "bg-red-600" : lvl === "high" ? "bg-orange-500" : lvl === "medium" ? "bg-amber-400" : "bg-emerald-400"}`}
                        title={`${lvl}: ${v}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rule frequency */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Rule Frequency Breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rules} layout="vertical" margin={{ left: 20, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis dataKey="rule" type="category" tick={{ fontSize: 10 }} width={130} stroke="#94a3b8" />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#1e293b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sanction vs Expenditure trend */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700">Sanction vs. Expenditure Trend (by sanction year)</h3>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend} margin={{ left: 4, right: 16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tickFormatter={(v) => formatINR(v)} tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} />
            <Tooltip formatter={(v) => formatINR(Number(v))} />
            <Legend />
            <Line type="monotone" dataKey="sanctioned" stroke="#1e40af" strokeWidth={2} name="Sanctioned" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="expenditure" stroke="#ea580c" strokeWidth={2} name="Expenditure" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 flagged works */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold text-slate-700">Top 10 Flagged Works Nationally</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2 font-medium">Work</th>
                <th className="px-2 py-2 font-medium">State</th>
                <th className="px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 text-right font-medium">Sanctioned</th>
                <th className="px-2 py-2 font-medium">Flags</th>
                <th className="px-2 py-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {top.map((w) => (
                <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <Link to={`/works/${w.id}`} className="font-mono text-xs text-sky-700 hover:underline">{w.work_code}</Link>
                    <div className="max-w-[16rem] truncate text-xs text-slate-500" title={w.title}>{w.title}</div>
                  </td>
                  <td className="px-2 py-2 text-slate-600">{w.state}</td>
                  <td className="px-2 py-2 text-slate-600">{w.category}</td>
                  <td className="px-2 py-2 text-right font-medium text-slate-700">{formatINR(w.sanctioned_amount)}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-1">
                      {w.flaggedRules.map((r) => (
                        <span key={r.rule} className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700">{r.rule}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2"><RiskBadge level={w.riskLevel} score={w.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk distribution pie (compact) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Risk Level Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { level: "Critical", count: states.reduce((a, s) => a + s.critical, 0) },
              { level: "High", count: states.reduce((a, s) => a + s.high, 0) },
              { level: "Medium", count: states.reduce((a, s) => a + s.medium, 0) },
              { level: "Low", count: states.reduce((a, s) => a + s.low, 0) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="level" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {["Critical", "High", "Medium", "Low"].map((lvl) => (
                  <Cell key={lvl} fill={RISK_COLORS[lvl]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">State Funds at Risk (top 10)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[...states].sort((a, b) => b.fundsAtRisk - a.fundsAtRisk).slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="state" tick={{ fontSize: 9 }} stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tickFormatter={(v) => formatINR(v)} tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} />
              <Tooltip formatter={(v) => formatINR(Number(v))} />
              <Bar dataKey="fundsAtRisk" radius={[4, 4, 0, 0]} fill="#dc2626" name="Funds at Risk" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
