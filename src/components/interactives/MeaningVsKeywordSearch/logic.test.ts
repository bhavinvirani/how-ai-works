import { describe, expect, it } from 'vitest';

import { PASSAGE_TEXT, QUERY_TEXT } from './data.en';
import {
  ANSWER,
  answerRank,
  buildIndex,
  keywordScore,
  MEANING,
  MEANING_WEIGHT,
  PASSAGE_IDS,
  QUERY_IDS,
  questionsWon,
  retrievedCount,
  search,
  sharedTerms,
  SHORTLIST,
  terms,
  uniqueTerms,
  weightOf,
} from './logic';
import type { Method, PassageId, QueryId } from './logic';

const INDEX = buildIndex(PASSAGE_TEXT);

const ids = (method: Method, query: QueryId): PassageId[] =>
  search(method, query, PASSAGE_TEXT, QUERY_TEXT).map((hit) => hit.id);

describe('terms', () => {
  it('keeps a hyphenated code together as one word', () => {
    expect(terms('Error E-4102 again')).toEqual(['error', 'e-4102', 'again']);
  });

  it('lower-cases and drops punctuation', () => {
    expect(terms('Why does it keep refusing my password?')).toEqual([
      'why',
      'does',
      'it',
      'keep',
      'refusing',
      'my',
      'password',
    ]);
  });

  it('has nothing to say about a string with no words in it', () => {
    expect(terms('!?  --')).toEqual([]);
  });

  it('drops repeats only when asked', () => {
    expect(terms('base base')).toHaveLength(2);
    expect(uniqueTerms('base base')).toEqual(['base']);
  });
});

describe('sharedTerms', () => {
  it('returns the words two pieces of text have in common, once each', () => {
    expect(
      sharedTerms('the base station', 'a base, and a base station'),
    ).toEqual(['base', 'station']);
  });

  it('is empty when nothing is shared', () => {
    expect(sharedTerms('abacus', 'zeppelin')).toEqual([]);
  });
});

describe('weightOf', () => {
  it('is worth nothing for a word nowhere on the shelf', () => {
    expect(weightOf('zeppelin', INDEX)).toBe(0);
  });

  it('is worth more for a rare word than a common one', () => {
    expect(weightOf('password', INDEX)).toBeGreaterThan(weightOf('the', INDEX));
  });
});

describe('keywordScore', () => {
  it('is zero when a passage holds none of the words', () => {
    expect(keywordScore(QUERY_TEXT.password, PASSAGE_TEXT.lockout, INDEX)).toBe(
      0,
    );
  });

  it('is never negative', () => {
    for (const query of QUERY_IDS) {
      for (const id of PASSAGE_IDS) {
        expect(
          keywordScore(QUERY_TEXT[query], PASSAGE_TEXT[id], INDEX),
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('search', () => {
  it('ranks every passage by meaning, because every passage has a position', () => {
    for (const query of QUERY_IDS) {
      expect(ids('meaning', query)).toHaveLength(PASSAGE_IDS.length);
    }
  });

  it('returns only passages holding one of the words when searching by word', () => {
    for (const query of QUERY_IDS) {
      for (const hit of search('keyword', query, PASSAGE_TEXT, QUERY_TEXT)) {
        expect(hit.matched.length).toBeGreaterThan(0);
      }
    }
  });

  it('puts the best score first for every method and every question', () => {
    for (const method of ['meaning', 'keyword', 'both'] as const) {
      for (const query of QUERY_IDS) {
        const hits = search(method, query, PASSAGE_TEXT, QUERY_TEXT);

        for (let index = 1; index < hits.length; index += 1) {
          expect(hits[index - 1].score).toBeGreaterThanOrEqual(
            hits[index].score,
          );
        }
      }
    }
  });

  it('gives the same answer twice running', () => {
    expect(ids('both', 'code')).toEqual(ids('both', 'code'));
  });

  it('never shows more than a handful', () => {
    for (const method of ['meaning', 'keyword', 'both'] as const) {
      for (const query of QUERY_IDS) {
        expect(
          answerRank(method, query, PASSAGE_TEXT, QUERY_TEXT) ?? 1,
        ).toBeLessThanOrEqual(SHORTLIST);
      }
    }
  });
});

describe('the shelf', () => {
  it('has a written answer for every question, and it is on the shelf', () => {
    for (const query of QUERY_IDS) {
      expect(PASSAGE_IDS).toContain(ANSWER[query]);
    }
  });

  it('scores every passage against every question', () => {
    for (const query of QUERY_IDS) {
      for (const id of PASSAGE_IDS) {
        expect(MEANING[query][id]).toBeGreaterThan(0);
        expect(MEANING[query][id]).toBeLessThanOrEqual(1);
      }
    }
  });

  it('carries no apostrophe in anything that gets indexed', () => {
    // `terms()` splits on letters, digits and hyphens, so an apostrophe cuts a
    // word in two and silently moves every score on the page.
    for (const id of PASSAGE_IDS) {
      expect(PASSAGE_TEXT[id]).not.toMatch(/['’]/);
    }
    for (const query of QUERY_IDS) {
      expect(QUERY_TEXT[query]).not.toMatch(/['’]/);
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number the page quotes is checked here, so a later edit to a passage,
 * a question or a score fails the build instead of quietly turning the
 * surrounding paragraphs into fiction. Two of these are not merely pinned but
 * *proved*: the "shares not one word" claim comes out of the same function
 * keyword search matches on, so the two halves cannot drift apart.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('finds the page that answers a question sharing not one word with it', () => {
    expect(uniqueTerms(QUERY_TEXT.password)).toHaveLength(7);
    expect(sharedTerms(QUERY_TEXT.password, PASSAGE_TEXT.lockout)).toEqual([]);

    expect(answerRank('meaning', 'password', PASSAGE_TEXT, QUERY_TEXT)).toBe(1);
    expect(MEANING.password.lockout).toBe(0.81);
  });

  it('does the same for a second question, where the key word is on no page', () => {
    expect(uniqueTerms(QUERY_TEXT.refund)).toHaveLength(7);
    expect(sharedTerms(QUERY_TEXT.refund, PASSAGE_TEXT.refunds)).toEqual([]);

    for (const id of PASSAGE_IDS) {
      expect(terms(PASSAGE_TEXT[id])).not.toContain('money');
    }

    expect(answerRank('meaning', 'refund', PASSAGE_TEXT, QUERY_TEXT)).toBe(1);
    expect(MEANING.refund.refunds).toBe(0.86);
  });

  it('never retrieves either of those pages by word, and hands back a wrong one', () => {
    expect(
      answerRank('keyword', 'password', PASSAGE_TEXT, QUERY_TEXT),
    ).toBeNull();
    expect(
      answerRank('keyword', 'refund', PASSAGE_TEXT, QUERY_TEXT),
    ).toBeNull();

    expect(retrievedCount('password', PASSAGE_TEXT, QUERY_TEXT)).toBe(1);
    expect(retrievedCount('refund', PASSAGE_TEXT, QUERY_TEXT)).toBe(1);

    // The one page carrying `password` is about spreadsheets; the one carrying
    // `back` is about calls per minute. Both are the top and only word-match.
    const [word] = search('keyword', 'password', PASSAGE_TEXT, QUERY_TEXT);
    expect(word.id).toBe('bulk-import');
    expect(word.matched).toEqual(['password']);

    const [money] = search('keyword', 'refund', PASSAGE_TEXT, QUERY_TEXT);
    expect(money.id).toBe('rate-limit');
    expect(money.matched).toEqual(['back']);

    // And meaning does not think the spreadsheet page is irrelevant either — it
    // ranks it second. It simply ranked the right one above it.
    expect(ids('meaning', 'password')[1]).toBe('bulk-import');
  });

  it('cannot tell two error codes apart, and puts the wrong one on top', () => {
    expect(MEANING.code['err-4120']).toBe(0.63);
    expect(MEANING.code['err-4102']).toBe(0.62);
    expect(MEANING.code['err-4120'] - MEANING.code['err-4102']).toBeCloseTo(
      0.01,
      6,
    );

    expect(ids('meaning', 'code')[0]).toBe('err-4120');
    expect(answerRank('meaning', 'code', PASSAGE_TEXT, QUERY_TEXT)).toBe(2);
  });

  it('separates the same two instantly by string, and by a mile', () => {
    const hits = search('keyword', 'code', PASSAGE_TEXT, QUERY_TEXT);

    expect(hits.map((hit) => hit.id)).toEqual(['err-4102', 'err-4120']);
    expect(hits[0].matched).toEqual(['error', 'e-4102']);
    expect(hits[1].matched).toEqual(['error']);

    // 3.47 against 1.39, as the panel prints them.
    expect(hits[0].score).toBeCloseTo(3.47, 2);
    expect(hits[1].score).toBeCloseTo(1.39, 2);
    expect(hits[0].score).toBeGreaterThan(hits[1].score * 2);
  });

  it('has nothing to say about a name, and says it in a flat column', () => {
    const scores = PASSAGE_IDS.map((id) => MEANING.name[id]);

    expect(Math.min(...scores)).toBe(0.15);
    expect(Math.max(...scores)).toBe(0.26);
    expect(Math.max(...scores) - Math.min(...scores)).toBeCloseTo(0.11, 6);

    expect(answerRank('meaning', 'name', PASSAGE_TEXT, QUERY_TEXT)).toBe(2);
    expect(answerRank('keyword', 'name', PASSAGE_TEXT, QUERY_TEXT)).toBe(1);
    expect(retrievedCount('name', PASSAGE_TEXT, QUERY_TEXT)).toBe(1);
  });

  it('gets exactly half the questions right whichever single method is used', () => {
    expect(questionsWon('meaning', PASSAGE_TEXT, QUERY_TEXT)).toEqual([
      'password',
      'refund',
    ]);
    expect(questionsWon('keyword', PASSAGE_TEXT, QUERY_TEXT)).toEqual([
      'code',
      'name',
    ]);
  });

  it('fails on opposite questions, which is the reason to run both', () => {
    const meaning = new Set(questionsWon('meaning', PASSAGE_TEXT, QUERY_TEXT));
    const keyword = new Set(questionsWon('keyword', PASSAGE_TEXT, QUERY_TEXT));

    for (const query of QUERY_IDS) {
      expect(meaning.has(query)).toBe(!keyword.has(query));
    }
  });

  it('is right on all four once the two lists are combined', () => {
    expect(questionsWon('both', PASSAGE_TEXT, QUERY_TEXT)).toEqual(QUERY_IDS);

    for (const query of QUERY_IDS) {
      expect(answerRank('both', query, PASSAGE_TEXT, QUERY_TEXT)).toBe(1);
    }
  });

  it('combines them seven parts to three, which is a choice and not a finding', () => {
    expect(MEANING_WEIGHT).toBe(0.7);
  });
});
