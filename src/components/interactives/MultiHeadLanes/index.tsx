import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel } from '../../primitives';
import { SentenceChips } from '../shared/attention/SentenceChips';
import { asPercent } from '../shared/attention/logic';
import { SENTENCE } from '../shared/attention/sentences.en';
import { HEAD_TEXT, TEXT } from './data.en';
import type { Opinion } from './data.en';
import {
  disagreement,
  evenShare,
  OPENS_ON,
  readingsFor,
  widestDisagreement,
} from './logic';

export interface MultiHeadLanesProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Teaches one thing: a round of attention is one question asked of every pair
 * of words, so a second kind of relationship needs a second round — and the
 * moment there are four rounds, they stop agreeing about where a word should
 * look.
 *
 * The flat rows are the instrument, not its background. Three of the four heads
 * having nothing whatever to say about "she" is what makes "one head, one
 * relationship" a thing the reader watched rather than a thing they were told,
 * and the five words in this sentence that wake no head at all are why nobody
 * ships four of these.
 *
 * No `StaticFallback`: the chips are tap targets and the lanes wrap, so nothing
 * here needs hover or drag precision. It is taller on a phone than on a laptop
 * and still says the same thing.
 */
export function MultiHeadLanes({ title, lead }: MultiHeadLanesProps = {}) {
  const [index, setIndex] = useState<number>(OPENS_ON);

  const copy = ui.interactives.MultiHeadLanes;
  const readings = readingsFor(SENTENCE, index);
  const chosen = SENTENCE[index];

  const opinions: Opinion[] = readings.flatMap((reading) => {
    const leaned =
      reading.leansOn === null ? undefined : SENTENCE[reading.leansOn];
    if (!leaned) return [];

    const head = HEAD_TEXT[reading.id];
    return [
      {
        name: head.name,
        asks: head.asks,
        on: leaned.text,
        percent: asPercent(reading.share),
      },
    ];
  });

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setIndex(OPENS_ON);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-ink">{TEXT.pickLabel}</p>
          <SentenceChips
            sentence={SENTENCE}
            focusIndex={index}
            onSelect={setIndex}
            label={TEXT.pickRowLabel}
          />
        </div>

        <ol className="flex list-none flex-col gap-4 p-0">
          {readings.map((reading) => {
            const head = HEAD_TEXT[reading.id];

            return (
              <li key={reading.id} className="flex flex-col gap-1.5">
                <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <span className="font-mono font-semibold text-ink">
                    {head.name}
                  </span>
                  <span className="text-ink-muted">{head.asks}</span>
                </p>

                <SentenceChips
                  sentence={SENTENCE}
                  weights={reading.weights}
                  focusIndex={index}
                  label={TEXT.laneRowLabel(head.name)}
                  describeChip={TEXT.describeChip}
                />
              </li>
            );
          })}
        </ol>

        {/* Four rows of chips redraw themselves silently for anyone not looking
            at them, and which heads spoke is the whole lesson, so this is the
            live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {TEXT.readout({
            word: chosen?.text ?? '',
            opinions,
            quiet: readings.length - opinions.length,
            evenPercent: asPercent(evenShare(SENTENCE)),
            wordCount: SENTENCE.length,
            spread: asPercent(disagreement(SENTENCE, index)),
            widest: index === widestDisagreement(SENTENCE),
          })}
        </p>

        <p className="text-xs text-ink-faint">{TEXT.honesty}</p>
        <p className="text-xs text-ink-faint">{TEXT.fourthHead}</p>
      </div>
    </InstrumentPanel>
  );
}
