import { joinBase } from '../paths';

/**
 * Turning frontmatter references into things a page can render.
 *
 * Kept pure — the lookup is injected rather than imported — so it can be tested
 * without booting Astro's content layer.
 */

/** What `reference('units')` produces in frontmatter. */
export interface UnitRef {
  id: string;
}

export interface RawConnection {
  to: UnitRef;
  why: string;
}

export interface ResolvedConnection {
  id: string;
  href: string;
  title: string;
  why: string;
}

/** The path a unit is published at. */
export function unitHref(base: string, id: string): string {
  return joinBase(base, `/units/${id}`);
}

/**
 * Resolve references into link data, dropping any that no longer exist.
 *
 * Dropping rather than throwing is deliberate: Zod's `reference()` already
 * fails the build on a dangling link, so anything missing here means the entry
 * was filtered out downstream (a draft, say) — and a footer is not the place to
 * take the whole page down over it.
 */
export function resolveConnections(
  connections: readonly RawConnection[],
  titleOf: (id: string) => string | undefined,
  base: string,
): ResolvedConnection[] {
  return connections.flatMap((connection) => {
    const title = titleOf(connection.to.id);
    if (title === undefined) return [];

    return [
      {
        id: connection.to.id,
        href: unitHref(base, connection.to.id),
        title,
        why: connection.why,
      },
    ];
  });
}

/** Prerequisites carry no per-link reason, so they borrow the unit's summary. */
export function resolvePrerequisites(
  prerequisites: readonly UnitRef[],
  describe: (id: string) => { title: string; summary: string } | undefined,
  base: string,
): ResolvedConnection[] {
  return prerequisites.flatMap((prerequisite) => {
    const unit = describe(prerequisite.id);
    if (unit === undefined) return [];

    return [
      {
        id: prerequisite.id,
        href: unitHref(base, prerequisite.id),
        title: unit.title,
        why: unit.summary,
      },
    ];
  });
}
