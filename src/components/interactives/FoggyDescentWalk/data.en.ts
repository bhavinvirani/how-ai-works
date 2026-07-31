/**
 * Words for FoggyDescentWalk. See the header of
 * `../SpamRuleWriter/data.en.ts` for why an instrument that carries its own
 * teaching text keeps its English here rather than in `src/copy/en.ts` or in
 * required props.
 */
import type { Tilt } from './logic';

/**
 * What the ground under the machine's feet is telling it. These are the whole
 * of what it knows about the landscape at any moment, which is why they are
 * written as complete sentences rather than as a direction word — a reader who
 * skims only this line should still get the idea.
 */
export const TILT_SENTENCES: Record<Tilt, string> = {
  'downhill-left':
    'The ground tips down towards the left, so the next step goes left.',
  'downhill-right':
    'The ground tips down towards the right, so the next step goes right.',
  flat: 'The ground here is level. Every direction it can feel goes up, so the walk has stopped.',
};

export const TEXT = {
  startLabel: 'Where the walk begins',
  startDescription:
    'Nothing chooses this. A real model starts from settings picked at random.',

  stepsLabel: 'Steps taken',

  fogLabel: 'Lift the fog',
  fogDescription:
    'Shows the whole landscape at once. No machine ever gets this view — it is here for you, not for it.',

  chartTitle:
    'A landscape of wrongness, and the path the machine has felt its way along so far',

  axisSetting: 'setting of the dial',
  axisWrongness: 'how wrong it is',

  /** Only shown once the fog is lifted, and each is paired with a marker ring. */
  shallowHollow: 'a hollow',
  deepHollow: 'lowest ground anywhere',

  /** Written as functions so whole sentences live here, not at the call site. */
  standing: (wrongness: number) =>
    `Standing at a setting where the wrongness is ${wrongness.toFixed(2)}.`,
  lowestElsewhere: (wrongness: number) =>
    `There is ground at ${wrongness.toFixed(2)} elsewhere on this landscape, and nothing here can feel it from where it is standing.`,
  arrived:
    'This is the lowest ground on the whole landscape. It got there by luck of where it started, not by knowing.',
} as const;
