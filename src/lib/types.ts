export type WorkStatus =
  | "Recommended"
  | "Sanctioned"
  | "In Progress"
  | "Delayed"
  | "Completed"
  | "Stalled";

export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export type ReviewState = "pending" | "reviewed" | "escalated";

export type UnitOfMeasure = "sqft" | "meter" | "unit";

export interface WorkRow {
  id: string;
  work_code: string;
  title: string;
  category: string;
  mp_name: string;
  constituency: string;
  state: string;
  district: string;
  implementing_agency: string;
  sanctioned_amount: number;
  expenditure_to_date: number;
  unit_of_measure: UnitOfMeasure;
  quantity: number;
  sanction_date: string; // ISO yyyy-mm-dd
  expected_completion_date: string;
  actual_completion_date: string | null;
  progress_percent: number;
  status: WorkStatus;
  completion_photo_uploaded: boolean;
  review_state: ReviewState;
  created_at?: string;
}

export interface FlaggedRule {
  rule: string;
  points: number;
  detail: string; // human-readable evidence
}

export interface ScoredWork extends WorkRow {
  riskScore: number;
  riskLevel: RiskLevel;
  flaggedRules: FlaggedRule[];
  costPerUnit: number;
  sanctionYear: number;
}

export interface AlertItem {
  id: string;
  work: ScoredWork;
  rule: FlaggedRule;
  sortKey: number;
}
