/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

/**
 * `getViteConfig` loads astro.config.mjs and runs Astro's integration setup
 * hook, so the React plugin and the .astro compiler are already applied here —
 * both .tsx islands and real .astro components can be rendered in tests.
 *
 * Deliberately ONE project rather than a node/jsdom split. Vitest's `projects`
 * do not inherit the root Vite plugins, so anything in a split project loses
 * the Astro and React transforms entirely. Pure logic paying for a jsdom it
 * does not use is a far smaller cost than that; a file can still opt out with
 * a `// @vitest-environment node` docblock.
 *
 * `.astro` components are covered on /gallery by the Playwright suite rather
 * than here. They ship no JavaScript, so a real browser render is both closer
 * to how a reader meets them and the only place axe can see them.
 */
export default getViteConfig({
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'eslint-rules/**/*.test.js',
    ],

    // Vitest 4's default exclude covers only node_modules and .git. Without
    // this it collects the Playwright specs and dies on the @playwright/test
    // import.
    exclude: [
      '**/node_modules/**',
      'dist/**',
      '.astro/**',
      'tests/e2e/**',
      'reference/**',
    ],
  },
});
