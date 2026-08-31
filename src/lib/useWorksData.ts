import { useEffect, useMemo, useState } from "react";
import { generateSeedWorks } from "./seed";
import { scoreWorks, buildAlerts } from "./anomaly";
import { mongoConfigured, findAllWorks, insertManyWorks, deleteAllWorks, updateWorkField } from "./mongo";
import { localLoadAll, localSaveAll, localDeleteAll, localUpdateField } from "./localStore";
import type { WorkRow, ScoredWork, AlertItem, ReviewState } from "./types";

interface DataState {
  loading: boolean;
  seeding: boolean;
  error: string | null;
  rows: WorkRow[];
  works: ScoredWork[];
  alerts: AlertItem[];
  storage: "MongoDB Atlas" | "Local Storage";
  refresh: () => void;
  seedNow: () => Promise<void>;
  updateReviewState: (id: string, review_state: ReviewState) => Promise<void>;
}

// Maps the loose Mongo documents to our typed WorkRow shape.
function toWorkRow(doc: Record<string, unknown>): WorkRow {
  return {
    id: String(doc.id),
    work_code: String(doc.work_code ?? ""),
    title: String(doc.title ?? ""),
    category: String(doc.category ?? ""),
    mp_name: String(doc.mp_name ?? ""),
    constituency: String(doc.constituency ?? ""),
    state: String(doc.state ?? ""),
    district: String(doc.district ?? ""),
    implementing_agency: String(doc.implementing_agency ?? ""),
    sanctioned_amount: Number(doc.sanctioned_amount ?? 0),
    expenditure_to_date: Number(doc.expenditure_to_date ?? 0),
    unit_of_measure: doc.unit_of_measure as WorkRow["unit_of_measure"] ?? "unit",
    quantity: Number(doc.quantity ?? 0),
    sanction_date: String(doc.sanction_date ?? ""),
    expected_completion_date: String(doc.expected_completion_date ?? ""),
    actual_completion_date: doc.actual_completion_date ? String(doc.actual_completion_date) : null,
    progress_percent: Number(doc.progress_percent ?? 0),
    status: doc.status as WorkRow["status"] ?? "Sanctioned",
    completion_photo_uploaded: Boolean(doc.completion_photo_uploaded),
    review_state: (doc.review_state as ReviewState) ?? "pending",
  };
}

export function useWorksData(): DataState {
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<WorkRow[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (mongoConfigured) {
          const docs = await findAllWorks(1000);
          if (!active) return;
          setRows(docs.map(toWorkRow));
        } else {
          setRows(localLoadAll());
        }
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load works");
        // try local fallback so the app is still usable
        setRows(localLoadAll());
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [tick]);

  const works = useMemo(() => scoreWorks(rows), [rows]);
  const alerts = useMemo(() => buildAlerts(works), [works]);

  async function seedNow() {
    setSeeding(true);
    setError(null);
    try {
      const seed = generateSeedWorks();
      if (mongoConfigured) {
        await deleteAllWorks();
        await insertManyWorks(seed as unknown as Record<string, unknown>[]);
      } else {
        localDeleteAll();
        localSaveAll(seed);
      }
      setTick((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Seeding failed");
    } finally {
      setSeeding(false);
    }
  }

  async function updateReviewState(id: string, review_state: ReviewState) {
    const prev = rows.find((r) => r.id === id)?.review_state ?? "pending";
    // optimistic local update
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, review_state } : r)));
    try {
      if (mongoConfigured) {
        await updateWorkField(id, "review_state", review_state);
      } else {
        localUpdateField(id, "review_state", review_state);
      }
    } catch (e) {
      // revert on failure
      setRows((cur) => cur.map((r) => (r.id === id ? { ...r, review_state: prev } : r)));
      setError(e instanceof Error ? e.message : "Failed to update review state");
    }
  }

  return {
    loading,
    seeding,
    error,
    rows,
    works,
    alerts,
    storage: mongoConfigured ? "MongoDB Atlas" : "Local Storage",
    refresh: () => setTick((t) => t + 1),
    seedNow,
    updateReviewState,
  };
}
