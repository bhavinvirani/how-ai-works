/**
 * Pure logic for TemperatureDial (§3.3).
 *
 * The instrument teaches one thing: temperature changes the GAPS between
 * percentages the model has already produced, and nothing else. It never
 * invents a piece, never removes one, and never reorders them — so a row that
 * is unrecognisable at the two ends of the dial is the same five opinions in
 * the same order the whole way.
 *
 * NOTHING HERE COMPUTES A DISTRIBUTION. All of that lives in
 * `../shared/nextpiece/logic`, which `NextPieceLoop` also uses, so the reader
 * meets one row of numbers twice: running forward in `text-generation`, then
 * held still here with one dial turned. This module only holds the context
 * still, fixes the draws, and works out the few facts the readout states.
 *
 * WHAT IS REAL AND WHAT IS STAGED is documented in the shared module and said
 * plainly in `text-generation`. Short version: raw scores, divided by the
 * temperature, through softmax, then drawn in proportion — every step real, in
 * that order. The hand-written scores are the staged part.
 *
 * DETERMINISTIC (§3.3). The four runs are four fixed seeds rather than four
 * calls to `Math.random()`, so every reader sees the same four sentences and
 * the prose can quote them.
 */
import {
  candidatesFor,
  clampTemperature,
  generate,
  likeliest,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
  OPENING,
  sentenceOf,
  withTemperature,
} from '../shared/nextpiece/logic';
import type { Scored } from '../shared/nextpiece/logic';

export { MAX_TEMPERATURE, MIN_TEMPERATURE, OPENING };
export type { Scored };

/**
 * Where the dial starts. Not the bottom and not the top: the reader has to
 * turn it both ways themselves, and starting at either end hands over half the
 * ending.
 */
export const DEFAULT_TEMPERATURE = 1;

/** Tenths. Fine enough to watch the row move, coarse enough to land on a value. */
export const TEMPERATURE_STEP = 0.1;

/**
 * How many pieces a run writes.
 *
 * Three is long enough to be a sentence and short enough that four of them can
 * be compared at a glance, which is the only comparison this instrument asks
 * for. It is also as far as the continuation table reaches down its best path.
 */
export const PIECES = 3;

/**
 * Four fixed draws of the dice, in the order the reader uncovers them.
 *
 * Chosen, not arbitrary, and worth saying why. Every one of them writes the
 * same sentence at the bottom of the dial — that is the first thing the lead
 * asks the reader to check, and a seed that wandered at 0.1 would quietly make
 * it false. At the middle setting they happen to walk down the row, taking the
 * first, second, third and fourth piece in turn, which is what a row of
 * percentages looks like when it is actually being sampled. The fourth is a
 * high roll (0.9946), so it is the one that reaches the bottom of the row once
 * the gaps have squashed far enough to let it.
 *
 * Four draws is not a survey, and the prose says so: at the top of the dial the
 * model gives that last piece about three chances in a hundred, and one of
 * these four fixed draws is the one that takes it.
 */
export const SEEDS: readonly number[] = [6, 1, 4, 232];

export const MIN_RUNS = 1;
export const MAX_RUNS = SEEDS.length;

/** One run to start with, so that running it again is something the reader does. */
export const DEFAULT_RUNS = 1;

export const clampRuns = (runs: number): number =>
  Math.min(MAX_RUNS, Math.max(MIN_RUNS, Math.round(runs)));

/**
 * The context is held still on purpose.
 *
 * `NextPieceLoop` moves it — that is its whole subject. Here the sentence never
 * grows, because the only thing allowed to change between two readings of this
 * panel is the dial.
 */
const CANDIDATES = candidatesFor(OPENING);

/** How many pieces the model is choosing between. Five, and always five. */
export const CANDIDATE_COUNT = CANDIDATES.length;

/** The row of percentages the model produces for the opening, at this dial setting. */
export const openingRow = (temperature: number): Scored[] =>
  withTemperature(CANDIDATES, temperature);

/** The piece with the highest raw score, which is the highest at every setting. */
export const FAVOURITE = likeliest(CANDIDATES);

/** The piece with the lowest raw score, which is the lowest at every setting. */
export const LONG_SHOT = CANDIDATES.reduce(
  (worst, candidate, index) =>
    candidate.logit < CANDIDATES[worst].logit ? index : worst,
  0,
);

export const favouriteOf = (row: readonly Scored[]): Scored => row[FAVOURITE];
export const longShotOf = (row: readonly Scored[]): Scored => row[LONG_SHOT];

/** Where a piece stands in the row: 1 for the largest share. */
export function rankOf(row: readonly Scored[], index: number): number {
  const share = row[index].probability;

  return row.filter((entry) => entry.probability > share).length + 1;
}

export interface Run {
  /** 1-based, and the order the reader uncovers them in. */
  readonly number: number;
  readonly seed: number;
  /** The opening plus every piece this run drew. */
  readonly sentence: string;
  /** The first piece it drew, which is the one the row above is about. */
  readonly opener: string;
  readonly openerIndex: number;
  /** The share that piece held when it was drawn. */
  readonly openerShare: number;
  readonly openerRank: number;
}

/**
 * Run the same question `count` times at one dial setting.
 *
 * Each run is a fresh draw against the same row, never a fresh row: the model's
 * opinion is fixed, and the only thing that differs between runs is where the
 * dice landed. That is the distinction the whole unit turns on.
 */
export function runsAt(temperature: number, count: number): Run[] {
  const heat = clampTemperature(temperature);

  return SEEDS.slice(0, clampRuns(count)).map((seed, index) => {
    const steps = generate(heat, seed, PIECES);
    const first = steps[0];
    const drawn = first.row[first.chosen];

    return {
      number: index + 1,
      seed,
      sentence: sentenceOf(steps),
      opener: drawn.text,
      openerIndex: first.chosen,
      openerShare: drawn.probability,
      openerRank: rankOf(first.row, first.chosen),
    };
  });
}

/** How many different sentences a set of runs produced. One means they all agree. */
export const distinctSentences = (runs: readonly Run[]): number =>
  new Set(runs.map((run) => run.sentence)).size;

/**
 * The run that reached furthest down the row, or `null` if every run took the
 * favourite.
 *
 * This is the "something odd got through" the panel's lead promises, and it has
 * to be found rather than assumed: at the bottom of the dial there is nothing
 * to find, and the readout must not claim otherwise.
 */
export function longestReach(runs: readonly Run[]): Run | null {
  const reaching = runs.filter((run) => run.openerIndex !== FAVOURITE);
  if (reaching.length === 0) return null;

  return reaching.reduce((furthest, run) =>
    run.openerShare < furthest.openerShare ? run : furthest,
  );
}

/**
 * Four descriptions of what the dial is currently doing, decided by how much of
 * the row the favourite is holding.
 *
 * A band rather than a number because the number alone does not say what it
 * means: 99.9% and 39% are both just percentages until somebody says that one
 * of them has stopped being a choice.
 */
export type Band = 'locked' | 'narrow' | 'usual' | 'wide';

/** Above this the favourite has taken the row, and sampling is a formality. */
const LOCKED = 0.99;
/** Above this the runner-up is the only realistic alternative. */
const NARROW = 0.75;
/** Above this the leader still carries the row on its own. */
const USUAL = 0.5;

export function bandFor(temperature: number): Band {
  const share = favouriteOf(openingRow(temperature)).probability;

  if (share >= LOCKED) return 'locked';
  if (share >= NARROW) return 'narrow';
  if (share >= USUAL) return 'usual';

  return 'wide';
}
