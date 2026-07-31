/**
 * Progress tracking, with no backend by design (§4).
 *
 * Everything a reader does stays in their own browser. The `ProgressStore`
 * interface exists so that stays a choice rather than a constraint: a future
 * sync layer slots in as a second implementation behind the same methods,
 * without touching a single component.
 */

/** The current on-disk schema version. Bump it, then add a migration. */
export const PROGRESS_VERSION = 1;

export interface CheckpointResult {
  /** Which checkpoint within the unit. Units may have more than one. */
  checkpointId: string;
  /** Whether the reader revealed the answer. */
  revealed: boolean;
  /** ISO timestamp. */
  at: string;
}

export interface UnitProgress {
  /** ISO timestamp, or null when started but not finished. */
  completedAt: string | null;
  /** Keyed by checkpointId. */
  checkpoints: Record<string, CheckpointResult>;
}

/**
 * What actually gets written to localStorage.
 *
 * Versioned from day one so the schema can change without wiping anyone's
 * progress — the thing that is impossible to retrofit once real data exists.
 */
export interface ProgressPayload {
  v: number;
  units: Record<string, UnitProgress>;
}

export interface ImportResult {
  ok: boolean;
  /** Plain-English reason, safe to show a reader. */
  error?: string;
  /** How many units were read in. */
  unitCount?: number;
}

export interface ProgressStore {
  getUnit(id: string): UnitProgress | null;
  setUnitComplete(id: string): void;
  setUnitIncomplete(id: string): void;
  saveCheckpoint(id: string, result: CheckpointResult): void;
  exportJSON(): string;
  importJSON(payload: string): ImportResult;
  clearAll(): void;
}
