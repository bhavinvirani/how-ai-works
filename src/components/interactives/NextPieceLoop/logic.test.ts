import { describe, expect, it } from 'vitest';

import { asPercent, WRITTEN_CONTEXTS } from '../shared/nextpiece/logic';
import {
  clampWritten,
  GIVEN_PIECES,
  LONG_SHOT_ONE_IN,
  LONG_SHOT_SHARE,
  LONG_SHOT_TEXT,
  piecesIn,
  piecesOf,
  readingFor,
  RUNS,
  START_IDS,
  STUCK_OPENING,
} from './logic';
import type { StartId } from './logic';

/** The row as the panel prints it: piece, whole per cent, in order. */
const printed = (start: StartId, written: number) =>
  readingFor(start, written).row.map(
    (entry) => `${entry.text} ${String(asPercent(entry.probability))}`,
  );

const finished = (start: StartId) => readingFor(start, RUNS[start].length);

describe('piecesOf', () => {
  it('counts a stretch of writing in pieces', () => {
    expect(piecesOf('The weather today is')).toEqual([
      'The',
      'weather',
      'today',
      'is',
    ]);
    expect(piecesIn('The weather today is')).toBe(4);
  });

  it('is not confused by the spacing the loop glues pieces on with', () => {
    expect(piecesIn('  The weather   today is  ')).toBe(4);
  });
});

describe('clampWritten', () => {
  it('refuses to go back past nothing written', () => {
    for (const start of START_IDS) {
      expect(clampWritten(start, -3)).toBe(0);
    }
  });

  it('stops at the end of whichever run is on show', () => {
    for (const start of START_IDS) {
      expect(clampWritten(start, 99)).toBe(RUNS[start].length);
    }
  });

  it('keeps a counter that is too long for the run the reader switched to', () => {
    // The two runs are different lengths, so switching start with the counter
    // wound up must not index off the end of the shorter one.
    expect(RUNS.ordinary.length).not.toBe(RUNS.stuck.length);
    expect(clampWritten('stuck', RUNS.ordinary.length)).toBe(RUNS.stuck.length);
  });
});

describe('readingFor', () => {
  it('starts with nothing written and nothing drawn', () => {
    for (const start of START_IDS) {
      const reading = readingFor(start, 0);

      expect(reading.written).toBe(0);
      expect(reading.chosen).toBeUndefined();
      expect(reading.latest).toBeUndefined();
      expect(reading.pieces).toHaveLength(0);
      expect(reading.sentence).toBe(reading.opening);
      expect(reading.finished).toBe(false);
    }
  });

  it('shows the same row before and after the press that resolves it', () => {
    // The first press marks a row the reader has already been looking at. If it
    // showed a different row, "this is the row it chose from" would be false.
    expect(readingFor('ordinary', 1).row).toEqual(
      readingFor('ordinary', 0).row,
    );
    expect(readingFor('ordinary', 1).chosen).toBe(0);
  });

  it('names the row favourite whether or not the draw landed there', () => {
    const reading = readingFor('ordinary', 0);

    expect(reading.favouriteText).toBe('mild');
    expect(reading.favouritePercent).toBe(55);
  });

  it('grows the trail by exactly one line per press', () => {
    for (const start of START_IDS) {
      for (let written = 0; written <= RUNS[start].length; written += 1) {
        expect(readingFor(start, written).pieces).toHaveLength(written);
      }
    }
  });

  it('knows when a run has run out', () => {
    for (const start of START_IDS) {
      expect(finished(start).finished).toBe(true);
      expect(readingFor(start, RUNS[start].length - 1).finished).toBe(false);
    }
  });

  it('is deterministic — the same counter always shows the same thing', () => {
    expect(readingFor('ordinary', 3)).toEqual(readingFor('ordinary', 3));
  });

  it('shows only rows the table was written for', () => {
    // Nothing on screen may come from the shared module's flat fallback row.
    // That row exists so a reader wandering off the paths sees the sentence
    // wind down, but it is invented filler, and this panel is being offered as
    // a look at what a model does.
    for (const start of START_IDS) {
      for (const step of RUNS[start]) {
        expect(WRITTEN_CONTEXTS).toContain(step.written);
      }
    }
  });

  it('marks the one row holding a share too small to print', () => {
    expect(readingFor('ordinary', 0).roundsToZero).toBe(true);
    expect(readingFor('ordinary', 2).roundsToZero).toBe(false);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number `text-generation` quotes is here, so an edit to the shared table
 * or to either seed fails the build instead of quietly turning the page into
 * fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('re-reads one more piece before every piece it writes', () => {
    // The first claim, and the only evidence for it: the context the model
    // scores from is exactly the previous context plus the piece it drew, so it
    // grows by one every pass and never by anything else.
    const reading = finished('ordinary');

    expect(reading.pieces.map((piece) => piece.read)).toEqual([4, 5, 6, 7]);

    // And the row on show at the end was scored from seven pieces, not from the
    // eight now on screen — the eighth is the thing that row produced.
    expect(reading.context).toBe('The weather today is mild and dry');
    expect(reading.contextPieces).toBe(7);

    RUNS.ordinary.forEach((step, index) => {
      if (index === 0) return;
      const before = RUNS.ordinary[index - 1];
      expect(step.written).toBe(
        `${before.written} ${before.row[before.chosen].text}`,
      );
    });
  });

  it('writes the sentence the prose quotes, one piece at a time', () => {
    const reading = finished('ordinary');

    expect(reading.total).toBe(4);
    expect(reading.sentence).toBe('The weather today is mild and dry again');
    expect(reading.pieces.map((piece) => piece.text)).toEqual([
      'mild',
      'and',
      'dry',
      'again',
    ]);
  });

  it('never had a plan, so what it has written is always a start of what it will write', () => {
    // Winding the reader's counter back and forth cannot change the run. The
    // sentence at every setting is a prefix of the finished one, which is the
    // precise version of "it wrote this without knowing where it was going".
    const whole = finished('ordinary').sentence;

    for (let written = 0; written <= RUNS.ordinary.length; written += 1) {
      expect(whole.startsWith(readingFor('ordinary', written).sentence)).toBe(
        true,
      );
    }
  });

  it('draws from the row instead of taking the top of it', () => {
    // The pass the prose leans on. The row said "across" at 51 per cent, and
    // the model wrote "again" at 11 — nothing chose, a number landed.
    expect(printed('ordinary', 4)).toEqual([
      'across 51',
      'throughout 28',
      'again 11',
      'everywhere 9',
    ]);

    const last = finished('ordinary').pieces[3];
    expect(last.text).toBe('again');
    expect(last.percent).toBe(11);
    expect(last.favourite).toBe(false);
    expect(finished('ordinary').favouriteText).toBe('across');
    expect(finished('ordinary').favouritePercent).toBe(51);
  });

  it('quotes the opening row the way the page prints it', () => {
    expect(printed('ordinary', 0)).toEqual([
      'mild 55',
      'cold 27',
      'unsettled 12',
      'glorious 5',
      'aubergine 0',
    ]);

    expect(readingFor('ordinary', 2).pieces[1].percent).toBe(58);
    expect(readingFor('ordinary', 3).pieces[2].percent).toBe(53);
  });

  it('gives the piece that ruins the sentence a share that is small, real, and not the zero it prints as', () => {
    expect(LONG_SHOT_TEXT).toBe('aubergine');
    expect(asPercent(LONG_SHOT_SHARE)).toBe(0);
    // The panel and the prose both print it to one more place, and both say
    // how rare that makes the branch.
    expect((LONG_SHOT_SHARE * 100).toFixed(1)).toBe('0.4');
    expect(LONG_SHOT_ONE_IN).toBe(270);
  });

  it('carries on from the bad piece rather than undoing it', () => {
    // The second claim, and the one readers resist. Every piece the model could
    // write after the bad one leaves the bad one exactly where it is: there is
    // no candidate anywhere in either row that shortens the sentence or clears
    // the stem, because appending is the only operation the loop has.
    expect(RUNS.stuck.length).toBeGreaterThan(0);

    // The bad piece is one the model drew, not one anybody typed: the stuck run
    // starts from the same four pieces the ordinary one does, plus one more.
    expect(GIVEN_PIECES).toBe(4);
    expect(piecesIn(readingFor('ordinary', 0).opening)).toBe(GIVEN_PIECES);
    expect(piecesIn(readingFor('stuck', 0).opening)).toBe(GIVEN_PIECES + 1);
    expect(STUCK_OPENING.endsWith(LONG_SHOT_TEXT)).toBe(true);

    for (const step of RUNS.stuck) {
      expect(step.row.length).toBeGreaterThan(1);
      expect(step.written.startsWith(STUCK_OPENING)).toBe(true);

      for (const candidate of step.row) {
        const after = `${step.written} ${candidate.text}`;
        expect(after.startsWith(STUCK_OPENING)).toBe(true);
        expect(after.length).toBeGreaterThan(step.written.length);
      }
    }
  });

  it('writes a confident, grammatical, entirely absurd sentence out of it', () => {
    const reading = finished('stuck');

    expect(reading.sentence).toBe(
      'The weather today is aubergine coloured throughout',
    );
    expect(reading.pieces.map((piece) => piece.text)).toEqual([
      'coloured',
      'throughout',
    ]);
    expect(reading.pieces[0].percent).toBe(36);
    expect(reading.pieces[1].percent).toBe(20);
  });

  it('shows no sign, anywhere in the row, that anything has gone wrong', () => {
    // Not one entry is an apology or a correction, and the top of the row is
    // worth about as much as the top of an ordinary row. From the inside there
    // is nothing to notice.
    expect(printed('stuck', 0)).toEqual([
      'coloured 36',
      'which 26',
      'and 22',
      'in 16',
    ]);
    expect(readingFor('stuck', 0).roundsToZero).toBe(false);
  });
});
