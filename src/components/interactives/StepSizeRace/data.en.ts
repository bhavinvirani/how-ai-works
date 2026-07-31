/**
 * Words for StepSizeRace. See the header of `../SpamRuleWriter/data.en.ts` for
 * why an instrument that carries its own teaching text keeps that text here
 * rather than in `src/copy/en.ts` or in required props.
 */
import type { Behaviour, RunnerId } from './logic';

/**
 * Neutral names on purpose. A lane called "the one that explodes" would hand
 * over the ending before the reader has pressed anything.
 */
export const LANE_LABELS: Record<RunnerId, string> = {
  tiny: 'A very small step',
  yours: 'Your step',
  huge: 'A very large step',
};

/**
 * What the picture in each lane amounts to, in words — because the lane
 * drawings are `aria-hidden` and these sentences are the whole of what a
 * screen reader gets. They are also the second cue that stops the colour of a
 * trail from being the only thing carrying meaning (hard rule 9).
 */
export const VERDICTS: Record<Behaviour, string> = {
  waiting: 'Standing at the start. Nothing has moved yet.',
  crawling:
    'Going the right way, and still not there. It would arrive eventually — long after anyone stopped paying for the machine time.',
  settled:
    'Down at the bottom and staying there. This is what working looks like.',
  bouncing:
    'It overshoots every time and lands the same height up the far side, then does it again. Busy, and going nowhere.',
  diverging:
    'Every overshoot is worse than the one before, so it is climbing rather than descending. A few more steps and it is off the hill entirely.',
};

export const TEXT = {
  stepSizeLabel: 'Step size for your runner',
  stepSizeDescription:
    'How far a runner moves for a given steepness of ground. The two rivals keep their own fixed sizes.',
  stepsLabel: 'Steps taken',

  /** Written as functions so whole phrases live here, not at the call site. */
  stepSizeValue: (size: number) => `step size ${size.toFixed(2)}`,

  standing: (percent: number) =>
    percent < 1
      ? 'Your runner is at the bottom, with under 1% of the wrongness it started with.'
      : `Your runner still carries ${percent.toFixed(0)}% of the wrongness it started with.`,
  standingWorse:
    'Your runner is now further from the bottom than when it set off. It is getting worse, not better.',
  standingWaiting:
    'Nobody has moved yet. Add a step and watch the three of them.',

  ahead: (label: string) =>
    `Lowest down the hill so far: ${label.toLowerCase()}.`,
  nobodyLeft: 'Nobody is left on the hill.',
} as const;
