import { expect, test } from '@playwright/test';

/**
 * The gallery is the review surface for every control, so these tests check the
 * thing a reviewer would otherwise have to check by hand: that the islands
 * actually hydrate and respond, rather than rendering as dead server markup.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('./gallery/');

  // Islands are client:visible, so nothing below the fold hydrates until it has
  // been scrolled past. Astro drops the `ssr` attribute from an <astro-island>
  // once React has taken it over, so this waits on hydration itself rather than
  // on a control merely being visible — server-rendered markup looks identical
  // but ignores every event.
  await page.keyboard.press('End');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
});

test('instrument panels render as named regions', async ({ page }) => {
  await expect(page.getByRole('region', { name: 'Sampling' })).toBeVisible();
});

test('a slider responds to the keyboard', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Temperature' }).first();
  await expect(slider).toBeVisible();

  const before = await slider.inputValue();
  await slider.focus();
  await page.keyboard.press('ArrowRight');

  await expect(slider).not.toHaveValue(before);
});

test('a toggle flips with the keyboard and reports its state', async ({
  page,
}) => {
  const toggle = page.getByRole('switch').first();
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await toggle.focus();
  await page.keyboard.press('Space');

  await expect(toggle).toHaveAttribute('aria-checked', 'true');
});

test('tabs move with the arrow keys', async ({ page }) => {
  const java = page.getByRole('tab', { name: 'Java' });
  await expect(java).toBeVisible();

  await java.focus();
  await page.keyboard.press('ArrowRight');

  await expect(page.getByRole('tab', { name: 'Python' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('reset returns an instrument to its starting values', async ({ page }) => {
  const panel = page.getByRole('region', { name: 'Sampling' });
  const slider = panel.getByRole('slider', { name: 'Temperature' });

  await slider.focus();
  await page.keyboard.press('ArrowRight');
  const moved = await slider.inputValue();

  await panel.getByRole('button', { name: 'Reset' }).click();

  await expect(slider).not.toHaveValue(moved);
});

test('the reveal keeps its answer out of the page until asked', async ({
  page,
}) => {
  const answer = /build it out of smaller pieces/;
  await expect(page.getByText(answer)).toHaveCount(0);

  await page.getByRole('button', { name: 'Show answer' }).click();

  await expect(page.getByText(answer)).toBeVisible();
});

test('a figure names its diagram and says what it teaches', async ({
  page,
}) => {
  await expect(
    page.getByRole('img', { name: 'A word split into three tokens' }),
  ).toBeVisible();

  // The description is for everyone, not hidden for screen readers.
  await expect(
    page.getByText(/Rare words get broken into familiar fragments/),
  ).toBeVisible();
});

test('connections are two named lists, each link giving a reason', async ({
  page,
}) => {
  await expect(
    page.getByRole('navigation', { name: 'Read this first' }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Where it fits' }),
  ).toBeVisible();

  await expect(page.getByRole('link', { name: 'Embeddings' })).toBeVisible();
  await expect(
    page.getByText(/Tokens are the units that embeddings turn into/),
  ).toBeVisible();
});
