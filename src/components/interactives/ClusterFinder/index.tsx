import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import { SPEND_TICKS, START_LABELS, TEXT, VISIT_TICKS } from './data.en';
import {
  DEFAULT_GROUPS,
  DEFAULT_START,
  findGroups,
  groupNumberOf,
  MAX_GROUPS,
  MAX_SPEND,
  MAX_VISITS,
  MIN_GROUPS,
  SHOPPERS,
  shoppersWhoMoved,
  START_IDS,
} from './logic';
import type { StartId } from './logic';

export interface ClusterFinderProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

// Chart geometry. Plain arithmetic rather than d3-scale: two linear maps do not
// justify an import in an island trying to stay small.
const VIEW = { width: 320, height: 210 };
const PAD = { left: 30, right: 10, top: 12, bottom: 24 };

const toX = (visits: number) =>
  PAD.left + (visits / MAX_VISITS) * (VIEW.width - PAD.left - PAD.right);

const toY = (spend: number) =>
  VIEW.height -
  PAD.bottom -
  (spend / MAX_SPEND) * (VIEW.height - PAD.top - PAD.bottom);

/**
 * Teaches one thing: with no answer column, a machine can still gather together
 * the rows that resemble each other — but the groups are its invention, and
 * neither how many there are nor what they mean comes out of the data.
 *
 * Two controls, because one would not do it. The group count alone lets a reader
 * watch the machine's own score improve forever, which is half the argument; the
 * starting guess is the other half, and it is the one that surprises people —
 * same data, same instruction, different answer.
 */
export function ClusterFinder({ title, lead }: ClusterFinderProps = {}) {
  const [howMany, setHowMany] = useState(DEFAULT_GROUPS);
  const [start, setStart] = useState<StartId>(DEFAULT_START);

  const copy = ui.interactives.ClusterFinder;
  const grouping = findGroups(howMany, start);
  const firstGuess = findGroups(howMany, DEFAULT_START);
  const moved = shoppersWhoMoved(firstGuess, grouping);

  const movement =
    start === DEFAULT_START
      ? TEXT.firstGuess
      : moved.length === 0
        ? TEXT.movedNone
        : TEXT.moved(moved.length, SHOPPERS.length);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setHowMany(DEFAULT_GROUPS);
        setStart(DEFAULT_START);
      }}
    >
      <div className="flex flex-col gap-5">
        {/*
          `aria-hidden` on purpose: the list below names every group, says how
          many shoppers are in it and where its middle sits, which is everything
          the chart carries. A `role="img"` here would announce a third, vaguer
          version of the same thing. Group membership is drawn as a shape and
          spelled out in words, so nothing depends on seeing colour either.
        */}
        <svg
          viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
          className="w-full"
          aria-hidden="true"
        >
          <g className="stroke-rule" strokeWidth="1">
            <line
              x1={PAD.left}
              y1={toY(0)}
              x2={VIEW.width - PAD.right}
              y2={toY(0)}
            />
            <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={toY(0)} />
          </g>

          <g className="fill-ink-faint font-mono" fontSize="7">
            {VISIT_TICKS.map((tick) => (
              <text
                key={tick.label}
                x={toX(tick.at)}
                y={toY(0) + 10}
                textAnchor="middle"
              >
                {tick.label}
              </text>
            ))}
            {SPEND_TICKS.map((tick) => (
              <text key={tick.label} x={2} y={toY(tick.at) + 2}>
                {tick.label}
              </text>
            ))}
            <text
              x={VIEW.width - PAD.right}
              y={VIEW.height - 4}
              textAnchor="end"
            >
              {TEXT.axisVisits}
            </text>
            <text x={PAD.left} y={PAD.top - 4}>
              {TEXT.axisSpend}
            </text>
          </g>

          {SHOPPERS.map((shopper) => (
            <Marker
              key={shopper.id}
              group={groupNumberOf(grouping, shopper.id)}
              x={toX(shopper.visits)}
              y={toY(shopper.spend)}
              size={3}
              className="fill-ink-muted"
            />
          ))}

          {/* The middles the machine settled on, numbered where they sit. */}
          {grouping.groups.map((group) => (
            <g key={group.number}>
              <Marker
                group={group.number}
                x={toX(group.centre.visits)}
                y={toY(group.centre.spend)}
                size={6}
                className="fill-paper-raised stroke-accent"
                strokeWidth={1.5}
              />
              <text
                x={toX(group.centre.visits) + 9}
                y={toY(group.centre.spend) + 3}
                className="fill-accent font-mono"
                fontSize="9"
              >
                {group.number}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
            {TEXT.groupsHeading}
          </p>
          <ul className="flex flex-col gap-1">
            {grouping.groups.map((group) => (
              <li key={group.number} className="flex items-center gap-2">
                <svg
                  viewBox="0 0 14 14"
                  className="h-3.5 w-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <Marker
                    group={group.number}
                    x={7}
                    y={7}
                    size={4.5}
                    className="fill-ink-muted"
                  />
                </svg>
                <span className="text-sm text-ink-muted">
                  {TEXT.groupLine(
                    group.number,
                    group.memberIds.length,
                    group.centre.visits,
                    group.centre.spend,
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <Stepper
          label={TEXT.groupsLabel}
          value={howMany}
          onChange={setHowMany}
          min={MIN_GROUPS}
          max={MAX_GROUPS}
        />

        <SegmentedControl<StartId>
          label={TEXT.startLabel}
          value={start}
          onChange={setStart}
          options={START_IDS.map((id) => ({
            value: id,
            label: START_LABELS[id],
          }))}
        />

        {/* One press silently redraws forty-two markers and rewrites the list.
            What is worth hearing is the score and whether anybody moved, so that
            is the live region rather than the chart. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.spread(grouping.spread)} {movement}
        </p>

        <p className="text-sm text-ink-faint">{TEXT.noNames}</p>
      </div>
    </InstrumentPanel>
  );
}

interface MarkerProps {
  /** 1-based group number; decides the shape. */
  group: number;
  x: number;
  y: number;
  size: number;
  className: string;
  strokeWidth?: number;
}

/**
 * One point, shaped by which group it is in.
 *
 * Shape rather than colour, because six categories is more hues than the palette
 * has and meaning must never ride on colour anyway (hard rule 9). The same shape
 * appears beside the group's line in the list, so the mapping is stated in words
 * as well as drawn.
 */
function Marker({ group, x, y, size, className, strokeWidth }: MarkerProps) {
  const shared = { className, strokeWidth };
  const tall = size * 1.2;
  const arm = size / 3;

  switch ((group - 1) % 6) {
    case 0:
      return <circle cx={x} cy={y} r={size} {...shared} />;
    case 1:
      return (
        <rect
          x={x - size}
          y={y - size}
          width={size * 2}
          height={size * 2}
          {...shared}
        />
      );
    case 2:
      return (
        <polygon
          points={`${String(x)},${String(y - tall)} ${String(x + tall)},${String(y + size * 0.8)} ${String(x - tall)},${String(y + size * 0.8)}`}
          {...shared}
        />
      );
    case 3:
      return (
        <polygon
          points={`${String(x)},${String(y - tall)} ${String(x + tall)},${String(y)} ${String(x)},${String(y + tall)} ${String(x - tall)},${String(y)}`}
          {...shared}
        />
      );
    case 4:
      return (
        <polygon
          points={`${String(x)},${String(y + tall)} ${String(x + tall)},${String(y - size * 0.8)} ${String(x - tall)},${String(y - size * 0.8)}`}
          {...shared}
        />
      );
    default:
      return (
        <path
          d={`M ${String(x - size)} ${String(y - arm)} H ${String(x - arm)} V ${String(y - size)} H ${String(x + arm)} V ${String(y - arm)} H ${String(x + size)} V ${String(y + arm)} H ${String(x + arm)} V ${String(y + size)} H ${String(x - arm)} V ${String(y + arm)} H ${String(x - size)} Z`}
          {...shared}
        />
      );
  }
}
