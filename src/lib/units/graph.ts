/**
 * The unit graph: prerequisite ordering and the checks that keep it sane.
 *
 * Zod validates that every reference points at a unit that exists. It cannot
 * validate the *shape* of the resulting graph, and both `/map` and the
 * generated learning order assume a DAG — a prerequisite cycle would make
 * "what should I read first" unanswerable and hang a naive traversal.
 *
 * Kept pure and free of Astro imports so it can be tested directly.
 */

export interface UnitNode {
  id: string;
  prerequisites: string[];
  part?: string;
  order?: number;
}

/**
 * Every prerequisite cycle in the graph.
 *
 * Each cycle is returned as the path that closes it, starting and ending on the
 * same id (`['a', 'b', 'a']`), because naming the loop is the only thing that
 * makes the error actionable.
 */
export function findPrerequisiteCycles(nodes: readonly UnitNode[]): string[][] {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  /** unvisited -> in progress -> settled, the standard three-colour DFS. */
  const state = new Map<string, 'visiting' | 'done'>();
  const cycles: string[][] = [];
  const seenCycles = new Set<string>();

  const walk = (id: string, path: string[]) => {
    const current = state.get(id);
    if (current === 'done') return;

    if (current === 'visiting') {
      // Found a back edge: the cycle is the tail of the path from this id on.
      const start = path.indexOf(id);
      if (start === -1) return;
      const cycle = [...path.slice(start), id];

      // The same loop is reachable from every node on it, so record each only
      // once — keyed by its rotation-independent membership.
      const key = [...cycle.slice(0, -1)].sort().join('>');
      if (!seenCycles.has(key)) {
        seenCycles.add(key);
        cycles.push(cycle);
      }
      return;
    }

    state.set(id, 'visiting');
    path.push(id);

    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      // References to unknown units are Zod's job, not ours.
      if (byId.has(prerequisite)) walk(prerequisite, path);
    }

    path.pop();
    state.set(id, 'done');
  };

  for (const node of nodes) walk(node.id, []);

  return cycles;
}

/**
 * Throw a readable error when the graph is not a DAG.
 *
 * Called during the build so a cycle fails there rather than surfacing as a
 * hung page or a nonsensical reading order.
 */
export function assertAcyclic(nodes: readonly UnitNode[]): void {
  const cycles = findPrerequisiteCycles(nodes);
  if (cycles.length === 0) return;

  const described = cycles.map((cycle) => `  ${cycle.join(' → ')}`).join('\n');

  throw new Error(
    `Prerequisite cycle detected in src/content/units.\n\n${described}\n\n` +
      'Prerequisites must form a directed acyclic graph: a unit cannot, even ' +
      'indirectly, be its own prerequisite. Break the loop by removing the ' +
      'weakest link, or by moving that relationship into `connections`, which ' +
      'carries no ordering meaning.',
  );
}

/**
 * A reading order that never places a unit before one of its prerequisites.
 *
 * Ties are broken by Part order, then `order`, then id — so the result is
 * stable across builds rather than dependent on filesystem enumeration.
 *
 * @param nodes units to order
 * @param partOrder Parts in curriculum order; unknown Parts sort last
 */
export function learningOrder(
  nodes: readonly UnitNode[],
  partOrder: readonly string[] = [],
): string[] {
  assertAcyclic(nodes);

  const byId = new Map(nodes.map((node) => [node.id, node]));

  const rank = (id: string): [number, number, string] => {
    const node = byId.get(id);
    const partIndex = node?.part ? partOrder.indexOf(node.part) : -1;
    return [
      partIndex === -1 ? Number.MAX_SAFE_INTEGER : partIndex,
      node?.order ?? Number.MAX_SAFE_INTEGER,
      id,
    ];
  };

  const compare = (a: string, b: string): number => {
    const [aPart, aOrder, aId] = rank(a);
    const [bPart, bOrder, bId] = rank(b);
    if (aPart !== bPart) return aPart - bPart;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return aId.localeCompare(bId);
  };

  const visited = new Set<string>();
  const result: string[] = [];

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);

    // Prerequisites first, in the same stable order.
    const prerequisites = [...(byId.get(id)?.prerequisites ?? [])]
      .filter((prerequisite) => byId.has(prerequisite))
      .sort(compare);

    for (const prerequisite of prerequisites) visit(prerequisite);
    result.push(id);
  };

  for (const id of nodes.map((node) => node.id).sort(compare)) visit(id);

  return result;
}
