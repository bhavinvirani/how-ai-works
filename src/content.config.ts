import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
// `z` re-exported from 'astro:content' is deprecated in Astro 7; the Zod
// instance now comes from 'astro/zod' (Zod 4 under the hood).
import { z } from 'astro/zod';

/**
 * The typed knowledge base.
 *
 * Sidebar order, prerequisite links, the connections footer, and the concept
 * map are all *generated* from this metadata rather than hand-maintained. That
 * is what turns "connect the dots" from a maintenance chore into data — and it
 * is why a broken reference has to fail the build rather than ship a dead link.
 */

/**
 * Parts, in the order a learner meets them.
 *
 * Provisional: the real grouping is signed off in `docs/CURRICULUM.md`, which
 * is derived from the reference artifact. Treat this as a placeholder that will
 * be revised once that lands — changing it is a one-line edit plus whatever
 * frontmatter follows.
 */
export const PARTS = [
  'foundations',
  'how-models-learn',
  'language-models',
  'using-models',
] as const;

export type Part = (typeof PARTS)[number];

/** Human-facing Part names live here rather than in a component (hard rule 10). */
export const PART_LABELS: Record<Part, string> = {
  foundations: 'Foundations',
  'how-models-learn': 'How models learn',
  'language-models': 'Language models',
  'using-models': 'Using models',
};

const units = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/units' }),

  schema: z.object({
    // NOTE: no `id` field. PLAN.md §2.1 declares one, but the glob loader
    // derives `id` from the filename, so declaring it again would create two
    // sources of truth that can disagree. The filename IS the stable slug that
    // other units reference. (§9: where the plan and the current API disagree,
    // the API wins.)
    title: z.string().min(1),
    part: z.enum(PARTS),

    /** Position within the Part. Sorting is generated, never hand-edited. */
    order: z.number().int().positive(),

    /** One plain-English sentence, used on cards and the concept map. */
    summary: z.string().min(1),

    /**
     * `reference('units')`, never `z.string()`.
     *
     * This is the line that makes "a broken reference fails the build instead
     * of shipping" true. A plain string array type-checks anything and ships
     * dead links in silence.
     */
    prerequisites: z.array(reference('units')).default([]),

    /**
     * Related units, each with a hand-written reason. The reason is required
     * because "see also: embeddings" teaches nothing — "tokenization feeds
     * embeddings because the model needs a fixed vocabulary first" does.
     */
    connections: z
      .array(
        z.object({
          to: reference('units'),
          why: z.string().min(1),
        }),
      )
      .default([]),

    /** Component names this unit embeds, checked against real components. */
    interactives: z.array(z.string()).default([]),

    status: z.enum(['draft', 'published']).default('draft'),

    updated: z.coerce.date(),
  }),
});

export const collections = { units };
