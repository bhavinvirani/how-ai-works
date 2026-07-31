#!/usr/bin/env node
/**
 * Scaffold a unit (§3.4).
 *
 * Writes the fixed skeleton from §2.2 already in order, because the order is
 * the pedagogy: the problem before the name for it, the picture before the
 * instrument, and the connections before the checkpoint.
 *
 * Usage: pnpm new:unit <id> [part]
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argv, exit } from 'node:process';

// Imported, never copied. This file used to keep its own hardcoded list, which
// meant the generator and the schema could disagree — and the failure mode was
// the generator rejecting a Part that `astro build` would happily accept.
// Node strips the types on the way in (>=24.16 is already required by
// `engines`, and stripping is unflagged there), so a .ts import costs nothing.
import { PARTS } from '../src/lib/units/parts.ts';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @param {string} message */
const fail = (message) => {
  console.error(`\n  ${message}\n`);
  exit(1);
};

const id = argv[2];
const part = argv[3] ?? PARTS[0];

if (!id) fail('Usage: pnpm new:unit <id> [part]');
if (!ID_PATTERN.test(id)) {
  fail(
    `"${id}" is not a unit id. Use lowercase words joined by hyphens — e.g. how-models-guess.\n  The id is the filename, and other units reference it by that name.`,
  );
}
if (!PARTS.includes(part)) {
  fail(`"${part}" is not a Part. Pick one of: ${PARTS.join(', ')}`);
}

const file = path.join('src/content/units', `${id}.mdx`);
const today = new Date().toISOString().slice(0, 10);

const template = `---
title: TODO
part: ${part}
order: 1
summary: TODO — one plain sentence. It appears on cards and the concept map.
prerequisites: []
connections: []
interactives: []
status: draft
updated: ${today}
---

import Aside from '../../components/blocks/Aside.astro';
import Checkpoint from '../../components/blocks/Checkpoint.astro';
import Figure from '../../components/blocks/Figure.astro';

{/*
  The skeleton below is fixed (§2.2). Keep the order: it is the teaching, not a
  template. Delete these comments as you go.

  Before opening a PR, read docs/QUALITY_BAR.md against the rendered page.
*/}

{/* HOOK — the problem this exists to solve, as an everyday situation.
    Do NOT name the concept yet. The reader should want the answer before they
    are handed the word for it. */}

TODO: open with something the reader already recognises.

{/* INTUITION — the plain-language explanation, analogy first.
    One new idea per paragraph. Define every term at first use, in the same
    sentence or the next. */}

## TODO: the idea

TODO.

{/* SEE IT — the diagram. \`description\` is required and must teach, not label. */}

<Figure
  title="TODO"
  description="TODO — what this diagram teaches, in plain English."
>
  {/* TODO: an SVG from src/components/diagrams/, aria-hidden. */}
</Figure>

{/* TOUCH IT — the instrument. Scaffold one with \`pnpm new:interactive\`,
    then add its component name to \`interactives\` in the frontmatter above. */}

{/* WHERE IT FITS — generated from the \`connections\` frontmatter. Nothing to
    write here; write the \`why\` lines up in the frontmatter instead. */}

{/* CHECKPOINT — answerable from this unit alone. */}

<Checkpoint question="TODO: a question that tests the idea, not the wording.">
  TODO: the answer, and why.
</Checkpoint>
`;

await mkdir(path.dirname(file), { recursive: true });
await writeFile(file, template, { flag: 'wx' }).catch(() => {
  fail(`${file} already exists.`);
});

console.log(`
  Created ${file}

  Next:
    1. Fill in the frontmatter. \`summary\` and every connection \`why\` are
       read by other pages, so write them properly rather than as placeholders.
    2. Work down the skeleton in order.
    3. Flip status to "published" when it meets docs/QUALITY_BAR.md.

  Drafts render in \`pnpm dev\` and are excluded from the built site.
`);
