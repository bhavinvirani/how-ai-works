import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const ORIGIN = `http://127.0.0.1:${PORT}`;

/**
 * The base path, WITH a trailing slash — and both of these matter.
 *
 * `astro preview` enforces the base path strictly: it returns 404 for any URL
 * that does not start with it, including the origin root. Playwright's
 * webServer readiness probe only treats 2xx/3xx/400/401/402/403 as "up", so
 * pointing `webServer.url` at the origin root makes every run hang until the
 * timeout and then fail with a message that says nothing about base paths.
 *
 * The trailing slash matters for `baseURL` because Playwright resolves with
 * `new URL(path, baseURL)`. Without it, even a relative `./x` resolves to `/x`
 * and escapes the base path. Specs must therefore use relative gotos (`./`,
 * `./404.html`) — a leading slash silently leaves the base path behind, which
 * is the exact bug class this suite exists to catch.
 */
const BASE_URL = `${ORIGIN}/how-ai-works/`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      // No `channel` here on purpose: it would be incompatible with CI's
      // lean `playwright install --only-shell chromium`.
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // `pnpm test:e2e` builds first, so this only ever serves a fresh dist/.
    command: `pnpm exec astro preview --port ${PORT} --host 127.0.0.1`,
    url: BASE_URL,

    // Never reuse, not even locally. The usual `!process.env.CI` reuses
    // whatever already holds this port — which during development is just as
    // likely to be a different project's dev server. That does not fail; it
    // silently tests someone else's site and reports green. Starting a fresh
    // server costs about a second and removes the entire failure mode.
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
