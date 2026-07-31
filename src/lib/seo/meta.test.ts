import { describe, expect, it } from 'vitest';

import {
  canonicalPathname,
  isHomePath,
  pageTitle,
  robotsDirective,
} from './meta';

const SITE = 'How AI Actually Works';

describe('pageTitle', () => {
  it('suffixes an ordinary page with the site name', () => {
    expect(pageTitle('Attention', SITE)).toBe(
      'Attention | How AI Actually Works',
    );
  });

  it('leaves the home page as the site name alone', () => {
    expect(pageTitle(SITE, SITE)).toBe(SITE);
  });

  it('does not suffix a title that already carries one', () => {
    // Every page on the site wrote its own suffix before the template existed.
    // Missing this case produces "Gallery — Site — Site" on the pages that were
    // never updated, which is exactly the sort of thing nobody notices.
    expect(pageTitle('Gallery | How AI Actually Works', SITE)).toBe(
      'Gallery | How AI Actually Works',
    );
    // The two separators used before the em dash was retired, so a title
    // written by hand against an older convention is still not double-suffixed.
    expect(pageTitle('Gallery — How AI Actually Works', SITE)).toBe(
      'Gallery — How AI Actually Works',
    );
    expect(pageTitle('Gallery - How AI Actually Works', SITE)).toBe(
      'Gallery - How AI Actually Works',
    );
  });

  it('falls back to the site name when a page supplies no title', () => {
    expect(pageTitle('   ', SITE)).toBe(SITE);
  });
});

describe('canonicalPathname', () => {
  it('adds the trailing slash the built site actually serves', () => {
    expect(canonicalPathname('/how-ai-works/units/attention')).toBe(
      '/how-ai-works/units/attention/',
    );
  });

  it('leaves an already-slashed path alone', () => {
    expect(canonicalPathname('/how-ai-works/units/attention/')).toBe(
      '/how-ai-works/units/attention/',
    );
  });

  it('leaves a file alone', () => {
    // `/404.html` is a file, and slashing it would canonicalise the 404 page to
    // a directory that does not exist.
    expect(canonicalPathname('/how-ai-works/404.html')).toBe(
      '/how-ai-works/404.html',
    );
  });

  it('normalises the empty path to the root', () => {
    expect(canonicalPathname('')).toBe('/');
  });

  it('keeps a query or fragment on the far side of the slash', () => {
    expect(canonicalPathname('/how-ai-works/search?q=attention')).toBe(
      '/how-ai-works/search/?q=attention',
    );
    expect(canonicalPathname('/how-ai-works/map#parts')).toBe(
      '/how-ai-works/map/#parts',
    );
  });
});

describe('robotsDirective', () => {
  it('lets an ordinary page in, with full snippets', () => {
    expect(robotsDirective({})).toContain('index, follow');
    expect(robotsDirective({})).toContain('max-image-preview:large');
  });

  it('keeps a noindex page out but still follows its links', () => {
    expect(robotsDirective({ noindex: true })).toBe('noindex, follow');
  });

  it('locks a preview build down regardless of the page', () => {
    // The one that matters: previews are served from the same origin as the
    // live site, so an indexable preview is a duplicate of the whole site.
    expect(robotsDirective({ isPreview: true })).toBe('noindex, nofollow');
    expect(robotsDirective({ noindex: false, isPreview: true })).toBe(
      'noindex, nofollow',
    );
  });
});

describe('isHomePath', () => {
  it('recognises the home page with or without a trailing slash', () => {
    expect(isHomePath('/how-ai-works/', '/how-ai-works/')).toBe(true);
    expect(isHomePath('/how-ai-works', '/how-ai-works/')).toBe(true);
    expect(isHomePath('/how-ai-works/', '/how-ai-works')).toBe(true);
  });

  it('does not mistake a lesson for the home page', () => {
    expect(isHomePath('/how-ai-works/units/attention/', '/how-ai-works/')).toBe(
      false,
    );
  });

  it('handles a site served from the origin root', () => {
    expect(isHomePath('/', '/')).toBe(true);
    expect(isHomePath('/map/', '/')).toBe(false);
  });
});
