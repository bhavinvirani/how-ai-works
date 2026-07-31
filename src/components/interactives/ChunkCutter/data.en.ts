/**
 * The handbook, the two questions, and everything the panel says about them.
 * English, and deliberately separated from both the logic and the view.
 *
 * WHY THIS FILE AND NOT `src/copy/en.ts` — see the header of
 * `../SpamRuleWriter/data.en.ts`. Short version: the handbook below IS the
 * teaching material, chrome copy lives in `src/copy/en.ts`, and an instrument
 * with zero required props cannot demand that every MDX author pass it a staff
 * handbook.
 *
 * LARKFIELD MUTUAL DOES NOT EXIST, and neither does any rule below. That is a
 * hard constraint rather than a stylistic one: the panel's whole business is a
 * passage that gives the wrong answer when read alone, and a passage like that
 * attributed to a real employer would be a false statement about a real
 * employer's policy.
 *
 * THE WORD COUNTS ARE LOAD-BEARING. `logic.ts` budgets pieces by counting the
 * words of these very strings, and the instrument's central claim — that no
 * piece size can reach from the heading of section 5 down to its last line —
 * is arithmetic over the lengths written here. Rewriting a line without
 * re-reading `logic.test.ts` will fail the build, which is the intended
 * relationship between the two files.
 */
import type { ItemId, QuestionId } from './logic';

/**
 * Deliberately dull. A reader who finds the document interesting is reading the
 * document; the panel needs them watching what comes back.
 */
export const DOC_TITLE = 'Larkfield Mutual — staff handbook';

/**
 * The lines, in document order.
 *
 * `g3` is the reason the instrument exists. Read it with nothing above it and
 * there is no way to know what "the above" was: no gift, no supplier, no
 * hamper, nothing but a suspension. The subject is named in `h5`, three lines
 * and sixty-six words earlier.
 *
 * `g2` is the buffer that makes the failure structural. It is a genuine rule
 * and a genuinely common way to write one — it says "anything", not "any gift",
 * because the heading has already said gift. Because it names neither gifts nor
 * suppliers, no piece containing it can carry `g3` up the rankings, and because
 * it is eighteen words long, no piece of fifty-five words or fewer can hold
 * `g1` and `g3` at once.
 */
export const DOC_TEXT: Record<ItemId, string> = {
  h2: 'Section 2 — Buying from suppliers',
  p1: 'Anything bought on the company’s behalf needs a purchase order raised before the order goes in.',
  p2: 'Nothing may be ordered from a supplier who is not on the approved list.',

  h3: 'Section 3 — Travel',
  t1: 'Rail and coach fares booked more than fourteen days ahead are paid back in full.',
  t2: 'Anything booked inside fourteen days needs a manager’s approval, and the approval has to come before the booking.',
  t3: 'A night away is capped at one hundred and twenty pounds outside London and one hundred and eighty inside it.',

  h4: 'Section 4 — Client entertainment',
  e1: 'A meal or drinks with a client goes on the expenses form under hospitality, with the client’s name in the notes.',
  e2: 'The limit is forty-five pounds a head, service included.',
  e3: 'Anything over that is settled personally and cannot be claimed back later.',

  h5: 'Section 5 — Gifts from suppliers',
  g1: 'A card, a calendar, or anything else with no resale value may be accepted from a supplier at any time.',
  g2: 'Anything worth more than twenty pounds goes in the register within five working days, whoever it came from.',
  g3: 'While a tender is live the whole of the above is suspended, whatever the value involved, and no manager may waive it.',
};

/** What somebody typed. Shown above the document, so the pieces read as replies. */
export const QUESTION_TEXT: Record<QuestionId, string> = {
  dinner:
    'What is the most I can spend on a client dinner, and what happens if I go over?',
  hamper: 'A supplier has sent me a hamper. May I keep it?',
};

/** Short enough to be a segment, specific enough to name which question is meant. */
export const QUESTION_LABEL: Record<QuestionId, string> = {
  dinner: 'the client dinner',
  hamper: 'the hamper',
};

/**
 * A plain name for every line, so the readout can say which passage did not
 * come back without quoting it back in full.
 *
 * Every line gets one, not only the three the questions currently need — a name
 * per line is what lets a later question be added without the readout having a
 * hole in it.
 */
export const LINE_LABEL: Record<ItemId, string> = {
  h2: 'the buying heading',
  p1: 'the purchase order rule',
  p2: 'the approved supplier list',
  h3: 'the travel heading',
  t1: 'the fourteen day rule',
  t2: 'the rule about approval',
  t3: 'the hotel cap',
  h4: 'the entertainment heading',
  e1: 'where a client meal is claimed',
  e2: 'the forty-five pound limit',
  e3: 'what happens if you go over',
  h5: 'the gifts heading',
  g1: 'what may be accepted, and when',
  g2: 'the twenty pound register rule',
  g3: 'the line that suspends all of it during a tender',
};

/**
 * The three labels a line can carry — the two kinds of line a piece did not get
 * from the cut, and the line that answers the question.
 *
 * All three are words rather than tints, because the two switches are what the
 * reader is being asked to reason about and the answering line is what they are
 * being asked to watch, and none of that may be readable only to somebody
 * looking at colour (hard rule 9).
 */
export const TAGS = {
  repeated: 'repeated from the piece above',
  carried: 'heading, stamped on',
  answers: 'answers the question',
} as const;

const list = (labels: readonly string[]): string =>
  labels.length < 2
    ? labels.join('')
    : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;

const pieces = (count: number): string =>
  count === 1 ? 'One piece' : `${String(count)} pieces`;

const twoPlaces = (score: number): string => score.toFixed(2);

export const TEXT = {
  intro:
    'Four sections of an internal handbook, cut into pieces, with the pieces the search hands back marked. Nothing is hidden: the passage that answers each question is labelled where it sits, so you can watch whether it comes back.',

  documentHeading: 'the document, cut up',
  askedHeading: 'what somebody asked',

  questionLabel: 'The question being searched with',

  sizeLabel: 'How many words a piece may hold',
  sizeDescription:
    'The cutter takes whole lines in order and starts a new piece rather than go over. Nothing here is ever cut mid-sentence, which is the kind version.',
  sizeValue: (words: number) => `${String(words)} words`,

  overlapLabel: 'Repeat the last line of each piece at the top of the next',
  overlapDescription:
    'The standard fix for an answer that falls across a cut. It moves no cut — it only lets one line be in two places.',

  headingLabel: 'Stamp the section heading on every piece',
  headingDescription:
    'Costs one line per piece, and it is the only thing here that tells a piece what it is about.',

  pieceName: (position: number) => `piece ${String(position)}`,
  pieceMeta: (words: number, score: number) =>
    `${String(words)} words · scores ${twoPlaces(score)}`,
  returnedTag: (rank: number) =>
    `handed back, closest match no. ${String(rank)}`,

  /** Written as whole sentences so the whole claim lives here, not at the call site. */
  readoutFound: (kept: readonly string[], returned: number) =>
    `${pieces(returned)} came back, and between them they carry ${list(kept)}. Whoever answers from these has what they need.`,

  readoutMissing: (
    lost: readonly string[],
    returned: number,
    holderScore: number,
  ) =>
    `${pieces(returned)} came back, and ${list(lost)} is in none of them. The piece it does sit in scored ${twoPlaces(holderScore)}, so it was never close to being chosen. An answer built from what came back will be fluent, sourced, and wrong.`,

  readoutNothingInCommon: (lost: readonly string[], returned: number) =>
    `${pieces(returned)} came back, and ${list(lost)} is in none of them. The piece it sits in scored 0.00 — it has nothing whatever in common with the question, so no ranking could have saved it and no shorter or longer cut will either. Stamp the heading on.`,
} as const;
