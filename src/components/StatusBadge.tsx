import type { WorkStatus, ReviewState } from "@/lib/types";

const STATUS_STYLES: Record<WorkStatus, string> = {
  Recommended: "bg-slate-100 text-slate-700 border-slate-300",
  Sanctioned: "bg-sky-100 text-sky-800 border-sky-300",
  "In Progress": "bg-indigo-100 text-indigo-800 border-indigo-300",
  Delayed: "bg-orange-100 text-orange-800 border-orange-300",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Stalled: "bg-red-100 text-red-800 border-red-300",
};

export function StatusBadge({ status }: { status: WorkStatus }) {
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const REVIEW_STYLES: Record<ReviewState, string> = {
  pending: "bg-slate-100 text-slate-600 border-slate-300",
  reviewed: "bg-sky-100 text-sky-700 border-sky-300",
  escalated: "bg-red-100 text-red-700 border-red-300",
};

const REVIEW_LABEL: Record<ReviewState, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  escalated: "Escalated",
};

export function ReviewBadge({ state }: { state: ReviewState }) {
  return (
    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-medium ${REVIEW_STYLES[state]}`}>
      {REVIEW_LABEL[state]}
    </span>
  );
}
