import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import type { SegmentedOption } from '../../primitives';
import {
  ANSWER_LABEL,
  ANSWER_TEXT,
  QUESTION_TEXT,
  SOURCE_TEXT,
  TAGS,
  TELL_TEXT,
  TEXT,
  TRACE,
} from './data.en';
import { accusedBy, ANSWERS, isRight, SOURCE_LINE_IDS, TELLS } from './logic';
import type { AnswerId } from './logic';

export interface SpotTheFabricationProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Typed `AnswerId | ''` so that a reader who has accused nobody yet has no
 * segment checked at all, which is what a radio group should do when none of
 * its options is the current value.
 */
const PICK_OPTIONS: readonly SegmentedOption<AnswerId | ''>[] = ANSWERS.map(
  (answer) => ({ value: answer.id, label: ANSWER_LABEL[answer.id] }),
);

/**
 * Teaches one thing: nothing in the writing of a fabricated answer separates it
 * from a true one. The separation is the source, and only a comparison against
 * the source can find it.
 *
 * THE COMMITMENT IS THE INSTRUMENT. A reveal shown straight away is a paragraph
 * the reader agrees with and forgets; a reveal shown one second after they have
 * accused the wrong answer is one they argue with. So the check is locked until
 * an accusation exists, and the switch says so rather than sitting there looking
 * broken.
 *
 * The reveal has two halves on purpose. The first says where each answer came
 * from, which settles the puzzle. The second measures the writing — hedging,
 * figures, length, from both ends — and shows all six readings landing on an
 * answer that is true. Without that half a reader concludes they were unlucky.
 * With it, the failure is a fact about the answers rather than about them.
 *
 * No fallback is passed to the panel: this is a passage, four paragraphs, a
 * radio group and a switch, none of which need hover or drag precision, and all
 * of which work on a phone. Nothing animates either, so `prefers-reduced-motion`
 * has nothing to slow down — every reveal appears the instant it is asked for.
 */
export function SpotTheFabrication({
  title,
  lead,
}: SpotTheFabricationProps = {}) {
  const [accused, setAccused] = useState<AnswerId | null>(null);
  const [checked, setChecked] = useState(false);

  const copy = ui.interactives.SpotTheFabrication;

  const readout = (): string => {
    if (accused === null) return TEXT.beforePick;
    if (!checked) return TEXT.committed(ANSWER_LABEL[accused]);
    return isRight(accused) ? TEXT.found : TEXT.missed(ANSWER_LABEL[accused]);
  };

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setAccused(null);
        setChecked(false);
      }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">{TEXT.intro}</p>

        <div className="rounded-md border border-rule bg-paper-sunken px-3 py-3">
          <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
            {TEXT.sourceHeading}
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {SOURCE_LINE_IDS.map((line) => (
              <li key={line} className="text-sm text-ink">
                {SOURCE_TEXT[line]}
              </li>
            ))}
          </ul>
        </div>

        {/* Declaration order, never re-sorted — see the note in logic.ts. */}
        <ul className="flex flex-col gap-3">
          {ANSWERS.map((answer) => (
            <li
              key={answer.id}
              className="flex flex-col gap-1.5 rounded-md border border-rule bg-paper px-3 py-3"
            >
              <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                {QUESTION_TEXT[answer.id]}
              </p>
              <p className="text-sm text-ink">{ANSWER_TEXT[answer.id]}</p>

              {checked ? (
                <div
                  className={`mt-1 rounded-sm border-l-2 py-1.5 pl-3 ${
                    answer.invented
                      ? 'border-l-accent bg-accent-soft'
                      : 'border-l-accent-2 bg-accent-2-soft'
                  }`}
                >
                  <p className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                    {answer.invented ? TAGS.invented : TAGS.traced}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {TRACE[answer.id]}
                  </p>
                </div>
              ) : null}
            </li>
          ))}
        </ul>

        <SegmentedControl<AnswerId | ''>
          label={TEXT.pickLabel}
          options={PICK_OPTIONS}
          value={accused ?? ''}
          onChange={(id) => {
            if (id !== '') setAccused(id);
          }}
        />

        <Toggle
          label={TEXT.revealLabel}
          description={
            accused === null ? TEXT.revealBlocked : TEXT.revealDescription
          }
          checked={checked}
          onChange={setChecked}
          disabled={accused === null}
        />

        {checked ? (
          <div className="flex flex-col gap-2 rounded-md border border-rule bg-paper-sunken px-3 py-3">
            <p className="text-sm text-ink">{TEXT.tellsIntro}</p>
            <ul className="flex flex-col gap-1">
              {TELLS.map((tell) => (
                <li key={tell} className="text-sm text-ink-muted">
                  {TEXT.tellLine(
                    TELL_TEXT[tell],
                    ANSWER_LABEL[accusedBy(tell, ANSWER_TEXT)],
                  )}
                </li>
              ))}
            </ul>
            <p className="text-sm text-ink">{TEXT.tellsClosing}</p>
          </div>
        ) : null}

        {/* Everything above changes silently for anyone not looking at it, and
            the verdict is the whole point of the exercise, so it is repeated
            here in one region rather than left to the tinted panels. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {readout()}
        </p>
      </div>
    </InstrumentPanel>
  );
}
