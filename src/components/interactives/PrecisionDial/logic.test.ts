import { describe, expect, it } from 'vitest';

import {
  ABILITIES,
  ABILITY_IDS,
  BIT_WIDTHS,
  clampBits,
  cliffAt,
  DIALS,
  effectiveBits,
  EVERYDAY,
  gigabytesAt,
  levelsAt,
  MAX_BITS,
  MIN_BITS,
  panelAt,
  REFERENCE_BITS,
  roundingStepAt,
  scoreAt,
  trafficMultipleAt,
  verdictFor,
  worstAt,
} from './logic';
import type { AbilityId } from './logic';

const METHODS: readonly boolean[] = [false, true];

/** What the panel prints, so the tests can pin the figures a reader sees. */
const shown = (id: AbilityId, bits: number, careful: boolean): number =>
  Math.round(scoreAt(id, bits, careful));

describe('the slider', () => {
  it('runs from two digits up to the sixteen everything is measured against', () => {
    expect(MIN_BITS).toBe(2);
    expect(MAX_BITS).toBe(REFERENCE_BITS);
    expect(BIT_WIDTHS).toHaveLength(15);
  });

  it('refuses a width off either end', () => {
    expect(clampBits(0)).toBe(MIN_BITS);
    expect(clampBits(-9)).toBe(MIN_BITS);
    expect(clampBits(64)).toBe(MAX_BITS);
  });

  it('takes whole digits only', () => {
    expect(clampBits(4.4)).toBe(4);
    expect(clampBits(4.6)).toBe(5);
  });
});

describe('rungs', () => {
  it('doubles the positions a dial may take for every digit added', () => {
    expect(levelsAt(2)).toBe(4);
    expect(levelsAt(4)).toBe(16);
    expect(levelsAt(8)).toBe(256);
    expect(levelsAt(16)).toBe(65_536);
  });

  it('rounds nothing at the width everything is measured against', () => {
    expect(roundingStepAt(REFERENCE_BITS)).toBe(0);
  });

  it('doubles how far a dial has to move for every digit removed', () => {
    for (let bits = 4; bits < REFERENCE_BITS; bits += 1) {
      const ratio = roundingStepAt(bits - 1) / roundingStepAt(bits);

      expect(ratio).toBeGreaterThan(1.9);
      expect(ratio).toBeLessThan(2.2);
    }
  });
});

describe('what it costs to keep and to carry', () => {
  it('sizes a seven-billion-dial model at sixteen digits as 14 GB', () => {
    expect(DIALS).toBe(7_000_000_000);
    expect(gigabytesAt(REFERENCE_BITS, false)).toBeCloseTo(14, 6);
    expect(gigabytesAt(REFERENCE_BITS, true)).toBeCloseTo(14, 6);
  });

  it('halves the file every time the digits per dial are halved', () => {
    expect(gigabytesAt(8, false)).toBeCloseTo(7, 6);
    expect(gigabytesAt(4, false)).toBeCloseTo(3.5, 6);
    expect(gigabytesAt(2, false)).toBeCloseTo(1.75, 6);
  });

  it('charges half a digit per dial for spending more where it matters', () => {
    for (const bits of BIT_WIDTHS.filter((width) => width < REFERENCE_BITS)) {
      expect(
        effectiveBits(bits, true) - effectiveBits(bits, false),
      ).toBeCloseTo(0.5, 6);
    }
  });

  it('charges nothing for it at the width where nothing is rounded', () => {
    expect(effectiveBits(REFERENCE_BITS, true)).toBe(REFERENCE_BITS);
    expect(trafficMultipleAt(REFERENCE_BITS, true)).toBeCloseTo(1, 6);
  });
});

describe('scores', () => {
  it('scores everything at 100 where nothing has been rounded', () => {
    for (const careful of METHODS) {
      for (const id of ABILITY_IDS) {
        expect(scoreAt(id, REFERENCE_BITS, careful)).toBeCloseTo(100, 6);
      }
    }
  });

  it('never improves when a digit is taken away', () => {
    for (const careful of METHODS) {
      for (const id of ABILITY_IDS) {
        for (let bits = MIN_BITS + 1; bits <= MAX_BITS; bits += 1) {
          expect(scoreAt(id, bits, careful)).toBeGreaterThanOrEqual(
            scoreAt(id, bits - 1, careful),
          );
        }
      }
    }
  });

  it('is never made worse by spending more digits where they matter', () => {
    for (const id of ABILITY_IDS) {
      for (const bits of BIT_WIDTHS) {
        expect(scoreAt(id, bits, true)).toBeGreaterThanOrEqual(
          scoreAt(id, bits, false),
        );
      }
    }
  });

  it('stays a percentage of something at every setting', () => {
    for (const careful of METHODS) {
      for (const id of ABILITY_IDS) {
        for (const bits of BIT_WIDTHS) {
          expect(scoreAt(id, bits, careful)).toBeGreaterThanOrEqual(0);
          expect(scoreAt(id, bits, careful)).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});

describe('panelAt', () => {
  it('reads the everyday row off the same list it shows', () => {
    const panel = panelAt(3, true);

    expect(panel.everyday.id).toBe(EVERYDAY);
    expect(panel.readings).toHaveLength(ABILITIES.length);
  });

  it('never names a worst row that is beaten by another one', () => {
    for (const careful of METHODS) {
      for (const bits of BIT_WIDTHS) {
        const panel = panelAt(bits, careful);

        for (const reading of panel.readings) {
          expect(panel.worst.score).toBeLessThanOrEqual(reading.score);
        }
      }
    }
  });

  it('has a verdict for every setting of both controls', () => {
    for (const careful of METHODS) {
      for (const bits of BIT_WIDTHS) {
        expect(verdictFor(bits, careful)).toMatch(
          /^(reference|intact|looks-fine|hollowed|broken)$/,
        );
      }
    }
  });

  it('reaches every verdict it has words for', () => {
    const reached = new Set(
      METHODS.flatMap((careful) =>
        BIT_WIDTHS.map((bits) => verdictFor(bits, careful)),
      ),
    );

    expect(reached).toEqual(
      new Set(['reference', 'intact', 'looks-fine', 'hollowed', 'broken']),
    );
  });

  it('calls the untouched width the reference and nothing else', () => {
    for (const careful of METHODS) {
      expect(verdictFor(REFERENCE_BITS, careful)).toBe('reference');

      for (const bits of BIT_WIDTHS.filter((w) => w < REFERENCE_BITS)) {
        expect(verdictFor(bits, careful)).not.toBe('reference');
      }
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every figure `quantization.mdx` quotes about this instrument is checked
 * here, so retuning a margin, a step count or the sparing factor fails the
 * build instead of quietly turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('changes nothing anybody could see for twelve of the fifteen stops', () => {
    const flat = BIT_WIDTHS.filter((bits) => bits >= 5);

    expect(flat).toHaveLength(12);

    for (const bits of flat) {
      for (const id of ABILITY_IDS) {
        expect(scoreAt(id, bits, true)).toBeGreaterThanOrEqual(99);
      }
    }
  });

  it('gives up three quarters of the digits for 14 GB becoming 3.9 GB', () => {
    // The prose quotes 14 GB, 3.9 GB and 3.6× less to carry, at four digits
    // with the sparing on. Four digits is a quarter of sixteen.
    expect(gigabytesAt(REFERENCE_BITS, true)).toBeCloseTo(14, 6);
    expect(gigabytesAt(4, true)).toBeCloseTo(3.9375, 6);
    expect(trafficMultipleAt(4, true).toFixed(1)).toBe('3.6');

    for (const id of ABILITY_IDS) {
      expect(shown(id, 4, true)).toBeGreaterThanOrEqual(98);
    }
  });

  it('falls off a cliff rather than down a slope', () => {
    // Code that has to run: 98, then 85, then nothing. The last digit taken
    // away costs more than every digit before it put together, which is the
    // one claim a reader is least likely to believe from a sentence.
    expect(shown('code', 4, true)).toBe(98);
    expect(shown('code', 3, true)).toBe(85);
    expect(shown('code', 2, true)).toBe(0);

    const gradual = 100 - scoreAt('code', 3, true);
    const cliff = scoreAt('code', 3, true) - scoreAt('code', 2, true);

    expect(cliff).toBeGreaterThan(gradual * 5);
  });

  it('lands the damage unevenly at one and the same setting', () => {
    // Three digits, sparing on: the row a reader would check is untouched and
    // two rows further down have lost a seventh of themselves.
    expect(shown(EVERYDAY, 3, true)).toBe(100);
    expect(shown('summary', 3, true)).toBe(99);
    expect(shown('rare', 3, true)).toBe(93);
    expect(shown('code', 3, true)).toBe(85);
    expect(shown('chain', 3, true)).toBe(85);

    expect(verdictFor(3, true)).toBe('looks-fine');
  });

  it('keeps talking after the things worth doing have stopped', () => {
    // Two digits, sparing on: fluent, and hollow. This is the setting that
    // makes "it sounds the same" worthless as evidence.
    expect(shown(EVERYDAY, 2, true)).toBe(92);
    expect(shown('rare', 2, true)).toBe(15);
    expect(shown('code', 2, true)).toBe(0);
    expect(shown('chain', 2, true)).toBe(0);

    expect(verdictFor(2, true)).toBe('hollowed');
  });

  it('has the ability with the most decisions give way first', () => {
    // Not the one with the smallest margin, and not by chance: at the width
    // where the first thing breaks, everything with a long chain has gone and
    // the one-decision rows are still standing.
    const bits = cliffAt(true);

    expect(bits).toBe(2);
    expect(scoreAt('chain', bits, true)).toBeLessThan(
      scoreAt('rare', bits, true),
    );
    expect(scoreAt('rare', bits, true)).toBeLessThan(
      scoreAt(EVERYDAY, bits, true),
    );
    expect(worstAt(bits, true).id).toBe('chain');
  });

  it('quotes the numbers the prose uses about plain rounding', () => {
    // The reader meets plain rounding first, because that is where the panel
    // opens. Nothing on the list moves until five digits; at four the everyday
    // row is still perfect and code is at 83; at three the chains are finished
    // while the everyday row still reads 95.
    for (const bits of BIT_WIDTHS.filter((width) => width >= 5)) {
      for (const id of ABILITY_IDS) {
        expect(scoreAt(id, bits, false)).toBeGreaterThanOrEqual(97);
      }
    }

    // The prose quotes 4.4 GB and 3.2× at the far end of that flat stretch.
    expect(gigabytesAt(5, false)).toBeCloseTo(4.375, 6);
    expect(trafficMultipleAt(5, false).toFixed(1)).toBe('3.2');

    expect(shown(EVERYDAY, 4, false)).toBe(100);
    expect(shown('code', 4, false)).toBe(83);
    expect(shown(EVERYDAY, 3, false)).toBe(95);
    expect(shown('code', 3, false)).toBe(0);
    expect(shown('chain', 3, false)).toBe(0);

    expect(verdictFor(4, false)).toBe('looks-fine');
    expect(verdictFor(3, false)).toBe('hollowed');
    expect(cliffAt(false)).toBe(3);
  });

  it('buys back a whole digit by spending more where it matters', () => {
    // The two numbers the prose quotes for the toggle: at four digits code
    // climbs from 83 to 98, and at three from nothing at all to 85.
    expect(shown('code', 4, false)).toBe(83);
    expect(shown('code', 4, true)).toBe(98);
    expect(shown('code', 3, false)).toBe(0);
    expect(shown('code', 3, true)).toBe(85);
  });

  it('makes spending digits where they matter worth about one digit', () => {
    // Excludes 15, where the comparison would be against a width that rounds
    // nothing at all, and 2, where the doubling finally outruns the sparing.
    for (let bits = 3; bits <= 14; bits += 1) {
      for (const id of ABILITY_IDS) {
        expect(scoreAt(id, bits, true)).toBeGreaterThanOrEqual(
          scoreAt(id, bits + 1, false),
        );
      }
    }
  });

  it('recovers most of what plain rounding lost, where anything was lost', () => {
    for (const bits of [4, 3]) {
      for (const id of ABILITY_IDS) {
        const lost = 100 - scoreAt(id, bits, false);

        if (lost < 0.5) continue;

        const stillLost = 100 - scoreAt(id, bits, true);

        expect(1 - stillLost / lost).toBeGreaterThan(0.8);
      }
    }
  });

  it('costs nothing on the everyday row until long after it costs elsewhere', () => {
    // The whole reason the panel refuses to report a single quality number:
    // at every setting, the row a reader would check is the last to move.
    for (const careful of METHODS) {
      for (const bits of BIT_WIDTHS) {
        for (const id of ABILITY_IDS) {
          expect(scoreAt(EVERYDAY, bits, careful)).toBeGreaterThanOrEqual(
            scoreAt(id, bits, careful) - 1e-9,
          );
        }
      }
    }
  });
});
