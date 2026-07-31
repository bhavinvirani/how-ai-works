import { useStore } from '@nanostores/react';

import { ui } from '../../copy/en';
import {
  progressAtom,
  progressStore,
} from '../../lib/progress/LocalStorageProgressStore';
import { BUTTON_BASE } from '../primitives/styles';

export interface UnitProgressProps {
  /** The unit's id — the filename it is stored under. */
  unitId: string;
}

/**
 * Marks a unit finished.
 *
 * The only thing on a unit page that writes progress, so it is deliberately
 * plain: one button, current state visible, and nothing that could be mistaken
 * for a score. Nobody is being graded here.
 */
export function UnitProgress({ unitId }: UnitProgressProps) {
  const payload = useStore(progressAtom);
  const complete = payload.units[unitId]?.completedAt != null;

  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-rule pt-4">
      <span
        className={`text-sm ${complete ? 'font-medium text-success' : 'text-ink-faint'}`}
      >
        {/* A tick alone would carry the state by colour and glyph only. */}
        {complete ? `✓ ${ui.progress.complete}` : ''}
      </span>

      <button
        type="button"
        aria-pressed={complete}
        onClick={() => {
          if (complete) progressStore.setUnitIncomplete(unitId);
          else progressStore.setUnitComplete(unitId);
        }}
        className={`${BUTTON_BASE} px-3 py-1.5 text-sm`}
      >
        {complete ? ui.progress.markIncomplete : ui.progress.markComplete}
      </button>
    </div>
  );
}
