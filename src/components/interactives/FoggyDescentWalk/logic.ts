/**
 * Pure logic for FoggyDescentWalk (§3.3).
 *
 * The instrument teaches one thing: a learning machine never sees where the
 * good settings are. It reads the slope of the ground it is standing on, takes
 * one step downhill, and repeats — so where it ends up depends on where it
 * happened to begin.
 *
 * ONE dial rather than a billion. The landscape of a real model has a
 * dimension per parameter and cannot be drawn at all, which is exactly why a
 * one-dial version is worth showing: it is the only version anybody can look
 * at, and every claim made about it survives the jump upward untouched.
 *
 * Nothing here is random. The terrain is a fixed formula and the walk is
 * deterministic, so `walk(0.44, 24)` names the same eight decimal places today
 * and in two years — which is what lets the prose say "start at 0.44 and you
 * end up in the shallow hollow" and stay true.
 */

/** One scooped-out dip in the terrain. */
export interface Hollow {
  /** Where its floor sits along the dial. */
  readonly centre: number;
  /** How far it is scooped out. Bigger means a lower floor. */
  readonly depth: number;
  /** How wide the scoop is. Bigger means gentler sides. */
  readonly width: number;
}

/**
 * Two hollows of deliberately unequal depth, far enough apart that a ridge
 * stands between them.
 *
 * The shallow one is the entire point. Without it the walk always arrives
 * somewhere excellent and the reader learns that downhill always works, which
 * is the opposite of true.
 */
export const HOLLOWS: readonly Hollow[] = [
  { centre: 0.26, depth: 0.42, width: 0.09 },
  { centre: 0.74, depth: 0.9, width: 0.13 },
];

/** Wrongness on the untouched high ground, before any hollow is subtracted. */
const PLATEAU = 1;

/** A gentle overall lean, so the terrain is not symmetric and dull. */
const LEAN = 0.06;

/** The dial cannot be turned past its stops. */
export const MIN_SETTING = 0.02;
export const MAX_SETTING = 0.98;

/**
 * How far one step moves for each unit of slope.
 *
 * Fixed on purpose. How big a step to take is a whole question of its own, and
 * handing the reader that control here would quietly make this instrument about
 * step size instead of about fog.
 */
export const STEP_SIZE = 0.012;

/** Below this, the ground is level enough that a step goes nowhere visible. */
const FLAT_ENOUGH = 0.01;

/**
 * How far the dial moves per notch when a reader chooses a starting point.
 * Coarse enough that the two sides of the ridge are one keypress apart.
 */
export const SETTING_INCREMENT = 0.02;

/**
 * The most steps worth offering. The slowest start on this terrain comes to
 * rest on step 21, so nothing is ever cut off mid-walk — which matters, because
 * a walk that stops because the counter ran out teaches the wrong lesson.
 */
export const MAX_STEPS = 24;

const bump = (hollow: Hollow, setting: number): number =>
  Math.exp(-((setting - hollow.centre) ** 2) / (2 * hollow.width ** 2));

/**
 * How wrong the machine is at one setting of its single dial — the height of
 * the ground under that setting.
 */
export function wrongnessAt(
  setting: number,
  hollows: readonly Hollow[] = HOLLOWS,
): number {
  return hollows.reduce(
    (total, hollow) => total - hollow.depth * bump(hollow, setting),
    PLATEAU + LEAN * setting,
  );
}

/**
 * How steeply the ground tips at one setting, and which way.
 *
 * Positive means the ground rises to the right, so downhill is left. This is
 * the only thing the machine is ever told about the landscape, which is why it
 * is worked out exactly rather than by sampling nearby points.
 */
export function slopeAt(
  setting: number,
  hollows: readonly Hollow[] = HOLLOWS,
): number {
  return hollows.reduce(
    (total, hollow) =>
      total +
      ((hollow.depth * (setting - hollow.centre)) / hollow.width ** 2) *
        bump(hollow, setting),
    LEAN,
  );
}

/** What the ground under the machine's feet feels like, in words not numbers. */
export type Tilt = 'downhill-left' | 'downhill-right' | 'flat';

export function tiltAt(
  setting: number,
  hollows: readonly Hollow[] = HOLLOWS,
): Tilt {
  const slope = slopeAt(setting, hollows);

  if (Math.abs(slope) < FLAT_ENOUGH) return 'flat';
  return slope > 0 ? 'downhill-left' : 'downhill-right';
}

/**
 * One step. Move against the slope, by an amount proportional to how steep it
 * is, and never off the ends of the dial.
 *
 * That proportionality is not a detail: it is why the walk slows to a halt as
 * the ground levels out, instead of pacing back and forth across the floor of
 * the hollow forever.
 */
export function stepDownhill(
  setting: number,
  stepSize: number = STEP_SIZE,
  hollows: readonly Hollow[] = HOLLOWS,
): number {
  const moved = setting - stepSize * slopeAt(setting, hollows);

  return Math.min(MAX_SETTING, Math.max(MIN_SETTING, moved));
}

/**
 * Every setting the machine stands on, starting position included, so the
 * result of `steps` steps always has `steps + 1` entries.
 */
export function walk(
  start: number,
  steps: number,
  stepSize: number = STEP_SIZE,
  hollows: readonly Hollow[] = HOLLOWS,
): number[] {
  const count = Math.max(0, Math.round(steps));
  const visited = [Math.min(MAX_SETTING, Math.max(MIN_SETTING, start))];

  for (let taken = 0; taken < count; taken += 1) {
    visited.push(stepDownhill(visited[visited.length - 1], stepSize, hollows));
  }

  return visited;
}

export interface Place {
  readonly setting: number;
  readonly wrongness: number;
}

/**
 * The best setting on a stretch of the dial, found by trying a thousand of them
 * and keeping the winner.
 *
 * This is the search the machine cannot afford — one dial and one thousand
 * tries is nothing, a billion dials and a thousand tries each is more
 * arithmetic than there are atoms to do it with. It exists here so the readout
 * can tell the reader, as a fact rather than a hint, that the walk stopped
 * somewhere higher than the lowest ground.
 */
export function lowestPoint(
  from: number = MIN_SETTING,
  to: number = MAX_SETTING,
  hollows: readonly Hollow[] = HOLLOWS,
): Place {
  const samples = 1000;
  let best: Place = { setting: from, wrongness: wrongnessAt(from, hollows) };

  for (let index = 1; index <= samples; index += 1) {
    const setting = from + ((to - from) * index) / samples;
    const wrongness = wrongnessAt(setting, hollows);

    if (wrongness < best.wrongness) best = { setting, wrongness };
  }

  return best;
}

/** The floor of the deeper hollow. Computed once; the terrain never changes. */
export const LOWEST_POINT: Place = lowestPoint();

/** Whether the walk has arrived at the lowest ground there is, not merely at some. */
export function hasFoundTheLowest(setting: number): boolean {
  return wrongnessAt(setting) - LOWEST_POINT.wrongness < 0.02;
}
