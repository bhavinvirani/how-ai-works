import { describe, expect, it } from 'vitest';

import {
  CLUSTER_GAP_X,
  CLUSTER_HEADER,
  CLUSTER_PADDING,
  CLUSTER_WIDTH,
  clusterHeight,
  COLUMN_COUNT,
  edgeEnds,
  layoutMap,
  NODE_GAP,
  NODE_HEIGHT,
  NODE_WIDTH,
} from './map-layout';
import type { LayoutPart, LayoutUnit } from './map-layout';

/**
 * These tests pin the two things the drawing depends on and a reader would
 * never forgive being wrong: units of the same Part end up inside that Part's
 * box and nowhere else, and the same content always produces the same picture.
 */

/** `count` units in `part`, numbered from 1, in a deliberately jumbled order. */
function unitsIn(part: string, count: number): LayoutUnit[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${part}-${String(count - index)}`,
    part,
    order: count - index,
  }));
}

const THREE_PARTS: LayoutPart[] = [
  { id: 'first', label: 'First' },
  { id: 'second', label: 'Second' },
  { id: 'third', label: 'Third' },
];

describe('clusterHeight', () => {
  it('grows by one node and one gap per unit', () => {
    expect(clusterHeight(2) - clusterHeight(1)).toBe(NODE_HEIGHT + NODE_GAP);
    expect(clusterHeight(7) - clusterHeight(6)).toBe(NODE_HEIGHT + NODE_GAP);
  });

  it('leaves room for the Part name above the first unit', () => {
    expect(clusterHeight(1)).toBe(
      CLUSTER_HEADER + NODE_HEIGHT + CLUSTER_PADDING,
    );
  });
});

describe('layoutMap', () => {
  it('draws nothing when there is nothing to draw', () => {
    expect(layoutMap([], THREE_PARTS)).toEqual({
      clusters: [],
      units: [],
      width: 0,
      height: 0,
      columns: 0,
    });
  });

  it('survives a bare island with no props', () => {
    expect(layoutMap([], [])).toEqual({
      clusters: [],
      units: [],
      width: 0,
      height: 0,
      columns: 0,
    });
  });

  it('drops Parts that have no units rather than drawing them empty', () => {
    const layout = layoutMap(unitsIn('second', 2), THREE_PARTS, 1);

    expect(layout.clusters.map((cluster) => cluster.id)).toEqual(['second']);
    // Numbering follows the Parts that survived, so a reader never meets a
    // "Part 2" with no Part 1 above it.
    expect(layout.clusters[0].index).toBe(1);
  });

  it('keeps Parts in reading order, not in the order units arrived', () => {
    const units = [
      ...unitsIn('third', 1),
      ...unitsIn('first', 1),
      ...unitsIn('second', 1),
    ];

    expect(layoutMap(units, THREE_PARTS, 1).clusters.map((c) => c.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('sorts units inside a Part by frontmatter order', () => {
    const layout = layoutMap(unitsIn('first', 4), THREE_PARTS, 1);

    expect(layout.units.map((unit) => unit.order)).toEqual([1, 2, 3, 4]);
    // …and stacks them in that order, top to bottom.
    const ys = layout.units.map((unit) => unit.y);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('puts every unit inside its own Part box and no other', () => {
    const units = [
      ...unitsIn('first', 4),
      ...unitsIn('second', 7),
      ...unitsIn('third', 2),
    ];
    const layout = layoutMap(units, THREE_PARTS, 2);
    const clusterOf = new Map(
      layout.clusters.map((cluster) => [cluster.id, cluster]),
    );

    for (const unit of layout.units) {
      const cluster = clusterOf.get(unit.part);
      expect(cluster).toBeDefined();
      if (!cluster) continue;

      expect(unit.x).toBeGreaterThanOrEqual(cluster.x);
      expect(unit.y).toBeGreaterThanOrEqual(cluster.y + CLUSTER_HEADER);
      expect(unit.x + unit.width).toBeLessThanOrEqual(
        cluster.x + cluster.width,
      );
      expect(unit.y + unit.height).toBeLessThanOrEqual(
        cluster.y + cluster.height,
      );
      expect(unit.partIndex).toBe(cluster.index);
    }
  });

  it('never overlaps two clusters', () => {
    const units = THREE_PARTS.flatMap((part, index) =>
      unitsIn(part.id, index + 2),
    );
    const layout = layoutMap(units, THREE_PARTS, 2);

    for (const a of layout.clusters) {
      for (const b of layout.clusters) {
        if (a.id === b.id) continue;

        const apart =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;

        expect(apart).toBe(true);
      }
    }
  });

  it('is deterministic: same input, byte-identical output', () => {
    const units = [...unitsIn('first', 4), ...unitsIn('second', 5)];

    expect(layoutMap(units, THREE_PARTS)).toEqual(
      layoutMap(units, THREE_PARTS),
    );
  });

  it('does not depend on the order units are handed to it', () => {
    const units = [...unitsIn('first', 4), ...unitsIn('third', 3)];
    const shuffled = [...units].reverse();

    expect(layoutMap(shuffled, THREE_PARTS)).toEqual(
      layoutMap(units, THREE_PARTS),
    );
  });

  it('pours clusters into columns without leaving one empty', () => {
    const parts: LayoutPart[] = Array.from({ length: 16 }, (_, index) => ({
      id: `part-${String(index)}`,
      label: `Part ${String(index)}`,
    }));
    const units = parts.flatMap((part, index) =>
      unitsIn(part.id, (index % 5) + 2),
    );

    const layout = layoutMap(units, parts);

    expect(layout.columns).toBe(COLUMN_COUNT);

    const used = new Set(layout.clusters.map((cluster) => cluster.column));
    expect(used.size).toBe(COLUMN_COUNT);

    // Columns run left to right in reading order: a cluster is never placed in
    // a column to the left of the one before it.
    const columns = layout.clusters.map((cluster) => cluster.column);
    expect([...columns].sort((a, b) => a - b)).toEqual(columns);

    // No column is wildly taller than the map claims to be.
    expect(layout.width).toBe(
      COLUMN_COUNT * CLUSTER_WIDTH + (COLUMN_COUNT - 1) * CLUSTER_GAP_X,
    );
    for (const cluster of layout.clusters) {
      expect(cluster.y + cluster.height).toBeLessThanOrEqual(layout.height);
      expect(cluster.x + cluster.width).toBeLessThanOrEqual(layout.width);
    }
  });

  it('asks for no more columns than it has clusters to fill them', () => {
    const layout = layoutMap(unitsIn('first', 3), THREE_PARTS, 4);

    expect(layout.columns).toBe(1);
    expect(layout.width).toBe(CLUSTER_WIDTH);
  });

  it('gives every unit the same box size', () => {
    const layout = layoutMap(unitsIn('first', 3), THREE_PARTS);

    for (const unit of layout.units) {
      expect(unit.width).toBe(NODE_WIDTH);
      expect(unit.height).toBe(NODE_HEIGHT);
    }
  });
});

describe('edgeEnds', () => {
  const at = (x: number, y: number) => ({
    x,
    y,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  });

  it('goes down the page when the target is below', () => {
    expect(edgeEnds(at(0, 0), at(0, 200))).toEqual({
      source: 'bottom',
      target: 'top',
    });
  });

  it('goes back up when the target is above', () => {
    expect(edgeEnds(at(0, 200), at(0, 0))).toEqual({
      source: 'top',
      target: 'bottom',
    });
  });

  it('crosses sideways to the next column instead of looping back', () => {
    // The target sits in the column to the right and higher up the page. Left
    // to the vertical rule this would leave the bottom and climb, which reads
    // as an arrow pointing the wrong way.
    expect(edgeEnds(at(0, 400), at(400, 20))).toEqual({
      source: 'right',
      target: 'left',
    });
  });

  it('crosses back the other way too', () => {
    expect(edgeEnds(at(400, 20), at(0, 400))).toEqual({
      source: 'left',
      target: 'right',
    });
  });

  it('treats boxes that merely overlap horizontally as one column', () => {
    expect(edgeEnds(at(0, 0), at(NODE_WIDTH - 4, 300))).toEqual({
      source: 'bottom',
      target: 'top',
    });
  });
});
