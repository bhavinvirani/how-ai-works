import { describe, expect, it } from 'vitest';

import {
  decodePayload,
  emptyPayload,
  encodeForExport,
  mergePayloads,
  migrate,
  readImport,
} from './payload';
import { PROGRESS_VERSION } from './types';

const unit = (completedAt: string | null = null) => ({
  completedAt,
  checkpoints: {},
});

describe('decodePayload', () => {
  it('starts fresh on empty storage', () => {
    expect(decodePayload(null)).toEqual(emptyPayload());
    expect(decodePayload('')).toEqual(emptyPayload());
  });

  it('starts fresh rather than throwing on corrupted storage', () => {
    // A parse error here must not brick every page that reads progress.
    expect(decodePayload('{not json')).toEqual(emptyPayload());
    expect(decodePayload('null')).toEqual(emptyPayload());
    expect(decodePayload('[1,2,3]')).toEqual(emptyPayload());
  });

  it('reads a well-formed payload', () => {
    const stored = JSON.stringify({
      v: 1,
      units: { tokenization: unit('2026-01-01T00:00:00.000Z') },
    });

    expect(decodePayload(stored).units.tokenization?.completedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });
});

describe('migrate', () => {
  it('always stamps the current version', () => {
    expect(migrate({ v: 0, units: {} }).v).toBe(PROGRESS_VERSION);
  });

  it('drops malformed units instead of failing the whole payload', () => {
    // Losing one unit's state beats losing all of it.
    const result = migrate({
      v: 1,
      units: { good: unit('2026-01-01T00:00:00.000Z'), bad: 'nonsense' },
    });

    expect(Object.keys(result.units)).toEqual(['good']);
  });

  it('treats a missing completedAt as not complete', () => {
    const result = migrate({ v: 1, units: { a: { checkpoints: {} } } });
    expect(result.units.a?.completedAt).toBeNull();
  });

  it('keeps checkpoints and defaults revealed to false', () => {
    const result = migrate({
      v: 1,
      units: {
        a: {
          completedAt: null,
          checkpoints: { q1: { at: '2026-01-01T00:00:00.000Z' } },
        },
      },
    });

    expect(result.units.a?.checkpoints.q1).toEqual({
      checkpointId: 'q1',
      revealed: false,
      at: '2026-01-01T00:00:00.000Z',
    });
  });

  it('discards a checkpoint with no timestamp', () => {
    const result = migrate({
      v: 1,
      units: {
        a: { completedAt: null, checkpoints: { q1: { revealed: true } } },
      },
    });

    expect(result.units.a?.checkpoints).toEqual({});
  });

  it('reads a payload from a future version best-effort', () => {
    // Telling a reader their own file is invalid is worse than reading what we
    // can understand from it.
    const result = migrate({
      v: 99,
      units: { a: unit('2026-01-01T00:00:00.000Z') },
    });

    expect(result.v).toBe(PROGRESS_VERSION);
    expect(result.units.a?.completedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('readImport', () => {
  it('rejects an empty file with a readable reason', () => {
    const result = readImport('   ');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/empty/i);
  });

  it('rejects invalid JSON without mentioning parsers', () => {
    const result = readImport('{oops');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not valid JSON/i);
  });

  it('rejects valid JSON that is not a progress file', () => {
    const result = readImport('{"hello":"world"}');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/units/);
  });

  it('accepts a real progress file and counts what it found', () => {
    const result = readImport(
      JSON.stringify({
        v: 1,
        units: { a: unit('2026-01-01T00:00:00.000Z'), b: unit() },
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.unitCount).toBe(2);
  });

  it('accepts a file this app exported', () => {
    // export -> import is the whole cross-device story; it must round-trip.
    const exported = encodeForExport({
      v: 1,
      units: { a: unit('2026-01-01T00:00:00.000Z') },
    });

    const result = readImport(exported);
    expect(result.ok).toBe(true);
    expect(result.payload?.units.a?.completedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    );
  });
});

describe('mergePayloads', () => {
  const at = (day: string) => `2026-01-${day}T00:00:00.000Z`;

  it('adds units the reader did not have', () => {
    const merged = mergePayloads(emptyPayload(), {
      v: 1,
      units: { a: unit(at('01')) },
    });

    expect(merged.units.a?.completedAt).toBe(at('01'));
  });

  it('never un-completes a unit', () => {
    // An import is additive. Someone restoring an old backup must not lose
    // work they did since.
    const merged = mergePayloads(
      { v: 1, units: { a: unit(at('05')) } },
      { v: 1, units: { a: unit(null) } },
    );

    expect(merged.units.a?.completedAt).toBe(at('05'));
  });

  it('completes a unit the incoming file finished', () => {
    const merged = mergePayloads(
      { v: 1, units: { a: unit(null) } },
      { v: 1, units: { a: unit(at('02')) } },
    );

    expect(merged.units.a?.completedAt).toBe(at('02'));
  });

  it('keeps the earlier completion as the honest record', () => {
    const merged = mergePayloads(
      { v: 1, units: { a: unit(at('09')) } },
      { v: 1, units: { a: unit(at('03')) } },
    );

    expect(merged.units.a?.completedAt).toBe(at('03'));
  });

  it('leaves untouched units alone', () => {
    const merged = mergePayloads(
      { v: 1, units: { a: unit(at('01')), b: unit(at('02')) } },
      { v: 1, units: { a: unit(at('01')) } },
    );

    expect(Object.keys(merged.units).sort()).toEqual(['a', 'b']);
    expect(merged.units.b?.completedAt).toBe(at('02'));
  });

  it('prefers local checkpoint answers over imported ones', () => {
    const merged = mergePayloads(
      {
        v: 1,
        units: {
          a: {
            completedAt: null,
            checkpoints: {
              q1: { checkpointId: 'q1', revealed: true, at: at('05') },
            },
          },
        },
      },
      {
        v: 1,
        units: {
          a: {
            completedAt: null,
            checkpoints: {
              q1: { checkpointId: 'q1', revealed: false, at: at('01') },
              q2: { checkpointId: 'q2', revealed: true, at: at('01') },
            },
          },
        },
      },
    );

    expect(merged.units.a?.checkpoints.q1?.revealed).toBe(true);
    expect(merged.units.a?.checkpoints.q2?.revealed).toBe(true);
  });
});
