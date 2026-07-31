# Dependencies

Every dependency on this site is a tax the reader pays. A lesson page that
takes three seconds to become interactive has already lost the reader it was
written for, and each island is bound by a hard size budget it has to fit
inside. So the list is short, and it stays short on purpose.

## Adding one

1. Check it is not already solvable with what is here, or with a few lines of
   our own code. Most "I need a library for this" turns out to be a `<details>`
   element or twenty lines in a `logic.ts`.
2. Add a row to the right table below, in the **same PR** as the code that uses
   it, saying what it does and why nothing lighter would work.
3. If it ships to the browser, check `pnpm budgets` still passes. If it pushed
   an island over, that is the answer.

A dependency without a row here is a review blocker, not a nit.

## Ships to the browser

These affect what a reader downloads.

| Package                                | Why it is here                                                                                                                                                                                                                                                                                                                                    | Weight                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `astro`                                | The framework. Static HTML by default, JavaScript only where an island asks for it — the property the whole size argument rests on.                                                                                                                                                                                                               | Build-time; ships nothing by itself                       |
| `@astrojs/mdx`                         | Lets a lesson be markdown with components embedded in it, so prose contributors never open a `.tsx` file.                                                                                                                                                                                                                                         | Build-time                                                |
| `@astrojs/react`                       | Renders the interactive islands.                                                                                                                                                                                                                                                                                                                  | ~59 KB gz shared across every island, budgeted separately |
| `react`, `react-dom`                   | The islands themselves. Chosen because contributor prototypes arrive as Claude artifacts written in React, which makes conversion a port rather than a rewrite.                                                                                                                                                                                   | Included in the shared chunk above                        |
| `@astrojs/markdown-remark`             | Restores the `unified` processor. Astro 7 defaults to Sätteri, which does not run remark/rehype plugins — without this, maths silently stops rendering. Pinned to exactly `7.2.2` because Astro declares it as an exact-version peer.                                                                                                             | Build-time                                                |
| `remark-math`, `rehype-katex`          | Render maths **at build time**. The alternative is shipping KaTeX's JavaScript to every reader for something that never changes.                                                                                                                                                                                                                  | Build-time                                                |
| `katex`                                | Supplies `katex.min.css` and its woff2 fonts, self-hosted. Only the stylesheet and fonts ship; the library does not.                                                                                                                                                                                                                              | ~23 KB CSS + fonts, on pages with maths                   |
| `tailwindcss`, `@tailwindcss/vite`     | Generates utilities from the `@theme` tokens, so components cannot invent their own colours. Only the classes actually used are emitted.                                                                                                                                                                                                          | Build-time; emits CSS only                                |
| `@fontsource-variable/*`               | Self-hosted Bricolage Grotesque, Public Sans, and JetBrains Mono. No font CDN, so the site works offline and never reports readers to a third party.                                                                                                                                                                                              | woff2, subset per script                                  |
| `nanostores`, `@nanostores/persistent` | Progress tracking, and state shared between islands that do not know about each other. The persistent variant wraps localStorage with encode/decode hooks, which is what makes the payload versioned rather than a raw blob.                                                                                                                      | ~1 KB                                                     |
| `@nanostores/react`                    | The `useStore` hook. Subscribing by hand means every island reimplements the same effect, and one of them gets the cleanup wrong.                                                                                                                                                                                                                 | ~0.5 KB                                                   |
| `@xyflow/react`                        | The concept map on `/map`, and nowhere else — every other diagram on the site is hand-authored SVG. Its in-canvas attribution is disabled (`proOptions`) because the canvas is `aria-hidden` and a tabbable link inside a hidden region is an axe violation; the credit is reinstated as a real, tabbable link in `map.astro`, which MIT permits. | `/map` only, against its own 160 KB budget                |
| `pagefind`                             | Static search. Runs over `dist/` **after** `astro build` (see the `build` script), so nothing imports it at build time. Its client is fetched lazily on the first query from a `withBase`-computed path — the default `/pagefind/` 404s under a base path while looking perfect in dev.                                                           | `/search` only, fetched on first query                    |

## Approved but not yet installed

Cleared in PLAN.md §1.3. Still needs a row moved up when first used.

| Package                                        | For                                           | Notes                                                                   |
| ---------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `motion`                                       | Animation that CSS transitions cannot express | CSS first; reach for this only when a transition genuinely will not do. |
| `d3-scale`, `d3-shape`, `d3-array`, `d3-force` | Maths for bespoke SVG diagrams                | Micro-packages only. We import d3's arithmetic, never its DOM layer.    |

`@xyflow/react` and `pagefind` were both here and are now installed — see
_Ships to the browser_ above.

## Build and test tooling

Never reaches the browser, so the bar is lower — but it is still a maintenance
cost, and it still has to earn its place.

| Package                                                                                                                              | Why                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript`, `@astrojs/check`                                                                                                       | Types. Pinned to the 6.0.x line: TypeScript 7's native compiler does not yet expose the API `astro check` needs, and `typescript-eslint` caps below 6.1.                                                            |
| `eslint`, `typescript-eslint`, `eslint-plugin-astro`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, `@eslint/js`, `globals` | Linting, including the accessibility rules.                                                                                                                                                                         |
| `prettier`, `prettier-plugin-astro`, `prettier-plugin-tailwindcss`                                                                   | Formatting. The Tailwind plugin must stay last in the plugins array.                                                                                                                                                |
| `vitest`, `jsdom`                                                                                                                    | Unit and component tests.                                                                                                                                                                                           |
| `@astrojs/sitemap`                                                                                                                   | Emits `sitemap-index.xml` from the routes Astro already knows about. Reads `site`, so its URLs carry the base path; skipped on PR previews, which must not publish a sitemap claiming throwaway URLs are canonical. |
| `@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`, `@testing-library/user-event`                         | Testing components the way a reader uses them — by role and label — which is what makes the tests double as an accessibility check.                                                                                 |
| `@playwright/test`, `@axe-core/playwright`                                                                                           | End-to-end tests and the automated accessibility gate, run against the built site.                                                                                                                                  |
| `@types/*`                                                                                                                           | Type definitions.                                                                                                                                                                                                   |

## Not happening

Rejected with reasons, so the question does not get reopened every few months.
PLAN.md §1.4 and `docs/FUTURE.md` hold the full argument.

| Rejected                                | Instead                                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chart libraries (Recharts, Chart.js, …) | Hand-authored SVG on tokens. Our visuals are teaching instruments, not dashboards, and chart libraries fight the design system while adding weight.                 |
| Mermaid                                 | Same. Generic diagram styling breaks visual consistency.                                                                                                            |
| `three.js` / react-three-fiber          | Heavy and hostile to low-end mobile. Revisit post-MVP as a lazy exception for a specific unit, with its own budget.                                                 |
| Storybook                               | `/gallery` does the job for free and cannot drift from production, because it _is_ production.                                                                      |
| Any backend, database, or auth          | The site is static by design. One future exception — a small token-exchange worker for optional progress sync — is documented in `docs/FUTURE.md` and out of scope. |
| A UI component library                  | The primitives in `src/components/primitives/` are the design system. A generic kit would need more overriding than writing them took.                              |
