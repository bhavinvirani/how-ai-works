#!/usr/bin/env node
/**
 * Gate raw colour literals in files ESLint cannot parse.
 *
 * The custom ESLint rule (`eslint-rules/no-raw-color.js`) covers `.ts`, `.tsx`,
 * and `.astro`. Plain `.css` and `.svg` are outside ESLint's reach, so they are
 * checked here. Both run inside `pnpm lint`.
 *
 * `src/styles/tokens.css` is the one file allowed to declare raw colour — it is
 * the design-token source of truth (CLAUDE.md hard rule 1).
 */

import { readFile } from 'node:fs/promises';
import { argv, exit } from 'node:process';
import { glob } from 'node:fs/promises';

/**
 * The exception list, deliberately kept short, explicit, and in one place
 * rather than as an inline escape hatch any file could reach for.
 *
 * - tokens.css is the design-token source of truth.
 * - favicon.svg is a standalone file the browser loads directly; it is never
 *   part of the CSS cascade, so it cannot reference custom properties. Its
 *   values must be kept in sync with tokens.css by hand.
 */
const ALLOWED = new Set(['src/styles/tokens.css', 'public/favicon.svg']);

const PATTERNS = [
  // Hex colours used as a CSS value: `color: #a81b5d`, `fill:#fff`.
  /:\s*(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8}))\b/gi,
  // Hex colours in SVG presentation attributes: fill="#fff", stroke='#000'.
  /\b(?:fill|stroke|stop-color|flood-color|lighting-color)\s*=\s*["'](#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8}))["']/gi,
  // Functional colour notations.
  /\b((?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\()/gi,
];

/** Lines that opt out explicitly, e.g. `/* allow-raw-color *\/`. */
const OPT_OUT = /allow-raw-color/;

async function collectFiles() {
  const found = [];
  for await (const entry of glob([
    'src/**/*.css',
    'src/**/*.svg',
    'public/**/*.svg',
  ])) {
    found.push(entry.split('\\').join('/'));
  }
  return found.sort();
}

/**
 * @typedef {object} Violation
 * @property {string} file
 * @property {number} line
 * @property {number} column
 * @property {string} color
 */

async function main() {
  const files = await collectFiles();

  /** @type {Violation[]} */
  const violations = [];

  for (const file of files) {
    if (ALLOWED.has(file)) continue;

    const source = await readFile(file, 'utf8');
    const lines = source.split('\n');

    lines.forEach((line, index) => {
      if (OPT_OUT.test(line)) return;

      for (const pattern of PATTERNS) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(line)) !== null) {
          violations.push({
            file,
            line: index + 1,
            column: match.index + 1,
            color: match[1] ?? match[0],
          });
        }
      }
    });
  }

  if (violations.length > 0) {
    console.error(
      `\nRaw colour literals found outside src/styles/tokens.css (${violations.length}):\n`,
    );
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}:${v.column}  ${v.color}`);
    }
    console.error(
      '\nUse a design token instead — a Tailwind utility generated from @theme' +
        '\n(e.g. text-ink, bg-paper) or var(--color-*). Declare new colours in' +
        '\nsrc/styles/tokens.css, which is the single source of truth.\n',
    );
    exit(1);
  }

  if (argv.includes('--verbose')) {
    console.log(`check-raw-colors: ${files.length} file(s) clean.`);
  }
}

await main();
