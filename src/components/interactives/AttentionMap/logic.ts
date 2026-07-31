/**
 * Pure logic for AttentionMap (§3.3).
 *
 * The instrument teaches one thing: a word rebuilds its meaning out of whichever
 * other words answered its question, and the shares it spends doing that always
 * add up to exactly one. Leaning harder on one word is not a free action — it
 * costs everything else.
 *
 * ALMOST NOTHING LIVES HERE, AND THAT IS THE POINT. The arithmetic is in
 * `../shared/attention/logic`, which `MultiHeadLanes` and `OrderBlindness` also
 * read. Three instruments running the same mechanism is most of the teaching in
 * this Part; three instruments running three lookalike copies of it would be
 * three unrelated toys. So this file adds only what this one view needs — which
 * question is on show, whether a row came out flat, and what the word ended up
 * meaning.
 *
 * ONE QUESTION AT A TIME. The shared module has four heads; this instrument
 * offers three of them and calls them questions rather than heads. Two reasons.
 * The fourth (`previous-word`) is deliberately inert until position is stamped
 * in, so it would show a reader a dead row and teach nothing until
 * `positional-encoding`. And the word "head" belongs to `multi-head-attention`,
 * where running several at once is the whole idea — arriving at that unit having
 * already met four of them spends the surprise early.
 *
 * Nothing here is random and nothing reads a clock, so "she" spends 43% of its
 * attention on "student" today and in two years — which is what lets the prose,
 * the diagram and the tests all quote one set of numbers.
 */
import type { Feature, Head } from '../shared/attention/logic';
import {
  asPercent,
  attentionRow,
  blend,
  FEATURES,
  HEADS,
  strongestSource,
} from '../shared/attention/logic';
import { SENTENCE, WORD } from '../shared/attention/sentences.en';

/**
 * The three questions a reader can put to the sentence.
 *
 * The ids are the shared module's head ids, so nothing has to be kept in step
 * by hand: rename a head there and this file stops compiling rather than
 * quietly offering a question that no longer exists.
 */
export type QuestionId = 'reference' | 'doer' | 'subject-matter';

export const QUESTION_IDS: readonly QuestionId[] = [
  'reference',
  'doer',
  'subject-matter',
];

/**
 * "Which earlier thing does this word stand in for?" — the question that makes
 * the sentence's pronoun do something visible, and the one the unit's prose
 * walks through.
 */
export const DEFAULT_QUESTION: QuestionId = 'reference';

/** "she". The instrument opens on the word whose answer is worth arriving to. */
export const DEFAULT_WORD: number = WORD.she;

export const WORD_COUNT: number = SENTENCE.length;

const HEAD_BY_ID = new Map<string, Head>(HEADS.map((head) => [head.id, head]));

/**
 * The shared head behind a question.
 *
 * Throws rather than falling back, because a missing head means the shared
 * module changed underneath this instrument and every number on the page is
 * then unverified. Failing loudly in a test is much cheaper than shipping a
 * silently substituted reading.
 */
export function headFor(question: QuestionId): Head {
  const head = HEAD_BY_ID.get(question);
  if (!head) {
    throw new Error(`the shared attention module has no "${question}" head`);
  }

  return head;
}

/** Keeps a chosen word inside the sentence, whatever the view hands over. */
export function clampWord(index: number): number {
  return Math.min(WORD_COUNT - 1, Math.max(0, Math.round(index)));
}

/**
 * Whether a row is flat — every word given exactly the same share.
 *
 * This is not a rounding question, so the tolerance is tiny on purpose. A word
 * carrying no meaning features at all scores zero against everything, and
 * softmax turns a row of equal scores into a row of equal shares — exactly, not
 * approximately. Treating "nearly flat" as flat would let a real preference
 * hide behind the word "evenly".
 */
export function spreadsEvenly(
  weights: readonly number[],
  tolerance = 1e-9,
): boolean {
  if (weights.length === 0) return false;

  const even = 1 / weights.length;

  return weights.every((weight) => Math.abs(weight - even) < tolerance);
}

/**
 * What the printed percentages add up to.
 *
 * The weights sum to one; the numbers on the chips are those weights rounded to
 * whole percents, so they can land a point either side of a hundred. The
 * instrument says so on its face rather than letting a reader who adds them up
 * conclude the budget leaks.
 */
export function printedTotal(weights: readonly number[]): number {
  return weights.reduce((total, weight) => total + asPercent(weight), 0);
}

/** Every meaning dimension the word carried before any of this ran. */
function ownFeatures(index: number): Record<Feature, number> {
  const own = {} as Record<Feature, number>;
  for (const feature of FEATURES) {
    own[feature] = SENTENCE[index]?.features[feature] ?? 0;
  }

  return own;
}

/** The meaning a word ends up holding most of. */
export function dominantFeature(
  meaning: Readonly<Record<Feature, number>>,
): Feature {
  return FEATURES.reduce((best, feature) =>
    meaning[feature] > meaning[best] ? feature : best,
  );
}

export interface Reading {
  /** The word doing the asking. */
  readonly word: number;
  readonly text: string;
  /** Its share of attention on each word of the sentence. Sums to one. */
  readonly weights: readonly number[];
  /** The word it leaned on hardest. */
  readonly strongest: number;
  readonly strongestText: string;
  readonly strongestPercent: number;
  /** True when nothing matched better than anything else. */
  readonly spreadsEvenly: boolean;
  /** What it meant on arrival. */
  readonly before: Readonly<Record<Feature, number>>;
  /** What it means after one round of attention — the output of the whole thing. */
  readonly after: Readonly<Record<Feature, number>>;
}

/**
 * One word's complete answer to one question.
 *
 * Assembled in a single place so the chips, the meaning strip and the spoken
 * readout are three views of the same numbers rather than three calculations
 * that might drift apart.
 */
export function readingFor(index: number, question: QuestionId): Reading {
  const word = clampWord(index);
  const head = headFor(question);

  const weights = attentionRow(SENTENCE, word, head);
  const strongest = strongestSource(SENTENCE, word, head);

  return {
    word,
    text: SENTENCE[word]?.text ?? '',
    weights,
    strongest,
    strongestText: SENTENCE[strongest]?.text ?? '',
    strongestPercent: asPercent(weights[strongest] ?? 0),
    spreadsEvenly: spreadsEvenly(weights),
    before: ownFeatures(word),
    after: blend(SENTENCE, word, head),
  };
}
