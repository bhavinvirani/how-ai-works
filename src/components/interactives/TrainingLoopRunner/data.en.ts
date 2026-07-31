/**
 * Words and number formatting for TrainingLoopRunner. See the header of
 * `../SpamRuleWriter/data.en.ts` for why dataset-bearing instruments keep their
 * English beside them rather than in `src/copy/en.ts` or in required props.
 *
 * The money formatters live here too. They are not logic — nothing in the model
 * depends on them — but they are locale-shaped: a currency symbol, a decimal
 * point and a thousands separator are exactly the things a translation has to
 * change. Written by hand rather than with `toLocaleString`, because the output
 * has to be identical in every browser and in the test runner.
 */
import type { Loop, StepKey } from './logic';

/** 244625 → "244,625". */
function withSeparators(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Thousands of pounds → pounds, written out. `money(6.844)` is "£6,844".
 * Negatives take a real minus sign rather than a hyphen.
 */
function money(thousands: number, decimals = 0): string {
  const pounds = thousands * 1000;
  const [whole, fraction] = Math.abs(pounds).toFixed(decimals).split('.');
  const body = fraction
    ? `${withSeparators(whole)}.${fraction}`
    : withSeparators(whole);

  return `${pounds < 0 ? '−' : ''}£${body}`;
}

/** Same, but always carrying a sign — used for the nudges, where direction is the point. */
function signedMoney(thousands: number, decimals: number): string {
  return thousands < 0
    ? money(thousands, decimals)
    : `+${money(thousands, decimals)}`;
}

/** The four steps, in the reader's words. Order comes from `STEP_KEYS`, not from here. */
export const STEP_LABELS: Record<StepKey, string> = {
  guess: 'Guess',
  compare: 'Compare',
  blame: 'Blame',
  nudge: 'Nudge',
};

/**
 * What each step did on the pass that just finished, in real numbers.
 *
 * These are sentences rather than fragments assembled at the call site: a
 * translator needs the whole sentence, and the view needs no English at all
 * (hard rule 10).
 */
export const STEP_LINES: Record<StepKey, (loop: Loop) => string> = {
  guess: (loop) =>
    `It picked up the ${String(loop.house.size)} m² house. With the dials where they stood, the machine said ${money(loop.guess)}.`,

  compare: (loop) => {
    if (loop.error === 0)
      return `That house sold for ${money(loop.answer)}. Exactly right, this once.`;
    const direction = loop.error > 0 ? 'too high' : 'too low';
    return `That house sold for ${money(loop.answer)}. The guess was ${money(Math.abs(loop.error))} ${direction}.`;
  },

  blame: (loop) =>
    `Which dial pushed the answer that way? On a ${String(loop.house.size)} m² house, the size dial's number is multiplied by ${String(loop.house.size)} before it reaches the answer, so it did most of the pushing and carries most of the blame. The starting value did the rest.`,

  nudge: (loop) =>
    `Each dial turns a hair against its share of the blame: ${signedMoney(loop.nudge.perSquareMetre, 3)} per square metre, ${signedMoney(loop.nudge.base, 2)} on the starting value. Nowhere near enough to fix this house, and that is on purpose.`,
};

export const TEXT = {
  paceLabel: 'How many loops one press runs',
  paceOne: '1',
  paceSome: '250',
  paceMany: '5,000',

  loopsRun: 'Loops run',
  /** Formats the loop counter on the control. */
  loopCount: (loops: number) => withSeparators(String(loops)),

  chartTitle:
    'The eight sales the machine is learning from, and the line its two dials currently draw',
  axisSize: 'floor area (m²)',
  axisPrice: 'sold for (£k)',

  dialsHeading: 'Where the two dials stand',
  dialOne: 'Value of each square metre',
  dialTwo: 'Worth of any house before size',
  dialValue: (thousands: number) => money(thousands),

  stepsHeading: (loops: number) =>
    `What loop ${withSeparators(String(loops))} did, step by step`,
  notStartedHeading: 'What one loop does',
  notStarted:
    'Nothing has run yet. Run a loop and its four steps appear here, with the numbers it actually used.',

  reading: (loops: number, now: number, atStart: number) =>
    loops === 0
      ? `Both dials sit at zero, so the machine guesses ${money(0)} for every house and is off by ${money(atStart)} a house.`
      : `After ${withSeparators(String(loops))} loops the machine is off by ${money(now)} a house, down from ${money(atStart)}.`,

  lastLoop: (moved: number) =>
    `That last loop, on its own, moved that number by ${money(Math.abs(moved))}.`,

  best: (best: number) =>
    `The best setting these two dials have is ${money(best)}, found by trying all 30,401 of them.`,

  arrived:
    'The loop has all but reached it, and nothing was ever told which way to turn.',
} as const;
