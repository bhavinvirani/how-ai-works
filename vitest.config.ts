/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

/**
 * `getViteConfig` loads astro.config.mjs and runs Astro's integration setup
 * hook, so the React plugin contributed by @astrojs/react is already applied
 * here — .tsx tests compile with no extra wiring.
 *
 * Two projects rather than one shared environment: pure logic has no business
 * paying for a DOM, and keeping them separate makes it obvious when a "logic"
 * module has quietly grown a DOM dependency. `projects` is the Vitest 4
 * replacement for both `workspace` and the removed `environmentMatchGlobs`.
 */
const EXCLUDE = [
  '**/node_modules/**',
  'dist/**',
  '.astro/**',
  // Vitest 4's default exclude covers only node_modules and .git, so without
  // this it collects the Playwright specs and dies on the @playwright/test import.
  'tests/e2e/**',
  'reference/**',
];

export default getViteConfig({
  test: {
    globals: false,
    projects: [
      {
        test: {
          name: 'logic',
          environment: 'node',
          include: ['src/**/*.test.ts', 'eslint-rules/**/*.test.js'],
          exclude: EXCLUDE,
        },
      },
      {
        test: {
          name: 'components',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.tsx'],
          exclude: EXCLUDE,
        },
      },
    ],
  },
});
