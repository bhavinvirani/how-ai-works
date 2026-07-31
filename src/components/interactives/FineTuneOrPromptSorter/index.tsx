import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl } from '../../primitives';
import type { SegmentedOption } from '../../primitives';
import { JOB_TEXT, MARK_LABELS, PILE_LABELS, TEXT, VERDICTS } from './data.en';
import { isRight, JOBS, markFor, PILES, tally } from './logic';
import type { Answers, JobId, Pile } from './logic';

export interface FineTuneOrPromptSorterProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * The two segments, built once. Typed `Pile | ''` so that a job nobody has
 * sorted yet can have no segment checked at all, which is exactly what a radio
 * group should do when none of its options is the current value.
 */
const PILE_OPTIONS: readonly SegmentedOption<Pile | ''>[] = PILES.map(
  (pile) => ({ value: pile, label: PILE_LABELS[pile] }),
);

/**
 * Teaches one thing: what separates a fine-tuning job from a prompting job is
 * not how important it is or how much of it there is, but whether the machine
 * has to *do* something or has to be *right* about something.
 *
 * The commitment is the instrument. A verdict shown before a choice is a
 * paragraph the reader skims and agrees with; a verdict shown one second after
 * they have put a returns policy in the dials is one they remember. So nothing
 * is revealed until a pile has been chosen, and the reveal is per job rather
 * than at the end — being wrong about the second job is what makes anyone read
 * the sixth one carefully.
 *
 * No fallback is passed to the panel: this is eight groups of radio buttons,
 * which need neither hover nor drag precision and work as well on a phone as
 * on a desk. Nothing animates either, so `prefers-reduced-motion` has nothing
 * to slow down — every verdict appears the instant the choice is made.
 */
export function FineTuneOrPromptSorter({
  title,
  lead,
}: FineTuneOrPromptSorterProps = {}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [justAnswered, setJustAnswered] = useState<JobId | null>(null);

  const copy = ui.interactives.FineTuneOrPromptSorter;
  const score = tally(answers);
  const complete = score.answered === score.total;

  const choose = (id: JobId, pile: Pile) => {
    setAnswers((previous) => {
      const next: Partial<Record<JobId, Pile>> = { ...previous };
      next[id] = pile;
      return next;
    });
    setJustAnswered(id);
  };

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setAnswers({});
        setJustAnswered(null);
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{TEXT.intro}</p>

        {/* Declaration order, never re-sorted. A list that reorders itself as
            answers come in would take the alternating easy/tricky rhythm out
            of the set, which is the only reason the set is in this order. */}
        <ul className="flex flex-col gap-3">
          {JOBS.map((job) => {
            const chosen = answers[job.id];

            return (
              <li
                key={job.id}
                className="flex flex-col gap-2.5 rounded-md border border-rule bg-paper px-3 py-3"
              >
                <SegmentedControl<Pile | ''>
                  label={JOB_TEXT[job.id]}
                  options={PILE_OPTIONS}
                  value={chosen ?? ''}
                  onChange={(pile) => {
                    if (pile !== '') choose(job.id, pile);
                  }}
                />

                {chosen === undefined ? null : (
                  <div
                    className={`rounded-sm border-l-2 py-1.5 pl-3 ${
                      isRight(job, chosen)
                        ? 'border-l-accent-2 bg-accent-2-soft'
                        : 'border-l-accent bg-accent-soft'
                    }`}
                  >
                    <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                      {MARK_LABELS[markFor(job, chosen)]}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {VERDICTS[job.id]}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* A verdict appearing halfway up a list is silent for anyone not
            looking at it, so the newest one is repeated here with the running
            count. One region rather than eight: only ever one of them changes,
            and eight live regions on a page announce over each other. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {justAnswered === null ? '' : `${VERDICTS[justAnswered]} `}
          {complete
            ? TEXT.finished(score.right, score.total)
            : TEXT.progress(score.answered, score.total, score.right)}
        </p>
      </div>
    </InstrumentPanel>
  );
}
