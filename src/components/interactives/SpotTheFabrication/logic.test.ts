import { describe, expect, it } from 'vitest';

import {
  ANSWER_LABEL,
  ANSWER_TEXT,
  QUESTION_TEXT,
  SOURCE_TEXT,
  TRACE,
} from './data.en';
import {
  accusedBy,
  ANSWERS,
  answerById,
  countFigures,
  countHedges,
  countWords,
  INVENTED,
  isRight,
  MEASURES,
  profile,
  sitsInTheMiddle,
  SOURCE_LINE_IDS,
  TELLS,
} from './logic';

describe('the passage and the four answers', () => {
  it('gives every answer an id of its own', () => {
    const ids = new Set(ANSWERS.map((answer) => answer.id));
    expect(ids.size).toBe(ANSWERS.length);
  });

  it('finds an answer by id, and refuses one that does not exist', () => {
    expect(answerById('award').invented).toBe(true);
    // @ts-expect-error — the guard exists for data edits, not for callers.
    expect(() => answerById('nonsense')).toThrow();
  });

  it('only ever cites lines the passage actually has', () => {
    const lines = new Set(SOURCE_LINE_IDS);

    for (const answer of ANSWERS) {
      expect(answer.supports.length).toBeGreaterThan(0);
      for (const line of answer.supports) expect(lines.has(line)).toBe(true);
    }
  });

  it('has a line of English for every id in either list', () => {
    for (const line of SOURCE_LINE_IDS) {
      expect(SOURCE_TEXT[line].length).toBeGreaterThan(0);
    }

    for (const answer of ANSWERS) {
      expect(QUESTION_TEXT[answer.id].length).toBeGreaterThan(0);
      expect(ANSWER_TEXT[answer.id].length).toBeGreaterThan(0);
      expect(ANSWER_LABEL[answer.id].length).toBeGreaterThan(0);
      expect(TRACE[answer.id].length).toBeGreaterThan(0);
    }
  });
});

describe('measuring a piece of writing', () => {
  it('counts hedging words and leaves everything else alone', () => {
    expect(countHedges('It closes in August.')).toBe(0);
    expect(countHedges('It probably closes in about August.')).toBe(2);
  });

  it('is not fooled by a hedge hiding inside a longer word', () => {
    // "Maker" contains "may"; "roundel" contains "round" but not "around".
    expect(countHedges('The Small Maker award, on a roundel.')).toBe(0);
  });

  it('counts runs of digits rather than characters', () => {
    expect(countFigures('opened 1971, award 2014')).toBe(2);
    expect(countFigures('opened in the seventies')).toBe(0);
  });

  it('counts words the way a reader eyeballs length', () => {
    expect(countWords('four words go here')).toBe(4);
    expect(countWords('   ')).toBe(0);
  });

  it('reports all three measures together', () => {
    expect(profile('It probably opened in 1971.')).toEqual({
      hedges: 1,
      figures: 1,
      words: 5,
    });
  });
});

describe('isRight', () => {
  it('counts only the invented answer as the right accusation', () => {
    for (const answer of ANSWERS) {
      expect(isRight(answer.id)).toBe(answer.invented);
    }
  });
});

describe('accusedBy', () => {
  it('lands on the extreme of the measure it reads', () => {
    expect(accusedBy('longest', ANSWER_TEXT)).toBe('timbers');
    expect(accusedBy('shortest', ANSWER_TEXT)).toBe('summer');
  });

  it('breaks a tie towards the first answer declared', () => {
    // `timbers` and `summer` both hedge not at all; `timbers` is declared first.
    expect(profile(ANSWER_TEXT.timbers).hedges).toBe(0);
    expect(profile(ANSWER_TEXT.summer).hedges).toBe(0);
    expect(accusedBy('fewest-hedges', ANSWER_TEXT)).toBe('timbers');
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim the page makes about this instrument is checked here, so that
 * rewriting an answer — making the invented one a little longer, or taking the
 * hedge out of it — fails the build instead of quietly turning the surrounding
 * paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('is one invented answer among four, over a passage of five lines', () => {
    expect(ANSWERS.length).toBe(4);
    expect(SOURCE_LINE_IDS.length).toBe(5);
    expect(ANSWERS.filter((answer) => answer.invented)).toEqual([INVENTED]);
  });

  it('builds the invented answer out of the passage too, like the other three', () => {
    // The fabrication is one clause inside an otherwise sourced answer, not a
    // contradiction of the passage. An answer that fought the passage would be
    // findable by skimming, which is the opposite of the lesson.
    expect(INVENTED.supports).toEqual(['prize']);
    expect(INVENTED.supports.length).toBeGreaterThan(0);
  });

  it('leaves the invented answer in the middle of every measure of its writing', () => {
    // The prose: "not the most certain of the four, not the most specific and
    // not the longest — it sits in the middle of all three."
    for (const measure of MEASURES) {
      expect(sitsInTheMiddle(INVENTED.id, measure, ANSWER_TEXT)).toBe(true);
    }
  });

  it('accuses an answer that is true, whichever way the writing is read', () => {
    for (const tell of TELLS) {
      expect(accusedBy(tell, ANSWER_TEXT)).not.toBe(INVENTED.id);
      expect(isRight(accusedBy(tell, ANSWER_TEXT))).toBe(false);
    }
  });

  it('offers six readings, which is the number the panel and the prose both count', () => {
    expect(TELLS.length).toBe(6);
  });

  it('makes the answer that looks most suspicious a true one, at both ends', () => {
    // `building` hedges most AND gives the most figures — the two things a
    // reader treats as opposite giveaways — and every word of it is sound.
    expect(accusedBy('most-hedges', ANSWER_TEXT)).toBe('building');
    expect(accusedBy('most-figures', ANSWER_TEXT)).toBe('building');
    expect(answerById('building').invented).toBe(false);
  });

  it('holds the exact counts the prose and the data header both quote', () => {
    expect(profile(ANSWER_TEXT.timbers)).toEqual({
      hedges: 0,
      figures: 0,
      words: 44,
    });
    expect(profile(ANSWER_TEXT.building)).toEqual({
      hedges: 3,
      figures: 2,
      words: 35,
    });
    expect(profile(ANSWER_TEXT.award)).toEqual({
      hedges: 1,
      figures: 1,
      words: 29,
    });
    expect(profile(ANSWER_TEXT.summer)).toEqual({
      hedges: 0,
      figures: 0,
      words: 24,
    });
  });

  it('keeps the clause the unit quotes inside the invented answer', () => {
    // The unit prints this clause and says every part of it is made of things
    // the passage does contain, arranged around a fact it does not.
    expect(ANSWER_TEXT.award).toContain(
      'the second Fenner Street workshop to take the award and the first for about twenty years',
    );
    expect(SOURCE_TEXT.prize).toContain('Small Maker of the Year');
    expect(SOURCE_TEXT.origin).toContain('Fenner Street');
    expect(SOURCE_TEXT.prize).not.toContain('second');
  });

  it('keeps the arithmetic the unit uses to tell inference from invention', () => {
    // The unit: "Its 1930 is not written in the passage, but the passage gives
    // 1971 and forty years, and 1930 is what you get by subtracting."
    expect(ANSWER_TEXT.building).toContain('1930');
    expect(SOURCE_TEXT.origin).toContain('1971');
    expect(SOURCE_TEXT.origin).toContain('forty years');

    for (const line of SOURCE_LINE_IDS) {
      expect(SOURCE_TEXT[line]).not.toContain('1930');
    }
  });

  it('never lets an accusation be checked against nothing', () => {
    // Every answer the reader can accuse has a written explanation waiting,
    // including the three they will be wrong about.
    for (const answer of ANSWERS) {
      expect(TRACE[answer.id].length).toBeGreaterThan(40);
    }
  });
});
