import { Fragment, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import { PAIRS, TEXT } from './data.en';
import {
  markUp,
  PAIR_IDS,
  referent,
  SLOTS,
  swapDistance,
  swappedWord,
  undecidedAtPronoun,
} from './logic';
import type { PairId, Role, Slot } from './logic';

export interface PronounFlipProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/** The pair the unit's prose walks through, so the reader lands on it first. */
const DEFAULT_PAIR: PairId = 'soup';
const DEFAULT_SLOT: Slot = 'a';
const DEFAULT_STOP = false;

/**
 * Each job a word can be doing gets its own shape — a solid box, a dashed box,
 * a dotted underline — and not merely its own tint. The readout underneath
 * then names all three again in words, which is the only version a screen
 * reader gets (hard rule 9).
 */
const WORD_STYLE: Record<Role, string> = {
  plain: '',
  pronoun:
    'rounded border border-accent bg-accent-soft px-1 font-semibold text-ink',
  swapped:
    'rounded border border-dashed border-ink-muted px-1 font-semibold text-ink',
  candidate: 'underline decoration-dotted underline-offset-4',
};

/** A candidate the pronoun turns out to mean: a solid box, like the pronoun. */
const CHOSEN_STYLE =
  'rounded border border-accent-2 bg-accent-2-soft px-1 font-semibold text-ink';

/**
 * Teaches one thing: what a word means can be settled by a word that has not
 * been read yet, so a machine reading left to right and committing as it goes
 * is not merely inaccurate here — it is being asked a question the evidence in
 * front of it does not answer.
 *
 * The toggle is the point of the instrument. Flipping the ending with the
 * sentence in full is a pleasant surprise; flipping it with the sentence cut
 * off at the pronoun and watching *nothing on the line change* is the argument,
 * because it shows the difference is not somewhere the reader failed to look.
 */
export function PronounFlip({ title, lead }: PronounFlipProps = {}) {
  const [pairId, setPairId] = useState<PairId>(DEFAULT_PAIR);
  const [slot, setSlot] = useState<Slot>(DEFAULT_SLOT);
  const [stopAtPronoun, setStopAtPronoun] = useState(DEFAULT_STOP);

  const copy = ui.interactives.PronounFlip;
  const pair = PAIRS[pairId];
  const words = markUp(pair, slot, stopAtPronoun);
  const stopped = stopAtPronoun && undecidedAtPronoun(pair);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setPairId(DEFAULT_PAIR);
        setSlot(DEFAULT_SLOT);
        setStopAtPronoun(DEFAULT_STOP);
      }}
    >
      <div className="flex flex-col gap-5">
        <p className="text-lg leading-loose text-ink">
          {words
            .filter((word) => !word.unread)
            .map((word, index) => (
              <Fragment key={`${String(index)}-${word.text}`}>
                <span
                  className={word.chosen ? CHOSEN_STYLE : WORD_STYLE[word.role]}
                >
                  {word.text}
                </span>{' '}
              </Fragment>
            ))}
          {stopAtPronoun ? (
            <span className="text-ink-faint">{TEXT.rest}</span>
          ) : null}
        </p>

        <div className="flex flex-col gap-4">
          <SegmentedControl<PairId>
            label={TEXT.pairLabel}
            value={pairId}
            onChange={setPairId}
            options={PAIR_IDS.map((id) => ({
              value: id,
              label: PAIRS[id].label,
            }))}
          />

          <SegmentedControl<Slot>
            label={TEXT.endingLabel}
            value={slot}
            onChange={setSlot}
            options={SLOTS.map((option) => ({
              value: option,
              label: swappedWord(pair, option),
            }))}
          />

          <Toggle
            label={TEXT.stopLabel}
            description={TEXT.stopDescription}
            checked={stopAtPronoun}
            onChange={setStopAtPronoun}
          />
        </div>

        {/* The sentence above rewrites itself silently for anyone not looking
            at it, and the reading is the whole lesson, so it is the live
            region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {stopped
            ? TEXT.undecided(
                pair.pronoun,
                pair.candidates[0].name,
                pair.candidates[1].name,
              )
            : `${TEXT.resolved(
                pair.pronoun,
                referent(pair, slot).name,
                pair.readings[slot].because,
              )} ${TEXT.swapNote(
                swappedWord(pair, slot),
                swapDistance(pair, slot),
              )}`}
        </p>

        <p className="text-xs text-ink-faint">{TEXT.honesty}</p>
      </div>
    </InstrumentPanel>
  );
}
