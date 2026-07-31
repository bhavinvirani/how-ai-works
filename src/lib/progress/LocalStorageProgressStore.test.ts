import { beforeEach, describe, expect, it } from 'vitest';

import {
  LocalStorageProgressStore,
  PROGRESS_STORAGE_KEY,
  progressAtom,
} from './LocalStorageProgressStore';
import { emptyPayload } from './payload';

const AT = '2026-01-01T00:00:00.000Z';
const LATER = '2026-06-01T00:00:00.000Z';

let store: LocalStorageProgressStore;

beforeEach(() => {
  localStorage.clear();
  progressAtom.set(emptyPayload());
  store = new LocalStorageProgressStore(() => AT);
});

describe('LocalStorageProgressStore', () => {
  it('knows nothing about a unit it has never seen', () => {
    expect(store.getUnit('tokenization')).toBeNull();
  });

  it('records completion with a timestamp', () => {
    store.setUnitComplete('tokenization');

    expect(store.getUnit('tokenization')?.completedAt).toBe(AT);
  });

  it('keeps the original timestamp when a unit is completed twice', () => {
    // The record is of when they finished, not of the last click.
    store.setUnitComplete('tokenization');
    new LocalStorageProgressStore(() => LATER).setUnitComplete('tokenization');

    expect(store.getUnit('tokenization')?.completedAt).toBe(AT);
  });

  it('can un-complete a unit without forgetting its checkpoints', () => {
    store.saveCheckpoint('tokenization', {
      checkpointId: 'q1',
      revealed: true,
      at: AT,
    });
    store.setUnitComplete('tokenization');
    store.setUnitIncomplete('tokenization');

    expect(store.getUnit('tokenization')?.completedAt).toBeNull();
    expect(store.getUnit('tokenization')?.checkpoints.q1?.revealed).toBe(true);
  });

  it('stores checkpoints separately within a unit', () => {
    store.saveCheckpoint('a', { checkpointId: 'q1', revealed: true, at: AT });
    store.saveCheckpoint('a', { checkpointId: 'q2', revealed: false, at: AT });

    expect(Object.keys(store.getUnit('a')?.checkpoints ?? {}).sort()).toEqual([
      'q1',
      'q2',
    ]);
  });

  it('persists across a reload', () => {
    store.setUnitComplete('tokenization');

    // Simulate a fresh page: drop the in-memory value, re-read storage.
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain('tokenization');
  });

  it('survives export, clear, and import', () => {
    // The whole cross-device story in one test.
    store.setUnitComplete('tokenization');
    store.saveCheckpoint('tokenization', {
      checkpointId: 'q1',
      revealed: true,
      at: AT,
    });

    const exported = store.exportJSON();
    store.clearAll();
    expect(store.getUnit('tokenization')).toBeNull();

    const result = store.importJSON(exported);

    expect(result.ok).toBe(true);
    expect(result.unitCount).toBe(1);
    expect(store.getUnit('tokenization')?.completedAt).toBe(AT);
    expect(store.getUnit('tokenization')?.checkpoints.q1?.revealed).toBe(true);
  });

  it('merges an import instead of replacing what is already here', () => {
    store.setUnitComplete('embeddings');
    const fromOtherDevice = JSON.stringify({
      v: 1,
      units: { tokenization: { completedAt: AT, checkpoints: {} } },
    });

    store.importJSON(fromOtherDevice);

    expect(store.getUnit('embeddings')?.completedAt).toBe(AT);
    expect(store.getUnit('tokenization')?.completedAt).toBe(AT);
  });

  it('reports a bad import without touching existing progress', () => {
    store.setUnitComplete('embeddings');

    const result = store.importJSON('not a progress file');

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(store.getUnit('embeddings')?.completedAt).toBe(AT);
  });

  it('exports something a person can read', () => {
    store.setUnitComplete('tokenization');
    const exported = store.exportJSON();

    expect(exported).toContain('\n');
    expect(JSON.parse(exported)).toMatchObject({ v: 1 });
  });

  it('clears everything', () => {
    store.setUnitComplete('a');
    store.setUnitComplete('b');

    store.clearAll();

    expect(store.all()).toEqual({});
  });
});
