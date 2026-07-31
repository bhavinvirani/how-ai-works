import { useId, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider, Stepper, Toggle } from '../../primitives';
import { TEXT, TILT_SENTENCES } from './data.en';
import {
  hasFoundTheLowest,
  LOWEST_POINT,
  lowestPoint,
  MAX_SETTING,
  MAX_STEPS,
  MIN_SETTING,
  SETTING_INCREMENT,
  tiltAt,
  walk,
  wrongnessAt,
} from './logic';

export interface FoggyDescentWalkProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Left of the ridge. Chosen so the first walk a reader takes lands in the
 * shallow hollow and stops there looking finished — which is the thing the fog
 * switch then has to spoil.
 */
const DEFAULT_START = 0.34;
const DEFAULT_STEPS = 0;
const DEFAULT_FOG_LIFTED = false;

// Plot geometry. Plain arithmetic rather than d3-scale, for the same reason as
// DialTuner: two linear maps do not justify an import.
const VIEW = { width: 340, height: 210 };
const PAD = { left: 30, right: 12, top: 30, bottom: 34 };
const DOMAIN = { minWrongness: 0.1, maxWrongness: 1.02 };

/**
 * The lit patch, sized so it still fits on the plot with the walker standing on
 * the highest ground there is. Both axis captions sit clear of it for the same
 * reason — a label the walker can park on top of is a label that will be
 * unreadable exactly when someone is looking at it.
 */
const PATCH = { rx: 16, ry: 20 };

/** The box the axes and the fog occupy. */
const AXES = {
  left: PAD.left,
  right: VIEW.width - PAD.right,
  top: PAD.top,
  bottom: VIEW.height - PAD.bottom,
};

/**
 * The terrain is inset from the axes by one patch radius, so that the lit patch
 * still lands inside the fog when the walk is standing on the highest ground at
 * either end of the dial. Without the inset it hangs off the corner.
 */
const PLOT = {
  left: AXES.left + PATCH.rx,
  right: AXES.right - PATCH.rx,
  top: AXES.top + PATCH.ry,
  bottom: AXES.bottom - PATCH.ry,
};

const toX = (setting: number) => PLOT.left + setting * (PLOT.right - PLOT.left);

const toY = (wrongness: number) =>
  PLOT.bottom -
  ((wrongness - DOMAIN.minWrongness) /
    (DOMAIN.maxWrongness - DOMAIN.minWrongness)) *
    (PLOT.bottom - PLOT.top);

/** Samples a stretch of terrain into an SVG path. */
const terrainPath = (from: number, to: number, samples = 80): string => {
  let path = '';

  for (let index = 0; index <= samples; index += 1) {
    const setting = from + ((to - from) * index) / samples;
    path += `${index === 0 ? 'M' : 'L'}${toX(setting).toFixed(1)} ${toY(wrongnessAt(setting)).toFixed(1)}`;
  }

  return path;
};

/** The terrain never changes, so the full curve is built once. */
const FULL_TERRAIN = terrainPath(MIN_SETTING, MAX_SETTING);

/** The shallower of the two hollows — the one the walk can get stuck in. */
const SHALLOW_POINT = lowestPoint(MIN_SETTING, 0.45);

/** How far either side of its feet the machine can feel the ground. */
const PATCH_REACH = 0.09;

/**
 * Teaches one thing: the machine never sees the landscape it is searching. It
 * reads the slope where it stands, steps downhill, and repeats — so where it
 * ends up is decided by where it happened to start.
 *
 * The fog switch is the instrument's reason for existing. Walking in fog looks
 * like success: the ground goes level, the walk stops, and the readout says a
 * number. Lifting the fog afterwards is what turns "it stopped" into "it
 * stopped in the wrong hollow, and could not have known".
 */
export function FoggyDescentWalk({ title, lead }: FoggyDescentWalkProps = {}) {
  const [start, setStart] = useState(DEFAULT_START);
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [fogLifted, setFogLifted] = useState(DEFAULT_FOG_LIFTED);

  // useId's output contains characters that are awkward inside url(#…), so it
  // is reduced to letters and digits before being used as a fragment target.
  const uniqueSuffix = useId().replace(/[^a-zA-Z0-9]/g, '');
  const fogPatternId = `fog-${uniqueSuffix}`;
  const patchClipId = `patch-${uniqueSuffix}`;

  const copy = ui.interactives.FoggyDescentWalk;

  const visited = walk(start, steps);
  const current = visited[visited.length - 1];
  const wrongness = wrongnessAt(current);
  const tilt = tiltAt(current);

  const currentX = toX(current);
  const currentY = toY(wrongness);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setStart(DEFAULT_START);
        setSteps(DEFAULT_STEPS);
        setFogLifted(DEFAULT_FOG_LIFTED);
      }}
    >
      <div className="flex flex-col gap-4">
        <svg
          viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
          className="w-full"
          role="img"
          aria-label={TEXT.chartTitle}
        >
          <defs>
            {/* Hatched rather than tinted, so the fog is a texture and not a
                colour — it has to survive hard rule 9 and a greyscale print. */}
            <pattern
              id={fogPatternId}
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="7"
                className="stroke-rule"
                strokeWidth="1.5"
              />
            </pattern>

            <clipPath id={patchClipId}>
              <ellipse
                cx={currentX}
                cy={currentY}
                rx={PATCH.rx}
                ry={PATCH.ry}
              />
            </clipPath>
          </defs>

          <g className="stroke-rule" strokeWidth="1">
            <line
              x1={AXES.left}
              y1={AXES.bottom}
              x2={AXES.right}
              y2={AXES.bottom}
            />
            <line
              x1={AXES.left}
              y1={AXES.top}
              x2={AXES.left}
              y2={AXES.bottom}
            />
          </g>

          {/* Both captions sit outside the axes box, which is the one region
              the lit patch can never reach. */}
          <g className="fill-ink-faint font-mono" fontSize="7">
            <text x={AXES.right} y={VIEW.height - 8} textAnchor="end">
              {TEXT.axisSetting}
            </text>
            <text x={AXES.right} y={AXES.top - 8} textAnchor="end">
              {TEXT.axisWrongness}
            </text>
          </g>

          {fogLifted ? (
            <>
              <path
                className="fill-none stroke-rule-strong"
                strokeWidth="1.75"
                d={FULL_TERRAIN}
              />

              {/* Both hollows are ringed AND named, so neither is told apart
                  by colour. */}
              <g className="fill-none stroke-accent-2" strokeWidth="1.5">
                <circle
                  cx={toX(SHALLOW_POINT.setting)}
                  cy={toY(SHALLOW_POINT.wrongness)}
                  r="5"
                />
                <circle
                  cx={toX(LOWEST_POINT.setting)}
                  cy={toY(LOWEST_POINT.wrongness)}
                  r="5"
                />
              </g>
              <g className="fill-ink-muted font-mono" fontSize="7">
                <text
                  x={toX(SHALLOW_POINT.setting)}
                  y={toY(SHALLOW_POINT.wrongness) + 16}
                  textAnchor="middle"
                >
                  {TEXT.shallowHollow}
                </text>
                <text
                  x={toX(LOWEST_POINT.setting)}
                  y={toY(LOWEST_POINT.wrongness) + 16}
                  textAnchor="middle"
                >
                  {TEXT.deepHollow}
                </text>
              </g>
            </>
          ) : (
            <>
              <rect
                x={AXES.left}
                y={AXES.top}
                width={AXES.right - AXES.left}
                height={AXES.bottom - AXES.top}
                className="fill-paper-sunken"
              />
              <rect
                x={AXES.left}
                y={AXES.top}
                width={AXES.right - AXES.left}
                height={AXES.bottom - AXES.top}
                fill={`url(#${fogPatternId})`}
              />

              {/* The one patch of ground it can feel. Everything outside this
                  ellipse is unknown to the machine, not merely unimportant. */}
              <ellipse
                cx={currentX}
                cy={currentY}
                rx={PATCH.rx}
                ry={PATCH.ry}
                className="fill-paper stroke-rule-strong"
                strokeWidth="1.25"
                strokeDasharray="3 3"
              />
              <path
                className="fill-none stroke-rule-strong"
                strokeWidth="1.75"
                clipPath={`url(#${patchClipId})`}
                d={terrainPath(
                  Math.max(MIN_SETTING, current - PATCH_REACH),
                  Math.min(MAX_SETTING, current + PATCH_REACH),
                  24,
                )}
              />
            </>
          )}

          {/* Ground it has already stood on. Under fog these dots are the only
              readings it has ever taken. */}
          <g className="fill-ink-faint">
            {visited.slice(0, -1).map((setting, index) => (
              <circle
                key={`visited-${String(index)}`}
                cx={toX(setting)}
                cy={toY(wrongnessAt(setting))}
                r="2"
              />
            ))}
          </g>

          <circle cx={currentX} cy={currentY} r="4.5" className="fill-accent" />
        </svg>

        <Slider
          label={TEXT.startLabel}
          description={TEXT.startDescription}
          value={start}
          onChange={setStart}
          min={MIN_SETTING}
          max={MAX_SETTING}
          step={SETTING_INCREMENT}
          format={(value) => value.toFixed(2)}
        />

        <Stepper
          label={TEXT.stepsLabel}
          value={steps}
          onChange={setSteps}
          min={0}
          max={MAX_STEPS}
        />

        <Toggle
          label={TEXT.fogLabel}
          description={TEXT.fogDescription}
          checked={fogLifted}
          onChange={setFogLifted}
        />

        {/* The plot changes silently for anyone not looking at it, so the
            sentence describing the ground underfoot is the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.standing(wrongness)} {TILT_SENTENCES[tilt]}{' '}
          {tilt === 'flat'
            ? hasFoundTheLowest(current)
              ? TEXT.arrived
              : TEXT.lowestElsewhere(LOWEST_POINT.wrongness)
            : ''}
        </p>
      </div>
    </InstrumentPanel>
  );
}
