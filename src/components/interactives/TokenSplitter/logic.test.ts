import { describe, expect, it } from 'vitest';

import { PRESETS } from './data.en';
import {
  decode,
  MAX_LENGTH,
  MERGES,
  pieces,
  readable,
  split,
  tokenize,
} from './logic';

/** Everything a reader might reasonably throw at the box, and then some. */
const AWKWARD = [
  '',
  '   ',
  'the',
  ' the',
  'the ',
  'Kowalczyk',
  'order 4417290385',
  'café',
  'नमस्ते',
  'Ελλάδα',
  'ありがとう',
  'a 🙂 b',
];

describe('the list', () => {
  it('is small enough to read in one sitting', () => {
    expect(MERGES.length).toBe(48);
  });

  it('only ever glues together pieces it already had', () => {
    const available = new Set<string>();

    for (const [left, right] of MERGES) {
      // A single character is always available: that is where every
      // tokenizer starts, and it is why nothing can ever be unknown.
      expect(left.length === 1 || available.has(left)).toBe(true);
      expect(right.length === 1 || available.has(right)).toBe(true);

      available.add(left + right);
    }
  });

  it('cuts up a sentence rather than a paragraph', () => {
    expect(MAX_LENGTH).toBe(120);
  });
});

describe('tokenize', () => {
  it('has nothing to cut in an empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  it('gives a common short word a single piece', () => {
    for (const word of ['the', 'and', 'that', 'not', 'with', 'for', 'you']) {
      expect(pieces(word)).toEqual([word]);
    }
  });

  it('hands the space in front of a word to that word', () => {
    const [first] = tokenize(' the');

    expect(first.lead).toBe(' ');
    expect(first.token).toBe('the');
    expect(tokenize(' the')).toHaveLength(1);
  });

  it('never glues across a space', () => {
    // "to" and "the" are both single pieces; "to the" is never one piece.
    expect(pieces('to')).toEqual(['to']);
    expect(pieces('to the')).toEqual(['to', ' the']);
  });

  it('charges for a trailing space, because something has to hold it', () => {
    expect(tokenize('the ')).toHaveLength(2);
  });

  it('is deterministic — the same text always cuts the same way', () => {
    for (const sample of AWKWARD) {
      expect(pieces(sample)).toEqual(pieces(sample));
    }
  });
});

describe('readable', () => {
  it('prints an ordinary piece as itself', () => {
    const [first] = tokenize('understanding');

    expect(readable(first)).toBe('under');
  });

  it('prints a piece with no letters in it as the number it is', () => {
    const raw = tokenize('café').filter((piece) => piece.raw);

    expect(raw).toHaveLength(2);
    expect(raw.map(readable)).toEqual(['C3', 'A9']);
  });
});

describe('split', () => {
  it('counts characters the way a person does', () => {
    expect(split('a 🙂 b').characters).toBe(5);
  });

  it('counts words by the gaps between them', () => {
    expect(split('the letter was not for you').words).toBe(6);
    expect(split('   ').words).toBe(0);
  });

  it('has no opinion about an empty box', () => {
    expect(split('').charactersPerPiece).toBe(0);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every count the page quotes is checked here, so an edit to the merge list
 * fails the build instead of quietly turning the surrounding paragraphs — and
 * the ThreeWaysToCut diagram, which is drawn by hand from these same numbers —
 * into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('reads a long familiar word as three familiar chunks, not as letters', () => {
    expect('understanding'.length).toBe(13);
    expect(pieces('understanding')).toEqual(['under', 'stand', 'ing']);
  });

  it('spends more pieces on a short rare name than on a long common word', () => {
    expect('Kowalczyk'.length).toBe(9);
    expect(pieces('Kowalczyk')).toEqual([
      'K',
      'o',
      'w',
      'al',
      'c',
      'z',
      'y',
      'k',
    ]);

    // Four letters shorter, and it costs nearly three times as much.
    expect('Kowalczyk'.length).toBeLessThan('understanding'.length);
    expect(tokenize('Kowalczyk').length).toBeGreaterThan(
      tokenize('understanding').length * 2,
    );
  });

  it('never meets anything it cannot spell, in any alphabet', () => {
    for (const sample of AWKWARD) {
      expect(decode(tokenize(sample))).toBe(sample);
    }
  });

  it('bills by the piece, and neither words nor characters predict that', () => {
    const english = split(PRESETS.english.text);
    const name = split(PRESETS.name.text);

    expect([english.characters, english.words, english.pieces.length]).toEqual([
      26, 6, 9,
    ]);
    expect([name.characters, name.words, name.pieces.length]).toEqual([
      22, 4, 14,
    ]);

    // Shorter to read and fewer words, and it costs half as much again.
    expect(name.characters).toBeLessThan(english.characters);
    expect(name.words).toBeLessThan(english.words);
    expect(name.pieces.length).toBeGreaterThan(english.pieces.length);
  });

  it('hides the letters of a word inside chunks that span them', () => {
    const chunks = pieces('embarrassment');

    expect('embarrassment'.length).toBe(13);
    expect(chunks).toHaveLength(8);

    // Both r's and both s's survive, but never as something a counter could
    // count: each pair is split across two pieces, and one of each pair is
    // welded to a letter beside it.
    expect(chunks.filter((chunk) => chunk.includes('r'))).toEqual(['ar', 'r']);
    expect(chunks.filter((chunk) => chunk.includes('s'))).toEqual(['as', 's']);
  });

  it('gives every digit a piece of its own', () => {
    expect(pieces('4417290385')).toEqual([
      '4',
      '4',
      '1',
      '7',
      '2',
      '9',
      '0',
      '3',
      '8',
      '5',
    ]);

    const numbered = split(PRESETS.number.text);
    expect([numbered.characters, numbered.pieces.length]).toEqual([16, 12]);
  });

  it('charges several times over for a language the list was not built from', () => {
    const greeting = split('नमस्ते');
    const english = split(PRESETS.english.text);

    expect([greeting.characters, greeting.pieces.length]).toEqual([6, 18]);

    // Not one of those eighteen pieces is a letter. They are the raw numbers
    // the characters are stored as, three to a character.
    expect(greeting.rawPieces).toBe(18);
    expect(greeting.unlistedCharacters).toBe(6);
    expect(pieces('नमस्ते').slice(0, 2)).toEqual(['E0', 'A4']);

    expect(english.charactersPerPiece).toBeGreaterThan(
      greeting.charactersPerPiece * 5,
    );
  });

  it('puts both of those next to each other in one box', () => {
    const mixed = split(PRESETS.other.text);

    expect([mixed.characters, mixed.pieces.length]).toEqual([12, 22]);

    // "hello" is five characters and four pieces. The greeting beside it is
    // one character longer and costs eighteen.
    expect(split('hello').pieces).toHaveLength(4);
    expect(mixed.rawPieces).toBe(18);
  });

  it('was built commonest-pair-first, which is why "under" exists at all', () => {
    expect(MERGES.slice(0, 4)).toEqual([
      ['t', 'h'],
      ['i', 'n'],
      ['e', 'r'],
      ['a', 'n'],
    ]);
    expect(MERGES.slice(-2)).toEqual([
      ['un', 'der'],
      ['st', 'and'],
    ]);
  });
});
