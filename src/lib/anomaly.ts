import type { WorkRow, ScoredWork, FlaggedRule, RiskLevel, AlertItem } from "./types";
import { daysBetween, daysSince } from "./format";

const TODAY = "2026-08-26";

// ---- robust statistics (median + MAD) ----
function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function mad(nums: number[], med: number): number {
  if (nums.length === 0) return 0;
  const deviations = nums.map((n) => Math.abs(n - med));
  return median(deviations);
}

// modified z-score = 0.6745 * (x - median) / MAD
function modifiedZScore(x: number, med: number, madVal: number): number {
  if (madVal === 0) return 0;
  return (0.6745 * (x - med)) / madVal;
}

// Extract "Phase N" from a title; returns the phase number or null.
function phaseOf(title: string): number | null {
  const m = title.match(/Phase\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

function fiscalYear(iso: string): number {
  // fiscal year = year of sanction date (simplified)
  return parseInt(iso.slice(0, 4), 10);
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

interface PeerGroup {
  category: string;
  medianCostPerUnit: number;
  madCostPerUnit: number;
  peers: number;
}

function buildPeerGroups(works: WorkRow[]): Map<string, PeerGroup> {
  // group by category; the rule says "same category + similar states" —
  // we use category as the peer group (states are many & sparse; category
  // gives enough peers for a robust median).
  const byCat = new Map<string, number[]>();
  for (const w of works) {
    if (w.quantity <= 0) continue;
    const cpu = w.sanctioned_amount / w.quantity;
    const arr = byCat.get(w.category) ?? [];
    arr.push(cpu);
    byCat.set(w.category, arr);
  }
  const groups = new Map<string, PeerGroup>();
  for (const [cat, cpus] of byCat) {
    const med = median(cpus);
    const m = mad(cpus, med);
    groups.set(cat, { category: cat, medianCostPerUnit: med, madCostPerUnit: m, peers: cpus.length });
  }
  return groups;
}

interface DupKey {
  category: string;
  contractor: string;
  district: string;
  fy: number;
}

function findDuplicateSuspects(works: WorkRow[]): Set<string> {
  // flag works that share category + contractor + district + fiscal year,
  // EXCLUDING pairs whose titles differ only by "Phase N".
  const buckets = new Map<string, WorkRow[]>();
  for (const w of works) {
    const key: DupKey = {
      category: w.category,
      contractor: w.implementing_agency,
      district: w.district,
      fy: fiscalYear(w.sanction_date),
    };
    const k = `${key.category}|${key.contractor}|${key.district}|${key.fy}`;
    const arr = buckets.get(k) ?? [];
    arr.push(w);
    buckets.set(k, arr);
  }

  const flagged = new Set<string>();
  for (const [, group] of buckets) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        // exclude if titles differ only by "Phase N" (sequential phases of same project)
        const pa = phaseOf(a.title);
        const pb = phaseOf(b.title);
        const baseA = a.title.replace(/\s*Phase\s+\d+/i, "").trim();
        const baseB = b.title.replace(/\s*Phase\s+\d+/i, "").trim();
        if (pa !== null && pb !== null && pa !== pb && baseA === baseB) {
          continue; // legitimate sequential phases
        }
        flagged.add(a.id);
        flagged.add(b.id);
      }
    }
  }
  return flagged;
}

// ---- main scoring ----
export function scoreWorks(works: WorkRow[]): ScoredWork[] {
  const peerGroups = buildPeerGroups(works);
  const dupSet = findDuplicateSuspects(works);

  const scored: ScoredWork[] = works.map((w) => {
    const rules: FlaggedRule[] = [];
    const costPerUnit = w.quantity > 0 ? w.sanctioned_amount / w.quantity : 0;
    const sanctionYear = fiscalYear(w.sanction_date);

    // Rule 1: Cost overrun — expenditure > sanctioned by >15%
    if (w.sanctioned_amount > 0) {
      const overrunPct = ((w.expenditure_to_date - w.sanctioned_amount) / w.sanctioned_amount) * 100;
      if (overrunPct > 15) {
        rules.push({
          rule: "Cost Overrun",
          points: 22,
          detail: `Expenditure exceeds sanction by ${overrunPct.toFixed(1)}% (₹${Math.round(w.expenditure_to_date).toLocaleString("en-IN")} vs sanctioned ₹${Math.round(w.sanctioned_amount).toLocaleString("en-IN")}).`,
        });
      }
    }

    // Rule 2: Cost/unit outlier (modified z-score > 3.5)
    const peer = peerGroups.get(w.category);
    if (peer && peer.peers >= 5 && w.quantity > 0) {
      const z = modifiedZScore(costPerUnit, peer.medianCostPerUnit, peer.madCostPerUnit);
      if (z > 3.5) {
        rules.push({
          rule: "Cost/Unit Outlier",
          points: 25,
          detail: `Sanctioned ₹${Math.round(costPerUnit).toLocaleString("en-IN")}/${w.unit_of_measure} vs peer median ₹${Math.round(peer.medianCostPerUnit).toLocaleString("en-IN")}/${w.unit_of_measure}, modified Z-score ${z.toFixed(2)}, n=${peer.peers} peers.`,
        });
      }
    }

    // Rule 3: Payment ahead of progress
    if (w.sanctioned_amount > 0 && w.status !== "Recommended") {
      const expPctOfSanction = (w.expenditure_to_date / w.sanctioned_amount) * 100;
      const gap = expPctOfSanction - w.progress_percent;
      if (gap > 20) {
        rules.push({
          rule: "Payment Ahead of Progress",
          points: 18,
          detail: `Expenditure ${expPctOfSanction.toFixed(0)}% of sanction vs physical progress ${w.progress_percent}% — ${gap.toFixed(0)}pp gap (money released faster than work justifies).`,
        });
      }
    }

    // Rule 4: Delayed — past expectedCompletionDate and not Completed
    if (w.status !== "Completed" && new Date(w.expected_completion_date) < new Date(TODAY)) {
      const overdueDays = daysSince(w.expected_completion_date, TODAY);
      rules.push({
        rule: "Delayed",
        points: 15,
        detail: `${overdueDays} days past expected completion date (${w.expected_completion_date}); status is "${w.status}".`,
      });
    }

    // Rule 5: Stalled — no progress + status unchanged for 90+ simulated days
    if (w.status === "Stalled" || (w.progress_percent <= 5 && w.status !== "Completed" && w.status !== "Recommended")) {
      const stalledDays = daysSince(w.sanction_date, TODAY);
      if (stalledDays >= 90 && w.status !== "In Progress") {
        rules.push({
          rule: "Stalled",
          points: 16,
          detail: `No meaningful progress (${w.progress_percent}%) recorded; status "${w.status}" for ${stalledDays} days since sanction.`,
        });
      }
    }

    // Rule 6: Duplicate-suspect works
    if (dupSet.has(w.id)) {
      rules.push({
        rule: "Duplicate-Suspect",
        points: 20,
        detail: `Shares category + contractor + district + fiscal year with another work — possible duplicate/inflated billing.`,
      });
    }

    // Rule 7: Completion without evidence
    if (w.status === "Completed" && !w.completion_photo_uploaded) {
      rules.push({
        rule: "Completion Without Evidence",
        points: 12,
        detail: `Marked "Completed" but no completion photo uploaded — requires verification.`,
      });
    }

    const riskScore = Math.min(100, rules.reduce((sum, r) => sum + r.points, 0));
    const riskLevel = riskLevelFromScore(riskScore);

    return {
      ...w,
      riskScore,
      riskLevel,
      flaggedRules: rules,
      costPerUnit,
      sanctionYear,
    };
  });

  return scored;
}

// ---- alerts feed ----
export function buildAlerts(works: ScoredWork[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  for (const w of works) {
    if (w.riskLevel !== "Critical" && w.riskLevel !== "High") continue;
    // one alert per flagged rule, sorted by work risk score then rule points
    for (const rule of w.flaggedRules) {
      alerts.push({
        id: `${w.id}:${rule.rule}`,
        work: w,
        rule,
        sortKey: w.riskScore * 100 + rule.points,
      });
    }
  }
  // sort: highest risk first
  alerts.sort((a, b) => b.sortKey - a.sortKey);
  return alerts;
}

// ---- aggregate helpers ----
export function sum<T>(arr: T[], fn: (t: T) => number): number {
  return arr.reduce((s, x) => s + fn(x), 0);
}

export function fundsAtRisk(works: ScoredWork[]): number {
  // sanctioned amount of works that are High/Critical, capped at sanctioned
  return sum(
    works.filter((w) => w.riskLevel === "Critical" || w.riskLevel === "High"),
    (w) => w.sanctioned_amount
  );
}

export function ruleFrequency(works: ScoredWork[]): { rule: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const w of works) {
    for (const r of w.flaggedRules) {
      counts.set(r.rule, (counts.get(r.rule) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);
}

export function stateRiskBreakdown(works: ScoredWork[]): { state: string; critical: number; high: number; medium: number; low: number; total: number; fundsAtRisk: number }[] {
  const map = new Map<string, { state: string; critical: number; high: number; medium: number; low: number; total: number; fundsAtRisk: number }>();
  for (const w of works) {
    const e = map.get(w.state) ?? { state: w.state, critical: 0, high: 0, medium: 0, low: 0, total: 0, fundsAtRisk: 0 };
    e.total++;
    e[w.riskLevel.toLowerCase() as "critical" | "high" | "medium" | "low"]++;
    if (w.riskLevel === "Critical" || w.riskLevel === "High") e.fundsAtRisk += w.sanctioned_amount;
    map.set(w.state, e);
  }
  return [...map.values()].sort((a, b) => b.critical - a.critical || b.high - a.high);
}

export function districtRiskBreakdown(works: ScoredWork[], state: string): { district: string; critical: number; high: number; medium: number; low: number; total: number; fundsAtRisk: number }[] {
  const map = new Map<string, { district: string; critical: number; high: number; medium: number; low: number; total: number; fundsAtRisk: number }>();
  for (const w of works.filter((x) => x.state === state)) {
    const e = map.get(w.district) ?? { district: w.district, critical: 0, high: 0, medium: 0, low: 0, total: 0, fundsAtRisk: 0 };
    e.total++;
    e[w.riskLevel.toLowerCase() as "critical" | "high" | "medium" | "low"]++;
    if (w.riskLevel === "Critical" || w.riskLevel === "High") e.fundsAtRisk += w.sanctioned_amount;
    map.set(w.district, e);
  }
  return [...map.values()].sort((a, b) => b.critical - a.critical || b.high - a.high);
}

export function sanctionExpenditureTrend(works: ScoredWork[]): { year: number; sanctioned: number; expenditure: number }[] {
  const map = new Map<number, { year: number; sanctioned: number; expenditure: number }>();
  for (const w of works) {
    const y = w.sanctionYear;
    const e = map.get(y) ?? { year: y, sanctioned: 0, expenditure: 0 };
    e.sanctioned += w.sanctioned_amount;
    e.expenditure += w.expenditure_to_date;
    map.set(y, e);
  }
  return [...map.values()].sort((a, b) => a.year - b.year);
}

export function topFlaggedWorks(works: ScoredWork[], n = 10): ScoredWork[] {
  return [...works].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}
