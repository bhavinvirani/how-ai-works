/**
 * Pure logic for NextPieceLoop (§3.3).
 *
 * The instrument teaches one thing: a model writes a single piece, glues it on
 * the end, re-reads the whole of what it has written, and only then produces
 * the next row of percentages — so there was never a plan, and there is no
 * operation anywhere in the loop for taking a piece back.
 *
 * NOTHING IS COMPUTED HERE. The scoring, the softmax, the draw and the loop all
 * live in `../shared/nextpiece/logic`, because `temperature` runs the same
 * arithmetic with one dial turned and the reader is meant to meet one
 * distribution twice rather than two unrelated toys. This file only decides
 * which two runs the panel shows and cuts them into something a view can render
 * without doing arithmetic of its own.
 *
 * TWO RUNS, BOTH FIXED. One starts at the beginning. The other starts one piece
 * later, after the model has already drawn the poorest piece in the opening row
 * — the branch that exists so "it cannot take anything back" is something a
 * reader watches rather than something the page asserts. Both use a fixed seed,
 * so the sentence in the prose and the sentence in the panel are the same
 * sentence, today and in two years.
 */
import {
  asPercent,
  generate,
  OPENING,
  WRITTEN_CONTEXTS,
} from '../shared/nextpiece/logic';
import type { Scored, Step } from '../shared/nextpiece/logic';

/**
 * Temperature is held at one for the whole of this instrument.
 *
 * Dividing every raw score by one changes none of them, so what the panel shows
 * is the model's own row, untouched. Turning that dial is the next unit's whole
 * subject, and putting it here as well would give a reader two things to watch
 * at once and no way to tell which was responsible for what.
 */
export const HEAT = 1;

/** Where a run that has already gone wrong picks up. */
export const STUCK_OPENING = `${OPENING} aubergine`;

export const START_IDS = ['ordinary', 'stuck'] as const;
export type StartId = (typeof START_IDS)[number];

const OPENINGS: Readonly<Record<StartId, string>> = {
  ordinary: OPENING,
  stuck: STUCK_OPENING,
};

/**
 * One fixed seed per start.
 *
 * Chosen once, by looking, and then frozen: the ordinary run happens to draw
 * its last piece from well down the row rather than off the top, which is the
 * most useful thing either run does, and a seed that changed between builds
 * would make every number on the page a lie by the following week.
 */
const SEEDS: Readonly<Record<StartId, number>> = { ordinary: 52, stuck: 39 };

/** Comfortably longer than either run turns out to be. `trimToTable` decides. */
const CEILING = 8;

const ON_TABLE = new Set(WRITTEN_CONTEXTS);

/**
 * Stops a run at the edge of the hand-written table.
 *
 * The shared module keeps going past its own table on a flat fallback row, on
 * purpose, so that a reader who wanders off the paths sees a sentence wind down
 * rather than a dead end. Here that would be dishonest in a different way: the
 * panel is being offered as a look at what a model does, and four rounds of
 * filler are a look at what a small table does. Contexts only ever grow, so a
 * run that leaves the table never comes back, and cutting at the first miss
 * cuts exactly the invented part.
 */
function trimToTable(steps: readonly Step[]): Step[] {
  const off = steps.findIndex((step) => !ON_TABLE.has(step.written));

  return off === -1 ? [...steps] : steps.slice(0, off);
}

/** Both runs, computed once. Neither depends on anything the reader does. */
export const RUNS: Readonly<Record<StartId, readonly Step[]>> = {
  ordinary: trimToTable(
    generate(HEAT, SEEDS.ordinary, CEILING, OPENINGS.ordinary),
  ),
  stuck: trimToTable(generate(HEAT, SEEDS.stuck, CEILING, OPENINGS.stuck)),
};

/**
 * A stretch of writing, cut into pieces.
 *
 * Whitespace-separated, which is exact for this table and near enough for the
 * point being made: the number the reader is asked to watch is not its size but
 * the fact that it goes up by one every single time.
 */
export const piecesOf = (text: string): string[] => text.trim().split(/\s+/);

export const piecesIn = (text: string): number => piecesOf(text).length;

/**
 * How much of the opening the model was handed rather than wrote.
 *
 * The same for both runs, because the stuck one is not a different prompt — it
 * is the same four pieces with one the model drew itself already glued on. The
 * panel marks that piece the way it marks every other piece the model wrote,
 * which is the honest way round: nobody typed the word it is stuck with.
 */
export const GIVEN_PIECES = piecesIn(OPENING);

/** Where the row's own top-scored piece sits. Ties keep the earlier one. */
function favouriteIndex(row: readonly Scored[]): number {
  return row.reduce(
    (best, entry, index) =>
      entry.probability > row[best].probability ? index : best,
    0,
  );
}

/** Where the row's poorest piece sits — the one that ruins a sentence. */
function longShotIndex(row: readonly Scored[]): number {
  return row.reduce(
    (worst, entry, index) =>
      entry.probability < row[worst].probability ? index : worst,
    0,
  );
}

export interface WrittenPiece {
  /** Which pass of the loop produced it, counting from one. */
  readonly index: number;
  /** How many pieces the model read back before writing this one. */
  readonly read: number;
  readonly text: string;
  /** Its share of that row, in whole per cent, as the bars print it. */
  readonly percent: number;
  /** Whether the draw landed on the piece that row rated highest. */
  readonly favourite: boolean;
}

function pieceAt(steps: readonly Step[], index: number): WrittenPiece {
  const step = steps[index];
  const drawn = step.row[step.chosen];

  return {
    index: index + 1,
    read: piecesIn(step.written),
    text: drawn.text,
    percent: asPercent(drawn.probability),
    favourite: step.chosen === favouriteIndex(step.row),
  };
}

/** Keeps the reader's counter inside a run, whichever start they switch to. */
export function clampWritten(start: StartId, written: number): number {
  return Math.min(RUNS[start].length, Math.max(0, Math.round(written)));
}

export interface Reading {
  readonly start: StartId;
  /** How many pieces have been written so far. */
  readonly written: number;
  /** How many this run has in it. */
  readonly total: number;
  readonly finished: boolean;

  /** Everything the model read back before producing the row on show. */
  readonly context: string;
  readonly contextPieces: number;
  readonly row: readonly Scored[];
  /**
   * Whether some piece in that row is worth less than half a per cent, and so
   * prints as a zero it does not have. The panel owes the reader a sentence
   * about that wherever it is true.
   */
  readonly roundsToZero: boolean;
  /**
   * Which entry of that row the draw landed on. Absent before the first press,
   * where the row is one the model is still facing rather than one it has
   * resolved.
   */
  readonly chosen?: number;
  /** The piece that draw produced, for the same reason absent at the start. */
  readonly latest?: WrittenPiece;

  /** The row's own top piece, whether or not the draw landed there. */
  readonly favouriteText: string;
  readonly favouritePercent: number;

  /** The stem the run began from, which no pass ever touches again. */
  readonly opening: string;
  /** Every piece written so far, oldest first. */
  readonly pieces: readonly WrittenPiece[];
  /** The opening plus those pieces — all a model ever has. */
  readonly sentence: string;
}

/**
 * What the panel shows after `requested` presses.
 *
 * The row on show is the one that produced the most recent piece, because that
 * is the row the reader was asked to look at — before the first press there is
 * no such row, so the one the model is about to draw from stands in, with
 * nothing marked on it.
 */
export function readingFor(start: StartId, requested: number): Reading {
  const steps = RUNS[start];
  const written = clampWritten(start, requested);
  const shown = written === 0 ? 0 : written - 1;
  const step = steps[shown];
  const favourite = step.row[favouriteIndex(step.row)];
  const opening = steps[0].written;

  const pieces: WrittenPiece[] = [];
  for (let index = 0; index < written; index += 1) {
    pieces.push(pieceAt(steps, index));
  }

  return {
    start,
    written,
    total: steps.length,
    finished: written === steps.length,

    context: step.written,
    contextPieces: piecesIn(step.written),
    row: step.row,
    roundsToZero: step.row.some((entry) => asPercent(entry.probability) === 0),
    chosen: written === 0 ? undefined : step.chosen,
    latest: written === 0 ? undefined : pieceAt(steps, shown),

    favouriteText: favourite.text,
    favouritePercent: asPercent(favourite.probability),

    opening,
    pieces,
    sentence: pieces.reduce((text, piece) => `${text} ${piece.text}`, opening),
  };
}

/**
 * The piece in the opening row that would ruin the sentence, and how rare it is.
 *
 * Exported because both the panel and the unit's prose have to be able to say
 * how likely the bad branch actually was. A share this small prints as 0 once
 * the bars round to whole per cent, which is worth saying out loud rather than
 * leaving as an apparent zero.
 */
const OPENING_ROW = RUNS.ordinary[0].row;
const LONG_SHOT = OPENING_ROW[longShotIndex(OPENING_ROW)];

export const LONG_SHOT_TEXT = LONG_SHOT.text;
export const LONG_SHOT_SHARE = LONG_SHOT.probability;
/** Roughly one run in this many opens with it. */
export const LONG_SHOT_ONE_IN = Math.round(1 / LONG_SHOT.probability);
