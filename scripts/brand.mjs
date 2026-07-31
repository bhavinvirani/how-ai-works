/**
 * The brand marks, as code.
 *
 * This module holds the *design* of the icon and the social card; the
 * rasterising machinery is next door in `make-icons.mjs`. Everything a browser
 * or an app store ever shows for this site — the tab icon, the home-screen
 * icon, the card that appears when somebody pastes a link into Slack — is
 * generated from the one glyph defined below, so there is no way for the
 * favicon and the touch icon to drift into being different pictures.
 *
 * COLOURS ARE READ, NOT WRITTEN. CLAUDE.md hard rule 1 allows exactly one file
 * in this repository to declare a colour, and `eslint-rules/no-raw-color.js`
 * enforces it here as much as in a component. So this file parses
 * `src/styles/tokens.css` and fails loudly if a token it needs has been renamed
 * — which is a better outcome than an icon quietly rendering in last season's
 * palette, since nobody re-examines a favicon.
 *
 * THE GLYPH is the site's own subject matter: a small graph of connected ideas,
 * the same shape `/map` draws at full size. Four nodes, four edges, one of them
 * accented — a lesson, and what it is standing on.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { site } from '../src/seo/site.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/**
 * Tokens this module cannot render without. Listed explicitly so a rename in
 * `tokens.css` fails here with the token's name in the message, rather than
 * producing an icon painted in `undefined`.
 */
const REQUIRED_TOKENS = [
  'paper',
  'ink',
  'ink-muted',
  'ink-faint',
  'rule-strong',
  'accent',
];

/**
 * Parse the `--color-*` custom properties out of the design-token source.
 *
 * @returns {Promise<Record<string, string>>}
 */
export async function readColorTokens() {
  const source = await readFile(
    path.join(ROOT, 'src/styles/tokens.css'),
    'utf8',
  );

  // Comments in tokens.css mention token names in prose. Stripping them first
  // is cheaper than a regex clever enough to tell a declaration from a sentence.
  const declarations = source.replace(/\/\*[\s\S]*?\*\//g, '');

  /** @type {Record<string, string>} */
  const tokens = {};
  const pattern = /--color-([a-z0-9-]+)\s*:\s*([^;]+);/g;

  let match;
  while ((match = pattern.exec(declarations)) !== null) {
    tokens[match[1]] = match[2].trim();
  }

  const missing = REQUIRED_TOKENS.filter((name) => !tokens[name]);
  if (missing.length > 0) {
    throw new Error(
      `src/styles/tokens.css is missing --color-${missing.join(', --color-')}. ` +
        'The brand marks are generated from those tokens; rename them here too.',
    );
  }

  return tokens;
}

/**
 * The glyph, on a 32-unit grid.
 *
 * TUNED FOR 16px, WHICH IS THE ONLY SIZE THAT IS HARD, and tuned by looking
 * rather than by taste — `pnpm icons --preview` writes the 16, 32 and 48px
 * rasters out so they can be inspected at 8× before any of this is believed.
 * Three findings from that, all of which cost a redesign to learn:
 *
 * 1. **Fat dots, thin edges.** The obvious instinct is a heavy connector, and
 *    it is wrong: at 16px a 2.4-unit stroke is 1.2 device pixels, which
 *    anti-aliases into a grey smear that swallows the nodes it joins. A
 *    1.7-unit stroke lands near a single crisp pixel, and the dots stay the
 *    thing you see.
 *
 * 2. **No node may have three edges.** Three lines meeting at one 3-pixel
 *    circle is a blob. Every node here has exactly two.
 *
 * 3. **The quadrilateral must be irregular.** Four nodes near the corners
 *    joined by axis-aligned edges is legible and useless — it reads as a
 *    rectangle, a table, a window. Every edge below is a diagonal, which is
 *    what makes the same four dots read as a network.
 */
const GRID = 32;

/** @type {{ x: number, y: number, r: number, accent?: boolean }[]} */
const NODES = [
  { x: 8.5, y: 12.8, r: 3.7 },
  { x: 18.3, y: 7.4, r: 3.3 },
  { x: 22.7, y: 18.0, r: 4.6, accent: true },
  { x: 12.7, y: 24.6, r: 3.3 },
];

/**
 * Index pairs into NODES, walking the ring. Every node ends up with degree two
 * — see finding 2 above — and the enclosed gap in the middle is what stops the
 * whole thing collapsing into one shape when it is shrunk.
 */
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

const EDGE_WIDTH = 1.7;
const EDGE_OPACITY = 1;

/** Corner radius of the tile, on the same 32-unit grid. */
const TILE_RADIUS = 7;

/**
 * Render the glyph's `<g>` contents at a given scale about the grid centre.
 *
 * @param {Record<string, string>} tokens
 * @param {number} scale 1 fills the tile; below 1 insets it, for maskable icons.
 * @returns {string}
 */
function glyph(tokens, scale) {
  const centre = GRID / 2;
  /** @param {number} value */
  const at = (value) => centre + (value - centre) * scale;

  const edges = EDGES.map(([from, to]) => {
    const a = NODES[from];
    const b = NODES[to];
    return `<line x1="${at(a.x).toFixed(2)}" y1="${at(a.y).toFixed(2)}" x2="${at(b.x).toFixed(2)}" y2="${at(b.y).toFixed(2)}" />`;
  }).join('\n      ');

  const dots = NODES.map((node) => {
    const fill = node.accent ? tokens.accent : tokens.paper;
    return `<circle cx="${at(node.x).toFixed(2)}" cy="${at(node.y).toFixed(2)}" r="${(node.r * scale).toFixed(2)}" fill="${fill}" />`;
  }).join('\n    ');

  return `<g
      stroke="${tokens.paper}"
      stroke-opacity="${EDGE_OPACITY}"
      stroke-width="${(EDGE_WIDTH * scale).toFixed(2)}"
      stroke-linecap="round"
    >
      ${edges}
    </g>
    ${dots}`;
}

/**
 * A complete SVG document for the mark.
 *
 * @param {object} options
 * @param {Record<string, string>} options.tokens
 * @param {'rounded' | 'full' | 'maskable'} options.variant
 *   `rounded` is the tile as designed — the favicon, and the manifest's `any`
 *   icons. `full` bleeds the tile to the edges because iOS applies its own
 *   corner radius to `apple-touch-icon`, and rounding it twice leaves a visibly
 *   inset badge. `maskable` also bleeds, and additionally shrinks the glyph
 *   into the central safe zone the maskable spec guarantees will survive
 *   whatever shape an Android launcher decides to crop it to.
 * @param {number} [options.size] Pixel width/height. Omitted for the scalable favicon.
 * @returns {string}
 */
export function markSvg({ tokens, variant, size }) {
  const dimensions =
    size === undefined ? '' : ` width="${size}" height="${size}"`;
  const radius = variant === 'rounded' ? TILE_RADIUS : 0;
  const scale = variant === 'maskable' ? 0.68 : 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID} ${GRID}"${dimensions} role="img" aria-label="${site.name}">
    <rect width="${GRID}" height="${GRID}" rx="${radius}" fill="${tokens.ink}" />
    ${glyph(tokens, scale)}
  </svg>`;
}

/**
 * The header written above the generated `public/favicon.svg`.
 *
 * `allow-raw-color` is load-bearing: `scripts/check-raw-colors.mjs` exempts
 * this file by path, but the marker keeps the reason visible to whoever opens
 * it wondering why it is allowed to contain hex.
 */
export const FAVICON_HEADER = `<!-- GENERATED by \`pnpm icons\` from scripts/brand.mjs — do not edit by hand.
     allow-raw-color: a standalone favicon is loaded directly by the browser and
     is never part of the CSS cascade, so it cannot reference custom properties.
     These values are copied from src/styles/tokens.css at generation time. -->`;

/**
 * The web app manifest.
 *
 * Generated rather than hand-written for one reason: `theme_color` and
 * `background_color` are colours, and a JSON file is somewhere neither
 * `check-raw-colors.mjs` nor the ESLint rule can see. Left static it would be
 * the one place in the repository quietly holding a copy of `--color-paper`,
 * and the copy that nobody looks at is the copy that goes stale.
 *
 * Every path is relative (`./`), which is what makes it base-path safe with no
 * help: the manifest is served from `/how-ai-works/site.webmanifest`, so `./`
 * resolves to the deployment root — and on a PR preview it resolves to the
 * preview root, which a base-absolute path could not do.
 *
 * @param {Record<string, string>} tokens
 * @returns {string}
 */
export function webmanifest(tokens) {
  return `${JSON.stringify(
    {
      id: './',
      name: site.name,
      short_name: site.shortName,
      description: site.tagline,
      start_url: './',
      scope: './',
      // `minimal-ui`, not `standalone`: this is sixty linked pages, and
      // stripping the back button off a site people read in sequence trades a
      // tidier frame for a worse one to actually use.
      display: 'minimal-ui',
      background_color: tokens.paper,
      theme_color: tokens.paper,
      lang: site.locale.replace('_', '-'),
      // No `categories`: the field is only read by app-store-style catalogues,
      // none of which ingest a GitHub Pages site. It also happens to be the one
      // key whose JSON.stringify output disagrees with Prettier's — a
      // single-element array, which Prettier collapses onto one line — so
      // shipping it would fail `pnpm format:check` after every `pnpm icons`.
      icons: [
        {
          src: './favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: './icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: './icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: './icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2,
  )}\n`;
}

/**
 * `robots.txt`.
 *
 * WORTH KNOWING BEFORE TRUSTING THIS FILE: on a GitHub project page it is
 * served from `/how-ai-works/robots.txt`, and crawlers read robots.txt only
 * from the origin root — here `bhavinvirani.github.io/robots.txt`, which
 * belongs to a `bhavinvirani.github.io` repository that does not currently
 * exist (it answers 404). So this file is inert today. It is shipped because it
 * is conventional, costs nothing, and becomes authoritative the moment a custom
 * domain points at this site.
 *
 * What actually keeps previews and utility pages out of an index is the
 * `<meta name="robots">` tag from `SeoHead.astro`, which is per page and needs
 * no cooperation from the origin.
 *
 * @returns {string}
 */
export function robotsTxt() {
  return `# Served from ${site.base}/robots.txt, which crawlers do NOT read: robots.txt is
# only honoured at the origin root (${site.origin}/robots.txt), and that
# belongs to a different repository. Per-page <meta name="robots"> is what
# governs indexing here — see docs/SEO.md.
#
# GENERATED by \`pnpm icons\` from scripts/brand.mjs — do not edit by hand.

User-agent: *
Allow: /

Sitemap: ${site.origin}${site.base}/sitemap-index.xml
`;
}

/**
 * The artwork on the social card: the icon's own graph, grown outward.
 *
 * The first version of this was a different, larger constellation, on the
 * theory that a 1200px canvas deserves more nodes. It read as decoration — a
 * generic network stock illustration, related to the favicon by palette alone.
 *
 * This one is the icon: the same four nodes in the same kite, at 10× scale,
 * with one satellite hung off each corner. So the mark in the browser tab and
 * the picture on the shared link are visibly the same object at two zoom
 * levels, which is the entire job of a social card.
 *
 * @param {Record<string, string>} tokens
 * @returns {string}
 */
function cardArt(tokens) {
  const SCALE = 9.5;
  const CENTRE = { x: 186, y: 172 };

  /** Grid coordinate → card coordinate. @param {number} value @param {'x'|'y'} axis */
  const at = (value, axis) => CENTRE[axis] + (value - GRID / 2) * SCALE;

  const kite = NODES.map((node, index) => ({
    x: at(node.x, 'x'),
    y: at(node.y, 'y'),
    // Not `node.r * SCALE`: the icon's radii are sized against a 16px tab, and
    // that ratio looks bulbous once there is room to breathe.
    r: [16, 14, 21, 14][index],
    accent: node.accent === true,
  }));

  /** One satellite per kite node, pushed outward from the centre. */
  const satellites = [
    { x: 40, y: 104 },
    { x: 296, y: 40 },
    { x: 344, y: 250 },
    { x: 78, y: 300 },
  ].map((point) => ({ ...point, r: 9.5, accent: false }));

  const nodes = [...kite, ...satellites];
  const edges = [
    ...EDGES,
    ...kite.map((_, index) => [index, kite.length + index]),
  ];

  const lines = edges
    .map(([from, to]) => {
      const a = nodes[from];
      const b = nodes[to];
      return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" />`;
    })
    .join('');

  const dots = nodes
    .map(
      (node) =>
        `<circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${String(node.r)}" fill="${node.accent ? tokens.accent : tokens.ink}" />`,
    )
    .join('');

  return `<svg viewBox="0 0 384 340" width="420" height="372" aria-hidden="true">
      <g stroke="${tokens['rule-strong']}" stroke-width="4.2" stroke-linecap="round">${lines}</g>
      ${dots}
    </svg>`;
}

/**
 * The Open Graph card, as a standalone HTML document for Chromium to shoot.
 *
 * The fonts arrive base64-inlined rather than by URL on purpose: a page loaded
 * through `page.setContent` has no document origin, so a `file://` webfont
 * request is refused and Chromium silently falls back to a system face. The
 * card then renders in Helvetica and looks like a different project's — a
 * failure with no error message, which is why it is worth the extra bytes.
 *
 * @param {object} options
 * @param {Record<string, string>} options.tokens
 * @param {string} options.display base64 woff2 for the display face
 * @param {string} options.body base64 woff2 for the body face
 * @param {string} options.mono base64 woff2 for the mono face
 * @param {string} options.eyebrow e.g. "60 lessons · 16 parts · open source"
 * @param {number} options.width
 * @param {number} options.height
 * @returns {string}
 */
export function cardHtml({
  tokens,
  display,
  body,
  mono,
  eyebrow,
  width,
  height,
}) {
  const homeUrl = `${site.origin}${site.base}`.replace(/^https?:\/\//, '');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: 'Display';
        src: url(data:font/woff2;base64,${display}) format('woff2');
        font-weight: 200 800;
      }
      @font-face {
        font-family: 'Body';
        src: url(data:font/woff2;base64,${body}) format('woff2');
        font-weight: 100 900;
      }
      @font-face {
        font-family: 'Mono';
        src: url(data:font/woff2;base64,${mono}) format('woff2');
        font-weight: 100 800;
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        width: ${width}px;
        height: ${height}px;
        display: flex;
        align-items: center;
        gap: 56px;
        padding: 76px 84px;
        background: ${tokens.paper};
        color: ${tokens.ink};
        font-family: 'Body', sans-serif;
        overflow: hidden;
      }

      /* A hairline of accent down the left edge — the same magenta the site
         uses for "you are here", scaled up to poster size. */
      body::before {
        content: '';
        position: fixed;
        inset: 0 auto 0 0;
        width: 14px;
        background: ${tokens.accent};
      }

      .copy { flex: 1 1 auto; min-width: 0; }

      /* nowrap is load-bearing: the eyebrow is a single run of metadata, and
         letting it break mid-phrase — "· OPEN / SOURCE" — is the detail that
         makes a card look automated. If it ever stops fitting, shorten it. */
      .eyebrow {
        font-family: 'Mono', monospace;
        font-size: 21px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        white-space: nowrap;
        color: ${tokens['ink-faint']};
        margin-bottom: 26px;
      }

      h1 {
        font-family: 'Display', sans-serif;
        font-size: 90px;
        font-weight: 700;
        line-height: 1.02;
        letter-spacing: -0.03em;
        text-wrap: balance;
      }

      .tagline {
        margin-top: 26px;
        font-size: 33px;
        line-height: 1.42;
        color: ${tokens['ink-muted']};
        max-width: 22ch;
      }

      .url {
        margin-top: 40px;
        font-family: 'Mono', monospace;
        font-size: 23px;
        color: ${tokens['ink-faint']};
      }

      .art { flex: 0 0 auto; opacity: 0.95; }
    </style>
  </head>
  <body>
    <div class="copy">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${site.name}</h1>
      <p class="tagline">${site.tagline}</p>
      <p class="url">${homeUrl}</p>
    </div>
    <div class="art">${cardArt(tokens)}</div>
  </body>
</html>`;
}
