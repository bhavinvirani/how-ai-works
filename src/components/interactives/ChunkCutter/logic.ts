/**
 * Pure logic for ChunkCutter (§3.3).
 *
 * The instrument teaches one thing: a passage can be retrieved only if it says
 * what it is about. Cut a document so that a sentence is separated from the
 * heading that names its subject, and that sentence is not merely ranked low —
 * it has nothing in common with the question at all, and no setting of the
 * cutter brings it back.
 *
 * WHY A CUTTER AND NOT A DIAGRAM. "How you cut decides what can be found" is a
 * sentence every reader nods at. The instrument makes them meet the sentence,
 * see it sitting in the document, and fail to retrieve it however they set the
 * controls — and then watch one switch return it at every setting. The failure
 * is the lesson, and a failure has to be attempted before it teaches.
 *
 * THE DOCUMENT IS BUILT SO THAT THE FAILURE IS STRUCTURAL, NOT LUCK. The tender
 * sentence shares no subject with the hamper question, and the two sentences
 * that would have supplied one — the heading and the first line under it — are
 * far enough away in words that no offered piece size can reach from either to
 * it. That is why `logic.test.ts` can assert the failure at every size rather
 * than at the sizes somebody happened to try.
 *
 * HOW MATCHING IS MODELLED, AND WHAT IS HONEST ABOUT IT. Each sentence carries
 * a small set of subjects, hand-written. A sentence's position is a unit vector
 * over those subjects; a piece's position is the plain average of its
 * sentences'; the score is how close that average sits to the question's. The
 * hand-written part is the subject lists — a real system reads them out of the
 * words themselves, across thousands of dimensions rather than fifteen. What is
 * real, and the only part the unit asks the reader to carry away, is that a
 * piece has ONE position and it is an average, so a sentence about nothing the
 * question mentions cannot be pulled up by a neighbour, and a piece covering
 * five subjects sits nowhere near any of them.
 *
 * Nothing here is random and nothing reads a clock. Same document, same cuts,
 * same scores, on every visit.
 */

/** The subjects a sentence can be about. Fifteen, standing in for thousands. */
export type Topic =
  | 'approval'
  | 'booking'
  | 'buying'
  | 'cap'
  | 'clients'
  | 'entertainment'
  | 'forms'
  | 'gifts'
  | 'permission'
  | 'prohibition'
  | 'refund'
  | 'register'
  | 'suppliers'
  | 'tenders'
  | 'travel';

export type ItemId =
  | 'h2'
  | 'p1'
  | 'p2'
  | 'h3'
  | 't1'
  | 't2'
  | 't3'
  | 'h4'
  | 'e1'
  | 'e2'
  | 'e3'
  | 'h5'
  | 'g1'
  | 'g2'
  | 'g3';

export type ItemKind = 'heading' | 'body';

export interface DocItem {
  readonly id: ItemId;
  readonly kind: ItemKind;
  /** What this line is about. Never empty, never with a repeat in it. */
  readonly topics: readonly Topic[];
}

/**
 * The handbook, one line at a time, in the order it is written.
 *
 * Four sections of an ordinary internal document. Sections 2 and 3 are there to
 * be competition — a search has to be choosing between things for its choice to
 * mean anything — and section 3's hotel cap is a live distractor for the
 * question about a spending limit, because "a maximum number of pounds" is a
 * subject two sections share.
 *
 * The last line is the one the whole instrument is built around. Read it on its
 * own: it is about a prohibition during a tender, and the thing being prohibited
 * is named six lines earlier, in a heading it does not contain. Its subject list
 * says so, and that is not a trick played on it — it is what the sentence says.
 */
export const DOCUMENT: readonly DocItem[] = [
  { id: 'h2', kind: 'heading', topics: ['suppliers', 'buying'] },
  { id: 'p1', kind: 'body', topics: ['buying', 'approval', 'forms'] },
  { id: 'p2', kind: 'body', topics: ['suppliers', 'buying', 'prohibition'] },

  { id: 'h3', kind: 'heading', topics: ['travel'] },
  { id: 't1', kind: 'body', topics: ['travel', 'booking', 'refund'] },
  { id: 't2', kind: 'body', topics: ['booking', 'approval'] },
  { id: 't3', kind: 'body', topics: ['travel', 'cap'] },

  { id: 'h4', kind: 'heading', topics: ['entertainment', 'clients'] },
  { id: 'e1', kind: 'body', topics: ['entertainment', 'clients', 'forms'] },
  { id: 'e2', kind: 'body', topics: ['cap'] },
  { id: 'e3', kind: 'body', topics: ['cap', 'refund'] },

  { id: 'h5', kind: 'heading', topics: ['gifts', 'suppliers'] },
  { id: 'g1', kind: 'body', topics: ['gifts', 'suppliers', 'permission'] },
  { id: 'g2', kind: 'body', topics: ['register', 'cap', 'forms'] },
  { id: 'g3', kind: 'body', topics: ['prohibition', 'tenders', 'approval'] },
];

const BY_ID = new Map<ItemId, DocItem>(
  DOCUMENT.map((item) => [item.id, item] as const),
);

export function itemById(id: ItemId): DocItem {
  const found = BY_ID.get(id);
  if (found === undefined) throw new Error(`no line called ${id}`);
  return found;
}

/**
 * The lines as written. Supplied by the caller rather than held here, for the
 * same reason as SpotTheFabrication: logic never holds prose, and the piece
 * sizes have to be measured against the text a reader can actually see.
 */
export type DocTexts = Readonly<Record<ItemId, string>>;

/** Length the way a person counts it, and the way the cutter budgets it. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

/**
 * The range of piece sizes on offer.
 *
 * The top of it is load-bearing. Section 5 runs to sixty-six words from its
 * heading to the tender sentence, and to sixty from the line that names the
 * subject; at fifty-five neither can reach it, which is what makes the failure
 * a property of the document rather than of the settings somebody tried. Real
 * sections are far longer than real pieces, which is the same fact at a
 * different scale — if a piece could hold a whole section nobody would be
 * cutting anything up.
 */
export const MIN_PIECE = 20;
export const MAX_PIECE = 55;
export const PIECE_STEP = 5;

export const PIECE_SIZES: readonly number[] = Array.from(
  { length: (MAX_PIECE - MIN_PIECE) / PIECE_STEP + 1 },
  (_, index) => MIN_PIECE + index * PIECE_STEP,
);

export function clampPieceSize(words: number): number {
  const stepped =
    Math.round((words - MIN_PIECE) / PIECE_STEP) * PIECE_STEP + MIN_PIECE;
  return Math.min(MAX_PIECE, Math.max(MIN_PIECE, stepped));
}

export interface CutOptions {
  /** How many words a piece may hold before the cutter starts a new one. */
  readonly maxWords: number;
  /** Repeat the last line of each piece at the top of the next one. */
  readonly overlap: boolean;
  /** Put the section heading at the top of every piece in that section. */
  readonly carryHeading: boolean;
}

/**
 * Why a line is in a piece: because the cut put it there, because it was
 * repeated across a boundary, or because the heading was stamped on.
 *
 * Kept on every line so the panel can label the two additions rather than let
 * them appear as text that mysteriously turned up twice.
 */
export type ItemRole = 'own' | 'repeated' | 'carried';

export interface PieceItem {
  readonly id: ItemId;
  readonly role: ItemRole;
}

export interface Piece {
  readonly items: readonly PieceItem[];
  /** Words the cutter counted — its own lines, not the two kinds of addition. */
  readonly words: number;
}

/** The most recent heading at or before this line. */
function governingHeading(index: number): DocItem | null {
  for (let step = index; step >= 0; step -= 1) {
    const item = DOCUMENT[step];
    if (item.kind === 'heading') return item;
  }
  return null;
}

/**
 * Cuts the document into pieces.
 *
 * The rule is the ordinary one: walk the lines in order, keep adding until the
 * next one would take the piece over its size, then start again. Two details
 * are deliberate.
 *
 * A piece is never allowed to be a heading on its own, because a splitter that
 * respects structure at all keeps a heading with what it introduces — and
 * letting headings float alone would hand the instrument a cheap way to fail
 * that has nothing to do with the point.
 *
 * The repeated line and the stamped heading are added after the sizes are
 * settled, not before, so that turning either switch on changes what the pieces
 * SAY without moving a single cut. That is also how it is done in practice, and
 * it is the only way the reader can compare one setting against another.
 */
export function cut(options: CutOptions, texts: DocTexts): Piece[] {
  const maxWords = clampPieceSize(options.maxWords);
  const pieces: Piece[] = [];

  let index = 0;
  let previousLast: ItemId | null = null;

  while (index < DOCUMENT.length) {
    const start = index;
    const own: DocItem[] = [];
    let used = 0;

    while (index < DOCUMENT.length) {
      const item = DOCUMENT[index];
      const words = countWords(texts[item.id]);
      const headingsOnly = own.every((taken) => taken.kind === 'heading');

      if (own.length > 0 && !headingsOnly && used + words > maxWords) break;

      own.push(item);
      used += words;
      index += 1;
    }

    const items: PieceItem[] = own.map((item) => ({
      id: item.id,
      role: 'own' as const,
    }));

    if (options.overlap && previousLast !== null) {
      items.unshift({ id: previousLast, role: 'repeated' });
    }

    if (options.carryHeading) {
      const heading = governingHeading(start);
      if (heading !== null && !items.some((entry) => entry.id === heading.id)) {
        items.unshift({ id: heading.id, role: 'carried' });
      }
    }

    pieces.push({ items, words: used });
    previousLast = own[own.length - 1].id;
  }

  return pieces;
}

/**
 * How close two positions on the map are.
 *
 * Each subject list becomes a unit vector — every subject it names gets the
 * same share, and the shares are scaled so the whole thing has length one — and
 * this is the dot product of two of them. Two identical lists give 1, two lists
 * with nothing in common give 0, and a list naming five subjects contributes
 * less per shared subject than one naming two. That last property is the whole
 * of dilution, and it falls out of the arithmetic rather than being imposed.
 */
export function similarity(
  left: readonly Topic[],
  right: readonly Topic[],
): number {
  if (left.length === 0 || right.length === 0) return 0;

  const shared = left.filter((topic) => right.includes(topic)).length;
  return shared / (Math.sqrt(left.length) * Math.sqrt(right.length));
}

/**
 * A piece's own position is the average of its lines' positions — which is
 * exactly what a real system stores for a passage, and exactly why a piece
 * about several things sits close to none of them.
 */
export function pieceScore(piece: Piece, topics: readonly Topic[]): number {
  if (piece.items.length === 0) return 0;

  const total = piece.items.reduce(
    (sum, entry) => sum + similarity(itemById(entry.id).topics, topics),
    0,
  );

  return total / piece.items.length;
}

export type QuestionId = 'dinner' | 'hamper';

export interface Question {
  readonly id: QuestionId;
  readonly topics: readonly Topic[];
  /** The lines that have to come back for the answer to be right. */
  readonly needs: readonly ItemId[];
}

export const QUESTIONS: readonly Question[] = [
  {
    id: 'dinner',
    topics: ['entertainment', 'clients', 'cap'],
    needs: ['e2', 'e3'],
  },
  {
    id: 'hamper',
    topics: ['gifts', 'suppliers', 'permission'],
    needs: ['g3'],
  },
];

export function questionById(id: QuestionId): Question {
  const found = QUESTIONS.find((question) => question.id === id);
  if (found === undefined) throw new Error(`no question called ${id}`);
  return found;
}

/** How many pieces the search hands over. Small, and real systems are too. */
export const MAX_RESULTS = 3;

/**
 * Below this, a piece has nothing whatever in common with the question, and is
 * not returned at all however short the list is. Not a tuning knob — it is the
 * difference between "ranked last" and "not an answer to this question", and
 * the tender sentence sits on the wrong side of it at every setting.
 */
const NOTHING_IN_COMMON = 1e-9;

export interface ScoredPiece {
  readonly piece: Piece;
  /** Position in the document, from 0. */
  readonly order: number;
  readonly score: number;
  /** 1 for the closest piece returned, null when it was not returned. */
  readonly rank: number | null;
}

export interface SearchOutcome {
  /** Every piece, in document order. */
  readonly pieces: readonly ScoredPiece[];
  /** The pieces handed over, closest first. */
  readonly returned: readonly ScoredPiece[];
  readonly found: readonly ItemId[];
  readonly missing: readonly ItemId[];
}

export function search(
  questionId: QuestionId,
  options: CutOptions,
  texts: DocTexts,
): SearchOutcome {
  const question = questionById(questionId);
  const pieces = cut(options, texts);

  const scored = pieces.map((piece, order) => ({
    piece,
    order,
    score: pieceScore(piece, question.topics),
  }));

  const ranked = [...scored]
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .filter((entry) => entry.score > NOTHING_IN_COMMON)
    .slice(0, MAX_RESULTS);

  const rankByOrder = new Map<number, number>(
    ranked.map((entry, position) => [entry.order, position + 1] as const),
  );

  const withRank: ScoredPiece[] = scored.map((entry) => ({
    ...entry,
    rank: rankByOrder.get(entry.order) ?? null,
  }));

  const handedOver = new Set<ItemId>(
    ranked.flatMap((entry) => entry.piece.items.map((item) => item.id)),
  );

  return {
    pieces: withRank,
    returned: ranked.map((entry) => withRank[entry.order]),
    found: question.needs.filter((id) => handedOver.has(id)),
    missing: question.needs.filter((id) => !handedOver.has(id)),
  };
}

/**
 * The piece a line actually lives in — the one the cut put it in, not one it
 * was repeated into.
 *
 * The readout needs this to say what the piece holding the answer scored, which
 * is the number the whole instrument turns on: 0.00 means the search was never
 * choosing against it.
 */
export function pieceOwning(
  outcome: SearchOutcome,
  id: ItemId,
): ScoredPiece | null {
  return (
    outcome.pieces.find((entry) =>
      entry.piece.items.some((item) => item.id === id && item.role === 'own'),
    ) ?? null
  );
}
