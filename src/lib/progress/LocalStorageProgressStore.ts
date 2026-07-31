import { persistentAtom } from '@nanostores/persistent';

import {
  decodePayload,
  emptyPayload,
  encodeForExport,
  encodePayload,
  mergePayloads,
  readImport,
} from './payload';
import type {
  CheckpointResult,
  ImportResult,
  ProgressPayload,
  ProgressStore,
  UnitProgress,
} from './types';

/**
 * The only implementation, for now: everything lives in the reader's browser.
 *
 * Built on a persistent nanostore so any island can subscribe and stay in sync
 * — a checkpoint answered inside a unit updates the `/progress` page without
 * either knowing about the other.
 */

export const PROGRESS_STORAGE_KEY = 'how-ai-works:progress';

export const progressAtom = persistentAtom<ProgressPayload>(
  PROGRESS_STORAGE_KEY,
  emptyPayload(),
  { encode: encodePayload, decode: decodePayload },
);

const blankUnit = (): UnitProgress => ({ completedAt: null, checkpoints: {} });

export class LocalStorageProgressStore implements ProgressStore {
  /**
   * @param now injectable so tests are not at the mercy of the wall clock
   */
  constructor(
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  getUnit(id: string): UnitProgress | null {
    return progressAtom.get().units[id] ?? null;
  }

  /** Everything a reader has any record for. */
  all(): Record<string, UnitProgress> {
    return progressAtom.get().units;
  }

  private update(id: string, change: (unit: UnitProgress) => UnitProgress) {
    const payload = progressAtom.get();
    const current = payload.units[id] ?? blankUnit();

    progressAtom.set({
      ...payload,
      units: { ...payload.units, [id]: change(current) },
    });
  }

  setUnitComplete(id: string): void {
    // Re-completing keeps the original timestamp: it is a record of when the
    // reader actually finished, not of the last time they clicked.
    this.update(id, (unit) => ({
      ...unit,
      completedAt: unit.completedAt ?? this.now(),
    }));
  }

  setUnitIncomplete(id: string): void {
    this.update(id, (unit) => ({ ...unit, completedAt: null }));
  }

  saveCheckpoint(id: string, result: CheckpointResult): void {
    this.update(id, (unit) => ({
      ...unit,
      checkpoints: { ...unit.checkpoints, [result.checkpointId]: result },
    }));
  }

  exportJSON(): string {
    return encodeForExport(progressAtom.get());
  }

  /**
   * Merge an exported file into whatever is already here.
   *
   * Merging rather than replacing, because the realistic case is a reader
   * moving between two devices that both have some progress. Replacing would
   * quietly destroy whichever side they imported into.
   */
  importJSON(payload: string): ImportResult {
    const result = readImport(payload);
    if (!result.ok || !result.payload) {
      return { ok: false, error: result.error };
    }

    progressAtom.set(mergePayloads(progressAtom.get(), result.payload));

    return { ok: true, unitCount: result.unitCount };
  }

  clearAll(): void {
    progressAtom.set(emptyPayload());
  }
}

/** The shared instance components use. */
export const progressStore = new LocalStorageProgressStore();
