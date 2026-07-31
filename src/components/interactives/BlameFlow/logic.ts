/**
 * Pure logic for BlameFlow (§3.3).
 *
 * The instrument teaches one thing: when an answer comes out wrong, every dial
 * in the machine is told to move, the amount each one is told to move is its
 * SHARE of the mistake, and that share is worked out rather than handed down.
 * A dial that moved the answer a long way gets a large share; a dial that
 * barely touched it gets a small one.
 *
 * A SIX-DIAL MACHINE. Two numbers go in, two middle neurons sit between, one
 * guess comes out. That is the smallest arrangement in which the two things
 * worth seeing are both visible: blame arriving at a middle neuron and then
 * splitting again among the dials that fed it, and the same dial being handed
 * wildly different shares on different examples. Nothing here is a special
 * case of small size — a machine with seventy billion dials runs exactly this
 * arithmetic, once per link, in exactly this order.
 *
 * THE ONE SIMPLIFICATION. A real layer squashes its result before passing it
 * on, which contributes one more multiplication to each chain. Everything else
 * — the order, the sharing, the cost — is identical, and the unit says so in
 * prose rather than hiding it.
 *
 * Nothing is random. Three fixed rides, six fixed dial settings, and integer
 * arithmetic throughout, so `backward(RIDES['flat-eight'])` names the same
 * numbers today and in two years. That is what lets the prose, the diagram and
 * the tests all quote 216 and mean the same 216.
 */

export const DIAL_IDS = [
  'distance-to-a',
  'hills-to-a',
  'distance-to-b',
  'hills-to-b',
  'a-to-answer',
  'b-to-answer',
] as const;

export type DialId = (typeof DIAL_IDS)[number];

/** One number per link. This is the entire machine. */
export type DialSettings = Record<DialId, number>;

/**
 * Where training has got to so far. Part-tuned rather than finished: the
 * guesses have to be wrong for there to be any blame to hand out.
 *
 * `b-to-answer` is deliberately twice `a-to-answer`. That single fact is
 * visible in every result — the two dials feeding middle B are always handed
 * exactly twice the share of their opposite numbers feeding middle A — and it
 * is the cleanest demonstration available that the share is arithmetic rather
 * than judgement.
 */
export const DIALS: DialSettings = {
  'distance-to-a': 2,
  'hills-to-a': 1,
  'distance-to-b': 1,
  'hills-to-b': 1,
  'a-to-answer': 1,
  'b-to-answer': 2,
};

export const RIDE_IDS = ['flat-eight', 'hilly-three', 'easy-three'] as const;

export type RideId = (typeof RIDE_IDS)[number];

export interface Ride {
  readonly id: RideId;
  /** Kilometres. The first number the machine is handed. */
  readonly distance: number;
  /** How hilly the route is, on a scale of 0 to 10. The second number. */
  readonly hills: number;
  /** How long it really took, in minutes. The answer it is judged against. */
  readonly tookMinutes: number;
}

/**
 * Three rides the machine gets wrong in three different ways: badly and too
 * long, moderately and too short, barely at all.
 *
 * The point of having three is that the ranking of the dials changes between
 * them. Same machine, same six dials, different share each time — which is the
 * claim the instrument exists to make.
 */
export const RIDES: Record<RideId, Ride> = {
  'flat-eight': { id: 'flat-eight', distance: 8, hills: 2, tookMinutes: 26 },
  'hilly-three': { id: 'hilly-three', distance: 3, hills: 9, tookMinutes: 45 },
  'easy-three': { id: 'easy-three', distance: 3, hills: 2, tookMinutes: 15 },
};

export interface Forward {
  /** What the first middle neuron works out. */
  readonly middleA: number;
  /** What the second middle neuron works out. */
  readonly middleB: number;
  /** The guess, in minutes. */
  readonly answer: number;
}

/** The machine run the normal way round: numbers in, guess out. */
export function forward(ride: Ride, dials: DialSettings = DIALS): Forward {
  const middleA =
    dials['distance-to-a'] * ride.distance + dials['hills-to-a'] * ride.hills;
  const middleB =
    dials['distance-to-b'] * ride.distance + dials['hills-to-b'] * ride.hills;

  return {
    middleA,
    middleB,
    answer: dials['a-to-answer'] * middleA + dials['b-to-answer'] * middleB,
  };
}

/**
 * How wrong the guess was, in minutes. Positive means the guess was too long.
 *
 * One number for the whole machine, and the only thing the backward sweep
 * starts with.
 */
export function missBy(ride: Ride, dials: DialSettings = DIALS): number {
  return forward(ride, dials).answer - ride.tookMinutes;
}

export interface Share {
  readonly id: DialId;
  /**
   * How many minutes the guess moves if this dial goes up by one, everything
   * else held still. The part that differs from dial to dial.
   */
  readonly movesAnswerBy: number;
  /**
   * `movesAnswerBy` times the miss. Positive means turning this dial up made
   * things worse, so it is told to come down.
   */
  readonly blame: number;
  /** This dial's fraction of all the movement being asked for, 0 to 1. */
  readonly share: number;
}

/**
 * One sweep backwards, handing every dial its share.
 *
 * Written the way a real sweep is written, because the shape is the lesson.
 * It never asks "what does this dial do to the answer" from scratch. It works
 * out ONE number per neuron — how much the guess moves if that neuron's output
 * moves by one — and every dial arriving there reads its own answer off it
 * immediately. For the two dials on the output that number is 1, so their
 * effect is just the middle value they multiply. For the four dials behind
 * them it is the dial they feed into, so their effect is that dial times the
 * input they carry.
 *
 * Note what has to be lying around for any of this: `middleA` and `middleB`,
 * both of which only the forward run knows. That is not an implementation
 * detail — it is why training a model needs far more memory than using one.
 */
export function backward(
  ride: Ride,
  dials: DialSettings = DIALS,
): readonly Share[] {
  const { middleA, middleB } = forward(ride, dials);
  const wrongBy = missBy(ride, dials);

  // One number handed back per middle neuron: how much the guess moves when
  // that neuron's output moves by one. Two multiplications, and the four dials
  // behind them are then free.
  const backToA = dials['a-to-answer'];
  const backToB = dials['b-to-answer'];

  const movesAnswerBy: Record<DialId, number> = {
    'a-to-answer': middleA,
    'b-to-answer': middleB,
    'distance-to-a': backToA * ride.distance,
    'hills-to-a': backToA * ride.hills,
    'distance-to-b': backToB * ride.distance,
    'hills-to-b': backToB * ride.hills,
  };

  const total = DIAL_IDS.reduce(
    (running, id) => running + Math.abs(movesAnswerBy[id] * wrongBy),
    0,
  );

  return DIAL_IDS.map((id) => {
    const blame = movesAnswerBy[id] * wrongBy;

    return {
      id,
      movesAnswerBy: movesAnswerBy[id],
      blame,
      share: total === 0 ? 0 : Math.abs(blame) / total,
    };
  });
}

/** The six shares, largest first. Ties keep the machine's own order. */
export function ranked(
  ride: Ride,
  dials: DialSettings = DIALS,
): readonly Share[] {
  return [...backward(ride, dials)].sort(
    (left, right) => Math.abs(right.blame) - Math.abs(left.blame),
  );
}

/** The dial told to move furthest. Which one that is depends on the ride. */
export function biggestShare(ride: Ride, dials: DialSettings = DIALS): Share {
  return backward(ride, dials).reduce((best, share) =>
    Math.abs(share.blame) > Math.abs(best.blame) ? share : best,
  );
}

/**
 * The slow way to find out what one dial does to the answer: move it, run the
 * whole machine again, and see how far the guess shifted.
 *
 * This is exactly the method backpropagation replaces, and it is here so the
 * tests can check the sweep against it rather than against a copy of its own
 * arithmetic. The answer is a straight line in each dial taken on its own, so
 * the size of the nudge makes no difference to the result — which the tests
 * also check.
 */
export function movesAnswerByNudging(
  ride: Ride,
  id: DialId,
  nudge = 1,
  dials: DialSettings = DIALS,
): number {
  const nudged: DialSettings = { ...dials };
  nudged[id] = dials[id] + nudge;

  return (forward(ride, nudged).answer - forward(ride, dials).answer) / nudge;
}

export interface SweepCost {
  /** Multiplications to run the machine forwards once. */
  readonly forward: number;
  /** Multiplications to sweep every dial's share back out of one wrong guess. */
  readonly backward: number;
  /** Multiplications to get the same shares by nudging each dial in turn. */
  readonly nudgeEveryDial: number;
}

/**
 * What each route to the same six numbers costs, counted in multiplications.
 *
 * Every dial here is one link, so running the machine forwards costs one
 * multiplication per dial. The sweep back costs one per dial to work out that
 * dial's own share, plus one more for every dial that has something behind it
 * to hand a number on to — so a little more than the forward run, never a
 * multiple of it.
 *
 * Nudging each dial in turn costs a whole forward run per dial, plus the
 * original run to compare against. That is the line that grows with the square
 * of the machine while the sweep grows with the machine itself, and it is the
 * entire reason anything deep can be trained.
 */
export function sweepCost(dials: number, dialsOnTheInput: number): SweepCost {
  return {
    forward: dials,
    backward: dials * 2 - dialsOnTheInput,
    nudgeEveryDial: dials * (dials + 1),
  };
}

/** Four of the six dials sit against the input, with nothing behind them. */
export const DIALS_ON_THE_INPUT = 4;

/** The costs the unit and the `CountingTheSweeps` diagram both quote. */
export const THIS_MACHINE: SweepCost = sweepCost(
  DIAL_IDS.length,
  DIALS_ON_THE_INPUT,
);
