import { describe, expect, it } from 'vitest';

import {
  CLAUSES,
  CONTINUATIONS,
  DIMENSIONS,
  openingLines,
  REQUEST,
} from './data.en';
import type { Levers } from './logic';
import {
  COMMONEST_OPTION,
  endingsThatFit,
  LEVER_IDS,
  leversFor,
  NAMED_OPTION,
  NOTHING_PULLED,
  OPTIONS_PER_DIMENSION,
  optionState,
  OUTCOME_KEYS,
  outcomeKey,
  pulledInOrder,
  ruledOut,
  TOTAL_ENDINGS,
  withLever,
  writtenOption,
} from './logic';

const EVERYTHING_PULLED: Levers = { who: true, shape: true, purpose: true };

/** The eight states of the board, as levers. */
const everyState = OUTCOME_KEYS.map((key) => leversFor(key));

/** The one sentence a reader who has to pass it on needs to leave with. */
const THE_TAKEAWAY = /(n't|not|rather than) mak(e|ing) cold/;

/** The trade word. Nobody uses it talking to a nine-year-old. */
const TRADE_WORD = /refriger/;

describe('the board', () => {
  it('has three dimensions with three settings each', () => {
    expect(LEVER_IDS).toHaveLength(3);

    for (const id of LEVER_IDS) {
      expect(DIMENSIONS[id].options).toHaveLength(OPTIONS_PER_DIMENSION);
    }
  });

  it('multiplies out to twenty-seven endings', () => {
    expect(TOTAL_ENDINGS).toBe(27);
  });

  it('gives every lever a line to write and a dimension to speak to', () => {
    for (const id of LEVER_IDS) {
      expect(CLAUSES[id].length).toBeGreaterThan(0);
      expect(DIMENSIONS[id].caption.length).toBeGreaterThan(0);
    }
  });
});

describe('withLever', () => {
  it('leaves the levers it was not asked about alone', () => {
    const next = withLever(NOTHING_PULLED, 'shape', true);

    expect(next.shape).toBe(true);
    expect(next.who).toBe(false);
    expect(next.purpose).toBe(false);
  });

  it('does not mutate the levers it was handed', () => {
    withLever(NOTHING_PULLED, 'who', true);

    expect(NOTHING_PULLED.who).toBe(false);
  });

  it('can push a lever back down again', () => {
    const up = withLever(NOTHING_PULLED, 'purpose', true);

    expect(withLever(up, 'purpose', false)).toEqual(NOTHING_PULLED);
  });
});

describe('pulledInOrder', () => {
  it('says nothing when nothing is pulled', () => {
    expect(pulledInOrder(NOTHING_PULLED)).toEqual([]);
  });

  it('reports the pulled levers in the board order, not the order pulled', () => {
    const pulled = withLever(
      withLever(NOTHING_PULLED, 'purpose', true),
      'who',
      true,
    );

    expect(pulledInOrder(pulled)).toEqual(['who', 'purpose']);
  });
});

describe('endingsThatFit', () => {
  it('leaves every ending open when nothing has been said', () => {
    expect(endingsThatFit(NOTHING_PULLED)).toBe(TOTAL_ENDINGS);
    expect(ruledOut(NOTHING_PULLED)).toBe(0);
  });

  it('never depends on which levers, only on how many', () => {
    for (const id of LEVER_IDS) {
      expect(endingsThatFit(withLever(NOTHING_PULLED, id, true))).toBe(9);
    }
  });

  it('always leaves at least one ending', () => {
    for (const levers of everyState) {
      expect(endingsThatFit(levers)).toBeGreaterThanOrEqual(1);
      expect(endingsThatFit(levers) + ruledOut(levers)).toBe(TOTAL_ENDINGS);
    }
  });
});

describe('optionState', () => {
  it('leaves every setting on an unnamed dimension in play', () => {
    for (const id of LEVER_IDS) {
      expect(optionState(NOTHING_PULLED, id, 1)).toBe('possible');
      expect(optionState(NOTHING_PULLED, id, 2)).toBe('possible');
    }
  });

  it('marks exactly one setting per dimension as the one written', () => {
    for (const levers of everyState) {
      for (const id of LEVER_IDS) {
        const written = DIMENSIONS[id].options.filter(
          (_option, index) => optionState(levers, id, index) === 'written',
        );

        expect(written).toHaveLength(1);
      }
    }
  });

  it('rules a setting out only on a dimension the opening names', () => {
    const pulled = withLever(NOTHING_PULLED, 'shape', true);

    expect(optionState(pulled, 'shape', 2)).toBe('ruled-out');
    expect(optionState(pulled, 'who', 2)).toBe('possible');
    expect(optionState(pulled, 'purpose', 2)).toBe('possible');
  });
});

describe('outcomeKey', () => {
  it('names all eight states of the board and never repeats one', () => {
    expect(OUTCOME_KEYS).toHaveLength(8);
    expect(new Set(OUTCOME_KEYS).size).toBe(8);
  });

  it('round-trips through leversFor', () => {
    for (const key of OUTCOME_KEYS) {
      expect(outcomeKey(leversFor(key))).toBe(key);
    }
  });

  it('has a continuation written for every state', () => {
    for (const key of OUTCOME_KEYS) {
      expect(CONTINUATIONS[key].length).toBeGreaterThan(0);
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim the page makes about this instrument is checked here — the four
 * counts it quotes, the request that never moves, and the specific thing each
 * of the three levers is said to do — so that a later edit to the clauses or
 * the continuations fails the build instead of quietly turning the surrounding
 * paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('never moves the request, in any of the eight states', () => {
    for (const levers of everyState) {
      const lines = openingLines(levers);

      expect(lines[0]).toBe(REQUEST);
      expect(lines.filter((line) => line === REQUEST)).toHaveLength(1);
    }

    // The prose counts them, so the prose breaks if anybody rewrites it.
    expect(REQUEST.split(' ')).toHaveLength(7);
  });

  it('writes one more line per lever, and nothing else', () => {
    for (const levers of everyState) {
      const lines = openingLines(levers);

      expect(lines).toHaveLength(1 + pulledInOrder(levers).length);
      expect(lines.slice(1)).toEqual(
        pulledInOrder(levers).map((id) => CLAUSES[id]),
      );
    }
  });

  it('reaches the same document however the reader got there', () => {
    const oneWay = withLever(
      withLever(withLever(NOTHING_PULLED, 'purpose', true), 'who', true),
      'shape',
      true,
    );
    const other = withLever(
      withLever(withLever(NOTHING_PULLED, 'shape', true), 'purpose', true),
      'who',
      true,
    );

    expect(oneWay).toEqual(EVERYTHING_PULLED);
    expect(openingLines(oneWay)).toEqual(openingLines(other));
    expect(outcomeKey(oneWay)).toBe(outcomeKey(other));
  });

  it('cuts twenty-seven to nine to three to one, the numbers the prose quotes', () => {
    expect(endingsThatFit(NOTHING_PULLED)).toBe(27);
    expect(endingsThatFit(withLever(NOTHING_PULLED, 'who', true))).toBe(9);
    expect(
      endingsThatFit(
        withLever(withLever(NOTHING_PULLED, 'who', true), 'shape', true),
      ),
    ).toBe(3);
    expect(endingsThatFit(EVERYTHING_PULLED)).toBe(1);

    // "The other twenty-six were not forbidden" — the readout's last sentence.
    expect(ruledOut(EVERYTHING_PULLED)).toBe(26);

    // And the diminishing returns the prose points at: the first line thrown in
    // removes eighteen endings, the third removes two.
    expect(ruledOut(withLever(NOTHING_PULLED, 'who', true))).toBe(18);
  });

  it('gives a vague opening the average, not a surprise', () => {
    for (const id of LEVER_IDS) {
      expect(writtenOption(NOTHING_PULLED, id)).toBe(COMMONEST_OPTION);
      expect(optionState(NOTHING_PULLED, id, COMMONEST_OPTION)).toBe('written');
    }

    // Unaddressed, one paragraph, no particular use — and correct.
    expect(CONTINUATIONS.none).toHaveLength(1);
    expect(CONTINUATIONS.none[0]).toMatch(TRADE_WORD);
  });

  it('changes only the dimension a lever speaks to', () => {
    for (const pulled of LEVER_IDS) {
      const levers = withLever(NOTHING_PULLED, pulled, true);

      for (const id of LEVER_IDS) {
        expect(writtenOption(levers, id)).toBe(
          id === pulled ? NAMED_OPTION : COMMONEST_OPTION,
        );
      }
    }
  });

  it('has no setting that makes no difference — all eight endings differ', () => {
    const written = OUTCOME_KEYS.map((key) => CONTINUATIONS[key].join(' '));

    expect(new Set(written).size).toBe(OUTCOME_KEYS.length);
  });

  it('gives the shape the opening asked for, and only then', () => {
    for (const key of OUTCOME_KEYS) {
      const lines = CONTINUATIONS[key];

      if (leversFor(key).shape) {
        expect(lines).toHaveLength(3);
        expect(lines.map((line) => line.slice(0, 2))).toEqual([
          '1.',
          '2.',
          '3.',
        ]);
      } else {
        expect(lines).toHaveLength(1);
      }
    }
  });

  it('swaps the register the moment the reader is named', () => {
    for (const key of OUTCOME_KEYS) {
      const whole = CONTINUATIONS[key].join(' ');

      if (leversFor(key).who) {
        expect(whole).not.toMatch(TRADE_WORD);
      } else {
        expect(whole).toMatch(TRADE_WORD);
      }
    }
  });

  it('leads with the one sentence worth remembering, but only when told what it is for', () => {
    for (const key of OUTCOME_KEYS) {
      const opener = CONTINUATIONS[key][0];

      expect(THE_TAKEAWAY.test(opener)).toBe(leversFor(key).purpose);
    }
  });

  it('ends up at the ending the unit says it does', () => {
    const settings = LEVER_IDS.map(
      (id) => DIMENSIONS[id].options[writtenOption(EVERYTHING_PULLED, id)],
    );

    expect(settings).toEqual([
      'a nine-year-old',
      'three numbered steps',
      'passing it on to somebody else',
    ]);
    expect(endingsThatFit(EVERYTHING_PULLED)).toBe(1);
  });
});
