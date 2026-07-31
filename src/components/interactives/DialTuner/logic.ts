/**
 * Pure logic for DialTuner (§3.3).
 *
 * The instrument teaches one thing: a model is a box of adjustable numbers, and
 * "learning" is nothing more than moving those numbers until the answers stop
 * being wrong. Two dials is the smallest version of that idea that is still
 * honestly the same idea.
 *
 * The house data is fixed rather than random — an instrument that behaves
 * differently on each visit cannot be reasoned about, tested, or referred to
 * from prose ("notice the flat you can never fit"). Seedable noise would satisfy
 * the contract too; a fixed table satisfies it and is also readable.
 */

export interface House {
  /** Floor area in square metres. The input the machine is given. */
  size: number;
  /** What it actually sold for, in thousands. The answer it is judged against. */
  price: number;
}

/**
 * Eight sales. Broadly linear, because the lesson is the tuning rather than the
 * shape — but deliberately not perfectly linear, so that no dial setting ever
 * reaches zero wrongness. A learner who can hit zero learns the wrong thing.
 */
export const HOUSES: readonly House[] = [
  { size: 38, price: 132 },
  { size: 52, price: 171 },
  { size: 61, price: 205 },
  { size: 74, price: 219 },
  { size: 86, price: 268 },
  { size: 95, price: 279 },
  { size: 112, price: 331 },
  { size: 128, price: 352 },
];

export interface Dials {
  /** How much each extra square metre adds to the guess. */
  perSquareMetre: number;
  /** What the guess starts at before any size is taken into account. */
  base: number;
}

/** The entire model. Two numbers in, one number out. */
export function predict(dials: Dials, size: number): number {
  return dials.perSquareMetre * size + dials.base;
}

/**
 * How wrong the machine is across every example, as one number.
 *
 * Mean absolute error: the average of how far off each guess is. Chosen over
 * the squared error a real system would use because this unit has not yet
 * introduced why squaring helps, and a readout the reader cannot interpret
 * ("2894") teaches less than one they can ("off by £24,000 on average").
 */
export function wrongness(
  dials: Dials,
  houses: readonly House[] = HOUSES,
): number {
  if (houses.length === 0) return 0;

  const total = houses.reduce(
    (sum, house) => sum + Math.abs(predict(dials, house.size) - house.price),
    0,
  );

  return total / houses.length;
}

export interface Residual {
  house: House;
  predicted: number;
  /** Positive when the machine guessed too high. */
  error: number;
}

export function residuals(
  dials: Dials,
  houses: readonly House[] = HOUSES,
): Residual[] {
  return houses.map((house) => {
    const predicted = predict(dials, house.size);
    return { house, predicted, error: predicted - house.price };
  });
}

/**
 * The best these two dials can do, found by brute force over a grid.
 *
 * Same motive as the exhaustive search in SpamRuleWriter: the instrument should
 * be able to tell the reader how close they got as a fact rather than as
 * encouragement. It also quietly makes the deeper point — the good settings
 * were findable by something that understands nothing, just by trying and
 * comparing.
 */
export function bestDials(houses: readonly House[] = HOUSES): {
  dials: Dials;
  wrongness: number;
} {
  let best: { dials: Dials; wrongness: number } | null = null;

  for (let slope = 1; slope <= 4.0001; slope += 0.01) {
    for (let base = -40; base <= 60.0001; base += 1) {
      const dials = {
        perSquareMetre: Math.round(slope * 100) / 100,
        base: Math.round(base),
      };
      const value = wrongness(dials, houses);

      if (best === null || value < best.wrongness)
        best = { dials, wrongness: value };
    }
  }

  if (best === null) throw new Error('the search grid must not be empty');

  return best;
}
