import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider } from '../../primitives';
import { TEXT } from './data.en';
import { bestDials, HOUSES, predict, residuals, wrongness } from './logic';
import type { Dials } from './logic';

export interface DialTunerProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const DEFAULT_DIALS: Dials = { perSquareMetre: 1.4, base: 40 };

// Plot geometry. Plain arithmetic rather than d3-scale: two linear maps do not
// justify an import in an island that is trying to stay small.
const VIEW = { width: 320, height: 190 };
const PAD = { left: 34, right: 8, top: 10, bottom: 26 };
const DOMAIN = { minSize: 25, maxSize: 140, minPrice: 90, maxPrice: 380 };

const toX = (size: number) =>
  PAD.left +
  ((size - DOMAIN.minSize) / (DOMAIN.maxSize - DOMAIN.minSize)) *
    (VIEW.width - PAD.left - PAD.right);

const toY = (price: number) =>
  VIEW.height -
  PAD.bottom -
  ((price - DOMAIN.minPrice) / (DOMAIN.maxPrice - DOMAIN.minPrice)) *
    (VIEW.height - PAD.top - PAD.bottom);

/**
 * Teaches one thing: a model is a box of adjustable numbers, and tuning them
 * until the answers stop being wrong is all that "learning" means.
 *
 * The vertical error bars are the point of the picture. Without them the reader
 * watches a line move; with them they watch a quantity they are trying to
 * shrink, which is the thing the training loop automates two units later.
 */
export function DialTuner({ title, lead }: DialTunerProps = {}) {
  const [dials, setDials] = useState<Dials>(DEFAULT_DIALS);

  const copy = ui.interactives.DialTuner;
  const average = wrongness(dials);
  const best = bestDials();
  const marks = residuals(dials);

  // "Close enough" is generous on purpose: the reward is for understanding the
  // move, not for grinding a slider.
  const isClose = average <= best.wrongness + 1.5;

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setDials(DEFAULT_DIALS);
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
            <text x={PAD.left} y={PAD.top - 2}>
              {TEXT.axisPrice}
            </text>
          </g>

          {/* How wrong each guess is, drawn as the gap it actually is. */}
          <g className="stroke-danger" strokeWidth="1.25" strokeDasharray="2 2">
            {marks.map(({ house, predicted }) => (
              <line
                key={`e-${String(house.size)}`}
                x1={toX(house.size)}
                y1={toY(house.price)}
                x2={toX(house.size)}
                y2={toY(predicted)}
              />
            ))}
          </g>

          <line
            className="stroke-accent-2"
            strokeWidth="2"
            x1={toX(DOMAIN.minSize)}
            y1={toY(predict(dials, DOMAIN.minSize))}
            x2={toX(DOMAIN.maxSize)}
            y2={toY(predict(dials, DOMAIN.maxSize))}
          />

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

        <Slider
          label={TEXT.perSquareMetre}
          description={TEXT.perSquareMetreDescription}
          value={dials.perSquareMetre}
          onChange={(perSquareMetre) => {
            setDials((previous) => ({ ...previous, perSquareMetre }));
          }}
          min={0}
          max={5}
          step={0.05}
          format={(v) => `£${v.toFixed(2)}k`}
        />

        <Slider
          label={TEXT.base}
          description={TEXT.baseDescription}
          value={dials.base}
          onChange={(base) => {
            setDials((previous) => ({ ...previous, base }));
          }}
          min={-40}
          max={120}
          step={1}
          format={(v) => `£${String(v)}k`}
        />

        {/* The number the reader is trying to move. Live, because the whole
            exercise is watching it respond to the dials. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.wrongness(average)} {isClose ? TEXT.close : ''}{' '}
          {TEXT.best(best.wrongness)}
        </p>
      </div>
    </InstrumentPanel>
  );
}
