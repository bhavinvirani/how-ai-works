import { describe, expect, it } from 'vitest';

import {
  BIKES,
  clueColumns,
  COLUMNS,
  isAnswerColumn,
  rankClues,
  separation,
  valueOf,
} from './logic';
import type { AnswerColumn, Bike } from './logic';

/** A row with everything at zero, so each test can vary only what it is about. */
function bike(id: string, overrides: Partial<Omit<Bike, 'id'>> = {}): Bike {
  return {
    id,
    frameSize: 0,
    age: 0,
    condition: 0,
    price: 0,
    soldFast: false,
    ...overrides,
  };
}

const ANSWERS: readonly AnswerColumn[] = ['price', 'soldFast', 'condition'];

describe('valueOf', () => {
  it('reads a numeric column straight off the row', () => {
    expect(valueOf(bike('x', { price: 195 }), 'price')).toBe(195);
  });

  it('turns yes into 1 and no into 0, because arithmetic needs numbers', () => {
    expect(valueOf(bike('x', { soldFast: true }), 'soldFast')).toBe(1);
    expect(valueOf(bike('x', { soldFast: false }), 'soldFast')).toBe(0);
  });
});

describe('which columns are clues', () => {
  it('treats everything except the nominated column as a clue', () => {
    expect(clueColumns('price')).toEqual([
      'frameSize',
      'age',
      'condition',
      'soldFast',
    ]);
  });

  it('makes every column a clue when nothing is nominated', () => {
    expect(clueColumns('none')).toEqual([...COLUMNS]);
  });

  it('marks no column as the answer when nothing is nominated', () => {
    for (const column of COLUMNS) {
      expect(isAnswerColumn(column, 'none')).toBe(false);
    }
  });
});

describe('separation', () => {
  it('is 1 when the clue splits the answer perfectly', () => {
    const rows = [
      bike('a', { age: 1, price: 10 }),
      bike('b', { age: 2, price: 10 }),
      bike('c', { age: 3, price: 90 }),
      bike('d', { age: 4, price: 90 }),
    ];
    expect(separation('price', 'age', rows)).toBe(1);
  });

  it('is 0 when sorting by the clue leaves the two halves identical', () => {
    const rows = [
      bike('a', { age: 1, price: 10 }),
      bike('b', { age: 2, price: 90 }),
      bike('c', { age: 3, price: 10 }),
      bike('d', { age: 4, price: 90 }),
    ];
    expect(separation('price', 'age', rows)).toBe(0);
  });

  it('does not care which way round the two halves fall', () => {
    const rising = [
      bike('a', { age: 1, price: 10 }),
      bike('b', { age: 2, price: 90 }),
    ];
    const falling = [
      bike('a', { age: 1, price: 90 }),
      bike('b', { age: 2, price: 10 }),
    ];
    expect(separation('price', 'age', rising)).toBe(
      separation('price', 'age', falling),
    );
  });

  it('is 0 when the answer never varies, so there is nothing to pull apart', () => {
    const rows = [
      bike('a', { age: 1, price: 50 }),
      bike('b', { age: 2, price: 50 }),
    ];
    expect(separation('price', 'age', rows)).toBe(0);
  });

  it('is 0 for a column measured against itself', () => {
    expect(separation('price', 'price')).toBe(0);
  });

  it('has nothing to split when given no rows, or only one', () => {
    expect(separation('price', 'age', [])).toBe(0);
    expect(separation('price', 'age', [bike('a', { price: 10 })])).toBe(0);
  });

  it('stays between 0 and 1 for every pair of columns in the real table', () => {
    for (const label of COLUMNS) {
      for (const clue of COLUMNS) {
        const value = separation(label, clue);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('rankClues', () => {
  it('returns the columns strongest first', () => {
    const strengths = rankClues('price').map((clue) => clue.strength);
    expect(strengths).toEqual([...strengths].sort((a, b) => b - a));
  });

  it('never ranks the nominated column against itself', () => {
    for (const answer of ANSWERS) {
      const columns = rankClues(answer).map((clue) => clue.column);
      expect(columns).not.toContain(answer);
      expect(columns).toHaveLength(COLUMNS.length - 1);
    }
  });

  it('has nothing to rank when no column is nominated', () => {
    expect(rankClues('none')).toEqual([]);
  });

  it('breaks a tie the same way every time', () => {
    // Asking price and "sold in a week" separate condition equally well, so the
    // order between them comes from the stable sort rather than from the data.
    // Pinned because a reader watching the bars is entitled to a list that does
    // not shuffle underneath them.
    expect(rankClues('condition').map((clue) => clue.column)).toEqual([
      'age',
      'price',
      'soldFast',
      'frameSize',
    ]);
  });
});

/**
 * The unit makes three claims out loud about this table. All three are computed
 * rather than asserted, so all three are pinned here — edit the rows and the
 * prose describing them fails with the test.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('gives a different top clue for every column you nominate', () => {
    const leaders = ANSWERS.map((answer) => rankClues(answer)[0].column);
    expect(leaders).toEqual(['soldFast', 'price', 'age']);
    expect(new Set(leaders).size).toBe(ANSWERS.length);
  });

  it('leaves frame size last whichever column is nominated', () => {
    for (const answer of ANSWERS) {
      const ranked = rankClues(answer);
      expect(ranked[ranked.length - 1].column).toBe('frameSize');
    }
  });

  it('makes "sold in a week" the best clue for guessing the asking price', () => {
    // True, and unusable: on the morning you set a price, nothing has sold yet.
    // That paragraph sits directly under the instrument, so the fact it rests
    // on is asserted rather than left to hold by luck.
    expect(rankClues('price')[0].column).toBe('soldFast');
    expect(separation('price', 'soldFast')).toBeGreaterThan(
      separation('price', 'condition'),
    );
  });

  it('keeps the eight rows split evenly between sold fast and not', () => {
    // A lopsided split would make the halves of a sort by "sold in a week"
    // meaningless, which quietly breaks every ranking above it.
    expect(BIKES).toHaveLength(8);
    expect(BIKES.filter((row) => row.soldFast)).toHaveLength(4);
  });
});
