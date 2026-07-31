/**
 * Pure logic for TokenSplitter (§3.3).
 *
 * The instrument teaches one thing: a model does not read letters and does not
 * read words. It reads chunks from a list that was fixed before training began,
 * so what a piece of text costs is not how long it looks — it is how well the
 * list happens to fit it.
 *
 * THIS IS A REAL TOKENIZER, JUST A TINY ONE. The algorithm below is the one
 * that builds real vocabularies: start from single bytes, then repeatedly glue
 * together whichever pair of neighbouring pieces turns up together most often.
 * Each glueing is a "merge", and the merges are applied in the order they were
 * learned. A production vocabulary is that loop run about a hundred thousand
 * times over a mountain of text. `MERGES` below is the same loop run
 * forty-eight times, written out by hand so that a reader can look at the whole
 * list and see what it is.
 *
 * It imitates no particular model, and there are no token ids here — an id is
 * a row number in somebody else's list, and quoting one would be quoting a
 * fact this file has no way to check.
 *
 * Nothing is random and nothing is timed. The same text always cuts the same
 * way, which is what lets the prose, the ThreeWaysToCut diagram and the tests
 * quote the same counts.
 */

/**
 * The list, in the order it was built.
 *
 * Read it top to bottom and you are reading the order of frequency: the pairs
 * at the top are the ones English cannot go three words without, and the ones
 * at the bottom are long enough to be words in their own right. That ordering
 * is not decoration — a merge near the top is applied before a merge near the
 * bottom, which is how "understanding" ends up as three familiar chunks rather
 * than as thirteen letters.
 */
export const MERGES: readonly (readonly [string, string])[] = [
  // The letter pairs English reaches for constantly.
  ['t', 'h'], // th
  ['i', 'n'], // in
  ['e', 'r'], // er
  ['a', 'n'], // an
  ['o', 'n'], // on
  ['e', 'n'], // en
  ['a', 't'], // at
  ['e', 's'], // es
  ['o', 'r'], // or
  ['e', 'd'], // ed
  ['i', 's'], // is
  ['i', 't'], // it
  ['o', 'f'], // of
  ['t', 'o'], // to
  ['a', 'r'], // ar
  ['s', 't'], // st
  ['a', 'l'], // al
  ['l', 'e'], // le
  ['r', 'e'], // re
  ['o', 'u'], // ou
  ['a', 's'], // as
  ['o', 't'], // ot
  ['u', 't'], // ut
  ['l', 'l'], // ll

  // Glued once more, several of those become whole words.
  ['th', 'e'], // the
  ['an', 'd'], // and
  ['w', 'as'], // was
  ['f', 'or'], // for
  ['th', 'at'], // that
  ['th', 'is'], // this
  ['n', 'ot'], // not
  ['b', 'ut'], // but
  ['y', 'ou'], // you
  ['a', 'll'], // all
  ['i', 'th'], // ith
  ['w', 'ith'], // with

  // The endings that turn up on the end of thousands of different words.
  ['in', 'g'], // ing
  ['l', 'y'], // ly
  ['e', 'st'], // est
  ['m', 'en'], // men
  ['men', 't'], // ment
  ['t', 'i'], // ti
  ['ti', 'on'], // tion

  // The beginnings, and one stem long enough to survive on its own.
  ['u', 'n'], // un
  ['d', 'is'], // dis
  ['d', 'er'], // der
  ['un', 'der'], // under
  ['st', 'and'], // stand
];

/** How much text the panel will cut up at once. Long enough for a sentence. */
export const MAX_LENGTH = 120;

/**
 * A byte the list has never met is held as a character well out of the way of
 * the ones it has, so that every piece is still an ordinary string and the
 * merge loop never has to know the difference.
 */
const RAW_OFFSET = 0x100;

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const RANKS: ReadonlyMap<string, number> = new Map(
  MERGES.map(([left, right], rank) => [`${left} ${right}`, rank]),
);

export interface Piece {
  /**
   * The whitespace that travels in front of this piece. A real tokenizer folds
   * the space into the piece itself — " the" and "the" are different entries —
   * and carrying it here keeps that true without doubling the list.
   */
  readonly lead: string;
  /** The piece itself. Ordinary characters, unless `raw`. */
  readonly token: string;
  /**
   * True when this piece is a single raw byte of a character that never made it
   * into the list. This is the whole of the cost story for languages the list
   * was not built from.
   */
  readonly raw: boolean;
}

/** Text becomes bytes first, because that is what the list is made of. */
function toSymbols(text: string): string[] {
  const symbols: string[] = [];

  for (const byte of ENCODER.encode(text)) {
    symbols.push(String.fromCharCode(byte < 0x80 ? byte : RAW_OFFSET + byte));
  }

  return symbols;
}

/**
 * The merge loop, and the only clever thing in this file.
 *
 * Repeatedly find the pair of neighbours that was glued earliest — that is,
 * most often — and glue every occurrence of it. Stop when no pair left in the
 * sequence is on the list. Because it always merges the earliest-learned pair
 * available, the result does not depend on where in the word you start looking.
 */
function applyMerges(symbols: readonly string[]): string[] {
  let current = [...symbols];

  for (;;) {
    let bestRank = Number.POSITIVE_INFINITY;
    let bestLeft = '';
    let bestRight = '';

    for (let index = 0; index + 1 < current.length; index += 1) {
      const rank = RANKS.get(`${current[index]} ${current[index + 1]}`);

      if (rank !== undefined && rank < bestRank) {
        bestRank = rank;
        bestLeft = current[index];
        bestRight = current[index + 1];
      }
    }

    if (bestRank === Number.POSITIVE_INFINITY) return current;

    const next: string[] = [];
    let index = 0;

    while (index < current.length) {
      if (
        index + 1 < current.length &&
        current[index] === bestLeft &&
        current[index + 1] === bestRight
      ) {
        next.push(bestLeft + bestRight);
        index += 2;
      } else {
        next.push(current[index]);
        index += 1;
      }
    }

    // Every round glues at least one pair, so the sequence gets shorter every
    // time and this cannot run away.
    current = next;
  }
}

/**
 * Splits the text into runs of "the spaces in front of a word, then the word".
 *
 * Merges never reach across a space, which is both what real tokenizers do and
 * what keeps the list short: without it, every common word would need a second
 * entry for its spaced version.
 */
function segments(text: string): string[] {
  return text.match(/\s*\S+|\s+/g) ?? [];
}

/** Cuts text into the pieces this list allows. The whole instrument. */
export function tokenize(text: string): Piece[] {
  const pieces: Piece[] = [];

  for (const segment of segments(text)) {
    const body = segment.replace(/^\s+/, '');
    const lead = segment.slice(0, segment.length - body.length);

    // A run of trailing whitespace with no word after it. It still costs a
    // piece, which is a small true thing worth not hiding.
    if (body === '') {
      pieces.push({ lead, token: '', raw: false });
      continue;
    }

    applyMerges(toSymbols(body)).forEach((token, index) => {
      pieces.push({
        lead: index === 0 ? lead : '',
        token,
        raw: token.length === 1 && token.charCodeAt(0) >= RAW_OFFSET,
      });
    });
  }

  return pieces;
}

/**
 * Puts the pieces back together.
 *
 * This exists to be tested rather than to be called: getting the original text
 * back, exactly, for any input at all, is what "nothing is ever unknown" means
 * in arithmetic. A word-based scheme cannot pass this test, which is the reason
 * nobody uses one.
 */
export function decode(pieces: readonly Piece[]): string {
  const bytes: number[] = [];

  for (const piece of pieces) {
    const symbols = `${piece.lead}${piece.token}`;

    for (let index = 0; index < symbols.length; index += 1) {
      const code = symbols.charCodeAt(index);
      bytes.push(code >= RAW_OFFSET ? code - RAW_OFFSET : code);
    }
  }

  return DECODER.decode(new Uint8Array(bytes));
}

/**
 * What to print on a piece.
 *
 * A raw byte has no characters to show — it is a third of a letter in some
 * other alphabet — so it is printed as the number it is, in the base computers
 * count in. Looking like machinery is the correct impression here.
 */
export function readable(piece: Piece): string {
  if (!piece.raw) return piece.token;

  return (piece.token.charCodeAt(0) - RAW_OFFSET)
    .toString(16)
    .toUpperCase()
    .padStart(2, '0');
}

export interface Split {
  readonly pieces: readonly Piece[];
  /** Characters as a person counts them, so one letter is one, always. */
  readonly characters: number;
  readonly words: number;
  /** Characters the list has no entry for at any size. */
  readonly unlistedCharacters: number;
  /** How many pieces those characters cost between them. */
  readonly rawPieces: number;
  readonly charactersPerPiece: number;
}

export function split(text: string): Split {
  const pieces = tokenize(text);
  const characters = Array.from(text).length;
  const trimmed = text.trim();

  const unlistedCharacters = Array.from(text).filter(
    (character) => (character.codePointAt(0) ?? 0) >= 0x80,
  ).length;

  return {
    pieces,
    characters,
    words: trimmed === '' ? 0 : trimmed.split(/\s+/).length,
    unlistedCharacters,
    rawPieces: pieces.filter((piece) => piece.raw).length,
    charactersPerPiece: pieces.length === 0 ? 0 : characters / pieces.length,
  };
}

/** The pieces of a string, as plain text. A convenience for tests and prose. */
export function pieces(text: string): string[] {
  return tokenize(text).map((piece) => `${piece.lead}${readable(piece)}`);
}
