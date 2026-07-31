/**
 * Words for LeakageSplitter. See the header of `../SpamRuleWriter/data.en.ts`
 * for why dataset-bearing instruments keep their English here rather than in
 * `src/copy/en.ts` or in required props.
 *
 * `logic.ts` next door holds only numbers and rounds. Everything a reader
 * actually reads — column headings, "ran late", the sentence explaining what
 * just happened to the score — is here.
 */
import type { MatchKind, Pile, Score } from './logic';

export const PILE_LABELS: Record<Pile, string> = {
  studied: 'The rounds it studied',
  'held-back': 'The rounds we held back',
};

/** Where a guess came from, said in words rather than shown by a tint. */
export function sourceOf(kind: MatchKind, roundNumber: number): string {
  switch (kind) {
    case 'itself':
      return 'this very row';
    case 'the-same-round':
      return `the other log of round ${String(roundNumber)}`;
    case 'a-different-round':
      return `round ${String(roundNumber)}`;
  }
}

export const TEXT = {
  pileLabel: 'Score it on',

  keepTogetherLabel: 'Keep both copies of a repeated round on the same side',
  keepTogetherDescription:
    'Off, the rows are dealt out one at a time, which is what shuffling does. On, whole rounds are dealt out instead, so a round logged twice cannot land on both sides.',

  tableCaption:
    'Delivery rounds that already ran. Each row gives the distance covered, the number of parcels, what actually happened, what the machine guessed, and which studied round that guess was copied from.',

  columnRound: 'Round',
  columnDistance: 'Distance',
  columnParcels: 'Parcels',
  columnTruth: 'What happened',
  columnGuess: 'What the machine said',
  columnSource: 'Copied from',

  loggedTwice: 'logged twice',

  outcome: (late: boolean) => (late ? 'ran late' : 'on time'),
  verdict: (correct: boolean) => (correct ? 'right' : 'wrong'),

  distance: (km: number) => `${String(km)} km`,
  parcels: (count: number) => String(count),

  /** The running score. Written whole so the sentence lives here, not at the call site. */
  scoreLine: (score: Score, percent: number) =>
    `Right about ${String(score.correct)} of ${String(score.total)} rows — ${String(percent)}%.`,

  /**
   * What that score is worth. One sentence per state, because the interesting
   * difference between them is not the number — it is what the number is
   * measuring, and that changes completely between the three.
   */
  readingStudied:
    'It could hardly do otherwise: for every one of these rounds the most similar studied round is that same row, so the machine is reading its own notes back to you. A score on rows a machine studied measures what it can store, not what it knows.',

  readingLeaked: (sameRound: number) =>
    `${String(sameRound)} of those guesses were copied from the other log of the same round — the same delivery, sitting on the studied side under the same number. Those rounds were never held back at all.`,

  readingHonest:
    'No round has a row on both sides now, so nothing here has been seen before in any form. This is the number the depot should have been quoting all along, and it is the worse one.',

  honesty:
    'Twenty rounds, four of them logged twice, built rather than gathered. Real datasets are larger and messier; the hole in the split is exactly this shape.',
} as const;
