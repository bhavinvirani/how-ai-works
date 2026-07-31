/**
 * Words for NextPieceLoop. See the header of `../SpamRuleWriter/data.en.ts` for
 * why an instrument that carries its own teaching text keeps that text here
 * rather than in `src/copy/en.ts` or in required props.
 *
 * Written as whole sentences rather than fragments the view glues together: a
 * translator needs the sentence, and the view is not allowed any English of its
 * own (hard rule 10). The shared bars take their labels from here too, which is
 * why that component contains none.
 */
import type { StartId, WrittenPiece } from './logic';

/** Rounds a share to a tenth, for the one number too small to print whole. */
const tenth = (share: number): string => (share * 100).toFixed(1);

const quoted = (text: string): string => `“${text}”`;

/**
 * The two starts, named by what has already happened rather than by seed.
 *
 * "After one bad piece" is deliberately not "the broken example". Nothing is
 * broken: the model drew a piece it was entitled to draw, and everything that
 * follows is it working properly.
 */
export const STARTS: Readonly<Record<StartId, string>> = {
  ordinary: 'From the opening',
  stuck: 'After one bad piece',
};

export const TEXT = {
  startLabel: 'Where this run picks up',

  stepperLabel: 'Pieces written',
  stepperValue: (written: number) => String(written),

  /**
   * The heading over the row of percentages. It carries the count of pieces
   * read on purpose — that number going up by one at every press is the whole
   * of the first claim, and it would otherwise be visible only by counting
   * boxes.
   */
  rowFirst: (read: number) =>
    `It has read the ${String(read)} pieces above, and this is the row it will draw the first one from.`,
  rowAfter: (read: number) =>
    `To write the marked piece it read back the ${String(read)} pieces in front of it, from the start. This is the row that came out.`,

  barsLabel:
    'The pieces that could come next, each with its share of the draw, largest first.',
  describeRow: (text: string, percent: number) =>
    `${text}, ${String(percent)} per cent`,
  describeChosen: (name: string) => `${name}, the piece it drew`,

  /**
   * Stated rather than hidden. The poorest piece in the opening row is worth
   * four tenths of a per cent, which prints as 0 once the bars round — and a
   * printed zero beside a piece the reader is about to watch get drawn would
   * look like a bug in the panel rather than the point of it.
   */
  rounding: (text: string, share: number, oneIn: number) =>
    `Shares are rounded to whole per cent, so ${quoted(text)} prints as 0. It is not 0. It is ${tenth(share)} per cent, or about one run in ${String(oneIn)}.`,

  trailHeading: 'What each pass read, and what it wrote',
  trailLine: (piece: WrittenPiece) =>
    `Pass ${String(piece.index)} read ${String(piece.read)} pieces and wrote ${quoted(piece.text)}, which held ${String(piece.percent)} per cent of that row.`,

  /* ---------- the readout, which is the only version a screen reader gets --- */

  waiting: (read: number, favourite: string, percent: number) =>
    `Nothing has been written in this run yet. The model has read the ${String(read)} pieces in front of it and scored every piece that could come next, with ${quoted(favourite)} heading the row at ${String(percent)} per cent. Press the counter to draw one.`,

  drew: (piece: WrittenPiece) =>
    `Pass ${String(piece.index)}. It read all ${String(piece.read)} pieces back from the start, produced this row, and drew ${quoted(piece.text)} at ${String(piece.percent)} per cent.`,

  tookTheTop:
    'The draw landed on the piece the row rated highest. That is what usually happens, and it is not the model picking the best one — it drew in proportion, and that piece simply held most of the row.',

  tookAnOutsider: (favourite: string, percent: number) =>
    `${quoted(favourite)} headed that row at ${String(percent)} per cent, and it wrote something else. Nothing decided. A number between 0 and 1 landed in a different slice of the row.`,

  grows: (read: number) =>
    `The next row will be scored from ${String(read + 1)} pieces — those ${String(read)}, plus the one it has just written.`,

  written: (sentence: string) => `It has written ${quoted(sentence)}.`,

  /**
   * The second claim, said where it can be checked against the row on screen.
   * Shown only on the branch that has something to take back.
   */
  noWayBack: (bad: string) =>
    `Look at what is not in that row. There is no piece that removes ${quoted(bad)}, no piece that starts the sentence again, nothing that undoes anything. Every option extends the sentence, because extending it is the only operation this machine has.`,

  ended:
    'That is the end of this run. The hand-written table of scores behind this panel stops here, and anything past it would be that table talking rather than the loop.',
} as const;
