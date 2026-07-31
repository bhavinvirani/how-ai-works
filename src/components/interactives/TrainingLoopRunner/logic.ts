/**
 * Pure logic for TrainingLoopRunner (§3.3).
 *
 * The instrument teaches one thing: the four-step cycle — guess, compare,
 * blame, nudge — changes almost nothing on any single pass, and changes
 * everything when it is run enough times. Both halves have to be true of the
 * arithmetic, not merely asserted in the prose, or the instrument is
 * decoration.
 *
 * Everything here is deterministic. Examples are visited in a fixed order
 * rather than shuffled, so "press it twice and you will see X" is a claim the
 * unit can make and a test can pin. Real training shuffles; nothing in what
 * this unit teaches depends on that, and an instrument that behaves differently
 * on each visit cannot be reasoned about.
 */

export interface House {
  /** Floor area in square metres — the one fact the machine is given. */
  size: number;
  /** What it actually sold for, in thousands of pounds. */
  price: number;
}

/**
 * The same eight sales the reader turned by hand in `model-as-dials`.
 *
 * Deliberately duplicated rather than imported from that island. Islands are
 * shipped separately and must not depend on each other's internals, and the
 * continuity the unit relies on ("the same eight houses, and this time nobody
 * touches the dials") is a claim about the numbers, which are right here where
 * an editor can check them.
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
  /** How much each extra square metre adds, in thousands of pounds. */
  perSquareMetre: number;
  /** What the guess starts at before size is taken into account. */
  base: number;
}

/**
 * Both dials start at zero, so the machine's opening position is to guess
 * nothing at all for every house. That is not a gimmick: it makes the first
 * screen honest about how little the machine begins with, and it means every
 * number the reader watches was produced by the loop rather than by us.
 */
export const START: Dials = { perSquareMetre: 0, base: 0 };

/**
 * How far each dial turns per unit of blame.
 *
 * Two different numbers because the two dials are measured in different things
 * — thousands of pounds per square metre, and thousands of pounds — so a step
 * that is sensible for one is absurd for the other. Real systems normally fix
 * this by rescaling the inputs before training rather than by carrying two step
 * sizes; the arithmetic is identical either way, and one step size per dial is
 * the version that can be read.
 *
 * Both are small enough that a single pass is visibly pointless, which is the
 * whole lesson. Larger values make the machine converge in a dozen presses and
 * teach the opposite of what this unit claims.
 */
const STEP: Dials = { perSquareMetre: 0.000001, base: 0.0005 };

/**
 * The most loops the instrument will run, and the cap this module enforces.
 *
 * It matches the range of the control in the view. Bounding it here as well
 * means no caller can hang the page by asking for a billion passes.
 */
export const MAX_LOOPS = 25_000;

/** The entire model: one multiply, one add. */
export function predict(dials: Dials, size: number): number {
  return dials.perSquareMetre * size + dials.base;
}

/**
 * How wrong the machine is across every example, as one number.
 *
 * Mean absolute error, the same measure `model-as-dials` put under the reader's
 * hands — average distance between guess and truth. Keeping it identical means
 * the number the loop drives down is the number they already spent a unit
 * learning to read.
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

/** Every guess beside the truth it is measured against. Drives the error bars. */
export function residuals(
  dials: Dials,
  houses: readonly House[] = HOUSES,
): Residual[] {
  return houses.map((house) => {
    const predicted = predict(dials, house.size);
    return { house, predicted, error: predicted - house.price };
  });
}

/** The four steps, in the order they happen. Named so the view cannot reorder them. */
export const STEP_KEYS = ['guess', 'compare', 'blame', 'nudge'] as const;
export type StepKey = (typeof STEP_KEYS)[number];

export interface Loop {
  /** Which pass this was, counting from one. */
  index: number;
  /** The single example this pass looked at. */
  house: House;
  /** Step 1 — what the machine said. */
  guess: number;
  /** Step 2 — what the answer really was. */
  answer: number;
  /** Step 2 — guess minus answer. Positive means the guess was too high. */
  error: number;
  before: Dials;
  after: Dials;
  /** Step 4 — `after` minus `before`, per dial. Deliberately tiny. */
  nudge: Dials;
}

/**
 * One turn of the cycle over one example.
 *
 * Steps 3 and 4 are the two lines computing `nudge`. Blame for a dial is the
 * mistake multiplied by how much that dial contributed to it: the size dial's
 * number passes through a multiplication by the house's floor area, so a large
 * house holds it more responsible, while the starting value contributes the
 * same amount to every guess and so is blamed the same for all of them. The
 * minus sign is the only thing making this learning rather than drift — it
 * turns each dial *against* the mistake it helped cause.
 */
export function oneLoop(dials: Dials, house: House, index: number): Loop {
  const guess = predict(dials, house.size);
  const error = guess - house.price;

  const nudge: Dials = {
    perSquareMetre: -STEP.perSquareMetre * error * house.size,
    base: -STEP.base * error,
  };

  const after: Dials = {
    perSquareMetre: dials.perSquareMetre + nudge.perSquareMetre,
    base: dials.base + nudge.base,
  };

  return {
    index,
    house,
    guess,
    answer: house.price,
    error,
    before: dials,
    after,
    nudge,
  };
}

export interface Run {
  /** How many passes actually ran, after clamping. */
  loops: number;
  dials: Dials;
  /** Wrongness now. */
  wrongness: number;
  /** Wrongness immediately before the final pass — the "did that one matter?" number. */
  wrongnessBefore: number;
  /** Wrongness before any pass ran at all. */
  wrongnessAtStart: number;
  /** The pass that just finished, or null when none has. */
  last: Loop | null;
}

/**
 * Run the cycle from scratch, `loops` times.
 *
 * Recomputed from the start on every call rather than accumulated in state.
 * That is what makes the instrument reversible — a reader can step back down
 * and land on exactly the numbers they saw on the way up — and it is what makes
 * every assertion in the test file a statement about a loop count rather than
 * about a click sequence.
 */
export function train(loops: number, houses: readonly House[] = HOUSES): Run {
  const wrongnessAtStart = wrongness(START, houses);
  const total =
    houses.length === 0
      ? 0
      : Math.min(Math.max(Math.floor(loops), 0), MAX_LOOPS);

  let dials = START;
  let wrongnessBefore = wrongnessAtStart;
  let last: Loop | null = null;

  for (let index = 0; index < total; index += 1) {
    const house = houses[index % houses.length];
    wrongnessBefore = wrongness(dials, houses);
    last = oneLoop(dials, house, index + 1);
    dials = last.after;
  }

  return {
    loops: total,
    dials,
    wrongness: wrongness(dials, houses),
    wrongnessBefore,
    wrongnessAtStart,
    last,
  };
}

/** Cached because the default search is the same 30,401 settings every render. */
let cachedBest: { dials: Dials; wrongness: number } | null = null;

/**
 * The best these two dials can do, found by brute force over a grid.
 *
 * Identical in spirit to the search in `DialTuner`, and here for the same
 * reason: the instrument should be able to say how close the loop got as a
 * fact rather than as encouragement. It also settles the question the unit
 * raises — the loop, which understands nothing, lands within a few hundred
 * pounds of the best setting an exhaustive search can find.
 */
export function bestPossible(houses: readonly House[] = HOUSES): {
  dials: Dials;
  wrongness: number;
} {
  if (houses === HOUSES && cachedBest !== null) return cachedBest;

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
  if (houses === HOUSES) cachedBest = best;

  return best;
}
