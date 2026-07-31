import { describe, expect, it } from 'vitest';

import { asPercent, FEATURES } from '../shared/attention/logic';
import { SENTENCE, WORD } from '../shared/attention/sentences.en';
import {
  clampWord,
  DEFAULT_QUESTION,
  DEFAULT_WORD,
  dominantFeature,
  headFor,
  printedTotal,
  QUESTION_IDS,
  readingFor,
  spreadsEvenly,
  WORD_COUNT,
} from './logic';
import type { QuestionId } from './logic';

/** "because" — the word with nothing to ask with. Not in `WORD` by name. */
const BECAUSE = 5;

/** What one word gets when nothing distinguishes it from any other. */
const EVEN = 1 / SENTENCE.length;

describe('the questions on offer', () => {
  it('offers three, each of them a head the shared module really has', () => {
    expect(QUESTION_IDS).toHaveLength(3);
    expect(new Set(QUESTION_IDS).size).toBe(3);

    for (const question of QUESTION_IDS) {
      expect(headFor(question).id).toBe(question);
    }
  });

  it('leaves out the head that is dead until position arrives', () => {
    // `previous-word` has no content rules at all, so with position off it
    // shows a reader a flat row and teaches nothing. It belongs to
    // `positional-encoding`, which is where being flat is the point.
    expect(QUESTION_IDS).not.toContain('previous-word');
  });

  it('refuses to invent a head the shared module has dropped', () => {
    // Widened first: TypeScript will not cast between two string literal types
    // that cannot overlap, and the point of the test is what happens at
    // runtime when the shared module is edited underneath this instrument.
    const renamed: string = 'parses-english';

    expect(() => headFor(renamed as QuestionId)).toThrow();
  });

  it('opens on a real word and a question it offers', () => {
    expect(DEFAULT_WORD).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_WORD).toBeLessThan(WORD_COUNT);
    expect(QUESTION_IDS).toContain(DEFAULT_QUESTION);
  });
});

describe('clampWord', () => {
  it('refuses a word before the sentence starts', () => {
    expect(clampWord(-3)).toBe(0);
  });

  it('refuses a word past the end of it', () => {
    expect(clampWord(400)).toBe(WORD_COUNT - 1);
  });

  it('takes whole words only', () => {
    expect(clampWord(2.4)).toBe(2);
    expect(clampWord(2.6)).toBe(3);
  });
});

describe('spreadsEvenly', () => {
  it('has nothing to say about an empty row', () => {
    expect(spreadsEvenly([])).toBe(false);
  });

  it('recognises a row that gave every word the same share', () => {
    expect(spreadsEvenly([0.25, 0.25, 0.25, 0.25])).toBe(true);
  });

  it('is not fooled by a row that is merely close to flat', () => {
    // A real preference must not be able to hide behind the word "evenly".
    expect(spreadsEvenly([0.26, 0.25, 0.25, 0.24])).toBe(false);
  });
});

describe('readingFor', () => {
  it('names the word asking and the word it leaned on', () => {
    const reading = readingFor(WORD.she, 'reference');

    expect(reading.text).toBe('she');
    expect(reading.strongestText).toBe('student');
  });

  it('keeps a word off the end of the sentence inside it', () => {
    expect(readingFor(99, 'reference').word).toBe(WORD_COUNT - 1);
  });

  it('is deterministic — the same word always gets the same reading', () => {
    expect(readingFor(WORD.she, 'reference').weights).toEqual(
      readingFor(WORD.she, 'reference').weights,
    );
  });
});

describe('dominantFeature', () => {
  it('picks out the meaning a word holds most of', () => {
    expect(
      dominantFeature({ pronoun: 0.1, animate: 0.4, thing: 0.3, action: 0 }),
    ).toBe('animate');
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number `attention.mdx` quotes is checked here, so an edit to the shared
 * sentence, its features or the head weights fails the build instead of quietly
 * turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('spends exactly one unit of attention, whoever is asking and whatever they ask', () => {
    // The budget. Nothing else in this unit works without it: leaning harder on
    // one word is only meaningful because it has to be paid for.
    for (const question of QUESTION_IDS) {
      for (let word = 0; word < WORD_COUNT; word += 1) {
        const { weights } = readingFor(word, question);

        expect(weights).toHaveLength(WORD_COUNT);
        expect(weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
        expect(weights.every((weight) => weight > 0)).toBe(true);
      }
    }
  });

  it('has “she” lean hardest on “student”, by more than double the next word', () => {
    const { weights, strongest } = readingFor(WORD.she, 'reference');

    expect(strongest).toBe(WORD.student);
    expect(weights[WORD.student]).toBeGreaterThan(weights[WORD.box] * 2);
  });

  it('quotes the shares the unit prints — 43, 16, and six apiece', () => {
    const percents = readingFor(WORD.she, 'reference').weights.map(asPercent);

    expect(percents[WORD.student]).toBe(43);
    expect(percents[WORD.box]).toBe(16);
    expect(
      percents.filter(
        (_, index) => index !== WORD.student && index !== WORD.box,
      ),
    ).toEqual([6, 6, 6, 6, 6, 6, 6]);
  });

  it('pays for that lean out of every word that did not answer', () => {
    const { weights } = readingFor(WORD.she, 'reference');

    // The two words with something to offer are above an even share.
    expect(weights[WORD.student]).toBeGreaterThan(EVEN);
    expect(weights[WORD.box]).toBeGreaterThan(EVEN);

    // Every one of the other seven is below it. That is what "budget" means.
    weights.forEach((weight, index) => {
      if (index === WORD.student || index === WORD.box) return;
      expect(weight).toBeLessThan(EVEN);
    });
  });

  it('gives the word next door exactly what it gives the word at the far end', () => {
    // The contrast with a recurrent network, in one line: nearness contributes
    // nothing at all. "student" wins from five words back while "because",
    // sitting immediately before "she", gets the same share as "The" at the
    // very start and "strong" at the very end.
    const { weights } = readingFor(WORD.she, 'reference');

    expect(WORD.she - WORD.student).toBe(5);
    expect(weights[BECAUSE]).toBeCloseTo(weights[0], 12);
    expect(weights[BECAUSE]).toBeCloseTo(weights[WORD_COUNT - 1], 12);
  });

  it('spreads “because” perfectly flat, whichever question it is asked', () => {
    // The weights are computed, not assigned. A word carrying no meaning at all
    // scores zero against everything, and a row of equal scores comes out of
    // softmax as a row of equal shares — exactly equal, not nearly.
    for (const question of QUESTION_IDS) {
      const reading = readingFor(BECAUSE, question);

      expect(reading.spreadsEvenly).toBe(true);
      for (const weight of reading.weights) {
        expect(weight).toBeCloseTo(EVEN, 12);
      }
    }

    // And that flat share is the eleven per cent the unit quotes.
    expect(asPercent(EVEN)).toBe(11);
  });

  it('leaves “because” meaning the plain average of the sentence', () => {
    const { after } = readingFor(BECAUSE, 'reference');

    for (const feature of FEATURES) {
      const average =
        SENTENCE.reduce(
          (total, token) => total + (token.features[feature] ?? 0),
          0,
        ) / SENTENCE.length;

      expect(after[feature]).toBeCloseTo(average, 12);
    }
  });

  it('rebuilds “she” into mostly a person, from a word five places back', () => {
    // What attention is FOR. "she" arrives carrying nothing but "I am a
    // pointing word" and leaves carrying most of what "student" means.
    // asPercent is the same rounding the meaning strip prints, so these are
    // literally the digits on the screen: 0.06, 0.43, 0.29, 0.06.
    const { before, after } = readingFor(WORD.she, 'reference');

    expect(before.pronoun).toBe(1);
    expect(before.animate).toBe(0);
    expect(before.thing).toBe(0);

    expect(dominantFeature(after)).toBe('animate');
    expect(asPercent(after.animate)).toBe(43);
    expect(asPercent(after.thing)).toBe(29);
    expect(asPercent(after.pronoun)).toBe(6);
    expect(asPercent(after.action)).toBe(6);
  });

  it('answers a different question with a different word', () => {
    // Which is the whole reason a real model runs more than one at a time —
    // the point `multi-head-attention` is built on. Here it is enough that the
    // question, not the word, decides the answer.
    expect(readingFor(WORD.carried, 'doer').strongestText).toBe('student');
    expect(
      asPercent(readingFor(WORD.carried, 'doer').weights[WORD.student]),
    ).toBe(40);

    expect(readingFor(WORD.box, 'subject-matter').strongestText).toBe(
      'carried',
    );
    expect(
      asPercent(readingFor(WORD.box, 'subject-matter').weights[WORD.carried]),
    ).toBe(22);

    // And a word with nothing the question wants is flat under it, however much
    // it has to say under another one.
    expect(readingFor(WORD.carried, 'reference').spreadsEvenly).toBe(true);
  });

  it('rounds the printed percentages, so they miss 100 in both directions', () => {
    // Said out loud in the panel, because nine numbers adding to 101 read as a
    // leaking budget otherwise — and the budget is the lesson.
    expect(printedTotal(readingFor(WORD.she, 'reference').weights)).toBe(101);
    expect(printedTotal(readingFor(BECAUSE, 'reference').weights)).toBe(99);
  });
});
