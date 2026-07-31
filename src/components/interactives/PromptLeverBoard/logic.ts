/**
 * Pure logic for PromptLeverBoard (§3.3).
 *
 * The instrument teaches one thing: every prompting technique that works, works
 * by cutting down what could plausibly come next — and the request itself never
 * has to move for that to happen.
 *
 * THREE DIMENSIONS, THREE SETTINGS EACH. A document can be written for one of
 * three readers, in one of three shapes, for one of three purposes, which is
 * twenty-seven documents. Each lever writes one line into the opening, and that
 * line names one setting on one dimension — so it takes the count from
 * twenty-seven to nine, nine to three, three to one. Nothing here is a filter
 * applied on top of the model. The endings that stop fitting stop fitting
 * because they would no longer be plausible continuations of what is written.
 *
 * The three is a scale model and the unit says so. A real space of continuations
 * has no number attached to it at all, and a real clause re-weights that space
 * rather than dividing it. What survives the shrinking is the shape: naming one
 * thing about the document removes every ending that disagrees with it, and the
 * ending that gets written is always the commonest of whatever is left.
 *
 * Nothing here is random and nothing depends on the clock. The same levers
 * produce the same opening, the same count and the same continuation today and
 * in two years, which is what lets the prose, the diagram and the tests all
 * quote the same four numbers.
 */

/** The three things you can say about a document that are not the request. */
export type LeverId = 'who' | 'shape' | 'purpose';

/**
 * Canonical order, used for the toggles, for the bands, and for the order the
 * clauses are written into the opening — so that pulling the same levers in a
 * different order produces a byte-identical document.
 */
export const LEVER_IDS: readonly LeverId[] = ['who', 'shape', 'purpose'];

export type Levers = Record<LeverId, boolean>;

/** A bare request, with nothing said about who, what shape, or what for. */
export const NOTHING_PULLED: Levers = {
  who: false,
  shape: false,
  purpose: false,
};

/** How many ways each dimension could plausibly go. */
export const OPTIONS_PER_DIMENSION = 3;

/** Twenty-seven: three readers, times three shapes, times three purposes. */
export const TOTAL_ENDINGS = OPTIONS_PER_DIMENSION ** LEVER_IDS.length;

/**
 * The setting the pile of text has most of, on every dimension.
 *
 * This is the whole reason a vague opening is not a random one. With a
 * dimension left unsaid, every setting on it is still plausible — and the model
 * does not pick among them, it heads for the commonest. Index 0 on all three is
 * that: unaddressed, one paragraph, no particular use.
 */
export const COMMONEST_OPTION = 0;

/** The setting a lever's clause names, on whichever dimension it speaks to. */
export const NAMED_OPTION = 1;

export function withLever(levers: Levers, id: LeverId, on: boolean): Levers {
  const next: Levers = { ...levers };
  next[id] = on;
  return next;
}

/** Which levers are pulled, always in canonical order. */
export function pulledInOrder(levers: Levers): readonly LeverId[] {
  return LEVER_IDS.filter((id) => levers[id]);
}

/**
 * How many of the twenty-seven endings are still plausible continuations of the
 * opening as it now stands.
 *
 * A dimension nobody has said anything about leaves all three of its settings
 * open; a dimension named in the opening leaves one. Multiply.
 */
export function endingsThatFit(levers: Levers): number {
  return LEVER_IDS.reduce(
    (total, id) => total * (levers[id] ? 1 : OPTIONS_PER_DIMENSION),
    1,
  );
}

/** The endings that have stopped fitting. */
export function ruledOut(levers: Levers): number {
  return TOTAL_ENDINGS - endingsThatFit(levers);
}

/**
 * Which setting on this dimension the model actually writes: the one the
 * opening names if it names one, and otherwise the commonest.
 */
export function writtenOption(levers: Levers, dimension: LeverId): number {
  return levers[dimension] ? NAMED_OPTION : COMMONEST_OPTION;
}

export type OptionState = 'written' | 'possible' | 'ruled-out';

/**
 * What has become of one setting on one dimension.
 *
 * `possible` and `ruled-out` are two different things and the board has to keep
 * them apart: a setting that is still plausible but not the commonest is not
 * the same as one the opening has excluded, and collapsing them would hide
 * exactly what a lever does.
 */
export function optionState(
  levers: Levers,
  dimension: LeverId,
  option: number,
): OptionState {
  if (option === writtenOption(levers, dimension)) return 'written';
  return levers[dimension] ? 'ruled-out' : 'possible';
}

/**
 * The eight states of the board, named. Ordered by a bitmask so that the name
 * is derived from the levers rather than kept in step with them by hand.
 */
const KEY_BY_MASK = [
  'none',
  'who',
  'shape',
  'who+shape',
  'purpose',
  'who+purpose',
  'shape+purpose',
  'who+shape+purpose',
] as const;

export type OutcomeKey = (typeof KEY_BY_MASK)[number];

export const OUTCOME_KEYS: readonly OutcomeKey[] = KEY_BY_MASK;

export function outcomeKey(levers: Levers): OutcomeKey {
  return KEY_BY_MASK[
    (levers.who ? 1 : 0) + (levers.shape ? 2 : 0) + (levers.purpose ? 4 : 0)
  ];
}

/** The levers behind a given outcome — the inverse of `outcomeKey`. */
export function leversFor(key: OutcomeKey): Levers {
  const parts = key === 'none' ? [] : key.split('+');

  return {
    who: parts.includes('who'),
    shape: parts.includes('shape'),
    purpose: parts.includes('purpose'),
  };
}
