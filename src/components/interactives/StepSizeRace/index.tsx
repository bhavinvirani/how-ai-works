import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider, Stepper } from '../../primitives';
import { LANE_LABELS, TEXT, VERDICTS } from './data.en';
import {
  DEFAULT_STEP,
  FLOOR,
  leader,
  MAX_STEP,
  MAX_STEPS,
  race,
  yourRunner,
} from './logic';
import type { Runner } from './logic';

export interface StepSizeRaceProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

// Opens with the race already run. A reader who arrives at three motionless
// dots has to work out what the thing is before it shows them anything; a
// reader who arrives at a crawl, a near-miss and an endless bounce has already
// been shown the lesson and can step backwards to see how it happened.
const DEFAULT_STEPS = MAX_STEPS;

// Lane geometry. Plain arithmetic rather than d3-scale: two linear maps and one
// square do not justify an import in an island trying to stay small.
const LEFT = 8;
const RIGHT = 292;
const RIM_Y = 10;
const FLOOR_Y = 58;
const DEPTH = FLOOR_Y - RIM_Y;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const toX = (position: number) => LEFT + clamp01(position) * (RIGHT - LEFT);

const toY = (position: number) => {
  const offset = clamp01(position) - FLOOR;
  return FLOOR_Y - 4 * DEPTH * offset * offset;
};

/**
 * Teaches one thing: the machine works out which way is downhill for free, but
 * how far to step is a number a person chooses — and it fails in two opposite
 * directions, with no value that is safe in both.
 *
 * Three runners rather than one, because a single walker only ever shows the
 * reader the setting they are currently on. Racing their choice against a
 * runner that is far too cautious and one that is far too bold puts both
 * failures on screen at once, and makes the middle band feel as narrow as it
 * actually is.
 */
export function StepSizeRace({ title, lead }: StepSizeRaceProps = {}) {
  const [stepSize, setStepSize] = useState(DEFAULT_STEP);
  const [steps, setSteps] = useState(DEFAULT_STEPS);

  const copy = ui.interactives.StepSizeRace;
  const runners = race(stepSize, steps);
  const yours = yourRunner(runners);
  const ahead = leader(runners);

  const standing =
    yours.behaviour === 'waiting'
      ? TEXT.standingWaiting
      : yours.behaviour === 'diverging'
        ? TEXT.standingWorse
        : TEXT.standing(yours.remaining);

  const placing =
    steps === 0
      ? ''
      : ahead === null
        ? TEXT.nobodyLeft
        : TEXT.ahead(LANE_LABELS[ahead.id]);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setStepSize(DEFAULT_STEP);
        setSteps(DEFAULT_STEPS);
      }}
    >
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col gap-4">
          {runners.map((runner) => (
            <li key={runner.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium text-ink">
                  {LANE_LABELS[runner.id]}
                </span>
                <span className="font-mono text-2xs tracking-wide text-ink-muted uppercase">
                  {TEXT.stepSizeValue(runner.stepSize)}
                </span>
              </div>

              <Lane runner={runner} />

              <p className="text-xs text-ink-muted">
                {VERDICTS[runner.behaviour]}
              </p>
            </li>
          ))}
        </ul>

        <Slider
          label={TEXT.stepSizeLabel}
          description={TEXT.stepSizeDescription}
          value={stepSize}
          onChange={setStepSize}
          min={0.01}
          max={MAX_STEP}
          step={0.01}
          format={(value) => value.toFixed(2)}
        />

        <Stepper
          label={TEXT.stepsLabel}
          value={steps}
          onChange={setSteps}
          min={0}
          max={MAX_STEPS}
        />

        {/* Changing one control silently redraws three pictures. The one thing
            worth hearing is where the reader's own runner has got to, so that
            is the live region rather than the lanes. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {standing} {placing}
        </p>
      </div>
    </InstrumentPanel>
  );
}

/**
 * One runner's hill.
 *
 * `aria-hidden` on purpose: the lane's label sits above it and its verdict
 * sentence sits below it, and between them they say everything the drawing
 * says. A `role="img"` here would announce a third, vaguer version of the same
 * thing. Nothing in the picture is carried by colour alone for the same reason.
 */
function Lane({ runner }: { runner: Runner }) {
  const onHill = runner.trail.filter((footprint) => !footprint.offHill);
  const escaped = runner.trail.find((footprint) => footprint.offHill) ?? null;
  const last = onHill[onHill.length - 1];

  const isYours = runner.id === 'yours';
  const trailStroke = isYours ? 'stroke-accent' : 'stroke-ink-muted';
  const dotFill = isYours ? 'fill-accent' : 'fill-ink-muted';

  const escapeTipX = escaped !== null && escaped.position > 1 ? 297 : 3;
  const escapeDirection = escaped !== null && escaped.position > 1 ? 1 : -1;

  return (
    <svg viewBox="0 0 300 70" className="w-full" aria-hidden="true">
      {/* The hill. An exact parabola in one quadratic curve. */}
      <path
        d={`M ${String(LEFT)} ${String(RIM_Y)} Q ${String((LEFT + RIGHT) / 2)} ${String(2 * FLOOR_Y - RIM_Y)} ${String(RIGHT)} ${String(RIM_Y)}`}
        className="fill-none stroke-rule"
        strokeWidth="1.5"
      />

      {/* Where the runner is trying to get to. */}
      <line
        x1={toX(FLOOR)}
        y1={FLOOR_Y}
        x2={toX(FLOOR)}
        y2={FLOOR_Y + 8}
        className="stroke-rule-strong"
        strokeWidth="1"
        strokeDasharray="2 2"
      />

      <polyline
        points={onHill
          .map(
            (footprint) =>
              `${String(toX(footprint.position))},${String(toY(footprint.position))}`,
          )
          .join(' ')}
        className={`fill-none ${trailStroke}`}
        strokeWidth="1.25"
      />

      {onHill.map((footprint, index) => (
        <circle
          key={`${runner.id}-${String(index)}`}
          cx={toX(footprint.position)}
          cy={toY(footprint.position)}
          r={index === onHill.length - 1 && escaped === null ? 3.2 : 1.6}
          className={dotFill}
        />
      ))}

      {escaped === null ? null : (
        <g>
          <path
            d={`M ${String(toX(last.position))} ${String(toY(last.position))} L ${String(escapeTipX)} 8`}
            className="fill-none stroke-danger"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <polygon
            points={`${String(escapeTipX)},2 ${String(escapeTipX - escapeDirection * 8)},6 ${String(escapeTipX - escapeDirection * 5)},12`}
            className="fill-danger"
          />
        </g>
      )}
    </svg>
  );
}
