import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider, Stepper } from '../../primitives';
import { ProbabilityBars } from '../shared/nextpiece/ProbabilityBars';
import { BANDS, TEXT } from './data.en';
import {
  bandFor,
  DEFAULT_RUNS,
  DEFAULT_TEMPERATURE,
  distinctSentences,
  favouriteOf,
  longestReach,
  longShotOf,
  MAX_RUNS,
  MAX_TEMPERATURE,
  MIN_RUNS,
  MIN_TEMPERATURE,
  OPENING,
  openingRow,
  runsAt,
  TEMPERATURE_STEP,
} from './logic';

export interface TemperatureDialProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Teaches one thing: temperature changes the gaps between percentages the model
 * has already produced, and touches nothing else about them.
 *
 * The context never moves. That is the design decision the whole panel rests
 * on — with the sentence held still, the only thing that can be responsible for
 * a different row is the dial, and the reader can watch five bars stretch and
 * squash while their order stays exactly where it was. An instrument that also
 * let the sentence grow would be `NextPieceLoop`, and would prove nothing about
 * temperature.
 *
 * The runs underneath are the consequence made visible. At the bottom of the
 * dial four separate draws write one sentence, which is what "it has stopped
 * choosing" means; further up they diverge without a single number in the row
 * having been decided by anything but the same arithmetic.
 *
 * No `StaticFallback`: a range input and a pair of stepper buttons are operable
 * by tap and by keyboard, and nothing here needs hover or drag precision.
 */
export function TemperatureDial({ title, lead }: TemperatureDialProps = {}) {
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE);
  const [runCount, setRunCount] = useState(DEFAULT_RUNS);

  const copy = ui.interactives.TemperatureDial;

  const row = openingRow(temperature);
  const favourite = favouriteOf(row);
  const longShot = longShotOf(row);

  const runs = runsAt(temperature, runCount);
  const latest = runs[runs.length - 1];
  const reach = longestReach(runs);
  const distinct = distinctSentences(runs);

  const runsSentence =
    runs.length === 1
      ? TEXT.oneRun
      : distinct === 1
        ? TEXT.agree(runs.length)
        : TEXT.differ(distinct, runs.length);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setTemperature(DEFAULT_TEMPERATURE);
        setRunCount(DEFAULT_RUNS);
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-ink-faint">{TEXT.contextLead}</p>
          <p className="font-mono text-sm text-ink">{OPENING}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <ProbabilityBars
            row={row}
            chosen={latest.openerIndex}
            label={TEXT.rowLabel}
            describeRow={TEXT.describeRow}
            describeChosen={(name) => TEXT.describeChosen(name, latest.number)}
          />
          <p className="text-2xs text-ink-faint">{TEXT.rounding}</p>
        </div>

        <Slider
          label={TEXT.heatLabel}
          description={TEXT.heatDescription}
          value={temperature}
          onChange={setTemperature}
          min={MIN_TEMPERATURE}
          max={MAX_TEMPERATURE}
          step={TEMPERATURE_STEP}
          format={TEXT.heatValue}
        />

        <div className="flex flex-col gap-2 border-t border-rule pt-3">
          <Stepper
            label={TEXT.runsLabel}
            value={runCount}
            onChange={setRunCount}
            min={MIN_RUNS}
            max={MAX_RUNS}
            format={TEXT.runsValue}
          />

          <ol
            aria-label={TEXT.runsListLabel}
            className="flex flex-col gap-1 p-0"
          >
            {runs.map((run) => (
              <li key={run.number} className="flex items-baseline gap-2">
                <span className="w-9 shrink-0 font-mono text-2xs text-ink-faint">
                  {TEXT.runName(run.number)}
                </span>
                <span className="font-mono text-sm text-ink">
                  {TEXT.sentenceLine(run.sentence)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* The row and the sentences both change silently for anyone not
            looking at them, and between them they are the whole lesson. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.gaps(
            favourite.text,
            favourite.probability,
            longShot.text,
            longShot.probability,
          )}{' '}
          {BANDS[bandFor(temperature)]} {runsSentence}
          {reach
            ? ` ${TEXT.reached(reach.number, reach.opener, reach.openerShare)}`
            : null}
        </p>
      </div>
    </InstrumentPanel>
  );
}
