/**
 * Next-piece scoring, built once and reused.
 *
 * Two instruments in _What a large model does_ need the same machinery:
 * `NextPieceLoop` runs it forward one piece at a time to show that a model
 * cannot plan ahead and cannot take anything back, and `TemperatureDial` holds
 * the context still and turns one dial to show what temperature actually does
 * to the same row of numbers. Built once, the reader meets one distribution
 * twice; built twice, they are two unrelated toys.
 *
 * WHAT IS REAL HERE, AND WHAT IS STAGED. The arithmetic is real. A model
 * produces a raw score for every piece in its vocabulary, those scores are
 * divided by the temperature, softmax turns them into percentages that sum to
 * one, and a piece is drawn at random in those proportions. Every one of those
 * steps is what actually happens, in that order.
 *
 * What is staged is where the raw scores come from. A real model computes them
 * by running the whole transformer over everything written so far, and its
 * vocabulary is around 100,000 pieces rather than the handful here. This table
 * is hand-written so that a reader can see the whole row at once and watch it
 * change. Every unit using this has to say so.
 *
 * DETERMINISTIC. Sampling takes a seeded generator, never `Math.random()`, so
 * the same seed and the same dial always produce the same sentence — which is
 * what lets the prose and the tests quote it.
 */

export interface Candidate {
  readonly text: string;
  /**
   * The model's raw score for this piece, before temperature or softmax. Higher
   * means "more like what usually comes next here".
   *
   * These are logits in the ordinary sense: unbounded, and only their
   * DIFFERENCES matter, because softmax is unchanged by adding the same amount
   * to every one of them.
   */
  readonly logit: number;
}

export interface Scored {
  readonly text: string;
  /** Share of the probability, between 0 and 1. The row always sums to 1. */
  readonly probability: number;
}

export const OPENING = 'The weather today is';

/**
 * A small hand-written continuation table.
 *
 * Keyed by everything written so far, not just the last piece — because "the
 * model re-reads the whole thing every time" is one of the claims these
 * instruments exist to make, and a table keyed on the last word alone would
 * quietly contradict it.
 *
 * The `aubergine` branch is the point of the whole table. It is a bad piece
 * with a real, small chance of being drawn, and everything after it is a model
 * doing its best to continue from a word it should never have picked. That is
 * what "cannot take anything back" looks like from the inside.
 */
const TABLE: Record<string, readonly Candidate[]> = {
  'The weather today is': [
    { text: 'mild', logit: 3.1 },
    { text: 'cold', logit: 2.4 },
    { text: 'unsettled', logit: 1.6 },
    { text: 'glorious', logit: 0.7 },
    { text: 'aubergine', logit: -1.9 },
  ],

  'The weather today is mild': [
    { text: 'and', logit: 2.9 },
    { text: 'but', logit: 2.0 },
    { text: 'with', logit: 1.5 },
    { text: 'everywhere', logit: 0.2 },
  ],
  'The weather today is mild and': [
    { text: 'dry', logit: 3.0 },
    { text: 'bright', logit: 2.5 },
    { text: 'still', logit: 1.4 },
    { text: 'damp', logit: 0.6 },
  ],
  'The weather today is mild and dry': [
    { text: 'across', logit: 2.6 },
    { text: 'throughout', logit: 2.0 },
    { text: 'again', logit: 1.1 },
    { text: 'everywhere', logit: 0.9 },
  ],

  'The weather today is cold': [
    { text: 'and', logit: 2.8 },
    { text: 'enough', logit: 1.9 },
    { text: 'for', logit: 1.7 },
    { text: 'again', logit: 0.8 },
  ],
  'The weather today is cold and': [
    { text: 'clear', logit: 2.9 },
    { text: 'wet', logit: 2.3 },
    { text: 'windy', logit: 2.1 },
    { text: 'bright', logit: 1.2 },
  ],

  'The weather today is unsettled': [
    { text: 'with', logit: 2.7 },
    { text: 'and', logit: 2.4 },
    { text: 'across', logit: 1.3 },
    { text: 'again', logit: 0.7 },
  ],

  'The weather today is glorious': [
    { text: 'and', logit: 2.6 },
    { text: 'from', logit: 1.8 },
    { text: 'throughout', logit: 1.2 },
    { text: 'again', logit: 1.0 },
  ],

  // The branch it cannot get out of. Nothing here is a good continuation,
  // because there is no good continuation — and the model still has to pick one.
  'The weather today is aubergine': [
    { text: 'coloured', logit: 1.4 },
    { text: 'which', logit: 1.1 },
    { text: 'and', logit: 0.9 },
    { text: 'in', logit: 0.6 },
  ],
  'The weather today is aubergine coloured': [
    { text: 'and', logit: 1.5 },
    { text: 'today', logit: 1.0 },
    { text: 'throughout', logit: 0.8 },
    { text: 'again', logit: 0.5 },
  ],
};

/**
 * Used wherever the table runs out. Flat and unremarkable on purpose: a reader
 * who wanders off the written paths should see the sentence wind down, not meet
 * a dead end that looks like a bug.
 */
const FALLBACK: readonly Candidate[] = [
  { text: 'the', logit: 1.6 },
  { text: 'and', logit: 1.4 },
  { text: 'now', logit: 1.0 },
  { text: 'here', logit: 0.7 },
];

/** Everything the model could write next, given everything written so far. */
export function candidatesFor(written: string): readonly Candidate[] {
  return TABLE[written.trim()] ?? FALLBACK;
}

/** Contexts the table covers, so a test can walk every one of them. */
export const WRITTEN_CONTEXTS: readonly string[] = Object.keys(TABLE);

/**
 * Temperature is clamped rather than allowed to reach zero, because dividing by
 * zero is not a thing a dial should be able to do. The bottom of the range is
 * low enough that the top piece takes essentially all of the probability, which
 * is what "temperature zero" means in every interface that offers it.
 */
export const MIN_TEMPERATURE = 0.1;
export const MAX_TEMPERATURE = 2;

export const clampTemperature = (temperature: number): number =>
  Math.min(MAX_TEMPERATURE, Math.max(MIN_TEMPERATURE, temperature));

/**
 * Turn raw scores into percentages, at a given temperature.
 *
 * This is softmax with every score divided by the temperature first, and that
 * division is the whole of what the dial does. Dividing by a small number
 * spreads the scores further apart, so the gaps between them grow and the
 * largest one takes almost everything. Dividing by a large number squashes them
 * together, so the row flattens towards giving every piece an equal chance.
 *
 * Nothing is added, removed or reordered — a piece the model thought was third
 * best is still third best at every temperature. Only the gaps change.
 */
export function withTemperature(
  candidates: readonly Candidate[],
  temperature: number,
): Scored[] {
  if (candidates.length === 0) return [];

  const heat = clampTemperature(temperature);
  const scaled = candidates.map((candidate) => candidate.logit / heat);

  // Subtracting the largest changes none of the answers and stops `exp`
  // overflowing at low temperatures, where the scaled scores get big.
  const largest = Math.max(...scaled);
  const weights = scaled.map((score) => Math.exp(score - largest));
  const total = weights.reduce((sum, weight) => sum + weight, 0);

  return candidates.map((candidate, index) => ({
    text: candidate.text,
    probability: weights[index] / total,
  }));
}

/**
 * Which piece a draw of `draw` (between 0 and 1) lands on.
 *
 * Walks the row adding up probabilities until the running total passes the
 * draw — so a piece with 60% of the row occupies 60% of the interval and gets
 * picked 60% of the time. That is all "sampling in proportion" means.
 */
export function pickIndex(scored: readonly Scored[], draw: number): number {
  let running = 0;

  for (let index = 0; index < scored.length; index += 1) {
    running += scored[index].probability;
    if (draw < running) return index;
  }

  return scored.length - 1;
}

/** The piece the model rates highest, whatever the temperature. */
export function likeliest(candidates: readonly Candidate[]): number {
  return candidates.reduce(
    (best, candidate, index) =>
      candidate.logit > candidates[best].logit ? index : best,
    0,
  );
}

/**
 * A small seeded generator, so a run is repeatable.
 *
 * `Math.random()` would make the instrument non-deterministic, which the
 * interactive contract forbids and which would also stop the prose quoting
 * anything it produces.
 */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Step {
  /** Everything written before this piece was chosen. */
  readonly written: string;
  /** The row the model produced at that moment. */
  readonly row: Scored[];
  /** Which entry in the row was drawn. */
  readonly chosen: number;
}

/**
 * Run the loop: write a piece, append it, re-read everything, write the next.
 *
 * Returns every step rather than just the finished sentence, because the steps
 * ARE the lesson — each row was computed from the whole of what came before,
 * and no step ever revisits an earlier one.
 */
export function generate(
  temperature: number,
  seed: number,
  pieces: number,
  opening: string = OPENING,
): Step[] {
  const random = makeRng(seed);
  const steps: Step[] = [];
  let written = opening;

  for (let piece = 0; piece < pieces; piece += 1) {
    const row = withTemperature(candidatesFor(written), temperature);
    if (row.length === 0) break;

    const chosen = pickIndex(row, random());
    steps.push({ written, row, chosen });
    written = `${written} ${row[chosen].text}`;
  }

  return steps;
}

/**
 * The sentence a run produced, which is just the opening plus every choice.
 *
 * The opening is read back off the first step rather than passed in again. It
 * used to be a second parameter defaulting to `OPENING`, which meant a caller
 * who started `generate` somewhere else had to remember to say so twice — and
 * the failure was silent, producing a sentence with the wrong stem rather than
 * an error.
 */
export function sentenceOf(steps: readonly Step[]): string {
  if (steps.length === 0) return '';

  return steps.reduce(
    (text, step) => `${text} ${step.row[step.chosen].text}`,
    steps[0].written,
  );
}

/** Rounded to whole percent, which is how every view shows it. */
export const asPercent = (probability: number): number =>
  Math.round(probability * 100);
