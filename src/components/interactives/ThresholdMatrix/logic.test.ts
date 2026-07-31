import { describe, expect, it } from 'vitest';

import {
  accuracyAt,
  alarmsRaised,
  barFor,
  bestAccuracyReading,
  countsAt,
  EAGERNESS_SETTINGS,
  firstReadingThatFindsEveryone,
  HEALTHY_TOTAL,
  ILL_TOTAL,
  MAX_EAGERNESS,
  MIN_EAGERNESS,
  precisionAt,
  readingAt,
  recallAt,
  SCREENED_TOTAL,
  verdictFor,
} from './logic';

describe('the population', () => {
  it('is a thousand people with the illness genuinely rare', () => {
    expect(SCREENED_TOTAL).toBe(1000);
    expect(ILL_TOTAL).toBe(10);
    expect(HEALTHY_TOTAL).toBe(990);
    expect(ILL_TOTAL / SCREENED_TOTAL).toBeLessThanOrEqual(0.01);
  });

  it('overlaps, so no bar separates the two groups cleanly', () => {
    // Some ill people score low and some healthy people score high. Without
    // that there would be a perfect setting, and no trade-off to teach.
    const perfect = EAGERNESS_SETTINGS.filter((eagerness) => {
      const { missed, falseAlarms } = countsAt(eagerness);
      return missed === 0 && falseAlarms === 0;
    });

    expect(perfect).toEqual([]);
  });
});

describe('barFor', () => {
  it('runs backwards to eagerness — an eager test has a low bar', () => {
    expect(barFor(MIN_EAGERNESS)).toBe(100);
    expect(barFor(MAX_EAGERNESS)).toBe(0);
  });
});

describe('countsAt', () => {
  it('always accounts for every person screened', () => {
    for (const eagerness of EAGERNESS_SETTINGS) {
      const { caught, missed, falseAlarms, cleared } = countsAt(eagerness);
      expect(caught + missed + falseAlarms + cleared).toBe(SCREENED_TOTAL);
      expect(caught + missed).toBe(ILL_TOTAL);
      expect(falseAlarms + cleared).toBe(HEALTHY_TOTAL);
    }
  });

  it('raises no alarm at all at the quiet end', () => {
    expect(countsAt(MIN_EAGERNESS)).toEqual({
      caught: 0,
      missed: ILL_TOTAL,
      falseAlarms: 0,
      cleared: HEALTHY_TOTAL,
    });
  });

  it('raises an alarm about everybody at the eager end', () => {
    expect(countsAt(MAX_EAGERNESS)).toEqual({
      caught: ILL_TOTAL,
      missed: 0,
      falseAlarms: HEALTHY_TOTAL,
      cleared: 0,
    });
  });

  it('never calls back fewer people as the test grows more eager', () => {
    let previous = -1;

    for (const eagerness of EAGERNESS_SETTINGS) {
      const alarms = alarmsRaised(countsAt(eagerness));
      expect(alarms).toBeGreaterThanOrEqual(previous);
      previous = alarms;
    }
  });
});

describe('precisionAt', () => {
  it('is undefined rather than zero when nothing is ever flagged', () => {
    expect(precisionAt(MIN_EAGERNESS)).toBeNull();
  });

  it('is the share of alarms that were worth raising', () => {
    const { caught } = countsAt(50);
    expect(precisionAt(50)).toBeCloseTo(
      caught / alarmsRaised(countsAt(50)),
      12,
    );
  });
});

describe('verdictFor', () => {
  it('names the detector that finds nobody', () => {
    expect(verdictFor(countsAt(MIN_EAGERNESS))).toBe('findsNobody');
  });

  it('names the detector that calls back the whole room', () => {
    expect(verdictFor(countsAt(MAX_EAGERNESS))).toBe('callsBackEveryone');
  });

  it('tells a partial catch from a complete one', () => {
    expect(verdictFor(countsAt(30))).toBe('findsSome');
    expect(verdictFor(countsAt(80))).toBe('findsEveryone');
  });
});

describe('bestAccuracyReading', () => {
  it('is never beaten by any other setting on the dial', () => {
    const best = bestAccuracyReading();

    for (const eagerness of EAGERNESS_SETTINGS) {
      expect(accuracyAt(eagerness)).toBeLessThanOrEqual(best.accuracy);
    }
  });

  it('reports counts that match the setting it names', () => {
    const best = bestAccuracyReading();
    expect(best.counts).toEqual(countsAt(best.eagerness));
  });
});

/**
 * The unit's argument, pinned as counted facts rather than as prose.
 *
 * The MDX quotes 99.0, 99.1, 90.9 and 74.0 per cent, and says the best-scoring
 * setting on the dial finds two ill people in ten. If the population is ever
 * edited so that any of that stops being true, the instrument would quietly
 * start contradicting the paragraph beside it — and nothing else in the build
 * would notice.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('scores 99 per cent while finding nobody at all', () => {
    const doNothing = readingAt(MIN_EAGERNESS);

    expect(doNothing.counts.caught).toBe(0);
    expect(doNothing.recall).toBe(0);
    expect(doNothing.accuracy).toBeCloseTo(0.99, 10);
  });

  it('hides its best score behind a detector that misses most of them', () => {
    const best = bestAccuracyReading();

    expect(best.accuracy).toBeCloseTo(0.991, 10);
    expect(best.counts.caught).toBe(2);
    expect(best.counts.caught).toBeLessThan(ILL_TOTAL / 2);
    // And it beats doing nothing, so a team optimising accuracy lands here.
    expect(best.accuracy).toBeGreaterThan(accuracyAt(MIN_EAGERNESS));
  });

  it('punishes the accuracy of the setting that saves everybody', () => {
    const everyone = firstReadingThatFindsEveryone();

    expect(everyone?.counts.caught).toBe(ILL_TOTAL);
    expect(everyone?.accuracy).toBeCloseTo(0.74, 10);
    expect(everyone?.accuracy).toBeLessThan(accuracyAt(MIN_EAGERNESS));
  });

  it('holds the figure the prose quotes for nine catches in ten', () => {
    const nine = readingAt(60);

    expect(nine.counts.caught).toBe(9);
    expect(nine.accuracy).toBeCloseTo(0.909, 10);
  });

  it('never lets both mistakes fall together', () => {
    // Recall can only climb as the test grows eager, and every climb is paid
    // for in precision. That is the trade-off, counted rather than asserted.
    for (let index = 1; index < EAGERNESS_SETTINGS.length; index++) {
      const before = EAGERNESS_SETTINGS[index - 1];
      const after = EAGERNESS_SETTINGS[index];

      expect(recallAt(after)).toBeGreaterThanOrEqual(recallAt(before));

      const precisionBefore = precisionAt(before);
      const precisionAfter = precisionAt(after);

      if (precisionBefore !== null && precisionAfter !== null) {
        expect(precisionAfter).toBeLessThan(precisionBefore);
      }
    }
  });

  it('is deterministic — the same setting always fills the same four boxes', () => {
    expect(readingAt(40)).toEqual(readingAt(40));
    expect(countsAt(70)).toEqual(countsAt(70));
  });
});
