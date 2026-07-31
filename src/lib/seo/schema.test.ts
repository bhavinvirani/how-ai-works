import { describe, expect, it } from 'vitest';

import type { SchemaSite } from './schema';
import { articleSchema, breadcrumbSchema, websiteSchema } from './schema';

const SITE: SchemaSite = {
  name: 'How AI Actually Works',
  url: 'https://example.test/how-ai-works/',
  description: 'A description.',
  locale: 'en_GB',
  author: { name: 'A Person', url: 'https://example.test/person' },
};

describe('websiteSchema', () => {
  it('converts the Open Graph locale to the BCP 47 form JSON-LD wants', () => {
    // og:locale is `en_GB`, inLanguage is `en-GB`. Shipping the underscore is a
    // validator warning rather than a failure, so it survives review.
    expect(websiteSchema(SITE).inLanguage).toBe('en-GB');
  });

  it('names the site and its author', () => {
    const node = websiteSchema(SITE);
    expect(node['@type']).toBe('WebSite');
    expect(node.url).toBe(SITE.url);
    expect(node.author).toMatchObject({ '@type': 'Person', name: 'A Person' });
  });
});

describe('articleSchema', () => {
  const node = articleSchema({
    title: 'Attention',
    summary: 'How a model decides which words matter.',
    url: 'https://example.test/how-ai-works/units/attention/',
    image: 'https://example.test/how-ai-works/og.png',
    modified: new Date('2026-07-31T00:00:00Z'),
    license: 'https://creativecommons.org/licenses/by/4.0/',
    site: SITE,
  });

  it('declares both what search engines read and what the page is', () => {
    expect(node['@type']).toEqual(['Article', 'LearningResource']);
  });

  it('states an absolute, canonical url in both places it appears', () => {
    expect(node.url).toBe('https://example.test/how-ai-works/units/attention/');
    expect(node.mainEntityOfPage).toMatchObject({
      '@id': 'https://example.test/how-ai-works/units/attention/',
    });
  });

  it('serialises dateModified as ISO 8601', () => {
    expect(node.dateModified).toBe('2026-07-31T00:00:00.000Z');
  });

  it('claims no publication date', () => {
    // Unit frontmatter carries only `updated`. Passing it as datePublished too
    // would assert, in a machine-readable format, that every lesson was written
    // the day it was last edited.
    expect(node).not.toHaveProperty('datePublished');
  });

  it('teaches what its summary says', () => {
    expect(node.teaches).toBe('How a model decides which words matter.');
  });
});

describe('breadcrumbSchema', () => {
  const node = breadcrumbSchema([
    { name: 'Home', url: 'https://example.test/how-ai-works/' },
    { name: 'All lessons', url: 'https://example.test/how-ai-works/map/' },
    { name: 'Attention' },
  ]);

  it('numbers the trail from one', () => {
    const items = node.itemListElement as { position: number }[];
    expect(items.map((item) => item.position)).toEqual([1, 2, 3]);
  });

  it('gives every step but the last an item url', () => {
    // Google requires it: a trail whose middle step has no URL is dropped.
    const items = node.itemListElement as Record<string, unknown>[];
    expect(items[0]).toHaveProperty('item');
    expect(items[1]).toHaveProperty('item');
    expect(items[2]).not.toHaveProperty('item');
  });
});
