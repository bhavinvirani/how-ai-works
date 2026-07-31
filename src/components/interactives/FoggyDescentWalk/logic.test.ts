import { describe, expect, it } from 'vitest';

import {
  hasFoundTheLowest,
  LOWEST_POINT,
  lowestPoint,
  MAX_SETTING,
  MAX_STEPS,
  MIN_SETTING,
  SETTING_INCREMENT,
  stepDownhill,
  tiltAt,
  walk,
  wrongnessAt,
} from './logic';

/** Every starting point the slider can produce. */
const everyStart = (): number[] => {
  const notches = Math.round((MAX_SETTING - MIN_SETTING) / SETTING_INCREMENT);
  const starts: number[] = [];

  for (let notch = 0; notch <= notches; notch += 1) {
    starts.push(
      Math.round((MIN_SETTING + notch * SETTING_INCREMENT) * 100) / 100,
    );
  }

  return starts;
};

describe('slopeAt', () => {
  it('agrees with the terrain it claims to be the slope of', () => {
    // The instrument shows a curve and an arrow. If the arrow is worked out
    // from a different function than the curve is drawn from, the whole
    // instrument lies, and it lies plausibly.
    for (const setting of [0.05, 0.2, 0.34, 0.5, 0.66, 0.8, 0.95]) {
      const measured =
        (wrongnessAt(setting + 1e-5) - wrongnessAt(setting - 1e-5)) / 2e-5;

      expect(tiltAt(setting)).toBe(
        measured > 0 ? 'downhill-left' : 'downhill-right',
      );
    }
  });
});

describe('tiltAt', () => {
  it('reads level ground at the floor of a hollow', () => {
    expect(tiltAt(LOWEST_POINT.setting)).toBe('flat');
  });

  it('points away from the rising side', () => {
    // Just right of the deep hollow's floor, the ground climbs to the right.
    expect(tiltAt(LOWEST_POINT.setting + 0.06)).toBe('downhill-left');
    expect(tiltAt(LOWEST_POINT.setting - 0.06)).toBe('downhill-right');
  });
});

describe('stepDownhill', () => {
  it('moves against the slope rather than along it', () => {
    const setting = 0.34;
    expect(tiltAt(setting)).toBe('downhill-left');
    expect(stepDownhill(setting)).toBeLessThan(setting);
  });

  it('never walks off either end of the dial', () => {
    expect(stepDownhill(MIN_SETTING)).toBeGreaterThanOrEqual(MIN_SETTING);
    expect(stepDownhill(MAX_SETTING)).toBeLessThanOrEqual(MAX_SETTING);
  });

  /**
   * The unit claims a step downhill always lands somewhere no worse. That is a
   * claim about this terrain and this step size together — a larger step would
   * vault the walker up the far side — so it is checked across the whole dial
   * rather than at a couple of convenient points.
   */
  it('never leaves the machine more wrong than it was', () => {
    for (let index = 0; index <= 500; index += 1) {
      const setting = MIN_SETTING + ((MAX_SETTING - MIN_SETTING) * index) / 500;

      expect(wrongnessAt(stepDownhill(setting))).toBeLessThanOrEqual(
        wrongnessAt(setting),
      );
    }
  });

  it('takes shorter steps as the ground levels out', () => {
    const steep = Math.abs(stepDownhill(0.34) - 0.34);
    const gentle = Math.abs(
      stepDownhill(LOWEST_POINT.setting + 0.01) - (LOWEST_POINT.setting + 0.01),
    );

    expect(gentle).toBeLessThan(steep);
  });
});

describe('walk', () => {
  it('records the starting point as well as every step taken', () => {
    expect(walk(0.34, 5)).toHaveLength(6);
    expect(walk(0.34, 0)).toEqual([0.34]);
  });

  it('gives the same walk every time it is asked', () => {
    expect(walk(0.6, 12)).toEqual(walk(0.6, 12));
  });

  it('cannot be started off the end of the dial', () => {
    expect(walk(-3, 0)).toEqual([MIN_SETTING]);
    expect(walk(9, 0)).toEqual([MAX_SETTING]);
  });
});

describe('lowestPoint', () => {
  it('finds the deep hollow when it looks at the whole dial', () => {
    expect(LOWEST_POINT.setting).toBeGreaterThan(0.7);
    expect(LOWEST_POINT.setting).toBeLessThan(0.78);
  });

  it('finds a different, higher hollow on the left half', () => {
    const shallow = lowestPoint(MIN_SETTING, 0.45);

    expect(shallow.setting).toBeLessThan(0.35);
    expect(shallow.wrongness).toBeGreaterThan(LOWEST_POINT.wrongness + 0.3);
  });
});

/**
 * The unit's claims, pinned. Each of these is asserted in the prose, so if the
 * terrain is ever retuned the prose has to be retuned with it — which is the
 * only reason these tests are worth having.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('comes to rest from every starting point, well inside the steps offered', () => {
    for (const start of everyStart()) {
      const journey = walk(start, MAX_STEPS);

      expect(tiltAt(journey[journey.length - 1])).toBe('flat');
    }
  });

  it('sends two starts a single notch apart to different hollows', () => {
    const left = walk(0.44, MAX_STEPS);
    const right = walk(0.46, MAX_STEPS);

    const settledLeft = left[left.length - 1];
    const settledRight = right[right.length - 1];

    expect(hasFoundTheLowest(settledLeft)).toBe(false);
    expect(hasFoundTheLowest(settledRight)).toBe(true);
    expect(wrongnessAt(settledLeft)).toBeGreaterThan(
      wrongnessAt(settledRight) + 0.3,
    );
  });

  it('stops on level ground without that meaning it has arrived anywhere good', () => {
    const stuck = walk(0.44, MAX_STEPS);
    const resting = stuck[stuck.length - 1];

    expect(tiltAt(resting)).toBe('flat');
    expect(wrongnessAt(resting)).toBeGreaterThan(LOWEST_POINT.wrongness);
  });

  it('does at least get somewhere better than where it began', () => {
    for (const start of everyStart()) {
      const journey = walk(start, MAX_STEPS);

      expect(wrongnessAt(journey[journey.length - 1])).toBeLessThanOrEqual(
        wrongnessAt(start),
      );
    }
  });
});
