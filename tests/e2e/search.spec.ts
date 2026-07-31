import { expect, test } from '@playwright/test';

/**
 * Search runs against the BUILT site, and it has to.
 *
 * Pagefind's index does not exist until `pagefind --site dist` has run over the
 * output of `astro build`, so there is nothing to test in dev at all. More to
 * the point, the failure this suite exists to catch is a base-path failure:
 * Pagefind's client defaults to fetching `/pagefind/pagefind.js`, which is
 * correct for a site at the root of its origin and 404s for this one. That bug
 * looks perfect in `astro dev` and ships broken, which is exactly the class
 * CLAUDE.md names.
 *
 * Every navigation is relative — a leading slash escapes the base path.
 */

test('the search page loads its index from under the base path', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/pagefind/')) requested.push(request.url());
  });

  await page.goto('./search/');
  await page.getByRole('searchbox').fill('attention');

  // The index is fetched lazily on first query, not on page load.
  await expect
    .poll(() => requested.length, { timeout: 15_000 })
    .toBeGreaterThan(0);

  for (const url of requested) {
    expect(url).toContain('/how-ai-works/pagefind/');
  }
});

test('searching a lesson word finds the lesson', async ({ page }) => {
  await page.goto('./search/');
  await page.getByRole('searchbox').fill('backpropagation');

  const results = page.getByRole('list', { name: 'Search results' });
  await expect(results.getByRole('link').first()).toBeVisible({
    timeout: 15_000,
  });

  // Every result must point at a real unit page under the base path.
  const href = await results.getByRole('link').first().getAttribute('href');
  expect(href).toContain('/how-ai-works/units/');
});

test('a result leads to the lesson it names', async ({ page }) => {
  await page.goto('./search/');
  await page.getByRole('searchbox').fill('tokenization');

  const first = page
    .getByRole('list', { name: 'Search results' })
    .getByRole('link')
    .first();
  await expect(first).toBeVisible({ timeout: 15_000 });

  await first.click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('a nonsense query still leaves a usable page, never an error', async ({
  page,
}) => {
  // Measured, not assumed: Pagefind fuzzy-matches, so a string of gibberish
  // comes back with its closest match rather than with nothing. An earlier
  // version of this test asserted the empty state and failed for that reason —
  // the empty branch in search.astro is real defensive code but is rarely
  // reached, and pinning behaviour Pagefind does not have would have been a
  // test that only ever broke on upgrades.
  //
  // What must hold is that the page always says something and never reports the
  // index as unloadable, which is the failure a base-path regression produces.
  await page.goto('./search/');
  await page.getByRole('searchbox').fill('zzzqqxnothingmatchesthis');

  const status = page.locator('#search-status');
  await expect(status).not.toHaveText(/^\s*$/, { timeout: 15_000 });
  await expect(status).not.toHaveText(/could not be loaded/);
  await expect(status).not.toHaveText(/Searching/);
});

test('search indexes the lessons and nothing else', async ({ page }) => {
  // `data-pagefind-body` is site-wide in effect: once any page carries it, only
  // pages carrying it are indexed. This asserts the opt-in did what it claims —
  // sixty lessons in, and the furniture pages out — because getting it wrong
  // fills the results with gallery chrome and still looks like search working.
  await page.goto('./search/');

  const entry = await page.evaluate(async () => {
    const response = await fetch('/how-ai-works/pagefind/pagefind-entry.json');
    return (await response.json()) as {
      languages: Record<string, { page_count: number }>;
    };
  });

  expect(entry.languages.en.page_count).toBe(60);
});
