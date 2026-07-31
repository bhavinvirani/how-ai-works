/**
 * Ambient declarations for lint plugins that ship no types.
 *
 * eslint-plugin-jsx-a11y is still CommonJS with no bundled .d.ts and no
 * @types package. Declaring it here keeps the `// @ts-check` pragma useful in
 * eslint.config.js — the alternative is turning type checking off for the whole
 * config file, which would hide real mistakes in the rest of it.
 */
declare module 'eslint-plugin-jsx-a11y';
