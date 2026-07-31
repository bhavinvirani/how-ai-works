/**
 * Pure logic for ThinkingBudget (§3.3).
 *
 * The instrument teaches one thing: room to think is a RESOURCE, spent in
 * tokens, and whether spending it helps is a fact about the question rather
 * than a fact about the machine. One question is transformed by it, one is
 * completely untouched by it, and two are made worse by it — and the reader
 * finds that out by moving one slider across four questions.
 *
 * ONE TOKEN, ONE PASS. Every number this module reports leans on the single
 * mechanical claim the unit is about: the model does one complete forward pass
 * per token it produces, so `passes` is not a separate quantity to be modelled
 * — it IS the token count, working and answer together. That is why `passes`
 * is computed as a sum of token counts and nothing else.
 *
 * FIFTY IS THE DESIGNED MOMENT. At fifty tokens of room, `rice` has just
 * bought the line that makes it right, and `polite` and `supplier` have just
 * bought the lines that make them wrong. Nothing about that is a coincidence:
 * the three third steps cost 45, 48 and 43 cumulative tokens on purpose, so
 * that one setting of one slider can be stepped across four questions and land
 * differently on each. `logic.test.ts` pins it.
 *
 * WHAT IS REAL AND WHAT IS STAGED. Real: the arithmetic of budgets, that a
 * step only happens if the whole of it fits, that unwritten working cannot be
 * used, and that the bill is the token count. Staged: the working itself and
 * the answers it leads to, which are written by hand so that four questions
 * are legible on one page. The unit says so in as many words.
 *
 * DETERMINISTIC (§3.3). No randomness anywhere. Two readers at the same two
 * settings see the same tokens in the same order.
 */

export type QuestionId = 'rice' | 'capital' | 'polite' | 'supplier';

/** One line of working-out. The words for each live in `data.en.ts`. */
export type StepId =
  | 'rice-per-head'
  | 'rice-times-seven'
  | 'rice-compare'
  | 'rice-shortfall'
  | 'capital-restate'
  | 'capital-trap'
  | 'capital-settle'
  | 'polite-read'
  | 'polite-options'
  | 'polite-hedge'
  | 'polite-spiral'
  | 'supplier-frame'
  | 'supplier-assume'
  | 'supplier-settle';

/** One thing the model ends up saying. The words, again, live in `data.en.ts`. */
export type AnswerId =
  | 'rice-snap'
  | 'rice-partial'
  | 'rice-right'
  | 'rice-full'
  | 'capital-right'
  | 'polite-clean'
  | 'polite-mush'
  | 'supplier-honest'
  | 'supplier-invented';

export interface WorkingStep {
  readonly id: StepId;
  /** What this line costs to produce, and therefore how many passes it is. */
  readonly tokens: number;
}

export interface Outcome {
  readonly id: AnswerId;
  /**
   * The number of completed lines of working from which this answer applies.
   * The first outcome of every question is `0` — there is always something it
   * will say, even with no room at all.
   */
  readonly fromStep: number;
  /** Whether this is an answer you would be happy to have received. */
  readonly good: boolean;
  /** The answer costs passes too. Nothing is produced for free. */
  readonly tokens: number;
}

export interface Question {
  readonly id: QuestionId;
  /** The working it would write, in order, if it had room for all of it. */
  readonly working: readonly WorkingStep[];
  /** Ordered by `fromStep`; the applicable one is the last that fits. */
  readonly outcomes: readonly Outcome[];
}

/**
 * Four questions, chosen so that no two of them reward room to think in the
 * same way. Between them they are the argument: a bigger thinking budget is
 * neither an upgrade nor a waste until you know what is being asked.
 */
export const QUESTIONS: Record<QuestionId, Question> = {
  /**
   * Needs the room. Every line matters, and the one that matters most is the
   * third — the comparison. Stop it after two and it has computed the right
   * quantity and drawn the opposite conclusion from it, which is worse than
   * useless and reads more convincingly than the snap answer did.
   */
  rice: {
    id: 'rice',
    working: [
      { id: 'rice-per-head', tokens: 15 },
      { id: 'rice-times-seven', tokens: 14 },
      { id: 'rice-compare', tokens: 16 },
      { id: 'rice-shortfall', tokens: 13 },
    ],
    outcomes: [
      { id: 'rice-snap', fromStep: 0, good: false, tokens: 10 },
      { id: 'rice-partial', fromStep: 2, good: false, tokens: 14 },
      { id: 'rice-right', fromStep: 3, good: true, tokens: 18 },
      { id: 'rice-full', fromStep: 4, good: true, tokens: 23 },
    ],
  },

  /**
   * Untouched by the room. One outcome, from zero lines of working, so the
   * answer is a fixed string across the whole slider while the bill climbs
   * twelvefold. This is the question the instrument exists for as much as the
   * first one: without it, a reader leaves believing more thinking is always
   * better, which is not true and is expensive to believe.
   */
  capital: {
    id: 'capital',
    working: [
      { id: 'capital-restate', tokens: 10 },
      { id: 'capital-trap', tokens: 14 },
      { id: 'capital-settle', tokens: 10 },
    ],
    outcomes: [{ id: 'capital-right', fromStep: 0, good: true, tokens: 3 }],
  },

  /**
   * Made worse by the room. There is nothing here to work out — the task is a
   * single sentence — so the lines it writes are deliberation about a decision
   * that was never open, and each one adds a hedge to the answer.
   */
  polite: {
    id: 'polite',
    working: [
      { id: 'polite-read', tokens: 14 },
      { id: 'polite-options', tokens: 16 },
      { id: 'polite-hedge', tokens: 18 },
      { id: 'polite-spiral', tokens: 16 },
    ],
    outcomes: [
      { id: 'polite-clean', fromStep: 0, good: true, tokens: 18 },
      { id: 'polite-mush', fromStep: 3, good: false, tokens: 65 },
    ],
  },

  /**
   * Room without the facts. The question cannot be answered from what it was
   * given, and no amount of computation manufactures a price — so the extra
   * lines go on building a case instead, and the honest answer at zero room is
   * the best one on the slider.
   */
  supplier: {
    id: 'supplier',
    working: [
      { id: 'supplier-frame', tokens: 14 },
      { id: 'supplier-assume', tokens: 15 },
      { id: 'supplier-settle', tokens: 14 },
    ],
    outcomes: [
      { id: 'supplier-honest', fromStep: 0, good: true, tokens: 16 },
      { id: 'supplier-invented', fromStep: 3, good: false, tokens: 23 },
    ],
  },
};

/** The order the questions are offered in, hardest first. */
export const QUESTION_IDS: readonly QuestionId[] = [
  'rice',
  'capital',
  'polite',
  'supplier',
];

/** No room at all is a real setting, and it is where the slider starts. */
export const MIN_ROOM = 0;

/**
 * Comfortably past the longest working any of the four would write (64), so
 * that every question has a stretch of slider where more room does nothing
 * whatever. That stretch is half the lesson.
 */
export const MAX_ROOM = 120;

/** Ten at a time: fine enough to find the moment a verdict turns over. */
export const ROOM_STEP = 10;

export const ROOM_SETTINGS: readonly number[] = Array.from(
  { length: MAX_ROOM / ROOM_STEP + 1 },
  (_, index) => index * ROOM_STEP,
);

/**
 * Starts on the question that needs the room, with none of it granted — so the
 * panel opens on a confident wrong answer the reader has to fix themselves.
 * Opening anywhere else hands over the ending.
 */
export const DEFAULT_QUESTION: QuestionId = 'rice';
export const DEFAULT_ROOM = MIN_ROOM;

export function clampRoom(room: number): number {
  const snapped = Math.round(room / ROOM_STEP) * ROOM_STEP;

  return Math.min(MAX_ROOM, Math.max(MIN_ROOM, snapped));
}

export interface Line {
  readonly step: WorkingStep;
  /** False when the budget ran out before this line, or before an earlier one. */
  readonly written: boolean;
  /** Where this line would sit along the budget, written or not. */
  readonly startsAt: number;
  readonly endsAt: number;
}

export interface Run {
  readonly question: Question;
  /** The budget actually in force, after snapping and clamping. */
  readonly room: number;
  readonly lines: readonly Line[];
  /** How many lines of working it managed. */
  readonly written: number;
  /** How many it did not have room for. */
  readonly unwritten: number;
  readonly workingTokens: number;
  readonly answer: Outcome;
  /**
   * Working plus answer. One forward pass per token produced, so this number
   * is both the length of what it wrote and the number of complete journeys
   * through the machine that writing it took.
   */
  readonly passes: number;
  /** Room granted and not used. Costs nothing — an unspent budget is unspent. */
  readonly spare: number;
}

/**
 * What this question costs, and what it ends up saying, at this much room.
 *
 * A line is written only if the whole of it fits, and once one line does not
 * fit, nothing after it is written either — working is a sequence, and a model
 * that ran out of budget stops mid-thought rather than skipping ahead to the
 * cheap parts.
 */
export function runAt(id: QuestionId, room: number): Run {
  const question = QUESTIONS[id];
  const allowed = clampRoom(room);

  let cursor = 0;
  let stopped = false;
  let workingTokens = 0;

  const lines = question.working.map((step) => {
    const startsAt = cursor;
    const endsAt = cursor + step.tokens;
    const written = !stopped && endsAt <= allowed;

    if (written) {
      workingTokens = endsAt;
    } else {
      stopped = true;
    }

    cursor = endsAt;

    return { step, written, startsAt, endsAt };
  });

  const written = lines.filter((line) => line.written).length;

  const answer = question.outcomes.reduce((chosen, outcome) =>
    outcome.fromStep <= written ? outcome : chosen,
  );

  return {
    question,
    room: allowed,
    lines,
    written,
    unwritten: lines.length - written,
    workingTokens,
    answer,
    passes: workingTokens + answer.tokens,
    spare: allowed - workingTokens,
  };
}

/**
 * The first setting at which the verdict stops agreeing with the verdict at no
 * room at all, or `null` where it never does.
 *
 * Deliberately not called `improvesAt`. For one question this is where a wrong
 * answer becomes right; for two others it is where a good answer becomes a bad
 * one. Same slider, same arithmetic, opposite meaning — and a function name
 * that assumed the first case would have quietly argued for it.
 */
export function verdictTurnsAt(id: QuestionId): number | null {
  const opening = runAt(id, MIN_ROOM).answer.good;
  const turned = ROOM_SETTINGS.find(
    (room) => runAt(id, room).answer.good !== opening,
  );

  return turned ?? null;
}

/**
 * The least room at which this question is already doing everything it will
 * ever do. Past here the slider is inert, which is true of all four of them.
 */
export function settlesAt(id: QuestionId): number {
  const settled = runAt(id, MAX_ROOM);
  const found = ROOM_SETTINGS.find((room) => {
    const run = runAt(id, room);

    return (
      run.answer.id === settled.answer.id && run.written === settled.written
    );
  });

  return found ?? MAX_ROOM;
}

/**
 * How many times more passes this setting costs than answering with no room at
 * all. The honest price of thinking, and the number the reader is least likely
 * to have guessed.
 */
export function costMultiple(id: QuestionId, room: number): number {
  return runAt(id, room).passes / runAt(id, MIN_ROOM).passes;
}
