import { describe, expect, it } from 'vitest';

import {
  ARROW_IDS,
  ARROWS,
  DEFAULT_WORD_ID,
  MAP_SIZE,
  START_WORD_IDS,
  WORDS,
} from './data.en';
import type { ArrowId } from './data.en';
import {
  arrowById,
  arrowStep,
  clampToMap,
  DEFAULT_PLACE,
  distanceBetween,
  follow,
  JUST_BESIDE,
  landingFor,
  MAP_MAX,
  MAP_MIN,
  nearestWord,
  nearestWords,
  wordById,
  wordExactlyAt,
} from './logic';
import type { Place } from './logic';

/** Where a word sits, or a loud failure — tests should not read `undefined`. */
function place(id: string): Place {
  const word = wordById(id);
  if (!word) throw new Error(`no word called ${id} on the map`);
  return { x: word.x, y: word.y };
}

const names = (from: Place, howMany: number, ignoreId?: string): string[] =>
  nearestWords(from, howMany, ignoreId).map((near) => near.word.id);

describe('the map itself', () => {
  it('names every word once and puts nothing on top of anything else', () => {
    const ids = new Set(WORDS.map((word) => word.id));
    const positions = new Set(
      WORDS.map((word) => `${String(word.x)},${String(word.y)}`),
    );

    expect(ids.size).toBe(WORDS.length);
    expect(positions.size).toBe(WORDS.length);
  });

  it('keeps every word inside the map', () => {
    for (const word of WORDS) {
      expect(word.x).toBeGreaterThanOrEqual(MAP_MIN);
      expect(word.x).toBeLessThanOrEqual(MAP_MAX);
      expect(word.y).toBeGreaterThanOrEqual(MAP_MIN);
      expect(word.y).toBeLessThanOrEqual(MAP_MAX);
      expect(Number.isInteger(word.x)).toBe(true);
      expect(Number.isInteger(word.y)).toBe(true);
    }
  });

  it('can reach every word the controls offer', () => {
    for (const id of [...START_WORD_IDS, DEFAULT_WORD_ID]) {
      expect(wordById(id)).toBeDefined();
    }
  });

  it('measures each arrow between two words that are really there', () => {
    for (const arrow of ARROWS) {
      expect(wordById(arrow.from)).toBeDefined();
      expect(wordById(arrow.to)).toBeDefined();
    }

    expect(ARROWS.map((arrow) => arrow.id)).toEqual([...ARROW_IDS]);
  });

  it('starts the reader on a word rather than in open ground', () => {
    expect(wordExactlyAt(DEFAULT_PLACE)?.id).toBe(DEFAULT_WORD_ID);
  });
});

describe('clampToMap', () => {
  it('stops at both edges', () => {
    expect(clampToMap(-9)).toBe(MAP_MIN);
    expect(clampToMap(MAP_SIZE + 40)).toBe(MAP_MAX);
  });

  it('takes whole steps only', () => {
    expect(clampToMap(12.4)).toBe(12);
    expect(clampToMap(12.6)).toBe(13);
  });
});

describe('distanceBetween', () => {
  it('is zero at the same spot and the same both ways round', () => {
    const king = place('king');
    const queen = place('queen');

    expect(distanceBetween(king, king)).toBe(0);
    expect(distanceBetween(king, queen)).toBeCloseTo(
      distanceBetween(queen, king),
      12,
    );
  });

  it('is the straight line, not the walk along the streets', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('nearestWords', () => {
  it('returns as many as asked for, nearest first', () => {
    const found = nearestWords(place('cat'), 4, 'cat');

    expect(found).toHaveLength(4);
    expect(found.map((near) => near.distance)).toEqual(
      [...found.map((near) => near.distance)].sort((a, b) => a - b),
    );
  });

  it('leaves out the word standing under the marker when asked to', () => {
    expect(names(place('cat'), 3)).toContain('cat');
    expect(names(place('cat'), 3, 'cat')).not.toContain('cat');
  });

  it('asks for nothing gracefully', () => {
    expect(nearestWords(place('cat'), 0)).toHaveLength(0);
  });
});

describe('wordExactlyAt', () => {
  it('knows when the marker is on a word and when it is beside one', () => {
    expect(wordExactlyAt(place('storm'))?.id).toBe('storm');
    expect(wordExactlyAt({ x: 13, y: 54 })).toBeUndefined();
  });
});

describe('arrows', () => {
  it('is no step at all when no arrow is chosen', () => {
    expect(arrowStep('none')).toEqual({ x: 0, y: 0 });
    expect(arrowById('none')).toBeUndefined();
    expect(follow(place('king'), 'none')).toEqual(place('king'));
  });

  it('walks off the edge of the map rather than pretending it did not', () => {
    const head = follow({ x: MAP_MAX, y: MAP_MAX }, 'man-woman');

    expect(head.x).toBeGreaterThan(MAP_MAX);
    expect(head.y).toBeGreaterThan(MAP_MAX);
  });
});

/**
 * The unit's argument, pinned as arithmetic.
 *
 * Every claim the page makes about this instrument is checked here, so that
 * editing the map — moving one word two steps to the left — fails the build
 * rather than quietly turning the surrounding paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('is twenty-five words with two numbers each, as the page says', () => {
    expect(WORDS).toHaveLength(25);

    for (const word of WORDS) {
      expect(Object.keys(word).sort()).toEqual([
        'id',
        'patch',
        'word',
        'x',
        'y',
      ]);
    }
  });

  // LESSON ONE: distance means similarity.
  it('puts every word closest to a word from its own patch of meaning', () => {
    for (const word of WORDS) {
      const closest = nearestWord(word, word.id);

      expect(closest?.word.patch).toBe(word.patch);
    }
  });

  it('reads out the two neighbour lists the unit quotes', () => {
    expect(names(place('kitten'), 3, 'kitten')).toEqual([
      'puppy',
      'cat',
      'dog',
    ]);
    expect(names(place('doctor'), 3, 'doctor')).toEqual([
      'teacher',
      'nurse',
      'engineer',
    ]);
  });

  // LESSON TWO: the direction carries the meaning, and it is ONE direction.
  it('is the same step between every pair it is supposed to join', () => {
    const step = (from: string, to: string): Place => ({
      x: place(to).x - place(from).x,
      y: place(to).y - place(from).y,
    });

    const feminine = arrowStep('man-woman');
    expect(feminine).toEqual(step('man', 'woman'));
    expect(feminine).toEqual(step('boy', 'girl'));
    expect(feminine).toEqual(step('king', 'queen'));
    expect(feminine).toEqual(step('uncle', 'aunt'));
    expect(feminine).toEqual(step('doctor', 'nurse'));

    const grown = arrowStep('puppy-dog');
    expect(grown).toEqual(step('puppy', 'dog'));
    expect(grown).toEqual(step('kitten', 'cat'));
    expect(grown).toEqual(step('boy', 'man'));
    expect(grown).toEqual(step('girl', 'woman'));

    // Two directions that mean different things, and neither is the other.
    expect(feminine).not.toEqual(grown);
  });

  /**
   * The nine landings the unit promises out loud. Every one of them is the
   * reader following an arrow from a word it was never measured at.
   */
  const PROMISED: readonly (readonly [ArrowId, string, string])[] = [
    ['man-woman', 'man', 'woman'],
    ['man-woman', 'boy', 'girl'],
    ['man-woman', 'king', 'queen'],
    ['man-woman', 'uncle', 'aunt'],
    ['man-woman', 'doctor', 'nurse'],
    ['puppy-dog', 'puppy', 'dog'],
    ['puppy-dog', 'kitten', 'cat'],
    ['puppy-dog', 'boy', 'man'],
    ['puppy-dog', 'girl', 'woman'],
  ];

  it('lands exactly on the counterpart every time it is promised to', () => {
    for (const [arrow, from, expected] of PROMISED) {
      const landing = landingFor(place(from), arrow);

      expect(landing.kind).toBe('on');
      expect(landing.nearest?.word.id).toBe(expected);
      expect(landing.stepsAway).toBe(0);
    }
  });

  it('still lands on the counterpart from a step off the word', () => {
    for (const [arrow, from, expected] of PROMISED) {
      const start = place(from);

      for (const dx of [-1, 0, 1]) {
        for (const dy of [-1, 0, 1]) {
          const landing = landingFor(
            { x: start.x + dx, y: start.y + dy },
            arrow,
          );

          expect(landing.nearest?.word.id).toBe(expected);
          expect(landing.kind).not.toBe('nowhere');
        }
      }
    }
  });

  /**
   * The honest half, and the reason the reader is allowed to try the arrow
   * from anywhere. A hand-drawn map could easily be arranged so that every
   * arrow lands on something plausible; this one is arranged so that it lands
   * on nothing at all unless the map really holds that difference.
   */
  it('lands in open ground everywhere the map has no counterpart', () => {
    for (const from of ['queen', 'kitten', 'horse', 'storm', 'engineer']) {
      expect(landingFor(place(from), 'man-woman').kind).toBe('nowhere');
    }

    for (const from of ['man', 'king', 'aunt', 'horse', 'soup']) {
      expect(landingFor(place(from), 'puppy-dog').kind).toBe('nowhere');
    }
  });

  it('often lands nearest the word it set off from, which is the fragile bit', () => {
    for (const from of ['queen', 'kitten', 'horse', 'nurse', 'storm']) {
      expect(landingFor(place(from), 'man-woman').nearest?.word.id).toBe(from);
    }
  });

  it('never lands near enough to a word to read as an analogy by accident', () => {
    const promised = new Set(
      PROMISED.map(([arrow, from]) => `${String(arrow)}:${from}`),
    );

    for (const arrow of ARROW_IDS) {
      for (const word of WORDS) {
        if (promised.has(`${arrow}:${word.id}`)) continue;

        const landing = landingFor(word, arrow);

        expect(landing.kind).toBe('nowhere');
        expect(landing.nearest?.distance ?? 0).toBeGreaterThan(JUST_BESIDE);
      }
    }
  });

  /**
   * The one the unit spends a paragraph on. Real word maps put these two words
   * exactly here, because the writing they were built from did.
   */
  it('carries the prejudice of the writing it stands in for', () => {
    const landing = landingFor(place('doctor'), 'man-woman');

    expect(landing.kind).toBe('on');
    expect(landing.nearest?.word.id).toBe('nurse');
  });
});
