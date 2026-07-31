/**
 * Pure logic for EvalScoreboard (§3.3).
 *
 * The instrument teaches one thing: a change you checked against the case it
 * was reported for has not been checked at all, and the only thing that can
 * tell you what else moved is a fixed set of cases scored on every version.
 *
 * TEN CASES AND FOUR VERSIONS OF ONE INSTRUCTION. The task is queue routing —
 * a message in, one of four labels out — because that is the shape where
 * scoring is beyond argument: the answer either is the label somebody wrote
 * down or it is not, with no judgement in between. Everything the unit says
 * about scoring open text is therefore said in prose rather than smuggled into
 * a toy that quietly assumes it is solved.
 *
 * WHAT IS WRITTEN DOWN HERE. `MISLABELS` records, per version, only the cases
 * that version gets wrong; everything unlisted is answered correctly. That is
 * the honest shape of an authored scale model, and it puts the whole lesson on
 * one screen: the shipped instruction misses one case, the keyword patch fixes
 * that one and breaks three, the second patch repairs two of the three, and
 * the rewrite gets all ten. These are written down, not recorded from a live
 * model, and the unit says so in as many words.
 *
 * Nothing here is random and nothing reads the clock. The same version produces
 * the same ten answers today and in two years, which is what lets the prose,
 * the readout and the tests all quote the same four scores.
 */

/** The four queues a message can be sent to. */
export type Queue = 'refund' | 'replacement' | 'delivery' | 'account';

export const QUEUES: readonly Queue[] = [
  'refund',
  'replacement',
  'delivery',
  'account',
];

/**
 * The cases, in the order they sit in the file.
 *
 * The reported one is first because that is where a real set puts it — every
 * failure anybody complains about becomes the next row, so the file grows from
 * the top of the list of things that have actually gone wrong.
 */
const CASE_ORDER = [
  'mug',
  'tracking',
  'courier',
  'glasses',
  'shade',
  'address',
  'double-charge',
  'late-gift',
  'wrong-item',
  'password',
] as const;

export type CaseId = (typeof CASE_ORDER)[number];

export const CASE_IDS: readonly CaseId[] = CASE_ORDER;

export const TOTAL_CASES = CASE_IDS.length;

/**
 * The known-good answer for every case — the column that costs the most to
 * fill in, because writing it down forces somebody to decide what right means.
 *
 * `double-charge` is the one where that shows. A customer billed twice wants
 * money back, which is a refund, even though the mistake happened in billing.
 * Nobody had to answer that until this file demanded an answer.
 */
export const EXPECTED: Record<CaseId, Queue> = {
  mug: 'refund',
  tracking: 'delivery',
  courier: 'delivery',
  glasses: 'replacement',
  shade: 'replacement',
  address: 'account',
  'double-charge': 'refund',
  'late-gift': 'delivery',
  'wrong-item': 'replacement',
  password: 'account',
};

/** The case that was forwarded in, and the only one anybody was looking at. */
export const REPORTED_CASE: CaseId = 'mug';

/**
 * The four instructions, in the order somebody would have written them: the
 * one already running, two patches, and the rewrite that came of being able to
 * see what the patches did.
 */
const VERSION_ORDER = ['shipped', 'keyword', 'longer', 'rewrite'] as const;

export type VersionId = (typeof VERSION_ORDER)[number];

export const VERSION_IDS: readonly VersionId[] = VERSION_ORDER;

/** Everything is compared against the instruction that is already live. */
export const BASELINE_VERSION: VersionId = 'shipped';

/**
 * What each version gets wrong, and nothing else.
 *
 * Read down the columns rather than across: `shipped` misses one case, and the
 * patch that fixes it introduces three misses that were not there before —
 * every one of them a message containing a word the new rule keys on.
 */
const MISLABELS: Record<VersionId, Partial<Record<CaseId, Queue>>> = {
  // Vague enough that a message opening with a description of an arrival goes
  // to the queue that owns arrivals.
  shipped: { mug: 'delivery' },

  // "Mentions damage, breakage or poor condition" now outranks everything the
  // customer actually asked for.
  keyword: { courier: 'refund', glasses: 'refund', shade: 'refund' },

  // The second patch rescues the two who asked for goods. The one who asked
  // for nothing to be sent is still caught by the first rule.
  longer: { courier: 'refund' },

  rewrite: {},
};

/** Which queue this version of the instruction sends this case to. */
export function answerFor(version: VersionId, id: CaseId): Queue {
  return MISLABELS[version][id] ?? EXPECTED[id];
}

export type Verdict = 'pass' | 'fail';

export function verdictFor(version: VersionId, id: CaseId): Verdict {
  return answerFor(version, id) === EXPECTED[id] ? 'pass' : 'fail';
}

/**
 * What this version did to this case relative to the instruction already
 * running.
 *
 * `fixed` and `broken` are the only two things worth reading off a run, and
 * neither is visible in the score. Two versions can pass the same number of
 * cases and have moved four of them between them.
 */
export type Change = 'unchanged' | 'fixed' | 'broken';

export function changeFor(version: VersionId, id: CaseId): Change {
  const before = verdictFor(BASELINE_VERSION, id);
  const after = verdictFor(version, id);

  if (before === after) return 'unchanged';
  return after === 'pass' ? 'fixed' : 'broken';
}

/**
 * The cases actually being run.
 *
 * With `onlyReported` on, that is one case — the message somebody forwarded in
 * — which is the check almost every change to a prompt ever gets.
 */
export function casesShown(onlyReported: boolean): readonly CaseId[] {
  return onlyReported ? [REPORTED_CASE] : CASE_IDS;
}

export function passCount(version: VersionId): number {
  return CASE_IDS.filter((id) => verdictFor(version, id) === 'pass').length;
}

export function failing(version: VersionId): readonly CaseId[] {
  return CASE_IDS.filter((id) => verdictFor(version, id) === 'fail');
}

export function fixedBy(version: VersionId): readonly CaseId[] {
  return CASE_IDS.filter((id) => changeFor(version, id) === 'fixed');
}

export function brokenBy(version: VersionId): readonly CaseId[] {
  return CASE_IDS.filter((id) => changeFor(version, id) === 'broken');
}

/** Everything the readout needs, counted over the cases actually run. */
export interface Tally {
  readonly shown: number;
  readonly passed: number;
  readonly fixed: number;
  readonly broken: number;
  /** How many of the same cases the instruction already running gets right. */
  readonly baselinePassed: number;
}

export function tallyFor(version: VersionId, onlyReported: boolean): Tally {
  const shown = casesShown(onlyReported);

  return {
    shown: shown.length,
    passed: shown.filter((id) => verdictFor(version, id) === 'pass').length,
    fixed: shown.filter((id) => changeFor(version, id) === 'fixed').length,
    broken: shown.filter((id) => changeFor(version, id) === 'broken').length,
    baselinePassed: shown.filter(
      (id) => verdictFor(BASELINE_VERSION, id) === 'pass',
    ).length,
  };
}
