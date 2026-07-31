import { describe, expect, it } from 'vitest';

import {
  copiesOf,
  judge,
  nearestStudied,
  percentageCorrect,
  REPEATED_ROUND_COUNT,
  ROUND_COUNT,
  ROUNDS,
  roundsOnBothSides,
  scoreOf,
  splitRounds,
  wasLoggedTwice,
} from './logic';

/** Rows dealt out one at a time — a plain shuffle, and what everyone writes first. */
const ROW_BY_ROW = false;
/** Whole rounds dealt out instead, so no round can straddle the split. */
const BY_ROUND = true;

describe('the dataset', () => {
  it('holds twenty rounds across twenty-four rows, four of them logged twice', () => {
    expect(ROUNDS).toHaveLength(24);
    expect(ROUND_COUNT).toBe(20);
    expect(REPEATED_ROUND_COUNT).toBe(4);
  });

  it('gives both logs of a round the same outcome and a slightly different mileage', () => {
    const repeated = ROUNDS.filter(wasLoggedTwice);
    expect(repeated).toHaveLength(8);

    for (const record of repeated) {
      const copies = copiesOf(record.roundNumber);
      expect(copies).toHaveLength(2);

      const [first, second] = copies;
      // Same delivery, so the same thing happened to it.
      expect(first.finishedLate).toBe(second.finishedLate);
      // Two systems, two slightly different readings. Near-duplicates, not
      // duplicates — an exact-match check would never find these.
      expect(first.distanceKm).not.toBe(second.distanceKm);
      expect(first.parcels).not.toBe(second.parcels);
    }
  });
});

describe('splitRounds', () => {
  it('keeps both piles the same size whichever way the split is made', () => {
    for (const style of [ROW_BY_ROW, BY_ROUND]) {
      const { studied, heldBack } = splitRounds(style);
      expect(studied).toHaveLength(14);
      expect(heldBack).toHaveLength(10);
    }
  });

  it('accounts for every row exactly once', () => {
    for (const style of [ROW_BY_ROW, BY_ROUND]) {
      const { studied, heldBack } = splitRounds(style);
      const ids = new Set([...studied, ...heldBack].map((round) => round.id));
      expect(ids.size).toBe(ROUNDS.length);
    }
  });
});

describe('nearestStudied', () => {
  it('finds a row itself when that row is in the studied pile', () => {
    const { studied } = splitRounds(ROW_BY_ROW);

    for (const record of studied) {
      expect(nearestStudied(record, studied).id).toBe(record.id);
    }
  });

  it('is deterministic — the same question twice gives the same answer', () => {
    const { studied, heldBack } = splitRounds(BY_ROUND);

    for (const record of heldBack) {
      expect(nearestStudied(record, studied).id).toBe(
        nearestStudied(record, studied).id,
      );
    }
  });
});

/**
 * These are the unit's argument, not incidental coverage. If the dataset ever
 * drifts so that the held-back score no longer collapses when the split is
 * repaired, the instrument stops teaching what the prose beside it claims —
 * and nothing else in the build would notice.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('scores a flawless 100% on the rows it studied, whatever the split', () => {
    for (const style of [ROW_BY_ROW, BY_ROUND]) {
      const score = scoreOf(judge('studied', style));
      expect(score.correct).toBe(score.total);
      expect(percentageCorrect(score)).toBe(100);
    }
  });

  it('scores a suspiciously perfect 100% on held-back rows when rows are dealt out one at a time', () => {
    const score = scoreOf(judge('held-back', ROW_BY_ROW));
    expect(percentageCorrect(score)).toBe(100);
  });

  it('answers several of those held-back rows from the other log of the same round', () => {
    const score = scoreOf(judge('held-back', ROW_BY_ROW));
    expect(score.fromTheSameRound).toBeGreaterThan(0);
    expect(roundsOnBothSides(ROW_BY_ROW)).toHaveLength(REPEATED_ROUND_COUNT);
  });

  it('drops to a believable 70% once whole rounds are dealt out instead', () => {
    const score = scoreOf(judge('held-back', BY_ROUND));
    expect(percentageCorrect(score)).toBe(70);
  });

  it('makes the score WORSE by repairing the split — the honest number is the lower one', () => {
    const leaky = percentageCorrect(scoreOf(judge('held-back', ROW_BY_ROW)));
    const honest = percentageCorrect(scoreOf(judge('held-back', BY_ROUND)));
    expect(honest).toBeLessThan(leaky);
  });

  it('leaves no round on both sides, and no guess copied from itself, once repaired', () => {
    expect(roundsOnBothSides(BY_ROUND)).toEqual([]);

    const score = scoreOf(judge('held-back', BY_ROUND));
    expect(score.fromTheSameRound).toBe(0);
  });
});

describe('percentageCorrect', () => {
  it('returns whole percents', () => {
    expect(
      percentageCorrect({ correct: 7, total: 10, fromTheSameRound: 0 }),
    ).toBe(70);
    expect(
      percentageCorrect({ correct: 1, total: 3, fromTheSameRound: 0 }),
    ).toBe(33);
  });

  it('reports nothing rather than dividing by zero on an empty pile', () => {
    expect(
      percentageCorrect({ correct: 0, total: 0, fromTheSameRound: 0 }),
    ).toBe(0);
  });
});
