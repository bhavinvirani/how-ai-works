import { expect, test } from '@playwright/test';

/**
 * The content blocks claim to ship no JavaScript. This proves it rather than
 * asserting it: with scripting switched off entirely, prose, diagrams, and the
 * checkpoint disclosure must all still work.
 *
 * A separate file because these cannot share the gallery suite's setup — that
 * one waits for islands to hydrate, which never happens here.
 */

test.use({ javaScriptEnabled: false });

test('the page renders its content without scripting', async ({ page }) => {
  await page.goto('./gallery/');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Gallery' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'A word split into three tokens' }),
  ).toBeVisible();
  await expect(
    page.getByText('This is not how it worked originally'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Embeddings' })).toBeVisible();
});

test('the checkpoint still hides and reveals its answer', async ({ page }) => {
  await page.goto('./gallery/');

  const answer = page.getByText(/its vocabulary is fixed and finite/);
  await expect(answer).toBeHidden();

  // The summary specifically: "Show answer" is also the RevealButton's label,
  // and that one is an inert island with scripting off.
  await page
    .locator('details')
    .filter({ hasText: 'its vocabulary is fixed and finite' })
    .locator('summary')
    .click();

  await expect(answer).toBeVisible();
});

test('islands degrade to their server-rendered markup', async ({ page }) => {
  await page.goto('./gallery/');

  // Nothing hydrates, so every island keeps its `ssr` marker. The controls are
  // inert, which is expected — but the surrounding lesson must still read.
  await expect(page.locator('astro-island[ssr]').first()).toBeAttached();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Content blocks' }),
  ).toBeVisible();
});
