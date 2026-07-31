import { describe, expect, it } from 'vitest';

import { asPercent, HEAD_IDS } from '../shared/attention/logic';
import { SENTENCE, WORD } from '../shared/attention/sentences.en';
import {
  disagreement,
  evenShare,
  gap,
  headsWithAnOpinion,
  isFlat,
  LANE_IDS,
  LANES,
  OPENS_ON,
  readingsFor,
  widestDisagreement,
} from './logic';

const readingBy = (index: number, id: string) => {
  const reading = readingsFor(SENTENCE, index).find(
    (candidate) => candidate.id === id,
  );
  if (!reading) throw new Error(`no lane ${id}`);
  return reading;
};

/** The word a head leans on, by name rather than by index. */
const leanedOn = (index: number, id: string): string | null => {
  const { leansOn } = readingBy(index, id);
  return leansOn === null ? null : (SENTENCE[leansOn]?.text ?? null);
};

describe('the four lanes', () => {
  it('are exactly the heads the shared module ships, in its order', () => {
    // Pins the literal union in logic.ts against the shared module: a head
    // renamed there fails here rather than silently dropping a lane.
    expect([...LANE_IDS]).toEqual([...HEAD_IDS]);
    expect(LANES).toHaveLength(4);
  });
});

describe('isFlat', () => {
  it('calls an even spread flat', () => {
    expect(isFlat([0.25, 0.25, 0.25, 0.25])).toBe(true);
  });

  it('calls anything with a peak in it not flat', () => {
    expect(isFlat([0.25, 0.3, 0.25, 0.2])).toBe(false);
  });

  it('treats a word off the end of the sentence as having no opinion', () => {
    expect(isFlat([])).toBe(true);
  });
});

describe('gap', () => {
  it('is nothing between a reading and itself', () => {
    expect(gap([0.5, 0.3, 0.2], [0.5, 0.3, 0.2])).toBeCloseTo(0, 12);
  });

  it('is everything between two readings with no overlap', () => {
    expect(gap([1, 0, 0], [0, 0, 1])).toBeCloseTo(1, 12);
  });

  it('does not care which way round the two readings are given', () => {
    expect(gap([0.6, 0.4], [0.1, 0.9])).toBeCloseTo(
      gap([0.1, 0.9], [0.6, 0.4]),
      12,
    );
  });
});

describe('readingsFor', () => {
  it('gives one reading per lane, in lane order', () => {
    const readings = readingsFor(SENTENCE, WORD.she);
    expect(readings.map((reading) => reading.id)).toEqual([...LANE_IDS]);
  });

  it('spends exactly one unit of attention in every lane', () => {
    for (let index = 0; index < SENTENCE.length; index += 1) {
      for (const reading of readingsFor(SENTENCE, index)) {
        expect(reading.weights).toHaveLength(SENTENCE.length);
        expect(reading.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      }
    }
  });

  it('reports no opinion exactly when the row is flat', () => {
    for (let index = 0; index < SENTENCE.length; index += 1) {
      for (const reading of readingsFor(SENTENCE, index)) {
        expect(reading.leansOn === null).toBe(isFlat(reading.weights));
      }
    }
  });

  it('has nothing to say about a word off the end of the sentence', () => {
    for (const reading of readingsFor(SENTENCE, 99)) {
      expect(reading.weights).toEqual([]);
      expect(reading.leansOn).toBeNull();
      expect(reading.share).toBe(0);
    }
  });
});

describe('disagreement', () => {
  it('is a share of the attention, so it stays between none and all of it', () => {
    for (let index = 0; index < SENTENCE.length; index += 1) {
      expect(disagreement(SENTENCE, index)).toBeGreaterThanOrEqual(0);
      expect(disagreement(SENTENCE, index)).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic — the same word always gets the same number', () => {
    expect(disagreement(SENTENCE, WORD.she)).toBe(
      disagreement(SENTENCE, WORD.she),
    );
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number `multi-head-attention.mdx` quotes is checked here, and so is
 * every "watch this happen" the page promises, so that an edit to the shared
 * sentence, its features or the head weights fails the build instead of quietly
 * turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('has a different head speak for each word that gets an answer at all', () => {
    // The claim: a head is one question, so which head has something to say
    // depends entirely on which word you point at. The prose walks these three
    // in this order.
    expect(headsWithAnOpinion(SENTENCE, WORD.carried)).toEqual(['doer']);
    expect(headsWithAnOpinion(SENTENCE, WORD.she)).toEqual(['reference']);
    expect(headsWithAnOpinion(SENTENCE, WORD.box)).toEqual(['subject-matter']);
  });

  it('never wakes more than one of these four heads at a time', () => {
    // Honest about the staging: with four hand-written heads and four features,
    // no word in this sentence trips two of them. The unit says so, and says a
    // real layer is not like this.
    for (let index = 0; index < SENTENCE.length; index += 1) {
      expect(headsWithAnOpinion(SENTENCE, index).length).toBeLessThanOrEqual(1);
    }
  });

  it('leaves five of the nine words with no head that has anything to ask', () => {
    // "Four heads is not many" — the reason nobody ships four. Five of these
    // nine words get four identical readings, which are worth one reading.
    const silent = SENTENCE.filter(
      (_, index) => headsWithAnOpinion(SENTENCE, index).length === 0,
    ).map((token) => token.text);

    expect(silent).toEqual(['The', 'the', 'because', 'was', 'strong']);

    for (const token of silent) {
      const index = SENTENCE.findIndex((candidate) => candidate.text === token);
      expect(disagreement(SENTENCE, index)).toBeCloseTo(0, 12);
    }
  });

  it('quotes the three percentages the prose puts on the page', () => {
    expect(asPercent(readingBy(WORD.carried, 'doer').share)).toBe(40);
    expect(leanedOn(WORD.carried, 'doer')).toBe('student');

    expect(asPercent(readingBy(WORD.she, 'reference').share)).toBe(43);
    expect(leanedOn(WORD.she, 'reference')).toBe('student');

    expect(asPercent(readingBy(WORD.box, 'subject-matter').share)).toBe(22);
    expect(leanedOn(WORD.box, 'subject-matter')).toBe('carried');
  });

  it('has a head with nothing to ask spread eleven percent on every word', () => {
    // The number the readout and the prose both print for a flat row.
    expect(asPercent(evenShare(SENTENCE))).toBe(11);

    for (const reading of readingsFor(SENTENCE, WORD.she)) {
      if (reading.leansOn !== null) continue;
      for (const weight of reading.weights) {
        expect(asPercent(weight)).toBe(11);
      }
    }
  });

  it('makes "she" the word the four are furthest apart on, by 37%', () => {
    // The hunt the lead sends the reader on, and the answer the readout
    // confirms. Second place is "carried" at 31%, so the gap is not a
    // rounding accident.
    expect(widestDisagreement(SENTENCE)).toBe(WORD.she);
    expect(asPercent(disagreement(SENTENCE, WORD.she))).toBe(37);
    expect(asPercent(disagreement(SENTENCE, WORD.carried))).toBe(31);
    expect(disagreement(SENTENCE, WORD.she)).toBeGreaterThan(
      disagreement(SENTENCE, WORD.carried),
    );
  });

  it('opens on a word that wakes a head without giving the hunt away', () => {
    // The prose says "It opens on 'carried'", so the opening word is pinned —
    // and it has to be a word where something visibly happens, but not the
    // word the reader is being sent to find.
    expect(OPENS_ON).toBe(WORD.carried);
    expect(headsWithAnOpinion(SENTENCE, OPENS_ON)).toHaveLength(1);
    expect(OPENS_ON).not.toBe(widestDisagreement(SENTENCE));
  });

  it('leaves the fourth head silent on every word in the sentence', () => {
    // The loose end `positional-encoding` picks up. It is asking about
    // position, and nothing here knows where a word sits, so it is honestly
    // inert rather than quietly faked.
    for (let index = 0; index < SENTENCE.length; index += 1) {
      expect(readingBy(index, 'previous-word').leansOn).toBeNull();
    }
  });
});
