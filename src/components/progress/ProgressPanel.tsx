import { useStore } from '@nanostores/react';
import { useId, useRef, useState } from 'react';

import { ui } from '../../copy/en';
import {
  progressAtom,
  progressStore,
} from '../../lib/progress/LocalStorageProgressStore';
import { BUTTON_BASE } from '../primitives/styles';

export interface PartSummary {
  id: string;
  label: string;
  unitIds: string[];
}

export interface ProgressPanelProps {
  /** Parts and their units, resolved from the content collection at build time. */
  parts?: PartSummary[];
}

const copy = ui.progress.page;

/**
 * The `/progress` page's working parts.
 *
 * Reads from the persistent nanostore, so it reflects anything a unit page
 * recorded without either side knowing about the other.
 */
export function ProgressPanel({ parts = [] }: ProgressPanelProps) {
  const payload = useStore(progressAtom);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  const isComplete = (unitId: string) =>
    payload.units[unitId]?.completedAt != null;

  const download = () => {
    const blob = new Blob([progressStore.exportJSON()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'how-ai-works-progress.json';
    link.click();

    // Without this the blob is held until the tab closes.
    URL.revokeObjectURL(url);
  };

  const load = async (file: File | undefined) => {
    if (!file) return;

    setNotice(null);
    setError(null);

    const result = progressStore.importJSON(await file.text());

    if (result.ok) {
      setNotice(copy.importedOne(result.unitCount ?? 0));
    } else {
      setError(result.error ?? null);
    }

    // Allow re-selecting the same file after a failed attempt.
    if (fileInput.current) fileInput.current.value = '';
  };

  const clear = () => {
    if (!window.confirm(copy.clearConfirm)) return;
    progressStore.clearAll();
    setError(null);
    setNotice(copy.cleared);
  };

  const totalUnits = parts.reduce((sum, part) => sum + part.unitIds.length, 0);

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="progress-privacy"
        className="rounded-r-md border-l-4 border-l-accent-2 bg-accent-2-soft px-4 py-3"
      >
        <h2 id="progress-privacy" className="text-sm font-semibold text-ink">
          {copy.privacyHeading}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{copy.privacyBody}</p>
      </section>

      {totalUnits === 0 ? (
        <p className="text-ink-muted">{copy.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {parts.map((part) => {
            const done = part.unitIds.filter(isComplete).length;
            return (
              <li key={part.id} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {part.label}
                  </h2>
                  <span className="font-mono text-xs text-ink-muted tabular-nums">
                    {copy.unitsComplete(done, part.unitIds.length)}
                  </span>
                </div>

                {/* Numbers alongside the bar: a bar alone conveys by width only. */}
                <div
                  role="progressbar"
                  aria-valuenow={done}
                  aria-valuemin={0}
                  aria-valuemax={part.unitIds.length}
                  aria-label={part.label}
                  className="h-2 overflow-hidden rounded-full border border-rule-strong bg-paper-sunken"
                >
                  <div
                    className="h-full bg-accent-2"
                    style={{
                      width: `${String(
                        part.unitIds.length === 0
                          ? 0
                          : (done / part.unitIds.length) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section
        aria-labelledby="progress-transfer"
        className="flex flex-col gap-2"
      >
        <h2
          id="progress-transfer"
          className="font-display text-lg font-semibold text-ink"
        >
          {copy.exportHeading}
        </h2>
        <p className="text-sm text-ink-muted">{copy.exportBody}</p>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={download}
            className={`${BUTTON_BASE} px-3 py-1.5 text-sm`}
          >
            {copy.exportAction}
          </button>

          {/* A styled label driving a hidden file input: file inputs cannot be
              restyled, but the label is a real one, so this stays operable by
              keyboard and announces correctly. */}
          <label
            htmlFor={fileInputId}
            className={`${BUTTON_BASE} cursor-pointer px-3 py-1.5 text-sm focus-within:outline-2`}
          >
            {copy.importAction}
          </label>
          <input
            id={fileInputId}
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              void load(event.target.files?.[0]);
            }}
          />
        </div>
      </section>

      <section aria-labelledby="progress-clear" className="flex flex-col gap-2">
        <h2
          id="progress-clear"
          className="font-display text-lg font-semibold text-ink"
        >
          {copy.clearHeading}
        </h2>
        <p className="text-sm text-ink-muted">{copy.clearBody}</p>
        <button
          type="button"
          onClick={clear}
          className={`${BUTTON_BASE} self-start px-3 py-1.5 text-sm text-danger`}
        >
          {copy.clearAction}
        </button>
      </section>

      {/* Announced rather than merely shown — the result of an import is not
          visible anywhere else on the page. */}
      <p role="status" className="text-sm text-ink-muted">
        {notice}
      </p>
      <p role="alert" className="text-sm text-danger">
        {error}
      </p>
    </div>
  );
}
