/**
 * Words for DialTuner. See the header of
 * `../SpamRuleWriter/data.en.ts` for why dataset-bearing instruments keep their
 * English here rather than in `src/copy/en.ts` or in required props.
 */
export const TEXT = {
  perSquareMetre: 'Dial 1 — value of each square metre',
  base: 'Dial 2 — what every house is worth before size',
  perSquareMetreDescription:
    'Higher values tilt the line upwards, so big houses are guessed higher.',
  baseDescription:
    'Higher values lift the whole line, so every guess goes up by the same amount.',

  chartTitle: 'Eight houses that already sold, and the line your dials draw',

  /** Written as functions so whole sentences live here, not at the call site. */
  wrongness: (average: number) =>
    `On average, each guess is off by £${average.toFixed(1)}k.`,
  best: (average: number) =>
    `The best these two dials can do is £${average.toFixed(1)}k. It is not zero, and no setting makes it zero — the sales never sat on one straight line to begin with.`,
  close: 'That is as good as these two dials get.',

  axisSize: 'floor area (m²)',
  axisPrice: 'sold for (£k)',
} as const;
