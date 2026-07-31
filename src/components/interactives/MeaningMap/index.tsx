import { useState } from 'react';

import { ui } from '../../../copy/en';
import {
  InstrumentPanel,
  SegmentedControl,
  Slider,
  StaticFallback,
} from '../../primitives';
import type { SegmentedOption } from '../../primitives';
import { ARROWS, START_WORD_IDS, TEXT, WORDS } from './data.en';
import type { ArrowId } from './data.en';
import {
  arrowById,
  DEFAULT_ARROW,
  DEFAULT_PLACE,
  landingFor,
  MAP_MAX,
  MAP_MIN,
  nearestWords,
  wordById,
  wordExactlyAt,
} from './logic';
import type { Landing, Place } from './logic';

export interface MeaningMapProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

// Map geometry. Plain arithmetic rather than d3-scale, for the same reason as
// FlexibilityDial: two linear maps do not justify an import. The plot is kept
// square on purpose — this is the one instrument where a stretched axis would
// be a lie, because the whole lesson is that distance means something.
const VIEW = { width: 360, height: 300 };
const PLOT = { left: 42, top: 10, size: 280 };
const UNIT = PLOT.size / MAP_MAX;

const toX = (x: number) => PLOT.left + x * UNIT;
const toY = (y: number) => PLOT.top + PLOT.size - y * UNIT;

/** How many neighbours the readout names. Three is a list; six is a table. */
const NEIGHBOURS = 3;

/**
 * Teaches two things, and the second is the one that earns the screen space.
 *
 * One: every word here is a pair of numbers, and how far apart two words sit is
 * how alike they are. Two: the *directions* mean something as well. Measure the
 * step from one word to its counterpart, lay that same step down at a word on
 * the other side of the map, and it arrives at that word's counterpart — which
 * nobody put there and nobody checked.
 *
 * Nothing animates, so there is nothing for `prefers-reduced-motion` to slow
 * down: every control produces an instant redraw.
 */
export function MeaningMap({ title, lead }: MeaningMapProps = {}) {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [arrow, setArrow] = useState<ArrowId>(DEFAULT_ARROW);

  const copy = ui.interactives.MeaningMap;

  const standingOn = wordExactlyAt(place);
  const neighbours = nearestWords(place, NEIGHBOURS, standingOn?.id);
  const chosenArrow = arrowById(arrow);
  const landing = chosenArrow ? landingFor(place, arrow) : undefined;

  const startOptions = START_WORD_IDS.flatMap((id) => {
    const word = wordById(id);
    return word ? [{ value: word.id, label: word.word }] : [];
  });

  const arrowOptions: SegmentedOption<ArrowId>[] = [
    { value: 'none', label: TEXT.arrowNone },
    ...ARROWS.map((option) => ({ value: option.id, label: option.label })),
  ];

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setPlace(DEFAULT_PLACE);
        setArrow(DEFAULT_ARROW);
      }}
      fallback={
        <StaticFallback caption={TEXT.fallbackCaption}>
          <MapPicture
            place={DEFAULT_PLACE}
            arrow="man-woman"
            neighbours={[]}
            landing={landingFor(DEFAULT_PLACE, 'man-woman')}
          />
        </StaticFallback>
      }
    >
      <div className="flex flex-col gap-4">
        <MapPicture
          place={place}
          arrow={arrow}
          neighbours={neighbours.map((near) => near.word.id)}
          landing={landing}
        />

        {/* The drawing is silent for anyone not looking at it, and the whole
            lesson is which words are near which, so the sentences below carry
            everything the map does. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {standingOn
            ? TEXT.onWord(standingOn.word)
            : TEXT.betweenWords(place.x, place.y)}{' '}
          {landing && chosenArrow
            ? landingSentence(landing, chosenArrow.label)
            : TEXT.neighbours(neighbours.map((near) => near.word.word))}
        </p>

        <SegmentedControl<string>
          label={TEXT.startLabel}
          value={standingOn?.id ?? ''}
          onChange={(id) => {
            const word = wordById(id);
            if (word) setPlace({ x: word.x, y: word.y });
          }}
          options={startOptions}
        />

        <Slider
          label={TEXT.acrossLabel}
          value={place.x}
          onChange={(x) => {
            setPlace({ x, y: place.y });
          }}
          min={MAP_MIN}
          max={MAP_MAX}
          step={1}
          format={TEXT.coordinate}
        />

        <Slider
          label={TEXT.upLabel}
          value={place.y}
          onChange={(y) => {
            setPlace({ x: place.x, y });
          }}
          min={MAP_MIN}
          max={MAP_MAX}
          step={1}
          format={TEXT.coordinate}
        />

        <SegmentedControl<ArrowId>
          label={TEXT.arrowLabel}
          value={arrow}
          onChange={setArrow}
          options={arrowOptions}
        />

        <p className="text-sm text-ink-faint">{TEXT.note}</p>
      </div>
    </InstrumentPanel>
  );
}

/** Builds the readout's second sentence. The words themselves live in data. */
function landingSentence(landing: Landing, arrowLabel: string): string {
  const { nearest } = landing;
  if (!nearest) return '';

  if (landing.kind === 'on') {
    return TEXT.landedOn(arrowLabel, nearest.word.word);
  }

  if (landing.kind === 'beside') {
    return TEXT.landedBeside(arrowLabel, nearest.word.word, landing.stepsAway);
  }

  return TEXT.landedNowhere(arrowLabel, nearest.word.word, landing.stepsAway);
}

interface MapPictureProps {
  place: Place;
  arrow: ArrowId;
  /** Ids of the words the readout is naming as neighbours. */
  neighbours: readonly string[];
  landing: Landing | undefined;
}

/**
 * The map, drawn.
 *
 * `aria-hidden` on purpose: the readout beside it already names where the
 * marker is, which words are nearest, and where the arrow ended. A `role="img"`
 * here would announce a third, vaguer version of the same thing.
 *
 * Nothing is carried by colour (hard rule 9). A named word is ringed AND set in
 * bold AND spoken in the readout; the marker is a crosshair, which is a shape no
 * word has; the arrow is an arrow.
 */
function MapPicture({ place, arrow, neighbours, landing }: MapPictureProps) {
  const markerX = toX(place.x);
  const markerY = toY(place.y);
  const measured = arrowById(arrow);
  const from = measured ? wordById(measured.from) : undefined;
  const to = measured ? wordById(measured.to) : undefined;
  // Only ring a word the arrow actually reached. Ringing whatever happens to be
  // nearest when the arrow ends in open ground would draw a hit that is not one.
  const landedOn =
    landing && landing.kind !== 'nowhere'
      ? landing.nearest?.word.id
      : undefined;

  return (
    <svg
      viewBox={`0 0 ${String(VIEW.width)} ${String(VIEW.height)}`}
      className="w-full"
      aria-hidden="true"
    >
      <rect
        x={PLOT.left}
        y={PLOT.top}
        width={PLOT.size}
        height={PLOT.size}
        rx="4"
        className="fill-paper-sunken stroke-rule"
        strokeWidth="1"
      />

      {/* Without an arrow, the three named words are joined to the marker, so
          that "nearest" is something you can see and not only read. */}
      {!measured
        ? neighbours.flatMap((id) => {
            const word = wordById(id);
            return word
              ? [
                  <line
                    key={`near-${id}`}
                    x1={markerX}
                    y1={markerY}
                    x2={toX(word.x)}
                    y2={toY(word.y)}
                    className="stroke-rule-strong"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />,
                ]
              : [];
          })
        : null}

      {/* The step, drawn where it was measured. It is a difference between two
          dots and nothing more, and the picture should not let that be
          forgotten. */}
      {from && to ? (
        <StepArrow
          from={from}
          to={to}
          className="fill-ink-faint stroke-ink-faint"
          dashed
        />
      ) : null}

      {landing ? (
        <StepArrow
          from={place}
          to={landing.head}
          className="fill-accent-2 stroke-accent-2"
        />
      ) : null}

      {WORDS.map((word) => {
        const named = neighbours.includes(word.id) || word.id === landedOn;

        return (
          <g key={word.id}>
            <circle
              cx={toX(word.x)}
              cy={toY(word.y)}
              r="2"
              className="fill-ink-muted"
            />
            {named ? (
              <circle
                cx={toX(word.x)}
                cy={toY(word.y)}
                r="6"
                className="fill-none stroke-accent"
                strokeWidth="1.5"
                strokeDasharray={word.id === landedOn ? undefined : '3 2'}
              />
            ) : null}
            <text
              x={toX(word.x)}
              y={toY(word.y) - 9}
              textAnchor="middle"
              fontSize="8"
              fontWeight={named ? 700 : 400}
              className="fill-ink"
            >
              {word.word}
            </text>
          </g>
        );
      })}

      {/* The marker: a gapped crosshair, so it reads as a place rather than as
          one more word. */}
      <g className="stroke-accent-2" strokeWidth="1.5" fill="none">
        <circle cx={markerX} cy={markerY} r="3.5" />
        <line x1={markerX - 9} y1={markerY} x2={markerX - 5} y2={markerY} />
        <line x1={markerX + 5} y1={markerY} x2={markerX + 9} y2={markerY} />
        <line x1={markerX} y1={markerY - 9} x2={markerX} y2={markerY - 5} />
        <line x1={markerX} y1={markerY + 5} x2={markerX} y2={markerY + 9} />
      </g>
    </svg>
  );
}

interface StepArrowProps {
  from: Place;
  to: Place;
  className: string;
  dashed?: boolean;
}

/** A line with a head on it. Geometry only — the angle just points the head. */
function StepArrow({ from, to, className, dashed = false }: StepArrowProps) {
  const x1 = toX(from.x);
  const y1 = toY(from.y);
  const x2 = toX(to.x);
  const y2 = toY(to.y);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  return (
    <g className={className}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={dashed ? 1.25 : 2}
        strokeDasharray={dashed ? '4 3' : undefined}
      />
      <polygon
        points="0,0 -8,-3.5 -8,3.5"
        strokeWidth="0"
        transform={`translate(${x2.toFixed(1)} ${y2.toFixed(1)}) rotate(${angle.toFixed(1)})`}
      />
    </g>
  );
}
