import { describe, expect, it } from 'vitest';

import {
  candidatesFor,
  clampTemperature,
  generate,
  likeliest,
  makeRng,
  MAX_TEMPERATURE,
  MIN_TEMPERATURE,
  OPENING,
  pickIndex,
  sentenceOf,
  withTemperature,
  WRITTEN_CONTEXTS,
} from './logic';

const sum = (values: readonly number[]) =>
  values.reduce((total, value) => total + value, 0);

describe('the continuation table', () => {
  it('offers something to write after every context it knows', () => {
    for (const context of WRITTEN_CONTEXTS) {
      expect(candidatesFor(context).length).toBeGreaterThan(1);
    }
  });

  it('never runs out, even off the written paths', () => {
    expect(candidatesFor('something nobody wrote down').length).toBeGreaterThan(
      0,
    );
  });

  it('keys on everything written, not just the last word', () => {
    // Both contexts end in "and". If the table were keyed on the last word they
    // would be the same row — and "the model re-reads the whole thing" would be
    // quietly false.
    const afterMild = candidatesFor('The weather today is mild and');
    const afterCold = candidatesFor('The weather today is cold and');

    expect(afterMild.map((c) => c.text)).not.toEqual(
      afterCold.map((c) => c.text),
    );
  });
});

describe('clampTemperature', () => {
  it('refuses a temperature of zero, which would divide by nothing', () => {
    expect(clampTemperature(0)).toBe(MIN_TEMPERATURE);
    expect(clampTemperature(-3)).toBe(MIN_TEMPERATURE);
  });

  it('stops at the top of the dial', () => {
    expect(clampTemperature(99)).toBe(MAX_TEMPERATURE);
  });
});

describe('withTemperature', () => {
  it('has nothing to say about an empty row', () => {
    expect(withTemperature([], 1)).toEqual([]);
  });

  it('always produces a row that sums to one', () => {
    for (const heat of [0.1, 0.35, 0.7, 1, 1.4, 2]) {
      for (const context of WRITTEN_CONTEXTS) {
        const row = withTemperature(candidatesFor(context), heat);
        expect(sum(row.map((entry) => entry.probability))).toBeCloseTo(1, 12);
      }
    }
  });

  it('is deterministic', () => {
    const once = withTemperature(candidatesFor(OPENING), 0.8);
    const twice = withTemperature(candidatesFor(OPENING), 0.8);
    expect(once).toEqual(twice);
  });

  it('survives the bottom of the dial without overflowing', () => {
    const row = withTemperature(candidatesFor(OPENING), MIN_TEMPERATURE);
    expect(row.every((entry) => Number.isFinite(entry.probability))).toBe(true);
    expect(sum(row.map((entry) => entry.probability))).toBeCloseTo(1, 12);
  });
});

describe('pickIndex', () => {
  it('lands on the first piece for a draw of zero', () => {
    const row = withTemperature(candidatesFor(OPENING), 1);
    expect(pickIndex(row, 0)).toBe(0);
  });

  it('stays inside the row for a draw at the very top', () => {
    const row = withTemperature(candidatesFor(OPENING), 1);
    expect(pickIndex(row, 0.999999999)).toBeLessThan(row.length);
    expect(pickIndex(row, 1)).toBe(row.length - 1);
  });

  it('gives each piece a slice the size of its probability', () => {
    const row = withTemperature(candidatesFor(OPENING), 1);
    const draws = 20000;
    const counts = row.map(() => 0);

    for (let i = 0; i < draws; i += 1) {
      counts[pickIndex(row, (i + 0.5) / draws)] += 1;
    }

    row.forEach((entry, index) => {
      expect(counts[index] / draws).toBeCloseTo(entry.probability, 3);
    });
  });
});

describe('makeRng', () => {
  it('is repeatable from a seed', () => {
    const a = makeRng(7);
    const b = makeRng(7);
    for (let i = 0; i < 20; i += 1) expect(a()).toBe(b());
  });

  it('stays between zero and one', () => {
    const random = makeRng(3);
    for (let i = 0; i < 500; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('does not hand back the same number every time', () => {
    const random = makeRng(11);
    const seen = new Set(Array.from({ length: 50 }, () => random()));
    expect(seen.size).toBeGreaterThan(40);
  });
});

/**
 * The claims the two instruments and their prose actually make.
 *
 * Pinned as arithmetic so that an edit to the table or the scoring fails the
 * build instead of quietly turning two units' paragraphs into fiction.
 */
describe('the lesson the instrument exists to deliver', () => {
  it('turns the dial down until the model always writes the same thing', () => {
    // `temperature`'s first claim: at the bottom of the dial the top-scored
    // piece takes essentially the whole row, so the model stops choosing.
    const row = withTemperature(candidatesFor(OPENING), MIN_TEMPERATURE);
    const top = likeliest(candidatesFor(OPENING));

    expect(row[top].probability).toBeGreaterThan(0.999);
  });

  it('turns it up until the unlikely pieces become reachable', () => {
    const candidates = candidatesFor(OPENING);
    const cold = withTemperature(candidates, MIN_TEMPERATURE);
    const hot = withTemperature(candidates, MAX_TEMPERATURE);
    const worst = candidates.length - 1;

    expect(cold[worst].probability).toBeLessThan(1e-6);
    expect(hot[worst].probability).toBeGreaterThan(0.02);
  });

  it('never invents, removes or reorders a piece', () => {
    // The dial changes the GAPS, nothing else. A piece the model rated third
    // best is third best at every temperature — which is why temperature cannot
    // make a model more knowledgeable, only more adventurous.
    const candidates = candidatesFor(OPENING);
    const ranking = (heat: number) =>
      withTemperature(candidates, heat)
        .map((entry, index) => ({ index, p: entry.probability }))
        .sort((a, b) => b.p - a.p)
        .map((entry) => entry.index);

    const atOne = ranking(1);
    for (const heat of [0.1, 0.4, 0.9, 1.5, 2]) {
      expect(ranking(heat)).toEqual(atOne);
      expect(withTemperature(candidates, heat)).toHaveLength(candidates.length);
    }
  });

  it('leaves every share bigger at the top of the dial than at the bottom, except the favourite', () => {
    const candidates = candidatesFor(OPENING);
    const top = likeliest(candidates);
    const cold = withTemperature(candidates, 0.3);
    const hot = withTemperature(candidates, 1.8);

    candidates.forEach((_, index) => {
      if (index === top) {
        expect(hot[index].probability).toBeLessThan(cold[index].probability);
      } else {
        expect(hot[index].probability).toBeGreaterThan(cold[index].probability);
      }
    });
  });

  it('writes one piece at a time, each row computed from all of the last', () => {
    // `text-generation`'s claim. Step n's context is exactly step n-1's context
    // plus the piece that was drawn — nothing is skipped and nothing is revised.
    const steps = generate(0.8, 42, 4);
    expect(steps).toHaveLength(4);

    expect(steps[0].written).toBe(OPENING);
    for (let i = 1; i < steps.length; i += 1) {
      const previous = steps[i - 1];
      expect(steps[i].written).toBe(
        `${previous.written} ${previous.row[previous.chosen].text}`,
      );
    }
  });

  it('never revisits a step once it has been written', () => {
    // "It cannot take anything back": every context is strictly longer than the
    // one before, so no earlier decision is ever reopened.
    const steps = generate(1.2, 9, 5);
    const lengths = steps.map((step) => step.written.length);

    for (let i = 1; i < lengths.length; i += 1) {
      expect(lengths[i]).toBeGreaterThan(lengths[i - 1]);
    }
  });

  it('is repeatable, so the same seed and dial write the same sentence', () => {
    expect(sentenceOf(generate(0.9, 5, 4))).toBe(
      sentenceOf(generate(0.9, 5, 4)),
    );
  });

  it('has to keep going after a bad piece rather than undo it', () => {
    // The heart of `text-generation`. Force the poorest opening piece, and the
    // model does not notice, apologise or restart — it continues from it,
    // because continuing is the only operation it has.
    const stuck = 'The weather today is aubergine';
    const next = candidatesFor(stuck);

    expect(next.length).toBeGreaterThan(1);
    expect(sentenceOf(generate(0.7, 3, 2, stuck)).startsWith(stuck)).toBe(true);
  });

  it('gives the worst opening piece a small but real chance', () => {
    // It has to be reachable, or "the model sometimes writes something odd"
    // would be a claim the instrument cannot demonstrate.
    const candidates = candidatesFor(OPENING);
    const worst = candidates.length - 1;
    const row = withTemperature(candidates, 1);

    expect(candidates[worst].text).toBe('aubergine');
    expect(row[worst].probability).toBeGreaterThan(0);
    expect(row[worst].probability).toBeLessThan(0.02);
  });
});
