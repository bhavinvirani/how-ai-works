import { useId, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider, Toggle } from '../../primitives';
import { DETECTOR_TEXT, FILM_TITLES, TEXT, VERDICTS } from './data.en';
import type { Dials } from './logic';
import {
  agreement,
  bestAgreement,
  clampDial,
  collapse,
  curveVertices,
  DEFAULT_BEND,
  DEFAULT_DIALS,
  DETECTORS,
  DIAL_STEP,
  DIAL_VALUES,
  filmTotal,
  FILMS,
  MAX_ACTION,
  MAX_DIAL,
  MIN_ACTION,
  MIN_DIAL,
  recommends,
  TRAP_FILM_IDS,
  verdictFor,
} from './logic';

export interface TasteNeuronProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

// Plot geometry. Plain arithmetic rather than d3-scale: two linear maps do not
// justify an import, and FlexibilityDial makes the same call.
const VIEW = { width: 340, height: 196 };
const AXES = { left: 26, right: 332, top: 16, bottom: 150 };

/**
 * The vertical range drawn. Totals run far outside it at the ends of the dials;
 * the clip path and `nearPlot` keep that off the page. Nothing is lost, because
 * the only things this plot is asked to show are which side of the bar the line
 * is on and how many times it changes its mind.
 */
const MIN_TOTAL = -4;
const MAX_TOTAL = 4;

const toX = (action: number) =>
  AXES.left +
  ((action - MIN_ACTION) / (MAX_ACTION - MIN_ACTION)) *
    (AXES.right - AXES.left);

const toY = (total: number) =>
  AXES.bottom -
  ((total - MIN_TOTAL) / (MAX_TOTAL - MIN_TOTAL)) * (AXES.bottom - AXES.top);

const nearPlot = (y: number) =>
  Math.max(AXES.top - 60, Math.min(AXES.bottom + 60, y));

const BAR_Y = toY(0);

const HEADING_CELL = 'px-2 py-1.5 text-xs font-medium text-ink';
const FACT_CELL = 'px-2 py-2 font-mono text-xs text-ink-muted';

/**
 * Teaches one thing: the small bend inside a neuron is the only reason stacking
 * neurons buys anything. With the bend in, the reader can teach this machine a
 * taste that has a middle to it. With it out, the same four neurons flatten
 * into a single weighted sum, and no setting of any dial can mean "enough".
 *
 * The plot is the argument. With the bend in, the line has corners and can
 * cross the bar twice. With it out, it is one straight run from edge to edge
 * and can cross once — which is why the middle film can never be the only one
 * recommended, however the dials are set. That is a claim readers do not
 * believe when they are told it, and cannot dispute once they have switched the
 * bend off themselves.
 *
 * No `StaticFallback`: sliders and a switch are operable by touch and by
 * keyboard, and nothing here needs hover or drag precision. The table scrolls
 * inside its own container rather than pushing the page sideways on a phone.
 */
export function TasteNeuron({ title, lead }: TasteNeuronProps = {}) {
  const [dials, setDials] = useState<Dials>(DEFAULT_DIALS);
  const [bendOn, setBendOn] = useState(DEFAULT_BEND);

  // useId's output contains characters that are awkward inside url(#…), so it
  // is reduced to letters and digits before being used as a fragment target.
  const uniqueSuffix = useId().replace(/[^a-zA-Z0-9]/g, '');
  const plotClipId = `taste-${uniqueSuffix}`;

  const copy = ui.interactives.TasteNeuron;
  const agreed = agreement(dials, bendOn);

  const setDial = (index: number, value: number) => {
    setDials((current) => {
      const next: [number, number, number] = [
        current[0],
        current[1],
        current[2],
      ];
      next[index] = clampDial(value);
      return next;
    });
  };

  const curve = curveVertices(dials, bendOn)
    .map((point, index) => {
      const x = toX(point.action).toFixed(1);
      const y = nearPlot(toY(point.total)).toFixed(1);
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join('');

  const trapFilms = FILMS.filter((film) => TRAP_FILM_IDS.includes(film.id));

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setDials(DEFAULT_DIALS);
        setBendOn(DEFAULT_BEND);
      }}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink-muted">{TEXT.setup}</p>

        <div className="flex flex-col gap-2">
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

            {/* The half of the plot where a film gets recommended. Tinted AND
                labelled, so the split never rests on colour (hard rule 9). */}
            <rect
              x={AXES.left}
              y={AXES.top}
              width={AXES.right - AXES.left}
              height={BAR_Y - AXES.top}
              className="fill-accent-2-soft"
            />

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

            <line
              x1={AXES.left}
              y1={BAR_Y}
              x2={AXES.right}
              y2={BAR_Y}
              className="stroke-rule-strong"
              strokeWidth="1.25"
              strokeDasharray="4 3"
            />

            <g className="fill-ink-faint font-mono" fontSize="7">
              <text x={AXES.left + 5} y={AXES.top + 10}>
                {TEXT.aboveBar}
              </text>
              <text x={AXES.left + 5} y={BAR_Y + 11}>
                {TEXT.belowBar}
              </text>
              <text x={AXES.right} y={AXES.bottom + 12} textAnchor="end">
                {TEXT.actionAxis}
              </text>
            </g>

            <path
              className="fill-none stroke-accent"
              strokeWidth="2"
              strokeLinejoin="round"
              clipPath={`url(#${plotClipId})`}
              d={curve}
            />

            {/* A circle for a film you said you would watch, a square for one
                you would not — shape carries it, never the tint alone. */}
            <g clipPath={`url(#${plotClipId})`}>
              {trapFilms.map((film) => {
                const x = toX(film.action);
                const y = nearPlot(toY(filmTotal(film, dials, bendOn)));

                return film.watch ? (
                  <circle
                    key={film.id}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-ink"
                  />
                ) : (
                  <rect
                    key={film.id}
                    x={x - 4}
                    y={y - 4}
                    width="8"
                    height="8"
                    className="fill-paper stroke-ink"
                    strokeWidth="1.5"
                  />
                );
              })}
            </g>

            <circle
              cx={AXES.left + 5}
              cy={VIEW.height - 9}
              r="4"
              className="fill-ink"
            />
            <rect
              x={AXES.left + 88}
              y={VIEW.height - 13}
              width="8"
              height="8"
              className="fill-paper stroke-ink"
              strokeWidth="1.5"
            />
            <g className="fill-ink-faint font-mono" fontSize="7">
              <text x={AXES.left + 14} y={VIEW.height - 6}>
                {TEXT.legendWatch}
              </text>
              <text x={AXES.left + 101} y={VIEW.height - 6}>
                {TEXT.legendSkip}
              </text>
            </g>
          </svg>

          <p className="text-xs text-ink-faint">{TEXT.chartCaption}</p>
        </div>

        <div className="flex flex-col gap-4">
          {DETECTORS.map((detector, index) => (
            <Slider
              key={detector.id}
              label={DETECTOR_TEXT[detector.id].label}
              description={DETECTOR_TEXT[detector.id].description}
              value={dials[index]}
              onChange={(value) => {
                setDial(index, value);
              }}
              min={MIN_DIAL}
              max={MAX_DIAL}
              step={DIAL_STEP}
              format={TEXT.dialValue}
            />
          ))}
        </div>

        <Toggle
          label={TEXT.bendLabel}
          description={TEXT.bendDescription}
          checked={bendOn}
          onChange={setBendOn}
        />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{TEXT.tableCaption}</caption>
            <thead>
              <tr className="border-b border-rule-strong">
                <th scope="col" className={HEADING_CELL}>
                  {TEXT.filmColumn}
                </th>
                <th scope="col" className={HEADING_CELL}>
                  {TEXT.actionColumn}
                </th>
                <th scope="col" className={HEADING_CELL}>
                  {TEXT.buzzColumn}
                </th>
                <th scope="col" className={HEADING_CELL}>
                  {TEXT.lengthColumn}
                </th>
                <th scope="col" className={HEADING_CELL}>
                  {TEXT.youColumn}
                </th>
                <th scope="col" className={HEADING_CELL}>
                  {TEXT.machineColumn}
                </th>
              </tr>
            </thead>

            <tbody>
              {FILMS.map((film) => {
                const said = recommends(film, dials, bendOn);
                const same = said === film.watch;

                return (
                  <tr key={film.id} className="border-b border-rule">
                    <th
                      scope="row"
                      className="px-2 py-2 text-xs font-normal whitespace-nowrap text-ink"
                    >
                      {FILM_TITLES[film.id]}
                    </th>
                    <td className={FACT_CELL}>{film.action}</td>
                    <td className={FACT_CELL}>{film.buzz}</td>
                    <td className={FACT_CELL}>{film.length}</td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap text-ink">
                      {film.watch ? TEXT.watchIt : TEXT.skipIt}
                    </td>
                    <td
                      className={`px-2 py-2 whitespace-nowrap ${
                        same ? 'bg-success-soft' : 'bg-danger-soft'
                      }`}
                    >
                      <span className="block text-xs text-ink">
                        {said ? TEXT.watchIt : TEXT.skipIt}
                      </span>
                      <span className="block font-mono text-2xs tracking-wide text-ink-muted uppercase">
                        {same ? TEXT.agrees : TEXT.differs}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-2xs text-ink-faint">{TEXT.scaleNote}</p>

        {/* Moving a dial silently rewrites a line and six table rows, so the
            sentences saying what kind of machine now exists are the live
            region — not the plot, and not the table. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.agreementSentence(agreed, FILMS.length)}{' '}
          {VERDICTS[verdictFor(dials, bendOn)]}
          {bendOn
            ? ''
            : ` ${TEXT.collapsed(collapse(dials))} ${TEXT.ceilingWithout(
                bestAgreement(false),
                FILMS.length,
              )}`}
        </p>

        <p className="text-2xs text-ink-faint">
          {TEXT.footnote(
            DIAL_VALUES.length ** DETECTORS.length,
            bestAgreement(true),
            bestAgreement(false),
            FILMS.length,
          )}
        </p>
      </div>
    </InstrumentPanel>
  );
}
