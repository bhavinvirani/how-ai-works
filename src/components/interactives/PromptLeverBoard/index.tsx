import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Toggle } from '../../primitives';
import {
  CONTINUATIONS,
  DIMENSIONS,
  LEVERS,
  openingLines,
  REQUEST,
  TEXT,
  WRITTEN_MARK,
} from './data.en';
import type { LeverId, Levers, OptionState } from './logic';
import {
  endingsThatFit,
  LEVER_IDS,
  NOTHING_PULLED,
  optionState,
  outcomeKey,
  ruledOut,
  TOTAL_ENDINGS,
  withLever,
  writtenOption,
} from './logic';

export interface PromptLeverBoardProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Three settings, three treatments, and not one of them is a colour on its own
 * (hard rule 9). The written ending carries a mark and heavier weight, a
 * setting still in play is plain, and one the opening has excluded is dashed
 * and struck through.
 */
const CHIP: Record<OptionState, string> = {
  written:
    'rounded-sm border border-accent bg-accent-soft px-1.5 py-0.5 font-mono text-xs font-semibold text-ink',
  possible:
    'rounded-sm border border-rule-strong bg-paper-raised px-1.5 py-0.5 font-mono text-xs text-ink',
  'ruled-out':
    'rounded-sm border border-dashed border-rule px-1.5 py-0.5 font-mono text-xs text-ink-faint line-through',
};

/**
 * Teaches one thing: everything that works in prompting works by cutting down
 * what could plausibly come next — and the request never has to move for it to
 * happen.
 *
 * Which is why the request is a fixed line the reader cannot edit. An
 * instrument with a text box would let them rewrite the question, and then any
 * change in the answer could be put down to having asked something else. Here
 * the seven words at the top are identical in all eight states of the board, so
 * the only available explanation for a different answer is the document those
 * seven words now sit in.
 *
 * Opening on nothing pulled is also deliberate. The first thing the reader
 * meets is the competent, unaddressed, useless paragraph — the answer they have
 * been getting for months without knowing why.
 *
 * Nothing animates beyond the toggle knob, whose transition is already token-
 * driven, so `prefers-reduced-motion` has nothing to slow down: every pull
 * redraws instantly.
 */
export function PromptLeverBoard({ title, lead }: PromptLeverBoardProps = {}) {
  const [levers, setLevers] = useState<Levers>(NOTHING_PULLED);

  const copy = ui.interactives.PromptLeverBoard;
  const opening = openingLines(levers);
  const fits = endingsThatFit(levers);
  const written = CONTINUATIONS[outcomeKey(levers)];

  const settingWritten = (id: LeverId) =>
    DIMENSIONS[id].options[writtenOption(levers, id)];

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setLevers(NOTHING_PULLED);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.openingLabel}
          </p>

          {/* The document itself. The request is heavier and unindented; every
              line a lever wrote sits underneath it behind a rule, so "one thing
              was added" is carried by position as well as by weight. */}
          <div className="rounded-md border border-rule-strong bg-paper-sunken px-3 py-2.5">
            <p className="font-mono text-xs font-semibold text-ink">
              {REQUEST}
            </p>

            {opening.slice(1).map((line) => (
              <p
                key={line}
                className="mt-1.5 border-l-2 border-accent pl-2 font-mono text-xs text-ink-muted"
              >
                {line}
              </p>
            ))}
          </div>

          <p className="text-xs text-ink-faint">{TEXT.openingNote}</p>
        </div>

        {/* The space of endings. Announced in words by the readout below, so
            the chips themselves are hidden rather than read out one by one. */}
        <div className="flex flex-col gap-2.5" aria-hidden="true">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.boardLabel}
          </p>

          {LEVER_IDS.map((id) => (
            <div key={id} className="flex flex-col gap-1">
              <p className="text-xs text-ink-faint">{DIMENSIONS[id].caption}</p>

              <ul className="flex flex-wrap gap-1.5">
                {DIMENSIONS[id].options.map((option, index) => {
                  const state = optionState(levers, id, index);

                  return (
                    <li key={option} className={CHIP[state]}>
                      {state === 'written' ? `${WRITTEN_MARK} ` : ''}
                      {option}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <p className="text-xs text-ink-faint">{TEXT.boardNote}</p>
        </div>

        <div className="flex flex-col gap-3">
          {LEVER_IDS.map((id) => (
            <Toggle
              key={id}
              label={LEVERS[id].label}
              description={LEVERS[id].description}
              checked={levers[id]}
              onChange={(on) => {
                setLevers((current) => withLever(current, id, on));
              }}
            />
          ))}
        </div>

        {/* The board changes silently for anyone not looking at it, and the
            count and the continuation are the whole lesson, so both live here
            rather than in two regions competing to be announced. */}
        <div aria-live="polite" className="flex flex-col gap-2">
          <p className="text-sm text-ink-muted">
            {TEXT.count(fits, TOTAL_ENDINGS, ruledOut(levers))}{' '}
            {TEXT.chosen(
              settingWritten('who'),
              settingWritten('shape'),
              settingWritten('purpose'),
            )}
          </p>

          <div className="rounded-md border border-rule-strong bg-paper-raised px-3 py-2.5">
            <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
              {TEXT.writesLabel}
            </p>

            {written.map((line) => (
              <p key={line} className="mt-1.5 text-sm text-ink">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </InstrumentPanel>
  );
}
