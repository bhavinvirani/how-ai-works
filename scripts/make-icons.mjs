#!/usr/bin/env node
/**
 * Render every brand mark from the one glyph in `brand.mjs`.
 *
 * Usage: pnpm icons
 *
 * WHY PLAYWRIGHT. Turning an SVG into a PNG normally means adding sharp,
 * resvg or a headless converter to the toolchain — and CLAUDE.md hard rule 2
 * makes any new dependency a decision with paperwork, for a script that runs
 * roughly once a year. Chromium is already installed for the e2e suite, already
 * renders SVG exactly as the browsers this site targets do, and already knows
 * how to load the project's own webfonts. So the icons are screenshots.
 *
 * WHY THE OUTPUT IS COMMITTED. This never runs in CI. `pnpm build` must not
 * depend on a browser download, and the marks change about as often as the
 * palette does. The generated files are checked in; this script exists so that
 * when they do change, they change together and from one source.
 *
 * Every path it writes is listed in OUTPUTS below, and nothing else is touched.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { argv, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

/*
 * `document` below runs inside Chromium, not in Node. ESLint lints this file
 * with Node globals only (see the `app/node-tooling` block in eslint.config.js),
 * so the one identifier that crosses into the page has to be declared here.
 */
/* global document */

import { UNIT_CARD_DIR } from '../src/lib/seo/cards.ts';
import { PART_LABELS, PARTS } from '../src/lib/units/parts.ts';
import { site } from '../src/seo/site.ts';
import {
  cardHtml,
  FAVICON_HEADER,
  markSvg,
  readColorTokens,
  robotsTxt,
  unitCardHtml,
  webmanifest,
} from './brand.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC_DIR = path.join(ROOT, 'public');

/**
 * The raster sizes packed into `favicon.ico`.
 *
 * A modern browser prefers the SVG and never opens the .ico at all. It is here
 * for the ones that cannot: Windows pinned sites, some feed readers, and
 * anything that asks the origin for `/favicon.ico` by reflex.
 */
const ICO_SIZES = [16, 32, 48];

/** Sizes rendered for the tab-icon legibility check printed at the end. */
const PREVIEW_SIZES = [16, 32, 48];

/**
 * @typedef {object} PngTarget
 * @property {string} file
 * @property {number} size
 * @property {'rounded' | 'full' | 'maskable'} variant
 * @property {string} why
 */

/** @type {PngTarget[]} */
const OUTPUTS = [
  {
    file: 'apple-touch-icon.png',
    size: 180,
    variant: 'full',
    why: 'iOS home screen. Full-bleed because iOS rounds the corners itself.',
  },
  {
    file: 'icon-192.png',
    size: 192,
    variant: 'rounded',
    why: 'Manifest icon, purpose "any".',
  },
  {
    file: 'icon-512.png',
    size: 512,
    variant: 'rounded',
    why: 'Manifest icon, purpose "any" — install prompts and splash screens.',
  },
  {
    file: 'icon-maskable-512.png',
    size: 512,
    variant: 'maskable',
    why: 'Manifest icon, purpose "maskable" — glyph inside the safe zone.',
  },
];

/**
 * Pack PNGs into a Windows .ico container.
 *
 * ICO has accepted whole PNG files as its image payload since Windows Vista,
 * which is what makes this twenty lines instead of a BMP encoder. The header is
 * a 6-byte directory followed by one 16-byte entry per image, then the payloads.
 *
 * @param {{ size: number, data: Buffer }[]} images
 * @returns {Buffer}
 */
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon (2 would be a cursor)
  header.writeUInt16LE(images.length, 4);

  /** @type {Buffer[]} */
  const entries = [];
  let offset = header.length + images.length * 16;

  for (const image of images) {
    const entry = Buffer.alloc(16);
    // 0 means 256 in this field, which is why it is a single byte.
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 0);
    entry.writeUInt8(image.size >= 256 ? 0 : image.size, 1);
    entry.writeUInt8(0, 2); // palette size — 0 for truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(image.data.length, 8);
    entry.writeUInt32LE(offset, 12);

    offset += image.data.length;
    entries.push(entry);
  }

  return Buffer.concat([
    header,
    ...entries,
    ...images.map((image) => image.data),
  ]);
}

/**
 * Read a woff2 off disk as base64, for inlining into the card.
 *
 * @param {string} relativePath
 * @returns {Promise<string>}
 */
async function fontData(relativePath) {
  const buffer = await readFile(path.join(ROOT, 'node_modules', relativePath));
  return buffer.toString('base64');
}

/**
 * Every published unit, with the two fields its card needs.
 *
 * Read with a regex rather than a YAML parser for the same reason
 * `scripts/sitemap.mjs` does: the alternative is a dependency (hard rule 2) for
 * three fields in a file whose shape the Zod schema in `src/content.config.ts`
 * already guarantees. Drafts are skipped — they are not built, so a card for
 * one would be an orphan.
 *
 * @returns {Promise<{ id: string, title: string, part: string }[]>}
 */
async function readPublishedUnits() {
  const { glob } = await import('node:fs/promises');

  /** @type {{ id: string, title: string, part: string }[]} */
  const units = [];

  for await (const entry of glob('src/content/units/*.mdx', { cwd: ROOT })) {
    const source = await readFile(path.join(ROOT, entry), 'utf8');
    if (!/^status:\s*published\s*$/m.test(source)) continue;

    const title = /^title:\s*(.+)$/m.exec(source)?.[1]?.trim();
    const part = /^part:\s*(.+)$/m.exec(source)?.[1]?.trim();
    if (!title || !part) continue;

    units.push({
      id: path.basename(entry, '.mdx'),
      // YAML quotes a scalar only when it has to (a colon, a leading quote).
      // None of the sixty currently do; stripping is cheap insurance for the
      // first one that does.
      title: title.replace(/^['"]|['"]$/g, ''),
      part: part.replace(/^['"]|['"]$/g, ''),
    });
  }

  return units.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * `PART_LABELS` is keyed by the Part union, so indexing it with a string read
 * out of a file will not type-check — the same argument `new-unit.mjs` makes
 * about `PARTS`. Widening is what lets an arbitrary string be *looked up*
 * rather than assumed.
 *
 * The `??` fallback below is unreachable in a built site (Zod rejects an unknown
 * `part` at `astro build`), but this script runs on its own, so a card falling
 * back to the raw slug beats one reading "undefined".
 *
 * @type {Record<string, string>}
 */
const partLabels = PART_LABELS;

async function main() {
  const tokens = await readColorTokens();

  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 1 });

  /**
   * Screenshot a standalone SVG at an exact pixel size.
   *
   * `omitBackground` keeps the area outside the tile's rounded corners
   * transparent — without it every icon ships with white shoulders that only
   * become visible against a dark browser tab.
   *
   * @param {string} svg
   * @param {number} size
   * @returns {Promise<Buffer>}
   */
  async function rasterise(svg, size) {
    const page = await context.newPage();
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${svg}`,
    );
    const shot = await page.screenshot({ omitBackground: true });
    await page.close();
    return shot;
  }

  /** @type {string[]} */
  const written = [];

  // 1. The scalable favicon, which is what every current browser actually uses.
  const faviconSvg = `${FAVICON_HEADER}\n${markSvg({ tokens, variant: 'rounded' })}\n`;
  await writeFile(path.join(PUBLIC_DIR, 'favicon.svg'), faviconSvg, 'utf8');
  written.push('favicon.svg');

  // 2. The legacy container, for the browsers and tools that cannot read it.
  const icoImages = [];
  for (const size of ICO_SIZES) {
    icoImages.push({
      size,
      data: await rasterise(
        markSvg({ tokens, variant: 'rounded', size }),
        size,
      ),
    });
  }
  await writeFile(path.join(PUBLIC_DIR, 'favicon.ico'), packIco(icoImages));
  written.push(`favicon.ico (${ICO_SIZES.join(', ')}px)`);

  // 3. Home-screen and manifest icons.
  for (const target of OUTPUTS) {
    const png = await rasterise(
      markSvg({ tokens, variant: target.variant, size: target.size }),
      target.size,
    );
    await writeFile(path.join(PUBLIC_DIR, target.file), png);
    written.push(target.file);
  }

  // 4. The two text files that carry the same facts as the icons.
  await writeFile(
    path.join(PUBLIC_DIR, 'site.webmanifest'),
    webmanifest(tokens),
    'utf8',
  );
  written.push('site.webmanifest');

  await writeFile(path.join(PUBLIC_DIR, 'robots.txt'), robotsTxt(), 'utf8');
  written.push('robots.txt');

  // 5. The social card.
  const [display, body, mono] = await Promise.all([
    fontData(
      '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2',
    ),
    fontData(
      '@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2',
    ),
    fontData(
      '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
    ),
  ]);

  const units = await readPublishedUnits();

  /**
   * Shoot one 1200×630 card. Reuses a single page across all sixty-one renders
   * — a fresh page per card re-parses ~400 KB of inlined webfont each time,
   * which turns twenty seconds into three minutes.
   *
   * @param {string} html
   * @param {string} destination absolute path
   */
  async function shootCard(html, destination) {
    await cardPage.setContent(html);
    // Webfonts load asynchronously even from a data: URI. Shooting before they
    // settle produces a card set in the fallback face, which looks close enough
    // to correct in a thumbnail that it survives review.
    await cardPage.evaluate(() => document.fonts.ready);
    await cardPage.screenshot({ path: destination });
  }

  const cardPage = await context.newPage();
  await cardPage.setViewportSize({
    width: site.ogImage.width,
    height: site.ogImage.height,
  });

  await shootCard(
    cardHtml({
      tokens,
      display,
      body,
      mono,
      eyebrow: `${String(units.length)} lessons · ${String(PARTS.length)} parts · open source`,
      width: site.ogImage.width,
      height: site.ogImage.height,
    }),
    path.join(PUBLIC_DIR, path.basename(site.ogImage.path)),
  );
  written.push(
    `${path.basename(site.ogImage.path)} (${String(site.ogImage.width)}×${String(site.ogImage.height)})`,
  );

  // 6. One card per lesson.
  //
  // Sixty links that all unfurl into the same picture tell a reader nothing
  // about which one they were handed. These lead with the lesson's own title.
  //
  // They are generated here and committed rather than built in CI, for the same
  // reason as the icons: `pnpm build` must not depend on a browser download.
  // Regenerating produces byte-identical files when nothing changed, so git
  // stores no new objects — a title edit costs one blob, not sixty.
  const cardDir = path.join(ROOT, UNIT_CARD_DIR);
  await mkdir(cardDir, { recursive: true });

  for (const unit of units) {
    await shootCard(
      unitCardHtml({
        tokens,
        display,
        body,
        mono,
        title: unit.title,
        part: partLabels[unit.part] ?? unit.part,
        width: site.ogImage.width,
        height: site.ogImage.height,
      }),
      path.join(cardDir, `${unit.id}.png`),
    );
  }
  written.push(`${UNIT_CARD_DIR}/*.png (${String(units.length)} lessons)`);

  await cardPage.close();

  // 7. Throwaway renders at tab size. The glyph has to survive 16px, and the
  // only way to know it does is to look at it, so `--preview` leaves the
  // evidence somewhere it can be opened.
  if (argv.includes('--preview')) {
    for (const size of PREVIEW_SIZES) {
      const png = await rasterise(
        markSvg({ tokens, variant: 'rounded', size }),
        size,
      );
      await writeFile(path.join(ROOT, `preview-${String(size)}.png`), png);
    }
    written.push(`preview-{${PREVIEW_SIZES.join(',')}}.png (untracked)`);
  }

  await browser.close();

  console.log('\n  Brand marks written to public/:\n');
  for (const file of written) console.log(`    ${file}`);
  console.log('');
}

try {
  await main();
} catch (error) {
  console.error(`\n  Icon generation failed: ${String(error)}\n`);
  exit(1);
}
