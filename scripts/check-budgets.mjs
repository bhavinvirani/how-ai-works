#!/usr/bin/env node
/**
 * Island bundle-size gate (PLAN.md §3.3, §6.1).
 *
 * Fails the build when a hydrated island ships more JavaScript than its budget
 * allows, measured gzipped and **beyond the shared chunks** every island
 * already pays for.
 *
 * Attribution comes from the built HTML rather than a Vite manifest. Astro
 * stamps each island as `<astro-island component-url renderer-url
 * component-export>`, which says exactly which chunk a given island loads and
 * which chunk is the shared renderer. That is both more direct than a manifest
 * and correct by construction: it measures what a browser actually downloads.
 *
 * A chunk can import other chunks, so each island is charged its whole
 * transitive import closure, minus anything already counted as shared.
 */

import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import { argv, exit } from 'node:process';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const BUDGETS_PATH = new URL('./budgets.json', import.meta.url);

/** `<astro-island ...>` opening tags, with their attributes. */
const ISLAND_TAG = /<astro-island\b([^>]*)>/g;

/** Static and dynamic ESM import specifiers pointing at a sibling chunk. */
const IMPORT_SPECIFIER =
  /(?:from|import)\s*\(?\s*["']([^"']+\.js)["']|import\s*["']([^"']+\.js)["']/g;

/**
 * @param {string} attributes raw attribute text from an opening tag
 * @param {string} name attribute to read
 * @returns {string | undefined}
 */
const readAttribute = (attributes, name) => {
  const match = new RegExp(`${name}="([^"]*)"`).exec(attributes);
  return match?.[1];
};

/**
 * Turn a served URL such as /how-ai-works/_astro/x.js into dist/_astro/x.js.
 *
 * @param {string} url
 * @returns {string | null} null when the URL is not an emitted asset
 */
function toDistPath(url) {
  const marker = '/_astro/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return path.posix.join(DIST, '_astro', url.slice(index + marker.length));
}

/**
 * Every chunk reachable from `entry` by following import specifiers.
 *
 * @param {string} entry dist-relative path to the entry chunk
 * @param {Map<string, string>} cache shared file-contents cache
 * @returns {Promise<Set<string>>}
 */
async function importClosure(entry, cache) {
  /** @type {Set<string>} */
  const seen = new Set();
  const queue = [entry];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    let source = cache.get(current);
    if (source === undefined) {
      try {
        source = await readFile(current, 'utf8');
      } catch {
        // A chunk referenced but not emitted is not a budget problem.
        source = '';
      }
      cache.set(current, source);
    }

    IMPORT_SPECIFIER.lastIndex = 0;
    let match;
    while ((match = IMPORT_SPECIFIER.exec(source)) !== null) {
      const specifier = match[1] ?? match[2];
      if (!specifier?.startsWith('.')) continue;
      queue.push(path.join(path.dirname(current), specifier));
    }
  }

  return seen;
}

/**
 * @param {Iterable<string>} files
 * @param {Map<string, string>} cache
 * @returns {Promise<number>} total gzipped bytes
 */
async function gzippedBytes(files, cache) {
  let total = 0;
  for (const file of files) {
    let source = cache.get(file);
    if (source === undefined) {
      try {
        source = await readFile(file, 'utf8');
      } catch {
        source = '';
      }
      cache.set(file, source);
    }
    if (source === '') continue;
    total += gzipSync(Buffer.from(source), { level: 9 }).byteLength;
  }
  return total;
}

/** @param {number} bytes */
const kb = (bytes) => bytes / 1024;
/** @param {number} bytes */
const formatKb = (bytes) => `${kb(bytes).toFixed(1)} KB`;

async function main() {
  /** @type {{ defaultIslandKb: number, overrides?: Record<string, { maxKb?: number }>, shared?: { maxKb?: number } }} */
  const budgets = JSON.parse(await readFile(BUDGETS_PATH, 'utf8'));

  /** @type {Map<string, string>} */
  const sourceCache = new Map();

  /**
   * component-url -> island names rendered from it.
   * @type {Map<string, Set<string>>}
   */
  const islandsByChunk = new Map();
  /** @type {Set<string>} */
  const rendererUrls = new Set();

  let htmlCount = 0;
  for await (const file of glob(`${DIST}/**/*.html`)) {
    htmlCount += 1;
    const html = await readFile(file, 'utf8');

    ISLAND_TAG.lastIndex = 0;
    let match;
    while ((match = ISLAND_TAG.exec(html)) !== null) {
      const attributes = match[1] ?? '';
      const componentUrl = readAttribute(attributes, 'component-url');
      const rendererUrl = readAttribute(attributes, 'renderer-url');
      const name = readAttribute(attributes, 'component-export') ?? 'default';

      if (rendererUrl) rendererUrls.add(rendererUrl);
      if (!componentUrl) continue;

      const existing = islandsByChunk.get(componentUrl) ?? new Set();
      existing.add(name);
      islandsByChunk.set(componentUrl, existing);
    }
  }

  if (htmlCount === 0) {
    console.error('check-budgets: no HTML in dist/. Run `pnpm build` first.');
    exit(1);
  }

  // Shared chunks: the renderer plus everything it pulls in. Every island pays
  // for these once, so they are budgeted on their own rather than charged to
  // each island.
  const shared = new Set();
  for (const url of rendererUrls) {
    const entry = toDistPath(url);
    if (!entry) continue;
    for (const file of await importClosure(entry, sourceCache))
      shared.add(file);
  }

  const sharedBytes = await gzippedBytes(shared, sourceCache);
  const failures = [];
  const rows = [];

  for (const [url, names] of islandsByChunk) {
    const entry = toDistPath(url);
    if (!entry) continue;

    const closure = await importClosure(entry, sourceCache);
    const own = [...closure].filter((file) => !shared.has(file));
    const bytes = await gzippedBytes(own, sourceCache);

    // When several islands share a chunk they genuinely share the download, so
    // the budget is checked against the strictest allowance among them.
    const sorted = [...names].sort();
    const limits = sorted.map(
      (name) => budgets.overrides?.[name]?.maxKb ?? budgets.defaultIslandKb,
    );
    const limitKb = Math.min(...limits);

    rows.push({ names: sorted, bytes, limitKb });
    if (kb(bytes) > limitKb) {
      failures.push(
        `${sorted.join(', ')} — ${formatKb(bytes)} gz, budget ${String(limitKb)} KB`,
      );
    }
  }

  const sharedLimitKb = budgets.shared?.maxKb ?? Infinity;
  const sharedOverBudget = kb(sharedBytes) > sharedLimitKb;

  console.log('\nIsland budgets (gzipped, beyond shared chunks)\n');
  console.log(`  ${'island'.padEnd(46)}${'size'.padEnd(12)}budget`);
  console.log(`  ${'-'.repeat(70)}`);
  for (const row of rows.sort((a, b) => b.bytes - a.bytes)) {
    const label = row.names.join(', ');
    console.log(
      `  ${label.slice(0, 45).padEnd(46)}${formatKb(row.bytes).padEnd(12)}${String(row.limitKb)} KB`,
    );
  }
  console.log(
    `\n  ${'shared (React + renderer)'.padEnd(46)}${formatKb(sharedBytes).padEnd(12)}${String(sharedLimitKb)} KB`,
  );

  if (rows.length === 0) {
    console.log('\n  No hydrated islands found.');
  }

  if (sharedOverBudget) {
    failures.push(
      `shared chunks — ${formatKb(sharedBytes)} gz, budget ${String(sharedLimitKb)} KB`,
    );
  }

  if (failures.length > 0) {
    console.error('\nOver budget:\n');
    for (const failure of failures) console.error(`  ${failure}`);
    console.error(
      '\nEither trim the island, or raise its entry in scripts/budgets.json' +
        '\nand say why in the PR description.\n',
    );
    exit(1);
  }

  console.log('\n  All within budget.\n');
}

if (argv.includes('--help')) {
  console.log(
    'Usage: node scripts/check-budgets.mjs   (run after `pnpm build`)',
  );
} else {
  await main();
}
