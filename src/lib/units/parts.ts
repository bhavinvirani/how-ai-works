/**
 * The Parts, in the order a learner meets them.
 *
 * Signed off in `docs/CURRICULUM.md` (2026-07-31) and derived from
 * `reference/how-ai-works.html`, whose own eight Parts were cut where one Part
 * was answering two or three separate questions. Three of them held 35 of the
 * 60 units between them, which reads fine in a single scrolling page with a
 * filter box and badly in a generated sidebar.
 *
 * `part` is deliberately NOT part of any URL — `unitHref` is `/units/${id}` —
 * so regrouping later costs a frontmatter edit and an edit here, with no link
 * rot and no redirects. Unit slugs are the one-way door; this is not.
 *
 * This file, not `content.config.ts`, is the single source. `scripts/new-unit.mjs`
 * imports it directly (Node strips the types), so the generator and the schema
 * cannot drift apart — they used to hold separate hardcoded copies, and the
 * generator would have silently rejected every valid Part the day this changed.
 */
export const PARTS = [
  'why-this-exists',
  'the-learning-loop',
  'kinds-of-learning',
  'when-scores-lie',
  'inside-the-machine',
  'language-problem',
  'the-transformer',
  'large-models',
  'building-an-assistant',
  'assistant-behaviour',
  'asking-well',
  'your-own-documents',
  'letting-it-act',
  'does-it-work',
  'small-fast-cheap',
  'the-whole-picture',
] as const;

export type Part = (typeof PARTS)[number];

/** Human-facing Part names live here rather than in a component (hard rule 10). */
export const PART_LABELS: Record<Part, string> = {
  'why-this-exists': 'Why any of this exists',
  'the-learning-loop': 'How a machine learns',
  'kinds-of-learning': 'Where the answers come from',
  'when-scores-lie': 'When a good score lies',
  'inside-the-machine': 'What the machine is made of',
  'language-problem': 'Why language broke everything',
  'the-transformer': 'The idea that cracked it',
  'large-models': 'What a large model does',
  'building-an-assistant': 'Turning a model into an assistant',
  'assistant-behaviour': 'Why it behaves like that',
  'asking-well': 'Asking well',
  'your-own-documents': 'Giving it your own documents',
  'letting-it-act': 'Letting it act',
  'does-it-work': 'Knowing whether it works',
  'small-fast-cheap': 'Small enough, fast enough, cheap enough',
  'the-whole-picture': 'The whole picture',
};
