import { describe, expect, it } from 'vitest';

import type { Dials, Film } from './logic';
import {
  agreement,
  bend,
  bestAgreement,
  clampDial,
  clampDials,
  collapse,
  collapsedTotal,
  curveVertices,
  DEFAULT_BEND,
  DEFAULT_DIALS,
  DETECTORS,
  detectorOutput,
  detectorTotal,
  DIAL_STEP,
  DIAL_VALUES,
  FILMS,
  filmTotal,
  MAX_ACTION,
  MAX_DIAL,
  MIN_ACTION,
  MIN_DIAL,
  recommends,
  TRAP_FILM_IDS,
  verdictFor,
  WORKED_DIALS,
} from './logic';

const filmBy = (id: string): Film => {
  const found = FILMS.find((film) => film.id === id);
  if (!found) throw new Error(`no film called ${id}`);
  return found;
};

const trapFilms = (): Film[] => TRAP_FILM_IDS.map((id) => filmBy(id));

/**
 * One sweep of every setting the three dials can take, with the answers the
 * lesson block needs collected on the way through. Done once because it is
 * 68,921 settings and four separate questions.
 */
interface Sweep {
  readonly sixWithBend: Dials[];
  readonly sixWithoutBend: Dials[];
  readonly trapPerfectWithoutBend: Dials[];
  readonly settings: number;
}

let sweptOnce: Sweep | null = null;

function sweep(): Sweep {
  if (sweptOnce) return sweptOnce;

  const sixWithBend: Dials[] = [];
  const sixWithoutBend: Dials[] = [];
  const trapPerfectWithoutBend: Dials[] = [];
  const trap = trapFilms();
  let settings = 0;

  for (const first of DIAL_VALUES) {
    for (const second of DIAL_VALUES) {
      for (const third of DIAL_VALUES) {
        const dials: Dials = [first, second, third];
        settings += 1;

        if (agreement(dials, true) === FILMS.length) sixWithBend.push(dials);
        if (agreement(dials, false) === FILMS.length) {
          sixWithoutBend.push(dials);
        }
        if (
          trap.every((film) => recommends(film, dials, false) === film.watch)
        ) {
          trapPerfectWithoutBend.push(dials);
        }
      }
    }
  }

  sweptOnce = {
    sixWithBend,
    sixWithoutBend,
    trapPerfectWithoutBend,
    settings,
  };
  return sweptOnce;
}

describe('the six films', () => {
  it('gives every film its own name', () => {
    const ids = new Set(FILMS.map((film) => film.id));
    expect(ids.size).toBe(FILMS.length);
  });

  it('keeps every fact on the same nought-to-ten scale', () => {
    for (const film of FILMS) {
      for (const fact of [film.action, film.buzz, film.length]) {
        expect(fact).toBeGreaterThanOrEqual(MIN_ACTION);
        expect(fact).toBeLessThanOrEqual(MAX_ACTION);
      }
    }
  });

  it('asks the reader for both answers, not just one', () => {
    expect(FILMS.some((film) => film.watch)).toBe(true);
    expect(FILMS.some((film) => !film.watch)).toBe(true);
  });
});

describe('clampDial', () => {
  it('refuses to go past either end of the slider', () => {
    expect(clampDial(-9)).toBe(MIN_DIAL);
    expect(clampDial(9)).toBe(MAX_DIAL);
  });

  it('snaps to the resolution the slider actually offers', () => {
    expect(clampDial(0.30000000000000004)).toBe(0.3);
    expect(clampDial(-0.7000000000000001)).toBe(-0.7);
    expect(clampDial(0.44)).toBe(0.4);
  });

  it('cleans all three dials at once', () => {
    expect(clampDials([9, -9, 0.30000000000000004])).toStrictEqual([
      MAX_DIAL,
      MIN_DIAL,
      0.3,
    ]);
  });
});

describe('the dial grid', () => {
  it('runs from one end of the slider to the other in single steps', () => {
    expect(DIAL_VALUES[0]).toBe(MIN_DIAL);
    expect(DIAL_VALUES[DIAL_VALUES.length - 1]).toBe(MAX_DIAL);
    expect(DIAL_VALUES.length).toBe(
      Math.round((MAX_DIAL - MIN_DIAL) / DIAL_STEP) + 1,
    );
  });

  it('carries no floating-point dust', () => {
    for (const value of DIAL_VALUES) {
      expect(clampDial(value)).toBe(value);
    }
  });

  it('includes the setting that switches a neuron off entirely', () => {
    expect(DIAL_VALUES).toContain(0);
  });
});

describe('bend', () => {
  it('reports nothing below zero', () => {
    expect(bend(-3)).toBe(0);
    expect(bend(-0.0001)).toBe(0);
  });

  it('passes anything above zero straight through', () => {
    expect(bend(0)).toBe(0);
    expect(bend(2.75)).toBe(2.75);
  });
});

describe('one tuned neuron', () => {
  it('weighs every fact it is given and adds its own bias', () => {
    const detector = DETECTORS[0];
    const film = filmBy('ninth-signal');

    expect(detectorTotal(detector, film)).toBeCloseTo(
      detector.onAction * film.action +
        detector.onBuzz * film.buzz +
        detector.onLength * film.length +
        detector.bias,
      10,
    );
  });

  it('only differs from its own total when the bend is in and the total is negative', () => {
    for (const detector of DETECTORS) {
      for (const film of FILMS) {
        const raw = detectorTotal(detector, film);
        expect(detectorOutput(detector, film, false)).toBeCloseTo(raw, 10);
        expect(detectorOutput(detector, film, true)).toBeCloseTo(
          Math.max(0, raw),
          10,
        );
      }
    }
  });
});

describe('the machine', () => {
  it('recommends exactly when its total clears the bar', () => {
    for (const film of FILMS) {
      const total = filmTotal(film, WORKED_DIALS, true);
      expect(recommends(film, WORKED_DIALS, true)).toBe(total > 0);
    }
  });

  it('says the same thing today as it said a moment ago', () => {
    const first = filmTotal(filmBy('crater-run'), WORKED_DIALS, true);
    const second = filmTotal(filmBy('crater-run'), WORKED_DIALS, true);
    expect(first).toBe(second);
  });

  it('ignores a dial pushed past the end of its slider', () => {
    const film = filmBy('paper-streets');
    expect(filmTotal(film, [40, -40, 40], true)).toBe(
      filmTotal(film, [MAX_DIAL, MIN_DIAL, MAX_DIAL], true),
    );
  });

  it('recommends nothing at all with every dial at zero', () => {
    for (const film of FILMS) {
      expect(recommends(film, [0, 0, 0], true)).toBe(false);
    }
  });

  it('counts agreement between nothing and all six', () => {
    for (const dials of [DEFAULT_DIALS, WORKED_DIALS, [0, 0, 0] as Dials]) {
      const agreed = agreement(dials, true);
      expect(agreed).toBeGreaterThanOrEqual(0);
      expect(agreed).toBeLessThanOrEqual(FILMS.length);
    }
  });
});

describe('verdictFor', () => {
  it('has a word for every setting the reader can reach', () => {
    for (const dials of [
      DEFAULT_DIALS,
      WORKED_DIALS,
      [0, 0, 0] as Dials,
      [MIN_DIAL, MAX_DIAL, MIN_DIAL] as Dials,
    ]) {
      for (const bendOn of [true, false]) {
        expect(verdictFor(dials, bendOn)).toMatch(
          /^(all-six|more-is-more|nearly|astray)$/,
        );
      }
    }
  });

  it('calls the setting that gets everything right all-six', () => {
    expect(verdictFor(WORKED_DIALS, true)).toBe('all-six');
  });

  it('names the failure the instrument opens on', () => {
    expect(verdictFor(DEFAULT_DIALS, DEFAULT_BEND)).toBe('more-is-more');
  });
});

describe('curveVertices', () => {
  it('starts and ends at the edges of the action scale', () => {
    const points = curveVertices(WORKED_DIALS, true);
    expect(points[0].action).toBe(MIN_ACTION);
    expect(points[points.length - 1].action).toBe(MAX_ACTION);
  });

  it('agrees with the machine at every corner it reports', () => {
    for (const bendOn of [true, false]) {
      for (const point of curveVertices(WORKED_DIALS, bendOn)) {
        expect(point.total).toBeCloseTo(
          filmTotal(
            {
              id: 'ninth-signal',
              action: point.action,
              buzz: filmBy('ninth-signal').buzz,
              length: filmBy('ninth-signal').length,
              watch: true,
            },
            WORKED_DIALS,
            bendOn,
          ),
          10,
        );
      }
    }
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every claim the page makes about this instrument is checked here — including
 * the ones the readout makes on the page — so an edit to the films or to the
 * tuned neurons fails the build instead of quietly turning the surrounding
 * paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('sets a trap that no straight line can get out of', () => {
    const trap = trapFilms();
    expect(trap).toHaveLength(3);

    // Same word of mouth, same running time, action rising: 2, 5, 9.
    expect(new Set(trap.map((film) => film.buzz)).size).toBe(1);
    expect(new Set(trap.map((film) => film.length)).size).toBe(1);
    expect(trap.map((film) => film.action)).toStrictEqual([2, 5, 9]);

    // And the verdicts go no, yes, no — which is the shape a weighted sum of
    // the facts cannot produce, because it is straight in every one of them.
    expect(trap.map((film) => film.watch)).toStrictEqual([false, true, false]);
  });

  it('can be taught the whole taste, but only with the bend in', () => {
    expect(bestAgreement(true)).toBe(FILMS.length);
    expect(agreement(WORKED_DIALS, true)).toBe(FILMS.length);

    // The unit quotes this count. It is also the reason the exercise is fair:
    // the reader is hunting for a region, not for one setting in sixty-nine
    // thousand.
    expect(sweep().sixWithBend).toHaveLength(788);
  });

  it('cannot be taught it at all with the bend out', () => {
    expect(bestAgreement(false)).toBeLessThan(FILMS.length);
    expect(bestAgreement(false)).toBe(FILMS.length - 1);
    expect(sweep().sixWithoutBend).toHaveLength(0);
  });

  it('never gets all three trap films right without the bend, at any setting', () => {
    expect(sweep().settings).toBe(DIAL_VALUES.length ** DETECTORS.length);
    expect(sweep().trapPerfectWithoutBend).toHaveLength(0);
  });

  it('always needs a dial below zero, which is the discovery on offer', () => {
    const winners = sweep().sixWithBend;

    // Every setting that gets all six has the "never lets up" neuron counting
    // AGAINST a film — the machine saying "too much of this" rather than
    // "more of this". Nothing else in the grid works.
    expect(winners.every((dials) => dials[1] < 0)).toBe(true);
    expect(winners.every((dials) => dials[0] > 0)).toBe(true);
    expect(winners.every((dials) => dials[2] > 0)).toBe(true);
  });

  it('opens on a machine that recommends the one film the reader refused', () => {
    const recommended = FILMS.filter((film) =>
      recommends(film, DEFAULT_DIALS, DEFAULT_BEND),
    );

    expect(recommended.map((film) => film.id)).toStrictEqual(['blast-radius']);
    expect(filmBy('blast-radius').watch).toBe(false);
    expect(agreement(DEFAULT_DIALS, DEFAULT_BEND)).toBe(3);
  });

  it('is exactly one weighted sum of the raw facts once the bend is out', () => {
    for (const dials of [
      WORKED_DIALS,
      DEFAULT_DIALS,
      [MIN_DIAL, MAX_DIAL, 0.5] as Dials,
      [-0.3, 1.7, -1.1] as Dials,
    ]) {
      const single = collapse(dials);

      for (const film of FILMS) {
        expect(collapsedTotal(single, film)).toBeCloseTo(
          filmTotal(film, dials, false),
          10,
        );
      }
    }
  });

  it('is not that single neuron while the bend is still in', () => {
    const single = collapse(WORKED_DIALS);
    const differs = FILMS.some(
      (film) =>
        Math.abs(
          collapsedTotal(single, film) - filmTotal(film, WORKED_DIALS, true),
        ) > 1e-6,
    );

    expect(differs).toBe(true);
  });

  it('quotes the four weights the readout prints', () => {
    // The page shows these as -1.42, 0.44, -0.43 and 10.65.
    const single = collapse(WORKED_DIALS);
    expect(single.onAction).toBeCloseTo(-1.422, 6);
    expect(single.onBuzz).toBeCloseTo(0.442, 6);
    expect(single.onLength).toBeCloseTo(-0.434, 6);
    expect(single.bias).toBeCloseTo(10.65, 6);
  });

  it('draws corners with the bend and none without', () => {
    expect(curveVertices(WORKED_DIALS, true)).toHaveLength(4);
    expect(curveVertices(WORKED_DIALS, false)).toHaveLength(2);
  });

  it('draws a line that is straight from end to end without the bend', () => {
    const straight = curveVertices(WORKED_DIALS, false);
    const middle = (MIN_ACTION + MAX_ACTION) / 2;

    expect(
      filmTotal(
        { id: 'ninth-signal', action: middle, buzz: 7, length: 6, watch: true },
        WORKED_DIALS,
        false,
      ),
    ).toBeCloseTo((straight[0].total + straight[1].total) / 2, 10);
  });

  it('loses three of the six the moment the bend comes out', () => {
    expect(agreement(WORKED_DIALS, true)).toBe(6);
    expect(agreement(WORKED_DIALS, false)).toBe(3);
  });
});
