/**
 * The map itself, and the words for it.
 *
 * WHY THE COORDINATES LIVE HERE rather than in `logic.ts`. Everything in this
 * file is English. Change the language and every word changes, which means
 * every position changes with it — a French map is a different map, not the
 * same map with the labels swapped. So the whole hand-drawn thing sits in the
 * locale file, and `logic.ts` holds only arithmetic that would survive the
 * translation.
 *
 * HOW HONEST IS IT. These twenty-five positions were placed by hand. A real map
 * is learned, has hundreds of numbers per word rather than two, and cannot be
 * drawn on a page at all. What is faithful here is the *shape* of the thing:
 * words that keep similar company sit near each other, and the step from one
 * word to its counterpart is the same step everywhere it applies. The unit says
 * all of this out loud rather than letting the picture imply otherwise.
 *
 * The `doctor` and `nurse` placement is deliberate and is not a joke. Word maps
 * built from real text put those two words exactly where this one does, for the
 * same reason — the writing they read used them that way. Moving them somewhere
 * flattering would make the instrument lie about the thing it is for.
 *
 * Nothing in here may be edited casually: `logic.test.ts` pins the nine
 * landings the unit's prose promises, and pins that no *other* pair of words
 * lands close enough to read like one.
 */

/** Both axes run from 0 to this. Positions are whole numbers, so is the slider. */
export const MAP_SIZE = 60;

/** Which patch of meaning a word belongs to. Never rendered; the tests use it. */
export type PatchId = 'people' | 'animals' | 'jobs' | 'kitchen' | 'weather';

export interface MapWord {
  /** Stable id, which for this map is the word itself. */
  readonly id: string;
  /** What is drawn on the map. */
  readonly word: string;
  readonly x: number;
  readonly y: number;
  /**
   * The patch this word was placed in. The instrument never shows it — it is
   * here so a test can say "every word's closest neighbour comes from its own
   * patch" and have that mean something.
   */
  readonly patch: PatchId;
}

/**
 * Twenty-five words. Five patches, and a distance between any two words that is
 * meant to be read as "how alike are these".
 *
 * Two steps repeat across the whole map, and they are the reason it exists:
 * (+5, +7) turns a word into its feminine counterpart wherever the map has one,
 * and (+8, −4) turns a young thing into a grown one. Neither step is written
 * down anywhere in the code. Both are simply the difference between two dots,
 * which is exactly the status they have in a real map.
 */
export const WORDS: readonly MapWord[] = [
  { id: 'boy', word: 'boy', x: 12, y: 18, patch: 'people' },
  { id: 'girl', word: 'girl', x: 17, y: 25, patch: 'people' },
  { id: 'man', word: 'man', x: 20, y: 14, patch: 'people' },
  { id: 'woman', word: 'woman', x: 25, y: 21, patch: 'people' },
  { id: 'uncle', word: 'uncle', x: 25, y: 31, patch: 'people' },
  { id: 'aunt', word: 'aunt', x: 30, y: 38, patch: 'people' },
  { id: 'king', word: 'king', x: 36, y: 17, patch: 'people' },
  { id: 'queen', word: 'queen', x: 41, y: 24, patch: 'people' },

  { id: 'puppy', word: 'puppy', x: 36, y: 50, patch: 'animals' },
  { id: 'dog', word: 'dog', x: 44, y: 46, patch: 'animals' },
  { id: 'kitten', word: 'kitten', x: 34, y: 57, patch: 'animals' },
  { id: 'cat', word: 'cat', x: 42, y: 53, patch: 'animals' },
  { id: 'horse', word: 'horse', x: 54, y: 47, patch: 'animals' },

  { id: 'teacher', word: 'teacher', x: 37, y: 4, patch: 'jobs' },
  { id: 'doctor', word: 'doctor', x: 44, y: 6, patch: 'jobs' },
  { id: 'nurse', word: 'nurse', x: 49, y: 13, patch: 'jobs' },
  { id: 'engineer', word: 'engineer', x: 54, y: 4, patch: 'jobs' },

  { id: 'bread', word: 'bread', x: 2, y: 3, patch: 'kitchen' },
  { id: 'soup', word: 'soup', x: 10, y: 2, patch: 'kitchen' },
  { id: 'kettle', word: 'kettle', x: 3, y: 10, patch: 'kitchen' },
  { id: 'spoon', word: 'spoon', x: 10, y: 9, patch: 'kitchen' },

  { id: 'rain', word: 'rain', x: 4, y: 46, patch: 'weather' },
  { id: 'cloud', word: 'cloud', x: 4, y: 54, patch: 'weather' },
  { id: 'storm', word: 'storm', x: 12, y: 54, patch: 'weather' },
  { id: 'umbrella', word: 'umbrella', x: 12, y: 46, patch: 'weather' },
];

export const ARROW_IDS = ['man-woman', 'puppy-dog'] as const;

/** `none` is a real state, not a missing one: it is where the reader starts. */
export type ArrowId = 'none' | (typeof ARROW_IDS)[number];

export interface MapArrow {
  readonly id: (typeof ARROW_IDS)[number];
  /** Named after the two dots it was measured between, never after what it means. */
  readonly label: string;
  readonly from: string;
  readonly to: string;
}

/**
 * An arrow is a pair of words and nothing else. The step itself is worked out
 * from where those two words sit, so there is no way to write down a direction
 * the map does not actually contain.
 */
export const ARROWS: readonly MapArrow[] = [
  { id: 'man-woman', label: 'man → woman', from: 'man', to: 'woman' },
  { id: 'puppy-dog', label: 'puppy → dog', from: 'puppy', to: 'dog' },
];

/**
 * The words the reader can jump to in one press.
 *
 * Hunting for a dot with two sliders is a puzzle about sliders, and the lesson
 * is not about sliders. These five are the starts worth trying: one of them is
 * the famous one, one of them is the uncomfortable one, and one of them works
 * for both arrows.
 */
export const START_WORD_IDS: readonly string[] = [
  'boy',
  'king',
  'uncle',
  'doctor',
  'kitten',
];

/** Where the marker sits before the reader touches anything. */
export const DEFAULT_WORD_ID = 'king';

const steps = (count: number): string =>
  count === 1 ? '1 step' : `${String(count)} steps`;

export const TEXT = {
  acrossLabel: 'Marker position, left to right',
  upLabel: 'Marker position, bottom to top',
  /** The value is the coordinate itself, because the coordinate is the point. */
  coordinate: (value: number) => String(value),

  startLabel: 'Drop the marker on a word',
  arrowLabel: 'Arrow to follow from the marker',
  arrowNone: 'none',

  onWord: (word: string) => `The marker is sitting on “${word}”.`,
  betweenWords: (x: number, y: number) =>
    `The marker is at ${String(x)} across and ${String(y)} up, where no word lives.`,

  neighbours: (words: readonly string[]) =>
    `Nearest words from here: ${words.join(', ')}.`,

  landedOn: (arrow: string, word: string) =>
    `The ${arrow} arrow, laid down from here, ends exactly on “${word}”.`,

  landedBeside: (arrow: string, word: string, away: number) =>
    `The ${arrow} arrow, laid down from here, ends just beside “${word}” — ${steps(away)} off.`,

  landedNowhere: (arrow: string, word: string, away: number) =>
    `The ${arrow} arrow, laid down from here, ends in open ground. The closest word is “${word}”, and it is ${steps(away)} away, which is another way of saying the map has no counterpart for this one.`,

  note: 'Twenty-five words, two numbers each, all of them placed by hand. A real map is learned rather than drawn, holds hundreds of numbers per word instead of two, and cannot be put on a page at all.',

  fallbackCaption:
    'The step from “man” to “woman” is measured once, then laid down again starting at “king” — same length, same direction, a part of the map it was never measured in — and it ends on “queen”. Laid down at “uncle” it ends on “aunt”, and at “doctor” it ends on “nurse”.',
} as const;
