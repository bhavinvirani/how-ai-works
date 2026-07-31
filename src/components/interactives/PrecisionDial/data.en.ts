/**
 * Words for PrecisionDial. See the header of `../SpamRuleWriter/data.en.ts`
 * for why an instrument that carries its own teaching text keeps that text
 * here rather than in `src/copy/en.ts` or in required props.
 *
 * `ABILITY_TEXT` and `VERDICTS` are `Record`s over the unions in `logic.ts`,
 * so adding an ability or a verdict without writing words for it fails to
 * compile. A row of unlabelled bars would be a chart; this is supposed to be a
 * list of things a model can and cannot still do.
 *
 * NO SCORE, SIZE OR MULTIPLE IS TYPED OUT HERE. Every figure in every sentence
 * below arrives as an argument from `logic.ts`, so retuning a margin moves the
 * readout rather than leaving a stale number sitting inside a paragraph.
 */
import type { AbilityId, Panel, Verdict } from './logic';

const groupDigits = (value: number): string =>
  String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Whole percentages: nobody can act on a tenth of a point. */
const percent = (score: number): string => `${String(Math.round(score))}%`;

const gigabytes = (value: number): string =>
  value >= 10 ? `${String(Math.round(value))} GB` : `${value.toFixed(1)} GB`;

const times = (value: number): string => `${value.toFixed(1)}×`;

interface AbilityWords {
  /** What is being asked of the model. Heads its row. */
  readonly label: string;
  /** The same thing, phrased to sit inside somebody else's sentence. */
  readonly inline: string;
  /**
   * The two facts that decide how this one fares — how much room each
   * decision has, and how many of them have to land. This is where the
   * unevenness stops being an assertion and becomes readable.
   */
  readonly note: string;
}

export const ABILITY_TEXT: Record<AbilityId, AbilityWords> = {
  chat: {
    label: 'An everyday reply',
    inline: 'an everyday reply',
    note: 'One decision, and the right answer is a long way clear of the next one.',
  },
  summary: {
    label: 'Summarising a page you paste in',
    inline: 'summarising a pasted page',
    note: 'Three decisions, all of them on ground it has seen a great deal of.',
  },
  rare: {
    label: 'A fact it barely knows',
    inline: 'a fact it barely knows',
    note: 'One decision, and the runner-up is almost level with the right answer.',
  },
  code: {
    label: 'Code that has to actually run',
    inline: 'code that has to actually run',
    note: 'Six decisions, and the program fails if any single one of them slips.',
  },
  chain: {
    label: 'Twelve steps of arithmetic',
    inline: 'twelve steps of arithmetic',
    note: 'Twelve decisions, and every one of them has to land.',
  },
};

/**
 * One sentence per verdict, written whole rather than assembled from
 * adjectives at the call site — so translating this means rewriting sentences,
 * and so the claim lives next to the thresholds that trigger it.
 *
 * These are also the second cue that keeps the bars from carrying their
 * meaning in length alone (hard rule 9), and the only thing a screen reader
 * gets: they name the ability in trouble rather than pointing at a row.
 */
export const VERDICTS: Record<Verdict, (panel: Panel) => string> = {
  reference: (panel) =>
    `Nothing has been rounded yet. Each dial has all ${groupDigits(panel.referenceLevels)} of its rungs to land on, the model takes ${gigabytes(panel.gigabytes)}, and this is the row every setting below is measured against.`,

  intact: (panel) =>
    `Same model, ${gigabytes(panel.gigabytes)} instead of ${gigabytes(panel.referenceGigabytes)}, and ${times(panel.traffic)} less to carry for every word it writes. Nothing on the list has measurably gone — the weakest of them is still at ${percent(panel.worst.score)}.`,

  'looks-fine': (panel) =>
    `This is the setting to be careful about. You would try it, hear the model you know — ${ABILITY_TEXT[panel.everyday.id].inline} is at ${percent(panel.everyday.score)} — and ship it, while ${ABILITY_TEXT[panel.worst.id].inline} has quietly fallen to ${percent(panel.worst.score)}. Looks fine and is fine have come apart.`,

  hollowed: (panel) =>
    `It still talks: ${ABILITY_TEXT[panel.everyday.id].inline} is at ${percent(panel.everyday.score)}. But ${ABILITY_TEXT[panel.worst.id].inline} is at ${percent(panel.worst.score)}, and that is not degraded — it has stopped. What survived is the fluency, which is the one thing you cannot judge it by.`,

  broken: (panel) =>
    `Gone, and gone in the open. Even ${ABILITY_TEXT[panel.everyday.id].inline} has dropped to ${percent(panel.everyday.score)}, which makes this the first setting on the slider honest enough to look as bad as it is.`,
};

export const TEXT = {
  bitsLabel: 'Binary digits spent on each dial',
  bitsDescription:
    'A binary digit is one on-or-off switch. Every one you add doubles the number of positions a dial may take, and every one you remove halves it. Drag left to spend fewer.',
  bitsValue: (bits: number) =>
    `${String(bits)} ${bits === 1 ? 'digit' : 'digits'}`,

  carefulLabel: 'Spend more digits where they matter',
  carefulDescription:
    'Measure which dials the model is most sensitive to and leave those at a higher width. Costs about half a digit per dial in bookkeeping, so the file comes out slightly larger.',

  nothingToSpare:
    'Nothing is being rounded at this width, so there is nothing to spend extra digits on and no bookkeeping to pay for.',

  rungs: (levels: number, referenceLevels: number, drift: number) =>
    `Each dial now picks from ${groupDigits(levels)} rungs instead of ${groupDigits(referenceLevels)}, so nothing lands further than ${drift.toFixed(1)}% of its group's spread from where it was.`,

  sizeHeading: 'What it costs to keep, and to carry',
  sizeValue: (value: number) => gigabytes(value),
  sizeReference: (value: number) => `of ${gigabytes(value)}`,
  trafficValue: (value: number) => `${times(value)} less to carry`,

  abilitiesHeading: 'What it can still do, against the sixteen-digit model',
  abilityScore: (score: number) => percent(score),

  /** Bar widths, so the view never does the division itself. */
  barWidth: (share: number) => `${String(Math.max(0, Math.min(100, share)))}%`,

  /**
   * The honest correction about what this panel is, kept next to the thing
   * that prompts it. A reader who suspects these are invented benchmark
   * figures should find the answer here rather than deciding the panel lies.
   */
  scaleNote:
    'These five are not measurements of any real model. Each one is worked out from two things: how much room the right answer has at each decision, and how many decisions have to go right. That is enough to produce the shape — a long flat stretch, then a fall — and the order the abilities give way in. It is not enough to predict what any particular model will score, which is why the only number that settles anything is the one you measure on your own work.',
} as const;
