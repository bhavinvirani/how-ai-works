/**
 * The shelf, the four questions, and the words the panel uses to report what
 * happened. English, and deliberately separated from both the logic and the
 * view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts` — chrome copy (the reset button, the
 * fallback notice) belongs there because it is the same on every instrument.
 * The eight passages below are teaching material, and an instrument with zero
 * required props cannot demand that every MDX author supply a help centre.
 *
 * EVERY NAME AND NUMBER HERE IS INVENTED. There is no Ashgrove depot, no error
 * E-4102 and no handset. The panel needs a shelf whose only authority is
 * itself, so nothing in it can be checked against the world and nothing in it
 * needs to be.
 *
 * NOT ONE APOSTROPHE IN ANY INDEXED STRING. `terms()` in `logic.ts` splits on
 * letters, digits and hyphens, so a curly apostrophe would cut a word in half
 * and quietly change every score on the page. Titles are display-only and are
 * never indexed, so they are free of the constraint — but the passage and
 * question texts below are not, and rewriting one without re-reading
 * `logic.test.ts` will fail the build. That is the intended relationship
 * between the two files.
 */
import type { Method, PassageId, QueryId } from './logic';

/** Display-only. The index is built from the passage bodies alone. */
export const PASSAGE_TITLE: Record<PassageId, string> = {
  lockout: 'Shut out after five wrong tries',
  'bulk-import': 'Adding a lot of people at once',
  'err-4102': 'Error E-4102',
  'err-4120': 'Error E-4120',
  refunds: 'Refunds on a yearly plan',
  'rate-limit': 'Too many calls in a minute',
  depot: 'Sending a faulty handset for repair',
  firmware: 'Keeping a handset up to date',
};

/**
 * Eight help pages, word for word what both methods are run over.
 *
 * Written so that four specific things are true, and true by arithmetic rather
 * than by assertion:
 *
 *   - `lockout` shares not one word with the password question — not even
 *     `the`, `it` or `my`.
 *   - `refunds` shares not one word with the money question. The word `money`
 *     appears on no page at all.
 *   - `bulk-import` is the only page carrying the word `password`, and it is
 *     about spreadsheets. `rate-limit` is the only page carrying `back`, and it
 *     is about calls per minute. Those are the two pages keyword search hands
 *     back for the two ordinary questions.
 *   - `err-4102` and `err-4120` differ by a transposed digit and by nothing
 *     else that matters, which is exactly the case meaning-search cannot see.
 */
export const PASSAGE_TEXT: Record<PassageId, string> = {
  lockout:
    'Five failed sign-in attempts in a row close the door for thirty minutes. Wait for the timer to run down, or ask an administrator to clear the block straight away.',
  'bulk-import':
    'The spreadsheet may carry names and email addresses but never a password column. Everyone added this way is sent a set-up link on the next working day.',
  'err-4102':
    'Error E-4102 means the battery contacts inside the handle have gone dirty. Wipe them with a dry cloth; if E-4102 comes up again, the battery pack itself needs replacing.',
  'err-4120':
    'Error E-4120 means the handset cannot reach its base station. Move within thirty metres of the base, or pair the handset again from the settings menu.',
  refunds:
    'A yearly plan can be refunded in full within fourteen days of purchase. After that, a credit covers whatever months are left.',
  'rate-limit':
    'The public interface takes sixty calls a minute for each key. Go over and the next one comes back rejected until the minute is up.',
  depot:
    'Faulty handsets are returned to the Ashgrove depot, never to the address printed on the invoice. Enclose the repair slip, or the handset is sent out again unopened.',
  firmware:
    'New firmware arrives through the base station overnight. A handset left in its cradle takes the update by morning; one carried home stays on the old version.',
};

/** What somebody typed. Two in ordinary words, then two exact strings. */
export const QUERY_TEXT: Record<QueryId, string> = {
  password: 'Why does it keep refusing my password?',
  refund: 'how do I get my money back',
  code: 'error E-4102',
  name: 'Ashgrove',
};

/** Short enough to be a segment, recognisable enough to name which question. */
export const QUERY_LABEL: Record<QueryId, string> = {
  password: 'my password',
  refund: 'my money back',
  code: 'E-4102',
  name: 'Ashgrove',
};

export const METHOD_HEADING: Record<Method, string> = {
  meaning: 'Searched by meaning',
  keyword: 'Searched by words',
  both: 'Both, combined',
};

/** How each method is named in a sentence, for the spoken readout. */
export const METHOD_NAME: Record<Method, string> = {
  meaning: 'Meaning search',
  keyword: 'Word search',
  both: 'Both combined',
};

export const METHOD_NOTE: Record<Method, string> = {
  meaning:
    'Every page has a position, so every page has a distance. Nothing is left out.',
  keyword:
    'Only pages holding one of your words exist here. The rest were never on any list that was looked at.',
  both: 'Each list divided by its own best, then mixed seven parts position to three parts words.',
};

/**
 * The tag on the row that actually answers the question. Words, not a tint, so
 * the result survives greyscale (hard rule 9) and reaches a screen reader.
 */
export const TAGS = {
  answer: 'this is the page that answers it',
} as const;

const ORDINALS = [
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
];

export const TEXT = {
  intro:
    'Eight help pages for a handheld scanner nobody makes. Pick what somebody typed into the search box, and read the two lists against each other — the same shelf, searched two completely different ways.',

  shelfHeading: 'the eight pages on the shelf',

  askedHeading: 'typed into the search box',

  queryLabel: 'What somebody was looking for',

  combineLabel: 'Run both and combine the two lists',
  combineDescription:
    'Adds a third list built from the other two, seven parts meaning to three parts words.',

  score: (value: number) => value.toFixed(2),

  matched: (words: readonly string[]) => `matched: ${words.join(', ')}`,

  sharedNone: 'not one word in common with the question',

  retrieved: (found: number, total: number) =>
    `Words matched on ${String(found)} of the ${String(total)} pages.`,

  missing:
    'The page that answers this is not in this list. It was never retrieved.',

  ranked: (method: string, rank: number) =>
    `${method}: the page that answers this comes ${ORDINALS[rank - 1]}.`,

  absent: (method: string) =>
    `${method}: the page that answers this never comes back at all.`,
} as const;
