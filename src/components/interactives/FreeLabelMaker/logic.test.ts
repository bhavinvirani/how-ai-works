import { describe, expect, it } from 'vitest';

import { PASSAGES } from './data.en';
import {
  answerAt,
  blankedText,
  clampPosition,
  freeQuestions,
  isCorrect,
  OPTION_COUNT,
  optionsFor,
  plainText,
  skillsIn,
  SOURCES,
  totalFreeQuestions,
  wordAt,
  wordCount,
} from './logic';
import type { Passage, Skill } from './logic';

const ALL: Passage[] = SOURCES.map((id) => PASSAGES[id]);

/** Every (passage, word) pair, so a claim can be made about all of them. */
const everyWord = (): { passage: Passage; index: number }[] =>
  ALL.flatMap((passage) =>
    passage.words.map((_, index) => ({ passage, index })),
  );

describe('wordAt', () => {
  it('refuses a position outside the passage rather than returning nonsense', () => {
    const passage = PASSAGES.novel;

    expect(() => wordAt(passage, -1)).toThrow(RangeError);
    expect(() => wordAt(passage, wordCount(passage))).toThrow(RangeError);
  });
});

describe('clampPosition', () => {
  it('keeps a position inside the passage', () => {
    const passage = PASSAGES.novel;

    expect(clampPosition(passage, 0)).toBe(1);
    expect(clampPosition(passage, 3)).toBe(3);
    expect(clampPosition(passage, 99)).toBe(wordCount(passage));
  });

  it('pulls the blank back when a shorter passage arrives', () => {
    // Switching from the ten-word message to the eight-word novel must not
    // leave the blank pointing past the end of the sentence.
    expect(clampPosition(PASSAGES.novel, 10)).toBe(wordCount(PASSAGES.novel));
  });
});

describe('blankedText', () => {
  it('covers exactly one word and leaves its punctuation showing', () => {
    const passage = PASSAGES.message;
    const blanked = blankedText(passage, 4, 'blank');

    expect(blanked).toBe(
      'The pavement is still blank, so it rained last night.',
    );
  });
});

describe('optionsFor', () => {
  it('offers the true word exactly once, among four', () => {
    for (const { passage, index } of everyWord()) {
      const options = optionsFor(passage, index);

      expect(options).toHaveLength(OPTION_COUNT);
      expect(new Set(options).size).toBe(OPTION_COUNT);
      expect(
        options.filter((option) => option === answerAt(passage, index)),
      ).toHaveLength(1);
    }
  });

  it('does not always put the answer in the same place', () => {
    const passage = PASSAGES.message;
    const slots = passage.words.map((word, index) =>
      optionsFor(passage, index).indexOf(word.text),
    );

    expect(new Set(slots).size).toBeGreaterThan(1);
  });

  it('is deterministic — same passage, same position, same row', () => {
    for (const { passage, index } of everyWord()) {
      expect(optionsFor(passage, index)).toEqual(optionsFor(passage, index));
    }
  });
});

describe('isCorrect', () => {
  it('accepts the covered word and nothing else', () => {
    const passage = PASSAGES.novel;

    expect(isCorrect(passage, 7, 'fridge')).toBe(true);
    expect(isCorrect(passage, 7, 'oven')).toBe(false);
    expect(isCorrect(passage, 7, '')).toBe(false);
  });
});

/**
 * These are the unit's argument, not incidental coverage. The prose claims that
 * ordinary text already contains the answers, in unlimited supply, and that
 * filling the gaps forces a machine to learn more than grammar. If the corpus
 * ever drifts away from any of that, the instrument stops teaching what the
 * page around it says — and nothing else in the build would notice.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('the answer was in the data all along — putting it back restores the text untouched', () => {
    for (const { passage, index } of everyWord()) {
      expect(blankedText(passage, index, answerAt(passage, index))).toBe(
        plainText(passage),
      );
    }
  });

  it('never invents an answer — every option offered is either the word or an authored decoy', () => {
    for (const { passage, index } of everyWord()) {
      const word = wordAt(passage, index);

      expect(word.decoys).not.toContain(word.text);
      expect(new Set(optionsFor(passage, index))).toEqual(
        new Set([word.text, ...word.decoys]),
      );
    }
  });

  it('every word is one free question, so the supply is the length of the writing', () => {
    for (const passage of ALL) {
      expect(freeQuestions(passage)).toBe(passage.words.length);
      // Short enough to read in one breath, long enough that the count makes
      // the supply argument visible rather than theoretical.
      expect(passage.words.length).toBeGreaterThanOrEqual(8);
    }

    expect(totalFreeQuestions(ALL)).toBe(
      ALL.reduce((running, passage) => running + passage.words.length, 0),
    );
  });

  it('filling the gaps takes more than grammar', () => {
    const across = new Set<Skill>(ALL.flatMap((passage) => skillsIn(passage)));

    // Three different kinds of knowing, at least, or "you are forced to learn
    // almost everything else" is a sentence the instrument does not support.
    expect(across.size).toBeGreaterThanOrEqual(3);

    for (const passage of ALL) {
      expect(passage.words.some((word) => word.needs !== 'grammar')).toBe(true);
    }
  });

  it('none of the text was written to be an example — the sentences carry no answer key of their own', () => {
    // Structural: a Passage is a list of words and nothing else. If a future
    // edit adds a hand-written label field, this fails and the claim in the
    // prose has to be revisited rather than quietly broken.
    for (const passage of ALL) {
      expect(Object.keys(passage)).toEqual(['words']);
    }
  });
});
