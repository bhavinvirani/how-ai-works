import type { Page } from '@playwright/test';

/**
 * Bring every `client:visible` island on the page into a hydrated state.
 *
 * Two things make this harder than it looks, and both have already produced a
 * green run that meant nothing.
 *
 * **The scroll must yield a paint between positions.** `IntersectionObserver`
 * reports intersection changes the browser actually observed, so jumping
 * 0 → 400 → 800 in a tight loop — or pressing `End` to leap to the bottom — can
 * be collapsed into a single observed position. Everything passed over in
 * between never intersects and never hydrates. The double `requestAnimationFrame`
 * forces a frame between steps. This fails only on pages long enough to have a
 * middle, which is to say it starts failing exactly as the site grows.
 *
 * **Islands inside a collapsed `<details>` never hydrate, correctly**, because
 * `client:visible` never fires for something never visible. They are excluded
 * rather than waited on; a blanket "no island still `ssr`" wait can never
 * succeed (HANDOFF trap 3).
 *
 * Scanning before this resolves audits server-rendered markup that has none of
 * the island's real roles, labels or focus behaviour — so axe passes for the
 * wrong reason and interactions do nothing (trap 2).
 */
export async function settle(page: Page): Promise<void> {
  const step = 400;
  let previousHeight = 0;

  // Hydrating islands change the page height, so sweep until it stops growing.
  for (let pass = 0; pass < 5; pass++) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    if (height === previousHeight) break;
    previousHeight = height;

    for (let y = 0; y <= height; y += step) {
      await page.evaluate(
        (top) =>
          new Promise<void>((resolve) => {
            window.scrollTo(0, top);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                resolve();
              });
            });
          }),
        y,
      );
    }
  }

  await page.waitForFunction(() =>
    [...document.querySelectorAll('astro-island[ssr]')].every(
      (island) => island.closest('details:not([open])') !== null,
    ),
  );
}
