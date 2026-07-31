import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import { PILE_LABELS, sourceOf, TEXT } from './data.en';
import { judge, percentageCorrect, scoreOf, wasLoggedTwice } from './logic';
import type { Pile } from './logic';

export interface LeakageSplitterProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Opens on the pile that flatters. A reader who lands on the held-back score
 * first has nothing to be disappointed by, and the sequence
 * perfect → still perfect → suddenly not is the whole experience.
 */
const DEFAULT_PILE: Pile = 'studied';

/**
 * Off, because dealing rows out one at a time is what everybody writes first
 * and what looks completely innocent. The reader turning it ON is the reader
 * fixing the split — and watching the score get worse for it.
 */
const DEFAULT_KEEP_TOGETHER = false;

/**
 * Teaches one thing: a score is only honest while nothing on the held-back
 * side is already sitting on the studied side.
 *
 * The switch is the instrument's reason for existing. Every other control here
 * could be replaced by a sentence; this one cannot, because the surprise is
 * that repairing the split makes the number go DOWN. Reading "leakage inflates
 * your score" is agreement. Watching 100% become 70% because you stopped a
 * round appearing on both sides is something else.
 *
 * No `StaticFallback`: nothing here needs hover or drag precision. The table is
 * wide, so it scrolls inside its own container rather than pushing the page
 * sideways on a phone.
 */
export function LeakageSplitter({ title, lead }: LeakageSplitterProps = {}) {
  const [pile, setPile] = useState<Pile>(DEFAULT_PILE);
  const [keepCopiesTogether, setKeepCopiesTogether] = useState(
    DEFAULT_KEEP_TOGETHER,
  );

  const copy = ui.interactives.LeakageSplitter;

  const verdicts = judge(pile, keepCopiesTogether);
  const score = scoreOf(verdicts);
  const percent = percentageCorrect(score);

  const reading =
    pile === 'studied'
      ? TEXT.readingStudied
      : score.fromTheSameRound > 0
        ? TEXT.readingLeaked(score.fromTheSameRound)
        : TEXT.readingHonest;

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setPile(DEFAULT_PILE);
        setKeepCopiesTogether(DEFAULT_KEEP_TOGETHER);
      }}
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl<Pile>
          label={TEXT.pileLabel}
          value={pile}
          onChange={setPile}
          options={[
            { value: 'studied', label: PILE_LABELS.studied },
            { value: 'held-back', label: PILE_LABELS['held-back'] },
          ]}
        />

        <Toggle
          label={TEXT.keepTogetherLabel}
          description={TEXT.keepTogetherDescription}
          checked={keepCopiesTogether}
          onChange={setKeepCopiesTogether}
        />

        {/*
          One press silently rewrites every row of a fourteen-row table, which
          a screen reader would never announce. The score and what it is worth
          are the things worth hearing, so this is the live region — not the
          table.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.scoreLine(score, percent)} {reading}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{TEXT.tableCaption}</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                {[
                  TEXT.columnRound,
                  TEXT.columnDistance,
                  TEXT.columnParcels,
                  TEXT.columnTruth,
                  TEXT.columnGuess,
                  TEXT.columnSource,
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-2 py-1.5 text-xs font-medium whitespace-nowrap text-ink"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {verdicts.map((verdict) => {
                const { record } = verdict;
                // Tinted only where the row also SAYS where its answer came
                // from, in the last cell. The tint is a second cue for a leak,
                // never the only one (hard rule 9).
                const leaked = verdict.matchKind === 'the-same-round';

                return (
                  <tr
                    key={record.id}
                    className={`border-b border-rule last:border-0 ${
                      leaked ? 'bg-warning-soft' : ''
                    }`}
                  >
                    <th
                      scope="row"
                      className="px-2 py-1.5 font-mono text-xs font-normal whitespace-nowrap text-ink"
                    >
                      {String(record.roundNumber)}
                      {wasLoggedTwice(record) ? (
                        <span className="block font-sans text-2xs text-ink-faint">
                          {TEXT.loggedTwice}
                        </span>
                      ) : null}
                    </th>

                    <td className="px-2 py-1.5 font-mono text-xs whitespace-nowrap text-ink-muted">
                      {TEXT.distance(record.distanceKm)}
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs whitespace-nowrap text-ink-muted">
                      {TEXT.parcels(record.parcels)}
                    </td>
                    <td className="px-2 py-1.5 text-xs whitespace-nowrap text-ink">
                      {TEXT.outcome(record.finishedLate)}
                    </td>

                    <td className="px-2 py-1.5 text-xs whitespace-nowrap text-ink">
                      {TEXT.outcome(verdict.guessedLate)}
                      {/*
                        Right and wrong are told apart by the word and by its
                        weight. No colour is doing this job.
                      */}
                      <span
                        className={`block font-mono text-2xs tracking-wide uppercase ${
                          verdict.correct
                            ? 'font-normal text-ink-faint'
                            : 'font-bold text-ink'
                        }`}
                      >
                        {TEXT.verdict(verdict.correct)}
                      </span>
                    </td>

                    <td className="px-2 py-1.5 text-xs whitespace-nowrap text-ink-muted">
                      {sourceOf(
                        verdict.matchKind,
                        verdict.copiedFrom.roundNumber,
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-2xs text-ink-faint">{TEXT.honesty}</p>
      </div>
    </InstrumentPanel>
  );
}
