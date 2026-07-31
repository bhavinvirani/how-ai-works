/**
 * Words for FlexibilityDial. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 */
import type { Verdict } from './logic';

const groupDigits = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Prices are held in thousands, and read out in whole pounds — "£12,000" is a
 * quantity a reader already has a feel for, and "12.4" is not.
 */
const pounds = (thousands: number): string =>
  `£${groupDigits(Math.round(thousands) * 1000)}`;

/**
 * Written as one sentence per verdict rather than as an adjective the view
 * glues onto a number, so that the whole claim lives here and translating it
 * means rewriting a sentence rather than reassembling one.
 *
 * These are also the second cue that keeps the plot from carrying its meaning
 * in a line shape alone (hard rule 9), and the only thing a screen reader gets
 * — the drawing itself has no equivalent.
 */
export const VERDICTS: Record<Verdict, string> = {
  'too-stiff':
    'It is too stiff to follow the rise at all: well out on the sales it studied, and just as far out on the new ones. One failure, showing up in both places.',
  'about-right':
    'It has taken the rise and left the wobbles alone. About as good on sales it has never seen as on the ones it studied — which is the only kind of good worth having.',
  drifting:
    'It is starting to bend towards individual sales. A little better on what it studied, quietly worse on everything else, and only the first half of that is visible from inside.',
  memorising:
    'One dial per sale, and the line now passes exactly through all twelve of them. A flawless score on what it studied, the worst machine here on anything new, and between the dots it swings to prices no house on this street has ever fetched.',
};

export const TEXT = {
  chartTitle:
    'Twelve house sales, and the line a machine with this many dials fits through them.',

  dialsLabel: 'How many dials the machine may use',
  dialsDescription:
    'Two dials can only draw a straight line. Every dial after that buys it one more bend.',
  dialsValue: (dials: number) => `${String(dials)} dials`,

  unseenLabel: 'Also test it on eight sales it has never seen',
  unseenDescription:
    'Same street, same month, same kind of houses — kept back while the machine was being tuned.',

  axisSize: 'floor area, m²',
  axisPrice: 'sold for, £000s',
  legendStudied: 'sales it studied',
  legendUnseen: 'sales it never saw',

  /** Written as functions so whole sentences live here, not at the call site. */
  studied: (miss: number) =>
    miss < 0.5
      ? 'It now gets all twelve of the sales it studied exactly right. A perfect score.'
      : `On the twelve sales it studied, its guesses are ${pounds(miss)} out on average.`,

  unseen: (miss: number) =>
    `On the eight it has never seen, ${pounds(miss)} out.`,

  unseenHidden:
    'That is the only score there is so far, and adding dials keeps making it better. Test it on the eight it has never seen.',
} as const;
