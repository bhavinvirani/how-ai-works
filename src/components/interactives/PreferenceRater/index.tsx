import { useId, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel } from '../../primitives';
import {
  ANSWERS,
  AXIS_NAMES,
  AXIS_POLES,
  QUESTIONS,
  STRENGTHS,
  TEXT,
} from './data.en';
import {
  AXES,
  HELD_OUT,
  heldOutVerdict,
  judgeFrom,
  leanOf,
  ROUND_COUNT,
  ROUNDS,
  strengthOf,
  strongestAxis,
  tallyFor,
} from './logic';
import type { Side } from './logic';

export interface PreferenceRaterProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const SIDES: readonly Side[] = ['left', 'right'];

/**
 * Teaches one thing: a reader who could not write down what a good answer is
 * can still pick the better of two, and enough of those picks add up to a
 * number that will grade an answer nobody has ever looked at.
 *
 * NOTHING IS REPORTED BACK UNTIL THE TENTH PICK. That silence is the design.
 * Telling the reader what each pick "counted towards" would hand them the
 * ending — the point is that a preference they never described, and were never
 * asked about, is legible in the picks anyway. A rater sitting in front of the
 * real thing gets exactly this much feedback: none.
 *
 * The two answers are buttons rather than a `SegmentedControl` because the
 * answer IS the choice — a control listing "first" and "second" beside two
 * blocks of text adds a layer of indirection to the one action this instrument
 * exists for. Same reasoning as `shared/attention/SentenceChips`, and the same
 * requirements met: native buttons, real labels, keyboard operable, focus ring
 * from the global rule.
 */
export function PreferenceRater({ title, lead }: PreferenceRaterProps = {}) {
  const [picks, setPicks] = useState<Side[]>([]);
  const questionId = useId();

  const copy = ui.interactives.PreferenceRater;
  const done = picks.length;
  const round = ROUNDS.at(done);

  const judge = judgeFrom(picks);
  const loudest = strongestAxis(judge);
  const verdict = heldOutVerdict(judge);

  const readout =
    round !== undefined
      ? done === 0
        ? TEXT.nothingRecorded
        : TEXT.recorded(done, ROUND_COUNT)
      : loudest === null
        ? TEXT.emergedNothing
        : TEXT.emerged(
            leanOf(tallyFor(loudest, picks)).towards === 'more'
              ? AXIS_POLES[loudest].more
              : AXIS_POLES[loudest].less,
          );

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setPicks([]);
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {round === undefined ? (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-ink">
                  {TEXT.resultHeading}
                </p>
                <p className="text-xs text-ink-faint">{TEXT.resultLead}</p>
              </div>

              <ul className="flex list-none flex-col gap-2 p-0">
                {AXES.map((axis) => {
                  const tally = tallyFor(axis, picks);
                  const lean = leanOf(tally);
                  const weight = judge[axis];
                  const reach = Math.min(100, Math.abs(weight) * 100);

                  return (
                    <li
                      key={axis}
                      className="flex flex-col gap-1.5 rounded-md border border-rule bg-paper px-3 py-2"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <span className="text-sm text-ink">
                          {AXIS_NAMES[axis]}
                        </span>
                        <span className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                          {TEXT.axisCount(lean.count, tally.differed)} ·{' '}
                          {TEXT.weight(weight)}
                        </span>
                      </div>

                      {/* Decorative: the same weight is printed above it, and
                          the sentence below says which way it points. */}
                      <div
                        aria-hidden="true"
                        className="flex h-1.5 items-stretch rounded-full bg-paper-sunken"
                      >
                        <div className="flex flex-1 justify-end">
                          {weight < 0 ? (
                            <div
                              className="rounded-l-full bg-accent-2"
                              style={{ width: `${String(reach)}%` }}
                            />
                          ) : null}
                        </div>
                        <div className="w-px shrink-0 bg-rule-strong" />
                        <div className="flex flex-1">
                          {weight > 0 ? (
                            <div
                              className="rounded-r-full bg-accent-2"
                              style={{ width: `${String(reach)}%` }}
                            />
                          ) : null}
                        </div>
                      </div>

                      <p className="text-xs text-ink-faint">
                        {TEXT.axisSentence(
                          lean.towards === 'more'
                            ? AXIS_POLES[axis].more
                            : AXIS_POLES[axis].less,
                          lean.count,
                          tally.differed,
                        )}{' '}
                        {STRENGTHS[strengthOf(weight)]}
                      </p>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-2 border-t border-rule pt-4">
                <p className="text-sm font-medium text-ink">
                  {TEXT.heldOutHeading}
                </p>
                <p className="text-xs text-ink-faint">{TEXT.heldOutLead}</p>

                <p className="text-sm text-ink">
                  <span className="mr-2 font-mono text-2xs tracking-wide text-ink-faint uppercase">
                    {TEXT.askedLabel}
                  </span>
                  {QUESTIONS[HELD_OUT.id]}
                </p>

                <ul className="flex list-none flex-col gap-1.5 p-0">
                  {SIDES.map((side) => {
                    const answer =
                      side === 'left' ? HELD_OUT.left : HELD_OUT.right;
                    const score =
                      side === 'left' ? verdict.leftScore : verdict.rightScore;
                    const preferred = verdict.winnerId === answer.id;

                    return (
                      <li
                        key={answer.id}
                        className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-md border px-3 py-2 ${
                          preferred
                            ? 'border-accent-2/40 bg-accent-2-soft'
                            : 'border-rule bg-paper'
                        }`}
                      >
                        <span
                          className={
                            preferred
                              ? 'flex-1 text-sm text-ink'
                              : 'flex-1 text-sm text-ink-muted'
                          }
                        >
                          {ANSWERS[answer.id]}
                        </span>
                        <span className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                          {TEXT.scoreTag(score, preferred)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <p className="text-sm text-ink-muted">
                  {verdict.winnerId === null
                    ? TEXT.verdictLevel
                    : verdict.prefersTruth
                      ? TEXT.verdictTrue
                      : TEXT.verdictFalse}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p id={questionId} className="text-sm text-ink">
                  <span className="mr-2 font-mono text-2xs tracking-wide text-ink-faint uppercase">
                    {TEXT.askedLabel}
                  </span>
                  {QUESTIONS[round.id]}
                </p>
                <span className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
                  {TEXT.progress(done, ROUND_COUNT)}
                </span>
              </div>

              <p className="text-xs text-ink-faint">{TEXT.instruction}</p>

              <div className="grid gap-3 md:grid-cols-2">
                {SIDES.map((side) => {
                  const answer = side === 'left' ? round.left : round.right;

                  return (
                    <button
                      key={answer.id}
                      type="button"
                      aria-describedby={questionId}
                      onClick={() => {
                        setPicks((made) => [...made, side]);
                      }}
                      className="cursor-pointer rounded-md border border-rule-strong bg-paper px-3 py-2.5 text-left text-sm text-ink transition-colors duration-[var(--duration-fast)] ease-out-soft hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      {ANSWERS[answer.id]}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* One live region, in a fixed position so it survives the swap from
            rating to result: the panel changes completely and silently, and
            this sentence is what a screen reader should hear when it does. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {readout}
        </p>
      </div>
    </InstrumentPanel>
  );
}
