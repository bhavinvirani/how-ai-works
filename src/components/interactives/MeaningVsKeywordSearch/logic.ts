/**
 * Pure logic for MeaningVsKeywordSearch (§3.3).
 *
 * The instrument teaches one thing: meaning-search and keyword-search fail on
 * opposite questions, so neither is the answer and both together are.
 *
 * BOTH HALVES IN ONE PANEL, ON THE SAME SHELF. Split across two instruments the
 * lesson does not land — the reader takes "meaning search is clever" from the
 * first and "keyword search is clever" from the second and never meets the
 * swap. Here it is eight passages, four questions, and a scoreboard that comes
 * out 2–4, 2–4, 4–4. That last line is the unit.
 *
 * WHAT IS REAL AND WHAT IS TYPED IN. The keyword half is genuine arithmetic
 * over the actual words of the actual passages: tokenise, intersect, weight
 * each shared term by how rare it is on the shelf. Nothing about it is staged,
 * which is what lets `logic.test.ts` prove — rather than assert — that the
 * passage answering "why does it keep refusing my password?" shares not one
 * word with it. The meaning scores are typed in by hand, because no model can
 * run in a static page. They are written to behave the way measured systems
 * behave, and the unit says so out loud rather than pretending otherwise.
 *
 * THE TWO ERROR PAGES ARE ONE HUNDREDTH APART ON PURPOSE. That is the honest
 * way to write down "it cannot tell them apart": not a wrong answer, a coin
 * flip. Widening the gap would turn a structural failure into a tuning problem
 * and teach the wrong thing.
 *
 * Nothing here is random and nothing reads a clock. Same shelf, same four
 * questions, same rankings, on every visit.
 */

export type PassageId =
  | 'lockout'
  | 'bulk-import'
  | 'err-4102'
  | 'err-4120'
  | 'refunds'
  | 'rate-limit'
  | 'depot'
  | 'firmware';

/**
 * Declaration order is shelf order, and it is also the tie-break order for
 * every ranking, so it is written down once here and never re-sorted.
 */
export const PASSAGE_IDS: readonly PassageId[] = [
  'lockout',
  'bulk-import',
  'err-4102',
  'err-4120',
  'refunds',
  'rate-limit',
  'depot',
  'firmware',
];

export type QueryId = 'password' | 'refund' | 'code' | 'name';

/**
 * Two questions asked in ordinary words, then two exact strings. The order
 * matters: meaning-search wins the first two outright, and a reader who has
 * just watched it win is the only reader for whom the third is a surprise.
 */
export const QUERY_IDS: readonly QueryId[] = [
  'password',
  'refund',
  'code',
  'name',
];

/**
 * The one passage on the shelf that actually answers each question.
 *
 * Judged by a person, once, and then treated as fact — which is exactly what a
 * retrieval evaluation set is. There is no way to compute this, and any system
 * claiming to have computed it is scoring itself.
 */
export const ANSWER: Record<QueryId, PassageId> = {
  password: 'lockout',
  refund: 'refunds',
  code: 'err-4102',
  name: 'depot',
};

/** The passages, as written. Supplied by the caller so logic never holds prose. */
export type PassageTexts = Readonly<Record<PassageId, string>>;

/** The questions, as typed. Same reason. */
export type QueryTexts = Readonly<Record<QueryId, string>>;

/**
 * How near each passage lands to each question once both are positions.
 *
 * HAND-WRITTEN, and the unit says so. A page cannot run an embedding model, so
 * these stand in for what one would report — on the usual scale where 1 is the
 * same text twice and 0 is nothing in common.
 *
 * Three properties are load-bearing, and `logic.test.ts` holds all three:
 *
 *   - The right passage is comfortably first for both ordinary questions.
 *   - `err-4120` beats `err-4102` for a question about E-4102, by 0.01. Two
 *     strings of the same shape, used in the same kind of sentence, land in the
 *     same place; which of them comes out on top is noise.
 *   - Every score for `name` sits between 0.15 and 0.26. A name the model has
 *     no company for produces no signal at all, and a flat column is what that
 *     looks like from outside.
 */
export const MEANING: Record<QueryId, Record<PassageId, number>> = {
  password: {
    lockout: 0.81,
    'bulk-import': 0.33,
    'err-4102': 0.22,
    'err-4120': 0.24,
    refunds: 0.12,
    'rate-limit': 0.31,
    depot: 0.16,
    firmware: 0.19,
  },
  refund: {
    lockout: 0.12,
    'bulk-import': 0.11,
    'err-4102': 0.14,
    'err-4120': 0.13,
    refunds: 0.86,
    'rate-limit': 0.2,
    depot: 0.34,
    firmware: 0.09,
  },
  code: {
    lockout: 0.24,
    'bulk-import': 0.16,
    'err-4102': 0.62,
    'err-4120': 0.63,
    refunds: 0.12,
    'rate-limit': 0.27,
    depot: 0.21,
    firmware: 0.29,
  },
  name: {
    lockout: 0.21,
    'bulk-import': 0.15,
    'err-4102': 0.18,
    'err-4120': 0.2,
    refunds: 0.17,
    'rate-limit': 0.19,
    depot: 0.24,
    firmware: 0.26,
  },
};

/**
 * How much of the combined score comes from position rather than from words.
 *
 * A number somebody picked, not a number anybody discovered. Every product
 * offering both halves exposes a dial like this one, and teams move it by
 * running their own questions and looking at what comes back.
 */
export const MEANING_WEIGHT = 0.7;

/** How many results a list shows — the handful that would be passed on. */
export const SHORTLIST = 4;

/**
 * Words, as an index would take them.
 *
 * A run of letters and digits, with hyphens kept inside a word so that
 * `E-4102` survives as one term rather than becoming `e` and `4102`. That
 * single decision is the whole reason keyword search can separate E-4102 from
 * E-4120, and it is the kind of decision that gets made once and then quietly
 * governs everything a search box can and cannot find.
 *
 * No apostrophes appear anywhere in the shelf or the questions, so none is
 * handled here.
 */
export function terms(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [];
}

/** The same list with repeats dropped, which is what an index actually holds. */
export function uniqueTerms(text: string): string[] {
  return [...new Set(terms(text))];
}

/**
 * How many passages each word appears in, and how many passages there are.
 *
 * Built from the texts handed in rather than written down, so an edit to a
 * passage moves the weights it should move.
 */
export interface Index {
  readonly containing: ReadonlyMap<string, number>;
  readonly passages: number;
}

export function buildIndex(texts: PassageTexts): Index {
  const containing = new Map<string, number>();

  for (const id of PASSAGE_IDS) {
    for (const term of uniqueTerms(texts[id])) {
      containing.set(term, (containing.get(term) ?? 0) + 1);
    }
  }

  return { containing, passages: PASSAGE_IDS.length };
}

/**
 * What one shared word is worth: a lot if it is on one passage, nothing at all
 * if it is on every passage.
 *
 * `log(passages / passages holding it)`. A word on all eight scores zero, which
 * is why nobody has to keep a list of words too common to bother with — the
 * arithmetic throws them away on its own.
 */
export function weightOf(term: string, index: Index): number {
  const held = index.containing.get(term) ?? 0;
  return held === 0 ? 0 : Math.log(index.passages / held);
}

/**
 * The words a question and a passage have in common, in the order they were
 * typed.
 *
 * This one function does two jobs, and that is the point. It is what keyword
 * search matches on, and it is what the panel means when it says a passage
 * shares not one word with the question. Both claims come out of the same
 * arithmetic, so neither can drift away from the other.
 */
export function sharedTerms(question: string, passage: string): string[] {
  const present = new Set(terms(passage));
  return uniqueTerms(question).filter((term) => present.has(term));
}

/** What keyword search gives a passage: its shared words, each worth its rarity. */
export function keywordScore(
  question: string,
  passage: string,
  index: Index,
): number {
  return sharedTerms(question, passage).reduce(
    (total, term) => total + weightOf(term, index),
    0,
  );
}

export type Method = 'meaning' | 'keyword' | 'both';

export const METHODS: readonly Method[] = ['meaning', 'keyword', 'both'];

export interface Hit {
  readonly id: PassageId;
  /** What this method scored it. The scales of the three are unrelated. */
  readonly score: number;
  /** The words this passage has in common with the question, possibly none. */
  readonly matched: readonly string[];
}

interface Row extends Hit {
  readonly place: number;
  readonly meaning: number;
  readonly keyword: number;
}

function rowsFor(
  query: QueryId,
  texts: PassageTexts,
  questions: QueryTexts,
): Row[] {
  const index = buildIndex(texts);
  const question = questions[query];

  return PASSAGE_IDS.map((id, place) => ({
    id,
    place,
    score: 0,
    meaning: MEANING[query][id],
    keyword: keywordScore(question, texts[id], index),
    matched: sharedTerms(question, texts[id]),
  }));
}

const largest = (rows: readonly Row[], of: (row: Row) => number): number =>
  rows.reduce((best, row) => Math.max(best, of(row)), 0);

/**
 * Everything the shelf offers for one question, best first.
 *
 * Ties break on shelf order, which is the only tie-break that gives the same
 * answer twice running and to two different readers.
 *
 * Keyword search returns only passages that share a word, because that is what
 * an index physically holds: a word points at the passages containing it, and a
 * passage containing none of your words is not on any of the lists you looked
 * at. It is not ranked last. It is not there.
 */
export function search(
  method: Method,
  query: QueryId,
  texts: PassageTexts,
  questions: QueryTexts,
): readonly Hit[] {
  const rows = rowsFor(query, texts, questions);

  const scored: Row[] = (() => {
    if (method === 'meaning') {
      return rows.map((row) => ({ ...row, score: row.meaning }));
    }

    if (method === 'keyword') {
      return rows
        .filter((row) => row.keyword > 0)
        .map((row) => ({ ...row, score: row.keyword }));
    }

    // Two scales that cannot be compared — a distance and a pile of word
    // weights — so each is divided by the best of its own kind first, and the
    // two are then mixed in a fixed proportion. Score fusion, and the ordinary
    // way this is done.
    const bestMeaning = largest(rows, (row) => row.meaning);
    const bestKeyword = largest(rows, (row) => row.keyword);

    return rows.map((row) => ({
      ...row,
      score:
        MEANING_WEIGHT * (bestMeaning === 0 ? 0 : row.meaning / bestMeaning) +
        (1 - MEANING_WEIGHT) *
          (bestKeyword === 0 ? 0 : row.keyword / bestKeyword),
    }));
  })();

  return scored
    .sort((left, right) => right.score - left.score || left.place - right.place)
    .map(({ id, score, matched }) => ({ id, score, matched }));
}

/** The handful a system would actually pass on. */
export function shortlist(
  method: Method,
  query: QueryId,
  texts: PassageTexts,
  questions: QueryTexts,
): readonly Hit[] {
  return search(method, query, texts, questions).slice(0, SHORTLIST);
}

/**
 * Where the passage that answers the question comes in this method's shortlist,
 * counting from one — or `null` when it is not in the shortlist at all.
 *
 * `null` is the interesting value. It is not a bad score; it is a method that
 * never handed the answer to anybody.
 */
export function answerRank(
  method: Method,
  query: QueryId,
  texts: PassageTexts,
  questions: QueryTexts,
): number | null {
  const place = shortlist(method, query, texts, questions).findIndex(
    (hit) => hit.id === ANSWER[query],
  );

  return place === -1 ? null : place + 1;
}

/** How many passages shared any word with the question at all. */
export function retrievedCount(
  query: QueryId,
  texts: PassageTexts,
  questions: QueryTexts,
): number {
  return search('keyword', query, texts, questions).length;
}

/** The questions this method puts the right passage first for. */
export function questionsWon(
  method: Method,
  texts: PassageTexts,
  questions: QueryTexts,
): readonly QueryId[] {
  return QUERY_IDS.filter(
    (query) => answerRank(method, query, texts, questions) === 1,
  );
}
