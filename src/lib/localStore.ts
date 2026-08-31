// localStorage-backed persistence used when MongoDB Atlas env vars are absent.
// Provides the same surface the app expects: load all, seed, update field.

import type { WorkRow } from "./types";

const KEY = "mplads_sentinel_works";

export function localLoadAll(): WorkRow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function localSaveAll(works: WorkRow[]): void {
  localStorage.setItem(KEY, JSON.stringify(works));
}

export function localDeleteAll(): void {
  localStorage.removeItem(KEY);
}

export function localUpdateField(id: string, field: keyof WorkRow, value: unknown): WorkRow[] {
  const all = localLoadAll();
  const updated = all.map((w) => (w.id === id ? { ...w, [field]: value } : w));
  localSaveAll(updated);
  return updated;
}
