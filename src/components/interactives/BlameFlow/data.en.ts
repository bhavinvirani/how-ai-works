/**
 * Words for BlameFlow. See the header of `../SpamRuleWriter/data.en.ts` for why
 * an instrument that carries its own teaching text keeps that text here rather
 * than in `src/copy/en.ts` or in required props.
 */
import type { DialId, RideId } from './logic';

const minutes = (value: number): string =>
  `${String(value)} ${value === 1 ? 'minute' : 'minutes'}`;

/**
 * Names for the six dials, in the order a reader would trace them.
 *
 * Written as "distance to middle A" rather than "distance → middle A" so that
 * the list reads the same aloud as it does on screen — the ranking IS the
 * lesson, and a screen reader announcing "right arrow" six times buries it.
 */
export const DIAL_NAMES: Record<DialId, string> = {
  'distance-to-a': 'distance to middle A',
  'hills-to-a': 'hills to middle A',
  'distance-to-b': 'distance to middle B',
  'hills-to-b': 'hills to middle B',
  'a-to-answer': 'middle A to the guess',
  'b-to-answer': 'middle B to the guess',
};

/** Short enough to sit three-across in a segmented control. */
export const RIDE_NAMES: Record<RideId, string> = {
  'flat-eight': '8 km, flat',
  'hilly-three': '3 km, steep',
  'easy-three': '3 km, easy',
};

export const TEXT = {
  rideLabel: 'Which ride it got wrong',

  machineTitle:
    'A machine with six dials. Two numbers about a bike ride go in on the left, two neurons sit in the middle, and a guess at how long the ride took comes out on the right. The number on each line is that dial’s current setting.',

  nodeDistance: 'distance, km',
  nodeHills: 'hills, 0–10',
  nodeMiddleA: 'middle A',
  nodeMiddleB: 'middle B',
  nodeGuess: 'guess, minutes',

  /** Sits under the guess so the second half of every product is on the picture. */
  missTag: (wrongBy: number) =>
    wrongBy >= 0
      ? `${String(wrongBy)} min too long`
      : `${String(-wrongBy)} min too short`,

  /** Written as whole sentences so the claim lives here, not at the call site. */
  situation: (guess: number, took: number, wrongBy: number) =>
    wrongBy >= 0
      ? `The machine guesses ${minutes(guess)}. The ride actually took ${minutes(took)}, so the guess is ${minutes(wrongBy)} too long.`
      : `The machine guesses ${minutes(guess)}. The ride actually took ${minutes(took)}, so the guess is ${minutes(-wrongBy)} too short.`,

  invitation:
    'Six dials, and one of them is about to be told to move further than any of the others. Decide which before you press.',

  biggest: (name: string, percent: string) =>
    `The largest share goes to ${name}, which is handed ${percent} of all the movement the sweep asks for.`,

  allTheSameWay: (wrongBy: number) =>
    wrongBy >= 0
      ? 'Every dial in this machine pushes the guess upwards, and the guess came out too long — so all six are told to come down. Only how far differs.'
      : 'Every dial in this machine pushes the guess upwards, and the guess came out too short — so all six are told to go up. Only how far differs.',

  workingOutKey:
    'Each line underneath reads: how many minutes one notch on that dial would add to the guess, times how many minutes the guess was out, equals its share.',

  workingOut: (movesAnswerBy: number, missSize: number, blameSize: number) =>
    `${String(movesAnswerBy)} × ${String(missSize)} = ${String(blameSize)}`,

  percent: (share: number) => `${String(Math.round(share * 100))}%`,
} as const;
