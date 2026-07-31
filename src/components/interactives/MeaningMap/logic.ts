/**
 * Pure logic for MeaningMap.
 *
 * The instrument teaches two things, and the second is the one worth the
 * screen space. First: once every word is a position, distance means
 * similarity, and the neighbours of a word are a list nobody wrote. Second: the
 * *directions* mean something too — measure the step from one word to its
 * counterpart, lay that same step down somewhere else on the map, and it lands
 * on that word's counterpart.
 *
 * Everything here is arithmetic on the hand-placed positions in `data.en.ts`.
 * There is no randomness, no clock and no network: the same marker position
 * names the same neighbours today and in two years, which is what lets the
 * unit's prose quote the instrument by name.
 *
 * What deliberately is NOT done here: the landing is never nudged towards a
 * satisfying answer, and the word the arrow started from is never excluded from
 * the answer. Demonstrations of this trick usually do exclude it, quietly, and
 * the unit says so. Leaving it in means the reader can watch the arrow fail
 * honestly — from most words on this map it lands nearest to the word it
 * started from, which is exactly what a real one does.
 */

import { ARROWS, DEFAULT_WORD_ID, MAP_SIZE, WORDS } from './data.en';
import type { ArrowId, MapArrow, MapWord } from './data.en';

/** A position on the map. Two numbers, which is the whole idea. */
export interface Place {
  readonly x: number;
  readonly y: number;
}

/** A word, and how far it is from wherever we asked. */
export interface Neighbour {
  readonly word: MapWord;
  readonly distance: number;
}

export const MAP_MIN = 0;
export const MAP_MAX = MAP_SIZE;

/** Closer than this and the arrow has landed *on* a word, not near it. */
export const EXACTLY_ON = 0.5;

/**
 * Landing this close still counts as hitting the word. It exists for the reader
 * who parks the marker a step off a dot rather than on it — not as slack for
 * the map. No unintended pair on this map lands within it, and a test says so.
 */
export const JUST_BESIDE = 2.5;

const ORIGIN: Place = { x: 0, y: 0 };

/** Both sliders and both axes stop at the edges of the map. */
export function clampToMap(value: number): number {
  return Math.min(MAP_MAX, Math.max(MAP_MIN, Math.round(value)));
}

export function placeAt(x: number, y: number): Place {
  return { x: clampToMap(x), y: clampToMap(y) };
}

/** Ordinary straight-line distance. On this map, that is "how alike". */
export function distanceBetween(from: Place, to: Place): number {
  return Math.hypot(from.x - to.x, from.y - to.y);
}

export function wordById(id: string): MapWord | undefined {
  return WORDS.find((word) => word.id === id);
}

/**
 * The words closest to a position, nearest first.
 *
 * Ties break on the id so that the same position always produces the same list
 * — an instrument that reorders its own readout when nothing changed teaches
 * the reader to distrust it.
 */
export function nearestWords(
  place: Place,
  howMany: number,
  ignoreId?: string,
): readonly Neighbour[] {
  return WORDS.filter((word) => word.id !== ignoreId)
    .map((word) => ({ word, distance: distanceBetween(place, word) }))
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        left.word.id.localeCompare(right.word.id),
    )
    .slice(0, Math.max(0, howMany));
}

export function nearestWord(
  place: Place,
  ignoreId?: string,
): Neighbour | undefined {
  return nearestWords(place, 1, ignoreId).at(0);
}

/** The word the marker is standing on, if it is standing on one. */
export function wordExactlyAt(place: Place): MapWord | undefined {
  return WORDS.find((word) => distanceBetween(place, word) < EXACTLY_ON);
}

export function arrowById(id: ArrowId): MapArrow | undefined {
  return ARROWS.find((arrow) => arrow.id === id);
}

/**
 * The step an arrow is, as a pair of numbers.
 *
 * Worked out from the two words it is named after rather than written down, so
 * the instrument cannot claim a direction the map does not contain. An arrow
 * whose words are missing is no step at all, which keeps this total.
 */
export function arrowStep(id: ArrowId): Place {
  const arrow = arrowById(id);
  if (!arrow) return ORIGIN;

  const from = wordById(arrow.from);
  const to = wordById(arrow.to);
  if (!from || !to) return ORIGIN;

  return { x: to.x - from.x, y: to.y - from.y };
}

/**
 * Where you end up laying an arrow down at a position.
 *
 * Not clamped to the map on purpose. An arrow that walks off the edge has told
 * the reader something true, and pulling it back to the border would invent a
 * landing that is not there.
 */
export function follow(place: Place, id: ArrowId): Place {
  const step = arrowStep(id);
  return { x: place.x + step.x, y: place.y + step.y };
}

export type LandingKind = 'on' | 'beside' | 'nowhere';

export interface Landing {
  readonly head: Place;
  readonly nearest: Neighbour | undefined;
  readonly kind: LandingKind;
  /** The distance a reader is told, in slider steps. */
  readonly stepsAway: number;
}

export function landingFor(place: Place, id: ArrowId): Landing {
  const head = follow(place, id);
  const nearest = nearestWord(head);
  const distance = nearest?.distance ?? Number.POSITIVE_INFINITY;

  const kind: LandingKind =
    distance < EXACTLY_ON
      ? 'on'
      : distance <= JUST_BESIDE
        ? 'beside'
        : 'nowhere';

  return {
    head,
    nearest,
    kind,
    stepsAway: Number.isFinite(distance) ? Math.round(distance) : 0,
  };
}

export const DEFAULT_PLACE: Place = wordById(DEFAULT_WORD_ID) ?? ORIGIN;
export const DEFAULT_ARROW: ArrowId = 'none';
