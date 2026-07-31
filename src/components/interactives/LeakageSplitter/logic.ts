/**
 * Pure logic for LeakageSplitter (§3.3).
 *
 * The instrument teaches one thing: a score on rows the machine studied is
 * always near-perfect and means nothing, and a score on held-back rows only
 * means something while nothing on the held-back side is already sitting on
 * the studied side.
 *
 * WHY THE MACHINE IS A NEAREST-NEIGHBOUR LOOKUP. It is the bluntest honest
 * learner there is: to guess about a round, find the most similar studied
 * round and copy what happened to it. That bluntness is the point — a big
 * model memorises too, just where nobody can watch it. Here the memorising is
 * visible arithmetic, so "it scored perfectly on what it studied" stops being
 * a claim the prose makes and becomes something the reader can check row by
 * row. Nothing here has to be unlearned later.
 *
 * WHY THE SCALING IS FITTED ON THE STUDIED ROWS ONLY. Ranging the two columns
 * needs a smallest and a largest value, and taking those from all twenty-four
 * rows would mean reading the held-back rows to build the machine — a small
 * version of exactly the mistake this unit is about. So `scaleFor` sees the
 * studied pile and nothing else. It happens not to change any verdict here,
 * which is not a reason to do it the other way.
 */

/** Which side of the split a row is on. */
export type Pile = 'studied' | 'held-back';

export interface DeliveryRound {
  readonly id: string;
  /**
   * The depot's own number for the round. Two rows sharing this number are the
   * SAME delivery round, entered twice — once by the office and once from the
   * driver's handset — with the mileage slightly out between them.
   */
  readonly roundNumber: number;
  readonly distanceKm: number;
  readonly parcels: number;
  /** What actually happened. The column being guessed. */
  readonly finishedLate: boolean;
  /**
   * Where this individual row lands when the rows are dealt out one at a time,
   * which is what a plain shuffle does and what almost everybody writes first.
   */
  readonly rowPile: Pile;
}

/**
 * Twenty-four rows covering twenty rounds. Four rounds appear twice.
 *
 * Built, not observed, and built to four constraints — each one is a claim the
 * prose makes out loud, and `logic.test.ts` holds every one of them:
 *
 * 1. The two piles are the SAME SIZE (14 and 10) whichever way the split is
 *    made, so the reader is comparing scores and not sample sizes. That is why
 *    two of the repeated rounds are first listed on the studied side and two on
 *    the held-back side.
 * 2. Dealt out row by row, every held-back row is guessed right — a flawless
 *    100%, which is the "suspect leakage before you celebrate" moment.
 * 3. Kept together by round, the held-back score falls to 70%. Fixing the split
 *    makes the number WORSE, and the worse number is the honest one.
 * 4. There is a real, learnable pattern underneath (long and heavy rounds run
 *    late) with a couple of exceptions, so 70% is a believable score rather
 *    than a coin toss.
 */
export const ROUNDS: readonly DeliveryRound[] = [
  r('s1', 101, 12, 79, false, 'studied'),
  r('s2', 102, 16, 111, false, 'studied'),
  r('s3', 103, 22, 87, false, 'studied'),
  r('s4', 104, 26, 135, false, 'studied'),
  r('s5', 105, 32, 159, true, 'studied'),
  r('s6', 106, 40, 143, true, 'studied'),
  r('s7', 107, 44, 191, true, 'studied'),
  // Short but very heavy, and it still came in on time. The exception that
  // stops the pattern being a straight line, and the row that punishes round
  // 117 once round 117 stops being available to copy from.
  r('s8', 108, 20, 183, false, 'studied'),
  r('s9', 109, 36, 95, false, 'studied'),
  r('s10', 110, 14, 151, false, 'studied'),

  r('h1', 111, 18, 95, false, 'held-back'),
  r('h2', 112, 30, 151, true, 'held-back'),
  r('h3', 113, 42, 170, true, 'held-back'),
  r('h4', 114, 24, 109, false, 'held-back'),
  r('h5', 115, 34, 119, false, 'held-back'),
  r('h6', 116, 16, 199, true, 'held-back'),

  // The four rounds the depot logged twice. Each pair is listed together, and
  // the FIRST of the pair decides where the whole round goes when copies are
  // kept together — see `pileOf`.
  r('d1a', 117, 13, 207, true, 'held-back'),
  r('d1b', 117, 14, 204, true, 'studied'),
  r('d2a', 118, 46, 175, true, 'held-back'),
  r('d2b', 118, 45, 178, true, 'studied'),
  r('d3a', 119, 28, 71, false, 'studied'),
  r('d3b', 119, 29, 69, false, 'held-back'),
  r('d4a', 120, 38, 207, true, 'studied'),
  r('d4b', 120, 39, 204, true, 'held-back'),
];

/** Terse constructor, so the table above reads as a table. */
function r(
  id: string,
  roundNumber: number,
  distanceKm: number,
  parcels: number,
  finishedLate: boolean,
  rowPile: Pile,
): DeliveryRound {
  return { id, roundNumber, distanceKm, parcels, finishedLate, rowPile };
}

/** Every row belonging to one round. Length 2 for a round that was logged twice. */
export function copiesOf(roundNumber: number): DeliveryRound[] {
  return ROUNDS.filter((round) => round.roundNumber === roundNumber);
}

/** True when this round was entered by both systems. */
export function wasLoggedTwice(record: DeliveryRound): boolean {
  return copiesOf(record.roundNumber).length > 1;
}

/** How many rounds exist, counting a double-logged round once. */
export const ROUND_COUNT = new Set(ROUNDS.map((round) => round.roundNumber))
  .size;

/** How many of them were logged twice. */
export const REPEATED_ROUND_COUNT = ROUNDS.length - ROUND_COUNT;

/**
 * Where a round goes when the split is made round by round rather than row by
 * row: the whole round follows its first-listed row, so both copies always
 * land on the same side.
 */
const PILE_BY_ROUND: ReadonlyMap<number, Pile> = (() => {
  const byRound = new Map<number, Pile>();

  for (const round of ROUNDS) {
    // First listing wins. A later copy never overwrites it.
    if (!byRound.has(round.roundNumber)) {
      byRound.set(round.roundNumber, round.rowPile);
    }
  }

  return byRound;
})();

/**
 * Which pile a row is in.
 *
 * `keepCopiesTogether` is the whole instrument. False is what a plain shuffle
 * does — deal the rows out one at a time, and a round logged twice can easily
 * end up with a copy on each side. True deals out rounds instead.
 */
export function pileOf(
  record: DeliveryRound,
  keepCopiesTogether: boolean,
): Pile {
  if (!keepCopiesTogether) return record.rowPile;
  return PILE_BY_ROUND.get(record.roundNumber) ?? record.rowPile;
}

export interface Split {
  readonly studied: DeliveryRound[];
  readonly heldBack: DeliveryRound[];
}

export function splitRounds(keepCopiesTogether: boolean): Split {
  return {
    studied: ROUNDS.filter(
      (round) => pileOf(round, keepCopiesTogether) === 'studied',
    ),
    heldBack: ROUNDS.filter(
      (round) => pileOf(round, keepCopiesTogether) === 'held-back',
    ),
  };
}

/** Rounds with a row on BOTH sides of the split — the hole in the wall. */
export function roundsOnBothSides(keepCopiesTogether: boolean): number[] {
  const straddling = new Set<number>();

  for (const round of ROUNDS) {
    const piles = new Set(
      copiesOf(round.roundNumber).map((copy) =>
        pileOf(copy, keepCopiesTogether),
      ),
    );
    if (piles.size > 1) straddling.add(round.roundNumber);
  }

  return [...straddling].sort((a, b) => a - b);
}

interface Extent {
  readonly min: number;
  /** Never zero, so dividing by it is always safe. */
  readonly span: number;
}

interface Scale {
  readonly distance: Extent;
  readonly parcels: Extent;
}

function extentOf(
  rows: readonly DeliveryRound[],
  read: (round: DeliveryRound) => number,
): Extent {
  const values = rows.map(read);
  const min = Math.min(...values);
  const span = Math.max(...values) - min;
  return { min, span: span === 0 ? 1 : span };
}

/**
 * Puts kilometres and parcel counts on the same footing, using the studied
 * rows and only the studied rows. Without it, parcels (tens to hundreds) would
 * swamp distance (tens) and "most similar" would mean "closest parcel count".
 */
export function scaleFor(studied: readonly DeliveryRound[]): Scale {
  return {
    distance: extentOf(studied, (round) => round.distanceKm),
    parcels: extentOf(studied, (round) => round.parcels),
  };
}

/** How unlike each other two rounds are, on the two columns the machine gets. */
export function gapBetween(
  scale: Scale,
  a: DeliveryRound,
  b: DeliveryRound,
): number {
  const distance = (a.distanceKm - b.distanceKm) / scale.distance.span;
  const parcels = (a.parcels - b.parcels) / scale.parcels.span;
  return Math.hypot(distance, parcels);
}

/**
 * The studied round most like this one. Ties go to whichever comes first in
 * `ROUNDS`, so the answer never depends on sort stability or engine.
 */
export function nearestStudied(
  record: DeliveryRound,
  studied: readonly DeliveryRound[],
): DeliveryRound {
  let best: { round: DeliveryRound; gap: number } | null = null;
  const scale = scaleFor(studied);

  for (const candidate of studied) {
    const gap = gapBetween(scale, record, candidate);
    if (best === null || gap < best.gap) best = { round: candidate, gap };
  }

  // The studied pile is never empty for any split this instrument offers. The
  // throw is for the type system, not for a case a reader can reach.
  if (best === null) throw new Error('the studied pile must not be empty');

  return best.round;
}

/** Where a guess came from, which is the thing worth reading off a row. */
export type MatchKind =
  /** The machine found this very row. It is reading its own notes back. */
  | 'itself'
  /** It found the OTHER log of this same round. That is the leak. */
  | 'the-same-round'
  /** It found a genuinely different round, which is the only honest case. */
  | 'a-different-round';

export interface Verdict {
  readonly record: DeliveryRound;
  readonly copiedFrom: DeliveryRound;
  readonly matchKind: MatchKind;
  readonly guessedLate: boolean;
  readonly correct: boolean;
}

export function judge(pile: Pile, keepCopiesTogether: boolean): Verdict[] {
  const { studied, heldBack } = splitRounds(keepCopiesTogether);
  const rows = pile === 'studied' ? studied : heldBack;

  return rows.map((record) => {
    const copiedFrom = nearestStudied(record, studied);

    const matchKind: MatchKind =
      copiedFrom.id === record.id
        ? 'itself'
        : copiedFrom.roundNumber === record.roundNumber
          ? 'the-same-round'
          : 'a-different-round';

    return {
      record,
      copiedFrom,
      matchKind,
      guessedLate: copiedFrom.finishedLate,
      correct: copiedFrom.finishedLate === record.finishedLate,
    };
  });
}

export interface Score {
  readonly correct: number;
  readonly total: number;
  /** How many guesses were answered by another log of the same round. */
  readonly fromTheSameRound: number;
}

export function scoreOf(verdicts: readonly Verdict[]): Score {
  return {
    correct: verdicts.filter((verdict) => verdict.correct).length,
    total: verdicts.length,
    fromTheSameRound: verdicts.filter(
      (verdict) => verdict.matchKind === 'the-same-round',
    ).length,
  };
}

/** Whole percent, so the readout never shows a number nobody would quote. */
export function percentageCorrect(score: Score): number {
  if (score.total === 0) return 0;
  return Math.round((score.correct / score.total) * 100);
}
