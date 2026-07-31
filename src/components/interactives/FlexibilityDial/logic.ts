/**
 * Pure logic for FlexibilityDial (§3.3).
 *
 * The instrument teaches one thing: a machine with enough freedom stops
 * learning the pattern in its examples and starts memorising the examples
 * themselves — at which point its score on those examples reaches perfect and
 * stops meaning anything.
 *
 * TWELVE SALES AND UP TO TWELVE DIALS. The number of dials is capped at the
 * number of sales on purpose, because that is where the point lands hardest: a
 * curve with one adjustable number per example can be made to pass exactly
 * through all of them, and then the wrongness on those examples is not small
 * but zero. Nothing about that carries a lesson only at this size; it is the
 * same arithmetic a billion-parameter model runs into, drawn small enough to
 * look at.
 *
 * Nothing here is random. Both tables of sales are fixed, the fit is a
 * deterministic piece of arithmetic, and `missOnUnseen(12)` names the same
 * decimal places today and in two years — which is what lets the prose, the
 * `MemoriseVsUnderstand` diagram and the tests all quote the same numbers.
 */

export interface Sale {
  /** Floor area in square metres. The one fact the machine is given. */
  readonly size: number;
  /** What it sold for, in thousands of pounds. The answer it is judged on. */
  readonly price: number;
}

/**
 * The twelve sales the machine is tuned on.
 *
 * Underneath them is a smooth rise that flattens off — bigger houses cost more
 * and less per square metre — and on top of that is noise: the hurried seller,
 * the thirty-year-old kitchen, the neighbour with the drum kit. Every price
 * here is that rise plus one such accident, and no accident repeats.
 */
export const STUDIED_SALES: readonly Sale[] = [
  { size: 38, price: 227 },
  { size: 47, price: 309 },
  { size: 54, price: 320 },
  { size: 64, price: 398 },
  { size: 71, price: 414 },
  { size: 82, price: 478 },
  { size: 88, price: 472 },
  { size: 99, price: 534 },
  { size: 105, price: 519 },
  { size: 116, price: 560 },
  { size: 124, price: 579 },
  { size: 133, price: 585 },
];

/**
 * Eight more sales on the same street, from the same rise and the same kind of
 * accident — and never shown to the machine.
 *
 * These are the whole reason the instrument exists. A score taken on the twelve
 * above cannot tell learning from memorising, because both produce the same
 * score. Only these eight can.
 */
export const UNSEEN_SALES: readonly Sale[] = [
  { size: 42, price: 256 },
  { size: 51, price: 307 },
  { size: 60, price: 377 },
  { size: 69, price: 427 },
  { size: 77, price: 429 },
  { size: 93, price: 507 },
  { size: 110, price: 556 },
  { size: 128, price: 577 },
];

/** Two dials draw a straight line: one for steepness, one for height. */
export const MIN_DIALS = 2;

/** One dial per sale is as far as the reader can push it, and far enough. */
export const MAX_DIALS = STUDIED_SALES.length;

export const DIAL_COUNTS: readonly number[] = Array.from(
  { length: MAX_DIALS - MIN_DIALS + 1 },
  (_, index) => MIN_DIALS + index,
);

export function clampDials(dials: number): number {
  return Math.min(MAX_DIALS, Math.max(MIN_DIALS, Math.round(dials)));
}

/**
 * Floor areas are shifted and shrunk to sit either side of zero before any
 * arithmetic. Raising numbers near 130 to the eleventh power loses most of the
 * digits a double has; numbers near 1 do not.
 */
const CENTRE = 85;
const SCALE = 50;
const scaled = (size: number): number => (size - CENTRE) / SCALE;

const dot = (left: readonly number[], right: readonly number[]): number =>
  left.reduce((total, value, index) => total + value * right[index], 0);

interface Basis {
  /** Recurrence centres, one per step up in flexibility. */
  readonly alpha: readonly number[];
  /** Recurrence weights, one per step up in flexibility. */
  readonly beta: readonly number[];
  /** How much of each successive bend the best fit actually uses. */
  readonly coefficients: readonly number[];
}

/**
 * Builds the best fit at every flexibility at once.
 *
 * Fitting a bendy curve to points is a solved piece of school arithmetic, and
 * doing it the obvious way — one big set of simultaneous equations per setting
 * — falls apart numerically well before the twelfth dial. This is Forsythe's
 * method instead: build each bend so that it is independent of every bend
 * already built, and the whole thing becomes a list of coefficients that can be
 * cut short at any length.
 *
 * The pay-off is not just stability. Because the terms are independent, turning
 * the flexibility down never re-fits anything — it drops terms off the end. So
 * the reader sliding back and forth is watching one fit gain and lose bends,
 * not eleven unrelated fits taking turns.
 */
function buildBasis(sales: readonly Sale[]): Basis {
  const positions = sales.map((sale) => scaled(sale.size));
  const prices = sales.map((sale) => sale.price);

  const alpha: number[] = [];
  const beta: number[] = [];

  let previous: number[] = positions.map(() => 0);
  let current: number[] = positions.map(() => 1);
  let previousNorm = 1;
  let currentNorm = dot(current, current);

  const coefficients: number[] = [dot(current, prices) / currentNorm];

  for (let step = 0; step + 1 < sales.length; step += 1) {
    const centre =
      dot(
        positions.map((position, index) => position * current[index]),
        current,
      ) / currentNorm;
    const weight = step === 0 ? 0 : currentNorm / previousNorm;

    const next = positions.map(
      (position, index) =>
        (position - centre) * current[index] - weight * previous[index],
    );
    const nextNorm = dot(next, next);

    alpha.push(centre);
    beta.push(weight);
    coefficients.push(nextNorm === 0 ? 0 : dot(next, prices) / nextNorm);

    previous = current;
    previousNorm = currentNorm;
    current = next;
    currentNorm = nextNorm;
  }

  return { alpha, beta, coefficients };
}

/** The sales never change, so the whole family of fits is built once. */
const BASIS = buildBasis(STUDIED_SALES);

/**
 * What a machine with this many dials would guess a house of this size sold
 * for, in thousands of pounds.
 */
export function predict(size: number, dials: number): number {
  const terms = clampDials(dials);
  const position = scaled(size);

  let previous = 0;
  let current = 1;
  let total = BASIS.coefficients[0];

  for (let step = 0; step + 1 < terms; step += 1) {
    const next =
      (position - BASIS.alpha[step]) * current - BASIS.beta[step] * previous;

    previous = current;
    current = next;
    total += BASIS.coefficients[step + 1] * current;
  }

  return total;
}

/**
 * How far the machine's guesses land from the truth on a set of sales, on
 * average, in thousands of pounds.
 *
 * The plain average distance rather than the squared version a real system
 * would minimise, for the same reason DialTuner uses it: "£12,000 out" is a
 * sentence a reader can act on and "148" is not.
 */
export function averageMiss(sales: readonly Sale[], dials: number): number {
  if (sales.length === 0) return 0;

  const total = sales.reduce(
    (sum, sale) => sum + Math.abs(predict(sale.size, dials) - sale.price),
    0,
  );

  return total / sales.length;
}

export const missOnStudied = (dials: number): number =>
  averageMiss(STUDIED_SALES, dials);

export const missOnUnseen = (dials: number): number =>
  averageMiss(UNSEEN_SALES, dials);

/**
 * The dial count that does best on the sales nobody showed it.
 *
 * Found by trying every setting, which is exactly the search a real team runs
 * — and exactly the search that is impossible without holding data back in the
 * first place. It is computed rather than written down so that the readout can
 * call a setting good or bad as a fact about this data.
 */
export const BEST_DIALS: number = DIAL_COUNTS.reduce((best, dials) =>
  missOnUnseen(dials) < missOnUnseen(best) ? dials : best,
);

/** Below this many thousands, the fit is passing through every studied sale. */
const MEMORISED = 0.5;

/** How much worse than the best still counts as no real difference. */
const NEAR_ENOUGH = 1.15;

export type Verdict = 'too-stiff' | 'about-right' | 'drifting' | 'memorising';

export function verdictFor(dials: number): Verdict {
  const count = clampDials(dials);

  if (count < BEST_DIALS) return 'too-stiff';
  if (missOnStudied(count) < MEMORISED) return 'memorising';
  if (missOnUnseen(count) <= missOnUnseen(BEST_DIALS) * NEAR_ENOUGH) {
    return 'about-right';
  }

  return 'drifting';
}
