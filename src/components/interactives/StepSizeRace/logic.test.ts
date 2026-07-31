import { describe, expect, it } from 'vitest';

import {
  classify,
  countCrossings,
  FLOOR,
  HUGE_STEP,
  leader,
  MAX_STEPS,
  race,
  remainingPercent,
  slope,
  START,
  TINY_STEP,
  walk,
  wrongness,
  yourRunner,
} from './logic';

const finalWrongness = (stepSize: number, steps = MAX_STEPS) => {
  const trail = walk(stepSize, steps);
  return trail[trail.length - 1].wrongness;
};

describe('the hill', () => {
  it('is least wrong at the bottom', () => {
    expect(wrongness(FLOOR)).toBe(0);
  });

  it('is equally wrong the same distance either side', () => {
    expect(wrongness(FLOOR - 0.2)).toBeCloseTo(wrongness(FLOOR + 0.2), 12);
  });

  it('is flat at the bottom and steeper the further out you stand', () => {
    expect(slope(FLOOR)).toBe(0);
    expect(Math.abs(slope(0.1))).toBeGreaterThan(Math.abs(slope(0.4)));
  });

  it('points downhill in opposite directions on the two slopes', () => {
    expect(slope(0.2)).toBeLessThan(0);
    expect(slope(0.8)).toBeGreaterThan(0);
  });
});

describe('walk', () => {
  it('records the starting position before any step is taken', () => {
    const trail = walk(0.3, 0);
    expect(trail).toHaveLength(1);
    expect(trail[0].position).toBe(START);
  });

  it('leaves one footprint per step while it stays on the hill', () => {
    expect(walk(0.3, 5)).toHaveLength(6);
  });

  it('moves downhill, not uphill, for a modest step', () => {
    const trail = walk(0.1, 1);
    expect(trail[1].wrongness).toBeLessThan(trail[0].wrongness);
  });

  it('stops the moment a runner leaves the hill', () => {
    const trail = walk(1.3, MAX_STEPS);
    expect(trail.length).toBeLessThan(MAX_STEPS + 1);
    expect(trail[trail.length - 1].offHill).toBe(true);
  });

  it('never wanders off with a step size inside the safe band', () => {
    for (const stepSize of [0.05, 0.2, 0.5, 0.8, 0.95]) {
      expect(walk(stepSize, 60).some((footprint) => footprint.offHill)).toBe(
        false,
      );
    }
  });
});

describe('countCrossings', () => {
  it('counts nothing when the runner stays on one side', () => {
    expect(countCrossings(walk(TINY_STEP, MAX_STEPS))).toBe(0);
  });

  it('counts one crossing per overshoot', () => {
    expect(countCrossings(walk(HUGE_STEP, 4))).toBe(4);
  });
});

describe('classify', () => {
  it('says nothing has happened before the first step', () => {
    expect(classify(walk(0.3, 0))).toBe('waiting');
  });

  it('calls a tiny step a crawl, however patient it looks', () => {
    expect(classify(walk(TINY_STEP, MAX_STEPS))).toBe('crawling');
  });

  it('calls a well-chosen step settled', () => {
    expect(classify(walk(0.3, MAX_STEPS))).toBe('settled');
  });

  it('still settles when the step overshoots but shrinks each time', () => {
    // Above the point where it starts overshooting, below where it stops
    // shrinking — the wobble is real and it still arrives.
    expect(classify(walk(0.8, MAX_STEPS))).toBe('settled');
  });

  it('calls the endless bounce a bounce rather than progress', () => {
    expect(classify(walk(HUGE_STEP, MAX_STEPS))).toBe('bouncing');
  });

  it('calls a step past the bounce a blow-up', () => {
    expect(classify(walk(1.2, MAX_STEPS))).toBe('diverging');
  });
});

describe('remainingPercent', () => {
  it('is a full hundred before anything has moved', () => {
    expect(remainingPercent(walk(0.3, 0))).toBe(100);
  });

  it('falls towards nothing as a good runner arrives', () => {
    expect(remainingPercent(walk(0.3, MAX_STEPS))).toBeLessThan(1);
  });
});

describe('race', () => {
  it('runs all three on the same hill from the same place', () => {
    const runners = race(0.3, 4);
    expect(runners).toHaveLength(3);
    for (const runner of runners) {
      expect(runner.trail[0].position).toBe(START);
    }
  });

  it('hands back the reader’s own runner by name', () => {
    expect(yourRunner(race(0.42, 3)).stepSize).toBe(0.42);
  });

  it('puts whoever is lowest down the hill in front', () => {
    expect(leader(race(0.3, MAX_STEPS))?.id).toBe('yours');
  });

  it('gives the lead to a rival when the reader picks badly', () => {
    expect(leader(race(1.2, MAX_STEPS))?.id).toBe('tiny');
  });

  it('has no leader once everyone has left the hill', () => {
    const allGone = race(1.2, MAX_STEPS).filter(
      (runner) => runner.id === 'yours',
    );
    expect(leader(allGone)).toBeNull();
  });
});

/**
 * The unit's two claims, pinned as facts rather than as prose.
 *
 * First: both extremes fail, and they fail in opposite ways — so there is no
 * direction you can move the setting that is safe on its own. Second: the
 * setting is not monotone. Raising it helps right up until it is catastrophic,
 * which is exactly why "just use a bigger one" is not advice.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('fails at both ends of the slider, in opposite ways', () => {
    expect(classify(walk(TINY_STEP, MAX_STEPS))).toBe('crawling');
    expect(classify(walk(1.3, MAX_STEPS))).toBe('diverging');
  });

  it('rewards a bigger step, and then punishes one', () => {
    expect(finalWrongness(0.3)).toBeLessThan(finalWrongness(TINY_STEP));
    expect(finalWrongness(1.2)).toBeGreaterThan(finalWrongness(TINY_STEP));
  });

  it('never lets the endless bounce settle, however long it is given', () => {
    expect(classify(walk(HUGE_STEP, 500))).toBe('bouncing');
    expect(remainingPercent(walk(HUGE_STEP, 500))).toBeCloseTo(100, 6);
  });

  it('is deterministic — the same setting always draws the same walk', () => {
    expect(walk(0.37, MAX_STEPS)).toEqual(walk(0.37, MAX_STEPS));
  });
});
