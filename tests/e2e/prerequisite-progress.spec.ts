import { expect, test } from '@playwright/test';

/**
 * "Read this first" showing which of the prerequisites are already done.
 *
 * Before this, the footer listed the required reading and said nothing about
 * whether you had done any of it — so answering "do I have the background for
 * this page?" meant opening every prerequisite and looking. The links were
 * server-rendered with zero JavaScript and progress lives in localStorage, so
 * the two never met.
 *
 * `attention` is used because it has exactly one prerequisite
 * (`recurrent-networks`), which makes the before/after unambiguous.
 */

const LESSON = './units/attention/';
const PREREQUISITE = 'recurrent-networks';

const markComplete = async (
  page: import('@playwright/test').Page,
  unitId: string,
) => {
  await page.evaluate((id) => {
    window.localStorage.setItem(
      'how-ai-works:progress',
      JSON.stringify({
        version: 1,
        units: { [id]: { completedAt: new Date().toISOString() } },
      }),
    );
  }, unitId);
};

test('says nothing is done yet before anything is marked', async ({ page }) => {
  await page.goto(LESSON);

  const readFirst = page.getByRole('navigation', { name: 'Read this first' });
  await readFirst.scrollIntoViewIfNeeded();

  await expect(readFirst.getByText(/have not marked/)).toBeVisible();
  await expect(readFirst.locator('li').getByText('Complete')).toHaveCount(0);
});

test('marks a prerequisite complete once it has been finished', async ({
  page,
}) => {
  await page.goto(LESSON);
  await markComplete(page, PREREQUISITE);
  await page.reload();

  const readFirst = page.getByRole('navigation', { name: 'Read this first' });
  await readFirst.scrollIntoViewIfNeeded();

  await expect(readFirst.locator('li').getByText('Complete')).toBeVisible();
  await expect(readFirst.getByText(/marked this one complete/)).toBeVisible();
});

test('the marker is a word, not a colour or a glyph alone', async ({
  page,
}) => {
  // Hard rule 9. A tick plus a green would put the entire meaning in two
  // channels a reader may not have.
  await page.goto(LESSON);
  await markComplete(page, PREREQUISITE);
  await page.reload();

  const readFirst = page.getByRole('navigation', { name: 'Read this first' });
  await readFirst.scrollIntoViewIfNeeded();

  await expect(readFirst.locator('li').getByText('Complete')).toHaveText(
    /Complete/,
  );
});

test('the footer still lists everything with scripting disabled', async ({
  browser,
}) => {
  // The markers are an addition, never a gate: with no JavaScript the footer
  // must be exactly what it always was.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto(LESSON);

  const readFirst = page.getByRole('navigation', { name: 'Read this first' });
  await expect(readFirst.getByRole('link')).toHaveCount(1);
  await expect(
    page
      .getByRole('navigation', { name: 'Where it fits' })
      .getByRole('link')
      .first(),
  ).toBeVisible();

  await context.close();
});

test('marking a unit complete on its own page shows up on the next one', async ({
  page,
}) => {
  // The whole point, end to end: finish a lesson, and the lesson that requires
  // it says so without the reader having to go and check.
  await page.goto(`./units/${PREREQUISITE}/`);

  const mark = page.getByRole('button', { name: 'Mark as complete' });
  await mark.scrollIntoViewIfNeeded();

  // The button is inside a `client:visible` island. Server-rendered island
  // markup looks identical and ignores every event, so clicking before React
  // has taken over does nothing at all and the test fails somewhere else
  // entirely (HANDOFF trap 2). Astro drops the `ssr` attribute on hydration.
  await expect(
    page.locator('astro-island[ssr]:has(button[aria-pressed])'),
  ).toHaveCount(0);

  await mark.click();

  // And confirm the write actually happened before navigating away, so a
  // failure here is unambiguous about which half broke.
  await expect(
    page.getByRole('button', { name: 'Mark as not complete' }),
  ).toBeVisible();

  await page.goto(LESSON);
  const readFirst = page.getByRole('navigation', { name: 'Read this first' });
  await readFirst.scrollIntoViewIfNeeded();

  await expect(readFirst.locator('li').getByText('Complete')).toBeVisible();
});
