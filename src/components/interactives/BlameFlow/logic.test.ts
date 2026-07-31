import { describe, expect, it } from 'vitest';

import {
  backward,
  biggestShare,
  DIAL_IDS,
  DIALS,
  DIALS_ON_THE_INPUT,
  forward,
  missBy,
  movesAnswerByNudging,
  ranked,
  RIDE_IDS,
  RIDES,
  sweepCost,
  THIS_MACHINE,
} from './logic';
import type { DialId, Ride, Share } from './logic';

const shareOf = (ride: Ride, id: DialId): Share => {
  const found = backward(ride).find((share) => share.id === id);

  if (found === undefined) throw new Error(`no dial called ${id}`);

  return found;
};

describe('the machine', () => {
  it('has one dial per link and no spares', () => {
    expect(DIAL_IDS).toHaveLength(6);
    expect(Object.keys(DIALS)).toHaveLength(DIAL_IDS.length);
  });

  it('gets every ride wrong, or there would be nothing to hand out', () => {
    for (const id of RIDE_IDS) {
      expect(missBy(RIDES[id])).not.toBe(0);
    }
  });

  it('is deterministic — the same ride always produces the same guess', () => {
    const ride = RIDES['flat-eight'];

    expect(forward(ride)).toEqual(forward(ride));
    expect(backward(ride)).toEqual(backward(ride));
  });

  it('runs the two middle neurons from the same two numbers', () => {
    const ride = RIDES['hilly-three'];
    const { middleA, middleB, answer } = forward(ride);

    expect(middleA).toBe(
      DIALS['distance-to-a'] * ride.distance + DIALS['hills-to-a'] * ride.hills,
    );
    expect(middleB).toBe(
      DIALS['distance-to-b'] * ride.distance + DIALS['hills-to-b'] * ride.hills,
    );
    expect(answer).toBe(
      DIALS['a-to-answer'] * middleA + DIALS['b-to-answer'] * middleB,
    );
  });
});

describe('backward', () => {
  it('gives every dial a share and leaves none out', () => {
    for (const id of RIDE_IDS) {
      expect(backward(RIDES[id]).map((share) => share.id)).toEqual([
        ...DIAL_IDS,
      ]);
    }
  });

  it('hands out exactly one whole mistake between them', () => {
    for (const id of RIDE_IDS) {
      const total = backward(RIDES[id]).reduce(
        (running, share) => running + share.share,
        0,
      );

      expect(total).toBeCloseTo(1, 10);
    }
  });

  it('ranks by size of blame, largest first', () => {
    for (const id of RIDE_IDS) {
      const sizes = ranked(RIDES[id]).map((share) => Math.abs(share.blame));

      expect(sizes).toEqual([...sizes].sort((left, right) => right - left));
      expect(ranked(RIDES[id])[0]?.id).toBe(biggestShare(RIDES[id]).id);
    }
  });
});

describe('sweepCost', () => {
  it('charges one multiplication per link to run the machine forwards', () => {
    expect(sweepCost(6, 4).forward).toBe(6);
    expect(sweepCost(100, 40).forward).toBe(100);
  });

  it('widens the gap as the machine grows', () => {
    const small = sweepCost(10, 4);
    const large = sweepCost(1000, 400);

    expect(large.nudgeEveryDial / large.backward).toBeGreaterThan(
      small.nudgeEveryDial / small.backward,
    );
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number the page quotes about this instrument is checked here, so a
 * later edit to a dial setting or a ride fails the build instead of quietly
 * turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('works out each dial’s effect the same way brute force does', () => {
    // The claim in one test. `backward` never runs the machine again; the slow
    // method runs it once per dial. They agree to the digit, on every dial of
    // every ride — which is the whole reason anyone is allowed to stop doing
    // it the slow way.
    for (const rideId of RIDE_IDS) {
      const ride = RIDES[rideId];

      for (const share of backward(ride)) {
        expect(share.movesAnswerBy).toBeCloseTo(
          movesAnswerByNudging(ride, share.id),
          10,
        );
        expect(share.movesAnswerBy).toBeCloseTo(
          movesAnswerByNudging(ride, share.id, 0.0001),
          6,
        );
      }
    }
  });

  it('makes each share the effect times the miss, and nothing else', () => {
    for (const rideId of RIDE_IDS) {
      const ride = RIDES[rideId];
      const wrongBy = missBy(ride);

      for (const share of backward(ride)) {
        expect(share.blame).toBeCloseTo(share.movesAnswerBy * wrongBy, 10);
      }
    }
  });

  it('quotes the numbers the prose reads off the 8 km ride', () => {
    const ride = RIDES['flat-eight'];
    const { middleA, middleB, answer } = forward(ride);

    expect([ride.distance, ride.hills]).toEqual([8, 2]);
    expect([middleA, middleB, answer]).toEqual([18, 10, 38]);
    expect(ride.tookMinutes).toBe(26);
    expect(missBy(ride)).toBe(12);

    const top = biggestShare(ride);

    expect(top.id).toBe('a-to-answer');
    expect(top.movesAnswerBy).toBe(18);
    expect(top.blame).toBe(216);
    expect(Math.round(top.share * 100)).toBe(31);

    const smallest = shareOf(ride, 'hills-to-a');

    expect(smallest.movesAnswerBy).toBe(2);
    expect(smallest.blame).toBe(24);
    expect(Math.round(smallest.share * 100)).toBe(3);

    // "nine times as much", which is the sentence the ratio has to survive.
    expect(top.blame).toBe(smallest.blame * 9);
  });

  it('moves the largest share to a different dial on the steep ride', () => {
    const flat = RIDES['flat-eight'];
    const steep = RIDES['hilly-three'];

    expect([steep.distance, steep.hills]).toEqual([3, 9]);
    expect(forward(steep).answer).toBe(39);
    expect(steep.tookMinutes).toBe(45);
    expect(missBy(steep)).toBe(-6);

    const top = biggestShare(steep);

    expect(top.id).toBe('hills-to-b');
    expect(top.movesAnswerBy).toBe(18);
    expect(Math.abs(top.blame)).toBe(108);
    expect(Math.round(top.share * 100)).toBe(29);

    // Same machine, same six dials, different winner — so the share is a fact
    // about the situation and not a property of where a dial sits.
    expect(top.id).not.toBe(biggestShare(flat).id);

    // And it is a dial in the FIRST layer, ahead of both dials on the output.
    expect(Math.abs(top.blame)).toBeGreaterThan(
      Math.abs(shareOf(steep, 'a-to-answer').blame),
    );
    expect(Math.abs(top.blame)).toBeGreaterThan(
      Math.abs(shareOf(steep, 'b-to-answer').blame),
    );
  });

  it('sends every dial the same way, because the miss has one sign', () => {
    // The guess was too long on the flat ride and too short on the steep one,
    // and every dial in this machine pushes the guess upwards — so the whole
    // machine is told to come down, then to go up.
    for (const share of backward(RIDES['flat-eight'])) {
      expect(share.movesAnswerBy).toBeGreaterThan(0);
      expect(share.blame).toBeGreaterThan(0);
    }

    for (const share of backward(RIDES['hilly-three'])) {
      expect(share.movesAnswerBy).toBeGreaterThan(0);
      expect(share.blame).toBeLessThan(0);
    }
  });

  it('doubles the share of the dials feeding the stronger onward link', () => {
    // `b-to-answer` is 2 and `a-to-answer` is 1, so whatever arrives through
    // middle B counts double. Nothing decides this; the multiplication does.
    expect(DIALS['b-to-answer']).toBe(DIALS['a-to-answer'] * 2);

    for (const rideId of RIDE_IDS) {
      const ride = RIDES[rideId];

      expect(shareOf(ride, 'distance-to-b').blame).toBeCloseTo(
        shareOf(ride, 'distance-to-a').blame * 2,
        10,
      );
      expect(shareOf(ride, 'hills-to-b').blame).toBeCloseTo(
        shareOf(ride, 'hills-to-a').blame * 2,
        10,
      );
    }
  });

  it('shrinks every share when the guess is nearly right', () => {
    // The third ride is the control. The machine has not changed and the dials
    // have not changed; only the size of the mistake has.
    const badly = RIDES['flat-eight'];
    const nearly = RIDES['easy-three'];

    expect(missBy(nearly)).toBe(3);
    expect(Math.abs(missBy(nearly))).toBeLessThan(Math.abs(missBy(badly)));

    for (const id of DIAL_IDS) {
      expect(Math.abs(shareOf(nearly, id).blame)).toBeLessThan(
        Math.abs(shareOf(badly, id).blame),
      );
    }
  });

  it('costs about a forward run, against one run per dial the other way', () => {
    // `CountingTheSweeps.astro` writes these three numbers on the page as 6, 8
    // and 42. They are this machine, counted in multiplications.
    expect(THIS_MACHINE.forward).toBe(6);
    expect(THIS_MACHINE.backward).toBe(8);
    expect(THIS_MACHINE.nudgeEveryDial).toBe(42);

    expect(THIS_MACHINE.backward).toBeLessThan(THIS_MACHINE.forward * 2);
    expect(THIS_MACHINE.nudgeEveryDial).toBe(
      THIS_MACHINE.forward * (DIAL_IDS.length + 1),
    );
    expect(DIALS_ON_THE_INPUT).toBe(4);
  });
});
