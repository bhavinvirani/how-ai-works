/**
 * Pure logic for PreferenceRater (§3.3).
 *
 * The instrument teaches one thing: a person who could not write down what a
 * good answer is can still pick the better of two, and enough of those picks
 * add up to a number — a score that can rank answers nobody ever rated.
 *
 * HOW THE MODEL WORKS. Every candidate answer carries a value on four plain
 * qualities: does it get to the point, does it state things flatly, does it go
 * along with what the asker said, is it friendly about it. The reader never
 * sees those values and is never asked about them. They pick whole answers.
 *
 * The scorer is then read off the picks: for each quality, count the pairs
 * where the two answers differed on it, and how often the reader took the
 * higher side. That proportion, stretched onto −1…+1, is the weight. An
 * answer's score is its qualities multiplied by those weights and added up.
 *
 * That is a deliberately small stand-in for a real reward model, which has
 * billions of dials, no named qualities, and nothing anybody can read off it.
 * What survives the shrinking is the part that matters: the number came out of
 * comparisons, not out of a specification, and it will happily score an answer
 * no person has ever looked at.
 *
 * Nothing here is random and nothing reads a clock. The same ten picks produce
 * the same scorer today and in two years, which is what lets the unit's prose
 * quote exact figures and lets `logic.test.ts` hold them to it.
 */

/** The four qualities the answers vary on. */
export type AxisId = 'direct' | 'confident' | 'agrees' | 'warm';

/**
 * Fixed order: it is the order the readout rows appear in, and the order
 * `strongestAxis` breaks ties in. Ordering that matters is written down once.
 */
export const AXES: readonly AxisId[] = [
  'direct',
  'confident',
  'agrees',
  'warm',
];

/**
 * Where an answer sits on a quality: +1 has it, −1 is the opposite of it, 0
 * means the quality is simply not in play in that pair.
 *
 * Three values rather than a scale, because the reader is never shown these
 * and a finer grading would buy nothing but false precision.
 */
export type Trait = -1 | 0 | 1;

/** Positional so the table below reads as a matrix. Order matches `AXES`. */
const traits = (
  direct: Trait,
  confident: Trait,
  agrees: Trait,
  warm: Trait,
): Readonly<Record<AxisId, Trait>> => ({ direct, confident, agrees, warm });

export interface Answer {
  /** Unique across every pair — the key for this answer's text and for tests. */
  readonly id: string;
  readonly traits: Readonly<Record<AxisId, Trait>>;
}

export interface Pair {
  /** Names the question both answers reply to. */
  readonly id: string;
  readonly left: Answer;
  readonly right: Answer;
}

/** Which of the two an answer-picker took. */
export type Side = 'left' | 'right';

/** One entry per pair already judged, oldest first. */
export type Picks = readonly Side[];

/**
 * The ten pairs, hand-built so that the four qualities are tangled in the way
 * real preference data is tangled.
 *
 * Two deliberate properties, both pinned in the tests because every number the
 * unit quotes rests on them:
 *
 * 1. `direct` differs in all ten pairs, so "always take the one that gets to
 *    the point" is a strategy with no ties in it and produces exact figures.
 * 2. `warm` and `direct` pull against each other in six of the seven pairs
 *    where warmth is in play — friendliness costs words — but agree in the
 *    seventh. That is the confound that makes preference data hard: a reader
 *    who rewards one of them teaches the scorer about the other, and no amount
 *    of care in the picking separates them.
 *
 * `confident` is crossed against `direct` on purpose: the brisk answer states
 * things flatly in three pairs and flags its doubt in three others. A reader
 * following directness alone therefore leaves that quality at exactly zero,
 * which is the instrument's cleanest demonstration that a scorer is blind to
 * whatever the picks were not consistent about.
 */
export const ROUNDS: readonly Pair[] = [
  {
    id: 'egg',
    left: { id: 'egg-brisk', traits: traits(1, 1, 0, 0) },
    right: { id: 'egg-woolly', traits: traits(-1, -1, 0, 0) },
  },
  {
    id: 'pan',
    left: { id: 'pan-blunt', traits: traits(1, 1, 0, -1) },
    right: { id: 'pan-gentle', traits: traits(-1, -1, 0, 1) },
  },
  {
    id: 'tomato',
    left: { id: 'tomato-yes', traits: traits(0, 1, 1, 1) },
    right: { id: 'tomato-actually', traits: traits(1, 1, -1, -1) },
  },
  {
    id: 'grammar',
    left: { id: 'grammar-praise', traits: traits(0, -1, 0, 1) },
    right: { id: 'grammar-fix', traits: traits(1, 1, 0, -1) },
  },
  {
    id: 'starter',
    left: { id: 'starter-brisk', traits: traits(1, -1, 0, 0) },
    right: { id: 'starter-padded', traits: traits(-1, 1, 0, 0) },
  },
  {
    id: 'muscle',
    left: { id: 'muscle-yes', traits: traits(1, 1, 1, 0) },
    right: { id: 'muscle-no', traits: traits(0, 1, -1, 1) },
  },
  {
    id: 'notice',
    left: { id: 'notice-figure', traits: traits(1, -1, 0, 0) },
    right: { id: 'notice-sweeping', traits: traits(-1, 1, 0, 0) },
  },
  {
    id: 'essay',
    left: { id: 'essay-straight', traits: traits(1, 1, -1, -1) },
    right: { id: 'essay-kind', traits: traits(-1, 1, 1, 1) },
  },
  {
    id: 'spuds',
    left: { id: 'spuds-numbers', traits: traits(1, -1, 0, 1) },
    right: { id: 'spuds-essay', traits: traits(-1, 1, 0, 0) },
  },
  {
    id: 'quit',
    left: { id: 'quit-cheer', traits: traits(-1, 1, 1, 1) },
    right: { id: 'quit-questions', traits: traits(1, 1, -1, -1) },
  },
];

export const ROUND_COUNT = ROUNDS.length;

/**
 * An eleventh pair, kept back and never rated.
 *
 * This is the whole point of building a scorer rather than counting votes. A
 * tally of picks can only tell you about answers people looked at; a scorer
 * has an opinion about an answer nobody has ever seen. The pair is also the
 * unit's honesty test — one of these two answers is false, and nothing in the
 * ten pairs ever asked the reader about truth.
 */
export const HELD_OUT: Pair = {
  id: 'brain',
  left: { id: 'brain-flatter', traits: traits(-1, 1, 1, 1) },
  right: { id: 'brain-correct', traits: traits(1, 1, -1, -1) },
};

/** Which of the held-back answers is factually right. */
export const TRUE_ANSWER_ID = 'brain-correct';

export interface Tally {
  readonly axis: AxisId;
  /** Pairs, among those judged, whose two answers differed on this quality. */
  readonly differed: number;
  /** How often the reader took the answer that had more of it. */
  readonly towardsMore: number;
  /** −1 (always took less) to +1 (always took more). 0 when never judged. */
  readonly weight: number;
}

/** What the picks so far say about one quality. */
export function tallyFor(
  axis: AxisId,
  picks: Picks,
  rounds: readonly Pair[] = ROUNDS,
): Tally {
  let differed = 0;
  let towardsMore = 0;

  picks.forEach((side, index) => {
    const pair = rounds[index];
    if (pair === undefined) return;

    const left = pair.left.traits[axis];
    const right = pair.right.traits[axis];
    if (left === right) return;

    differed += 1;
    const taken = side === 'left' ? left : right;
    const passed = side === 'left' ? right : left;
    if (taken > passed) towardsMore += 1;
  });

  return {
    axis,
    differed,
    towardsMore,
    weight: differed === 0 ? 0 : (2 * towardsMore - differed) / differed,
  };
}

/** One weight per quality: the scorer the picks add up to. */
export type Judge = Readonly<Record<AxisId, number>>;

export function judgeFrom(
  picks: Picks,
  rounds: readonly Pair[] = ROUNDS,
): Judge {
  return {
    direct: tallyFor('direct', picks, rounds).weight,
    confident: tallyFor('confident', picks, rounds).weight,
    agrees: tallyFor('agrees', picks, rounds).weight,
    warm: tallyFor('warm', picks, rounds).weight,
  };
}

/**
 * What the scorer makes of an answer: its qualities, each multiplied by how
 * much the picks rewarded that quality, added up.
 *
 * Only differences between scores mean anything — the scale itself is
 * arbitrary, exactly as it is in the real thing.
 */
export function scoreOf(answer: Answer, judge: Judge): number {
  return AXES.reduce(
    (total, axis) => total + judge[axis] * answer.traits[axis],
    0,
  );
}

/** How loud a quality is in the scorer. */
export type Strength = 'decisive' | 'leaning' | 'blind';

const DECISIVE = 0.6;
const LEANING = 0.2;

export function strengthOf(weight: number): Strength {
  const size = Math.abs(weight);
  if (size >= DECISIVE) return 'decisive';
  if (size >= LEANING) return 'leaning';
  return 'blind';
}

export interface Lean {
  /** 'more' when the picks favoured having the quality, 'less' when not. */
  readonly towards: 'more' | 'less';
  /** How many of the differing pairs went that way. */
  readonly count: number;
}

/** Which way a quality leans, and by how many pairs. Ties read as 'more'. */
export function leanOf(tally: Tally): Lean {
  const against = tally.differed - tally.towardsMore;

  return tally.towardsMore >= against
    ? { towards: 'more', count: tally.towardsMore }
    : { towards: 'less', count: against };
}

/**
 * The quality the scorer weighs most heavily, or null if it weighs nothing at
 * all. Ties go to whichever comes first in `AXES`.
 *
 * Null is unreachable from any complete set of ten picks — one quality is in
 * play an odd number of times, so it can never come out even — and the tests
 * say so. It stays in the type because a scorer built from no picks is a real
 * state the view can be in.
 */
export function strongestAxis(judge: Judge): AxisId | null {
  let best: AxisId | null = null;

  for (const axis of AXES) {
    if (best === null || Math.abs(judge[axis]) > Math.abs(judge[best])) {
      best = axis;
    }
  }

  return best !== null && judge[best] === 0 ? null : best;
}

export interface Verdict {
  readonly leftScore: number;
  readonly rightScore: number;
  /** The answer the scorer puts ahead, or null when it cannot separate them. */
  readonly winnerId: string | null;
  /** Whether the answer it puts ahead is the one that happens to be true. */
  readonly prefersTruth: boolean;
}

/** Rounding slack: two scores this close are the same score. */
const LEVEL = 1e-9;

/** What a scorer built from the picks makes of the pair nobody rated. */
export function heldOutVerdict(judge: Judge, pair: Pair = HELD_OUT): Verdict {
  const leftScore = scoreOf(pair.left, judge);
  const rightScore = scoreOf(pair.right, judge);
  const gap = leftScore - rightScore;

  const winnerId =
    Math.abs(gap) < LEVEL ? null : gap > 0 ? pair.left.id : pair.right.id;

  return {
    leftScore,
    rightScore,
    winnerId,
    prefersTruth: winnerId === TRUE_ANSWER_ID,
  };
}
