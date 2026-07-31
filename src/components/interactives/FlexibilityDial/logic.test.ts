import { describe, expect, it } from 'vitest';

import {
  averageMiss,
  BEST_DIALS,
  clampDials,
  DIAL_COUNTS,
  MAX_DIALS,
  MIN_DIALS,
  missOnStudied,
  missOnUnseen,
  predict,
  STUDIED_SALES,
  UNSEEN_SALES,
  verdictFor,
} from './logic';

describe('the two piles of sales', () => {
  it('offers at most one dial per sale the machine studied', () => {
    expect(MIN_DIALS).toBe(2);
    expect(MAX_DIALS).toBe(STUDIED_SALES.length);
  });

  it('never tests the machine on a house it was tuned on', () => {
    const studied = new Set(STUDIED_SALES.map((sale) => sale.size));

    for (const sale of UNSEEN_SALES) {
      expect(studied.has(sale.size)).toBe(false);
    }
  });

  it('draws both piles from the same stretch of street', () => {
    const sizes = STUDIED_SALES.map((sale) => sale.size);
    const lowest = Math.min(...sizes);
    const highest = Math.max(...sizes);

    for (const sale of UNSEEN_SALES) {
      expect(sale.size).toBeGreaterThanOrEqual(lowest);
      expect(sale.size).toBeLessThanOrEqual(highest);
    }
  });
});

describe('clampDials', () => {
  it('refuses fewer dials than a straight line needs', () => {
    expect(clampDials(0)).toBe(MIN_DIALS);
    expect(clampDials(-4)).toBe(MIN_DIALS);
  });

  it('refuses more dials than there are sales', () => {
    expect(clampDials(400)).toBe(MAX_DIALS);
  });

  it('takes whole dials only', () => {
    expect(clampDials(4.4)).toBe(4);
    expect(clampDials(4.6)).toBe(5);
  });
});

describe('predict', () => {
  it('draws a straight line on two dials', () => {
    const low = predict(40, 2);
    const middle = predict(80, 2);
    const high = predict(120, 2);

    expect(middle - low).toBeCloseTo(high - middle, 6);
  });

  it('stops being straight as soon as there is a third dial', () => {
    const low = predict(40, 3);
    const middle = predict(80, 3);
    const high = predict(120, 3);

    expect(middle - low).not.toBeCloseTo(high - middle, 6);
  });

  it('has bigger houses costing more', () => {
    expect(predict(120, BEST_DIALS)).toBeGreaterThan(predict(50, BEST_DIALS));
  });

  it('is deterministic — the same setting always draws the same line', () => {
    expect(predict(77, 5)).toBe(predict(77, 5));
    expect(predict(77, 5)).not.toBe(predict(77, 6));
  });

  it('ignores a setting off either end of the slider', () => {
    expect(predict(77, 0)).toBe(predict(77, MIN_DIALS));
    expect(predict(77, 99)).toBe(predict(77, MAX_DIALS));
  });
});

describe('averageMiss', () => {
  it('has nothing to say about an empty pile', () => {
    expect(averageMiss([], 4)).toBe(0);
  });

  it('is a distance, so it is never negative', () => {
    for (const dials of DIAL_COUNTS) {
      expect(missOnStudied(dials)).toBeGreaterThanOrEqual(0);
      expect(missOnUnseen(dials)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('verdictFor', () => {
  it('has a word for every setting on the slider', () => {
    for (const dials of DIAL_COUNTS) {
      expect(verdictFor(dials)).toMatch(
        /^(too-stiff|about-right|drifting|memorising)$/,
      );
    }
  });

  it('calls the stiffest machine too stiff', () => {
    expect(verdictFor(MIN_DIALS)).toBe('too-stiff');
  });

  it('calls the setting that does best on new sales about right', () => {
    expect(verdictFor(BEST_DIALS)).toBe('about-right');
  });

  it('calls one dial per sale memorising', () => {
    expect(verdictFor(MAX_DIALS)).toBe('memorising');
  });

  it('has a word for the settings that are already going wrong', () => {
    expect(DIAL_COUNTS.some((dials) => verdictFor(dials) === 'drifting')).toBe(
      true,
    );
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim the page makes about this instrument is checked here, so a
 * later edit to either table of sales fails the build instead of quietly
 * turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('scores perfectly on what it studied once it has a dial per sale', () => {
    expect(missOnStudied(MAX_DIALS)).toBeCloseTo(0, 6);

    for (const sale of STUDIED_SALES) {
      expect(predict(sale.size, MAX_DIALS)).toBeCloseTo(sale.price, 6);
    }
  });

  it('is at its very worst on new sales at exactly that setting', () => {
    const worst = DIAL_COUNTS.reduce((left, right) =>
      missOnUnseen(left) > missOnUnseen(right) ? left : right,
    );

    expect(worst).toBe(MAX_DIALS);
    expect(missOnUnseen(MAX_DIALS)).toBeGreaterThan(
      missOnUnseen(BEST_DIALS) * 10,
    );
  });

  it('fails at the stiff end too, so only the middle survives', () => {
    expect(BEST_DIALS).toBeGreaterThan(MIN_DIALS);
    expect(BEST_DIALS).toBeLessThan(MAX_DIALS);
    expect(missOnUnseen(MIN_DIALS)).toBeGreaterThan(
      missOnUnseen(BEST_DIALS) * 2,
    );
    expect(missOnStudied(MIN_DIALS)).toBeGreaterThan(
      missOnStudied(BEST_DIALS) * 1.9,
    );
  });

  it('makes every ruinous setting look like an improvement from inside', () => {
    for (const dials of DIAL_COUNTS.filter((count) => count > BEST_DIALS)) {
      expect(missOnStudied(dials)).toBeLessThan(missOnStudied(BEST_DIALS));
      expect(missOnUnseen(dials)).toBeGreaterThan(missOnUnseen(BEST_DIALS));
    }
  });

  it('quotes the four numbers the prose and the diagram both use', () => {
    // MemoriseVsUnderstand.astro writes these on the page as £10,000, £9,000,
    // £0 and £164,000. They are the same two fits, sampled at build time.
    expect(Math.round(missOnStudied(3))).toBe(10);
    expect(Math.round(missOnUnseen(3))).toBe(9);
    expect(Math.round(missOnStudied(12))).toBe(0);
    expect(Math.round(missOnUnseen(12))).toBe(164);
  });
});
