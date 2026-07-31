import { describe, expect, it } from 'vitest';

import { ANSWERS, QUESTIONS } from './data.en';
import {
  AXES,
  HELD_OUT,
  heldOutVerdict,
  judgeFrom,
  leanOf,
  ROUND_COUNT,
  ROUNDS,
  scoreOf,
  strengthOf,
  strongestAxis,
  tallyFor,
  TRUE_ANSWER_ID,
} from './logic';
import type { Answer, AxisId, Judge, Side, Trait } from './logic';

/** Every set of ten picks a reader could possibly make. */
const everyPickSet = (): Side[][] => {
  const sets: Side[][] = [];

  for (let bits = 0; bits < 2 ** ROUND_COUNT; bits += 1) {
    sets.push(
      ROUNDS.map((_, index) => ((bits >> index) & 1 ? 'right' : 'left')),
    );
  }

  return sets;
};

/**
 * A rater with one rule: always take the answer that has more of `axis`.
 *
 * `tieBreaks` is consumed one entry per pair where the two answers are level on
 * that quality, so a test can check that a conclusion holds however those free
 * choices happen to fall.
 */
const raterWhoPrefers = (axis: AxisId, tieBreaks: readonly Side[]): Side[] => {
  let used = 0;

  return ROUNDS.map((pair) => {
    const left = pair.left.traits[axis];
    const right = pair.right.traits[axis];

    if (left === right) {
      const side = tieBreaks[used] ?? 'left';
      used += 1;
      return side;
    }

    return left > right ? 'left' : 'right';
  });
};

/** Every way of settling `count` free choices. */
const allTieBreaks = (count: number): Side[][] => {
  const sets: Side[][] = [];

  for (let bits = 0; bits < 2 ** count; bits += 1) {
    sets.push(
      Array.from({ length: count }, (_, index) =>
        (bits >> index) & 1 ? 'right' : 'left',
      ),
    );
  }

  return sets;
};

/** The same answer with one quality changed, for isolating that quality. */
const withConfidence = (answer: Answer, confident: Trait): Answer => ({
  ...answer,
  traits: { ...answer.traits, confident },
});

/** What the readout prints, so the tests pin the figure a reader sees. */
const shown = (value: number): number => Number(value.toFixed(2));

const scorer = (
  direct: number,
  confident: number,
  agrees: number,
  warm: number,
): Judge => ({ direct, confident, agrees, warm });

describe('the pairs', () => {
  it('asks for ten picks and keeps an eleventh pair back', () => {
    expect(ROUND_COUNT).toBe(10);
    expect(ROUNDS.some((pair) => pair.id === HELD_OUT.id)).toBe(false);
  });

  it('never repeats an answer, so an id always means one thing', () => {
    const ids = [...ROUNDS, HELD_OUT].flatMap((pair) => [
      pair.left.id,
      pair.right.id,
    ]);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('places every answer on every quality, and only as −1, 0 or 1', () => {
    for (const pair of [...ROUNDS, HELD_OUT]) {
      for (const answer of [pair.left, pair.right]) {
        for (const axis of AXES) {
          expect([-1, 0, 1]).toContain(answer.traits[axis]);
        }
      }
    }
  });

  it('puts every quality in play in at least two pairs', () => {
    for (const axis of AXES) {
      const inPlay = ROUNDS.filter(
        (pair) => pair.left.traits[axis] !== pair.right.traits[axis],
      );

      expect(inPlay.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('never lets one button carry the same quality every time', () => {
    for (const axis of AXES) {
      const sides = ROUNDS.filter(
        (pair) => pair.left.traits[axis] !== pair.right.traits[axis],
      ).map((pair) =>
        pair.left.traits[axis] > pair.right.traits[axis] ? 'left' : 'right',
      );

      expect(sides).toContain('left');
      expect(sides).toContain('right');
    }
  });
});

describe('the words that go with the pairs', () => {
  it('has a question for every pair and text for every answer', () => {
    for (const pair of [...ROUNDS, HELD_OUT]) {
      expect(QUESTIONS[pair.id]).toBeTruthy();
      expect(ANSWERS[pair.left.id]).toBeTruthy();
      expect(ANSWERS[pair.right.id]).toBeTruthy();
    }
  });

  it('carries no text for an answer that does not exist', () => {
    const known = new Set(
      [...ROUNDS, HELD_OUT].flatMap((pair) => [pair.left.id, pair.right.id]),
    );

    for (const id of Object.keys(ANSWERS)) expect(known.has(id)).toBe(true);
  });
});

describe('tallyFor', () => {
  it('has nothing to say before anything is picked', () => {
    const tally = tallyFor('direct', []);

    expect(tally.differed).toBe(0);
    expect(tally.towardsMore).toBe(0);
    expect(tally.weight).toBe(0);
  });

  it('ignores a pair whose answers are level on that quality', () => {
    const traits = { direct: 1, confident: 0, agrees: 0, warm: 0 } as const;
    const level = [
      {
        id: 'level',
        left: { id: 'a', traits },
        right: { id: 'b', traits },
      },
    ];

    expect(tallyFor('direct', ['left'], level).differed).toBe(0);
  });

  it('reads +1 when every pair in play went the same way', () => {
    const picks = ROUNDS.map((pair) =>
      pair.left.traits.direct > pair.right.traits.direct ? 'left' : 'right',
    );

    expect(tallyFor('direct', picks).weight).toBe(1);
  });

  it('reads −1 when every pair in play went the other way', () => {
    const picks = ROUNDS.map((pair) =>
      pair.left.traits.direct > pair.right.traits.direct ? 'right' : 'left',
    );

    expect(tallyFor('direct', picks).weight).toBe(-1);
  });

  it('counts only as far as the picks go', () => {
    const partial = tallyFor('direct', ['left', 'right']);

    expect(partial.differed).toBe(2);
    expect(partial.towardsMore).toBe(1);
    expect(partial.weight).toBe(0);
  });
});

describe('the scorer', () => {
  it('has no opinion at all before anything is picked', () => {
    const judge = judgeFrom([]);

    for (const axis of AXES) expect(judge[axis]).toBe(0);
    expect(strongestAxis(judge)).toBeNull();
  });

  it('multiplies an answer by what the picks rewarded, and adds up', () => {
    // brain-correct gets to the point, states it flatly, disagrees, stays plain.
    expect(scoreOf(HELD_OUT.right, scorer(0.5, 0, -1, 0.25))).toBeCloseTo(
      0.5 + 0 + 1 - 0.25,
      10,
    );
  });

  it('names the quality it weighs most heavily', () => {
    expect(strongestAxis(scorer(0.2, -0.9, 0.4, 0.1))).toBe('confident');
  });

  it('grades the size of a weight in words', () => {
    expect(strengthOf(1)).toBe('decisive');
    expect(strengthOf(-0.75)).toBe('decisive');
    expect(strengthOf(0.4)).toBe('leaning');
    expect(strengthOf(-0.05)).toBe('blind');
    expect(strengthOf(0)).toBe('blind');
  });

  it('reports which way a quality leaned, and by how many pairs', () => {
    expect(leanOf(tallyFor('direct', ['left']))).toEqual({
      towards: 'more',
      count: 1,
    });
    expect(leanOf(tallyFor('direct', ['right']))).toEqual({
      towards: 'less',
      count: 1,
    });
  });
});

describe('heldOutVerdict', () => {
  it('cannot separate the two answers when nothing was rewarded', () => {
    const verdict = heldOutVerdict(judgeFrom([]));

    expect(verdict.winnerId).toBeNull();
    expect(verdict.prefersTruth).toBe(false);
  });

  it('calls it true only when the answer it prefers is the true one', () => {
    const prefersPlain = heldOutVerdict(scorer(1, 0, 0, 0));
    const prefersFlattery = heldOutVerdict(scorer(-1, 0, 0, 0));

    expect(prefersPlain.winnerId).toBe(TRUE_ANSWER_ID);
    expect(prefersPlain.prefersTruth).toBe(true);
    expect(prefersFlattery.winnerId).toBe('brain-flatter');
    expect(prefersFlattery.prefersTruth).toBe(false);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every figure the page quotes is checked here, and so is every "watch this
 * happen" it promises. An edit to the table of answers that quietly falsifies
 * a paragraph fails the build instead of shipping.
 */
describe('the lesson the instrument exists to deliver', () => {
  const briskRater = raterWhoPrefers('direct', []);

  it('lets a reader follow one quality through all ten pairs, no ties', () => {
    for (const pair of ROUNDS) {
      expect(pair.left.traits.direct).not.toBe(pair.right.traits.direct);
    }
  });

  it('builds a scorer out of ten picks and nothing else', () => {
    const judge = judgeFrom(briskRater);

    // The four figures the prose quotes, in the order the readout lists them.
    expect(shown(judge.direct)).toBe(1);
    expect(shown(judge.confident)).toBe(0);
    expect(shown(judge.agrees)).toBe(-0.5);
    expect(shown(judge.warm)).toBe(-0.71);

    // And the counts printed beside them.
    expect(tallyFor('direct', briskRater)).toMatchObject({
      differed: 10,
      towardsMore: 10,
    });
    expect(tallyFor('confident', briskRater)).toMatchObject({
      differed: 6,
      towardsMore: 3,
    });
    expect(leanOf(tallyFor('agrees', briskRater))).toEqual({
      towards: 'less',
      count: 3,
    });
    expect(leanOf(tallyFor('warm', briskRater))).toEqual({
      towards: 'less',
      count: 6,
    });
  });

  it('is blind to whatever the picks were not consistent about', () => {
    const judge = judgeFrom(briskRater);

    expect(strengthOf(judge.confident)).toBe('blind');
    expect(scoreOf(withConfidence(HELD_OUT.left, 1), judge)).toBe(
      scoreOf(withConfidence(HELD_OUT.left, -1), judge),
    );
  });

  it('grades a pair nobody rated, at the two scores the prose quotes', () => {
    const verdict = heldOutVerdict(judgeFrom(briskRater));

    expect(shown(verdict.rightScore)).toBe(2.21);
    expect(shown(verdict.leftScore)).toBe(-2.21);
    expect(verdict.winnerId).toBe(TRUE_ANSWER_ID);
  });

  it('turns friendliness into a scorer that prefers the false answer', () => {
    // Three pairs have no friendlier answer, so this rater has three free
    // choices. All eight ways they can fall reach the same place.
    const free = ROUNDS.filter(
      (pair) => pair.left.traits.warm === pair.right.traits.warm,
    ).length;
    expect(free).toBe(3);

    for (const ties of allTieBreaks(free)) {
      const judge = judgeFrom(raterWhoPrefers('warm', ties));
      const verdict = heldOutVerdict(judge);

      expect(shown(judge.warm)).toBe(1);
      expect(shown(judge.agrees)).toBe(0.5);
      expect(judge.direct).toBeLessThan(0);
      expect(verdict.winnerId).toBe('brain-flatter');
      expect(verdict.prefersTruth).toBe(false);
    }
  });

  it('has two readers disagree about a pair neither of them ever saw', () => {
    const friendly = heldOutVerdict(judgeFrom(raterWhoPrefers('warm', [])));
    const brisk = heldOutVerdict(judgeFrom(briskRater));

    expect(friendly.winnerId).not.toBe(brisk.winnerId);
  });

  it('cannot tell friendliness apart from length, which is the trap', () => {
    const inPlay = ROUNDS.filter(
      (pair) => pair.left.traits.warm !== pair.right.traits.warm,
    );
    const pullingApart = inPlay.filter((pair) => {
      const warmerIsLeft = pair.left.traits.warm > pair.right.traits.warm;
      const warmer = warmerIsLeft ? pair.left : pair.right;
      const plainer = warmerIsLeft ? pair.right : pair.left;
      return warmer.traits.direct < plainer.traits.direct;
    });

    expect(inPlay).toHaveLength(7);
    expect(pullingApart).toHaveLength(6);
  });

  it('always produces a scorer with an opinion, whatever the picks were', () => {
    for (const picks of everyPickSet()) {
      const judge = judgeFrom(picks);

      expect(strongestAxis(judge)).not.toBeNull();
      expect(heldOutVerdict(judge).winnerId).not.toBeNull();
    }
  });

  it('never once asks about truth, and half of all raters pay for it', () => {
    const verdicts = everyPickSet().map((picks) =>
      heldOutVerdict(judgeFrom(picks)),
    );

    expect(verdicts).toHaveLength(1024);
    expect(verdicts.filter((verdict) => verdict.prefersTruth)).toHaveLength(
      512,
    );
  });
});
