import { describe, expect, it } from 'vitest';

import {
  attentionMatrix,
  attentionRow,
  blend,
  FEATURES,
  HEAD_IDS,
  HEADS,
  sameBlend,
  softmax,
  strongestSource,
} from './logic';
import { SENTENCE, SHUFFLED_ORDER, WORD } from './sentences.en';

const headBy = (id: string) => {
  const head = HEADS.find((candidate) => candidate.id === id);
  if (!head) throw new Error(`no head ${id}`);
  return head;
};

const reference = headBy('reference');
const doer = headBy('doer');
const subjectMatter = headBy('subject-matter');
const previousWord = headBy('previous-word');

describe('softmax', () => {
  it('has nothing to say about an empty row', () => {
    expect(softmax([])).toEqual([]);
  });

  it('turns any row of scores into shares that sum to one', () => {
    for (const row of [
      [0, 0, 0],
      [1, 2, 3],
      [-5, 40, 0.5],
    ]) {
      const shares = softmax(row);
      expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      expect(shares.every((share) => share >= 0)).toBe(true);
    }
  });

  it('keeps the ranking of the scores it was given', () => {
    expect(softmax([1, 3, 2])).toEqual([
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    ]);
    const [a, b, c] = softmax([1, 3, 2]);
    expect(b).toBeGreaterThan(c);
    expect(c).toBeGreaterThan(a);
  });

  it('survives a score large enough to overflow a naive exp', () => {
    const shares = softmax([1000, 999, 1]);
    expect(shares.every(Number.isFinite)).toBe(true);
    expect(shares.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('is unchanged by shifting every score by the same amount', () => {
    const plain = softmax([0.2, 1.4, -0.6]);
    const shifted = softmax([10.2, 11.4, 9.4]);
    plain.forEach((share, i) => {
      expect(share).toBeCloseTo(shifted[i], 12);
    });
  });
});

describe('the heads', () => {
  it('are four, each with its own name', () => {
    expect(HEADS).toHaveLength(4);
    expect(new Set(HEAD_IDS).size).toBe(4);
  });

  it('gives every word a row that spends exactly one unit of attention', () => {
    for (const head of HEADS) {
      for (const positional of [false, true]) {
        for (const row of attentionMatrix(SENTENCE, head, { positional })) {
          expect(row).toHaveLength(SENTENCE.length);
          expect(row.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
        }
      }
    }
  });

  it('is deterministic — the same word always gets the same row', () => {
    const once = attentionRow(SENTENCE, WORD.she, reference);
    const twice = attentionRow(SENTENCE, WORD.she, reference);
    expect(once).toEqual(twice);
  });

  it('has nothing to say about a word off the end of the sentence', () => {
    expect(attentionRow(SENTENCE, 99, reference)).toEqual([]);
  });
});

describe('a word with nothing to ask with', () => {
  it('spreads its attention evenly over the whole sentence', () => {
    // "because" carries no features, so every score it produces is zero and
    // softmax hands back a flat row. This is not a bug being tolerated — it is
    // how a reader learns the weights are computed rather than assigned.
    const row = attentionRow(SENTENCE, 5, reference);
    const even = 1 / SENTENCE.length;
    for (const weight of row) expect(weight).toBeCloseTo(even, 12);
  });
});

/**
 * The claims the three instruments and their prose actually make.
 *
 * Pinned as arithmetic so that an edit to the sentence, the features or the
 * head weights fails the build instead of quietly turning three units'
 * paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('has the pronoun lean hardest on the person it stands for', () => {
    // `attention`'s central claim: "she" rebuilds its meaning mostly out of
    // "student", and it worked that out from content alone.
    expect(strongestSource(SENTENCE, WORD.she, reference)).toBe(WORD.student);
  });

  it('leaves the pronoun leaning on the person more than on the object', () => {
    const row = attentionRow(SENTENCE, WORD.she, reference);
    expect(row[WORD.student]).toBeGreaterThan(row[WORD.box] * 2);
  });

  it('has the action lean on whoever performed it', () => {
    expect(strongestSource(SENTENCE, WORD.carried, doer)).toBe(WORD.student);
  });

  it('has the object lean on what happened to it', () => {
    expect(strongestSource(SENTENCE, WORD.box, subjectMatter)).toBe(
      WORD.carried,
    );
  });

  it('has different heads reach different answers about the same word', () => {
    // `multi-head-attention`'s claim: one round of attention tracks one kind of
    // relationship, so the heads have to disagree or there is no reason to run
    // more than one.
    const answers = new Set(
      HEADS.map((head) =>
        strongestSource(SENTENCE, WORD.carried, head, {
          positional: true,
        }),
      ),
    );
    expect(answers.size).toBeGreaterThan(1);
  });

  it('cannot tell the sentence from the same words shuffled', () => {
    // `positional-encoding`'s claim, and the reason it exists. Every word
    // computes exactly the same meaning in both arrangements — not nearly the
    // same, the same — because nothing in the arithmetic can see order.
    const shuffled = SHUFFLED_ORDER.map((from) => SENTENCE[from]);

    for (const head of HEADS) {
      for (const [shuffledIndex, originalIndex] of SHUFFLED_ORDER.entries()) {
        expect(
          sameBlend(
            blend(SENTENCE, originalIndex, head),
            blend(shuffled, shuffledIndex, head),
          ),
        ).toBe(true);
      }
    }
  });

  it('can tell them apart the moment position is stamped in', () => {
    const shuffled = SHUFFLED_ORDER.map((from) => SENTENCE[from]);
    const differing = SHUFFLED_ORDER.filter(
      (originalIndex, shuffledIndex) =>
        !sameBlend(
          blend(SENTENCE, originalIndex, reference, { positional: true }),
          blend(shuffled, shuffledIndex, reference, { positional: true }),
        ),
    );

    expect(differing.length).toBeGreaterThan(0);
  });

  it('has a head that is useless until position arrives', () => {
    // The honest fourth head. With no position it has no content rules to fall
    // back on, so it spreads evenly; with position it locks onto the word
    // before. Being visibly dead is the teaching.
    const flat = attentionRow(SENTENCE, WORD.box, previousWord);
    const even = 1 / SENTENCE.length;
    for (const weight of flat) expect(weight).toBeCloseTo(even, 12);

    expect(
      strongestSource(SENTENCE, WORD.box, previousWord, { positional: true }),
    ).toBe(WORD.box - 1);
  });

  it('rebuilds the pronoun as something more animate than it arrived', () => {
    // What attention is FOR: "she" arrives carrying only "I am a pronoun" and
    // leaves carrying a share of what "student" means.
    const before = SENTENCE[WORD.she].features;
    const after = blend(SENTENCE, WORD.she, reference);

    expect(before.animate ?? 0).toBe(0);
    expect(after.animate).toBeGreaterThan(0.3);
  });

  it('keeps every blended feature within the range the words supplied', () => {
    // A weighted average of the words present can never invent a value larger
    // than the largest one it mixed. Guards against a future edit turning the
    // blend into something that is not an average.
    for (const head of HEADS) {
      for (let index = 0; index < SENTENCE.length; index += 1) {
        const mixed = blend(SENTENCE, index, head);
        for (const feature of FEATURES) {
          const largest = Math.max(
            ...SENTENCE.map((token) => token.features[feature] ?? 0),
          );
          expect(mixed[feature]).toBeGreaterThanOrEqual(0);
          expect(mixed[feature]).toBeLessThanOrEqual(largest + 1e-12);
        }
      }
    }
  });
});
