/**
 * @type {import('prettier').Config}
 *
 * Plugin order is load-bearing: prettier-plugin-tailwindcss must be LAST.
 * It occupies single-use Prettier APIs, and listing it before
 * prettier-plugin-astro makes .astro files silently stop getting formatted.
 */
export default {
  singleQuote: true,
  plugins: ['prettier-plugin-astro', 'prettier-plugin-tailwindcss'],

  // Tailwind v4 has no JS config, so the class sorter needs the CSS entry point
  // to discover our theme. Without this it falls back to Tailwind's DEFAULT
  // theme and quietly sorts every custom token class to the end of the list.
  // The path resolves relative to this config file.
  tailwindStylesheet: './src/styles/global.css',

  overrides: [
    {
      files: '*.astro',
      options: { parser: 'astro' },
    },
  ],
};
