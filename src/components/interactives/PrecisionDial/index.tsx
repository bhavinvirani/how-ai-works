import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, Slider, Toggle } from '../../primitives';
import { ABILITY_TEXT, TEXT, VERDICTS } from './data.en';
import {
  DEFAULT_BITS,
  DEFAULT_CAREFUL,
  MAX_BITS,
  MIN_BITS,
  panelAt,
  REFERENCE_BITS,
} from './logic';

export interface PrecisionDialProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Teaches one thing: rounding a model's dials to fewer binary digits is nearly
 * free for a surprisingly long way, and then it is not — and the fall lands on
 * some abilities long before it touches the one a reader would check.
 *
 * The slider is the design. Fourteen stops of it, from sixteen digits down to
 * five, change nothing anybody can see; the whole story happens in the last
 * three. A reader who drags it slowly feels the flat top before they are told
 * there is one, which is the part that is hard to believe from a sentence.
 *
 * The five rows are the other half. A single quality number would teach the
 * opposite of the truth — that there is one answer to "how much did that
 * cost?" — so the panel refuses to produce one, and the readout names the
 * ability in trouble rather than averaging it away.
 *
 * No `StaticFallback`: a range input and a switch are both operable by tap and
 * by keyboard, and nothing here needs hover or drag precision. The bars ease
 * their width for a moment on change, which the `--duration-fast` token turns
 * into an instant jump under `prefers-reduced-motion` (hard rule 3).
 */
export function PrecisionDial({ title, lead }: PrecisionDialProps = {}) {
  const [bits, setBits] = useState(DEFAULT_BITS);
  const [careful, setCareful] = useState(DEFAULT_CAREFUL);

  const copy = ui.interactives.PrecisionDial;
  const panel = panelAt(bits, careful);
  const rounding = panel.bits < REFERENCE_BITS;

  const readout = [
    VERDICTS[panel.verdict](panel),
    careful && !rounding ? TEXT.nothingToSpare : '',
  ]
    .filter((sentence) => sentence !== '')
    .join(' ');

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setBits(DEFAULT_BITS);
        setCareful(DEFAULT_CAREFUL);
      }}
    >
      <div className="flex flex-col gap-4">
        <Slider
          label={TEXT.bitsLabel}
          description={TEXT.bitsDescription}
          value={bits}
          onChange={setBits}
          min={MIN_BITS}
          max={MAX_BITS}
          step={1}
          format={TEXT.bitsValue}
        />

        <Toggle
          label={TEXT.carefulLabel}
          description={TEXT.carefulDescription}
          checked={careful}
          onChange={setCareful}
        />

        <div className="flex flex-col gap-2 border-t border-rule pt-3">
          <p className="text-xs text-ink-faint">{TEXT.sizeHeading}</p>

          <div className="flex items-baseline justify-between gap-3">
            <p className="font-mono text-sm text-ink">
              {TEXT.sizeValue(panel.gigabytes)}{' '}
              <span className="text-ink-faint">
                {TEXT.sizeReference(panel.referenceGigabytes)}
              </span>
            </p>
            {rounding ? (
              <p className="shrink-0 font-mono text-2xs text-ink-muted">
                {TEXT.trafficValue(panel.traffic)}
              </p>
            ) : null}
          </div>

          {/* Decorative: both numbers beside it say the same thing in words. */}
          <span
            aria-hidden="true"
            className="block h-2 overflow-hidden rounded-full bg-paper-sunken"
          >
            <span
              className="block h-2 rounded-full bg-accent-2 transition-[width] duration-[var(--duration-fast)] ease-out-soft"
              style={{ width: TEXT.barWidth(panel.sizeShare) }}
            />
          </span>

          {rounding ? (
            <p className="text-xs text-ink-faint">
              {TEXT.rungs(
                panel.levels,
                panel.referenceLevels,
                panel.driftPercent,
              )}
            </p>
          ) : null}
        </div>

        {/* The list, not the bars, is where the meaning lives: every row names
            what is being asked and the two facts that decide how it fares, so
            an ability that gives way early has a stated reason rather than a
            shorter bar. */}
        <div className="flex flex-col gap-2 border-t border-rule pt-3">
          <p className="text-xs text-ink-faint">{TEXT.abilitiesHeading}</p>

          <ul className="flex flex-col gap-2.5">
            {panel.readings.map((reading) => (
              <li key={reading.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ink">
                    {ABILITY_TEXT[reading.id].label}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-ink-muted">
                    {TEXT.abilityScore(reading.score)}
                  </span>
                </div>

                <span
                  aria-hidden="true"
                  className="block h-1.5 overflow-hidden rounded-full bg-paper-sunken"
                >
                  <span
                    className="block h-1.5 rounded-full bg-accent transition-[width] duration-[var(--duration-fast)] ease-out-soft"
                    style={{ width: TEXT.barWidth(reading.score) }}
                  />
                </span>

                <span className="text-2xs text-ink-faint">
                  {ABILITY_TEXT[reading.id].note}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Every bar on the page changes silently for anyone not looking at it,
            and the gap between the top row and the bottom one is the whole
            lesson, so the sentence that names both is the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {readout}
        </p>

        <p className="text-xs text-ink-faint">{TEXT.scaleNote}</p>
      </div>
    </InstrumentPanel>
  );
}
