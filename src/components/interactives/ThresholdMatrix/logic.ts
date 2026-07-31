/**
 * Pure logic for ThresholdMatrix (§3.3).
 *
 * The instrument teaches one thing: when the answer you are hunting for is
 * rare, a single accuracy number can be excellent and mean nothing — so the
 * only honest way to read a detector is to count its two kinds of mistake
 * separately, and to notice that you cannot reduce both at once.
 *
 * WHY A FIXED POPULATION RATHER THAN A FORMULA. The artifact this is ported
 * from generated its false-alarm count from `Math.pow(sens/100, 1.8) * 160`,
 * which is a curve chosen to look right. Here the numbers come from a fixed
 * table of a thousand people, and every quantity on screen — accuracy, the two
 * mistakes, the best setting on the whole dial — is counted out of that table.
 * The prose can then quote a figure and the tests can pin it, so a later edit
 * to the population that falsifies the unit fails the build instead of shipping.
 *
 * Nothing here is random or time-dependent. The same dial setting always
 * produces the same four numbers.
 */

/**
 * One ten-point band of the detector's suspicion score, and how many of the
 * screened people landed in it.
 *
 * Real detectors of this kind do not answer yes or no. They score each case for
 * how suspicious it looks, and a person decides separately how high that score
 * has to be before anyone acts. Banding the scores rather than listing a
 * thousand individuals keeps the table readable while changing none of that.
 */
export interface ScoreBand {
  /** Lowest score in the band. Every band is ten points wide. */
  from: number;
  /** Genuinely ill people whose scan scored inside this band. */
  ill: number;
  /** Genuinely healthy people whose scan scored inside this band. */
  healthy: number;
}

/**
 * One month of screening.
 *
 * Two things about the shape matter, and both are true of real screening.
 * The ill are rare — ten people in a thousand — and the two groups *overlap*:
 * a few ill people score low and a long tail of healthy people score high.
 * Without that overlap there would be a bar that separates them perfectly, no
 * trade-off, and no lesson.
 */
export const POPULATION: readonly ScoreBand[] = [
  { from: 0, ill: 0, healthy: 520 },
  { from: 10, ill: 0, healthy: 210 },
  { from: 20, ill: 1, healthy: 110 },
  { from: 30, ill: 0, healthy: 60 },
  { from: 40, ill: 1, healthy: 40 },
  { from: 50, ill: 1, healthy: 25 },
  { from: 60, ill: 1, healthy: 12 },
  { from: 70, ill: 2, healthy: 8 },
  { from: 80, ill: 2, healthy: 4 },
  { from: 90, ill: 2, healthy: 1 },
];

const sum = (values: readonly number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const ILL_TOTAL = sum(POPULATION.map((band) => band.ill));
export const HEALTHY_TOTAL = sum(POPULATION.map((band) => band.healthy));
export const SCREENED_TOTAL = ILL_TOTAL + HEALTHY_TOTAL;

/**
 * The dial the reader turns, from "never raises the alarm" to "raises one about
 * everybody".
 *
 * Eagerness rather than the bar itself, because the bar runs backwards: a high
 * bar means a quiet test. Dragging right should mean more alarms, which is what
 * a reader expects and what the prose describes.
 */
export const MIN_EAGERNESS = 0;
export const MAX_EAGERNESS = 100;
export const EAGERNESS_STEP = 10;

/** Starts where the detector does nothing at all — the trap, and the point. */
export const DEFAULT_EAGERNESS = MIN_EAGERNESS;

export const EAGERNESS_SETTINGS: readonly number[] = Array.from(
  { length: (MAX_EAGERNESS - MIN_EAGERNESS) / EAGERNESS_STEP + 1 },
  (_, index) => MIN_EAGERNESS + index * EAGERNESS_STEP,
);

/** How high a scan has to score before this setting calls anybody back. */
export function barFor(eagerness: number): number {
  return MAX_EAGERNESS - eagerness;
}

/** The four boxes. Between them they hold every person screened. */
export interface Counts {
  /** Ill, and the alarm was raised. */
  caught: number;
  /** Ill, and the test stayed quiet. The expensive mistake, here. */
  missed: number;
  /** Healthy, and the alarm was raised anyway. */
  falseAlarms: number;
  /** Healthy, and the test stayed quiet. Nearly everybody. */
  cleared: number;
}

/** How many people this setting calls back, right or wrong. */
export const alarmsRaised = (counts: Counts): number =>
  counts.caught + counts.falseAlarms;

/**
 * Fill in the four boxes at one setting of the dial.
 *
 * A whole band clears the bar or none of it does, because every bar the slider
 * can produce is a multiple of ten and every band is ten points wide. That is
 * why the band's lowest score can be compared directly.
 */
export function countsAt(eagerness: number): Counts {
  const bar = barFor(eagerness);
  let caught = 0;
  let falseAlarms = 0;

  for (const band of POPULATION) {
    if (band.from >= bar) {
      caught += band.ill;
      falseAlarms += band.healthy;
    }
  }

  return {
    caught,
    missed: ILL_TOTAL - caught,
    falseAlarms,
    cleared: HEALTHY_TOTAL - falseAlarms,
  };
}

/** How often the test was right, over everybody. The number that lies. */
export function accuracyAt(eagerness: number): number {
  const counts = countsAt(eagerness);
  return (counts.caught + counts.cleared) / SCREENED_TOTAL;
}

/**
 * Of everybody who really was ill, the share the test found. Recall, in the
 * plain words the unit uses.
 */
export function recallAt(eagerness: number): number {
  return countsAt(eagerness).caught / ILL_TOTAL;
}

/**
 * When it raises the alarm, how often something is really there. Precision.
 *
 * Null rather than zero when the test never raises the alarm at all: there is
 * nothing to be right or wrong about, and reporting 0% would claim a failure
 * that never happened.
 */
export function precisionAt(eagerness: number): number | null {
  const counts = countsAt(eagerness);
  const alarms = alarmsRaised(counts);
  return alarms === 0 ? null : counts.caught / alarms;
}

export type Verdict =
  'findsNobody' | 'findsSome' | 'findsEveryone' | 'callsBackEveryone';

/**
 * What kind of detector this setting has produced.
 *
 * Read off the counts rather than off the dial position, so the verdicts stay
 * true if the population is ever changed.
 */
export function verdictFor(counts: Counts): Verdict {
  if (counts.falseAlarms === HEALTHY_TOTAL) return 'callsBackEveryone';
  if (counts.caught === 0) return 'findsNobody';
  if (counts.caught === ILL_TOTAL) return 'findsEveryone';
  return 'findsSome';
}

/** Everything the view needs about one setting of the dial. */
export interface Reading {
  eagerness: number;
  bar: number;
  counts: Counts;
  accuracy: number;
  /** Null when the test never raises the alarm. */
  precision: number | null;
  recall: number;
  verdict: Verdict;
}

export function readingAt(eagerness: number): Reading {
  const counts = countsAt(eagerness);

  return {
    eagerness,
    bar: barFor(eagerness),
    counts,
    accuracy: accuracyAt(eagerness),
    precision: precisionAt(eagerness),
    recall: recallAt(eagerness),
    verdict: verdictFor(counts),
  };
}

/**
 * The best accuracy any setting of this dial can reach.
 *
 * The instrument's equivalent of a brute-force search: eleven settings, all of
 * them tried, so the panel can state the ceiling as a counted fact rather than
 * as a claim the reader has to trust. It is also the sharpest thing in the
 * unit — the highest-scoring detector on the dial finds two ill people in ten.
 *
 * Ties go to the lower setting, which keeps the answer stable.
 */
export function bestAccuracyReading(): Reading {
  let best: Reading | null = null;

  for (const eagerness of EAGERNESS_SETTINGS) {
    const reading = readingAt(eagerness);
    if (best === null || reading.accuracy > best.accuracy) best = reading;
  }

  // `EAGERNESS_SETTINGS` is non-empty by construction. The assertion is for the
  // type system, not for a case that can happen.
  if (best === null) throw new Error('EAGERNESS_SETTINGS must not be empty');

  return best;
}

/**
 * The gentlest setting that leaves nobody ill behind, or null if no setting
 * manages it.
 */
export function firstReadingThatFindsEveryone(): Reading | null {
  for (const eagerness of EAGERNESS_SETTINGS) {
    const reading = readingAt(eagerness);
    if (reading.counts.caught === ILL_TOTAL) return reading;
  }

  return null;
}
