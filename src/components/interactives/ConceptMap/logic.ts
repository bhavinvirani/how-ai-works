/**
 * Turning the content collection into a drawable graph (§3.3).
 *
 * The map teaches one thing: the sixty units are not sixty separate topics.
 * They are one chain — each Part picking up where the last put you down — with
 * a handful of branches where two ideas have to exist before a third makes any
 * sense. You should be able to see that shape without reading a single label.
 *
 * Everything here is pure and deterministic. Given the same units, the same
 * nodes and the same edges come out in the same order, every build — no
 * `Math.random()`, no layout that settles differently each load. The geometry
 * itself lives in `src/lib/units/map-layout.ts`; this module is the translation
 * from frontmatter into what React Flow wants.
 */

import type { Edge, EdgeMarker, Node } from '@xyflow/react';
import type { CSSProperties } from 'react';

import { edgeEnds, layoutMap } from '../../../lib/units/map-layout';
import type { LayoutPart } from '../../../lib/units/map-layout';

/** A unit, as `/map` receives it from the content collection. */
export interface ConceptMapUnit {
  id: string;
  title: string;
  part: string;
  /** Position within its Part. */
  order: number;
  /** Place in the generated reading order across the whole site, 1-based. */
  step: number;
  /** Already base-path-corrected by the page; never built here. */
  href: string;
  /** Unit ids this one needs first. Anything unknown is ignored. */
  prerequisites: readonly string[];
}

export type ConceptMapPart = LayoutPart;

/*
 * Node data is declared with `type` rather than `interface` on purpose: React
 * Flow constrains node data to `Record<string, unknown>`, and only a type alias
 * gets the implicit index signature that satisfies it.
 */

export type ClusterNodeData = {
  label: string;
  /** 1-based place of this Part in the reading order. */
  index: number;
  unitCount: number;
};

export type UnitNodeData = {
  title: string;
  href: string;
  step: number;
};

export type ClusterNode = Node<ClusterNodeData, 'cluster'>;
export type UnitNode = Node<UnitNodeData, 'unit'>;
export type ConceptMapNode = ClusterNode | UnitNode;

/** One rung of the Part chain, used by the small-screen fallback. */
export interface ChainStep {
  id: string;
  label: string;
  index: number;
  unitCount: number;
}

export interface ConceptMapGraph {
  nodes: ConceptMapNode[];
  edges: Edge[];
  /** The Parts in reading order, without any geometry. */
  chain: ChainStep[];
  width: number;
  height: number;
}

/**
 * Edge styling, as one frozen object shared by every edge.
 *
 * Inline rather than a class because React Flow renders the path itself and
 * only forwards `style`. The colour is a token reference, never a literal
 * (hard rule 1).
 */
const EDGE_STYLE: CSSProperties = {
  stroke: 'var(--color-ink-faint)',
  strokeWidth: 1.25,
};

/**
 * The arrowhead.
 *
 * Deliberately carries no `color`: React Flow builds the marker's SVG id by
 * concatenating this object's own keys, so a `var(--token)` colour here would
 * put brackets inside an id that is then referenced as `url(#…)` — and the
 * first bracket ends the reference. The colour is supplied instead by the
 * `defaultMarkerColor` prop, which does not reach the id.
 */
const ARROW: EdgeMarker = { type: 'arrowclosed', width: 14, height: 14 };

/** Handle ids. Both ends of every edge name one of these. */
export const sourceHandleId = (side: string) => `s-${side}`;
export const targetHandleId = (side: string) => `t-${side}`;

/**
 * Build every node and edge for the map.
 *
 * Prerequisites become the arrows, and only prerequisites. The `connections`
 * field is a second, denser web — a hundred more lines across sixty boxes —
 * and drawing both turns the picture into wool. Prerequisites are the ones
 * that carry direction and therefore shape, which is what a map is for; the
 * page lists the rest as text underneath, where they read better anyway.
 */
export function buildGraph(
  units: readonly ConceptMapUnit[],
  parts: readonly ConceptMapPart[],
): ConceptMapGraph {
  const layout = layoutMap(units, parts);
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const placedById = new Map(layout.units.map((unit) => [unit.id, unit]));

  const clusterNodes: ClusterNode[] = layout.clusters.map((cluster) => ({
    id: `part:${cluster.id}`,
    type: 'cluster',
    position: { x: cluster.x, y: cluster.y },
    width: cluster.width,
    height: cluster.height,
    // Behind the units, and click-through so that dragging anywhere over a
    // cluster still pans the canvas rather than hitting a dead zone.
    zIndex: 0,
    style: {
      width: cluster.width,
      height: cluster.height,
      pointerEvents: 'none',
    },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    data: {
      label: cluster.label,
      index: cluster.index,
      unitCount: cluster.unitIds.length,
    },
  }));

  const unitNodes: UnitNode[] = layout.units.flatMap((placed) => {
    const unit = unitById.get(placed.id);
    if (!unit) return [];

    return [
      {
        id: placed.id,
        type: 'unit',
        position: { x: placed.x, y: placed.y },
        width: placed.width,
        height: placed.height,
        zIndex: 1,
        style: { width: placed.width, height: placed.height },
        draggable: false,
        selectable: false,
        connectable: false,
        focusable: false,
        data: { title: unit.title, href: unit.href, step: unit.step },
      },
    ];
  });

  const edges: Edge[] = [];

  for (const unit of units) {
    const target = placedById.get(unit.id);
    if (!target) continue;

    for (const prerequisiteId of unit.prerequisites) {
      const source = placedById.get(prerequisiteId);
      // A reference to a unit that is not on the map — a draft, say — is
      // dropped rather than thrown over, exactly as the connections footer
      // does. Zod already fails the build on a reference to nothing at all.
      if (!source || source.id === target.id) continue;

      const ends = edgeEnds(source, target);

      edges.push({
        id: `${prerequisiteId}--${unit.id}`,
        source: prerequisiteId,
        target: unit.id,
        sourceHandle: sourceHandleId(ends.source),
        targetHandle: targetHandleId(ends.target),
        style: EDGE_STYLE,
        markerEnd: ARROW,
        focusable: false,
        selectable: false,
        deletable: false,
        reconnectable: false,
      });
    }
  }

  // Sorted so the SVG paint order is a property of the content and not of the
  // order the collection happened to enumerate.
  edges.sort((a, b) => a.id.localeCompare(b.id));

  return {
    nodes: [...clusterNodes, ...unitNodes],
    edges,
    chain: layout.clusters.map((cluster) => ({
      id: cluster.id,
      label: cluster.label,
      index: cluster.index,
      unitCount: cluster.unitIds.length,
    })),
    width: layout.width,
    height: layout.height,
  };
}
