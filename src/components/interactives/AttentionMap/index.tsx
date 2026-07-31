import { Fragment, useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl } from '../../primitives';
import { FEATURES } from '../shared/attention/logic';
import { SentenceChips } from '../shared/attention/SentenceChips';
import { SENTENCE } from '../shared/attention/sentences.en';
import { MEANINGS, QUESTIONS, TEXT } from './data.en';
import {
  DEFAULT_QUESTION,
  DEFAULT_WORD,
  dominantFeature,
  QUESTION_IDS,
  readingFor,
  WORD_COUNT,
} from './logic';
import type { QuestionId } from './logic';

export interface AttentionMapProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

/**
 * Bars are a second cue beside the printed number, never the only one.
 *
 * Clamped and rounded to a tenth: a blend is a weighted average of values that
 * never exceed one, so it cannot leave the track, and no inline style needs
 * seventeen significant figures to be right.
 */
const barWidth = (value: number): string => {
  const percent = Math.max(0, Math.min(100, value * 100));

  return `${String(Math.round(percent * 10) / 10)}%`;
};

/**
 * Teaches one thing: a word rebuilds its meaning out of whichever words
 * answered its question, and the shares it spends doing that always add to
 * exactly one.
 *
 * The budget is the part a reader has to feel rather than be told. Every row
 * spends the same single unit of attention, so the only way "she" gets 43% onto
 * "student" is by taking it off the other eight words — and "because", which has
 * nothing to ask with, cannot concentrate its budget anywhere and spreads it
 * flat. Seeing those two rows side by side is what turns "the weights are
 * computed" from a claim into something the reader watched happen.
 *
 * The meaning strip underneath is the output, and it is the reason the panel is
 * not just a bar chart: "she" arrives carrying nothing but "I am a pointing
 * word" and leaves carrying most of what "student" means.
 */
export function AttentionMap({ title, lead }: AttentionMapProps = {}) {
  const [word, setWord] = useState(DEFAULT_WORD);
  const [question, setQuestion] = useState<QuestionId>(DEFAULT_QUESTION);

  const copy = ui.interactives.AttentionMap;
  const reading = readingFor(word, question);
  const strongestMeaning = dominantFeature(reading.after);

  const headline = reading.spreadsEvenly
    ? TEXT.even(reading.text, reading.strongestPercent, WORD_COUNT)
    : TEXT.leaned(
        reading.text,
        reading.strongestText,
        reading.strongestPercent,
      );

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setWord(DEFAULT_WORD);
        setQuestion(DEFAULT_QUESTION);
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <SentenceChips
            sentence={SENTENCE}
            weights={reading.weights}
            focusIndex={reading.word}
            onSelect={setWord}
            label={TEXT.chipsLabel}
            describeChip={TEXT.describeChip}
          />
          <p className="text-2xs text-ink-faint">{TEXT.rounding}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-rule pt-3">
          <p className="text-sm font-medium text-ink">
            {TEXT.meaningTitle(reading.text)}
          </p>

          <div className="grid grid-cols-[minmax(5.5rem,auto)_1fr_1fr] items-center gap-x-3 gap-y-1.5">
            <span />
            <span className="text-2xs text-ink-faint">{TEXT.before}</span>
            <span className="text-2xs text-ink-faint">{TEXT.after}</span>

            {FEATURES.map((feature) => (
              <Fragment key={feature}>
                <span className="text-xs text-ink-muted">
                  {MEANINGS[feature]}
                </span>

                {/* Two cues per cell: the length of the bar and the number
                    beside it, so the strip survives greyscale (hard rule 9).
                    The column headings, not the tone, say which is which. */}
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 flex-1 rounded-full bg-paper-sunken"
                  >
                    <span
                      className="block h-1.5 rounded-full bg-ink-faint transition-[width] duration-[var(--duration-base)] ease-out-soft"
                      style={{ width: barWidth(reading.before[feature]) }}
                    />
                  </span>
                  <span className="font-mono text-2xs text-ink-faint">
                    {TEXT.amount(reading.before[feature])}
                  </span>
                </span>

                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-1.5 flex-1 rounded-full bg-paper-sunken"
                  >
                    <span
                      className="block h-1.5 rounded-full bg-accent-2 transition-[width] duration-[var(--duration-base)] ease-out-soft"
                      style={{ width: barWidth(reading.after[feature]) }}
                    />
                  </span>
                  <span className="font-mono text-2xs text-ink-faint">
                    {TEXT.amount(reading.after[feature])}
                  </span>
                </span>
              </Fragment>
            ))}
          </div>
        </div>

        <SegmentedControl<QuestionId>
          label={TEXT.questionLabel}
          value={question}
          onChange={setQuestion}
          options={QUESTION_IDS.map((id) => ({
            value: id,
            label: QUESTIONS[id],
          }))}
        />

        {/* Everything above changes silently for anyone not looking at it, and
            the two sentences here are the whole lesson. */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {headline}{' '}
          {TEXT.became(
            reading.text,
            MEANINGS[strongestMeaning],
            reading.after[strongestMeaning],
          )}
        </p>
      </div>
    </InstrumentPanel>
  );
}
