import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ArrowUpCircle, IndianRupee, Ruler, Calendar, User, Building2, HardHat, FileText, AlertTriangle } from "lucide-react";
import type { ScoredWork, ReviewState } from "@/lib/types";
import { RiskBadge } from "@/components/RiskBadge";
import { StatusBadge, ReviewBadge } from "@/components/StatusBadge";
import { formatINRFull, formatDate, formatNum } from "@/lib/format";

export function WorkDetail({
  works,
  onReview,
}: {
  works: ScoredWork[];
  onReview: (id: string, state: ReviewState) => void;
}) {
  const { id } = useParams();
  const w = works.find((x) => x.id === id);

  if (!w) {
    return (
      <div className="space-y-4">
        <Link to="/register" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to register</Link>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Work not found.</div>
      </div>
    );
  }

  const expPct = w.sanctioned_amount > 0 ? (w.expenditure_to_date / w.sanctioned_amount) * 100 : 0;
  const overrunPct = w.sanctioned_amount > 0 ? ((w.expenditure_to_date - w.sanctioned_amount) / w.sanctioned_amount) * 100 : 0;

  const facts = [
    { icon: User, label: "MP", value: `${w.mp_name} (${w.constituency})` },
    { icon: Building2, label: "State / District", value: `${w.state} / ${w.district}` },
    { icon: HardHat, label: "Implementing Agency", value: w.implementing_agency },
    { icon: FileText, label: "Category", value: w.category },
    { icon: IndianRupee, label: "Sanctioned Amount", value: formatINRFull(w.sanctioned_amount) },
    { icon: IndianRupee, label: "Expenditure To Date", value: formatINRFull(w.expenditure_to_date) },
    { icon: Ruler, label: "Quantity / Unit", value: `${formatNum(w.quantity)} ${w.unit_of_measure}` },
    { icon: IndianRupee, label: "Cost per Unit", value: `${formatINRFull(Math.round(w.costPerUnit))} / ${w.unit_of_measure}` },
    { icon: Calendar, label: "Sanction Date", value: formatDate(w.sanction_date) },
    { icon: Calendar, label: "Expected Completion", value: formatDate(w.expected_completion_date) },
    { icon: Calendar, label: "Actual Completion", value: formatDate(w.actual_completion_date) },
    { icon: FileText, label: "Work Code", value: w.work_code },
  ];

  return (
    <div className="space-y-5">
      <Link to="/register" className="inline-flex items-center gap-1 text-sm text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Back to register</Link>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800">{w.title}</h2>
            <p className="mt-1 font-mono text-xs text-slate-400">{w.work_code}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RiskBadge level={w.riskLevel} score={w.riskScore} />
              <StatusBadge status={w.status} />
              <ReviewBadge state={w.review_state} />
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => onReview(w.id, "reviewed")} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition ${w.review_state === "reviewed" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Reviewed
            </button>
            <button onClick={() => onReview(w.id, "escalated")} className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-medium transition ${w.review_state === "escalated" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              <ArrowUpCircle className="h-3.5 w-3.5" /> Escalate
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Facts */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Work Details</h3>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label} className="flex items-start gap-2.5">
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{f.label}</dt>
                    <dd className="text-sm text-slate-700">{f.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Financials + progress */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Financials &amp; Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-500"><span>Physical Progress</span><span className="font-semibold text-slate-700">{w.progress_percent}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${w.progress_percent >= 100 ? "bg-emerald-500" : "bg-sky-500"}`} style={{ width: `${w.progress_percent}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500"><span>Expenditure vs Sanction</span><span className="font-semibold text-slate-700">{expPct.toFixed(0)}%</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${overrunPct > 15 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, expPct)}%` }} /></div>
                {overrunPct > 15 && <p className="mt-1 text-xs font-medium text-red-600">Overrun: {overrunPct.toFixed(1)}% above sanction</p>}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded bg-slate-50 p-2">
                  <p className="text-xs text-slate-400">Sanctioned</p>
                  <p className="text-sm font-bold text-slate-700">{formatINRFull(w.sanctioned_amount)}</p>
                </div>
                <div className="rounded bg-slate-50 p-2">
                  <p className="text-xs text-slate-400">Expenditure</p>
                  <p className="text-sm font-bold text-slate-700">{formatINRFull(w.expenditure_to_date)}</p>
                </div>
                <div className="rounded bg-slate-50 p-2">
                  <p className="text-xs text-slate-400">Cost / Unit</p>
                  <p className="text-sm font-bold text-slate-700">{formatINRFull(Math.round(w.costPerUnit))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flagged rules */}
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Anomaly Flags ({w.flaggedRules.length})</h3>
            {w.flaggedRules.length === 0 ? (
              <p className="text-sm text-slate-500">No anomalies detected for this work.</p>
            ) : (
              <ul className="space-y-3">
                {w.flaggedRules.map((r) => (
                  <li key={r.rule} className="rounded-md border border-red-200 bg-red-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-red-800">{r.rule}</span>
                      <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">+{r.points}</span>
                    </div>
                    <p className="mt-1 text-xs text-red-700">{r.detail}</p>
                  </li>
                ))}
                <li className="rounded-md bg-slate-50 p-3 text-center">
                  <span className="text-xs text-slate-500">Composite Risk Score</span>
                  <p className="text-2xl font-bold text-slate-800">{w.riskScore}<span className="text-sm text-slate-400">/100</span></p>
                  <span className="text-xs font-medium text-slate-500">{w.riskLevel}</span>
                </li>
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Completion Evidence</h3>
            <div className="flex items-center gap-2 text-sm">
              {w.completion_photo_uploaded ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-slate-600">Photo evidence uploaded</span></>
              ) : (
                <><AlertTriangle className="h-4 w-4 text-amber-500" /><span className="text-slate-600">{w.status === "Completed" ? "No photo evidence — requires verification" : "No photo evidence"}</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

