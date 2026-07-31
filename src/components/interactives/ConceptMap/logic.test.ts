import { describe, expect, it } from 'vitest';

import { buildGraph, sourceHandleId, targetHandleId } from './logic';
import type { ConceptMapPart, ConceptMapUnit } from './logic';

/**
 * What these pin: every unit reaches the canvas exactly once, every arrow points
 * from the thing you read first to the thing that needed it, and nothing on the
 * map depends on the order the content collection happened to be enumerated in.
 */

const PARTS: ConceptMapPart[] = [
  { id: 'beginning', label: 'Where it starts' },
  { id: 'middle', label: 'What it turns into' },
];

function unit(
  id: string,
  part: string,
  order: number,
  prerequisites: string[] = [],
): ConceptMapUnit {
  return {
    id,
    title: `The unit called ${id}`,
    part,
    order,
    step: order,
    href: `/how-ai-works/units/${id}`,
    prerequisites,
  };
}

const UNITS: ConceptMapUnit[] = [
  unit('one', 'beginning', 1),
  unit('two', 'beginning', 2, ['one']),
  unit('three', 'middle', 1, ['two']),
  unit('four', 'middle', 2, ['three', 'one']),
];

describe('buildGraph', () => {
  it('renders nothing, and throws nothing, for a bare instrument', () => {
    const graph = buildGraph([], []);

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.chain).toEqual([]);
  });

  it('gives every unit exactly one node', () => {
    const graph = buildGraph(UNITS, PARTS);
    const unitNodes = graph.nodes.filter((node) => node.type === 'unit');

    expect(unitNodes.map((node) => node.id).sort()).toEqual([
      'four',
      'one',
      'three',
      'two',
    ]);
  });

  it('gives every Part a labelled box of its own', () => {
    const graph = buildGraph(UNITS, PARTS);
    const clusters = graph.nodes.filter((node) => node.type === 'cluster');

    expect(clusters).toHaveLength(2);
    // The label is how Part is encoded. It is never left to a colour, so it has
    // to actually be on the node.
    expect(clusters.map((node) => node.data.label)).toEqual([
      'Where it starts',
      'What it turns into',
    ]);
    expect(clusters.map((node) => node.data.index)).toEqual([1, 2]);
    expect(clusters.map((node) => node.data.unitCount)).toEqual([2, 2]);
  });

  it('draws the Part boxes behind the units and lets clicks fall through', () => {
    const graph = buildGraph(UNITS, PARTS);

    for (const node of graph.nodes) {
      if (node.type === 'cluster') {
        expect(node.zIndex).toBe(0);
        expect(node.style?.pointerEvents).toBe('none');
      } else {
        expect(node.zIndex).toBe(1);
      }
    }
  });

  it('carries the title and the link the page worked out, untouched', () => {
    const graph = buildGraph(UNITS, PARTS);
    const three = graph.nodes.find((node) => node.id === 'three');

    expect(three?.type).toBe('unit');
    expect(three?.data).toEqual({
      title: 'The unit called three',
      href: '/how-ai-works/units/three',
      step: 1,
    });
  });

  it('points each arrow from the prerequisite to the unit that needs it', () => {
    const graph = buildGraph(UNITS, PARTS);

    expect(
      graph.edges.map((edge) => `${edge.source}>${edge.target}`),
    ).toContain('one>two');
    expect(graph.edges).toHaveLength(4);
  });

  it('drops a prerequisite that is not on the map instead of breaking', () => {
    const withDraft = [...UNITS, unit('five', 'middle', 3, ['a-draft'])];
    const graph = buildGraph(withDraft, PARTS);

    expect(graph.edges.some((edge) => edge.source === 'a-draft')).toBe(false);
    expect(graph.nodes.some((node) => node.id === 'five')).toBe(true);
  });

  it('ignores a unit whose Part is not one of the Parts', () => {
    const graph = buildGraph([...UNITS, unit('stray', 'nowhere', 1)], PARTS);

    expect(graph.nodes.some((node) => node.id === 'stray')).toBe(false);
  });

  it('joins each edge to the sides the two boxes actually face', () => {
    const graph = buildGraph(UNITS, PARTS);

    for (const edge of graph.edges) {
      expect(edge.sourceHandle).toMatch(/^s-(top|right|bottom|left)$/);
      expect(edge.targetHandle).toMatch(/^t-(top|right|bottom|left)$/);
    }

    // Inside one column, later units sit below earlier ones.
    const downward = graph.edges.find((edge) => edge.id === 'one--two');
    expect(downward?.sourceHandle).toBe(sourceHandleId('bottom'));
    expect(downward?.targetHandle).toBe(targetHandleId('top'));
  });

  it('makes nothing on the canvas reachable by keyboard or selectable', () => {
    // The canvas is a picture; the page's list of units is the navigation. If
    // any of this flips to true, the map becomes a sixty-stop keyboard trap.
    const graph = buildGraph(UNITS, PARTS);

    for (const node of graph.nodes) {
      expect(node.focusable).toBe(false);
      expect(node.selectable).toBe(false);
      expect(node.draggable).toBe(false);
    }
    for (const edge of graph.edges) {
      expect(edge.focusable).toBe(false);
      expect(edge.selectable).toBe(false);
    }
  });

  it('gives the arrowhead no colour of its own', () => {
    // React Flow builds the marker's SVG id out of this object's keys. A
    // `var(--token)` colour here would put a bracket in an id that is then
    // referenced as `url(#…)`, and every arrowhead would silently vanish.
    const graph = buildGraph(UNITS, PARTS);
    const marker = graph.edges[0].markerEnd;

    expect(marker).toBeDefined();
    expect(
      typeof marker === 'object' ? marker.color : undefined,
    ).toBeUndefined();
  });

  it('produces the same map whatever order the units arrive in', () => {
    const reversed = [...UNITS].reverse();

    expect(buildGraph(reversed, PARTS)).toEqual(buildGraph(UNITS, PARTS));
  });

  it('lists the Parts in reading order for the small-screen fallback', () => {
    expect(buildGraph(UNITS, PARTS).chain).toEqual([
      { id: 'beginning', label: 'Where it starts', index: 1, unitCount: 2 },
      { id: 'middle', label: 'What it turns into', index: 2, unitCount: 2 },
    ]);
  });

  it('reports an extent big enough to hold everything it drew', () => {
    const graph = buildGraph(UNITS, PARTS);

    for (const node of graph.nodes) {
      expect(node.position.x + (node.width ?? 0)).toBeLessThanOrEqual(
        graph.width,
      );
      expect(node.position.y + (node.height ?? 0)).toBeLessThanOrEqual(
        graph.height,
      );
    }
  });
});
