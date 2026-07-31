import { useState } from 'react';

import { ui } from '../../../copy/en';
import { InstrumentPanel, SegmentedControl, Stepper } from '../../primitives';
import {
  PASSAGES,
  SKILL_NOTES,
  SOURCE_LABELS,
  SOURCE_NOTES,
  TEXT,
} from './data.en';
import {
  answerAt,
  blankedText,
  clampPosition,
  isCorrect,
  optionsFor,
  skillAt,
  SOURCES,
  wordAt,
  wordCount,
} from './logic';
import type { SourceId } from './logic';

export interface FreeLabelMakerProps {
  /** Overrides the default title. Every prop is optional by contract (§3.3). */
  title?: string;
  lead?: string;
}

const DEFAULT_SOURCE: SourceId = 'novel';

/**
 * The last word of the novel sentence — "fridge". Chosen so the reader's first
 * blank is one they cannot fill from the grammar, only from knowing how a
 * kitchen is arranged. Starting on a function word would make the whole thing
 * look like a spelling exercise.
 */
const DEFAULT_POSITION = 8;

/** No guess yet. Matches none of the options, so no segment is selected. */
const NO_GUESS = '';

/**
 * Teaches one thing: every word of ordinary text is already a question with the
 * correct answer attached, because the answer is the word that was covered up.
 *
 * The reveal is what makes that structural rather than asserted. Once a guess
 * is in, the covered word drops back into the sentence and the sentence is
 * whole — nothing was added to it, and the reader can see that nothing was.
 * Moving the blank along the same sentence does the other half of the job: some
 * positions fall to grammar alone, others cannot be filled without knowing
 * something the sentence never says, and both cost exactly nothing to produce.
 *
 * No `StaticFallback`: every control here is a button or a radio, so nothing
 * depends on hover or drag precision and the instrument works on a phone.
 */
export function FreeLabelMaker({ title, lead }: FreeLabelMakerProps = {}) {
  const [sourceId, setSourceId] = useState<SourceId>(DEFAULT_SOURCE);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [guess, setGuess] = useState<string>(NO_GUESS);

  const copy = ui.interactives.FreeLabelMaker;

  const passage = PASSAGES[sourceId];
  const total = wordCount(passage);
  const safePosition = clampPosition(passage, position);
  const hiddenIndex = safePosition - 1;

  const hiddenWord = wordAt(passage, hiddenIndex);
  const options = optionsFor(passage, hiddenIndex);
  const answered = guess !== NO_GUESS;

  const changeSource = (next: SourceId) => {
    setSourceId(next);
    setPosition((current) => clampPosition(PASSAGES[next], current));
    setGuess(NO_GUESS);
  };

  const changePosition = (next: number) => {
    setPosition(clampPosition(passage, next));
    setGuess(NO_GUESS);
  };

  const verdict = answered
    ? `${
        isCorrect(passage, hiddenIndex, guess)
          ? TEXT.correct(hiddenWord.text)
          : TEXT.wrong(guess, answerAt(passage, hiddenIndex))
      } ${SKILL_NOTES[skillAt(passage, hiddenIndex)]}`
    : TEXT.prompt(blankedText(passage, hiddenIndex, TEXT.spokenBlank));

  return (
    <InstrumentPanel
      title={title ?? copy.title}
      lead={lead ?? copy.lead}
      onReset={() => {
        setSourceId(DEFAULT_SOURCE);
        setPosition(DEFAULT_POSITION);
        setGuess(NO_GUESS);
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <SegmentedControl<SourceId>
            label={TEXT.sourceLabel}
            value={sourceId}
            onChange={changeSource}
            options={SOURCES.map((value) => ({
              value,
              label: SOURCE_LABELS[value],
            }))}
          />
          <p className="text-xs text-ink-faint">{SOURCE_NOTES[sourceId]}</p>
        </div>

        <p className="font-display text-lg leading-loose text-ink">
          {passage.words.map((word, index) => (
            <span key={`${sourceId}-${String(index)}`}>
              {index > 0 ? ' ' : ''}
              {index === hiddenIndex ? (
                /*
                 * The gap is marked by a border and a tint, and by what sits
                 * inside it — a question mark before the guess, the word itself
                 * after. Colour is never the only signal (hard rule 9).
                 */
                <span className="rounded-sm border-b-2 border-accent bg-accent-soft px-2">
                  {answered ? (
                    word.text
                  ) : (
                    <>
                      <span className="sr-only">{TEXT.spokenBlank}</span>
                      <span
                        aria-hidden="true"
                        className="font-mono text-ink-faint"
                      >
                        &nbsp;?&nbsp;
                      </span>
                    </>
                  )}
                </span>
              ) : (
                word.text
              )}
              {word.trailing ?? ''}
            </span>
          ))}
        </p>

        <Stepper
          label={TEXT.positionLabel}
          value={safePosition}
          onChange={changePosition}
          min={1}
          max={total}
          format={(value) => TEXT.positionValue(value, total)}
        />

        <SegmentedControl<string>
          label={TEXT.guessLabel}
          value={guess}
          onChange={setGuess}
          options={options.map((option) => ({
            value: option,
            label: option,
          }))}
        />

        {/*
          Moving the blank silently rewrites the sentence and all four options,
          and choosing an option silently rewrites the verdict — none of which a
          screen reader announces on its own. One live region carries both: the
          sentence with the gap read aloud before a guess, and what the text
          actually said after one.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
          {verdict}
        </p>

        {answered ? (
          <p className="text-xs text-ink-faint">{TEXT.restored}</p>
        ) : null}

        <p className="text-2xs text-ink-faint">{TEXT.supply(total)}</p>
      </div>
    </InstrumentPanel>
  );
}
