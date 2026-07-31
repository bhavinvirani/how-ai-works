/**
 * Where every box on `/map` goes.
 *
 * WHY THIS IS ARITHMETIC AND NOT A SIMULATION. A force-directed graph settles
 * somewhere slightly different on every load, which means the map a reader
 * describes to someone else is not the map that person opens. Worse, it
 * scatters units that belong together. Everything here is a pure function of
 * Part order and `order` within a Part, so the same content always produces the
 * same picture — no `Math.random()`, no physics, no time.
 *
 * WHY PART IS ENCODED AS A CLUSTER RATHER THAN A COLOUR. `tokens.css` ships two
 * categorical accents. Sixteen Part colours would need sixteen new tokens, each
 * WCAG-checked against three surfaces, and CLAUDE.md hard rule 9 forbids
 * carrying meaning by colour alone regardless. So a Part is a *place*: its units
 * sit inside one box, with the Part's name written across the top of it. That
 * survives greyscale, and it survives being printed.
 *
 * The one judgement call is the column packing. Sixteen clusters in a single
 * column is 5,000 pixels tall and unreadable when fitted to a screen; the
 * clusters are therefore poured down a small number of columns, in reading
 * order, balanced so no column is twice the height of its neighbour.
 */

/** A unit, reduced to what the geometry needs. */
export interface LayoutUnit {
  id: string;
  part: string;
  /** Position within its Part, from frontmatter. */
  order: number;
}

/** A Part, in the order a learner meets it. */
export interface LayoutPart {
  id: string;
  label: string;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/* ---------------------------------------------------------------------------
 * Geometry, in flow units (React Flow's own coordinate space, before zoom).
 *
 * Exported because the island draws with them and the tests pin them: a change
 * here that quietly overlaps two nodes should fail somewhere, not just look
 * slightly wrong.
 * ------------------------------------------------------------------------ */

/**
 * One unit's box.
 *
 * Sized for the titles this site actually has, which are sentences rather than
 * nouns: the longest runs to fifty-two characters, and a box narrow enough to
 * turn that into four lines would clip most of the curriculum. The width also
 * sets the cluster's width, and therefore how large the Part name above it can
 * be set — which is the constraint that actually decided this number.
 */
export const NODE_WIDTH = 260;
export const NODE_HEIGHT = 60;
/** Vertical breathing room between units inside one Part. */
export const NODE_GAP = 10;

/** Inset from the cluster's edge to the units inside it. */
export const CLUSTER_PADDING = 12;
/**
 * Reserved strip at the top of a cluster for the Part's name.
 *
 * Generous, because the name is the encoding. A map of sixty boxes is always
 * read zoomed out at first, and a Part label set at unit size would be the one
 * thing on the picture that stops being legible exactly when it is needed.
 * Sized for two lines of the longest Part name at display size.
 */
export const CLUSTER_HEADER = 70;
export const CLUSTER_WIDTH = NODE_WIDTH + CLUSTER_PADDING * 2;

/** Gaps between clusters. The horizontal one has to fit an edge crossing it. */
export const CLUSTER_GAP_X = 56;
export const CLUSTER_GAP_Y = 48;

/**
 * How many columns the clusters are poured down.
 *
 * Four is what keeps the whole map close to a screen's aspect ratio, so
 * `fitView` shows the shape rather than a ribbon.
 */
export const COLUMN_COUNT = 4;

/** A Part, placed. `index` is its 1-based place in the reading order. */
export interface PlacedCluster extends Box {
  id: string;
  label: string;
  index: number;
  column: number;
  unitIds: string[];
}

/** A unit, placed. Coordinates are absolute, not relative to the cluster. */
export interface PlacedUnit extends Box {
  id: string;
  part: string;
  order: number;
  /** The 1-based index of the cluster this unit sits in. */
  partIndex: number;
}

export interface MapLayout {
  clusters: PlacedCluster[];
  units: PlacedUnit[];
  /** Extent of the whole drawing, so a caller can size a viewBox from it. */
  width: number;
  height: number;
  /** Columns actually used, which can be fewer than asked for. */
  columns: number;
}

/** The height a cluster needs to hold `unitCount` units. */
export function clusterHeight(unitCount: number): number {
  if (unitCount <= 0) return CLUSTER_HEADER + CLUSTER_PADDING;

  return (
    CLUSTER_HEADER +
    unitCount * NODE_HEIGHT +
    (unitCount - 1) * NODE_GAP +
    CLUSTER_PADDING
  );
}

/** Frontmatter `order` first; the id breaks ties so the result never wobbles. */
function compareUnits(a: LayoutUnit, b: LayoutUnit): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.id.localeCompare(b.id);
}

/**
 * Place every Part and every unit.
 *
 * Parts with no units are dropped rather than drawn empty — the same rule the
 * generated sidebar follows, and what makes this safe to render while the
 * curriculum is still being written.
 *
 * @param units every unit to draw
 * @param parts the Parts, in reading order; anything not listed is skipped
 * @param columns how many columns to pour the clusters down
 */
export function layoutMap(
  units: readonly LayoutUnit[],
  parts: readonly LayoutPart[],
  columns: number = COLUMN_COUNT,
): MapLayout {
  const byPart = new Map<string, LayoutUnit[]>();
  for (const unit of units) {
    const bucket = byPart.get(unit.part);
    if (bucket) bucket.push(unit);
    else byPart.set(unit.part, [unit]);
  }

  const groups = parts
    .map((part) => ({
      part,
      units: [...(byPart.get(part.id) ?? [])].sort(compareUnits),
    }))
    .filter((group) => group.units.length > 0);

  if (groups.length === 0) {
    return { clusters: [], units: [], width: 0, height: 0, columns: 0 };
  }

  const columnCount = Math.max(1, Math.min(Math.floor(columns), groups.length));
  const heights = groups.map((group) => clusterHeight(group.units.length));

  // The height one column would have if every cluster were stacked in it,
  // divided by the number of columns: the height each column is aiming for.
  const total = heights.reduce(
    (sum, height) => sum + height + CLUSTER_GAP_Y,
    0,
  );
  const target = (total - CLUSTER_GAP_Y) / columnCount;

  const placedClusters: PlacedCluster[] = [];
  const placedUnits: PlacedUnit[] = [];
  const columnHeights: number[] = [];

  let column = 0;
  let columnHeight = 0;
  /** Stacked height already committed to finished columns, gaps included. */
  let committed = 0;

  groups.forEach((group, index) => {
    const height = heights[index];
    // Clusters left to place, including this one.
    const remaining = groups.length - index;

    // Move on when this cluster's midpoint lands past where this column's share
    // of the whole ends — or when there are only just enough clusters left to
    // give every remaining column one each. Measuring against the running total
    // rather than this column alone stops a tall cluster early on from pushing
    // every later column short. `columnHeight > 0` is what stops a column from
    // ever being left empty.
    const advance =
      column < columnCount - 1 &&
      columnHeight > 0 &&
      (remaining < columnCount - column ||
        committed + columnHeight + height / 2 > target * (column + 1));

    if (advance) {
      columnHeights.push(columnHeight - CLUSTER_GAP_Y);
      committed += columnHeight;
      column += 1;
      columnHeight = 0;
    }

    const x = column * (CLUSTER_WIDTH + CLUSTER_GAP_X);
    const y = columnHeight;

    placedClusters.push({
      id: group.part.id,
      label: group.part.label,
      index: placedClusters.length + 1,
      column,
      x,
      y,
      width: CLUSTER_WIDTH,
      height,
      unitIds: group.units.map((unit) => unit.id),
    });

    group.units.forEach((unit, position) => {
      placedUnits.push({
        id: unit.id,
        part: unit.part,
        order: unit.order,
        partIndex: placedClusters.length,
        x: x + CLUSTER_PADDING,
        y: y + CLUSTER_HEADER + position * (NODE_HEIGHT + NODE_GAP),
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });

    columnHeight += height + CLUSTER_GAP_Y;
  });

  columnHeights.push(columnHeight - CLUSTER_GAP_Y);

  const columnsUsed = column + 1;

  return {
    clusters: placedClusters,
    units: placedUnits,
    width: columnsUsed * CLUSTER_WIDTH + (columnsUsed - 1) * CLUSTER_GAP_X,
    height: Math.max(...columnHeights),
    columns: columnsUsed,
  };
}

/** Which side of a box an edge leaves from or arrives at. */
export type HandleSide = 'top' | 'bottom' | 'left' | 'right';

/** Every side, in a fixed order, so nodes can render one handle per side. */
export const HANDLE_SIDES: readonly HandleSide[] = [
  'top',
  'right',
  'bottom',
  'left',
];

export interface EdgeEnds {
  source: HandleSide;
  target: HandleSide;
}

/**
 * Pick the sides an edge should join, from where the two boxes actually sit.
 *
 * Without this every edge leaves the bottom and arrives at the top, so a link
 * that crosses to the next column loops back on itself and reads as though it
 * points the wrong way. Sideways first, because a horizontal neighbour is
 * always a column hop; vertical otherwise, which is the common case inside a
 * column.
 */
export function edgeEnds(from: Box, to: Box): EdgeEnds {
  if (to.x >= from.x + from.width) return { source: 'right', target: 'left' };
  if (to.x + to.width <= from.x) return { source: 'left', target: 'right' };
  if (to.y >= from.y) return { source: 'bottom', target: 'top' };
  return { source: 'top', target: 'bottom' };
}
