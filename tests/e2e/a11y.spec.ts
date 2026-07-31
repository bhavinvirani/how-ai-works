import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import { settle } from './support/settle';

/**
 * Automated accessibility gate.
 *
 * This is a floor, not the standard. axe cannot see whether a diagram carries a
 * plain-English description, whether meaning is conveyed by colour alone, or
 * whether an instrument is genuinely keyboard-operable — all of which are
 * binding rules here and all of which stay on human review (CLAUDE.md rule 9).
 */

interface Route {
  name: string;
  path: string;
  /**
   * Waits until the page is in the state worth scanning. Islands hydrate on
   * `client:visible`, so scanning immediately after navigation checks the
   * server-rendered markup instead — the island's real roles, labels, and
   * focus behaviour are not in the DOM yet and it passes for the wrong reason.
   */
  settle?: (page: Page) => Promise<void>;
}

const ROUTES: Route[] = [
  { name: 'home', path: './' },
  { name: '404', path: './404.html' },
  {
    name: 'progress',
    path: './progress/',
    settle: async (page) => {
      await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
    },
  },
  {
    name: 'gallery',
    path: './gallery/',
    // Pressing `End` used to be enough here and silently stopped being enough
    // once the gallery grew past a couple of viewports: leaping to the bottom
    // lets the browser observe one intersection position, so every island in
    // the middle stays unhydrated. `settle` sweeps with a paint between steps.
    settle,
  },
];

for (const route of ROUTES) {
  test(`${route.name} has no detectable accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await page.evaluate(() => document.fonts.ready);
    await route.settle?.(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
