import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider } from '../../primitives';
import { formatCount, formatPercent, TEXT, VERDICTS } from './data.en';
import {
  accuracyAt,
  alarmsRaised,
  bestAccuracyReading,
  DEFAULT_EAGERNESS,
  EAGERNESS_STEP,
  ILL_TOTAL,
  MAX_EAGERNESS,
  MIN_EAGERNESS,
  readingAt,
  SCREENED_TOTAL,
} from './logic';

export interface ThresholdMatrixProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/** Which of the four boxes this is. Decides the tint, never the meaning. */
type CellKind = 'right' | 'mistake';

interface CellProps {
  count: number;
  /** What this box counts, in the reader's words. */
  noun: string;
  kind: CellKind;
}

/**
 * One box of the four. The word "right" or "mistake" is printed in every box,
 * so the tint is a second cue rather than the only one (hard rule 9).
 */
function Cell({ count, noun, kind }: CellProps) {
  return (
    <td
      className={`px-2 py-2 align-top ${
        kind === 'right' ? 'bg-success-soft' : 'bg-danger-soft'
      }`}
    >
      <span className="block font-mono text-base text-ink">
        {formatCount(count)}
      </span>
      <span className="block text-xs text-ink">{noun}</span>
      <span className="block font-mono text-2xs tracking-wide text-ink-muted uppercase">
        {kind === 'right' ? TEXT.right : TEXT.mistake}
      </span>
    </td>
  );
}

/**
 * Teaches one thing: when the answer you are hunting for is rare, one accuracy
 * number can be excellent and completely useless — so the two kinds of mistake
 * have to be counted separately.
 *
 * Starting at zero eagerness is the instrument's reason for existing. The
 * reader's first sight of it is a detector that raises no alarms, finds nobody,
 * and scores 99 per cent; every drag to the right after that trades one kind of
 * mistake for the other while the headline number falls. A reader who only ever
 * saw the middle of the dial would conclude accuracy is broadly fine.
 *
 * No `StaticFallback`: a range input is operable by touch and by keyboard, and
 * nothing here needs hover or drag precision. The table scrolls inside its own
 * container rather than pushing the page sideways on a phone.
 */
export function ThresholdMatrix({ title, lead }: ThresholdMatrixProps = {}) {
  const [eagerness, setEagerness] = useState(DEFAULT_EAGERNESS);

  const copy = ui.interactives.ThresholdMatrix;
  const reading = readingAt(eagerness);
  const { counts } = reading;
  const alarms = alarmsRaised(counts);
  const best = bestAccuracyReading();

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setEagerness(DEFAULT_EAGERNESS);
      }}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink-muted">
          {TEXT.setup(SCREENED_TOTAL, ILL_TOTAL)}
        </p>

        <Slider
          label={TEXT.eagernessLabel}
          description={TEXT.eagernessDescription}
          value={eagerness}
          onChange={setEagerness}
          min={MIN_EAGERNESS}
          max={MAX_EAGERNESS}
          step={EAGERNESS_STEP}
        />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{TEXT.tableCaption}</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th
                  scope="col"
                  className="px-2 py-1.5 text-xs font-medium text-ink"
                >
                  {TEXT.answerColumn}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1.5 text-xs font-medium text-ink"
                >
                  {TEXT.actuallyIll}
                </th>
                <th
                  scope="col"
                  className="px-2 py-1.5 text-xs font-medium text-ink"
                >
                  {TEXT.actuallyHealthy}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-rule">
                <th
                  scope="row"
                  className="px-2 py-2 align-top text-xs font-normal whitespace-nowrap text-ink-muted"
                >
                  {TEXT.saysAlarm}
                </th>
                <Cell count={counts.caught} noun={TEXT.caught} kind="right" />
                <Cell
                  count={counts.falseAlarms}
                  noun={TEXT.falseAlarms}
                  kind="mistake"
                />
              </tr>

              <tr>
                <th
                  scope="row"
                  className="px-2 py-2 align-top text-xs font-normal whitespace-nowrap text-ink-muted"
                >
                  {TEXT.saysQuiet}
                </th>
                <Cell count={counts.missed} noun={TEXT.missed} kind="mistake" />
                <Cell count={counts.cleared} noun={TEXT.cleared} kind="right" />
              </tr>
            </tbody>
          </table>
        </div>

        {/*
          Moving the dial silently rewrites four numbers in a table, which a
          screen reader would never announce. The sentences saying what kind of
          detector now exists are the thing worth hearing, so they are the live
          region — not the table.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.accuracySentence(formatPercent(reading.accuracy))}{' '}
          {TEXT.foundSentence(counts.caught, ILL_TOTAL)}{' '}
          {alarms === 0
            ? TEXT.noAlarms
            : TEXT.calledBack(alarms, counts.caught)}{' '}
          {VERDICTS[reading.verdict]}
        </p>

        {/* Two counted facts, fixed for the whole instrument. */}
        <p className="text-2xs text-ink-faint">
          {TEXT.baseline(formatPercent(accuracyAt(MIN_EAGERNESS)))}{' '}
          {TEXT.bestOnTheDial(
            formatPercent(best.accuracy),
            best.counts.caught,
            ILL_TOTAL,
          )}
        </p>
      </div>
    </InstrumentPanel>
  );
}
