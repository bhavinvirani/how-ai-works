import { describe, expect, it } from 'vitest';

import {
  bestPossible,
  HOUSES,
  MAX_LOOPS,
  oneLoop,
  predict,
  residuals,
  START,
  STEP_KEYS,
  train,
  wrongness,
} from './logic';

describe('predict', () => {
  it('is size times the first dial plus the second', () => {
    expect(predict({ perSquareMetre: 2, base: 10 }, 50)).toBe(110);
  });

  it('guesses nothing at all from the starting dials', () => {
    expect(predict(START, 74)).toBe(0);
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
    expect(wrongness({ perSquareMetre: 0, base: 0 }, houses)).toBe(15);
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

describe('oneLoop', () => {
  const house = { size: 100, price: 300 };

  it('reports the guess, the answer, and the gap between them', () => {
    const loop = oneLoop({ perSquareMetre: 2, base: 0 }, house, 1);

    expect(loop.guess).toBe(200);
    expect(loop.answer).toBe(300);
    expect(loop.error).toBe(-100);
  });

  it('turns both dials up when the guess was too low', () => {
    const loop = oneLoop({ perSquareMetre: 2, base: 0 }, house, 1);

    expect(loop.nudge.perSquareMetre).toBeGreaterThan(0);
    expect(loop.nudge.base).toBeGreaterThan(0);
  });

  it('turns both dials down when the guess was too high', () => {
    const loop = oneLoop({ perSquareMetre: 4, base: 0 }, house, 1);

    expect(loop.nudge.perSquareMetre).toBeLessThan(0);
    expect(loop.nudge.base).toBeLessThan(0);
  });

  it('leaves the dials alone when the guess was already right', () => {
    const loop = oneLoop({ perSquareMetre: 3, base: 0 }, house, 1);

    expect(loop.error).toBe(0);
    expect(loop.nudge.perSquareMetre).toBeCloseTo(0, 12);
    expect(loop.nudge.base).toBeCloseTo(0, 12);
    expect(loop.after.perSquareMetre).toBeCloseTo(
      loop.before.perSquareMetre,
      12,
    );
  });

  it('reports the nudge as exactly the distance the dials moved', () => {
    const loop = oneLoop({ perSquareMetre: 2, base: 5 }, house, 1);

    expect(loop.after.perSquareMetre - loop.before.perSquareMetre).toBeCloseTo(
      loop.nudge.perSquareMetre,
      12,
    );
    expect(loop.after.base - loop.before.base).toBeCloseTo(loop.nudge.base, 12);
  });

  it('blames the size dial in proportion to how big the house was', () => {
    const dials = { perSquareMetre: 2, base: 0 };
    const small = oneLoop(dials, { size: 50, price: 150 }, 1);
    const large = oneLoop(dials, { size: 100, price: 300 }, 1);

    // Twice the floor area and twice the mistake, so four times the correction
    // to the dial the floor area is multiplied by — and only twice as much to
    // the dial that contributes the same amount to every guess.
    expect(large.nudge.perSquareMetre / small.nudge.perSquareMetre).toBeCloseTo(
      4,
      6,
    );
    expect(large.nudge.base / small.nudge.base).toBeCloseTo(2, 6);
  });
});

describe('train', () => {
  it('has not touched the dials before any loop has run', () => {
    const run = train(0);

    expect(run.dials).toEqual(START);
    expect(run.last).toBeNull();
    expect(run.loops).toBe(0);
  });

  it('gives the same answer every time it is asked', () => {
    expect(train(137)).toEqual(train(137));
  });

  it('walks the examples in order and comes back round', () => {
    expect(train(1).last?.house).toEqual(HOUSES[0]);
    expect(train(3).last?.house).toEqual(HOUSES[2]);
    expect(train(HOUSES.length + 1).last?.house).toEqual(HOUSES[0]);
  });

  it('refuses to run more loops than the instrument offers', () => {
    expect(train(MAX_LOOPS * 10).loops).toBe(MAX_LOOPS);
  });

  it('treats a negative number of loops as none at all', () => {
    expect(train(-5).loops).toBe(0);
  });

  it('reports the wrongness on either side of the final loop', () => {
    const run = train(40);

    expect(run.wrongnessBefore).toBeCloseTo(wrongness(train(39).dials), 12);
    expect(run.wrongness).toBeCloseTo(wrongness(run.dials), 12);
  });
});

/**
 * The unit makes two claims about this loop, and they pull in opposite
 * directions: one pass is so small it looks like nothing happened, and enough
 * passes find a setting as good as an exhaustive search does. If either stops
 * being true of the arithmetic, the prose is wrong and these fail.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('starts out guessing nothing, and knows how bad that is', () => {
    expect(train(0).wrongness).toBeCloseTo(244.625, 3);
  });

  it('barely moves the wrongness on the very first loop', () => {
    const run = train(1);
    const moved = run.wrongnessAtStart - run.wrongness;

    // Under half a percent of the distance it has to travel.
    expect(moved / run.wrongnessAtStart).toBeLessThan(0.005);
  });

  it('barely moves the wrongness on the very last loop either', () => {
    const run = train(MAX_LOOPS);

    expect(Math.abs(run.wrongness - run.wrongnessBefore)).toBeLessThan(0.02);
  });

  it('moves the dials by an amount too small to see, one loop at a time', () => {
    const first = train(1).last;
    expect(first).not.toBeNull();

    // The size dial ends up near £2,570 per square metre. One loop moves it by
    // under £10, which is nothing on the chart and nothing to a reader.
    expect(Math.abs(first?.nudge.perSquareMetre ?? 1)).toBeLessThan(0.01);
  });

  it('transforms the machine once the loops pile up', () => {
    expect(train(500).wrongness).toBeLessThan(train(1).wrongness / 10);
    expect(train(MAX_LOOPS).wrongness).toBeLessThan(train(500).wrongness);
  });

  it('lands within a few hundred pounds of the best those two dials have', () => {
    const arrived = train(MAX_LOOPS).wrongness;
    const best = bestPossible().wrongness;

    expect(arrived).toBeGreaterThanOrEqual(best);
    expect(arrived - best).toBeLessThan(0.3);
  });

  it('never reaches zero, because the sales never sat on one line', () => {
    expect(bestPossible().wrongness).toBeGreaterThan(0);
  });
});

describe('the four steps', () => {
  it('are the four the unit teaches, in the order it teaches them', () => {
    expect(STEP_KEYS).toEqual(['guess', 'compare', 'blame', 'nudge']);
  });
});
