import { describe, expect, it } from 'vitest';

import { INSTRUCTIONS, MESSAGES, TEXT } from './data.en';
import {
  answerFor,
  BASELINE_VERSION,
  brokenBy,
  CASE_IDS,
  casesShown,
  changeFor,
  EXPECTED,
  failing,
  fixedBy,
  passCount,
  QUEUES,
  REPORTED_CASE,
  tallyFor,
  TOTAL_CASES,
  verdictFor,
  VERSION_IDS,
} from './logic';

/**
 * The words the keyword patch keys on, as they turn up in what customers
 * wrote. This is the whole mechanism of the regression: a rule written on a
 * word fires wherever the word is, and a support inbox is full of people
 * describing something broken while asking for something that is not a refund.
 */
const DAMAGE = /damag|broke|crack|flatten|piece/i;

describe('the set', () => {
  it('is ten cases, each with one known-good queue', () => {
    expect(TOTAL_CASES).toBe(10);
    expect(CASE_IDS).toHaveLength(10);
    expect(new Set(CASE_IDS).size).toBe(10);

    for (const id of CASE_IDS) {
      expect(QUEUES).toContain(EXPECTED[id]);
    }
  });

  it('gives every case a message somebody could have sent', () => {
    for (const id of CASE_IDS) {
      expect(MESSAGES[id].length).toBeGreaterThan(20);
    }
  });

  it('uses every queue, so no label is decoration', () => {
    for (const queue of QUEUES) {
      expect(CASE_IDS.some((id) => EXPECTED[id] === queue)).toBe(true);
    }
  });

  it('has the reported case in it', () => {
    expect(CASE_IDS).toContain(REPORTED_CASE);
  });
});

describe('answerFor', () => {
  it('answers every case under every version', () => {
    for (const version of VERSION_IDS) {
      for (const id of CASE_IDS) {
        expect(QUEUES).toContain(answerFor(version, id));
      }
    }
  });

  it('is deterministic — the same version always answers the same way', () => {
    for (const version of VERSION_IDS) {
      for (const id of CASE_IDS) {
        expect(answerFor(version, id)).toBe(answerFor(version, id));
      }
    }
  });

  it('never records a wrong answer that is secretly the right one', () => {
    for (const version of VERSION_IDS) {
      for (const id of failing(version)) {
        expect(answerFor(version, id)).not.toBe(EXPECTED[id]);
      }
    }
  });
});

describe('changeFor', () => {
  it('says nothing moved when the version is the one already running', () => {
    for (const id of CASE_IDS) {
      expect(changeFor(BASELINE_VERSION, id)).toBe('unchanged');
    }

    expect(fixedBy(BASELINE_VERSION)).toHaveLength(0);
    expect(brokenBy(BASELINE_VERSION)).toHaveLength(0);
  });

  it('keeps fixed and broken apart from passing and failing', () => {
    for (const version of VERSION_IDS) {
      for (const id of fixedBy(version)) {
        expect(verdictFor(version, id)).toBe('pass');
        expect(verdictFor(BASELINE_VERSION, id)).toBe('fail');
      }

      for (const id of brokenBy(version)) {
        expect(verdictFor(version, id)).toBe('fail');
        expect(verdictFor(BASELINE_VERSION, id)).toBe('pass');
      }
    }
  });
});

describe('casesShown', () => {
  it('runs the one reported message, or all ten', () => {
    expect(casesShown(true)).toEqual([REPORTED_CASE]);
    expect(casesShown(false)).toEqual(CASE_IDS);
  });
});

describe('tallyFor', () => {
  it('counts only the cases actually run', () => {
    for (const version of VERSION_IDS) {
      expect(tallyFor(version, true).shown).toBe(1);
      expect(tallyFor(version, false).shown).toBe(TOTAL_CASES);
      expect(tallyFor(version, false).passed).toBe(passCount(version));
    }
  });

  it('never reports more passes than cases', () => {
    for (const version of VERSION_IDS) {
      for (const onlyReported of [true, false]) {
        const tally = tallyFor(version, onlyReported);

        expect(tally.passed).toBeLessThanOrEqual(tally.shown);
        expect(tally.fixed + tally.broken).toBeLessThanOrEqual(tally.shown);
      }
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every score the page quotes is checked here, along with the shape of the
 * story it tells about them — so a later edit to a message, a known-good
 * answer or a recorded mislabel fails the build instead of quietly turning the
 * surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('starts at 9 of 10, failing only the message that was complained about', () => {
    expect(passCount(BASELINE_VERSION)).toBe(9);
    expect(failing(BASELINE_VERSION)).toEqual([REPORTED_CASE]);
  });

  it('makes the patch look finished when only the reported case is run', () => {
    const narrow = tallyFor('keyword', true);

    expect(narrow.shown).toBe(1);
    expect(narrow.passed).toBe(1);
    expect(narrow.broken).toBe(0);

    // The whole point: the three regressions exist and are invisible from here.
    expect(brokenBy('keyword')).toHaveLength(3);
  });

  it('fixes one and breaks three the moment the other nine are run', () => {
    expect(fixedBy('keyword')).toEqual([REPORTED_CASE]);
    expect(brokenBy('keyword')).toHaveLength(3);
    expect(passCount('keyword')).toBe(7);

    // Worse than what was already live, while passing the case it was written
    // for — which is the sentence the unit is built around.
    expect(passCount('keyword')).toBeLessThan(passCount(BASELINE_VERSION));
    expect(verdictFor('keyword', REPORTED_CASE)).toBe('pass');
  });

  it('breaks exactly the cases carrying the word the new rule keys on', () => {
    expect(INSTRUCTIONS.keyword.join(' ')).toMatch(DAMAGE);

    const mentionsDamage = CASE_IDS.filter((id) => DAMAGE.test(MESSAGES[id]));

    // Four messages describe something broken. One of them wants money back;
    // the other three want something else entirely, and the rule cannot tell.
    expect(mentionsDamage).toHaveLength(4);

    for (const id of mentionsDamage) {
      expect(answerFor('keyword', id)).toBe('refund');
    }

    expect([...brokenBy('keyword')].sort()).toEqual(
      mentionsDamage.filter((id) => id !== REPORTED_CASE).sort(),
    );

    for (const id of brokenBy('keyword')) {
      expect(EXPECTED[id]).not.toBe('refund');
    }
  });

  it('gets back to 9 of 10 with a second patch, and it is a different nine', () => {
    expect(passCount('longer')).toBe(passCount(BASELINE_VERSION));
    expect(failing('longer')).not.toEqual(failing(BASELINE_VERSION));

    expect(fixedBy('longer')).toEqual([REPORTED_CASE]);
    expect(brokenBy('longer')).toHaveLength(1);

    // The second patch repairs some of the first one's damage and none of it is
    // new: whatever it still breaks was already broken by the patch before it.
    for (const id of brokenBy('longer')) {
      expect(brokenBy('keyword')).toContain(id);
    }
  });

  it('reaches 10 of 10 only by throwing the patched instruction away', () => {
    expect(passCount('rewrite')).toBe(TOTAL_CASES);
    expect(failing('rewrite')).toHaveLength(0);
    expect(brokenBy('rewrite')).toHaveLength(0);

    // Patches append. The version that works shares no line with the one that
    // shipped, which is the visible difference between the two habits.
    expect(INSTRUCTIONS.keyword[0]).toBe(INSTRUCTIONS.shipped[0]);
    expect(INSTRUCTIONS.longer[0]).toBe(INSTRUCTIONS.shipped[0]);
    expect(INSTRUCTIONS.keyword).toHaveLength(2);
    expect(INSTRUCTIONS.longer).toHaveLength(3);

    for (const line of INSTRUCTIONS.rewrite) {
      expect(INSTRUCTIONS.longer).not.toContain(line);
    }
  });

  it('quotes the four scores the prose walks the reader through', () => {
    expect(VERSION_IDS.map((id) => passCount(id))).toEqual([9, 7, 9, 10]);
  });

  it('says out loud what the score alone would hide', () => {
    const narrow = TEXT.score(tallyFor('keyword', true));
    const full = TEXT.score(tallyFor('keyword', false));
    const sameScore = TEXT.score(tallyFor('longer', false));

    expect(narrow).toContain('1 of 1 pass.');
    expect(narrow).not.toMatch(/7|three|3 that/);
    expect(full).toContain('7 of 10 pass.');
    expect(full).toContain('3 that used to pass now fail');
    expect(sameScore).toContain('9 of 10 pass.');
    expect(sameScore).toContain('not the same 9');
  });
});
