/**
 * Pure logic for ScoringRulePicker (§3.3).
 *
 * The instrument teaches one thing: a machine can only chase one number, so
 * whatever that number counts is what the machine becomes — and every quality
 * left out of it is free to get worse.
 *
 * The model here is five fixed candidate answers rather than a continuous set
 * of dials. That is a discretisation of training, not a different thing: real
 * training keeps whatever setting scores lowest out of billions of candidates,
 * and this keeps whatever answer scores lowest out of five. Making the
 * candidate set small and fixed is what lets the prose say "watch this one
 * survive" and be right every time.
 *
 * No randomness and no clock anywhere — same rule in, same winner out, on every
 * visit and in every test.
 */

/** A thing someone might care about in an answer. */
export type QualityId = 'correct' | 'liked' | 'brief' | 'admitsDoubt';

/**
 * Fixed order, because it is the order the readout bars appear in and the order
 * ties are broken in. Ordering that matters should be written down once.
 */
export const QUALITIES: readonly QualityId[] = [
  'correct',
  'liked',
  'brief',
  'admitsDoubt',
];

export type ReplyId = 'cheerful' | 'assured' | 'careful' | 'blunt' | 'gaveUp';

export interface Reply {
  id: ReplyId;
  /**
   * Nought to ten on each quality, and higher is always better — including for
   * `brief`, where ten means short. Uniform direction costs a little realism
   * and saves the reader from having to remember which way round each row runs.
   */
  qualities: Readonly<Record<QualityId, number>>;
}

/**
 * Five answers to one question, hand-set so that each scoring rule below keeps
 * a different one. That is the whole surprise the instrument exists to deliver,
 * and `logic.test.ts` pins it so an innocent-looking edit cannot quietly remove
 * it.
 *
 * `gaveUp` scores 3 on `correct` rather than 0: refusing to answer is never
 * wrong, and never right either.
 */
export const REPLIES: readonly Reply[] = [
  {
    id: 'cheerful',
    qualities: { correct: 1, liked: 9, brief: 6, admitsDoubt: 0 },
  },
  {
    id: 'assured',
    qualities: { correct: 6, liked: 8, brief: 9, admitsDoubt: 0 },
  },
  {
    id: 'careful',
    qualities: { correct: 9, liked: 4, brief: 2, admitsDoubt: 9 },
  },
  {
    id: 'blunt',
    qualities: { correct: 7, liked: 5, brief: 9, admitsDoubt: 2 },
  },
  {
    id: 'gaveUp',
    qualities: { correct: 3, liked: 1, brief: 10, admitsDoubt: 10 },
  },
];

export type RuleId = 'liked' | 'correct' | 'brief' | 'liked-and-correct';

export interface ScoringRule {
  id: RuleId;
  /** The qualities this rule counts. Everything else is invisible to it. */
  measures: readonly QualityId[];
}

export const RULES: readonly ScoringRule[] = [
  { id: 'liked', measures: ['liked'] },
  { id: 'correct', measures: ['correct'] },
  { id: 'brief', measures: ['brief'] },
  { id: 'liked-and-correct', measures: ['liked', 'correct'] },
];

export function ruleById(id: RuleId): ScoringRule {
  const found = RULES.find((rule) => rule.id === id);
  if (found === undefined) throw new Error(`no scoring rule called ${id}`);
  return found;
}

/** Full marks on a quality. Ten rather than one so the bars read as scores. */
const PERFECT = 10;

/**
 * How badly a reply does under a rule, as one number where lower is better.
 *
 * Lower-is-better is not decoration: it is what a loss is, and the unit says so
 * in words. Averaging rather than summing means a rule that counts two things
 * stays on the same scale as one that counts one, so the reader can compare the
 * readouts across rules without being quietly misled.
 */
export function loss(reply: Reply, rule: ScoringRule): number {
  if (rule.measures.length === 0) return 0;

  const total = rule.measures.reduce(
    (sum, quality) => sum + (PERFECT - reply.qualities[quality]),
    0,
  );

  return total / rule.measures.length;
}

export interface Standing {
  reply: Reply;
  loss: number;
  /** True for the single reply the rule keeps. */
  isKept: boolean;
}

/**
 * Every reply ranked, lowest loss first.
 *
 * `sort` is stable in every engine this ships to, so replies on an equal score
 * stay in declaration order and the winner never changes between renders.
 */
export function rankByLoss(
  rule: ScoringRule,
  replies: readonly Reply[] = REPLIES,
): Standing[] {
  const ranked = replies
    .map((reply) => ({ reply, loss: loss(reply, rule) }))
    .sort((a, b) => a.loss - b.loss);

  return ranked.map((standing, index) => ({
    ...standing,
    isKept: index === 0,
  }));
}

/**
 * The same scores in the order the replies are written, so the on-screen list
 * never reorders itself under the reader's eyes when the rule changes. Only the
 * mark saying which one was kept moves.
 */
export function scoreboard(
  rule: ScoringRule,
  replies: readonly Reply[] = REPLIES,
): Standing[] {
  const keptId = winner(rule, replies).id;

  return replies.map((reply) => ({
    reply,
    loss: loss(reply, rule),
    isKept: reply.id === keptId,
  }));
}

/** The reply a rule keeps: the one whose score is smallest. */
export function winner(
  rule: ScoringRule,
  replies: readonly Reply[] = REPLIES,
): Reply {
  const [best] = rankByLoss(rule, replies);
  if (best === undefined) throw new Error('there are no replies to score');
  return best.reply;
}

/** The qualities a rule does not look at. */
export function unmeasured(rule: ScoringRule): QualityId[] {
  return QUALITIES.filter((quality) => !rule.measures.includes(quality));
}

export interface WeakSpot {
  quality: QualityId;
  value: number;
}

/**
 * The unmeasured quality this reply is worst at — the price of the choice,
 * stated as a fact rather than implied.
 *
 * Null only when a rule counts everything, which no real scoring rule ever
 * does; it is here because the type system is right to ask.
 */
export function weakestUnmeasured(
  reply: Reply,
  rule: ScoringRule,
): WeakSpot | null {
  return unmeasured(rule).reduce<WeakSpot | null>((worst, quality) => {
    const value = reply.qualities[quality];
    return worst === null || value < worst.value ? { quality, value } : worst;
  }, null);
}
