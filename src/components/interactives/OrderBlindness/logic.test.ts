import { describe, expect, it } from 'vitest';

import { WORD } from '../shared/attention/sentences.en';
import {
  arrange,
  arrangementOrder,
  AS_WRITTEN,
  asPercent,
  compare,
  DEFAULT_FOCUS,
  DEFAULT_HEAD_ID,
  EVEN_SHARE,
  FEATURES,
  HEAD_IDS,
  headById,
  SENTENCE,
  slotOf,
  spreadEvenly,
  wordAt,
} from './logic';

const off = (headId: string, focusIndex: number) =>
  compare({ headId, focusIndex, shuffled: true, positional: false });

const on = (headId: string, focusIndex: number) =>
  compare({ headId, focusIndex, shuffled: true, positional: true });

describe('the two arrangements', () => {
  it('leaves the sentence alone in reading order', () => {
    expect(arrangementOrder(false)).toEqual(AS_WRITTEN);
    expect(arrange(false).map((token) => token.text)).toEqual(
      SENTENCE.map((token) => token.text),
    );
  });

  it('shuffles the same nine words rather than changing any of them', () => {
    const shuffled = arrange(true).map((token) => token.text);

    expect(shuffled).toHaveLength(SENTENCE.length);
    expect([...shuffled].sort()).toEqual(
      SENTENCE.map((token) => token.text).sort(),
    );
  });

  it('actually moves them', () => {
    expect(arrange(true).map((token) => token.text)).not.toEqual(
      SENTENCE.map((token) => token.text),
    );
  });

  it('is the scramble the unit prints on the page', () => {
    expect(
      arrange(true)
        .map((token) => token.text)
        .join(' '),
    ).toBe('she box The strong carried student was the because');
  });
});

describe('slotOf', () => {
  it('finds every word again after the shuffle', () => {
    for (let index = 0; index < SENTENCE.length; index += 1) {
      expect(arrangementOrder(true)[slotOf(true, index)]).toBe(index);
      expect(slotOf(false, index)).toBe(index);
    }
  });

  it('refuses a word that is not in the sentence', () => {
    expect(() => slotOf(true, 99)).toThrow();
  });
});

describe('headById', () => {
  it('finds each of the four heads', () => {
    for (const id of HEAD_IDS) expect(headById(id).id).toBe(id);
  });

  it('refuses a head nobody built', () => {
    expect(() => headById('vibes')).toThrow();
  });
});

describe('spreadEvenly', () => {
  it('recognises a row with nothing to prefer', () => {
    expect(spreadEvenly([0.25, 0.25, 0.25, 0.25])).toBe(true);
    expect(spreadEvenly([0.3, 0.25, 0.25, 0.2])).toBe(false);
  });

  it('has nothing to say about an empty row', () => {
    expect(spreadEvenly([])).toBe(false);
  });
});

describe('where the instrument opens', () => {
  it('starts on a head that exists and a word in the sentence', () => {
    expect(HEAD_IDS).toContain(DEFAULT_HEAD_ID);
    expect(wordAt(DEFAULT_FOCUS)).toBe('she');
  });
});

describe('compare', () => {
  it('spends exactly one unit of attention in both rows', () => {
    for (const headId of HEAD_IDS) {
      for (const positional of [false, true]) {
        for (const shuffled of [false, true]) {
          const reading = compare({
            headId,
            focusIndex: WORD.carried,
            shuffled,
            positional,
          });

          const total = (row: readonly number[]) =>
            row.reduce((sum, weight) => sum + weight, 0);

          expect(total(reading.writtenWeights)).toBeCloseTo(1, 12);
          expect(total(reading.arrangedWeights)).toBeCloseTo(1, 12);
        }
      }
    }
  });

  it('follows the watched word into whichever slot it landed in', () => {
    const reading = off('reference', WORD.she);

    expect(reading.arrangedFocus).toBe(slotOf(true, WORD.she));
    expect(reading.arranged[reading.arrangedFocus]?.text).toBe('she');
  });

  it('compares a row against itself when nothing has been shuffled', () => {
    const reading = compare({
      headId: 'reference',
      focusIndex: WORD.she,
      shuffled: false,
      positional: true,
    });

    expect(reading.arrangedWeights).toEqual(reading.writtenWeights);
    expect(reading.identical).toBe(true);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number the page quotes is checked here, so an edit to the sentence, to
 * the features, or to a head's weights fails the build instead of quietly
 * turning the surrounding paragraphs into fiction. The four-decimal assertions
 * look fussy on purpose: the claim being made is "identical, digit for digit",
 * and a test that only checked two places would let rounding pass for it.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('has every word compute an identical meaning in both arrangements', () => {
    // Not nearly identical. Identical — because nothing in the arithmetic ever
    // refers to which word came first, so the shuffle has nothing to disturb.
    for (const headId of HEAD_IDS) {
      for (let index = 0; index < SENTENCE.length; index += 1) {
        const reading = off(headId, index);

        expect(reading.identical).toBe(true);
        for (const feature of FEATURES) {
          expect(reading.arrangedBlend[feature]).toBeCloseTo(
            reading.writtenBlend[feature],
            12,
          );
        }
      }
    }
  });

  it('moves each weight with its word without changing the weight', () => {
    // What the reader watches: 43% travels from one chip to another while the
    // numbers underneath refuse to move. Both halves of that have to be true.
    for (const headId of HEAD_IDS) {
      const reading = off(headId, WORD.she);

      for (const [slot, from] of arrangementOrder(true).entries()) {
        expect(reading.arrangedWeights[slot]).toBeCloseTo(
          reading.writtenWeights[from],
          12,
        );
      }
    }
  });

  it('quotes 43 per cent on “student” from both arrangements', () => {
    const reading = off('reference', WORD.she);

    expect(asPercent(reading.writtenWeights[WORD.student])).toBe(43);
    expect(asPercent(reading.arrangedWeights[slotOf(true, WORD.student)])).toBe(
      43,
    );
  });

  it('prints the same four numbers for “she” in both rows', () => {
    const reading = off('reference', WORD.she);
    const printed = ['0.0576', '0.4321', '0.2943', '0.0576'];

    expect(
      FEATURES.map((feature) => reading.writtenBlend[feature].toFixed(4)),
    ).toEqual(printed);
    expect(
      FEATURES.map((feature) => reading.arrangedBlend[feature].toFixed(4)),
    ).toEqual(printed);
  });

  it('pulls those numbers apart the moment position is stamped in', () => {
    const reading = on('reference', WORD.she);

    expect(reading.identical).toBe(false);
    expect(reading.writtenBlend.animate.toFixed(4)).toBe('0.3457');
    expect(reading.arrangedBlend.animate.toFixed(4)).toBe('0.3679');
  });

  it('has a fourth head that is flat and useless without position', () => {
    // The honest one. It has no content rules at all, so every word it looks
    // at produces a nine-way tie: 11 per cent each, in both arrangements.
    expect(asPercent(EVEN_SHARE)).toBe(11);

    for (let index = 0; index < SENTENCE.length; index += 1) {
      const reading = off('previous-word', index);

      expect(reading.writtenSpread).toBe(true);
      expect(reading.arrangedSpread).toBe(true);
      for (const weight of reading.writtenWeights) {
        expect(asPercent(weight)).toBe(11);
      }
    }
  });

  it('locks that head onto the word before as soon as position arrives', () => {
    // And onto a *different* word in the shuffle, which is the clearest
    // evidence in the Part that position is doing work rather than decorating.
    const reading = on('previous-word', WORD.box);

    expect(reading.writtenSpread).toBe(false);
    expect(reading.writtenLeansOn).toBe(wordAt(WORD.box - 1));
    expect(reading.writtenLeansOn).toBe('the');
    expect(asPercent(reading.writtenWeights[WORD.box - 1])).toBe(91);

    expect(reading.arrangedLeansOn).toBe('she');
    expect(asPercent(reading.arrangedWeights[reading.arrangedFocus - 1])).toBe(
      92,
    );
    expect(reading.identical).toBe(false);
  });
});
