import { useState } from 'react';

import { ui } from '../../../copy/en';
import {
  InstrumentPanel,
  RevealButton,
  SegmentedControl,
} from '../../primitives';
import { DIAL_NAMES, RIDE_NAMES, TEXT } from './data.en';
import {
  backward,
  biggestShare,
  DIALS,
  forward,
  missBy,
  RIDE_IDS,
  RIDES,
} from './logic';
import type { DialId, RideId } from './logic';

export interface BlameFlowProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/** The ride the machine gets most badly wrong, so the first look is the loud one. */
const DEFAULT_RIDE: RideId = 'flat-eight';

const RIDE_OPTIONS = RIDE_IDS.map((id) => ({
  value: id,
  label: RIDE_NAMES[id],
}));

// Machine geometry. Plain literals rather than a layout pass: five nodes do not
// justify one, and the numbers below were chosen so that no label sits on a line.
const VIEW = { width: 360, height: 210 };

const NODE = {
  distance: { x: 42, y: 58, r: 18 },
  hills: { x: 42, y: 150, r: 18 },
  middleA: { x: 180, y: 58, r: 18 },
  middleB: { x: 180, y: 150, r: 18 },
  guess: { x: 316, y: 104, r: 20 },
} as const;

const NODE_NAMES = [
  'distance',
  'hills',
  'middleA',
  'middleB',
  'guess',
] as const;

type NodeName = (typeof NODE_NAMES)[number];

interface LinkSpec {
  id: DialId;
  from: NodeName;
  to: NodeName;
  /** Where this dial's current setting is written, kept clear of every line. */
  labelX: number;
  labelY: number;
}

const LINKS: readonly LinkSpec[] = [
  {
    id: 'distance-to-a',
    from: 'distance',
    to: 'middleA',
    labelX: 110,
    labelY: 50,
  },
  {
    id: 'distance-to-b',
    from: 'distance',
    to: 'middleB',
    labelX: 72,
    labelY: 94,
  },
  { id: 'hills-to-a', from: 'hills', to: 'middleA', labelX: 72, labelY: 118 },
  { id: 'hills-to-b', from: 'hills', to: 'middleB', labelX: 110, labelY: 164 },
  {
    id: 'a-to-answer',
    from: 'middleA',
    to: 'guess',
    labelX: 250,
    labelY: 74,
  },
  {
    id: 'b-to-answer',
    from: 'middleB',
    to: 'guess',
    labelX: 250,
    labelY: 138,
  },
];

/**
 * Teaches one thing: after a wrong answer every dial is told to move, and how
 * far it is told to move is worked out from how much it moved the answer —
 * not assigned, not shared out evenly, and not fixed in advance.
 *
 * The three rides are the instrument's reason for existing. One dial and one
 * bar chart would only show that dials get numbers. Switching rides shows the
 * SAME six dials handed a different ranking each time, including a first-layer
 * dial overtaking an output dial on the steep route — which is the difference
 * between "blame is computed" and "blame is a property of position".
 *
 * The reveal is re-armed whenever the ride changes, on purpose: the lead asks
 * the reader to guess first, and a panel that stayed open would answer the next
 * question before it had been asked.
 */
export function BlameFlow({ title, lead }: BlameFlowProps = {}) {
  const [rideId, setRideId] = useState<RideId>(DEFAULT_RIDE);
  const [round, setRound] = useState(0);

  const copy = ui.interactives.BlameFlow;

  const ride = RIDES[rideId];
  const run = forward(ride);
  const wrongBy = missBy(ride);
  const top = biggestShare(ride);
  const shares = [...backward(ride)].sort(
    (left, right) => Math.abs(right.blame) - Math.abs(left.blame),
  );

  const values: Record<NodeName, number> = {
    distance: ride.distance,
    hills: ride.hills,
    middleA: run.middleA,
    middleB: run.middleB,
    guess: run.answer,
  };

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setRideId(DEFAULT_RIDE);
        setRound((previous) => previous + 1);
      }}
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label={TEXT.rideLabel}
          options={RIDE_OPTIONS}
          value={rideId}
          onChange={(next) => {
            setRideId(next);
            setRound((previous) => previous + 1);
          }}
        />

        <svg
          viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
          className="w-full"
          role="img"
          aria-label={TEXT.machineTitle}
        >
          <g className="stroke-rule-strong" strokeWidth="1.25">
            {LINKS.map((link) => (
              <line
                key={`link-${link.id}`}
                x1={NODE[link.from].x}
                y1={NODE[link.from].y}
                x2={NODE[link.to].x}
                y2={NODE[link.to].y}
              />
            ))}
          </g>

          {/* Each dial's current setting, written on the link it belongs to. */}
          <g className="fill-ink-muted font-mono" fontSize="9">
            {LINKS.map((link) => (
              <text
                key={`setting-${link.id}`}
                x={link.labelX}
                y={link.labelY}
                textAnchor="middle"
              >
                {DIALS[link.id]}
              </text>
            ))}
          </g>

          {/* The guess is the larger circle and the only one with a heavier
              outline — size and label, never colour alone (hard rule 9). */}
          <g
            className="fill-paper-sunken stroke-rule-strong"
            strokeWidth="1.25"
          >
            <circle
              cx={NODE.distance.x}
              cy={NODE.distance.y}
              r={NODE.distance.r}
            />
            <circle cx={NODE.hills.x} cy={NODE.hills.y} r={NODE.hills.r} />
            <circle
              cx={NODE.middleA.x}
              cy={NODE.middleA.y}
              r={NODE.middleA.r}
            />
            <circle
              cx={NODE.middleB.x}
              cy={NODE.middleB.y}
              r={NODE.middleB.r}
            />
          </g>

          <circle
            cx={NODE.guess.x}
            cy={NODE.guess.y}
            r={NODE.guess.r}
            className="fill-accent-soft stroke-accent"
            strokeWidth="2"
          />

          <g className="fill-ink font-mono" fontSize="12">
            {NODE_NAMES.map((name) => (
              <text
                key={`value-${name}`}
                x={NODE[name].x}
                y={NODE[name].y + 4}
                textAnchor="middle"
              >
                {values[name]}
              </text>
            ))}
          </g>

          <g className="fill-ink-faint" fontSize="9">
            <text x={NODE.distance.x} y={26} textAnchor="middle">
              {TEXT.nodeDistance}
            </text>
            <text x={NODE.hills.x} y={190} textAnchor="middle">
              {TEXT.nodeHills}
            </text>
            <text x={NODE.middleA.x} y={26} textAnchor="middle">
              {TEXT.nodeMiddleA}
            </text>
            <text x={NODE.middleB.x} y={190} textAnchor="middle">
              {TEXT.nodeMiddleB}
            </text>
            <text x={NODE.guess.x} y={72} textAnchor="middle">
              {TEXT.nodeGuess}
            </text>
          </g>

          <text
            x={NODE.guess.x}
            y={148}
            textAnchor="middle"
            className="fill-accent font-mono"
            fontSize="9"
          >
            {TEXT.missTag(wrongBy)}
          </text>
        </svg>

        {/* The picture changes silently for anyone not looking at it, and the
            miss is the number every share is built from, so it is the live
            region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.situation(run.answer, ride.tookMinutes, wrongBy)}{' '}
          {TEXT.invitation}
        </p>

        <RevealButton key={round}>
          <div className="flex flex-col gap-3">
            <p aria-live="polite" className="text-sm text-ink">
              {TEXT.biggest(DIAL_NAMES[top.id], TEXT.percent(top.share))}{' '}
              {TEXT.allTheSameWay(wrongBy)}
            </p>

            <p className="text-xs text-ink-faint">{TEXT.workingOutKey}</p>

            <ul className="flex flex-col gap-2.5">
              {shares.map((share) => (
                <li key={share.id} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-ink">
                      {DIAL_NAMES[share.id]}
                    </span>
                    <span className="font-mono text-xs text-ink tabular-nums">
                      {TEXT.percent(share.share)}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-paper-sunken">
                    <div
                      className="h-2 rounded-full bg-accent"
                      style={{ width: `${(share.share * 100).toFixed(1)}%` }}
                    />
                  </div>

                  <p className="font-mono text-2xs text-ink-faint tabular-nums">
                    {TEXT.workingOut(
                      share.movesAnswerBy,
                      Math.abs(wrongBy),
                      Math.abs(share.blame),
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </RevealButton>
      </div>
    </InstrumentPanel>
  );
}
