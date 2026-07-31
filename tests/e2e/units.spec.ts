import { readdirSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { settle } from './support/settle';

/**
 * Every published unit, checked against the built site.
 *
 * The route list is READ FROM `dist/`, not hand-written. `a11y.spec.ts` names
 * its five routes explicitly, which is right for fixed pages and wrong for
 * content: a fixed list covers a shrinking fraction of the site as each Part
 * lands, and nothing tells you it stopped being representative. This scales
 * with the curriculum instead (PLAN §6.1, job 4).
 *
 * Drafts never reach `dist/` in a production build, so anything found here is
 * something a reader can actually open.
 */
const unitSlugs = readdirSync('dist/units', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

test('the build produced unit pages at all', () => {
  // Guards the enumeration itself. An empty dist/units would otherwise make
  // every test below vacuously pass, which is exactly the shape of failure
  // this file exists to prevent.
  expect(unitSlugs.length).toBeGreaterThan(0);
});

for (const slug of unitSlugs) {
  test(`unit "${slug}" renders its lesson and its instruments`, async ({
    page,
  }) => {
    await page.goto(`./units/${slug}/`);
    await page.evaluate(() => document.fonts.ready);

    // A unit is a lesson, so it has a title and a checkpoint. Both come from
    // the fixed skeleton in §2.2; a unit missing either is not finished.
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(
      page
        .getByRole('heading', { name: /checkpoint/i })
        .or(page.locator('text=/checkpoint/i').first()),
    ).toBeVisible();

    await settle(page);
  });

  test(`unit "${slug}" has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(`./units/${slug}/`);
    await page.evaluate(() => document.fonts.ready);

    await settle(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

test('an instrument is operable, and changes what the page says', async ({
  page,
}) => {
  await page.goto('./units/why-rules-fail/');
  await page.evaluate(() => document.fonts.ready);

  // Never assert hydration with `panel.locator('astro-island[ssr]')`:
  // `<astro-island>` is the panel's ANCESTOR, so that matches nothing whether
  // or not React has taken over, passes instantly, and drives the rest of the
  // test against dead server markup (HANDOFF trap 2). It did exactly that here
  // the first time. `settle` waits on the right elements.
  await settle(page);

  const panel = page.getByRole('region', { name: /write the rules/i });
  await expect(panel).toBeVisible();

  const summary = panel.locator('[aria-live="polite"]');
  const before = await summary.textContent();

  // Operated by keyboard, not by click: axe cannot check operability, and the
  // switch role is only worth anything if it actually responds to a keypress.
  const firstRule = panel.getByRole('switch').first();
  await firstRule.focus();
  await page.keyboard.press('Space');

  await expect(firstRule).toHaveAttribute('aria-checked', 'true');
  await expect(summary).not.toHaveText(before ?? '');
});
