import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import { STEP_LABELS, STEP_LINES, TEXT } from './data.en';
import {
  bestPossible,
  HOUSES,
  MAX_LOOPS,
  predict,
  residuals,
  STEP_KEYS,
  train,
} from './logic';
import type { Dials } from './logic';

export interface TrainingLoopRunnerProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/** How many passes one press of the counter runs. */
const PACES = { one: 1, some: 250, many: 5000 } as const;
type Pace = keyof typeof PACES;

const DEFAULT_PACE: Pace = 'one';
const DEFAULT_LOOPS = 0;

// Plot geometry. Plain arithmetic rather than d3-scale, for the same reason
// DialTuner gives: two linear maps do not justify an import.
const VIEW = { width: 320, height: 200 };
const PAD = { left: 38, right: 8, top: 12, bottom: 26 };
const DOMAIN = { minSize: 0, maxSize: 140, minPrice: 0, maxPrice: 400 };

const toX = (size: number) =>
  PAD.left +
  ((size - DOMAIN.minSize) / (DOMAIN.maxSize - DOMAIN.minSize)) *
    (VIEW.width - PAD.left - PAD.right);

const toY = (price: number) => {
  const held = Math.min(Math.max(price, DOMAIN.minPrice), DOMAIN.maxPrice);
  return (
    VIEW.height -
    PAD.bottom -
    ((held - DOMAIN.minPrice) / (DOMAIN.maxPrice - DOMAIN.minPrice)) *
      (VIEW.height - PAD.top - PAD.bottom)
  );
};

interface PlotPoint {
  size: number;
  price: number;
}

/**
 * Where the machine's line enters and leaves the plot.
 *
 * Needed because the line starts flat on the floor and swings up through the
 * data as the loop runs, so its ends will not stay inside the box. Trimming it
 * at the crossing point keeps the slope honest; clamping the y values instead
 * would quietly bend the line.
 */
function lineEnds(dials: Dials): readonly [PlotPoint, PlotPoint] | null {
  const trim = (size: number): PlotPoint | null => {
    const price = predict(dials, size);
    if (price >= DOMAIN.minPrice && price <= DOMAIN.maxPrice)
      return { size, price };

    if (dials.perSquareMetre === 0) return null;

    const edge = price < DOMAIN.minPrice ? DOMAIN.minPrice : DOMAIN.maxPrice;
    const crossing = (edge - dials.base) / dials.perSquareMetre;
    if (crossing < DOMAIN.minSize || crossing > DOMAIN.maxSize) return null;

    return { size: crossing, price: edge };
  };

  const start = trim(DOMAIN.minSize);
  const end = trim(DOMAIN.maxSize);
  if (start === null || end === null) return null;

  return [start, end];
}

/**
 * Teaches one thing: a single turn of the guess-compare-blame-nudge cycle is
 * so small it looks like nothing happened, and the same cycle repeated enough
 * times finds a setting as good as an exhaustive search can.
 *
 * The counter, not a play button, is the control on purpose. Running the loop
 * has to be something the reader does by hand at first — press it, watch
 * nothing move, press it again — because the futility of one pass is half the
 * lesson, and an animation that sweeps to the answer hides exactly that half.
 */
export function TrainingLoopRunner({
  title,
  lead,
}: TrainingLoopRunnerProps = {}) {
  const [pace, setPace] = useState<Pace>(DEFAULT_PACE);
  const [loops, setLoops] = useState<number>(DEFAULT_LOOPS);

  const copy = ui.interactives.TrainingLoopRunner;
  const run = train(loops);
  const best = bestPossible();
  const marks = residuals(run.dials);
  const ends = lineEnds(run.dials);
  // Held in a const so the narrowing below survives into the map callback.
  const last = run.last;

  // Generous on purpose: the reward is for seeing that accumulation works, not
  // for pressing the counter to its very last stop.
  const hasArrived = run.wrongness <= best.wrongness + 0.3;

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setPace(DEFAULT_PACE);
        setLoops(DEFAULT_LOOPS);
      }}
    >
      <div className="flex flex-col gap-4">
        <svg
          viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
          className="w-full"
          role="img"
          aria-label={TEXT.chartTitle}
        >
          <g className="stroke-rule" strokeWidth="1">
            <line
              x1={PAD.left}
              y1={toY(DOMAIN.minPrice)}
              x2={VIEW.width - PAD.right}
              y2={toY(DOMAIN.minPrice)}
            />
            <line
              x1={PAD.left}
              y1={PAD.top}
              x2={PAD.left}
              y2={toY(DOMAIN.minPrice)}
            />
          </g>

          <g className="fill-ink-faint font-mono" fontSize="7">
            <text
              x={VIEW.width - PAD.right}
              y={VIEW.height - 8}
              textAnchor="end"
            >
              {TEXT.axisSize}
            </text>
            <text x={PAD.left} y={PAD.top - 3}>
              {TEXT.axisPrice}
            </text>
          </g>

          {/* How wrong each guess still is, drawn as the gap it actually is. */}
          <g className="stroke-danger" strokeWidth="1.25" strokeDasharray="2 2">
            {marks.map(({ house, predicted }) => (
              <line
                key={`gap-${String(house.size)}`}
                x1={toX(house.size)}
                y1={toY(house.price)}
                x2={toX(house.size)}
                y2={toY(predicted)}
              />
            ))}
          </g>

          {ends ? (
            <line
              className="stroke-accent-2"
              strokeWidth="2"
              x1={toX(ends[0].size)}
              y1={toY(ends[0].price)}
              x2={toX(ends[1].size)}
              y2={toY(ends[1].price)}
            />
          ) : null}

          <g className="fill-accent">
            {HOUSES.map((house) => (
              <circle
                key={house.size}
                cx={toX(house.size)}
                cy={toY(house.price)}
                r="3.5"
              />
            ))}
          </g>
        </svg>

        <div className="rounded-md border border-rule bg-paper px-3 py-2">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.dialsHeading}
          </p>
          <dl className="mt-1.5 flex flex-col gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-sm text-ink-muted">{TEXT.dialOne}</dt>
              <dd className="rounded-sm bg-paper-sunken px-1.5 py-0.5 font-mono text-xs text-ink tabular-nums">
                {TEXT.dialValue(run.dials.perSquareMetre)}
              </dd>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-sm text-ink-muted">{TEXT.dialTwo}</dt>
              <dd className="rounded-sm bg-paper-sunken px-1.5 py-0.5 font-mono text-xs text-ink tabular-nums">
                {TEXT.dialValue(run.dials.base)}
              </dd>
            </div>
          </dl>
        </div>

        <SegmentedControl<Pace>
          label={TEXT.paceLabel}
          value={pace}
          onChange={setPace}
          options={[
            { value: 'one', label: TEXT.paceOne },
            { value: 'some', label: TEXT.paceSome },
            { value: 'many', label: TEXT.paceMany },
          ]}
        />

        <Stepper
          label={TEXT.loopsRun}
          value={loops}
          onChange={setLoops}
          min={0}
          max={MAX_LOOPS}
          step={PACES[pace]}
          format={TEXT.loopCount}
        />

        <div className="rounded-md border border-rule bg-paper px-3 py-2">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {last ? TEXT.stepsHeading(last.index) : TEXT.notStartedHeading}
          </p>

          {last ? (
            <ol className="mt-2 flex flex-col gap-2">
              {STEP_KEYS.map((key, position) => (
                <li key={key} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 font-mono text-2xs text-ink-faint tabular-nums"
                  >
                    {position + 1}
                  </span>
                  <span className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">
                      {STEP_LABELS[key]}
                    </span>{' '}
                    — {STEP_LINES[key](last)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">{TEXT.notStarted}</p>
          )}
        </div>

        {/*
          Pressing the counter silently rewrites the chart, both dials and four
          sentences at once. The one number the reader is here to watch is the
          wrongness, so that is the live region — not everything that moved.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.reading(run.loops, run.wrongness, run.wrongnessAtStart)}{' '}
          {last ? TEXT.lastLoop(run.wrongness - run.wrongnessBefore) : ''}{' '}
          {TEXT.best(best.wrongness)} {hasArrived ? TEXT.arrived : ''}
        </p>
      </div>
    </InstrumentPanel>
  );
}
