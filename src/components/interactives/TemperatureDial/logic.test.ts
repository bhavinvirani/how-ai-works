import { describe, expect, it } from 'vitest';

// The formatter is imported rather than reimplemented here on purpose. The
// diagram and the panel both print shares through it, so pinning the strings it
// produces is what stops a change to either the table or the rounding rules
// from quietly turning the numbers written on the page into fiction.
import { share } from './data.en';
import {
  bandFor,
  CANDIDATE_COUNT,
  clampRuns,
  DEFAULT_RUNS,
  DEFAULT_TEMPERATURE,
  distinctSentences,
  favouriteOf,
  FAVOURITE,
  longestReach,
  LONG_SHOT,
  longShotOf,
  MAX_RUNS,
  MAX_TEMPERATURE,
  MIN_RUNS,
  MIN_TEMPERATURE,
  OPENING,
  openingRow,
  PIECES,
  rankOf,
  runsAt,
  SEEDS,
} from './logic';

/** Every setting the slider can actually stop on: 0.1 to 2.0 in tenths. */
const STOPS: readonly number[] = Array.from(
  { length: 20 },
  (_, index) => (index + 1) / 10,
);

/** The shares of a row, in the order the panel prints them. */
const printed = (temperature: number): string[] =>
  openingRow(temperature).map((entry) => share(entry.probability));

/** How much likelier the favourite is than the runner-up. */
const odds = (temperature: number): number => {
  const row = openingRow(temperature);

  return row[0].probability / row[1].probability;
};

describe('the fixed draws', () => {
  it('has one seed per run the reader can uncover', () => {
    expect(SEEDS).toHaveLength(MAX_RUNS);
    expect(MIN_RUNS).toBe(1);
    expect(DEFAULT_RUNS).toBe(MIN_RUNS);
  });

  it('starts the dial between the two ends, not on one of them', () => {
    expect(DEFAULT_TEMPERATURE).toBeGreaterThan(MIN_TEMPERATURE);
    expect(DEFAULT_TEMPERATURE).toBeLessThan(MAX_TEMPERATURE);
  });
});

describe('clampRuns', () => {
  it('always shows at least one run', () => {
    expect(clampRuns(0)).toBe(MIN_RUNS);
    expect(clampRuns(-3)).toBe(MIN_RUNS);
  });

  it('stops at the last seed', () => {
    expect(clampRuns(99)).toBe(MAX_RUNS);
  });

  it('takes whole runs only', () => {
    expect(clampRuns(2.4)).toBe(2);
    expect(clampRuns(2.6)).toBe(3);
  });
});

describe('openingRow', () => {
  it('offers the same five pieces at every setting of the dial', () => {
    for (const heat of STOPS) {
      expect(openingRow(heat)).toHaveLength(CANDIDATE_COUNT);
    }
  });

  it('is deterministic', () => {
    expect(openingRow(0.7)).toEqual(openingRow(0.7));
  });

  it('names the same favourite and the same long shot throughout', () => {
    expect(FAVOURITE).toBe(0);
    expect(LONG_SHOT).toBe(CANDIDATE_COUNT - 1);

    for (const heat of STOPS) {
      const row = openingRow(heat);

      expect(favouriteOf(row).text).toBe('mild');
      expect(longShotOf(row).text).toBe('aubergine');
    }
  });
});

describe('rankOf', () => {
  it('calls the largest share first', () => {
    const row = openingRow(1);

    expect(rankOf(row, FAVOURITE)).toBe(1);
    expect(rankOf(row, LONG_SHOT)).toBe(CANDIDATE_COUNT);
  });
});

describe('runsAt', () => {
  it('shows as many runs as it was asked for, and no more', () => {
    expect(runsAt(1, 1)).toHaveLength(1);
    expect(runsAt(1, 3)).toHaveLength(3);
    expect(runsAt(1, 99)).toHaveLength(MAX_RUNS);
  });

  it('numbers the runs in the order they are uncovered', () => {
    expect(runsAt(1, MAX_RUNS).map((run) => run.number)).toEqual([1, 2, 3, 4]);
  });

  it('adds a run without disturbing the ones already showing', () => {
    expect(runsAt(1, 4).slice(0, 2)).toEqual(runsAt(1, 2));
  });

  it('writes the opening plus one piece per step', () => {
    for (const run of runsAt(1.3, MAX_RUNS)) {
      expect(run.sentence.startsWith(OPENING)).toBe(true);
      expect(run.sentence.split(' ')).toHaveLength(
        OPENING.split(' ').length + PIECES,
      );
    }
  });

  it('reports an opener that really is the first piece of its sentence', () => {
    for (const run of runsAt(1.6, MAX_RUNS)) {
      expect(run.sentence.startsWith(`${OPENING} ${run.opener} `)).toBe(true);
      expect(run.openerRank).toBe(rankOf(openingRow(1.6), run.openerIndex));
    }
  });
});

describe('bandFor', () => {
  it('has a description for every setting the slider can reach', () => {
    for (const heat of STOPS) {
      expect(bandFor(heat)).toMatch(/^(locked|narrow|usual|wide)$/);
    }
  });

  it('calls only the very bottom locked', () => {
    expect(bandFor(MIN_TEMPERATURE)).toBe('locked');
    expect(bandFor(0.2)).toBe('narrow');
  });

  it('calls the default setting the usual one', () => {
    expect(bandFor(DEFAULT_TEMPERATURE)).toBe('usual');
  });

  it('calls the top of the dial wide', () => {
    expect(bandFor(MAX_TEMPERATURE)).toBe('wide');
  });
});

describe('longestReach', () => {
  it('finds nothing while every run is taking the favourite', () => {
    expect(longestReach(runsAt(MIN_TEMPERATURE, MAX_RUNS))).toBeNull();
  });

  it('picks out the run that reached the smallest share', () => {
    const reach = longestReach(runsAt(1, MAX_RUNS));

    expect(reach?.opener).toBe('glorious');
    expect(reach?.openerRank).toBe(4);
  });
});

describe('distinctSentences', () => {
  it('counts one when they all agree', () => {
    expect(distinctSentences(runsAt(MIN_TEMPERATURE, MAX_RUNS))).toBe(1);
  });

  it('counts every different sentence otherwise', () => {
    expect(distinctSentences(runsAt(1, MAX_RUNS))).toBe(MAX_RUNS);
  });
});

/**
 * The unit's argument, pinned as arithmetic rather than as prose.
 *
 * Every number `temperature.mdx` and `GapsNotOpinions.astro` print is checked
 * here, so an edit to the shared table or to the scoring fails the build
 * instead of quietly turning the page into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('never invents, removes or reorders a piece at any setting', () => {
    // The claim the whole unit rests on. Five pieces, in one order, from the
    // bottom of the dial to the top — so nothing temperature does can be
    // described as the model changing its mind about what is likelier.
    for (const heat of STOPS) {
      const row = openingRow(heat);

      expect(row).toHaveLength(CANDIDATE_COUNT);
      expect(row.map((entry) => entry.text)).toEqual([
        'mild',
        'cold',
        'unsettled',
        'glorious',
        'aubergine',
      ]);

      row.forEach((entry, index) => {
        expect(rankOf(row, index)).toBe(index + 1);
        if (index > 0) {
          expect(entry.probability).toBeLessThan(row[index - 1].probability);
        }
      });
    }
  });

  it('turns one fixed gap into eleven hundred times, twice, or 1.4 times', () => {
    // "mild" scored 3.1 and "cold" scored 2.4 — a gap of 0.7 the model produced
    // once and never revises. What the dial decides is what that gap MEANS:
    // the odds between any two pieces are the gap divided by the temperature,
    // and nothing else.
    for (const heat of STOPS) {
      expect(odds(heat)).toBeCloseTo(Math.exp(0.7 / heat), 6);
    }

    expect(odds(MIN_TEMPERATURE)).toBeCloseTo(1096.6, 0);
    expect(odds(1)).toBeCloseTo(2.014, 3);
    expect(odds(MAX_TEMPERATURE)).toBeCloseTo(1.42, 2);

    // The three odds GapsNotOpinions.astro writes under its columns.
    expect(odds(0.5).toFixed(1)).toBe('4.1');
    expect(odds(1).toFixed(1)).toBe('2.0');
    expect(odds(2).toFixed(1)).toBe('1.4');
  });

  it('stops choosing altogether at the bottom of the dial', () => {
    const row = openingRow(MIN_TEMPERATURE);
    const runs = runsAt(MIN_TEMPERATURE, MAX_RUNS);

    expect(favouriteOf(row).probability).toBeGreaterThan(0.999);
    expect(bandFor(MIN_TEMPERATURE)).toBe('locked');
    expect(distinctSentences(runs)).toBe(1);

    for (const run of runs) {
      expect(run.sentence).toBe('The weather today is mild and dry');
      expect(run.opener).toBe('mild');
    }
  });

  it('has the four runs walk down the row at the default setting', () => {
    const runs = runsAt(DEFAULT_TEMPERATURE, MAX_RUNS);

    expect(runs.map((run) => run.opener)).toEqual([
      'mild',
      'cold',
      'unsettled',
      'glorious',
    ]);
    expect(runs.map((run) => run.openerRank)).toEqual([1, 2, 3, 4]);
    expect(distinctSentences(runs)).toBe(4);
  });

  it('prints the fifteen numbers the diagram writes on the page', () => {
    expect(printed(0.5)).toEqual(['77%', '19%', '4%', '0.6%', '0.003%']);
    expect(printed(1)).toEqual(['55%', '27%', '12%', '5%', '0.4%']);
    expect(printed(2)).toEqual(['39%', '28%', '18%', '12%', '3%']);
  });

  it('leaves the bottom piece showing 0 in the row without it ever being 0', () => {
    // The whole reason the panel carries a rounding note. At the default
    // setting the long shot rounds to nothing and is still drawn often enough
    // to matter, which is the difference between "impossible" and "rare".
    for (const heat of STOPS) {
      expect(longShotOf(openingRow(heat)).probability).toBeGreaterThan(0);
    }

    expect(Math.round(longShotOf(openingRow(1)).probability * 100)).toBe(0);
    expect(
      Math.round(longShotOf(openingRow(MAX_TEMPERATURE)).probability * 100),
    ).toBe(3);

    // "about once in every two hundred and seventy presses", which is what the
    // unit says the printed 0 actually costs.
    expect(Math.round(1 / longShotOf(openingRow(1)).probability)).toBe(270);
  });

  it('lifts the long shot nine hundredfold between the two ends of the middle', () => {
    const low = longShotOf(openingRow(0.5)).probability;
    const high = longShotOf(openingRow(2)).probability;

    expect(high / low).toBeGreaterThan(900);
  });

  it('lifts every share except the favourite as the dial goes up', () => {
    const cold = openingRow(0.5);
    const hot = openingRow(2);

    cold.forEach((entry, index) => {
      if (index === FAVOURITE) {
        expect(hot[index].probability).toBeLessThan(entry.probability);
      } else {
        expect(hot[index].probability).toBeGreaterThan(entry.probability);
      }
    });
  });

  it('reaches a piece it rated at almost nothing from 1.1 upward', () => {
    // The lead's promise: push it up and something odd gets through. From here
    // on the fourth draw lands below "glorious", and what it lands on is a word
    // no weather forecast has ever used.
    for (const heat of [1.1, 1.2, 1.4, 1.6, 1.8, 2]) {
      const last = runsAt(heat, MAX_RUNS)[MAX_RUNS - 1];

      expect(last.opener).toBe('aubergine');
      expect(last.openerRank).toBe(CANDIDATE_COUNT);
      // And it carries on from there rather than taking it back — the sentence
      // it writes is a model doing its best with a word it should never have
      // chosen.
      expect(last.sentence).toBe('The weather today is aubergine coloured and');
    }

    expect(share(runsAt(1.2, MAX_RUNS)[MAX_RUNS - 1].openerShare)).toBe('0.8%');
    expect(runsAt(1, MAX_RUNS)[MAX_RUNS - 1].opener).toBe('glorious');
  });

  it('is repeatable, so the page can quote what it wrote', () => {
    expect(runsAt(1.4, MAX_RUNS)).toEqual(runsAt(1.4, MAX_RUNS));
    expect(runsAt(1.4, MAX_RUNS)).not.toEqual(runsAt(0.4, MAX_RUNS));
  });
});
