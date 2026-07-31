/**
 * Where a lesson's own social card lives.
 *
 * One function, in its own file, because three things that never meet each
 * other have to agree on this string: the unit page that points `og:image` at
 * it, `scripts/make-icons.mjs` that writes the file, and the test that checks
 * every published unit has one. Two of those are outside Astro — the generator
 * imports this module directly, the way `new-unit.mjs` imports `parts.ts`.
 *
 * Base-relative. The caller adds the deployment base and the origin, because
 * `og:image` is fetched by somebody else's server and must be absolute.
 */

/** Base-relative path to the card for a unit, keyed by its content id. */
export function unitCardPath(id: string): string {
  return `/og/units/${id}.png`;
}

/** The directory the cards are generated into, relative to the repo root. */
export const UNIT_CARD_DIR = 'public/og/units';
