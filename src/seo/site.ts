/**
 * Site identity — the single source of truth for everything a crawler, a social
 * card, or an icon needs to know about this site.
 *
 * WHY THIS FILE EXISTS. The same handful of strings were about to be needed in
 * five places that cannot import each other: the page `<head>`, the web app
 * manifest, the Open Graph image, the JSON-LD graph, and `robots.txt`. Left
 * inline they drift, and the drift is invisible — a stale `og:site_name` or a
 * manifest naming the site something the header does not is not a build error,
 * it is just quietly wrong on every share for a year.
 *
 * `scripts/brand.mjs` imports this module directly to render the Open Graph
 * image, exactly as `scripts/new-unit.mjs` imports `lib/units/parts.ts` — Node
 * strips the types on the way in (>= 24.16 is already required by `engines`),
 * so the picture and the page cannot disagree about what the site is called.
 *
 * This is NOT `src/copy/en.ts`. That file holds interface chrome a reader sees
 * inside the page; this one holds metadata *about* the page, most of which is
 * never rendered as visible text. The one overlap — `name` — is the site title,
 * which is genuinely the same fact in both places.
 */

export const site = {
  /** The full title. Also the `og:site_name` and the manifest `name`. */
  name: 'How AI Actually Works',

  /** For places with no room for the full title — the manifest `short_name`. */
  shortName: 'How AI Works',

  /**
   * Origin only, no path and no trailing slash.
   *
   * The deployment path lives in `astro.config.mjs` as `base`, and everything
   * that needs a full URL builds one from `Astro.site`. Keeping the origin here
   * as well would create a second source of truth for the same string; it is
   * here only because `robots.txt` and the icon generator run outside Astro and
   * cannot reach `Astro.site`.
   */
  origin: 'https://bhavinvirani.github.io',

  /** The deployment path, matching `base` in astro.config.mjs. */
  base: '/how-ai-works',

  /**
   * The default description: used on any page that does not set its own, and
   * as the Open Graph description for the home page.
   *
   * Kept under ~160 characters. Google truncates the snippet around there, and
   * a description that ends mid-clause reads as carelessness on a site whose
   * whole argument is that explanations should be finished.
   */
  description:
    'Learn how AI and machine learning actually work, from first principles — plain English, custom diagrams, and instruments you can poke at. Free and open source.',

  /** One line, for the Open Graph image and the manifest. */
  tagline: 'AI and machine learning, from first principles.',

  author: {
    name: 'Bhavin Virani',
    url: 'https://github.com/bhavinvirani',
  },

  /**
   * `en-GB` rather than `en-US`: the prose is written in British English
   * throughout ("colour", "maths", "recognise"). `<html lang>` stays the
   * broader `en` — the distinction matters to a search engine choosing a
   * regional result, not to a screen reader choosing a voice.
   */
  locale: 'en_GB',

  repository: 'https://github.com/bhavinvirani/how-ai-works',

  /**
   * The CONTENT licence (CC BY 4.0), not the code licence (MIT). JSON-LD
   * `license` on a lesson describes the lesson, and this repository is
   * deliberately dual-licensed — see LICENSE-content.
   */
  contentLicense: 'https://creativecommons.org/licenses/by/4.0/',

  /** The shared social card. Base-relative; made absolute at render time. */
  ogImage: {
    path: '/og.png',
    width: 1200,
    height: 630,
    /**
     * Alt text for the social card. Read aloud by screen readers on platforms
     * that expose it, and shown by some clients when the image fails to load —
     * so it describes the card, rather than repeating the title.
     */
    alt: 'How AI Actually Works — AI and machine learning from first principles, shown as a network of connected ideas.',
  },

  /**
   * The colour of the browser chrome on mobile. Paper, not navy: this is a
   * light site, and a dark `theme-color` puts a black bar above a sage page.
   * The literal value is resolved from `--color-paper` at build time rather
   * than written here, because hard rule 1 allows exactly one file to declare a
   * colour and this is not it.
   */
  themeColorToken: '--color-paper',

  analytics: {
    /**
     * GoatCounter's counting endpoint. Cookieless and anonymous: it records a
     * page view, a referrer and a coarse browser/country, and sets nothing on
     * the visitor's device. Loaded only on the production deploy — see
     * `BaseLayout.astro`.
     */
    goatcounter: 'https://bhavinvirani01.goatcounter.com/count',
  },

  /**
   * Ownership-verification tokens, empty until issued.
   *
   * Each renders a `<meta>` tag only when non-empty, so an unverified property
   * ships no tag at all rather than a placeholder that looks configured and is
   * not. See `docs/SEO.md` for where to get one and where it goes.
   */
  verification: {
    /** Google Search Console → Add property → URL prefix → HTML tag. */
    google: '',
    /** Bing Webmaster Tools. */
    bing: '',
  },

  /**
   * `@handle`, with the at-sign, or empty.
   *
   * Only `twitter:site` needs it, and X shows the byline it produces on the
   * card. An empty string ships no tag — a card attributed to nobody is better
   * than one attributed to a handle that does not exist.
   */
  xHandle: '',
} as const;

/** The site's own home URL, absolute and trailing-slashed. */
export const siteUrl = `${site.origin}${site.base}/`;
