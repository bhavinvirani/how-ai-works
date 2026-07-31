import { describe, expect, it } from 'vitest';

import { bestDials, HOUSES, predict, residuals, wrongness } from './logic';

describe('predict', () => {
  it('is size times the first dial plus the second', () => {
    expect(predict({ perSquareMetre: 2, base: 10 }, 50)).toBe(110);
  });

  it('returns the base when the size is zero', () => {
    expect(predict({ perSquareMetre: 2.5, base: 12 }, 0)).toBe(12);
  });
});

describe('wrongness', () => {
  it('is zero when every guess lands exactly', () => {
    const straight = [
      { size: 10, price: 30 },
      { size: 20, price: 50 },
    ];
    expect(wrongness({ perSquareMetre: 2, base: 10 }, straight)).toBe(0);
  });

  it('averages the distances rather than summing them', () => {
    const houses = [
      { size: 0, price: 10 },
      { size: 0, price: 20 },
    ];
    // Guesses 0 for both: off by 10 and by 20, so 15 on average.
    expect(wrongness({ perSquareMetre: 0, base: 0 }, houses)).toBe(15);
  });

  it('treats guessing too high and too low as equally wrong', () => {
    const houses = [{ size: 0, price: 100 }];
    const high = wrongness({ perSquareMetre: 0, base: 120 }, houses);
    const low = wrongness({ perSquareMetre: 0, base: 80 }, houses);
    expect(high).toBe(low);
  });

  it('has no houses to be wrong about when given none', () => {
    expect(wrongness({ perSquareMetre: 3, base: 0 }, [])).toBe(0);
  });
});

describe('residuals', () => {
  it('signs the error so too-high and too-low are distinguishable', () => {
    const [only] = residuals({ perSquareMetre: 0, base: 120 }, [
      { size: 0, price: 100 },
    ]);
    expect(only.error).toBe(20);
  });
});

/**
 * The unit's claim is that turning two dials by hand gets you close but never
 * to nothing, and that something searching blindly can do at least as well.
 * Both halves are asserted in the prose, so both are pinned here.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('cannot be tuned to zero — the examples do not sit on one line', () => {
    expect(bestDials().wrongness).toBeGreaterThan(0);
  });

  it('is still a good fit, so the reader sees tuning genuinely work', () => {
    // Under £15k of average error across houses selling for £132k–£352k.
    expect(bestDials().wrongness).toBeLessThan(15);
  });

  it('beats any hand-picked setting a reader is likely to land on', () => {
    const best = bestDials().wrongness;
    const guesses = [
      { perSquareMetre: 1, base: 0 },
      { perSquareMetre: 2.5, base: 20 },
      { perSquareMetre: 3, base: 0 },
      { perSquareMetre: 4, base: -40 },
    ];

    for (const dials of guesses) {
      expect(wrongness(dials, HOUSES)).toBeGreaterThanOrEqual(best);
    }
  });
});
