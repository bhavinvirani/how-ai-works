/**
 * Pure logic for AgentTraceExplorer (§3.3).
 *
 * The instrument teaches one thing: in an agent the next step is not written
 * down anywhere before the run — it is chosen from whatever came back last. So
 * one result, changed, does not adjust the plan. It replaces it.
 *
 * WHY A BRANCH RATHER THAN A TRACE. A trace you can only step through teaches
 * the loop and nothing else; the reader watches a sequence and quietly assumes
 * somebody wrote it. Here the same goal, the same tools and the same first two
 * turns lead to three runs that share not one action after the branch, do not
 * agree on how long the job is, and end three different ways. That is not a
 * claim a paragraph can make stick. It is something the reader does.
 *
 * WHY THE THIRD RESULT COMES BACK EMPTY. Two branches would only show
 * capability — look, it copes. The third is the failure the whole unit is
 * about: the missing reading is replaced by an assumption, every later turn
 * builds on the assumption, and the run ends by sending an email asserting
 * something no tool ever returned. Nothing about that run looks different from
 * the inside, which is exactly why `unsupportedClaims` is computed rather than
 * asserted — the claim that rests on the meter is sound in two runs and
 * fabricated in the third, and only the record can tell you which.
 *
 * EVERYTHING IS FICTIONAL. The shop, the address and the supplier do not
 * exist, so no line here is a claim about a real business.
 *
 * Nothing is random and nothing reads a clock. The same three runs, the same
 * token counts, on every visit — which is what lets the prose and the tests
 * quote the same numbers.
 */

/** What the meter came back with. The one thing the reader changes. */
export type ResultId = 'doubled' | 'flat' | 'missing';

export const RESULT_IDS: readonly ResultId[] = ['doubled', 'flat', 'missing'];

export const DEFAULT_RESULT: ResultId = 'doubled';

/**
 * The tools the agent was handed. Your code owns every one of them; the model
 * can only ask for one by name.
 */
export type ToolId =
  'bill' | 'readings' | 'equipment' | 'tariff' | 'switch' | 'email';

export const TOOL_IDS: readonly ToolId[] = [
  'bill',
  'readings',
  'equipment',
  'tariff',
  'switch',
  'email',
];

/**
 * Tools your code refuses to run without a person saying yes.
 *
 * A list, written by hand, in advance — which is the point. `switch` is on it
 * and `email` is not, and that is not a judgement the model made or could make.
 * It is the reason one run stops short of a reversible tariff change while
 * another sends a letter making a claim nobody checked.
 */
export const HELD_TOOLS: readonly ToolId[] = ['switch'];

export const isHeld = (tool: ToolId): boolean => HELD_TOOLS.includes(tool);

/** One turn of the loop, named so its words can be looked up. */
export type TurnId =
  | 'open'
  | 'meter'
  | 'freezer'
  | 'daily'
  | 'say-freezer'
  | 'rate'
  | 'offers'
  | 'terms'
  | 'switch-held'
  | 'march'
  | 'send-dispute';

/** A separate statement inside whatever the run finished by saying. */
export type ClaimId =
  | 'a-usage'
  | 'a-freezer'
  | 'a-sundays'
  | 'b-usage'
  | 'b-price'
  | 'b-offers'
  | 'b-exit'
  | 'c-march'
  | 'c-april'
  | 'c-estimate';

export interface Claim {
  readonly id: ClaimId;
  /**
   * The turns whose results this statement rests on. A statement resting on a
   * turn that came back with nothing is a statement with nothing behind it,
   * and `claimHolds` is where that is worked out rather than declared.
   */
  readonly restsOn: readonly TurnId[];
}

export interface Turn {
  readonly id: TurnId;
  /** The tool it asked for, or null when it produced an answer instead. */
  readonly tool: ToolId | null;
  /** What this whole turn adds to the text every later turn must read. */
  readonly tokens: number;
  /**
   * Whether this turn put a fact into the record that a later statement could
   * rest on. False for a turn that came back empty, false for a turn your code
   * refused to run, and false for the turn that produced the answer — a
   * receipt and an opinion are not evidence.
   */
  readonly evidence: boolean;
  /** What it finished by saying. Empty on every turn but the last. */
  readonly claims: readonly Claim[];
}

/** The first turn, identical in all three runs. */
const OPEN: Turn = {
  id: 'open',
  tool: 'bill',
  tokens: 95,
  evidence: true,
  claims: [],
};

/**
 * The second turn, also identical in all three runs — same intent, same tool,
 * same call. Only what comes back differs, which is the entire experiment.
 */
const METER: Record<ResultId, Turn> = {
  doubled: {
    id: 'meter',
    tool: 'readings',
    tokens: 110,
    evidence: true,
    claims: [],
  },
  flat: {
    id: 'meter',
    tool: 'readings',
    tokens: 110,
    evidence: true,
    claims: [],
  },
  missing: {
    id: 'meter',
    tool: 'readings',
    // Shorter, because "no reading recorded" is a shorter thing to say than two
    // numbers. The context grows more slowly down the branch that knows less.
    tokens: 72,
    evidence: false,
    claims: [],
  },
};

/** Everything after the branch. No turn here appears in more than one run. */
const AFTER: Record<ResultId, readonly Turn[]> = {
  doubled: [
    {
      id: 'freezer',
      tool: 'equipment',
      tokens: 120,
      evidence: true,
      claims: [],
    },
    { id: 'daily', tool: 'readings', tokens: 105, evidence: true, claims: [] },
    {
      id: 'say-freezer',
      tool: null,
      tokens: 140,
      evidence: false,
      claims: [
        { id: 'a-usage', restsOn: ['meter'] },
        { id: 'a-freezer', restsOn: ['freezer'] },
        { id: 'a-sundays', restsOn: ['daily'] },
      ],
    },
  ],
  flat: [
    { id: 'rate', tool: 'tariff', tokens: 135, evidence: true, claims: [] },
    { id: 'offers', tool: 'tariff', tokens: 125, evidence: true, claims: [] },
    { id: 'terms', tool: 'tariff', tokens: 90, evidence: true, claims: [] },
    {
      id: 'switch-held',
      tool: 'switch',
      tokens: 130,
      evidence: false,
      claims: [
        { id: 'b-usage', restsOn: ['meter'] },
        { id: 'b-price', restsOn: ['rate'] },
        { id: 'b-offers', restsOn: ['offers'] },
        { id: 'b-exit', restsOn: ['terms'] },
      ],
    },
  ],
  missing: [
    { id: 'march', tool: 'readings', tokens: 88, evidence: true, claims: [] },
    {
      id: 'send-dispute',
      tool: 'email',
      tokens: 165,
      evidence: false,
      claims: [
        { id: 'c-march', restsOn: ['march'] },
        // Both of these rest on the meter, and in this run the meter came back
        // with nothing. Same shape as the two sound runs; no support under it.
        { id: 'c-april', restsOn: ['meter'] },
        { id: 'c-estimate', restsOn: ['meter'] },
      ],
    },
  ],
};

const RUNS: Record<ResultId, readonly Turn[]> = {
  doubled: [OPEN, METER.doubled, ...AFTER.doubled],
  flat: [OPEN, METER.flat, ...AFTER.flat],
  missing: [OPEN, METER.missing, ...AFTER.missing],
};

/** Every turn of the run that follows this result, in order. */
export const runFor = (result: ResultId): readonly Turn[] => RUNS[result];

/** How many turns this run takes. Not the same number for any two of them. */
export const stepsIn = (result: ResultId): number => RUNS[result].length;

/** The turn whose result the reader changes. */
export const BRANCH_TURN: TurnId = 'meter';

/**
 * How far into the run the branch sits, counted from zero.
 *
 * Found rather than written down, with a guard, so that inserting a turn ahead
 * of the meter cannot leave the shared prefix and the readout disagreeing.
 */
export const BRANCH_INDEX: number = (() => {
  const found = RUNS.doubled.findIndex((turn) => turn.id === BRANCH_TURN);
  if (found < 0) throw new Error('the branch turn is not in the run');
  return found;
})();

/** Turns every run takes before anything can depend on anything. */
export const SHARED_TURNS = BRANCH_INDEX + 1;

/**
 * One turn on screen to start with.
 *
 * Not the whole run, because the reader has to press the button themselves for
 * "nobody wrote this down" to mean anything — and not zero, because a panel
 * that opens empty reads as broken rather than as an invitation.
 */
export const DEFAULT_TURNS = 1;

/** Keeps a turn count inside this run, which is shorter for some results. */
export function clampTurns(result: ResultId, turns: number): number {
  return Math.min(stepsIn(result), Math.max(1, Math.round(turns)));
}

/** The turns on screen at this setting. */
export function turnsShown(result: ResultId, turns: number): readonly Turn[] {
  return RUNS[result].slice(0, clampTurns(result, turns));
}

/** True once the changed result is on screen and can start mattering. */
export const branchReached = (result: ResultId, turns: number): boolean =>
  clampTurns(result, turns) > BRANCH_INDEX;

/** True when the run has nowhere left to go. */
export const isFinished = (result: ResultId, turns: number): boolean =>
  clampTurns(result, turns) === stepsIn(result);

/**
 * What the model reads before it has done anything at all — the goal, the
 * description of every tool, and the standing instructions.
 */
export const CONTEXT_BEFORE_FIRST = 320;

/**
 * How much text the model reads on the turn at this index.
 *
 * Everything the run has produced so far is in it: its own lines and every
 * result that came back. Nothing is ever taken out, which is why this only
 * goes up.
 */
export function contextAt(result: ResultId, index: number): number {
  const run = RUNS[result];
  const upTo = Math.max(0, Math.min(Math.round(index), run.length));

  let total = CONTEXT_BEFORE_FIRST;
  for (let step = 0; step < upTo; step += 1) total += run[step].tokens;
  return total;
}

/** What is sitting in the context once the run has stopped. */
export const contextAfter = (result: ResultId): number =>
  contextAt(result, stepsIn(result));

/** What the model is reading on the turn currently on screen. */
export const contextNow = (result: ResultId, turns: number): number =>
  contextAt(result, clampTurns(result, turns) - 1);

/**
 * Every token the whole run reads, added up across its turns.
 *
 * The number that surprises people. Each turn re-reads everything before it, so
 * a run of six turns does not cost six times one question — it costs the sum of
 * six growing readings.
 */
export function totalRead(result: ResultId): number {
  let total = 0;
  for (let step = 0; step < stepsIn(result); step += 1) {
    total += contextAt(result, step);
  }
  return total;
}

/** How many single questions this run costs in reading, rounded down. */
export const readingMultiple = (result: ResultId): number =>
  Math.floor(totalRead(result) / CONTEXT_BEFORE_FIRST);

/**
 * The share of the run's biggest reading that this turn reads, 0 to 100.
 *
 * Computed here rather than in the view so that the bar and the number beside
 * it can never come from two different pieces of arithmetic.
 */
export function contextPercent(result: ResultId, index: number): number {
  const largest = contextAt(result, stepsIn(result) - 1);
  return Math.round((contextAt(result, index) / largest) * 100);
}

export type EndingKind = 'answered' | 'held' | 'acted';

/**
 * How the run finished — derived from the last turn rather than written down.
 *
 * A turn asking for no tool is an answer. A turn asking for a tool on the held
 * list never runs, so the run stops there and waits for a person. Anything else
 * ran, and the run finished by doing something in the world.
 */
export function endingKind(result: ResultId): EndingKind {
  const run = RUNS[result];
  const last = run[run.length - 1];

  if (last.tool === null) return 'answered';
  return isHeld(last.tool) ? 'held' : 'acted';
}

/** The separate statements the run finished by making. */
export const endingClaims = (result: ResultId): readonly Claim[] => {
  const run = RUNS[result];
  return run[run.length - 1].claims;
};

/**
 * Whether anything that came back in this run actually supports this statement.
 *
 * False when it rests on nothing at all, and false when it rests on a turn that
 * came back empty — which is the whole difficulty, because from inside the run
 * those two turns look identical. One returned two numbers and one returned a
 * sentence saying there were no numbers, and both are just text in the context.
 */
export function claimHolds(result: ResultId, claim: Claim): boolean {
  const supported = new Set(
    RUNS[result].filter((turn) => turn.evidence).map((turn) => turn.id),
  );

  return (
    claim.restsOn.length > 0 &&
    claim.restsOn.every((turn) => supported.has(turn))
  );
}

/** The statements the run made with nothing behind them. */
export const unsupportedClaims = (result: ResultId): readonly Claim[] =>
  endingClaims(result).filter((claim) => !claimHolds(result, claim));
