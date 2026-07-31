import { describe, expect, it } from 'vitest';

import {
  loss,
  QUALITIES,
  rankByLoss,
  REPLIES,
  RULES,
  ruleById,
  scoreboard,
  unmeasured,
  weakestUnmeasured,
  winner,
} from './logic';
import type { Reply, ScoringRule } from './logic';

const perfect = (id: Reply['id']): Reply => ({
  id,
  qualities: { correct: 10, liked: 10, brief: 10, admitsDoubt: 10 },
});

const LIKED = ruleById('liked');
const CORRECT = ruleById('correct');
const BRIEF = ruleById('brief');
const BOTH = ruleById('liked-and-correct');

describe('loss', () => {
  it('is zero when the reply is perfect at what is measured', () => {
    expect(loss(perfect('cheerful'), LIKED)).toBe(0);
  });

  it('counts how far from perfect the measured quality is', () => {
    const reply: Reply = {
      id: 'blunt',
      qualities: { correct: 0, liked: 4, brief: 0, admitsDoubt: 0 },
    };
    expect(loss(reply, LIKED)).toBe(6);
  });

  it('averages when a rule counts two things, so scales match', () => {
    const reply: Reply = {
      id: 'blunt',
      qualities: { correct: 2, liked: 6, brief: 0, admitsDoubt: 0 },
    };
    // Eight off on one, four off on the other: six on average.
    expect(loss(reply, BOTH)).toBe(6);
  });

  it('cannot see a quality the rule does not measure', () => {
    const good: Reply = {
      id: 'careful',
      qualities: { correct: 10, liked: 5, brief: 0, admitsDoubt: 0 },
    };
    const bad: Reply = {
      id: 'blunt',
      qualities: { correct: 0, liked: 5, brief: 10, admitsDoubt: 10 },
    };
    expect(loss(good, LIKED)).toBe(loss(bad, LIKED));
  });

  it('has nothing to be wrong about when a rule measures nothing', () => {
    const empty: ScoringRule = { id: 'liked', measures: [] };
    expect(loss(perfect('gaveUp'), empty)).toBe(0);
  });
});

describe('ranking and keeping', () => {
  it('puts the smallest score first, because lower is better', () => {
    const ranked = rankByLoss(CORRECT);
    const scores = ranked.map((standing) => standing.loss);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
  });

  it('marks exactly one reply as kept', () => {
    const keptCount = scoreboard(LIKED).filter(
      (standing) => standing.isKept,
    ).length;
    expect(keptCount).toBe(1);
  });

  it('leaves the scoreboard in the order the replies are written', () => {
    expect(scoreboard(BRIEF).map((standing) => standing.reply.id)).toEqual(
      REPLIES.map((reply) => reply.id),
    );
  });

  it('breaks a tie by declaration order, so the winner never wobbles', () => {
    const tied: Reply[] = [perfect('blunt'), perfect('careful')];
    expect(winner(LIKED, tied).id).toBe('blunt');
    expect(winner(LIKED, [...tied].reverse()).id).toBe('careful');
  });
});

describe('what the rule never looked at', () => {
  it('is everything the rule does not measure', () => {
    expect(unmeasured(LIKED)).toEqual(['correct', 'brief', 'admitsDoubt']);
    expect(unmeasured(BOTH)).toEqual(['brief', 'admitsDoubt']);
  });

  it('reports the unmeasured quality the winner is worst at', () => {
    const weakness = weakestUnmeasured(winner(CORRECT), CORRECT);
    expect(weakness).toEqual({ quality: 'brief', value: 2 });
  });

  it('reports nothing when a rule somehow counts every quality', () => {
    const everything: ScoringRule = { id: 'liked', measures: QUALITIES };
    expect(weakestUnmeasured(winner(everything), everything)).toBeNull();
  });
});

/**
 * The unit claims two things out loud, so both are pinned here. An edit to the
 * reply table that quietly removes either one would make the prose wrong while
 * every other test stayed green.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('keeps a different answer under every rule', () => {
    const kept = RULES.map((rule) => winner(rule).id);
    expect(new Set(kept).size).toBe(RULES.length);
  });

  it('buys approval with accuracy: scoring liked keeps a wrong one', () => {
    const forApproval = winner(LIKED);
    const forAccuracy = winner(CORRECT);
    expect(forApproval.qualities.correct).toBeLessThan(
      forAccuracy.qualities.correct,
    );
  });

  it('buys shortness with usefulness: scoring short keeps a shrug', () => {
    expect(winner(BRIEF).id).toBe('gaveUp');
    expect(winner(BRIEF).qualities.liked).toBeLessThan(3);
  });

  it('leaves the winner badly off on something nobody measured', () => {
    for (const rule of RULES) {
      const weakness = weakestUnmeasured(winner(rule), rule);
      expect(weakness).not.toBeNull();
      expect(weakness?.value).toBeLessThan(5);
    }
  });

  it('keeps every quality on a nought-to-ten scale', () => {
    for (const reply of REPLIES) {
      for (const quality of QUALITIES) {
        expect(reply.qualities[quality]).toBeGreaterThanOrEqual(0);
        expect(reply.qualities[quality]).toBeLessThanOrEqual(10);
      }
    }
  });
});
