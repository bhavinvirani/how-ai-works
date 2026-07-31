/**
 * Pure logic for LabelPicker (§3.3).
 *
 * The instrument teaches one thing: which column counts as the answer is a
 * decision a person makes, not a property of the table. Nominate a different
 * column and the same eight rows become a different machine, with a different
 * set of clues and a different clue on top.
 *
 * That last part is why `separation` exists rather than the instrument simply
 * re-tinting a column. Re-tinting asserts that the choice matters; ranking the
 * remaining columns *shows* it, because the ranking genuinely reshuffles — and
 * the reshuffle is computed from the rows rather than written into the copy.
 *
 * The table is fixed rather than generated. An instrument whose findings change
 * on every visit cannot be reasoned about, tested, or referred to from prose
 * ("look at what wins when you make price the answer").
 */

export interface Bike {
  readonly id: string;
  /** Frame size in centimetres. Carefully measured, and almost never useful. */
  readonly frameSize: number;
  /** Years since it was made. */
  readonly age: number;
  /** The seller's condition score, out of ten. */
  readonly condition: number;
  /** What it was listed at, in pounds. */
  readonly price: number;
  /** Whether it found a buyer inside seven days. */
  readonly soldFast: boolean;
}

/** Every column in the table, in the order they are displayed. */
export type ColumnId = 'frameSize' | 'age' | 'condition' | 'price' | 'soldFast';

export const COLUMNS: readonly ColumnId[] = [
  'frameSize',
  'age',
  'condition',
  'price',
  'soldFast',
];

/**
 * The columns a reader may nominate as the answer.
 *
 * Deliberately a subset. `frameSize` and `age` are legal choices in principle —
 * nothing in the data forbids them — but a machine that guesses a bicycle's
 * frame size from its price is a machine nobody wants, and four segments is
 * already the most a control this size can carry. The prose makes the point
 * that the subset is an editorial choice rather than a rule.
 */
export type AnswerColumn = Extract<
  ColumnId,
  'price' | 'soldFast' | 'condition'
>;

/** `none` is a real option: a table with no nominated answer is a real thing. */
export type LabelChoice = AnswerColumn | 'none';

export const LABEL_CHOICES: readonly LabelChoice[] = [
  'price',
  'soldFast',
  'condition',
  'none',
];

/**
 * Eight bicycles that were listed for sale.
 *
 * Built, not observed — and built to three constraints, because each one is a
 * claim the prose makes out loud.
 *
 * 1. Condition and price do not march in step. One bike is pristine and cheap,
 *    another is battered and dear, so the two columns rank the rows
 *    differently. Without that, every ranking below comes out identical and the
 *    instrument teaches nothing.
 * 2. Frame size is scrambled against everything else, so it finishes last
 *    whichever column is nominated. A measurement is not the same as a clue.
 * 3. The four cheapest bikes are exactly the four that sold inside a week. That
 *    makes "sold in a week" the strongest clue for guessing price — and it is a
 *    clue you cannot possibly have on the morning you set the price.
 */
export const BIKES: readonly Bike[] = [
  {
    id: 'b1',
    frameSize: 48,
    age: 1,
    condition: 9,
    price: 340,
    soldFast: false,
  },
  {
    id: 'b2',
    frameSize: 54,
    age: 4,
    condition: 8,
    price: 265,
    soldFast: false,
  },
  {
    id: 'b3',
    frameSize: 46,
    age: 6,
    condition: 7,
    price: 195,
    soldFast: false,
  },
  { id: 'b4', frameSize: 51, age: 9, condition: 6, price: 130, soldFast: true },
  { id: 'b5', frameSize: 56, age: 7, condition: 5, price: 150, soldFast: true },
  {
    id: 'b6',
    frameSize: 53,
    age: 11,
    condition: 4,
    price: 240,
    soldFast: false,
  },
  { id: 'b7', frameSize: 57, age: 13, condition: 3, price: 80, soldFast: true },
  { id: 'b8', frameSize: 50, age: 15, condition: 2, price: 45, soldFast: true },
];

/**
 * Every column as a number, because that is all a machine ever gets.
 *
 * Yes becomes 1 and no becomes 0, which is not a trick: it is exactly what has
 * to happen to a yes/no column before anything can be computed from it.
 */
export function valueOf(bike: Bike, column: ColumnId): number {
  switch (column) {
    case 'frameSize':
      return bike.frameSize;
    case 'age':
      return bike.age;
    case 'condition':
      return bike.condition;
    case 'price':
      return bike.price;
    case 'soldFast':
      return bike.soldFast ? 1 : 0;
  }
}

/** True when this column is the one currently nominated as the answer. */
export function isAnswerColumn(column: ColumnId, choice: LabelChoice): boolean {
  return choice !== 'none' && column === choice;
}

/** Everything that is not the answer is a clue. With no answer, all of it is. */
export function clueColumns(choice: LabelChoice): ColumnId[] {
  return COLUMNS.filter((column) => !isAnswerColumn(column, choice));
}

function mean(rows: readonly Bike[], column: ColumnId): number {
  if (rows.length === 0) return 0;
  const total = rows.reduce((sum, bike) => sum + valueOf(bike, column), 0);
  return total / rows.length;
}

function spread(rows: readonly Bike[], column: ColumnId): number {
  const values = rows.map((bike) => valueOf(bike, column));
  return Math.max(...values) - Math.min(...values);
}

/**
 * How much one column pulls the answer apart, from 0 to 1.
 *
 * Sort the rows by the clue, cut the list in half, and measure how far apart
 * the two halves are on the answer — as a share of the answer's full range.
 * Zero means the clue tells you nothing; one means it splits the answer
 * perfectly.
 *
 * Chosen over a correlation coefficient on purpose. Correlation is a better
 * measure and a worse teacher: it cannot be explained in one sentence to a
 * reader who has been promised no maths, and this instrument only needs to rank
 * three or four columns against each other, which a sort-and-split does
 * honestly. It also works unchanged on a yes/no answer, where the average of
 * the ones and zeros is simply the share that said yes.
 */
export function separation(
  label: ColumnId,
  clue: ColumnId,
  rows: readonly Bike[] = BIKES,
): number {
  const half = Math.floor(rows.length / 2);
  if (half === 0 || label === clue) return 0;

  const range = spread(rows, label);
  if (range === 0) return 0;

  // Sorted by the clue, with the id as a tiebreak so two rows holding the same
  // clue value can never land in a different order on a different engine.
  const sorted = [...rows].sort((a, b) => {
    const gap = valueOf(a, clue) - valueOf(b, clue);
    if (gap !== 0) return gap;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const low = mean(sorted.slice(0, half), label);
  const high = mean(sorted.slice(rows.length - half), label);

  return Math.abs(high - low) / range;
}

export interface ClueStrength {
  readonly column: ColumnId;
  /** 0 to 1. See `separation`. */
  readonly strength: number;
}

/**
 * The remaining columns, strongest clue first.
 *
 * Built in `COLUMNS` order before sorting, and `Array.prototype.sort` is stable,
 * so two columns that separate the answer equally well always come back in the
 * same order. Nominating nothing returns nothing — there is no answer to
 * separate, which is the honest result rather than an empty-state bug.
 */
export function rankClues(
  choice: LabelChoice,
  rows: readonly Bike[] = BIKES,
): ClueStrength[] {
  if (choice === 'none') return [];

  return clueColumns(choice)
    .map((column) => ({ column, strength: separation(choice, column, rows) }))
    .sort((a, b) => b.strength - a.strength);
}
