/**
 * Pure logic for ClusterFinder (§3.3).
 *
 * The instrument teaches one thing: with no answer column, a machine can still
 * gather together the rows that resemble each other — but how many groups there
 * are, and what any of them mean, are decisions it cannot make and does not
 * make.
 *
 * Two facts carry that, and both are computed rather than asserted:
 *
 * 1. The machine's own score (how tightly its groups hold together) improves
 *    every single time it is asked for one more group. A number that always
 *    prefers "more" can never answer "how many?".
 * 2. Changing nothing but where the search started can change who ends up with
 *    whom — so the grouping is the machine's invention, not a fact recovered
 *    from the data.
 *
 * Nothing here is random or time-dependent. The three "starting guesses" are
 * three fixed lists of shoppers to begin from, so the same controls always
 * produce the same picture and the prose can quote specific numbers and be
 * right about what the reader will see.
 *
 * The method is the plain one — assign every shopper to the nearest middle,
 * move each middle to the average of what it caught, repeat until nothing
 * changes. It is genuinely what most clustering tools do, so the honesty
 * requirement in §3.3 is met: nothing here has to be unlearned later.
 */

export interface Shopper {
  id: string;
  /** Times they came into the shop last month. */
  visits: number;
  /** What they spent on a typical visit, in pounds. */
  spend: number;
}

/**
 * The widest each measurement is allowed to run, used to put both on one 0–1
 * scale before any distance is measured.
 *
 * This is not tidying-up, it is the buried human decision the unit points at:
 * comparing "two visits apart" with "£20 apart" is meaningless until somebody
 * fixes an exchange rate between them, and dividing each by its full range is
 * one choice among many.
 */
export const MAX_VISITS = 28;
export const MAX_SPEND = 80;

/**
 * Forty-two shoppers, a year of receipts each, reduced to two numbers.
 *
 * Deliberately not three tidy blobs. There are roughly three habits in here,
 * with half a dozen shoppers sitting between them who could honestly be put in
 * either place — which is what makes the answer depend on where the search
 * begins.
 */
export const SHOPPERS: readonly Shopper[] = [
  // Frequent, small baskets: the milk-and-bread trip on the way home.
  { id: 's01', visits: 22, spend: 7 },
  { id: 's02', visits: 19, spend: 9 },
  { id: 's03', visits: 24, spend: 6 },
  { id: 's04', visits: 18, spend: 12 },
  { id: 's05', visits: 21, spend: 11 },
  { id: 's06', visits: 16, spend: 8 },
  { id: 's07', visits: 23, spend: 13 },
  { id: 's08', visits: 20, spend: 6 },
  { id: 's09', visits: 17, spend: 10 },
  { id: 's10', visits: 25, spend: 9 },
  { id: 's11', visits: 15, spend: 13 },
  { id: 's12', visits: 19, spend: 5 },
  { id: 's13', visits: 22, spend: 15 },
  { id: 's14', visits: 18, spend: 7 },

  // Rare, large baskets: the weekly shop that fills the boot.
  { id: 's15', visits: 3, spend: 62 },
  { id: 's16', visits: 4, spend: 71 },
  { id: 's17', visits: 2, spend: 55 },
  { id: 's18', visits: 5, spend: 66 },
  { id: 's19', visits: 3, spend: 48 },
  { id: 's20', visits: 4, spend: 58 },
  { id: 's21', visits: 2, spend: 74 },
  { id: 's22', visits: 6, spend: 52 },
  { id: 's23', visits: 3, spend: 68 },
  { id: 's24', visits: 5, spend: 45 },
  { id: 's25', visits: 4, spend: 63 },
  { id: 's26', visits: 2, spend: 50 },

  // Middling on both counts.
  { id: 's27', visits: 9, spend: 27 },
  { id: 's28', visits: 11, spend: 31 },
  { id: 's29', visits: 8, spend: 22 },
  { id: 's30', visits: 12, spend: 35 },
  { id: 's31', visits: 10, spend: 24 },
  { id: 's32', visits: 7, spend: 33 },
  { id: 's33', visits: 13, spend: 28 },
  { id: 's34', visits: 9, spend: 36 },
  { id: 's35', visits: 11, spend: 20 },
  { id: 's36', visits: 8, spend: 30 },

  // The awkward ones, who sit between two habits and belong to neither.
  { id: 's37', visits: 14, spend: 18 },
  { id: 's38', visits: 7, spend: 42 },
  { id: 's39', visits: 6, spend: 38 },
  { id: 's40', visits: 15, spend: 24 },
  { id: 's41', visits: 12, spend: 44 },
  { id: 's42', visits: 5, spend: 30 },
];

export const MIN_GROUPS = 2;
export const MAX_GROUPS = 6;
export const DEFAULT_GROUPS = 3;

/** Which set of shoppers the search begins from. */
export type StartId = 'a' | 'b' | 'c';

export const START_IDS: readonly StartId[] = ['a', 'b', 'c'];
export const DEFAULT_START: StartId = 'a';

/**
 * Three fixed opening guesses, each a list of shoppers to treat as the first
 * middles. The first `howMany` of a list are used, so every group count gets a
 * different opening from every other start.
 *
 * Real tools pick these at random, which is the same thing minus the ability to
 * reproduce it. Fixing them keeps the instrument deterministic (§3.3) without
 * changing what it demonstrates: the answer moves when the opening moves.
 */
const OPENING_PICKS: Record<StartId, readonly string[]> = {
  a: ['s01', 's15', 's29', 's08', 's22', 's36'],
  b: ['s04', 's10', 's18', 's26', 's34', 's41'],
  c: ['s42', 's21', 's06', 's13', 's31', 's02'],
};

/** Beyond this the shuffling has failed to settle; this data needs seven. */
const MAX_ROUNDS = 40;

/** A shopper's place on the 0–1 chart both measurements are squashed onto. */
interface Spot {
  x: number;
  y: number;
}

export function spotOf(shopper: Shopper): Spot {
  return { x: shopper.visits / MAX_VISITS, y: shopper.spend / MAX_SPEND };
}

const gapBetween = (from: Spot, to: Spot): number =>
  Math.hypot(from.x - to.x, from.y - to.y);

export interface Group {
  /** 1-based. The only name the machine ever has for it. */
  number: number;
  /** The middle of the group, back in the shop's own units. */
  centre: { visits: number; spend: number };
  memberIds: readonly string[];
  /** Average distance from a member to the middle, × 100. Lower is tighter. */
  spread: number;
}

export interface Grouping {
  howMany: number;
  start: StartId;
  groups: readonly Group[];
  /** Shopper id → group number. */
  groupOf: ReadonlyMap<string, number>;
  /** Average distance from a shopper to its own middle, × 100. */
  spread: number;
  /** Rounds of shuffling before nothing moved. */
  rounds: number;
}

/** Nearest middle, ties going to the lower-numbered one so it stays repeatable. */
function nearestCentre(spot: Spot, centres: readonly Spot[]): number {
  let best = 0;
  let bestGap = Number.POSITIVE_INFINITY;

  centres.forEach((centre, index) => {
    const distance = gapBetween(spot, centre);
    if (distance < bestGap - 1e-12) {
      bestGap = distance;
      best = index;
    }
  });

  return best;
}

function averageOf(spots: readonly Spot[]): Spot {
  const total = spots.reduce(
    (running, spot) => ({ x: running.x + spot.x, y: running.y + spot.y }),
    { x: 0, y: 0 },
  );

  return { x: total.x / spots.length, y: total.y / spots.length };
}

/**
 * Group the shoppers, and say what came out.
 *
 * Zero required arguments, matching the zero-required-props contract of the
 * component that calls it.
 */
export function findGroups(
  howMany: number = DEFAULT_GROUPS,
  start: StartId = DEFAULT_START,
): Grouping {
  const spots = SHOPPERS.map(spotOf);
  const spotById = new Map(
    SHOPPERS.map((shopper, i) => [shopper.id, spots[i]]),
  );

  let centres: Spot[] = OPENING_PICKS[start]
    .slice(0, howMany)
    .map((id): Spot => {
      const spot = spotById.get(id);
      if (spot === undefined) {
        throw new Error(`opening pick names no shopper: ${id}`);
      }
      return { ...spot };
    });

  let assignment: number[] = spots.map(() => -1);
  let rounds = 0;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    rounds = round + 1;

    const next = spots.map((spot) => nearestCentre(spot, centres));
    const settled = next.every((group, index) => group === assignment[index]);
    assignment = next;

    // A middle with nobody near it stays where it is. The alternative — moving
    // it somewhere more useful — would be inventing a group rather than finding
    // one, and the tests below check no group ends up empty on this data.
    centres = centres.map((centre, group) => {
      const members = spots.filter((_, index) => assignment[index] === group);
      return members.length === 0 ? centre : averageOf(members);
    });

    if (settled) break;
  }

  const groupOf = new Map<string, number>(
    SHOPPERS.map((shopper, index) => [shopper.id, assignment[index] + 1]),
  );

  const groups: Group[] = centres.map((centre, group) => {
    const memberIndexes = spots
      .map((_, index) => index)
      .filter((index) => assignment[index] === group);

    const totalGap = memberIndexes.reduce(
      (running, index) => running + gapBetween(spots[index], centre),
      0,
    );

    return {
      number: group + 1,
      centre: { visits: centre.x * MAX_VISITS, spend: centre.y * MAX_SPEND },
      memberIds: memberIndexes.map((index) => SHOPPERS[index].id),
      spread:
        memberIndexes.length === 0
          ? 0
          : (totalGap / memberIndexes.length) * 100,
    };
  });

  const spread =
    (spots.reduce(
      (running, spot, index) =>
        running + gapBetween(spot, centres[assignment[index]]),
      0,
    ) /
      spots.length) *
    100;

  return { howMany, start, groups, groupOf, spread, rounds };
}

export function groupNumberOf(grouping: Grouping, shopperId: string): number {
  const number = grouping.groupOf.get(shopperId);
  if (number === undefined) {
    throw new Error(`shopper was never grouped: ${shopperId}`);
  }
  return number;
}

/**
 * Pair up the groups of two groupings by how much they overlap.
 *
 * Needed because group *numbers* mean nothing across two runs: the same pile of
 * shoppers can be group 1 in one and group 3 in the other, and comparing the
 * numbers would report a difference where there is none. Matching on overlap
 * first is what makes "who actually moved" an honest count.
 */
function pairGroups(from: Grouping, to: Grouping): ReadonlyMap<number, number> {
  const overlaps: { fromNumber: number; toNumber: number; shared: number }[] =
    [];

  for (const fromGroup of from.groups) {
    for (const toGroup of to.groups) {
      const shared = fromGroup.memberIds.filter((id) =>
        toGroup.memberIds.includes(id),
      ).length;

      overlaps.push({
        fromNumber: fromGroup.number,
        toNumber: toGroup.number,
        shared,
      });
    }
  }

  overlaps.sort(
    (left, right) =>
      right.shared - left.shared ||
      left.fromNumber - right.fromNumber ||
      left.toNumber - right.toNumber,
  );

  const pairing = new Map<number, number>();
  const claimed = new Set<number>();

  for (const { fromNumber, toNumber } of overlaps) {
    if (pairing.has(fromNumber) || claimed.has(toNumber)) continue;
    pairing.set(fromNumber, toNumber);
    claimed.add(toNumber);
  }

  return pairing;
}

/**
 * Which shoppers ended up in different company, comparing two runs over the
 * same data with the same number of groups.
 */
export function shoppersWhoMoved(from: Grouping, to: Grouping): string[] {
  if (from.groups.length !== to.groups.length) {
    throw new Error('two groupings can only be compared at the same size');
  }

  const pairing = pairGroups(from, to);

  return SHOPPERS.filter(
    (shopper) =>
      pairing.get(groupNumberOf(from, shopper.id)) !==
      groupNumberOf(to, shopper.id),
  ).map((shopper) => shopper.id);
}
