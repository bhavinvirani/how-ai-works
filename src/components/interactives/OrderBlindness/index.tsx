import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Toggle } from '../../primitives';
import { SentenceChips } from '../shared/attention/SentenceChips';
import { FEATURE_LABELS, HEAD_LABELS, TEXT } from './data.en';
import {
  compare,
  DEFAULT_FOCUS,
  DEFAULT_HEAD_ID,
  FEATURES,
  HEAD_IDS,
  SENTENCE,
  wordAt,
} from './logic';

export interface OrderBlindnessProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Both switches start off, and that ordering is the instrument.
 *
 * A reader who lands on a scrambled sentence with the answers already matching
 * has been told the ending. Starting on the untouched sentence means the
 * shuffle is something they did, which is what makes "and nothing moved" land
 * as a surprise rather than as a claim.
 */
const DEFAULT_SHUFFLED = false;
const DEFAULT_POSITIONAL = false;

/**
 * Teaches one thing: attention computes the same answer for a sentence and for
 * the same words in any other order, because nothing in the arithmetic ever
 * refers to which word came first — and stamping each word with where it sits,
 * before any comparing happens, is what fixes it.
 *
 * The table of decimals is the evidence, and it is why the comparison is on
 * what each word ends up meaning rather than on the rows of weights. The
 * weights are indexed by slot: shuffle the words and the row shuffles with
 * them, which proves nothing either way. The four numbers underneath are the
 * output of the mechanism, and with position off they agree digit for digit.
 *
 * No `StaticFallback`: everything here is a tap on a chip or a switch, the
 * chips wrap, and hiding a working instrument from every phone would cost more
 * than the cramped layout does.
 */
export function OrderBlindness({ title, lead }: OrderBlindnessProps = {}) {
  const [headId, setHeadId] = useState<string>(DEFAULT_HEAD_ID);
  const [focusIndex, setFocusIndex] = useState(DEFAULT_FOCUS);
  const [shuffled, setShuffled] = useState(DEFAULT_SHUFFLED);
  const [positional, setPositional] = useState(DEFAULT_POSITIONAL);

  const copy = ui.interactives.OrderBlindness;
  const word = wordAt(focusIndex);
  const reading = compare({ headId, focusIndex, shuffled, positional });

  const verdict = !shuffled
    ? TEXT.verdictSameOrder(word)
    : reading.identical
      ? TEXT.verdictIdentical(word)
      : TEXT.verdictDiffers(word);

  const leaning =
    reading.writtenSpread && reading.arrangedSpread
      ? TEXT.leaningSpread(word)
      : TEXT.leaning(word, reading.writtenLeansOn, reading.arrangedLeansOn);

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setHeadId(DEFAULT_HEAD_ID);
        setFocusIndex(DEFAULT_FOCUS);
        setShuffled(DEFAULT_SHUFFLED);
        setPositional(DEFAULT_POSITIONAL);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
              {TEXT.writtenHeading}
            </p>
            <SentenceChips
              sentence={SENTENCE}
              weights={reading.writtenWeights}
              focusIndex={focusIndex}
              onSelect={setFocusIndex}
              label={TEXT.writtenLabel(word)}
              describeChip={TEXT.describeChoice}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-2xs tracking-wide text-ink-faint uppercase">
              {TEXT.arrangedHeading(shuffled)}
            </p>
            <SentenceChips
              sentence={reading.arranged}
              weights={reading.arrangedWeights}
              focusIndex={reading.arrangedFocus}
              label={TEXT.arrangedLabel(word)}
              describeChip={TEXT.describeChip}
            />
          </div>
        </div>

        {/* The output of the mechanism, printed rather than drawn. Two columns
            of decimals are the only form in which "identical" is checkable. */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="mb-2 text-left text-xs text-ink-faint">
              {TEXT.tableCaption(word)}
            </caption>
            <thead>
              <tr className="border-b border-rule">
                <th
                  scope="col"
                  className="py-1 pr-3 font-medium text-ink-muted"
                >
                  {TEXT.columnFeature}
                </th>
                <th
                  scope="col"
                  className="py-1 pr-3 font-medium text-ink-muted"
                >
                  {TEXT.columnWritten}
                </th>
                <th scope="col" className="py-1 font-medium text-ink-muted">
                  {TEXT.columnArranged(shuffled)}
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature) => (
                <tr key={feature} className="border-b border-rule">
                  <th
                    scope="row"
                    className="py-1 pr-3 font-normal text-ink-muted"
                  >
                    {FEATURE_LABELS[feature]}
                  </th>
                  <td className="py-1 pr-3 font-mono text-ink">
                    {TEXT.amount(reading.writtenBlend[feature])}
                  </td>
                  <td className="py-1 font-mono text-ink">
                    {TEXT.amount(reading.arrangedBlend[feature])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4">
          <SegmentedControl<string>
            label={TEXT.headLabel}
            value={headId}
            onChange={setHeadId}
            options={HEAD_IDS.map((id) => ({
              value: id,
              label: HEAD_LABELS[id],
            }))}
          />

          <Toggle
            label={TEXT.shuffleLabel}
            description={TEXT.shuffleDescription}
            checked={shuffled}
            onChange={setShuffled}
          />

          <Toggle
            label={TEXT.positionLabel}
            description={TEXT.positionDescription}
            checked={positional}
            onChange={setPositional}
          />
        </div>

        {/* Chips restyle themselves and decimals change in place, both of them
            silently for anyone not looking at the panel. The verdict is the
            whole lesson, so it is the live region. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {verdict} {leaning}
        </p>

        <p className="text-xs text-ink-faint">{TEXT.honesty}</p>
      </div>
    </InstrumentPanel>
  );
}
