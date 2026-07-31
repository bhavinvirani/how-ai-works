/**
 * Pure logic for MultiHeadLanes (§3.3).
 *
 * The instrument teaches one thing: a single round of attention can only follow
 * one kind of relationship, so the only way to follow several is to run several
 * rounds at once — and the moment you do, they stop agreeing.
 *
 * NO ARITHMETIC LIVES HERE. Every weight comes from
 * `../shared/attention/logic`, which `AttentionMap` and `OrderBlindness` also
 * read. Three instruments showing visibly the same machine is most of the
 * teaching in this Part, and a second copy of the softmax in this folder would
 * quietly destroy that. What this file adds is the comparison across heads that
 * only this instrument needs.
 *
 * WHY `leansOn` CAN BE NULL. The shared `strongestSource` returns the first
 * position when a row is flat, which for a head with nothing to ask about a
 * word means it reports a confident lean on "The". That is the single most
 * misleading thing this instrument could show, because "three heads have no
 * opinion about this word" is the observation the whole unit rests on. So a
 * flat row is detected and reported as an absence rather than as an answer.
 *
 * Nothing here is random, so "she" is the most-disagreed-about word in this
 * sentence today and in two years — which is what lets the prose, the lead and
 * the tests all quote the same numbers.
 */
import type { Head, Token } from '../shared/attention/logic';
import { attentionRow, HEADS } from '../shared/attention/logic';
import { WORD } from '../shared/attention/sentences.en';

/**
 * The word the panel opens on — not "she", deliberately.
 *
 * "she" is both the answer to the hunt the lead sends the reader on and the
 * word the previous unit spent itself on, so opening there would hand over the
 * ending twice. Opening on "carried" wakes a *different* head from the one the
 * reader just met, which is this unit's whole claim, and leaves the hunt
 * intact. It lives here rather than in the view because the prose quotes it
 * ("It opens on 'carried'"), and anything the prose quotes is pinned.
 */
export const OPENS_ON: number = WORD.carried;

/**
 * The four lanes, in the order they are drawn.
 *
 * Written out rather than derived from `HEADS` so that the ids are a literal
 * union — which is what lets `data.en.ts` hold a `Record<LaneId, …>` with known
 * keys instead of an index signature that could silently be missing a label.
 * `logic.test.ts` pins this list against the shared module, so a head being
 * renamed there fails the build here rather than dropping a lane.
 */
export const LANE_IDS = [
  'reference',
  'doer',
  'subject-matter',
  'previous-word',
] as const;

export type LaneId = (typeof LANE_IDS)[number];

function headBy(id: LaneId): Head {
  const head = HEADS.find((candidate) => candidate.id === id);
  if (!head) {
    throw new Error(`the shared attention module no longer has a head "${id}"`);
  }
  return head;
}

export interface Lane {
  readonly id: LaneId;
  readonly head: Head;
}

export const LANES: readonly Lane[] = LANE_IDS.map((id) => ({
  id,
  head: headBy(id),
}));

/** Below this, two weights in a row are the same number. */
const SAME = 1e-9;

/**
 * Whether a head has nothing to ask about this word.
 *
 * A row is flat when every word gets the identical share, which happens for
 * exactly one reason: every score the head produced was zero, so softmax handed
 * back an even spread. That is not a failure to be hidden — it is what a head
 * built for a different relationship looks like.
 */
export function isFlat(row: readonly number[]): boolean {
  if (row.length === 0) return true;
  return Math.max(...row) - Math.min(...row) < SAME;
}

export interface Reading {
  readonly id: LaneId;
  /** This head's weights for the chosen word, over the whole sentence. */
  readonly weights: readonly number[];
  /** The word it leans on hardest, or `null` when it has no opinion at all. */
  readonly leansOn: number | null;
  /** The share on that word — or the flat share, when there is no opinion. */
  readonly share: number;
}

/** What all four heads make of one word, at once. */
export function readingsFor(
  sentence: readonly Token[],
  index: number,
): Reading[] {
  return LANES.map(({ id, head }) => {
    const weights = attentionRow(sentence, index, head);

    if (isFlat(weights)) {
      return { id, weights, leansOn: null, share: weights[0] ?? 0 };
    }

    let best = 0;
    weights.forEach((weight, position) => {
      if (weight > (weights[best] ?? 0)) best = position;
    });

    return { id, weights, leansOn: best, share: weights[best] ?? 0 };
  });
}

/** The heads that had something to say, in lane order. */
export function headsWithAnOpinion(
  sentence: readonly Token[],
  index: number,
): LaneId[] {
  return readingsFor(sentence, index)
    .filter((reading) => reading.leansOn !== null)
    .map((reading) => reading.id);
}

/**
 * How much attention would have to be picked up and put down somewhere else to
 * turn one reading into the other.
 *
 * Half the total difference, because every unit moved is missing from one place
 * and extra in another, so the raw sum counts each move twice. It runs from 0
 * for two identical readings to 1 for two readings with no overlap at all,
 * which is what makes it a percentage a reader can be handed.
 */
export function gap(left: readonly number[], right: readonly number[]): number {
  const moved = left.reduce(
    (total, weight, position) =>
      total + Math.abs(weight - (right[position] ?? 0)),
    0,
  );

  return moved / 2;
}

/** The widest any two of the four readings of this word get from each other. */
export function disagreement(
  sentence: readonly Token[],
  index: number,
): number {
  const rows = readingsFor(sentence, index).map((reading) => reading.weights);

  let widest = 0;
  for (let a = 0; a < rows.length; a += 1) {
    for (let b = a + 1; b < rows.length; b += 1) {
      widest = Math.max(widest, gap(rows[a] ?? [], rows[b] ?? []));
    }
  }

  return widest;
}

/**
 * The word the four heads are furthest apart on — the thing the lead asks the
 * reader to go and find.
 *
 * Computed rather than written down, so the readout can tell a reader they have
 * found it as a fact about this sentence rather than as a hard-coded answer.
 */
export function widestDisagreement(sentence: readonly Token[]): number {
  let best = 0;
  let widest = -1;

  sentence.forEach((_, index) => {
    const spread = disagreement(sentence, index);
    if (spread > widest) {
      widest = spread;
      best = index;
    }
  });

  return best;
}

/** What each word gets when a head has nothing to ask with: an equal share. */
export function evenShare(sentence: readonly Token[]): number {
  return sentence.length === 0 ? 0 : 1 / sentence.length;
}
