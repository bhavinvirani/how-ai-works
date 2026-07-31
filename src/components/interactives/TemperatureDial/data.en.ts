/**
 * Words for TemperatureDial.
 *
 * Same split as every other instrument that carries its own teaching text: the
 * control chrome shared with every other panel lives in `src/copy/en.ts`, and
 * the sentences that only make sense inside this one live here. An instrument
 * with zero required props (§3.3) cannot ask the MDX author to supply them, and
 * hard rule 10 will not have them inlined in the view.
 *
 * The opening sentence itself is not here — it is `OPENING` in
 * `../shared/nextpiece/logic`, because two instruments continue the same one.
 */
import type { Band } from './logic';

/**
 * A share, printed at whatever precision makes it a fact rather than a shrug.
 *
 * The bottom piece is the reason this is not one line. At the middle of the dial
 * it holds 0.371%, at 0.5 it holds 0.003%, and at the very bottom something with
 * nineteen zeros after the point. A formatter that rounded any of those to "0%"
 * would be printing the one thing this unit spends a section insisting is
 * untrue.
 */
export const share = (probability: number): string => {
  const percent = probability * 100;

  if (percent < 0.001) return 'under 0.001%';
  if (percent < 0.1) return `${percent.toFixed(3)}%`;
  if (percent < 1) return `${percent.toFixed(1)}%`;

  return `${String(Math.round(percent))}%`;
};

/**
 * What the dial is doing, in one sentence per band.
 *
 * Written as whole sentences rather than adjectives the view glues onto a
 * number, so that the claim lives here and translating it means rewriting a
 * sentence rather than reassembling one. These are also the only thing a
 * screen reader gets when the row moves, so each has to stand alone.
 */
export const BANDS: Record<Band, string> = {
  locked:
    'At this setting it has stopped choosing. The same question will come back as the same sentence every time, for ever.',
  narrow:
    'The leader has been exaggerated well beyond the gap the model actually gave it. Something else can still get through, but it will be the runner-up rather than a surprise.',
  usual:
    'Roughly where a general assistant is set by default. The top two or three carry the row, and the same question can honestly come back two different ways.',
  wide: 'The gaps have squashed far enough that a piece the model rated near the bottom now has a real chance. Useful for a fifth idea. Ruinous for an answer.',
};

export const TEXT = {
  contextLead: 'The model has been given this much, and asked what comes next.',

  rowLabel:
    'What the model could write next, and the share of the row each piece holds at this dial setting. Ordered by share, largest first.',

  describeRow: (text: string, percent: number) =>
    `${text}, ${String(percent)} per cent`,

  describeChosen: (name: string, run: number) =>
    `${name}, the piece run ${String(run)} drew`,

  /**
   * Stated rather than hidden, for the same reason AttentionMap states its
   * rounding: a bar printed as 0 that nevertheless gets drawn looks like a bug
   * unless somebody says otherwise, and it getting drawn is the lesson.
   */
  rounding:
    'The row prints whole percentages, so anything under half of one per cent shows as 0. None of them is ever actually 0, which is exactly why the bottom one can be drawn.',

  heatLabel: 'Temperature',
  heatDescription:
    'Low stretches the gaps between the percentages apart. High squashes them together. Neither one adds a piece, removes a piece, or changes the order.',
  heatValue: (temperature: number) => temperature.toFixed(1),

  runsLabel: 'Times to run it',
  runsValue: (runs: number) => (runs === 1 ? 'once' : `${String(runs)} times`),

  runsListLabel: 'What each run of the same question wrote',
  runName: (run: number) => `run ${String(run)}`,
  /** The ellipsis is not decoration: three pieces in, it is still going. */
  sentenceLine: (sentence: string) => `${sentence}…`,

  gaps: (
    favourite: string,
    favouriteShare: number,
    longShot: string,
    longShotShare: number,
  ) =>
    `“${favourite}” is holding ${share(favouriteShare)} of the row, and “${longShot}”, the piece the model rates last, ${share(longShotShare)}.`,

  oneRun:
    'One run so far. Run it again and see whether the same sentence comes back.',

  agree: (runs: number) => `All ${String(runs)} runs wrote the same sentence.`,

  differ: (distinct: number, runs: number) =>
    `${String(runs)} runs, ${String(distinct)} different sentences — from one row of percentages that never changed between them.`,

  reached: (run: number, piece: string, probability: number) =>
    `Run ${String(run)} opened with “${piece}”, which the model rated at ${share(probability)} here. It did not become a better word. It was drawn.`,
} as const;
