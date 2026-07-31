import { expect, test } from '@playwright/test';

/**
 * The site header, which is the only navigation on every page.
 *
 * This exists because the site shipped sixty lessons with NO global navigation:
 * `/map`, `/search`, `/gallery` and `/progress` were reachable only by typing
 * the URL, and none of them linked anywhere — not even home. Nothing caught it,
 * because every page rendered, every link that existed resolved, and axe has no
 * opinion about a destination you cannot get to.
 *
 * So the assertion worth making is not "a header renders" but "every top-level
 * page can reach every other one". That is what actually regressed.
 *
 * Navigations are relative — a leading slash escapes the base path.
 */

const PAGES = [
  { name: 'home', path: './' },
  { name: 'map', path: './map/' },
  { name: 'search', path: './search/' },
  { name: 'gallery', path: './gallery/' },
  { name: 'progress', path: './progress/' },
  { name: 'a lesson', path: './units/why-rules-fail/' },
];

const DESTINATIONS = ['Lessons', 'Map', 'Search', 'Gallery', 'Progress'];

for (const page_ of PAGES) {
  test(`${page_.name} can reach every other page`, async ({ page }) => {
    await page.goto(page_.path);

    const nav = page.getByRole('navigation', { name: 'Site' });
    await expect(nav).toBeVisible();

    for (const destination of DESTINATIONS) {
      await expect(nav.getByRole('link', { name: destination })).toBeVisible();
    }

    // And home, via the wordmark.
    await expect(
      nav.getByRole('link', { name: /How AI/ }).first(),
    ).toBeVisible();
  });
}

test('every header link stays under the base path', async ({ page }) => {
  await page.goto('./');

  const hrefs = await page
    .getByRole('navigation', { name: 'Site' })
    .getByRole('link')
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute('href') ?? ''),
    );

  expect(hrefs.length).toBeGreaterThan(4);
  for (const href of hrefs) {
    expect(href.startsWith('/how-ai-works')).toBe(true);
  }
});

test('the header marks the page you are on', async ({ page }) => {
  await page.goto('./map/');

  const nav = page.getByRole('navigation', { name: 'Site' });
  await expect(nav.getByRole('link', { name: 'Map' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(nav.getByRole('link', { name: 'Search' })).not.toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('a lesson page marks Lessons, not a single unit', async ({ page }) => {
  await page.goto('./units/attention/');

  await expect(
    page
      .getByRole('navigation', { name: 'Site' })
      .getByRole('link', { name: 'Lessons' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('navigation works with scripting disabled', async ({ browser }) => {
  // The header is plain HTML and must stay that way: a lesson page ships zero
  // JavaScript, and that property is worth nothing if getting to the lesson
  // needs some.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('./');
  await page
    .getByRole('navigation', { name: 'Site' })
    .getByRole('link', { name: 'Map' })
    .click();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(page.url()).toContain('/how-ai-works/map');

  await context.close();
});

test('the header is not swept into the search index', async ({ page }) => {
  // `data-pagefind-body` sits on <main>, and the header is outside it. If that
  // ever changes, every lesson gains five nav words and search results start
  // matching on chrome rather than on teaching.
  await page.goto('./search/');

  const entry = await page.evaluate(async () => {
    const response = await fetch('/how-ai-works/pagefind/pagefind-entry.json');
    return (await response.json()) as {
      languages: Record<string, { page_count: number }>;
    };
  });

  expect(entry.languages.en.page_count).toBe(60);
});
