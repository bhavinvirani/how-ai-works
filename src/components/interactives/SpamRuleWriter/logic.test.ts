import { describe, expect, it } from 'vitest';

import { INBOXES } from './data.en';
import { bestAchievable, judge, score, totalMistakes } from './logic';
import type { RuleId } from './logic';

const thisWeek = INBOXES['this-week'];
const nextWeek = INBOXES['next-week'];

const NONE: RuleId[] = [];
const LINK_ONLY: RuleId[] = ['link'];

describe('judge', () => {
  it('sorts every message into one of the four outcomes', () => {
    const verdicts = judge(thisWeek, LINK_ONLY);

    expect(verdicts).toHaveLength(thisWeek.length);
    for (const verdict of verdicts) {
      expect(verdict.outcome).toMatch(
        /^(junk-blocked|junk-slipped|real-kept|real-lost)$/,
      );
      expect(verdict.blocked).toBe(
        verdict.outcome === 'junk-blocked' || verdict.outcome === 'real-lost',
      );
    }
  });

  it('blocks a message when ANY active rule blocks it', () => {
    // "WIN a FREE holiday" trips shouting, free, and link independently.
    const [first] = judge(thisWeek, ['shouting']);
    expect(first.blocked).toBe(true);
  });

  it('blocks nothing when no rule is on', () => {
    expect(judge(nextWeek, NONE).every((v) => !v.blocked)).toBe(true);
  });
});

describe('score', () => {
  it('counts everything as slipped junk when no rule is on', () => {
    expect(score(thisWeek, NONE)).toEqual({ lost: 0, slipped: 4 });
  });

  it('does not confuse a real message kept with junk blocked', () => {
    const { lost, slipped } = score(thisWeek, LINK_ONLY);
    expect(lost).toBe(0);
    expect(slipped).toBe(0);
  });
});

/**
 * These two are the unit's argument, not incidental coverage. If the datasets
 * ever drift so that week one is not winnable or week two is, the instrument
 * stops teaching what the prose around it claims — and nothing else in the
 * build would notice.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('week one is winnable — one rule scores a clean sweep', () => {
    expect(score(thisWeek, LINK_ONLY)).toEqual({ lost: 0, slipped: 0 });
    expect(totalMistakes(bestAchievable(thisWeek).score)).toBe(0);
  });

  it('week two punishes the rule that just won', () => {
    const after = score(nextWeek, LINK_ONLY);
    expect(after.slipped).toBe(0);
    expect(after.lost).toBeGreaterThan(0);
  });

  it('week two is not winnable by ANY combination of the five rules', () => {
    expect(totalMistakes(bestAchievable(nextWeek).score)).toBeGreaterThan(0);
  });
});

describe('bestAchievable', () => {
  it('is never beaten by a hand-picked set', () => {
    const best = totalMistakes(bestAchievable(nextWeek).score);
    const candidates: RuleId[][] = [
      [],
      ['link'],
      ['free', 'urgent'],
      ['shouting', 'exclamations', 'free', 'urgent', 'link'],
    ];

    for (const candidate of candidates) {
      expect(totalMistakes(score(nextWeek, candidate))).toBeGreaterThanOrEqual(
        best,
      );
    }
  });

  it('returns a rule set that actually achieves the score it reports', () => {
    const { score: reported, ruleIds } = bestAchievable(nextWeek);
    expect(score(nextWeek, ruleIds)).toEqual(reported);
  });
});
