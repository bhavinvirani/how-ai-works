import { describe, expect, it } from 'vitest';

import { PAIRS } from './data.en';
import {
  bare,
  differingPositions,
  indexOfWord,
  markUp,
  PAIR_IDS,
  pronounIndex,
  readSoFar,
  referent,
  SLOTS,
  swapDistance,
  swappedWord,
  swapPosition,
  undecidedAtPronoun,
  wordsOf,
} from './logic';

const everyPair = PAIR_IDS.map((id) => PAIRS[id]);

describe('wordsOf', () => {
  it('cuts a sentence at the spaces', () => {
    expect(wordsOf('one two three')).toEqual(['one', 'two', 'three']);
  });

  it('leaves punctuation attached to the word it belongs to', () => {
    expect(wordsOf('Stop. Now go.')).toEqual(['Stop.', 'Now', 'go.']);
  });
});

describe('bare', () => {
  it('drops punctuation at either end', () => {
    expect(bare('empty.')).toBe('empty');
    expect(bare('“it”')).toBe('it');
  });

  it('keeps punctuation inside a word', () => {
    expect(bare("don't,")).toBe("don't");
  });

  it('ignores capitals, so a word at the start of a sentence still matches', () => {
    expect(bare('Rosa')).toBe(bare('rosa'));
  });
});

describe('indexOfWord', () => {
  it('finds the first place a word appears', () => {
    expect(indexOfWord(['the', 'pan', 'and', 'the', 'bowl'], 'the')).toBe(0);
  });

  it('says -1 rather than guessing when the word is not there', () => {
    expect(indexOfWord(['a', 'b'], 'c')).toBe(-1);
  });

  it('matches whole words only, so "van" is not found inside "caravan"', () => {
    expect(indexOfWord(['the', 'caravan'], 'van')).toBe(-1);
  });
});

describe('the three pairs', () => {
  it('names two different things the pronoun could mean', () => {
    for (const pair of everyPair) {
      expect(pair.candidates[0].word).not.toBe(pair.candidates[1].word);
    }
  });

  it('puts the pronoun and both candidates in both sentences', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        const words = wordsOf(pair.readings[slot].sentence);

        expect(indexOfWord(words, pair.pronoun)).toBeGreaterThanOrEqual(0);
        expect(indexOfWord(words, pair.candidates[0].word)).toBeGreaterThan(-1);
        expect(indexOfWord(words, pair.candidates[1].word)).toBeGreaterThan(-1);
      }
    }
  });

  it('is deterministic — the same pair and ending always read the same way', () => {
    for (const pair of everyPair) {
      expect(markUp(pair, 'a', false)).toEqual(markUp(pair, 'a', false));
      expect(referent(pair, 'a')).toBe(referent(pair, 'a'));
    }
  });
});

describe('referent', () => {
  it('picks a different thing for each of the two endings', () => {
    for (const pair of everyPair) {
      expect(referent(pair, 'a')).not.toBe(referent(pair, 'b'));
    }
  });
});

describe('swapPosition and swappedWord', () => {
  it('reports one position per pair, and names the word sitting there', () => {
    for (const pair of everyPair) {
      const at = swapPosition(pair);

      expect(at).toBeGreaterThan(-1);

      for (const slot of SLOTS) {
        const words = wordsOf(pair.readings[slot].sentence);
        expect(swappedWord(pair, slot)).toBe(bare(words[at] ?? ''));
      }
    }
  });

  it('gives the two endings different words', () => {
    for (const pair of everyPair) {
      expect(swappedWord(pair, 'a')).not.toBe(swappedWord(pair, 'b'));
    }
  });
});

describe('markUp', () => {
  it('marks exactly one pronoun and exactly one swapped word', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        const words = markUp(pair, slot, false);

        expect(words.filter((word) => word.role === 'pronoun')).toHaveLength(1);
        expect(words.filter((word) => word.role === 'swapped')).toHaveLength(1);
      }
    }
  });

  it('marks exactly one of the two candidates as the one meant', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        const chosen = markUp(pair, slot, false).filter((word) => word.chosen);

        expect(chosen).toHaveLength(1);
        expect(bare(chosen[0]?.text ?? '')).toBe(
          bare(referent(pair, slot).word),
        );
      }
    }
  });

  it('leaves every word before the pronoun readable when stopped there', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        const stop = pronounIndex(pair, slot);

        markUp(pair, slot, true).forEach((word, index) => {
          expect(word.unread).toBe(index > stop);
        });
      }
    }
  });

  it('hides nothing at all when the reader is not stopped', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        expect(markUp(pair, slot, false).some((word) => word.unread)).toBe(
          false,
        );
      }
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim `why-language-is-hard.mdx` makes about this instrument is
 * checked here, so an edit to a sentence that quietly falsifies the surrounding
 * paragraphs fails the build instead of shipping. The claims are: one word
 * changes, it is the last word, it comes after the pronoun, everything up to
 * the pronoun is identical, and the answer flips anyway.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('changes exactly one word between a pair of sentences', () => {
    for (const pair of everyPair) {
      expect(differingPositions(pair)).toHaveLength(1);
    }
  });

  it('puts the word that changes after the pronoun it rewrites, never before', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        expect(swapPosition(pair)).toBeGreaterThan(pronounIndex(pair, slot));
        expect(swapDistance(pair, slot)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('makes that word the last word of the sentence, as the panel claims', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        const words = wordsOf(pair.readings[slot].sentence);
        expect(swapPosition(pair)).toBe(words.length - 1);
      }
    }
  });

  it('names both candidates before the pronoun turns up, so neither is a surprise', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        const words = wordsOf(pair.readings[slot].sentence);
        const stop = pronounIndex(pair, slot);

        expect(indexOfWord(words, pair.candidates[0].word)).toBeLessThan(stop);
        expect(indexOfWord(words, pair.candidates[1].word)).toBeLessThan(stop);
      }
    }
  });

  it('leaves the reader identical evidence and a different answer', () => {
    for (const pair of everyPair) {
      expect(readSoFar(pair, 'a')).toEqual(readSoFar(pair, 'b'));
      expect(pair.readings.a.refersTo).not.toBe(pair.readings.b.refersTo);
      expect(undecidedAtPronoun(pair)).toBe(true);
    }
  });

  it('shows the reader nothing new when they flip the ending while stopped', () => {
    for (const pair of everyPair) {
      const visible = (slot: 'a' | 'b') =>
        markUp(pair, slot, true)
          .filter((word) => !word.unread)
          .map((word) => `${word.text}:${word.role}`);

      expect(visible('a')).toEqual(visible('b'));
    }
  });

  it('refuses to name a referent while the reader is stopped at the pronoun', () => {
    for (const pair of everyPair) {
      for (const slot of SLOTS) {
        expect(markUp(pair, slot, true).some((word) => word.chosen)).toBe(
          false,
        );
      }
    }
  });

  it('offers the three pairs the prose counts, and the pan-and-bowl reading it quotes', () => {
    expect(PAIR_IDS).toHaveLength(3);

    const soup = PAIRS.soup;
    expect(swappedWord(soup, 'a')).toBe('empty');
    expect(referent(soup, 'a').name).toBe('the pan');
    expect(swappedWord(soup, 'b')).toBe('full');
    expect(referent(soup, 'b').name).toBe('the bowl');
  });

  it('never lets grammar alone settle it — the two sentences have the same shape', () => {
    for (const pair of everyPair) {
      const shape = (slot: 'a' | 'b') =>
        wordsOf(pair.readings[slot].sentence).length;

      expect(shape('a')).toBe(shape('b'));
      expect(pronounIndex(pair, 'a')).toBe(pronounIndex(pair, 'b'));
    }
  });
});
