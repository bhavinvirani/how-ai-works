/**
 * Pure logic for StepSizeRace (§3.3).
 *
 * The instrument teaches one thing: the direction downhill is worked out for
 * you, but the distance is a number a person picks — and picking it badly
 * fails in two opposite ways that no single "safe" value avoids.
 *
 * Three runners set off from the same place on the same hill and take the same
 * number of steps. Only their step size differs. Two of them are fixed so the
 * reader always has something to lose to; the third is theirs.
 *
 * The hill is a plain bowl: `wrongness(p) = (p - FLOOR)^2`. That is a deliberate
 * simplification and an honest one — every behaviour the unit claims (crawl,
 * settle, endless bounce, blow-up) is a real consequence of this shape rather
 * than something staged, and each threshold below can be derived rather than
 * asserted. Real landscapes are bumpier, which only ever makes the choice
 * harder, never easier.
 *
 * Nothing here is random or time-dependent: the same step size and step count
 * always produce the same walk, so the prose can point at a specific value and
 * be right about what the reader will see.
 */

/** Where the bottom of the valley sits along the hill. */
export const FLOOR = 0.5;

/** Every runner starts here, part-way up the left-hand slope. */
export const START = 0.18;

/** How many steps a runner may take. Small enough that a crawl stays a crawl. */
export const MAX_STEPS = 12;

/** The rival who is far too cautious. */
export const TINY_STEP = 0.01;

/**
 * The rival who is far too bold.
 *
 * Exactly 1 is not an arbitrary "big number": on this hill it is the step size
 * at which every overshoot lands at precisely the same height on the far side.
 * The runner bounces forever, never settling and never leaving — busy, and
 * making no progress at all. That picture is worth more than a runner that
 * simply explodes, which the reader can produce for themselves by nudging their
 * own slider past 1.
 */
export const HUGE_STEP = 1;

/** Slow enough to look like it is working, slow enough not to arrive. */
export const DEFAULT_STEP = 0.03;

/** The widest step the slider offers — comfortably into blow-up territory. */
export const MAX_STEP = 1.3;

/** Under this share of the starting wrongness, the runner has arrived. */
const SETTLED_WITHIN_PERCENT = 2;

/** How wrong the machine is at this position. One bowl, lowest at FLOOR. */
export function wrongness(position: number): number {
  const offset = position - FLOOR;
  return offset * offset;
}

/**
 * How steeply the ground falls away here. The sign is the direction: negative
 * means the ground drops off to the right, positive means to the left.
 */
export function slope(position: number): number {
  return 2 * (position - FLOOR);
}

/** The hill runs from 0 to 1. Past either rim, the run is over. */
export function isOffHill(position: number): boolean {
  return position < 0 || position > 1;
}

export interface Footprint {
  /** May sit outside 0–1: that is what leaving the hill looks like. */
  position: number;
  wrongness: number;
  offHill: boolean;
}

function footprintAt(position: number): Footprint {
  return {
    position,
    wrongness: wrongness(position),
    offHill: isOffHill(position),
  };
}

/**
 * One runner's whole walk, starting position included.
 *
 * The walk stops the moment a runner leaves the hill, so the returned trail can
 * be shorter than `steps + 1`. That is not tidying-up: a training run that has
 * blown up produces no further meaningful numbers, and continuing to iterate
 * would only manufacture larger ones.
 */
export function walk(
  stepSize: number,
  steps: number,
  start: number = START,
): Footprint[] {
  const trail: Footprint[] = [footprintAt(start)];

  for (let taken = 0; taken < steps; taken++) {
    const previous = trail[trail.length - 1];
    if (previous.offHill) break;

    // The one line the whole field runs on: move against the slope, by an
    // amount the step size decides.
    const next = previous.position - stepSize * slope(previous.position);
    trail.push(footprintAt(next));
  }

  return trail;
}

export type Behaviour =
  'waiting' | 'crawling' | 'settled' | 'bouncing' | 'diverging';

/** How many times the runner crossed from one side of the valley to the other. */
export function countCrossings(trail: readonly Footprint[]): number {
  let crossings = 0;

  for (let index = 1; index < trail.length; index++) {
    const before = trail[index - 1].position - FLOOR;
    const after = trail[index].position - FLOOR;
    if (before * after < 0) crossings++;
  }

  return crossings;
}

/** What share of its starting wrongness the runner still carries, as a percentage. */
export function remainingPercent(trail: readonly Footprint[]): number {
  const first = trail[0];
  const last = trail[trail.length - 1];

  if (first.wrongness === 0) return 0;
  return (last.wrongness / first.wrongness) * 100;
}

/**
 * Read the walk and say what kind of walk it was.
 *
 * Judged from the trail rather than from an algebraic threshold on the step
 * size, so the verdict stays true if the hill is ever changed — and so the
 * tests pin behaviour a reader can see rather than a formula they cannot.
 */
export function classify(trail: readonly Footprint[]): Behaviour {
  if (trail.length < 2) return 'waiting';

  const first = trail[0];
  const last = trail[trail.length - 1];

  if (last.offHill) return 'diverging';

  // A tolerance rather than a bare `>`: an eternal bounce returns to the same
  // height every other step, and floating-point drift must not read as growth.
  if (last.wrongness > first.wrongness + 1e-9) return 'diverging';

  if (remainingPercent(trail) <= SETTLED_WITHIN_PERCENT) return 'settled';

  return countCrossings(trail) >= 2 ? 'bouncing' : 'crawling';
}

export type RunnerId = 'tiny' | 'yours' | 'huge';

export interface Runner {
  id: RunnerId;
  stepSize: number;
  trail: Footprint[];
  behaviour: Behaviour;
  /** Share of its starting wrongness still left, as a percentage. */
  remaining: number;
}

function runner(id: RunnerId, stepSize: number, steps: number): Runner {
  const trail = walk(stepSize, steps);

  return {
    id,
    stepSize,
    trail,
    behaviour: classify(trail),
    remaining: remainingPercent(trail),
  };
}

/**
 * All three runners, same hill, same start, same number of steps.
 *
 * Order is fixed — cautious, yours, bold — because the reader is meant to see
 * their own runner between the two failure modes rather than beside them.
 */
export function race(yourStepSize: number, steps: number): Runner[] {
  return [
    runner('tiny', TINY_STEP, steps),
    runner('yours', yourStepSize, steps),
    runner('huge', HUGE_STEP, steps),
  ];
}

/** The reader's own runner. `race` always builds exactly one. */
export function yourRunner(runners: readonly Runner[]): Runner {
  const found = runners.find((candidate) => candidate.id === 'yours');
  if (found === undefined) throw new Error('a race must contain your runner');
  return found;
}

/**
 * Whoever is lowest down the hill right now, ignoring anyone who has left it.
 * Returns null when nobody is still on the hill.
 */
export function leader(runners: readonly Runner[]): Runner | null {
  let best: Runner | null = null;

  for (const candidate of runners) {
    const last = candidate.trail[candidate.trail.length - 1];
    if (last.offHill) continue;

    const bestLast = best === null ? null : best.trail[best.trail.length - 1];
    if (bestLast === null || last.wrongness < bestLast.wrongness) {
      best = candidate;
    }
  }

  return best;
}
