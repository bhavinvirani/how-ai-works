// @ts-check
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

import { sitemapOptions } from './scripts/sitemap.mjs';

// The site deploys to https://bhavinvirani.github.io/how-ai-works, so every
// internal URL is prefixed with `base`. Anything that hardcodes a root-absolute
// path works in dev and 404s in production — see src/lib/paths.ts.
//
// BASE_PATH is overridden for PR previews, which are served from
// /how-ai-works/pr-preview/<n>/ on the same Pages site. Without the override a
// preview builds every asset URL pointing at the production base and 404s
// wholesale, while the live site keeps working — so the breakage only ever
// shows up in review, which is the one place it is most confusing.
//
// No trailing slash, deliberately: `astro preview` then serves BOTH
// /how-ai-works and /how-ai-works/, whereas the trailing-slash form 404s the
// bare path.
const base = process.env.BASE_PATH ?? '/how-ai-works';

export default defineConfig({
  site: 'https://bhavinvirani.github.io/how-ai-works',
  base,

  // `sitemap` reads `site` above, so its URLs already carry the base path. It
  // is skipped on PR previews: a preview would otherwise publish a sitemap
  // claiming its throwaway URLs are canonical, and `gh-pages` serves previews
  // from the same origin as the live site, so a crawler cannot tell them apart.
  //
  // Skipping the sitemap was only ever half of that defence — a crawler that
  // arrives by following a link never reads one. The other half is the
  // site-wide `noindex` a preview build emits from `SeoHead.astro`, keyed off
  // the same BASE_PATH variable.
  //
  // `sitemapOptions()` drops the pages that carry `noindex` and gives each
  // lesson its own `lastmod`; see scripts/sitemap.mjs for why.
  integrations: [
    react(),
    mdx(),
    ...(process.env.BASE_PATH ? [] : [sitemap(sitemapOptions())]),
  ],

  markdown: {
    // Astro 7 defaults to Sätteri, a Rust markdown engine that does NOT run
    // remark/rehype plugins. Opting back into the unified processor is what
    // keeps remark-math + rehype-katex working.
    //
    // This is a silent failure if you get it wrong: leaving the default
    // processor while declaring the deprecated `markdown.remarkPlugins` keys
    // builds successfully and quietly renders every equation as raw LaTeX in a
    // <code> tag. The e2e suite asserts a `.katex` element exists so that a
    // regression here fails the build instead of shipping.
    //
    // @astrojs/markdown-remark is pinned to exactly 7.2.2 in package.json
    // because Astro declares it as an exact-version optional peer, not a range.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
