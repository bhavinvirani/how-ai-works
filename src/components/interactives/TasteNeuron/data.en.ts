/**
 * Words for TasteNeuron.
 *
 * Everything a reader can see lives here rather than in the view (hard rule 10)
 * or in `src/copy/en.ts`, which carries control chrome shared across every
 * instrument. Film titles count as teaching text: they are invented, they are
 * arranged so that three of them differ in exactly one fact, and swapping them
 * for another language's would not touch a line of arithmetic.
 */
import type { CollapsedNeuron, DetectorId, FilmId, Verdict } from './logic';

/**
 * Two decimal places, with a rounded-to-nothing negative printed as plain zero
 * — "-0.00" reads as a bug rather than as a weight that barely matters.
 */
const weight = (value: number): string => {
  const rendered = value.toFixed(2);
  return rendered === '-0.00' ? '0.00' : rendered;
};

/** Thousands separators, so 68921 reads as a count rather than as a code. */
const grouped = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export const FILM_TITLES: Record<FilmId, string> = {
  'late-harvest': 'Late Harvest',
  'ninth-signal': 'Ninth Signal',
  'blast-radius': 'Blast Radius',
  'crater-run': 'Crater Run',
  'long-winter': 'The Long Winter',
  'paper-streets': 'Paper Streets',
};

/**
 * What each tuned neuron is watching for, in the reader's words.
 *
 * Named rather than numbered because the whole instrument turns on noticing
 * that the first two are nearly the same neuron with their bars in different
 * places — which is obvious from "something happening" next to "never lets up",
 * and invisible from "neuron 1" next to "neuron 2".
 */
export const DETECTOR_TEXT: Record<
  DetectorId,
  { label: string; description: string }
> = {
  'enough-happening': {
    label: 'How much “something happening” counts',
    description:
      'This neuron reports nothing at all below about 3 out of 10 for action, then climbs with it.',
  },
  'never-stops': {
    label: 'How much “never lets up” counts',
    description:
      'Silent until about 7 out of 10, and then it climbs twice as fast as the one above.',
  },
  'worth-the-time': {
    label: 'How much “worth the evening” counts',
    description:
      'Rises with word of mouth and falls with running time. Barely notices action at all.',
  },
};

export const VERDICTS: Record<Verdict, string> = {
  'all-six':
    'All six. Notice what you had to do to get here — one dial went below zero, so that neuron’s report now counts against a film. That is the machine saying “too much of this”, which is a sentence a plain weighted sum has no way of forming.',
  'more-is-more':
    'It is recommending Blast Radius — the one you said you would not sit through. From where it stands, more action can only ever push the total the same way, so the loudest film on the list is the best film on the list.',
  nearly:
    'One film out. Something is set slightly too high or slightly too low; nudge a dial rather than swinging it.',
  astray:
    'Well out. Move one dial on its own and watch which way the count goes before touching the next.',
};

export const TEXT = {
  setup:
    'Three neurons have already been tuned for you. Each reads all three facts about a film and reports one number. Your dials sit on the neuron after them, deciding how much each report counts — and a dial below zero makes that report count against a film.',

  chartTitle:
    'The machine’s total for a film as its action rises, holding word of mouth at 7 and length at 6 — the two facts the first three films share.',
  chartCaption:
    'Late Harvest, Ninth Signal and Blast Radius sit on this line at 2, 5 and 9 for action. Everything else about them is identical.',

  actionAxis: 'how much action, 0–10',
  aboveBar: 'recommends',
  belowBar: 'does not',
  legendWatch: 'you would watch',
  legendSkip: 'you would not',

  tableCaption:
    'Six films, the three facts the machine is told about each, your verdict, and the machine’s.',
  filmColumn: 'film',
  actionColumn: 'action',
  buzzColumn: 'word of mouth',
  lengthColumn: 'length',
  youColumn: 'you',
  machineColumn: 'the machine',
  scaleNote:
    'Every fact is out of 10. A length of 10 is a film you would need an interval for.',

  watchIt: 'watch it',
  skipIt: 'skip it',
  agrees: 'agrees',
  differs: 'differs',

  bendLabel: 'Keep the bend in each neuron',
  bendDescription:
    'Switch it off and each neuron passes its total straight on, unbent. Nothing else about the machine changes.',

  dialValue: (value: number) => value.toFixed(1),

  /** Written as whole sentences so translation rewrites prose, not fragments. */
  agreementSentence: (agreed: number, films: number) =>
    `It agrees with you on ${String(agreed)} of the ${String(films)} films.`,

  collapsed: (neuron: CollapsedNeuron) =>
    `The bend is out, so the whole stack is now one neuron reading the three facts directly: multiply action by ${weight(neuron.onAction)}, word of mouth by ${weight(neuron.onBuzz)} and length by ${weight(neuron.onLength)}, add ${weight(neuron.bias)}, recommend anything above zero. Four neurons of machinery, and a single weighted sum is what is left of them.`,

  ceilingWithout: (best: number, films: number) =>
    `And ${String(best)} of ${String(films)} is as far as it goes. Not because you have not found the setting — because a straight line cannot be under the bar at 2, over it at 5, and under it again at 9.`,

  footnote: (
    settings: number,
    withBend: number,
    withoutBend: number,
    films: number,
  ) =>
    `Every one of the ${grouped(settings)} settings these three dials can take has been tried. With the bend in, ${String(withBend)} of ${String(films)} is reachable. Without it, the best that exists anywhere on the grid is ${String(withoutBend)}.`,
} as const;
