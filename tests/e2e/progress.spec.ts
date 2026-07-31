import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';
import type { Download } from '@playwright/test';

/**
 * The progress page, exercised against real localStorage in a real browser.
 *
 * The store's own round-trip logic is unit-tested; what only a browser can
 * check is that the page actually reaches storage, that a download really
 * produces a file, and that a file really gets read back in.
 */

const STORAGE_KEY = 'how-ai-works:progress';

/**
 * Read a download via its temp file rather than its stream: the stream yields
 * loosely-typed chunks, and this needs no casts.
 */
const readDownload = async (download: Download): Promise<string> => {
  const file = await download.path();
  return readFile(file, 'utf8');
};

const seed = (units: Record<string, { completedAt: string | null }>) =>
  JSON.stringify({
    v: 1,
    units: Object.fromEntries(
      Object.entries(units).map(([id, unit]) => [
        id,
        { completedAt: unit.completedAt, checkpoints: {} },
      ]),
    ),
  });

test.beforeEach(async ({ page }) => {
  await page.goto('./progress/');
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
});

test('says plainly that progress never leaves the browser', async ({
  page,
}) => {
  await expect(
    page.getByRole('heading', { name: 'This stays on your device' }),
  ).toBeVisible();
  await expect(page.getByText(/never sent anywhere/)).toBeVisible();
});

test('exports what is actually in storage', async ({ page }) => {
  await page.evaluate(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    {
      key: STORAGE_KEY,
      value: seed({
        tokenization: { completedAt: '2026-01-01T00:00:00.000Z' },
      }),
    },
  );
  await page.reload();
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download my progress' }).click(),
  ]).then(([event]) => event);

  expect(download.suggestedFilename()).toBe('how-ai-works-progress.json');

  const exported = JSON.parse(await readDownload(download)) as {
    v: number;
    units: Record<string, { completedAt: string | null }>;
  };

  expect(exported.v).toBe(1);
  expect(exported.units.tokenization?.completedAt).toBe(
    '2026-01-01T00:00:00.000Z',
  );
});

test('imports a progress file and says what it read', async ({ page }) => {
  await page.setInputFiles('input[type="file"]', {
    name: 'how-ai-works-progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      seed({
        tokenization: { completedAt: '2026-01-01T00:00:00.000Z' },
        embeddings: { completedAt: null },
      }),
    ),
  });

  await expect(page.getByRole('status')).toContainText('2 units');

  // Reached storage, not just React state.
  const stored = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(stored).toContain('tokenization');
});

test('refuses a file that is not a progress file, and says why', async ({
  page,
}) => {
  await page.setInputFiles('input[type="file"]', {
    name: 'holiday-photos.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello":"world"}'),
  });

  await expect(page.getByRole('alert')).toContainText(/progress file/i);
});

test('survives export, erase, and import', async ({ page }) => {
  // Phase 1's acceptance criterion, end to end in a real browser.
  await page.setInputFiles('input[type="file"]', {
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      seed({ tokenization: { completedAt: '2026-01-01T00:00:00.000Z' } }),
    ),
  });
  await expect(page.getByRole('status')).toContainText('1 unit');

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download my progress' }).click(),
  ]).then(([event]) => event);

  const exported = await readDownload(download);

  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Erase my progress' }).click();
  await expect(page.getByRole('status')).toContainText('erased');

  const afterClear = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(afterClear).not.toContain('tokenization');

  await page.setInputFiles('input[type="file"]', {
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported, 'utf8'),
  });

  const restored = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    STORAGE_KEY,
  );
  expect(restored).toContain('tokenization');
  expect(restored).toContain('2026-01-01T00:00:00.000Z');
});
