import { describe, expect, it } from 'vitest';

import { DOC_TEXT } from './data.en';
import {
  clampPieceSize,
  countWords,
  cut,
  DOCUMENT,
  itemById,
  MAX_PIECE,
  MAX_RESULTS,
  MIN_PIECE,
  PIECE_SIZES,
  pieceOwning,
  pieceScore,
  questionById,
  search,
  similarity,
} from './logic';
import type { CutOptions, ItemId, QuestionId } from './logic';

const plain = (maxWords: number): CutOptions => ({
  maxWords,
  overlap: false,
  carryHeading: false,
});

const ownIds = (maxWords: number, options?: Partial<CutOptions>): ItemId[][] =>
  cut({ ...plain(maxWords), ...options }, DOC_TEXT).map((piece) =>
    piece.items.filter((item) => item.role === 'own').map((item) => item.id),
  );

const missingAt = (
  question: QuestionId,
  maxWords: number,
  options?: Partial<CutOptions>,
): ItemId[] => [
  ...search(question, { ...plain(maxWords), ...options }, DOC_TEXT).missing,
];

/** The sizes at which a question's answer comes back whole. */
const sizesThatWork = (
  question: QuestionId,
  options?: Partial<CutOptions>,
): number[] =>
  PIECE_SIZES.filter((size) => missingAt(question, size, options).length === 0);

const scoreOfPieceHolding = (
  question: QuestionId,
  id: ItemId,
  maxWords: number,
  options?: Partial<CutOptions>,
): number => {
  const outcome = search(
    question,
    { ...plain(maxWords), ...options },
    DOC_TEXT,
  );
  const holder = pieceOwning(outcome, id);
  if (holder === null) throw new Error(`no piece owns ${id}`);
  return holder.score;
};

describe('the document', () => {
  it('has a line of text for every line of the outline', () => {
    for (const item of DOCUMENT) {
      expect(countWords(DOC_TEXT[item.id])).toBeGreaterThan(0);
    }
  });

  it('never lets a line claim the same subject twice', () => {
    for (const item of DOCUMENT) {
      expect(new Set(item.topics).size).toBe(item.topics.length);
      expect(item.topics.length).toBeGreaterThan(0);
    }
  });

  it('opens with a heading, so every line sits under one', () => {
    expect(DOCUMENT[0].kind).toBe('heading');
  });
});

describe('countWords', () => {
  it('counts what a person would count', () => {
    expect(countWords('Section 3 — Travel')).toBe(4);
    expect(countWords('  padded   out  ')).toBe(2);
    expect(countWords('   ')).toBe(0);
  });
});

describe('clampPieceSize', () => {
  it('refuses a piece smaller than the smallest on offer', () => {
    expect(clampPieceSize(0)).toBe(MIN_PIECE);
    expect(clampPieceSize(-40)).toBe(MIN_PIECE);
  });

  it('refuses a piece bigger than the biggest on offer', () => {
    expect(clampPieceSize(4000)).toBe(MAX_PIECE);
  });

  it('snaps to a setting the slider can actually reach', () => {
    expect(PIECE_SIZES).toContain(clampPieceSize(33));
    expect(clampPieceSize(33)).toBe(35);
    expect(clampPieceSize(32)).toBe(30);
  });
});

describe('cut', () => {
  it('uses every line exactly once, in order', () => {
    for (const size of PIECE_SIZES) {
      const flattened = ownIds(size).flat();
      expect(flattened).toEqual(DOCUMENT.map((item) => item.id));
    }
  });

  it('keeps a piece inside its budget unless one line is bigger than it', () => {
    for (const size of PIECE_SIZES) {
      for (const piece of cut(plain(size), DOC_TEXT)) {
        const bodyLines = piece.items.filter(
          (item) => itemById(item.id).kind === 'body',
        );
        if (bodyLines.length > 1) expect(piece.words).toBeLessThanOrEqual(size);
      }
    }
  });

  it('never leaves a heading standing on its own', () => {
    for (const size of PIECE_SIZES) {
      for (const piece of cut(plain(size), DOC_TEXT)) {
        expect(
          piece.items.some((item) => itemById(item.id).kind === 'body'),
        ).toBe(true);
      }
    }
  });

  it('makes fewer, longer pieces as the budget goes up', () => {
    const smallest = cut(plain(MIN_PIECE), DOC_TEXT).length;
    const largest = cut(plain(MAX_PIECE), DOC_TEXT).length;
    expect(smallest).toBeGreaterThan(largest);
  });

  it('repeats the previous piece’s last line when overlap is on', () => {
    const pieces = cut({ ...plain(35), overlap: true }, DOC_TEXT);

    for (let index = 1; index < pieces.length; index += 1) {
      const first = pieces[index].items[0];
      const previousOwn = pieces[index - 1].items.filter(
        (item) => item.role === 'own',
      );

      expect(first.role).toBe('repeated');
      expect(first.id).toBe(previousOwn[previousOwn.length - 1].id);
    }
  });

  it('gives every piece its own section heading when stamping is on', () => {
    for (const size of PIECE_SIZES) {
      for (const piece of cut(
        { ...plain(size), carryHeading: true },
        DOC_TEXT,
      )) {
        const headings = piece.items.filter(
          (item) => itemById(item.id).kind === 'heading',
        );
        expect(headings.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('never puts the same line in a piece twice', () => {
    for (const size of PIECE_SIZES) {
      for (const options of [
        { carryHeading: true },
        { overlap: true },
        { carryHeading: true, overlap: true },
      ]) {
        for (const piece of cut({ ...plain(size), ...options }, DOC_TEXT)) {
          const ids = piece.items.map((item) => item.id);
          expect(new Set(ids).size).toBe(ids.length);
        }
      }
    }
  });

  /**
   * The invariant that makes the panel a controlled experiment: neither switch
   * moves a cut. Turning one on changes only what the pieces SAY, so any change
   * in what comes back is attributable to the words and to nothing else.
   */
  it('moves no cut when either switch is thrown', () => {
    for (const size of PIECE_SIZES) {
      expect(ownIds(size, { overlap: true })).toEqual(ownIds(size));
      expect(ownIds(size, { carryHeading: true })).toEqual(ownIds(size));
    }
  });
});

describe('similarity', () => {
  it('is 1 for two lines about exactly the same things', () => {
    expect(
      similarity(['gifts', 'suppliers'], ['suppliers', 'gifts']),
    ).toBeCloseTo(1, 10);
  });

  it('is 0 when nothing is shared', () => {
    expect(similarity(['travel'], ['gifts'])).toBe(0);
    expect(similarity([], ['gifts'])).toBe(0);
  });

  it('pays less per shared subject to a line that is about more things', () => {
    const narrow = similarity(['cap'], ['cap', 'travel']);
    const broad = similarity(['cap', 'gifts', 'forms'], ['cap', 'travel']);
    expect(narrow).toBeGreaterThan(broad);
  });
});

describe('search', () => {
  it('hands back at most three pieces, closest first', () => {
    for (const size of PIECE_SIZES) {
      const outcome = search('dinner', plain(size), DOC_TEXT);

      expect(outcome.returned.length).toBeLessThanOrEqual(MAX_RESULTS);

      for (let index = 1; index < outcome.returned.length; index += 1) {
        expect(outcome.returned[index - 1].score).toBeGreaterThanOrEqual(
          outcome.returned[index].score,
        );
      }
    }
  });

  it('numbers the pieces it hands back from one', () => {
    const outcome = search('dinner', plain(30), DOC_TEXT);
    expect(outcome.returned.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(
      outcome.pieces.filter((entry) => entry.rank === null).length,
    ).toBeGreaterThan(0);
  });

  it('never hands back a piece with nothing in common with the question', () => {
    for (const size of PIECE_SIZES) {
      for (const entry of search('hamper', plain(size), DOC_TEXT).returned) {
        expect(entry.score).toBeGreaterThan(0);
      }
    }
  });

  it('accounts for every line the answer needs, either way', () => {
    for (const size of PIECE_SIZES) {
      const outcome = search('dinner', plain(size), DOC_TEXT);
      expect([...outcome.found, ...outcome.missing].sort()).toEqual(
        [...questionById('dinner').needs].sort(),
      );
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number the page quotes about this instrument is checked here, so a
 * later edit to a line of the handbook fails the build instead of quietly
 * turning the surrounding paragraphs into fiction. The word counts are part of
 * that: rewrite `g2` two words shorter and the guarantee in the first test
 * below stops holding.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('puts the tender line further from its subject than any piece can reach', () => {
    const gap = (from: ItemId, to: ItemId): number => {
      const ids = DOCUMENT.map((item) => item.id);
      return ids
        .slice(ids.indexOf(from), ids.indexOf(to) + 1)
        .reduce((total, id) => total + countWords(DOC_TEXT[id]), 0);
    };

    // Sixty-six words from the heading that names the subject, sixty from the
    // only other line that names it. The widest cut on offer is fifty-five.
    expect(gap('h5', 'g3')).toBe(66);
    expect(gap('g1', 'g3')).toBe(60);
    expect(MAX_PIECE).toBeLessThan(gap('g1', 'g3'));
  });

  it('shares no subject at all between the tender line and the question', () => {
    expect(
      similarity(itemById('g3').topics, questionById('hamper').topics),
    ).toBe(0);
  });

  it('never returns the tender line, at any size', () => {
    for (const size of PIECE_SIZES) {
      expect(missingAt('hamper', size)).toEqual(['g3']);
      expect(scoreOfPieceHolding('hamper', 'g3', size)).toBe(0);
    }

    expect(sizesThatWork('hamper')).toEqual([]);
  });

  it('returns it at every size once the heading is stamped on', () => {
    expect(sizesThatWork('hamper', { carryHeading: true })).toEqual([
      ...PIECE_SIZES,
    ]);

    for (const size of PIECE_SIZES) {
      expect(
        scoreOfPieceHolding('hamper', 'g3', size, { carryHeading: true }),
      ).toBeGreaterThan(0);
    }
  });

  it('shows overlap rescuing it at two sizes out of eight, which is luck', () => {
    expect(PIECE_SIZES.length).toBe(8);
    expect(sizesThatWork('hamper', { overlap: true })).toEqual([40, 50]);
    // Not the size the panel opens on, which is the whole point of saying so.
    expect(sizesThatWork('hamper', { overlap: true })).not.toContain(MAX_PIECE);
  });

  it('has no correct size for the dinner question — it comes and goes', () => {
    expect(sizesThatWork('dinner')).toEqual([25, 45, 50, 55]);
    expect(missingAt('dinner', 20)).toEqual(['e3']);
    expect(missingAt('dinner', 25)).toEqual([]);
    expect(missingAt('dinner', 30)).toEqual(['e3']);
    expect(missingAt('dinner', 40)).toEqual(['e3']);
  });

  it('makes overlap a real fix for the answer split across a cut', () => {
    expect(sizesThatWork('dinner', { overlap: true })).toEqual([
      ...PIECE_SIZES,
    ]);
  });

  it('dilutes the winning piece as the pieces get wider', () => {
    // Quoted in the unit as 0.62 against 0.41: the same sentence, the same
    // question, a third of the score gone to the company it is now keeping.
    expect(scoreOfPieceHolding('dinner', 'e2', 30)).toBeCloseTo(0.62, 2);
    expect(scoreOfPieceHolding('dinner', 'e2', 55)).toBeCloseTo(0.41, 2);
  });

  it('quotes the numbers the walkthrough reads off the widest cut', () => {
    const dinner = search('dinner', plain(55), DOC_TEXT);
    expect(dinner.returned.map((entry) => entry.score.toFixed(2))).toEqual([
      '0.41',
      '0.41',
      '0.17',
    ]);
    expect(dinner.missing).toEqual([]);

    const hamper = search('hamper', plain(55), DOC_TEXT);
    expect(hamper.returned.map((entry) => entry.score.toFixed(2))).toEqual([
      '0.50',
      '0.20',
      '0.15',
    ]);

    const stamped = search(
      'hamper',
      { ...plain(55), carryHeading: true },
      DOC_TEXT,
    );
    expect(stamped.returned.map((entry) => entry.score.toFixed(2))).toEqual([
      '0.61',
      '0.41',
      '0.16',
    ]);
    expect(stamped.missing).toEqual([]);
  });

  it('leaves a piece of five subjects sitting near none of them', () => {
    const wide = cut(plain(55), DOC_TEXT);
    const holder = wide.find((piece) =>
      piece.items.some((item) => item.id === 'e2'),
    );
    if (holder === undefined) throw new Error('no piece holds e2');

    // The piece that holds the limit at the widest cut also holds where a meal
    // is claimed, what happens if you go over, and the gifts heading — and
    // scores lower than the single line by itself would.
    expect(holder.items.length).toBeGreaterThan(3);
    expect(pieceScore(holder, questionById('dinner').topics)).toBeLessThan(
      similarity(itemById('e1').topics, questionById('dinner').topics),
    );
  });
});
