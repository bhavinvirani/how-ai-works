import { describe, expect, it } from 'vitest';

import {
  everyJobIn,
  FIRST_INSTINCT,
  isRight,
  isSurprising,
  jobById,
  JOBS,
  markFor,
  PILES,
  SURPRISING_JOBS,
  tally,
} from './logic';
import type { JobId, Pile } from './logic';

describe('the set of jobs', () => {
  it('gives every job an id of its own', () => {
    const ids = new Set(JOBS.map((job) => job.id));
    expect(ids.size).toBe(JOBS.length);
  });

  it('finds a job by id, and refuses one that does not exist', () => {
    expect(jobById('handoff').belongs).toBe('dials');
    // @ts-expect-error — the guard exists for data edits, not for callers.
    expect(() => jobById('nonsense')).toThrow();
  });

  it('offers exactly the two piles the copy names', () => {
    expect(PILES).toEqual(['dials', 'prompt']);
  });
});

describe('markFor', () => {
  it('calls the matching pile right and the other one wrong', () => {
    const style = jobById('house-style');

    expect(markFor(style, 'dials')).toBe('right');
    expect(markFor(style, 'prompt')).toBe('wrong');
  });

  it('accepts both piles for a job where both genuinely work', () => {
    const format = jobById('fixed-format');

    expect(markFor(format, 'dials')).toBe('both');
    expect(markFor(format, 'prompt')).toBe('both');
  });

  it('never marks a choice wrong when the job takes either pile', () => {
    for (const job of JOBS.filter((entry) => entry.belongs === 'either')) {
      for (const pile of PILES) expect(isRight(job, pile)).toBe(true);
    }
  });

  it('accepts exactly one pile for every job that is not either', () => {
    for (const job of JOBS.filter((entry) => entry.belongs !== 'either')) {
      const accepted = PILES.filter((pile) => isRight(job, pile));
      expect(accepted).toEqual([job.belongs]);
    }
  });
});

describe('tally', () => {
  it('counts nothing before the reader has sorted anything', () => {
    expect(tally({})).toEqual({
      answered: 0,
      right: 0,
      total: JOBS.length,
    });
  });

  it('counts only the jobs actually answered', () => {
    const partial = tally({ 'house-style': 'dials', 'on-call': 'dials' });

    expect(partial.answered).toBe(2);
    expect(partial.right).toBe(1);
    expect(partial.total).toBe(JOBS.length);
  });

  it('reaches full marks when every job is put where it belongs', () => {
    const answers: Partial<Record<JobId, Pile>> = {};

    for (const job of JOBS) {
      answers[job.id] = job.belongs === 'either' ? 'prompt' : job.belongs;
    }

    const perfect = tally(answers);

    expect(perfect.right).toBe(JOBS.length);
    expect(perfect.answered).toBe(JOBS.length);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number and every name the page quotes about this instrument is checked
 * here, so that adding a ninth job or softening a verdict fails the build
 * instead of quietly turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('is the eight jobs the panel and the prose both count', () => {
    expect(JOBS.length).toBe(8);
  });

  it('holds exactly the three the lead promises are not what they look like', () => {
    // src/copy/en.ts: "Three of them are not what they look like."
    expect(SURPRISING_JOBS.map((job) => job.id)).toEqual([
      'returns-policy',
      'fixed-format',
      'handoff',
    ]);

    for (const job of SURPRISING_JOBS) {
      expect(isSurprising(job)).toBe(true);
      expect(job.belongs).not.toBe(job.firstInstinct);
    }
  });

  it('sends the contents of a policy and the conduct it demands to opposite piles', () => {
    // The sharpest comparison in the unit, and the reason both jobs exist:
    // they could be lifted from the same document and they do not go to the
    // same place.
    expect(jobById('returns-policy').belongs).toBe('prompt');
    expect(jobById('handoff').belongs).toBe('dials');
  });

  it('never puts a fact with a date on it in the dials', () => {
    for (const id of ['weekly-prices', 'on-call', 'past-tickets'] as const) {
      expect(jobById(id).belongs).toBe('prompt');
    }
  });

  it('keeps ways of writing in the dials, where habits are held', () => {
    for (const id of ['house-style', 'hedging'] as const) {
      expect(jobById(id).belongs).toBe('dials');
    }
  });

  it('scores six of eight for a reader who answers entirely on instinct', () => {
    const instinct = tally(FIRST_INSTINCT);

    expect(instinct.answered).toBe(8);
    expect(instinct.right).toBe(6);
  });

  it('leaves the instinctive reader wrong about exactly the two policy jobs', () => {
    const missed = JOBS.filter((job) => !isRight(job, job.firstInstinct)).map(
      (job) => job.id,
    );

    expect(missed).toEqual(['returns-policy', 'handoff']);
  });

  it('lets the third tricky job be got right without the idea', () => {
    // `fixed-format` is scored correct on instinct, so six out of eight is
    // fully compatible with having missed the point. The prose says so.
    const format = jobById('fixed-format');

    expect(isSurprising(format)).toBe(true);
    expect(isRight(format, format.firstInstinct)).toBe(true);
  });

  it('rewards no blanket strategy — four one way, five the other', () => {
    expect(tally(everyJobIn('dials')).right).toBe(4);
    expect(tally(everyJobIn('prompt')).right).toBe(5);
  });

  it('alternates so the tricky jobs are never met in a run', () => {
    const positions = SURPRISING_JOBS.map((job) =>
      JOBS.findIndex((entry) => entry.id === job.id),
    );

    expect(positions).toEqual([1, 3, 5]);
  });
});
