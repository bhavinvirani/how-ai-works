/**
 * Words for LabelPicker. See the header of `../SpamRuleWriter/data.en.ts` for
 * why dataset-bearing instruments keep their English here rather than in
 * `src/copy/en.ts` or in required props.
 *
 * Cell formatting lives here too, and that is not an oversight: "yes", "no",
 * the pound sign and "yrs" are English and a unit convention, not arithmetic.
 * `logic.ts` deals only in numbers.
 */
import type { Bike, ColumnId, LabelChoice } from './logic';

/** Each row's name. A row identifier a reader can point at, not a feature. */
export const BIKE_NAMES: Record<string, string> = {
  b1: 'red road bike',
  b2: 'blue commuter',
  b3: 'folding bike',
  b4: 'green tourer',
  b5: 'black hybrid',
  b6: 'silver racer',
  b7: 'old mountain bike',
  b8: 'rusty shopper',
};

export const COLUMN_LABELS: Record<ColumnId, string> = {
  frameSize: 'frame size',
  age: 'age',
  condition: 'condition',
  price: 'asking price',
  soldFast: 'sold in a week',
};

/** Shorter, for the segments — a control this size cannot carry a sentence. */
export const CHOICE_LABELS: Record<LabelChoice, string> = {
  price: 'Asking price',
  soldFast: 'Sold in a week',
  condition: 'Condition',
  none: 'No column',
};

export function formatCell(bike: Bike, column: ColumnId): string {
  switch (column) {
    case 'frameSize':
      return `${String(bike.frameSize)} cm`;
    case 'age':
      return `${String(bike.age)} yrs`;
    case 'condition':
      return `${String(bike.condition)} / 10`;
    case 'price':
      return `£${String(bike.price)}`;
    case 'soldFast':
      return bike.soldFast ? 'yes' : 'no';
  }
}

/**
 * What you have built, per nomination.
 *
 * Written as whole sentences rather than assembled from fragments, because the
 * interesting difference between them is not the column name — it is the shape
 * of the answer. One gives a number in pounds, one gives a yes or a no, one
 * gives a score, and the last gives nothing to be scored against at all.
 */
export const BUILT: Record<LabelChoice, string> = {
  price:
    'You have built a price estimator. Show it a bicycle and it hands back a number in pounds. Every other column is now a clue.',
  soldFast:
    'You have built a yes-or-no machine. Show it a bicycle and it says whether that one is likely to go inside a week. Every other column is now a clue.',
  condition:
    'You have built a condition grader. Show it a bicycle and it guesses a score out of ten. Every other column is now a clue.',
  none: 'Nothing has been nominated, so there is nothing to be right or wrong about. The eight rows are unchanged and still true — a machine can still look for bicycles that resemble each other — but it cannot be scored, because you have not said what a correct output would be.',
};

export const TEXT = {
  chooserLabel: 'Which column is the answer?',

  bikeColumn: 'the bicycle',
  roleAnswer: 'answer',
  roleClue: 'clue',

  tableCaption:
    'Eight second-hand bicycles that were listed for sale. Each row is one bicycle; each column is one thing recorded about it. The column marked "answer" is the one currently being guessed; the rest are marked "clue".',

  honesty:
    'Eight rows, built rather than gathered. A real table is far messier — the decision you are making here is the same one.',

  cluesHeading:
    'Sort the bicycles by one column, cut the list in half, and see how far apart the two halves end up on the answer. Further apart means a more useful clue.',

  /** Written as a function so the whole sentence lives here, not at the call site. */
  strongest: (column: string, percent: string) =>
    `The column that pulls the answer furthest apart is ${column}, at ${percent}.`,

  noClues:
    'With no answer column there is nothing to pull apart, so there is nothing to rank. That is not the instrument giving up — it is what a table without a nominated answer actually gives you.',

  percent: (strength: number) => `${String(Math.round(strength * 100))}%`,
} as const;
