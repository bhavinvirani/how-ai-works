// @ts-check
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import noRawColor from './eslint-rules/no-raw-color.js';

/**
 * Local rules ship as an inline plugin object — no separate package, no
 * publishing step. `local/no-raw-color` enforces CLAUDE.md hard rule 1.
 */
const local = {
  meta: { name: 'local', version: '1.0.0' },
  rules: { 'no-raw-color': noRawColor },
};

export default defineConfig([
  // ESLint 10's default ignores are only node_modules and .git — dist/ and
  // .astro/ are NOT ignored, and linting them means thousands of bogus errors.
  globalIgnores([
    'dist/',
    '.astro/',
    'coverage/',
    'playwright-report/',
    'test-results/',
    // The source artifact is a single vendored HTML file, not project source.
    'reference/',
  ]),

  { name: 'local/plugin', plugins: { local } },

  {
    name: 'app/js-recommended',
    files: ['**/*.{js,mjs,ts,tsx,astro}'],
    extends: [js.configs.recommended],
  },

  {
    name: 'app/typescript',
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    // React islands. jsxA11y.flatConfigs.recommended ships with no `files` key
    // of its own, so it has to be nested here or it applies to everything.
    //
    // reactHooks MUST come from `configs.flat.*`: in eslint-plugin-react-hooks
    // v7 the top-level `configs.recommended` reverted to eslintrc shape and
    // hard-fails ESLint 10 with "This appears to be in eslintrc format".
    name: 'app/react-islands',
    files: ['**/*.tsx'],
    extends: [
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs.flat.recommended,
    ],
  },

  // Astro markup gets its own jsx-a11y rule namespace (astro/jsx-a11y/*),
  // separate from the plain jsx-a11y/* rules that cover .tsx above.
  astro.configs.recommended,
  astro.configs['jsx-a11y-recommended'],

  {
    // Build tooling and the rule sources are plain Node ESM, not site code.
    name: 'app/node-tooling',
    files: [
      'scripts/**/*.mjs',
      'eslint-rules/**/*.js',
      'eslint.config.js',
      'astro.config.mjs',
    ],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    // Hard rule 1: tokens only. Applies last so its severity wins.
    // `.css` is outside ESLint's reach and is covered by
    // scripts/check-raw-colors.mjs in the same `pnpm lint` gate.
    name: 'app/tokens-only',
    files: ['**/*.{js,mjs,ts,tsx,astro}'],
    rules: { 'local/no-raw-color': 'error' },
  },

  {
    // The rule's own tests are raw colours by definition — they are the
    // fixtures proving it fires. Exempting them is not a loophole in the
    // policy; linting them would make the rule impossible to test.
    name: 'app/lint-rule-fixtures',
    files: ['eslint-rules/**/*.test.js'],
    rules: { 'local/no-raw-color': 'off' },
  },
]);
