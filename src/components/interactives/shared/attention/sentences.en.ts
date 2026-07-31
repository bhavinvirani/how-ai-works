/**
 * The sentences the attention instruments run on.
 *
 * English, so it lives in a locale file beside the logic rather than in
 * `src/copy/en.ts` — that file is UI chrome and says so. Same pattern as every
 * other instrument that carries its own examples.
 *
 * ONE SENTENCE, THREE INSTRUMENTS. `AttentionMap`, `MultiHeadLanes` and
 * `OrderBlindness` all read this sentence, so a reader who has met it once
 * arrives at the next unit already knowing what the words are and can spend
 * their attention on what changed. Picking a fresh sentence per instrument
 * would make each one a fresh reading exercise.
 *
 * WHY THESE WORDS. It needs a pronoun with an unambiguous earlier referent
 * ("she" → "student"), an action with an obvious doer ("carried" → "student"),
 * a plain object ("box"), and some genuinely empty words. The empty ones are
 * not padding: a word with nothing to ask with spreads its attention evenly
 * over the whole sentence, and seeing that happen is how a reader learns the
 * weights are computed rather than assigned.
 */
import type { Token } from './logic';

export const SENTENCE: readonly Token[] = [
  { text: 'The', features: {} },
  { text: 'student', features: { animate: 1, thing: 0.3 } },
  { text: 'carried', features: { action: 1 } },
  { text: 'the', features: {} },
  { text: 'box', features: { thing: 1 } },
  { text: 'because', features: {} },
  { text: 'she', features: { pronoun: 1 } },
  { text: 'was', features: {} },
  { text: 'strong', features: {} },
];

/** Positions worth pointing a reader at, by name rather than by index. */
export const WORD = {
  student: 1,
  carried: 2,
  box: 4,
  she: 6,
} as const;

/**
 * The same words in a different order, for `OrderBlindness`.
 *
 * Deliberately still readable as a scramble rather than as another sentence —
 * the claim is that attention cannot tell these apart, and that lands hardest
 * when the second one is obviously not English.
 */
export const SHUFFLED_ORDER: readonly number[] = [6, 4, 0, 8, 2, 1, 7, 3, 5];
