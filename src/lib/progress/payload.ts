import { PROGRESS_VERSION } from './types';
import type { ImportResult, ProgressPayload, UnitProgress } from './types';

/**
 * Reading, validating, and migrating the stored payload.
 *
 * Kept pure and separate from the store itself because this is the part that
 * can destroy someone's data. A parser that throws on unexpected input, or a
 * migration that silently drops a field, is not recoverable — the reader has no
 * copy anywhere else. So it is tested on its own, including against input that
 * was never written by us.
 */

export const emptyPayload = (): ProgressPayload => ({
  v: PROGRESS_VERSION,
  units: {},
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Coerce one unit's progress, discarding anything malformed rather than
 * failing the whole import. Losing one unit's state beats losing all of it.
 */
function readUnit(value: unknown): UnitProgress | null {
  if (!isRecord(value)) return null;

  const completedAt =
    typeof value.completedAt === 'string' ? value.completedAt : null;

  const checkpoints: UnitProgress['checkpoints'] = {};
  if (isRecord(value.checkpoints)) {
    for (const [key, entry] of Object.entries(value.checkpoints)) {
      if (!isRecord(entry)) continue;
      if (typeof entry.at !== 'string') continue;

      checkpoints[key] = {
        checkpointId:
          typeof entry.checkpointId === 'string' ? entry.checkpointId : key,
        revealed: entry.revealed === true,
        at: entry.at,
      };
    }
  }

  return { completedAt, checkpoints };
}

/**
 * Bring any stored shape up to the current version.
 *
 * The version switch is deliberately exhaustive-by-fallthrough: an unknown
 * FUTURE version (someone importing a file from a newer build) is read
 * best-effort rather than rejected, because the alternative is telling a reader
 * their own data is invalid.
 */
export function migrate(raw: unknown): ProgressPayload {
  if (!isRecord(raw)) return emptyPayload();

  const units: ProgressPayload['units'] = {};
  if (isRecord(raw.units)) {
    for (const [id, value] of Object.entries(raw.units)) {
      const unit = readUnit(value);
      if (unit) units[id] = unit;
    }
  }

  // v1 is the first version, so there is nothing to step through yet. When v2
  // arrives, transform here based on `raw.v` before returning.
  return { v: PROGRESS_VERSION, units };
}

/** Parse stored text into a payload, tolerating anything. */
export function decodePayload(
  text: string | null | undefined,
): ProgressPayload {
  if (!text) return emptyPayload();

  try {
    return migrate(JSON.parse(text));
  } catch {
    // Corrupted storage should not brick the page. Starting fresh is the only
    // option, and it is better than an exception on every render.
    return emptyPayload();
  }
}

export const encodePayload = (payload: ProgressPayload): string =>
  JSON.stringify(payload);

/** Pretty-printed for the export file, since a human may open it. */
export const encodeForExport = (payload: ProgressPayload): string =>
  `${JSON.stringify(payload, null, 2)}\n`;

/**
 * Validate text a reader pasted or uploaded.
 *
 * Distinguished from `decodePayload` on purpose: silently starting fresh is
 * right for our own corrupted storage, and completely wrong for an import,
 * where the reader needs to be told what went wrong.
 */
export function readImport(text: string): ImportResult & {
  payload?: ProgressPayload;
} {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: false, error: 'That file was empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      error: 'That does not look like a progress file — it is not valid JSON.',
    };
  }

  if (!isRecord(parsed) || !isRecord(parsed.units)) {
    return {
      ok: false,
      error:
        'That JSON is not a progress file. A progress file has a "units" section.',
    };
  }

  const payload = migrate(parsed);
  return {
    ok: true,
    unitCount: Object.keys(payload.units).length,
    payload,
  };
}

/** Merge imported progress into existing progress, keeping the further along. */
export function mergePayloads(
  current: ProgressPayload,
  incoming: ProgressPayload,
): ProgressPayload {
  const units: ProgressPayload['units'] = { ...current.units };

  for (const [id, incomingUnit] of Object.entries(incoming.units)) {
    const existing = units[id];

    if (!existing) {
      units[id] = incomingUnit;
      continue;
    }

    units[id] = {
      // Completion is never taken away by an import: if either side finished
      // the unit, it stays finished, and the earlier timestamp wins as the
      // honest record of when it actually happened.
      completedAt:
        existing.completedAt && incomingUnit.completedAt
          ? ([existing.completedAt, incomingUnit.completedAt].sort()[0] ?? null)
          : (existing.completedAt ?? incomingUnit.completedAt),
      checkpoints: { ...incomingUnit.checkpoints, ...existing.checkpoints },
    };
  }

  return { v: PROGRESS_VERSION, units };
}
