import { describe, expect, it } from 'vitest';

import { assertAcyclic, findPrerequisiteCycles, learningOrder } from './graph';
import type { UnitNode } from './graph';

const unit = (
  id: string,
  prerequisites: string[] = [],
  extra: Partial<UnitNode> = {},
): UnitNode => ({ id, prerequisites, ...extra });

describe('findPrerequisiteCycles', () => {
  it('finds nothing in an acyclic graph', () => {
    const nodes = [
      unit('tokenization'),
      unit('embeddings', ['tokenization']),
      unit('attention', ['embeddings']),
    ];

    expect(findPrerequisiteCycles(nodes)).toEqual([]);
  });

  it('finds nothing in a diamond', () => {
    // Two paths to the same ancestor is normal, not a cycle.
    const nodes = [
      unit('a'),
      unit('b', ['a']),
      unit('c', ['a']),
      unit('d', ['b', 'c']),
    ];

    expect(findPrerequisiteCycles(nodes)).toEqual([]);
  });

  it('catches a unit that is its own prerequisite', () => {
    const cycles = findPrerequisiteCycles([unit('a', ['a'])]);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['a', 'a']);
  });

  it('catches a two-unit loop', () => {
    const cycles = findPrerequisiteCycles([unit('a', ['b']), unit('b', ['a'])]);

    expect(cycles).toHaveLength(1);
    expect(cycles[0]?.at(0)).toBe(cycles[0]?.at(-1));
    expect(new Set(cycles[0])).toEqual(new Set(['a', 'b']));
  });

  it('catches a longer loop', () => {
    const cycles = findPrerequisiteCycles([
      unit('a', ['c']),
      unit('b', ['a']),
      unit('c', ['b']),
    ]);

    expect(cycles).toHaveLength(1);
    expect(new Set(cycles[0])).toEqual(new Set(['a', 'b', 'c']));
  });

  it('reports one loop once, not once per member', () => {
    // Every node on a cycle can reach it, so a naive walk reports it 3 times.
    const cycles = findPrerequisiteCycles([
      unit('a', ['b']),
      unit('b', ['c']),
      unit('c', ['a']),
    ]);

    expect(cycles).toHaveLength(1);
  });

  it('reports two independent loops separately', () => {
    const cycles = findPrerequisiteCycles([
      unit('a', ['b']),
      unit('b', ['a']),
      unit('x', ['y']),
      unit('y', ['x']),
    ]);

    expect(cycles).toHaveLength(2);
  });

  it('ignores references to units that do not exist', () => {
    // Zod's reference() rejects those; this must not crash on them first.
    expect(findPrerequisiteCycles([unit('a', ['ghost'])])).toEqual([]);
  });

  it('handles an empty collection', () => {
    expect(findPrerequisiteCycles([])).toEqual([]);
  });
});

describe('assertAcyclic', () => {
  it('says nothing when the graph is fine', () => {
    expect(() => {
      assertAcyclic([unit('a'), unit('b', ['a'])]);
    }).not.toThrow();
  });

  it('names the units in the loop so the error is actionable', () => {
    expect(() => {
      assertAcyclic([unit('a', ['b']), unit('b', ['a'])]);
    }).toThrow(/a → b → a|b → a → b/);
  });

  it('points at where prerequisites live', () => {
    expect(() => {
      assertAcyclic([unit('a', ['a'])]);
    }).toThrow(/src\/content\/units/);
  });
});

describe('learningOrder', () => {
  const PARTS = ['why-this-exists', 'language-problem'];

  it('never places a unit before its prerequisite', () => {
    const nodes = [
      unit('attention', ['embeddings']),
      unit('embeddings', ['tokenization']),
      unit('tokenization'),
    ];

    const order = learningOrder(nodes, PARTS);

    expect(order.indexOf('tokenization')).toBeLessThan(
      order.indexOf('embeddings'),
    );
    expect(order.indexOf('embeddings')).toBeLessThan(
      order.indexOf('attention'),
    );
  });

  it('orders independent units by Part, then order', () => {
    const nodes = [
      unit('c', [], { part: 'language-problem', order: 1 }),
      unit('b', [], { part: 'why-this-exists', order: 2 }),
      unit('a', [], { part: 'why-this-exists', order: 1 }),
    ];

    expect(learningOrder(nodes, PARTS)).toEqual(['a', 'b', 'c']);
  });

  it('is stable regardless of the order units are discovered in', () => {
    const nodes = [
      unit('a', [], { part: 'why-this-exists', order: 1 }),
      unit('b', [], { part: 'why-this-exists', order: 2 }),
      unit('c', [], { part: 'language-problem', order: 1 }),
    ];

    // Filesystem enumeration order must not change the published reading order.
    expect(learningOrder([...nodes].reverse(), PARTS)).toEqual(
      learningOrder(nodes, PARTS),
    );
  });

  it('sorts unknown Parts last rather than dropping them', () => {
    const nodes = [
      unit('mystery', [], { part: 'not-a-part', order: 1 }),
      unit('known', [], { part: 'why-this-exists', order: 1 }),
    ];

    expect(learningOrder(nodes, PARTS)).toEqual(['known', 'mystery']);
  });

  it('includes every unit exactly once', () => {
    const nodes = [
      unit('a'),
      unit('b', ['a']),
      unit('c', ['a', 'b']),
      unit('d'),
    ];

    const order = learningOrder(nodes, PARTS);
    expect(order).toHaveLength(4);
    expect(new Set(order).size).toBe(4);
  });

  it('refuses to order a cyclic graph', () => {
    expect(() => learningOrder([unit('a', ['b']), unit('b', ['a'])])).toThrow(
      /cycle/i,
    );
  });
});
