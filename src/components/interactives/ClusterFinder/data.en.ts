/**
 * The words around the shopper chart. English, and deliberately separated from
 * both the logic and the view.
 *
 * WHY THIS FILE, AND NOT `src/copy/en.ts`. That file is UI chrome and says so in
 * its own header. These strings are teaching material — the readout is where the
 * instrument makes its argument — and an interactive with zero required props
 * (§3.3) cannot demand that every MDX author pass its sentences in.
 *
 * The shoppers themselves live in `logic.ts` rather than here: they are numbers,
 * not language, and a French edition of this page would use exactly the same
 * forty-two.
 */
import type { StartId } from './logic';

export const START_LABELS: Record<StartId, string> = {
  a: 'First guess',
  b: 'Second guess',
  c: 'Third guess',
};

/** Where the axis is marked, and what the mark says. */
export const VISIT_TICKS: readonly { at: number; label: string }[] = [
  { at: 0, label: '0' },
  { at: 14, label: '14' },
  { at: 28, label: '28' },
];

export const SPEND_TICKS: readonly { at: number; label: string }[] = [
  { at: 0, label: '£0' },
  { at: 40, label: '£40' },
  { at: 80, label: '£80' },
];

export const TEXT = {
  groupsLabel: 'How many groups to find',
  startLabel: 'Where the machine starts looking',

  axisVisits: 'visits a month',
  axisSpend: 'spend per visit',

  groupsHeading: 'What came back',

  /**
   * Written as a whole sentence rather than assembled at the call site, so a
   * translator meets one line rather than four fragments.
   */
  groupLine: (
    number: number,
    members: number,
    visits: number,
    spend: number,
  ): string =>
    `Group ${String(number)} — ${String(members)} shoppers, coming about ${visits.toFixed(0)} times a month and spending around £${spend.toFixed(0)} a visit`,

  spread: (spread: number): string =>
    `Spread score ${spread.toFixed(1)} — the average distance from a shopper to the middle of its own group, so lower means tighter. It falls every time you ask for one more group.`,

  firstGuess:
    'This is the first starting guess, the one the other two are measured against.',

  movedNone:
    'Starting somewhere else changed nothing: every shopper kept exactly the same company.',

  moved: (moved: number, total: number): string =>
    `Starting somewhere else put ${String(moved)} of the ${String(total)} shoppers in different company. Same shoppers, same number of groups, different answer.`,

  noNames:
    'The numbers are the only names the machine has for these groups. What they mean, and whether they mean anything, is left to you.',
} as const;
