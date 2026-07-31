/**
 * JSON-LD builders.
 *
 * Structured data is the one part of SEO that is not a hint: it is a set of
 * factual claims about the page, machine-read and taken at face value. So these
 * builders emit only what the site can actually prove from its own content, and
 * every field below traces to something in unit frontmatter, `site.ts`, or the
 * repository's licence files.
 *
 * TWO THINGS ARE DELIBERATELY ABSENT, and both would be easy to add badly:
 *
 * - **`datePublished`.** Unit frontmatter carries `updated` and nothing else.
 *   Google wants `datePublished` for an Article rich result, and the tempting
 *   move is to pass `updated` for both — which states, falsely, that every
 *   lesson was written the day it was last touched. A missing field costs a
 *   rich-result eligibility; a wrong one is a lie in a machine-readable format.
 *
 * - **`Course` and `potentialAction: SearchAction`.** The first needs a
 *   `courseWorkload` figure nobody has measured. The second — the sitelinks
 *   searchbox — was deprecated by Google in November 2024 and is now ignored.
 */

/** The facts every node needs, resolved once by the caller. */
export interface SchemaSite {
  name: string;
  /** Absolute, with a trailing slash. */
  url: string;
  description: string;
  locale: string;
  author: { name: string; url: string };
}

/** A JSON-LD node. Values are whatever schema.org allows, so `unknown` it is. */
export type SchemaNode = Record<string, unknown>;

/**
 * BCP 47 from an Open Graph locale: `en_GB` → `en-GB`.
 *
 * `og:locale` and JSON-LD `inLanguage` want the same information in two
 * different notations, and shipping the underscore form to `inLanguage` is a
 * validator warning rather than a visible failure — so it survives review.
 */
function bcp47(locale: string): string {
  return locale.replace('_', '-');
}

function person(author: { name: string; url: string }): SchemaNode {
  return { '@type': 'Person', name: author.name, url: author.url };
}

/**
 * The site itself. Emitted once, on the home page.
 *
 * Repeating it on all sixty-six pages is common and harmless, but it says
 * nothing new sixty-five times and makes every page heavier.
 */
export function websiteSchema(site: SchemaSite): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: bcp47(site.locale),
    author: person(site.author),
    publisher: person(site.author),
    isAccessibleForFree: true,
  };
}

export interface ArticleSchemaInput {
  title: string;
  /** The unit's one-sentence summary — its `description` and what it `teaches`. */
  summary: string;
  /** Absolute canonical URL. */
  url: string;
  /** Absolute URL of the social image. */
  image: string;
  /** From unit frontmatter's `updated`. */
  modified: Date;
  /** Absolute URL of the content licence. */
  license: string;
  site: SchemaSite;
}

/**
 * A lesson page.
 *
 * Typed as both `Article` and `LearningResource`. `Article` is what search
 * engines actually consume; `LearningResource` is what the page honestly is,
 * and it carries `teaches` and `learningResourceType`, which have no `Article`
 * equivalent. Declaring both is ordinary schema.org practice, not a trick.
 */
export function articleSchema(input: ArticleSchemaInput): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': ['Article', 'LearningResource'],
    headline: input.title,
    name: input.title,
    description: input.summary,
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    image: input.image,
    dateModified: input.modified.toISOString(),
    inLanguage: bcp47(input.site.locale),
    author: person(input.site.author),
    publisher: person(input.site.author),
    license: input.license,
    isAccessibleForFree: true,
    isPartOf: {
      '@type': 'WebSite',
      name: input.site.name,
      url: input.site.url,
    },
    learningResourceType: 'Lesson',
    educationalLevel: 'Beginner',
    /** What the reader should be able to do afterwards — the unit's `summary`. */
    teaches: input.summary,
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL. Omitted on the final item, which is the current page. */
  url?: string;
}

/**
 * The trail shown in place of a raw URL in a search result.
 *
 * Google requires every item except the last to carry a URL, so a trail
 * through a page that does not exist is worse than no trail. Here the middle
 * step is `/map`, which is genuinely the curriculum index: it lists every unit,
 * grouped by Part, server-rendered.
 */
export function breadcrumbSchema(items: BreadcrumbItem[]): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      ...(entry.url ? { item: entry.url } : {}),
    })),
  };
}
