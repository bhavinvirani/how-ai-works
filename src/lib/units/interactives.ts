/**
 * Checks that every component named in a unit's `interactives[]` frontmatter is
 * a real island (PLAN.md §6.1, job 4).
 *
 * Zod cannot do this: `interactives` is a list of plain strings, so a typo ships
 * silently. The field is read by `/gallery`, the concept map and future tooling
 * to answer "which units use this instrument", so a wrong name there is a quiet
 * lie in the knowledge base rather than a visible break.
 *
 * Runs at build time from the unit route, beside `assertAcyclic`, for the same
 * reason: content mistakes should fail `astro build`, not surface later as
 * something stranger.
 */

/**
 * Every folder under `components/interactives/` that exports an island.
 *
 * `import.meta.glob` is resolved by Vite at build time, so this is a real
 * directory listing rather than a hand-maintained registry that can drift.
 */
const MODULES: Record<string, unknown> = import.meta.glob(
  '../../components/interactives/*/index.tsx',
);

/** Folder name is the component name, by the convention in CLAUDE.md. */
export const INTERACTIVE_NAMES: ReadonlySet<string> = new Set(
  Object.keys(MODULES)
    .map((filePath) => filePath.split('/').at(-2))
    .filter((name): name is string => name !== undefined),
);

export interface UnitInteractives {
  id: string;
  interactives: readonly string[];
}

/**
 * @throws when a unit names an instrument that does not exist.
 */
export function assertInteractivesExist(
  units: readonly UnitInteractives[],
  known: ReadonlySet<string> = INTERACTIVE_NAMES,
): void {
  const problems: string[] = [];

  for (const unit of units) {
    for (const name of unit.interactives) {
      if (!known.has(name)) {
        problems.push(
          `"${unit.id}" lists an interactive called "${name}", but there is no src/components/interactives/${name}/index.tsx`,
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Unknown interactives in unit frontmatter:\n  ${problems.join('\n  ')}`,
    );
  }
}
