import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import {
  CHANGE_WORDS,
  INSTRUCTIONS,
  MESSAGES,
  QUEUE_NAMES,
  TEXT,
  VERDICT_MARKS,
  VERDICT_WORDS,
  VERSION_LABELS,
} from './data.en';
import type { Verdict, VersionId } from './logic';
import {
  answerFor,
  BASELINE_VERSION,
  casesShown,
  changeFor,
  EXPECTED,
  tallyFor,
  VERSION_IDS,
  verdictFor,
} from './logic';

export interface EvalScoreboardProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * The instruction already running, checked against the one message somebody
 * complained about. Opening on the full set would hand over the ending: the
 * reader has to spend a moment in the position of having only the reported
 * case for the reveal to be a reveal.
 */
const DEFAULT_VERSION: VersionId = BASELINE_VERSION;
const DEFAULT_ONLY_REPORTED = true;

/**
 * Tone per verdict. The word underneath says the same thing, so nothing here
 * is the sole carrier of meaning (hard rule 9).
 */
const ROW: Record<Verdict, string> = {
  pass: 'border-success/40 bg-success-soft',
  fail: 'border-danger/40 bg-danger-soft',
};

/**
 * Teaches one thing: a change checked against the case it was reported for has
 * not been checked, and only a fixed set of cases can say what else it moved.
 *
 * The toggle is the instrument's reason for existing. Left on, every version
 * of the instruction that fixes the reported message scores one out of one and
 * looks finished — which is exactly the position a team is in when nobody
 * wrote a set of cases down. Turning it off is what converts a claim in the
 * prose into something the reader watched happen to their own change.
 *
 * The four versions are a segmented control rather than a text box on purpose.
 * A reader free to type their own instruction could explain any result by
 * having asked for something different; four fixed versions mean the only
 * thing that varies between two scoreboards is the wording somebody chose,
 * which is the variable the unit is about.
 *
 * No fallback is passed to the panel: every control here is a radio or a
 * switch and nothing depends on hover or drag precision, so the small-screen
 * version is the same instrument, only narrower.
 *
 * Nothing animates beyond the toggle knob, whose transition is already
 * token-driven, so `prefers-reduced-motion` has nothing to slow down.
 */
export function EvalScoreboard({ title, lead }: EvalScoreboardProps = {}) {
  const [version, setVersion] = useState<VersionId>(DEFAULT_VERSION);
  const [onlyReported, setOnlyReported] = useState(DEFAULT_ONLY_REPORTED);

  const copy = ui.interactives.EvalScoreboard;
  const rows = casesShown(onlyReported);
  const tally = tallyFor(version, onlyReported);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setVersion(DEFAULT_VERSION);
        setOnlyReported(DEFAULT_ONLY_REPORTED);
      }}
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl<VersionId>
          label={TEXT.versionLabel}
          value={version}
          onChange={setVersion}
          options={VERSION_IDS.map((id) => ({
            value: id,
            label: VERSION_LABELS[id],
          }))}
        />

        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.instructionHeading}
          </p>

          {/* Each line the reader is shown is a line somebody wrote into the
              instruction, kept apart so that "a patch is an added sentence" is
              carried by the layout rather than only by the prose. */}
          <div className="flex flex-col gap-1.5 rounded-md border border-rule-strong bg-paper-sunken px-3 py-2.5">
            {INSTRUCTIONS[version].map((line) => (
              <p key={line} className="font-mono text-2xs leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>

        <Toggle
          label={TEXT.onlyReportedLabel}
          description={TEXT.onlyReportedDescription}
          checked={onlyReported}
          onChange={setOnlyReported}
        />

        <div className="flex flex-col gap-2">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.setHeading}
          </p>

          <ul className="flex flex-col gap-2">
            {rows.map((id) => {
              const verdict = verdictFor(version, id);
              const change = changeFor(version, id);

              return (
                <li
                  key={id}
                  className={`flex flex-col gap-1.5 rounded-md border px-3 py-2 ${ROW[verdict]}`}
                >
                  <p className="text-sm text-ink">{MESSAGES[id]}</p>

                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-2xs text-ink-muted">
                    <span>
                      {TEXT.expectedLabel}{' '}
                      <span className="text-ink">
                        {QUEUE_NAMES[EXPECTED[id]]}
                      </span>
                    </span>

                    <span>
                      {TEXT.gotLabel}{' '}
                      <span className="text-ink">
                        {QUEUE_NAMES[answerFor(version, id)]}
                      </span>
                    </span>

                    <span className="font-semibold text-ink">
                      <span aria-hidden="true">{VERDICT_MARKS[verdict]} </span>
                      {VERDICT_WORDS[verdict]}
                    </span>

                    {change === 'unchanged' ? null : (
                      <span className="rounded-sm border border-rule-strong px-1.5 py-0.5 text-ink">
                        {CHANGE_WORDS[change]}
                      </span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-ink-faint">{TEXT.queuesNote}</p>
        </div>

        {/* Switching version rewrites the instruction, every row and the score
            at once, and none of it is announced. The score and what moved are
            the whole lesson, so they are the live region — not the rows, which
            would be read out in full on every press. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.score(tally)}
        </p>
      </div>
    </InstrumentPanel>
  );
}
