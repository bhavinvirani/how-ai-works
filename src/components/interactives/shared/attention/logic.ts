/**
 * The attention mechanism, built once and reused.
 *
 * Three instruments in _The idea that cracked it_ need the same arithmetic:
 * `AttentionMap` shows one word's blend, `MultiHeadLanes` shows four heads
 * disagreeing about the same sentence, and `OrderBlindness` shows every one of
 * them producing an identical answer when the words are shuffled. Built once
 * they are visibly the same machine seen three ways, which is most of the
 * teaching. Built three times they are three unrelated toys — the same argument
 * that produced `LayerStackDiagram` one Part earlier.
 *
 * WHAT IS REAL HERE, AND WHAT IS STAGED. The arithmetic is the real thing: a
 * score for every ordered pair of words, divided by the square root of the
 * width, pushed through softmax so each word's scores sum to one, then used to
 * mix the other words' contents. That is attention, not an impression of it.
 *
 * What is staged is where the scores come from. A real model *learns* the
 * projections that turn a word into a question and into a label, and what any
 * one head ends up meaning is nobody's decision — most are not interpretable at
 * all. Here they are hand-written so the patterns are legible on a nine-word
 * sentence. Every unit using this has to say so.
 *
 * WHAT IS DELIBERATELY NOT CLAIMED. An earlier draft had a head that matched
 * adjectives to the nouns they describe. It cannot work, and that is not a
 * limitation of this small version: deciding whether "heavy" belongs to "box"
 * or to "student" depends on where the words sit, and a score built only from
 * what two words MEAN has no access to that. Rather than fake it, the fourth
 * head here is honest about needing position — it is flat and useless until
 * position is switched on, which is precisely what `positional-encoding` is
 * about.
 *
 * Nothing here is random, so the same sentence names the same weights today and
 * in two years — which is what lets the prose, the diagrams and the tests all
 * quote the same numbers.
 */

/**
 * The meaning dimensions a word can carry, and the only thing a content head is
 * allowed to look at.
 *
 * Four named features rather than an opaque vector of sixty-four floats,
 * because the reader is going to be told what a head is doing and that claim
 * has to be checkable by looking at it.
 */
export type Feature = 'pronoun' | 'animate' | 'thing' | 'action';

export const FEATURES: readonly Feature[] = [
  'pronoun',
  'animate',
  'thing',
  'action',
];

export interface Token {
  readonly text: string;
  /**
   * How strongly this word carries each meaning. Absent features are zero, and
   * a word with none at all — "the", "because" — is not an oversight: it has
   * nothing to ask with, so it spreads its attention evenly over everything.
   */
  readonly features: Partial<Readonly<Record<Feature, number>>>;
}

/**
 * One rule inside a head: "a word carrying `asks` leans towards a word
 * carrying `offers`, this much".
 *
 * A head is really a matrix sandwiched between the two words — score(i, j) is
 * `features(i) · M · features(j)` — and this is that matrix written sparsely.
 * Storing the handful of non-zero entries rather than sixteen mostly-zero ones
 * keeps a head readable as a claim about language.
 */
export interface AffinityRule {
  readonly asks: Feature;
  readonly offers: Feature;
  readonly weight: number;
}

export interface Head {
  readonly id: string;
  /** Content rules. Empty for a head that works on position alone. */
  readonly rules: readonly AffinityRule[];
  /**
   * How strongly this head prefers the word immediately before it.
   *
   * Zero for the content heads. The one head that sets it is inert without
   * position, on purpose — see the note at the top of this file.
   */
  readonly previousWordPull?: number;
}

/**
 * Four heads, each tracking a different kind of relationship on the same
 * sentence.
 *
 * They are deliberately not a decomposition of one thing into four parts. Each
 * is a complete, independent reading, which is the point
 * `multi-head-attention` exists to make.
 */
export const HEADS: readonly Head[] = [
  {
    // "Which earlier thing does this word stand in for?"
    id: 'reference',
    rules: [
      { asks: 'pronoun', offers: 'animate', weight: 3.4 },
      { asks: 'pronoun', offers: 'thing', weight: 2.1 },
    ],
  },
  {
    // "Who is doing this?"
    id: 'doer',
    rules: [
      { asks: 'action', offers: 'animate', weight: 3.2 },
      { asks: 'action', offers: 'thing', weight: 1.3 },
    ],
  },
  {
    // "What is this thing caught up in?"
    id: 'subject-matter',
    rules: [
      { asks: 'thing', offers: 'action', weight: 1.9 },
      { asks: 'thing', offers: 'thing', weight: 1.5 },
    ],
  },
  {
    // "What came just before me?" — nothing about meaning can answer this.
    id: 'previous-word',
    rules: [],
    previousWordPull: 4.2,
  },
];

export const HEAD_IDS: readonly string[] = HEADS.map((head) => head.id);

/** Widths in a real model are in the hundreds; the scaling is the same idea. */
const WIDTH = FEATURES.length;

/** How sharply every word prefers its neighbours once position is stamped in. */
const NEARNESS_STRENGTH = 1.15;

const featureValue = (token: Token, feature: Feature): number =>
  token.features[feature] ?? 0;

/** `features(from) · M · features(to)`, with M written out as rules. */
function contentScore(head: Head, from: Token, to: Token): number {
  return head.rules.reduce(
    (total, rule) =>
      total +
      rule.weight *
        featureValue(from, rule.asks) *
        featureValue(to, rule.offers),
    0,
  );
}

export interface ScoreOptions {
  /**
   * Whether each word knows where it sits in the sentence. Off by default,
   * because attention on its own genuinely does not.
   */
  readonly positional?: boolean;
}

/**
 * Softmax: turn a row of scores into a row of shares that sums to one.
 *
 * The largest score is subtracted first. That changes none of the answers —
 * softmax is unchanged by shifting every input by the same amount — and it
 * stops `exp` overflowing, which is how this is written everywhere it appears.
 */
export function softmax(scores: readonly number[]): number[] {
  if (scores.length === 0) return [];

  const largest = Math.max(...scores);
  const exponentiated = scores.map((score) => Math.exp(score - largest));
  const total = exponentiated.reduce((sum, value) => sum + value, 0);

  return exponentiated.map((value) => value / total);
}

/**
 * How much each word in the sentence contributes to the word at `index`.
 *
 * The returned row always sums to one: every word spends exactly one unit of
 * attention, so leaning harder on one word necessarily means leaning less on
 * everything else. That constraint is why attention behaves like a budget
 * rather than a set of independent dials.
 */
export function attentionRow(
  sentence: readonly Token[],
  index: number,
  head: Head,
  options: ScoreOptions = {},
): number[] {
  const from = sentence[index];
  if (!from) return [];

  const scores = sentence.map((to, position) => {
    const base = contentScore(head, from, to) / Math.sqrt(WIDTH);
    if (!options.positional) return base;

    const nearness =
      (NEARNESS_STRENGTH * Math.abs(position - index)) / sentence.length;
    const previous = position === index - 1 ? (head.previousWordPull ?? 0) : 0;

    return base - nearness + previous;
  });

  return softmax(scores);
}

/** Every row at once: `matrix[i][j]` is how much word j feeds into word i. */
export function attentionMatrix(
  sentence: readonly Token[],
  head: Head,
  options: ScoreOptions = {},
): number[][] {
  return sentence.map((_, index) =>
    attentionRow(sentence, index, head, options),
  );
}

/**
 * The word a given word leans on hardest — the one thing a reader takes away
 * from a row of numbers.
 */
export function strongestSource(
  sentence: readonly Token[],
  index: number,
  head: Head,
  options: ScoreOptions = {},
): number {
  const row = attentionRow(sentence, index, head, options);

  return row.reduce(
    (best, weight, position) => (weight > row[best] ? position : best),
    0,
  );
}

/**
 * What a word's meaning becomes after one round of attention: the blend of
 * every word's features, in the proportions the row just decided.
 *
 * This is the output of the mechanism, and it is what `OrderBlindness` compares
 * across two arrangements of the same words. Comparing the *weights* would not
 * settle that question — they are indexed by position, so shuffling reorders
 * them trivially. Comparing what each word ends up meaning does.
 */
export function blend(
  sentence: readonly Token[],
  index: number,
  head: Head,
  options: ScoreOptions = {},
): Record<Feature, number> {
  const row = attentionRow(sentence, index, head, options);

  const mixed = {} as Record<Feature, number>;
  for (const feature of FEATURES) {
    mixed[feature] = sentence.reduce(
      (total, token, position) =>
        total + row[position] * featureValue(token, feature),
      0,
    );
  }

  return mixed;
}

/** Rounded to the nearest whole percent, which is how every view shows it. */
export const asPercent = (weight: number): number => Math.round(weight * 100);

/** Two blends are the same meaning when nothing in them differs measurably. */
export function sameBlend(
  left: Record<Feature, number>,
  right: Record<Feature, number>,
  tolerance = 1e-9,
): boolean {
  return FEATURES.every(
    (feature) => Math.abs(left[feature] - right[feature]) < tolerance,
  );
}
