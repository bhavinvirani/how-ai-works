import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated accessibility gate.
 *
 * This is a floor, not the standard. axe cannot see whether a diagram carries a
 * plain-English description, whether meaning is conveyed by colour alone, or
 * whether an instrument is genuinely keyboard-operable — all of which are
 * binding rules here and all of which stay on human review (CLAUDE.md rule 9).
 */

const ROUTES = [
  { name: 'home', path: './' },
  { name: '404', path: './404.html' },
];

for (const route of ROUTES) {
  test(`${route.name} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await page.evaluate(() => document.fonts.ready);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
