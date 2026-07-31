import { expect, test } from '@playwright/test';

/**
 * Smoke tests run against the BUILT site with the base path applied, because
 * that is the only configuration where base-path bugs and missing self-hosted
 * assets actually show up. Every navigation is relative on purpose — see the
 * comment in playwright.config.ts.
 */

test('home page renders', async ({ page }) => {
  await page.goto('./');

  await expect(page).toHaveTitle(/How AI Actually Works/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'How AI Actually Works' }),
  ).toBeVisible();
});

test('design tokens reach the browser and paint the page', async ({ page }) => {
  await page.goto('./');

  // Read the token off :root, then normalise it through the browser so both
  // sides of the comparison are in the same colour format. This asserts the
  // token exists AND that the page actually uses it, without hardcoding a
  // colour value in a test file.
  const result = await page.evaluate(() => {
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-paper')
      .trim();

    const probe = document.createElement('div');
    probe.style.backgroundColor = token;
    document.body.append(probe);
    const normalisedToken = getComputedStyle(probe).backgroundColor;
    probe.remove();

    return {
      token,
      normalisedToken,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      inkToken: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-ink')
        .trim(),
    };
  });

  expect(result.token, '--color-paper missing from :root').not.toBe('');
  expect(result.inkToken, '--color-ink missing from :root').not.toBe('');
  expect(result.bodyBackground).toBe(result.normalisedToken);
});

test('self-hosted fonts load under the base path', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);

  const fonts = await page.evaluate(() => ({
    bodyFamily: getComputedStyle(document.body).fontFamily,
    bodyLoaded: document.fonts.check('1em "Public Sans Variable"'),
    displayLoaded: document.fonts.check('1em "Bricolage Grotesque Variable"'),
    monoLoaded: document.fonts.check('1em "JetBrains Mono Variable"'),
  }));

  expect(fonts.bodyFamily).toContain('Public Sans Variable');
  expect(fonts.bodyLoaded, 'Public Sans Variable did not load').toBe(true);
  expect(fonts.displayLoaded, 'Bricolage Grotesque Variable did not load').toBe(
    true,
  );
  expect(fonts.monoLoaded, 'JetBrains Mono Variable did not load').toBe(true);
});

test('maths renders at build time via KaTeX', async ({ page }) => {
  await page.goto('./');

  // This is the guard for the loudest silent failure in the stack: Astro 7
  // defaults to a markdown processor that does not run rehype-katex. When that
  // happens the build still succeeds and every equation degrades to raw LaTeX
  // in a <code> tag, with nothing else in CI noticing.
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(await page.locator('.katex-display').count()).toBeGreaterThan(0);

  // KaTeX ships its own woff2 files, which are a classic base-path 404.
  // Fonts load lazily, so wait for them rather than racing the check.
  await page.evaluate(() => document.fonts.ready);
  const katexFontLoaded = await page.evaluate(() =>
    document.fonts.check('1em KaTeX_Math'),
  );
  expect(katexFontLoaded, 'KaTeX fonts did not load').toBe(true);
});

test('no asset fails to load under the base path', async ({ page }) => {
  const failed: string[] = [];

  page.on('response', (response) => {
    if (response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);

  expect(failed, `assets 404ed: ${failed.join(', ')}`).toEqual([]);
});

test('root-absolute paths escape the base path and 404', async ({ page }) => {
  // Documents the trap rather than trusting nobody hits it: with a base path
  // set, `astro preview` 404s anything outside it. A root-absolute internal
  // link therefore breaks in production while looking fine in dev.
  const response = await page.goto(`/index.html`);
  expect(response?.status()).toBe(404);
});

test('a 404.html is emitted for GitHub Pages', async ({ page }) => {
  const response = await page.goto('./404.html');

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
});
