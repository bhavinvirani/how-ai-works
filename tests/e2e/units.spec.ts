import { readdirSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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

    // Sweep the page so every `client:visible` island intersects. Jumping
    // straight to the end leaves islands above the fold unhydrated (HANDOFF
    // trap 4), so step down instead.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => {
        window.scrollTo(0, top);
      }, y);
    }

    // Islands inside a collapsed <details> never become visible and correctly
    // never hydrate, so they are excluded rather than waited on (trap 3).
    await page.waitForFunction(() =>
      [...document.querySelectorAll('astro-island[ssr]')].every(
        (island) => island.closest('details:not([open])') !== null,
      ),
    );
  });

  test(`unit "${slug}" has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(`./units/${slug}/`);
    await page.evaluate(() => document.fonts.ready);

    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => {
        window.scrollTo(0, top);
      }, y);
    }
    await page.waitForFunction(() =>
      [...document.querySelectorAll('astro-island[ssr]')].every(
        (island) => island.closest('details:not([open])') !== null,
      ),
    );

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

  const panel = page.getByRole('region', { name: /write the rules/i });
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible();

  // Wait on the island ANCESTOR losing its `ssr` attribute, not on a descendant
  // of the panel. `<astro-island>` wraps the section, so `panel.locator(
  // 'astro-island[ssr]')` matches nothing whether or not React has taken over —
  // it passes instantly and drives the whole test against dead server markup
  // (HANDOFF trap 2). This assertion failed for exactly that reason first time.
  await expect(
    page.locator('astro-island[ssr]:has([role="region"])'),
  ).toHaveCount(0);

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
