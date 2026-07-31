import { describe, expect, it } from 'vitest';

import {
  DEFAULT_GROUPS,
  DEFAULT_START,
  findGroups,
  groupNumberOf,
  MAX_GROUPS,
  MIN_GROUPS,
  SHOPPERS,
  shoppersWhoMoved,
  START_IDS,
} from './logic';

const GROUP_COUNTS = Array.from(
  { length: MAX_GROUPS - MIN_GROUPS + 1 },
  (_, index) => MIN_GROUPS + index,
);

function visitsOf(shopperId: string): number {
  const shopper = SHOPPERS.find((candidate) => candidate.id === shopperId);
  if (shopper === undefined) throw new Error(`no such shopper: ${shopperId}`);
  return shopper.visits;
}

describe('findGroups', () => {
  it('works as a bare call, matching the component that takes no props', () => {
    const grouping = findGroups();
    expect(grouping.howMany).toBe(DEFAULT_GROUPS);
    expect(grouping.start).toBe(DEFAULT_START);
  });

  it('puts every shopper in exactly one group', () => {
    for (const start of START_IDS) {
      for (const howMany of GROUP_COUNTS) {
        const grouping = findGroups(howMany, start);
        const placed = grouping.groups.flatMap((group) => group.memberIds);

        expect(placed).toHaveLength(SHOPPERS.length);
        expect(new Set(placed).size).toBe(SHOPPERS.length);
      }
    }
  });

  it('settles rather than being cut off mid-shuffle', () => {
    for (const start of START_IDS) {
      for (const howMany of GROUP_COUNTS) {
        expect(findGroups(howMany, start).rounds).toBeLessThan(20);
      }
    }
  });

  it('gives the same answer every time — nothing random, nothing timed', () => {
    const once = findGroups(5, 'c');
    const twice = findGroups(5, 'c');

    expect(twice.spread).toBe(once.spread);
    expect(twice.groups.map((group) => group.memberIds)).toEqual(
      once.groups.map((group) => group.memberIds),
    );
  });
});

describe('shoppersWhoMoved', () => {
  it('finds nobody when a run is compared with itself', () => {
    expect(shoppersWhoMoved(findGroups(4), findGroups(4))).toEqual([]);
  });

  it('compares the piles, not the numbers printed on them', () => {
    // At three groups the first two starting guesses reach an identical answer
    // and number it differently. Comparing group numbers would report every
    // shopper as having moved; comparing the piles reports nobody.
    const first = findGroups(3, 'a');
    const second = findGroups(3, 'b');

    expect(groupNumberOf(first, 's01')).not.toBe(groupNumberOf(second, 's01'));
    expect(shoppersWhoMoved(first, second)).toEqual([]);
  });

  it('refuses to compare runs of different sizes', () => {
    expect(() => shoppersWhoMoved(findGroups(3), findGroups(4))).toThrow();
  });
});

/**
 * The unit's argument, not incidental coverage.
 *
 * Every number quoted in `unsupervised-learning.mdx` is pinned here. If the
 * shoppers or the opening guesses are ever edited so that the instrument stops
 * showing what the prose says it shows, these fail — and nothing else in the
 * build would notice.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('hands back exactly as many groups as it was asked for, none of them empty', () => {
    for (const start of START_IDS) {
      for (const howMany of GROUP_COUNTS) {
        const grouping = findGroups(howMany, start);

        expect(grouping.groups).toHaveLength(howMany);
        for (const group of grouping.groups) {
          expect(group.memberIds.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('scores itself better every time it is asked for one more group, so its own number can never answer "how many?"', () => {
    for (const start of START_IDS) {
      const spreads = GROUP_COUNTS.map(
        (howMany) => findGroups(howMany, start).spread,
      );

      for (let index = 1; index < spreads.length; index++) {
        expect(spreads[index]).toBeLessThan(spreads[index - 1]);
      }
    }
  });

  it('finds three groups the reader can recognise, at the sizes the unit quotes', () => {
    const three = findGroups(3);

    expect(three.spread.toFixed(1)).toBe('11.3');
    expect(
      three.groups.map((group) => ({
        members: group.memberIds.length,
        visits: Math.round(group.centre.visits),
        spend: Math.round(group.centre.spend),
      })),
    ).toEqual([
      { members: 14, visits: 20, spend: 9 },
      { members: 12, visits: 4, spend: 59 },
      { members: 16, visits: 10, spend: 30 },
    ]);
  });

  it('improves its score at four groups without finding a fourth kind of shopper', () => {
    const three = findGroups(3);
    const four = findGroups(4);

    expect(four.spread.toFixed(1)).toBe('9.8');
    expect(four.spread).toBeLessThan(three.spread);

    const frequent = three.groups.find(
      (group) => group.centre.visits > 14 && group.centre.spend < 20,
    );
    expect(frequent).toBeDefined();
    if (frequent === undefined) return;

    // Those fourteen shoppers end up split across exactly two of the four
    // groups — and both of those groups still describe the same habit, so the
    // extra group is a cut through one that existed rather than a discovery.
    const landedIn = [
      ...new Set(frequent.memberIds.map((id) => groupNumberOf(four, id))),
    ];
    expect(landedIn).toHaveLength(2);

    const halves = landedIn
      .map((number) => {
        const group = four.groups.find(
          (candidate) => candidate.number === number,
        );
        if (group === undefined) throw new Error('missing group');

        expect(group.centre.visits).toBeGreaterThan(14);
        expect(group.centre.spend).toBeLessThan(20);

        const visits = group.memberIds.map(visitsOf);
        return { lowest: Math.min(...visits), highest: Math.max(...visits) };
      })
      .sort((left, right) => left.lowest - right.lowest);

    // The unit says the cut lands at twenty visits a month. It does.
    expect(halves[0].highest).toBe(19);
    expect(halves[1].lowest).toBe(20);
  });

  it('changes who ends up with whom when only the starting point changes', () => {
    expect(
      shoppersWhoMoved(findGroups(4, 'a'), findGroups(4, 'b')),
    ).toHaveLength(10);
  });

  it('but leaves the strongest structure alone: at three groups the starting point barely matters', () => {
    expect(shoppersWhoMoved(findGroups(3, 'a'), findGroups(3, 'b'))).toEqual(
      [],
    );
    expect(
      shoppersWhoMoved(findGroups(3, 'a'), findGroups(3, 'c')),
    ).toHaveLength(2);
  });
});
