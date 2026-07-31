import { expect, test } from '@playwright/test';

/**
 * Everything in `<head>` addressed to a machine, checked against the BUILT
 * site — which is the only place most of it is even wrong. A canonical built
 * from the wrong pathname, an `og:image` that 404s under the base path, a
 * manifest whose relative icon paths escape it: all four of those render
 * perfectly in `astro dev` and are broken in production.
 *
 * Every navigation is relative, per the note in playwright.config.ts.
 */

const SITE_NAME = 'How AI Actually Works';
const ORIGIN = 'https://bhavinvirani.github.io';
const BASE = `${ORIGIN}/how-ai-works`;

/** A lesson that is published and stable enough to assert against. */
const UNIT = 'attention';

/** @returns the `content` of a meta tag, or null when it is absent. */
async function meta(
  page: import('@playwright/test').Page,
  selector: string,
): Promise<string | null> {
  const locator = page.locator(selector);
  return (await locator.count()) === 0
    ? null
    : locator.first().getAttribute('content');
}

test.describe('the home page', () => {
  test('titles itself with the site name and nothing more', async ({
    page,
  }) => {
    await page.goto('./');
    // Not "How AI Actually Works — How AI Actually Works", which is what a
    // naive title template produces on the one page that IS the site.
    await expect(page).toHaveTitle(SITE_NAME);
  });

  test('declares a canonical that matches the deployed URL', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      `${BASE}/`,
    );
  });

  test('is indexable, with large image previews allowed', async ({ page }) => {
    await page.goto('./');
    const robots = await meta(page, 'meta[name=robots]');
    expect(robots).toContain('index, follow');
    expect(robots).not.toContain('noindex');
    expect(robots).toContain('max-image-preview:large');
  });

  test('carries the WebSite structured data, once', async ({ page }) => {
    await page.goto('./');
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    const types = blocks.map(
      (block) => (JSON.parse(block) as { '@type': unknown })['@type'],
    );
    expect(types.filter((type) => type === 'WebSite')).toHaveLength(1);
  });
});

test.describe('a lesson page', () => {
  test('suffixes its title with the site name', async ({ page }) => {
    await page.goto(`./units/${UNIT}/`);
    await expect(page).toHaveTitle(new RegExp(`. — ${SITE_NAME}$`));
  });

  test('is an article, with a modified date from its frontmatter', async ({
    page,
  }) => {
    await page.goto(`./units/${UNIT}/`);
    expect(await meta(page, 'meta[property="og:type"]')).toBe('article');

    const modified = await meta(page, 'meta[property="article:modified_time"]');
    expect(modified).toBeTruthy();
    expect(Number.isNaN(Date.parse(modified ?? ''))).toBe(false);
  });

  test('agrees with itself about its own address', async ({ page }) => {
    // The canonical, og:url and the JSON-LD url are three statements of the
    // same fact. Any two of them disagreeing describes two documents.
    await page.goto(`./units/${UNIT}/`);
    const expected = `${BASE}/units/${UNIT}/`;

    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      expected,
    );
    expect(await meta(page, 'meta[property="og:url"]')).toBe(expected);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const article = blocks
      .map((block) => JSON.parse(block) as Record<string, unknown>)
      .find((node) => Array.isArray(node['@type']));

    expect(article?.url).toBe(expected);
  });

  test('carries a breadcrumb whose middle step is a page that exists', async ({
    page,
  }) => {
    await page.goto(`./units/${UNIT}/`);
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();

    const crumb = blocks
      .map((block) => JSON.parse(block) as Record<string, unknown>)
      .find((node) => node['@type'] === 'BreadcrumbList');

    expect(crumb, 'no BreadcrumbList on a lesson page').toBeDefined();

    const items = crumb?.itemListElement as {
      position: number;
      item?: string;
    }[];
    expect(items).toHaveLength(3);
    expect(items[2]).not.toHaveProperty('item');

    // Google drops a trail whose intermediate step 404s, and /map is the only
    // curriculum index this site has.
    const response = await page.request.get(items[1].item ?? '');
    expect(items[1].item).toBe(`${BASE}/map/`);
    expect(response.status()).toBeLessThan(400);
  });
});

test.describe('the index profile', () => {
  // Utility pages: nothing on them belongs in a search result, and each would
  // compete with the lessons for the same words.
  for (const path of ['./gallery/', './search/', './progress/', './404.html']) {
    test(`${path} is kept out of the index`, async ({ page }) => {
      await page.goto(path);
      expect(await meta(page, 'meta[name=robots]')).toContain('noindex');
    });
  }

  for (const path of ['./', './map/', `./units/${UNIT}/`]) {
    test(`${path} is left in the index`, async ({ page }) => {
      await page.goto(path);
      expect(await meta(page, 'meta[name=robots]')).not.toContain('noindex');
    });
  }
});

test.describe('the social card', () => {
  test('is absolute, and actually resolves', async ({ page }) => {
    await page.goto('./');

    const image = await meta(page, 'meta[property="og:image"]');
    expect(image, 'og:image must be absolute').toBe(`${BASE}/og.png`);

    // The commonest silent failure of the whole feature: every scraper fetches
    // this URL and none of them report back when it 404s.
    const local = (image ?? '').replace(ORIGIN, '');
    const response = await page.request.get(local);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('declares its dimensions and describes itself', async ({ page }) => {
    await page.goto('./');
    expect(await meta(page, 'meta[property="og:image:width"]')).toBe('1200');
    expect(await meta(page, 'meta[property="og:image:height"]')).toBe('630');
    expect(await meta(page, 'meta[property="og:image:alt"]')).toBeTruthy();
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe(
      'summary_large_image',
    );
  });
});

test.describe('icons and the manifest', () => {
  test('every declared icon resolves under the base path', async ({ page }) => {
    await page.goto('./');

    const hrefs = await page
      .locator(
        'link[rel~=icon], link[rel="apple-touch-icon"], link[rel=manifest]',
      )
      .evaluateAll((links) =>
        links.map((link) => (link as HTMLLinkElement).getAttribute('href')),
      );

    expect(hrefs.length).toBeGreaterThanOrEqual(4);

    for (const href of hrefs) {
      expect(href, 'icon href missing').toBeTruthy();
      // Base-absolute, never root-absolute: a root-absolute href here 404s in
      // production on every page at once.
      expect(href).toMatch(/^\/how-ai-works\//);
      const response = await page.request.get(href ?? '');
      expect(response.status(), `${href ?? ''} did not resolve`).toBe(200);
    }
  });

  test('the manifest parses and its relative icons resolve from it', async ({
    page,
  }) => {
    const response = await page.request.get('./site.webmanifest');
    expect(response.status()).toBe(200);

    const manifest = JSON.parse(await response.text()) as {
      name: string;
      start_url: string;
      icons: { src: string; sizes: string }[];
    };

    expect(manifest.name).toBe(SITE_NAME);
    // Relative, which is what keeps it correct under both the live base path
    // and a PR preview's deeper one.
    expect(manifest.start_url).toBe('./');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(
        `${BASE}/${icon.src.replace('./', '')}`.replace(ORIGIN, ''),
      );
      expect(iconResponse.status(), `${icon.src} did not resolve`).toBe(200);
    }
  });

  test('ships a maskable icon', async ({ page }) => {
    // Without one, Android renders the square tile inside its own mask and
    // clips the corners off the glyph.
    const response = await page.request.get('./site.webmanifest');
    const manifest = JSON.parse(await response.text()) as {
      icons: { purpose: string }[];
    };
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(
      true,
    );
  });
});

test.describe('the sitemap', () => {
  test('exists and lists only pages that invite indexing', async ({ page }) => {
    const index = await page.request.get('./sitemap-index.xml');
    expect(index.status()).toBe(200);

    const body = await (await page.request.get('./sitemap-0.xml')).text();

    // A sitemap entry is a request to index. Listing a page that then answers
    // `noindex` is a contradiction Search Console reports against the site.
    for (const excluded of ['/gallery/', '/search/', '/progress/', '/404']) {
      expect(body, `${excluded} must not be in the sitemap`).not.toContain(
        `${BASE}${excluded}`,
      );
    }

    expect(body).toContain(`${BASE}/`);
    expect(body).toContain(`${BASE}/map/`);
    expect(body).toContain(`${BASE}/units/${UNIT}/`);
  });

  test('takes lastmod from the lesson, not from the build clock', async ({
    page,
  }) => {
    // Asserting that the dates DIFFER from each other would be a test of the
    // content, not the mechanism: every unit was ported in one phase and so
    // currently shares an `updated` date. The invariant that actually holds is
    // that the sitemap and the page agree, because both read the same
    // frontmatter — and that neither is the moment the build ran.
    const body = await (await page.request.get('./sitemap-0.xml')).text();
    const entry = new RegExp(
      `<loc>[^<]*/units/${UNIT}/</loc><lastmod>([^<]+)</lastmod>`,
    ).exec(body);

    expect(entry?.[1], `no lastmod for units/${UNIT}`).toBeTruthy();

    await page.goto(`./units/${UNIT}/`);
    const onPage = await meta(page, 'meta[property="article:modified_time"]');
    expect(entry?.[1]).toBe(onPage);

    const age = Date.now() - Date.parse(entry?.[1] ?? '');
    expect(age, 'lastmod looks like a build timestamp').toBeGreaterThan(60_000);
  });
});

test('a normal build ships no analytics', async ({ page }) => {
  // The counter is gated on ENABLE_ANALYTICS, which only deploy.yml sets. If
  // this ever fails, CI has started making requests to a third party on every
  // push — and `smoke.spec.ts` fails the build on any response ≥ 400, which
  // would hand GoatCounter's uptime a veto over ours.
  await page.goto('./');
  await expect(page.locator('script[data-goatcounter]')).toHaveCount(0);
});
