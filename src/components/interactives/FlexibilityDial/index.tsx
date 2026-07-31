import { useId, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider, Toggle } from '../../primitives';
import { TEXT, VERDICTS } from './data.en';
import {
  MAX_DIALS,
  MIN_DIALS,
  missOnStudied,
  missOnUnseen,
  predict,
  STUDIED_SALES,
  UNSEEN_SALES,
  verdictFor,
} from './logic';

export interface FlexibilityDialProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * The straight line, which is where `model-as-dials` left the reader. Starting
 * anywhere else would hand over the ending: the reader has to add the dials
 * themselves for the improving score to feel like progress.
 */
const DEFAULT_DIALS = MIN_DIALS;
const DEFAULT_SHOW_UNSEEN = false;

// Plot geometry. Plain arithmetic rather than d3-scale, for the same reason as
// FoggyDescentWalk: two linear maps do not justify an import.
const VIEW = { width: 340, height: 214 };
const AXES = { left: 32, right: 330, top: 26, bottom: 180 };
const DOMAIN = {
  minSize: 34,
  maxSize: 137,
  minPrice: 190,
  maxPrice: 650,
};

/** The stretch of street the fitted line is drawn over — the studied range. */
const CURVE_FROM = 38;
const CURVE_TO = 133;
const CURVE_SAMPLES = 180;

const toX = (size: number) =>
  AXES.left +
  ((size - DOMAIN.minSize) / (DOMAIN.maxSize - DOMAIN.minSize)) *
    (AXES.right - AXES.left);

const toY = (price: number) =>
  AXES.bottom -
  ((price - DOMAIN.minPrice) / (DOMAIN.maxPrice - DOMAIN.minPrice)) *
    (AXES.bottom - AXES.top);

/**
 * Keeps a coordinate within shouting distance of the plot before it is handed
 * to SVG. At full flexibility the fitted line reaches prices in the thousands
 * of thousands between two of the dots; the clip path hides that, and this
 * stops the path data itself from carrying absurd numbers.
 */
const nearPlot = (y: number) =>
  Math.max(AXES.top - 90, Math.min(AXES.bottom + 90, y));

const fittedPath = (dials: number): string => {
  let path = '';

  for (let index = 0; index <= CURVE_SAMPLES; index += 1) {
    const size = CURVE_FROM + ((CURVE_TO - CURVE_FROM) * index) / CURVE_SAMPLES;
    const y = nearPlot(toY(predict(size, dials)));
    path += `${index === 0 ? 'M' : 'L'}${toX(size).toFixed(1)} ${y.toFixed(1)}`;
  }

  return path;
};

/**
 * Teaches one thing: a machine given enough freedom stops learning the pattern
 * in its examples and starts memorising the examples, and the score on those
 * examples cannot tell you which of the two just happened.
 *
 * The held-back sales are the instrument's reason for existing. With them off,
 * every push to the right is an improvement and the reader has no way to know
 * they are ruining the machine — which is exactly the position a team is in
 * when nobody kept any data back. Turning them on is what converts a claim in
 * the prose into something the reader watched happen to their own machine.
 */
export function FlexibilityDial({ title, lead }: FlexibilityDialProps = {}) {
  const [dials, setDials] = useState(DEFAULT_DIALS);
  const [showUnseen, setShowUnseen] = useState(DEFAULT_SHOW_UNSEEN);

  // useId's output contains characters that are awkward inside url(#…), so it
  // is reduced to letters and digits before being used as a fragment target.
  const uniqueSuffix = useId().replace(/[^a-zA-Z0-9]/g, '');
  const plotClipId = `fit-${uniqueSuffix}`;

  const copy = ui.interactives.FlexibilityDial;
  const studiedMiss = missOnStudied(dials);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setDials(DEFAULT_DIALS);
        setShowUnseen(DEFAULT_SHOW_UNSEEN);
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
            <clipPath id={plotClipId}>
              <rect
                x={AXES.left}
                y={AXES.top}
                width={AXES.right - AXES.left}
                height={AXES.bottom - AXES.top}
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

          <g className="fill-ink-faint font-mono" fontSize="7">
            <text x={AXES.right} y={AXES.top - 8} textAnchor="end">
              {TEXT.axisPrice}
            </text>
            <text x={AXES.right} y={VIEW.height - 8} textAnchor="end">
              {TEXT.axisSize}
            </text>
          </g>

          <path
            className="fill-none stroke-accent-2"
            strokeWidth="2"
            clipPath={`url(#${plotClipId})`}
            d={fittedPath(dials)}
          />

          {/* Each held-back sale joined to the guess made for it. The length of
              the stalk IS the mistake, which is the one thing the reader is
              being asked to watch. */}
          {showUnseen ? (
            <g
              className="stroke-accent"
              strokeWidth="1"
              strokeDasharray="2 2"
              clipPath={`url(#${plotClipId})`}
            >
              {UNSEEN_SALES.map((sale) => (
                <line
                  key={`miss-${String(sale.size)}`}
                  x1={toX(sale.size)}
                  y1={toY(sale.price)}
                  x2={toX(sale.size)}
                  y2={nearPlot(toY(predict(sale.size, dials)))}
                />
              ))}
            </g>
          ) : null}

          <g className="fill-ink">
            {STUDIED_SALES.map((sale) => (
              <circle
                key={`studied-${String(sale.size)}`}
                cx={toX(sale.size)}
                cy={toY(sale.price)}
                r="3"
              />
            ))}
          </g>

          {/* Squares, not a second colour — the two kinds of sale have to stay
              apart in greyscale (hard rule 9). */}
          {showUnseen ? (
            <g className="fill-paper stroke-accent" strokeWidth="1.5">
              {UNSEEN_SALES.map((sale) => (
                <rect
                  key={`unseen-${String(sale.size)}`}
                  x={toX(sale.size) - 3}
                  y={toY(sale.price) - 3}
                  width="6"
                  height="6"
                />
              ))}
            </g>
          ) : null}

          <circle cx={40} cy={VIEW.height - 11} r="3" className="fill-ink" />
          {showUnseen ? (
            <rect
              x={131}
              y={VIEW.height - 14}
              width="6"
              height="6"
              className="fill-paper stroke-accent"
              strokeWidth="1.5"
            />
          ) : null}
          <g className="fill-ink-faint font-mono" fontSize="7">
            <text x={48} y={VIEW.height - 8}>
              {TEXT.legendStudied}
            </text>
            {showUnseen ? (
              <text x={141} y={VIEW.height - 8}>
                {TEXT.legendUnseen}
              </text>
            ) : null}
          </g>
        </svg>

        <Slider
          label={TEXT.dialsLabel}
          description={TEXT.dialsDescription}
          value={dials}
          onChange={setDials}
          min={MIN_DIALS}
          max={MAX_DIALS}
          step={1}
          format={TEXT.dialsValue}
        />

        <Toggle
          label={TEXT.unseenLabel}
          description={TEXT.unseenDescription}
          checked={showUnseen}
          onChange={setShowUnseen}
        />

        {/* The plot changes silently for anyone not looking at it, and the two
            scores are the whole lesson, so they are the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.studied(studiedMiss)}{' '}
          {showUnseen
            ? `${TEXT.unseen(missOnUnseen(dials))} ${VERDICTS[verdictFor(dials)]}`
            : TEXT.unseenHidden}
        </p>
      </div>
    </InstrumentPanel>
  );
}
