/**
 * Sitemap configuration, kept out of `astro.config.mjs` because it needs to
 * read the content collection off disk and that is thirty lines of file
 * handling in a file that should read as a list of decisions.
 *
 * TWO THINGS IT DOES that the default sitemap does not:
 *
 * 1. **Drops the pages that carry `noindex`.** A sitemap is a request to index
 *    every URL in it. Listing a page that then answers `noindex` is a
 *    contradiction Search Console reports as an error against the site, and the
 *    list of which pages are excluded has to agree with the pages themselves —
 *    hence NOINDEXED below, which is the same set the pages declare.
 *
 * 2. **Gives each lesson its real `lastmod`,** read from the unit's `updated`
 *    frontmatter. The alternative — one build timestamp across every URL —
 *    tells a crawler that all sixty-six pages changed on every deploy, which
 *    spends crawl budget re-fetching sixty-five unchanged lessons.
 *
 * `changefreq` and `priority` are deliberately absent. Both are part of the
 * sitemap protocol and both are ignored: Google has said so repeatedly, and
 * Bing has said the same. They would be decoration that looks like tuning.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const UNITS_DIR = path.join(ROOT, 'src/content/units');

/**
 * Paths kept out of the sitemap, relative to the site root and without the
 * deployment base.
 *
 * MUST match the pages that set `seo: { noindex: true }`:
 * `/gallery` and `/404` in their MDX frontmatter, `/search` and `/progress` in
 * their `.astro` templates.
 */
const NOINDEXED = ['/gallery', '/search', '/progress', '/404'];

/**
 * Map every unit id to the `updated` date in its frontmatter.
 *
 * Read with a regex rather than a YAML parser on purpose: the alternative is a
 * new dependency (hard rule 2) for two fields in a file whose shape is already
 * guaranteed by the Zod schema in `src/content.config.ts`. If the schema
 * accepts the file, these two lines are present and well-formed.
 *
 * @returns {Map<string, string>} unit id → ISO date, published units only
 */
function readUnitDates() {
  /** @type {Map<string, string>} */
  const dates = new Map();

  for (const entry of readdirSync(UNITS_DIR)) {
    if (!entry.endsWith('.mdx')) continue;

    const source = readFileSync(path.join(UNITS_DIR, entry), 'utf8');

    // Drafts are not built, so they cannot appear in the sitemap anyway. This
    // is belt and braces against a page that exists for another reason.
    if (!/^status:\s*published\s*$/m.test(source)) continue;

    const updated = /^updated:\s*(\S+)/m.exec(source);
    if (!updated?.[1]) continue;

    const parsed = new Date(updated[1]);
    if (Number.isNaN(parsed.getTime())) continue;

    dates.set(entry.replace(/\.mdx$/, ''), parsed.toISOString());
  }

  return dates;
}

/**
 * Options for `@astrojs/sitemap`.
 *
 * @returns {import('@astrojs/sitemap').SitemapOptions}
 */
export function sitemapOptions() {
  const unitDates = readUnitDates();

  return {
    filter: (page) => {
      const { pathname } = new URL(page);
      // Trailing slashes vary; compare on the stripped form.
      const stripped = pathname.replace(/\/+$/, '');
      return !NOINDEXED.some((excluded) => stripped.endsWith(excluded));
    },

    serialize: (item) => {
      const unit = /\/units\/([^/]+)\/?$/.exec(new URL(item.url).pathname);
      const lastmod = unit?.[1] ? unitDates.get(unit[1]) : undefined;

      return lastmod ? { ...item, lastmod } : item;
    },
  };
}
