import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { ui } from '../../copy/en';
import { BUTTON_BASE } from './styles';

export interface RevealButtonProps {
  children: ReactNode;
  /** Overrides the default labels when the hidden content is not an answer. */
  showLabel?: string;
  hideLabel?: string;
}

/**
 * Hides content behind a press — the bench-notes "work it out first" move.
 *
 * Deliberately keeps the revealed content mounted only while open, so a
 * learner cannot find the answer by searching the page before trying. That is
 * a pedagogy decision, not a performance one.
 *
 * For MDX checkpoints prefer the `Checkpoint` block, which does the same thing
 * with `<details>` and ships no JavaScript. This primitive exists for reveals
 * that happen *inside* an already-hydrated instrument.
 */
export function RevealButton({
  children,
  showLabel,
  hideLabel,
}: RevealButtonProps) {
  const [open, setOpen] = useState(false);
  const regionId = useId();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => {
          setOpen((wasOpen) => !wasOpen);
        }}
        className={`${BUTTON_BASE} self-start px-3 py-1.5 text-sm`}
      >
        {open ? (hideLabel ?? ui.reveal.hide) : (showLabel ?? ui.reveal.show)}
      </button>

      <div id={regionId} hidden={!open}>
        {open ? (
          <div className="border-l-2 border-accent pl-4">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
