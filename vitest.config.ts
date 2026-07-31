/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

/**
 * `getViteConfig` loads astro.config.mjs and runs Astro's integration setup
 * hook, so the React plugin contributed by @astrojs/react is already applied
 * here — .tsx island tests will compile without extra wiring in Phase 1.
 */
export default getViteConfig({
  test: {
    // Phase 0 tests are pure functions only, so `node` is enough. The jsdom
    // environment arrives with the first React island in Phase 1.
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'eslint-rules/**/*.test.js'],

    // Vitest 4's default exclude covers only node_modules and .git. Without
    // this, it collects the Playwright specs in tests/e2e and dies on the
    // @playwright/test import.
    exclude: [
      '**/node_modules/**',
      'dist/**',
      '.astro/**',
      'tests/e2e/**',
      'reference/**',
    ],
  },
});
