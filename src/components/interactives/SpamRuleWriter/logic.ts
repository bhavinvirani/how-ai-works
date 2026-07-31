/**
 * Pure logic for SpamRuleWriter (§3.3).
 *
 * The instrument teaches one thing: there is no set of hand-written rules that
 * catches all the junk without destroying real mail — and the set that looks
 * perfect today stops working the moment senders reword.
 *
 * That second half is why `bestAchievable` exists. The artifact this is ported
 * from *asserted* that rules rot; here the claim is computed. With five rules
 * there are only 32 combinations, so we can search all of them and say, truly,
 * what the best possible score is. Computed honesty beats asserted honesty, and
 * it is trivially testable.
 */

/** Which inbox is on screen. Two weeks, same senders, different wording. */
export type Week = 'this-week' | 'next-week';

export interface Message {
  id: string;
  subject: string;
  /**
   * Whether the body asks the reader to follow a link. Not derivable from the
   * subject, and deliberately kept as its own signal: real filters mix text
   * features with structural ones, and the whole lesson depends on this
   * particular signal being the one that looks decisive and then rots.
   */
  asksYouToFollowALink: boolean;
  isJunk: boolean;
}

export type RuleId = 'shouting' | 'exclamations' | 'free' | 'urgent' | 'link';

export interface Rule {
  id: RuleId;
  /** Does this rule block that message? */
  blocks: (message: Message) => boolean;
}

/**
 * The five rules, as predicates. Labels live in `data.en.ts` — hard rule 10
 * keeps user-facing English out of components, and a rule's *behaviour* is
 * logic while its *name* is copy.
 */
export const RULES: readonly Rule[] = [
  {
    id: 'shouting',
    // A run of four or more capitals: SHOUTING, not an initialism like "Re".
    blocks: (m) => /\b[A-Z]{4,}\b/.test(m.subject),
  },
  {
    id: 'exclamations',
    blocks: (m) => (m.subject.match(/!/g) ?? []).length >= 2,
  },
  { id: 'free', blocks: (m) => /\bfree\b/i.test(m.subject) },
  { id: 'urgent', blocks: (m) => /\burgent\b/i.test(m.subject) },
  { id: 'link', blocks: (m) => m.asksYouToFollowALink },
];

/** What happened to one message under the current rules. */
export type Outcome =
  'junk-blocked' | 'junk-slipped' | 'real-kept' | 'real-lost';

export interface Verdict {
  message: Message;
  blocked: boolean;
  outcome: Outcome;
}

export interface Score {
  /** Real messages the rules threw away. The expensive kind of mistake. */
  lost: number;
  /** Junk the rules failed to catch. */
  slipped: number;
}

export const totalMistakes = (score: Score): number =>
  score.lost + score.slipped;

/** A message is blocked if ANY active rule blocks it — the usual filter shape. */
export function isBlocked(
  message: Message,
  activeRuleIds: readonly RuleId[],
): boolean {
  return RULES.filter((rule) => activeRuleIds.includes(rule.id)).some((rule) =>
    rule.blocks(message),
  );
}

export function judge(
  messages: readonly Message[],
  activeRuleIds: readonly RuleId[],
): Verdict[] {
  return messages.map((message) => {
    const blocked = isBlocked(message, activeRuleIds);
    const outcome: Outcome = message.isJunk
      ? blocked
        ? 'junk-blocked'
        : 'junk-slipped'
      : blocked
        ? 'real-lost'
        : 'real-kept';

    return { message, blocked, outcome };
  });
}

export function score(
  messages: readonly Message[],
  activeRuleIds: readonly RuleId[],
): Score {
  const verdicts = judge(messages, activeRuleIds);

  return {
    lost: verdicts.filter((v) => v.outcome === 'real-lost').length,
    slipped: verdicts.filter((v) => v.outcome === 'junk-slipped').length,
  };
}

/**
 * The best any combination of the five rules can manage on this inbox.
 *
 * Brute force over all 2^5 subsets. That is 32 evaluations, which is nothing,
 * and it means the instrument can state a limit as a fact rather than as a
 * claim the reader has to take on trust.
 */
export function bestAchievable(messages: readonly Message[]): {
  score: Score;
  ruleIds: RuleId[];
} {
  const ids = RULES.map((rule) => rule.id);
  let best: { score: Score; ruleIds: RuleId[] } | null = null;

  for (let mask = 0; mask < 1 << ids.length; mask++) {
    const subset = ids.filter((_, index) => (mask & (1 << index)) !== 0);
    const candidate = score(messages, subset);

    if (best === null || totalMistakes(candidate) < totalMistakes(best.score)) {
      best = { score: candidate, ruleIds: subset };
    }
  }

  // `RULES` is non-empty, so the loop always runs at least once. The assertion
  // is for the type system, not for a case that can happen.
  if (best === null) throw new Error('RULES must not be empty');

  return best;
}
