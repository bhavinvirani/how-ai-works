# Handoff

Read this before starting a phase. It records what a fresh session cannot
work out from the code: what is actually blocked, which facts about the stack
were expensive to discover, and which traps produce a **green build that is
wrong**.

`PLAN.md` says what to build. `CLAUDE.md` says the rules. This says what is
true right now.

> **Keep it current.** At the end of a phase, update _Where things stand_ and
> add anything new to _Traps_. A stale handoff is worse than none.

---

## Where things stand

**Last updated:** Phase 1 merged, site live, artifact landed (2026-07-31).

| Phase                    | State                                                           |
| ------------------------ | --------------------------------------------------------------- |
| 0 — Foundation           | Merged (#1)                                                     |
| 1 — Component system     | Merged (#2), **except** `docs/CURRICULUM.md` and the pilot unit |
| 2 — Curriculum port      | Not started                                                     |
| 3 — Community launch kit | Not started                                                     |

Built and merged: design tokens, the primitive control set, MDX content blocks,
the content collection + unit graph, the progress store and `/progress`,
`/gallery`, the budgets gate, both generators, `QUALITY_BAR.md`,
`DEPENDENCIES.md`, and all four CI workflows.

`gh-pages` holds a working build (`index.html`, `gallery/`, `progress/`,
`404.html`, `_astro/`, `.nojekyll`).

### Done

- **The site is live.** Pages serves the `gh-pages` branch;
  <https://bhavinvirani.github.io/how-ai-works/>, `/gallery/`, and `/progress/`
  all return 200, with KaTeX rendering in production.
- **`reference/how-ai-works.html` is in the repo** (~258 KB of real content, not
  the JS shell). Tailwind's `@source not '../../reference'` holds — adding it
  did not grow the CSS bundle.
- **PR previews work end to end**, including the sticky comment, verified on
  PR #3.

### Still blocked on Bhavin

1. **`main` has no required status checks.** Settings → Rules → Rulesets → New
   branch ruleset: target the default branch, enable _Require status checks to
   pass_, and add exactly `Lint, types, unit tests`, `Build, budgets, E2E +
a11y`, and `Link check`.
   Do **not** add `Build preview` / `Publish preview` / `Remove preview` — they
   are deployment steps, and `Remove preview` only runs on close, so requiring
   it blocks every merge. Do **not** enable Code Owner review: GitHub forbids
   approving your own PR, so it deadlocks a solo maintainer.

### Still true

- `src/pages/units/[...slug].astro` and `ConnectionsFooter` are wired and
  typechecked but **never rendered end to end** — there are still no units. The
  pilot unit is their first real exercise.
- The `part` enum in `src/content.config.ts` is a placeholder taken from
  PLAN §2.1's examples. `CURRICULUM.md` decides the real grouping, and the enum
  must be reconciled with whatever is signed off.
- The build prints `The collection "units" does not exist or is empty`. Expected
  until the first unit lands.

---

## Version pins that are not arbitrary

Changing any of these breaks something quietly.

| Pin                                       | Why                                                                                                                                                                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `typescript: ~6.0.3`                      | TypeScript 7 (npm `latest`) **breaks `astro check`** — the native Go compiler does not expose the programmatic API it needs. `typescript-eslint` independently caps at `<6.1.0`. Plain `tsc --noEmit` passes under TS 7, so a project that only ran `tsc` would never notice. |
| `@astrojs/markdown-remark: 7.2.2` (exact) | Astro declares it as an **exact-version** optional peer, not a range. A caret drifts out of range on the next Astro patch.                                                                                                                                                    |
| Node 24.18.1 / `engines: >=24.16.0`       | Astro 7 needs `>=22.12`; `eslint-plugin-astro@3` needs `^22.22.3 \|\| ^24.16.0 \|\| >=26.3.0`, which is the binding constraint. The plugin cannot load on Node 20.                                                                                                            |
| `pnpm@11.18.0` via `packageManager`       | Use `corepack pnpm`, never `npm`.                                                                                                                                                                                                                                             |

`eslint-plugin-jsx-a11y@6.10.2` caps its peer at ESLint 9 while
`eslint-plugin-astro@3` requires ESLint ≥10 — unsatisfiable on paper, verified
working in practice, silenced deliberately in `pnpm-workspace.yaml`. Revisit
when jsx-a11y ships ESLint 10 support.

---

## Astro 7 facts that differ from most documentation

PLAN.md was written against Astro 5. Per §9, the current API wins.

- **Sätteri is the default markdown processor, and it does not run
  remark/rehype plugins.** Maths only works because `astro.config.mjs` sets
  `markdown.processor: unified({ remarkPlugins, rehypePlugins })` from
  `@astrojs/markdown-remark`. **This fails silently** — with the default
  processor the build exits 0 and every equation renders as raw LaTeX in a
  `<code>` tag. `tests/e2e/smoke.spec.ts` asserts a `.katex` element exists;
  that assertion is the only thing standing between us and shipping broken
  maths.
- **`z` from `astro:content` is deprecated.** Use `import { z } from
'astro/zod'` — Zod 4 underneath.
- Unchanged from Astro 5: `src/content.config.ts`, `glob()` from
  `astro/loaders`, `reference()` and `render()` from `astro:content`,
  `import.meta.env.BASE_URL`, `astro check` needing the separate
  `@astrojs/check` package, and `404.astro`/`404.mdx` emitting a flat
  `404.html`.
- **Astro's Container API does not work for testing `.astro` in Vitest here.**
  It renders, but the client-mode transform produces a component factory Astro
  does not recognise as its own (`NoMatchingRenderer: Unable to render ''`).
  `.astro` components are covered on `/gallery` by Playwright instead — which
  is better anyway, since it is a real render and axe can see it.

---

## Base paths — the thing that breaks in production only

The site deploys under `/how-ai-works/`.

- `base: '/how-ai-works'` **without** a trailing slash. Measured: with no
  trailing slash `astro preview` serves both `/how-ai-works` and
  `/how-ai-works/`; with one, the bare path 404s.
- Every internal link goes through `withBase()` in `src/lib/paths.ts`. Never
  hardcode `/how-ai-works/...`.
- **PR previews are built with an overridden base**, `BASE_PATH=/how-ai-works/pr-preview/pr-<n>`.
  Note the **`pr-` prefix** — `rossjrw/pr-preview-action` publishes to
  `pr-preview/pr-<n>`, not `pr-preview/<n>`. Getting this wrong deploys
  successfully and 404s every asset in the preview while the live site looks
  perfect.
- Playwright's `use.baseURL` **must** end in a trailing slash and specs **must**
  use relative gotos (`./`, `./gallery/`). A leading slash silently escapes the
  base path — the exact bug class the suite exists to catch.
- Third-party assets are subject to the same base: KaTeX's CSS and woff2, and
  Pagefind's index when it arrives. Font and KaTeX stylesheets are imported
  from `BaseLayout.astro`'s **frontmatter**, not via a bare `@import` in CSS,
  because the JS route puts them through Vite's asset pipeline where the URLs
  get rewritten.

---

## Traps that produce a green build that is wrong

Every one of these actually happened.

1. **A stray dev server on port 4321.** Playwright's usual
   `reuseExistingServer: !process.env.CI` reused another project's server and
   reported green against the wrong site. It is now `false` unconditionally —
   a port clash fails loudly instead.
2. **Scanning or driving an island before it hydrates.** Server-rendered island
   markup looks identical but ignores every event, so axe passes trivially and
   interactions do nothing. Wait on `astro-island[ssr]` disappearing — Astro
   removes that attribute once React takes over.
3. **…but an island inside a collapsed `<details>` never hydrates**, correctly,
   because `client:visible` never fires for something never visible. A blanket
   "no island still `ssr`" wait can never succeed. See `settle()` in
   `tests/e2e/gallery.spec.ts`.
4. **Scroll restoration after `page.reload()`** puts you back at the bottom, so
   islands _above_ that point never intersect and never hydrate. Sweep the page
   in steps rather than jumping to the end.
5. **`workflow_run` reads its workflow file from the DEFAULT BRANCH.** Edits to
   `preview-deploy.yml` have no effect until merged to `main`, no matter what
   the PR branch says. Same for `deploy.yml` — neither was even registered with
   GitHub until Phase 0 merged.
6. **`pr-preview-action`'s built-in comment silently posts nothing** under
   `workflow_run`: the sticky-comment step it wraps reads the PR number from
   the event context, which that event does not carry. It reports success in
   ~90ms having done nothing. We pass `comment: false` and post it ourselves.
7. **Tailwind scans from the working directory**, not `src/`. Once
   `reference/how-ai-works.html` lands, its Tailwind-shaped class names would
   emit real unused CSS into the bundle. `@source not '../../reference'` in
   `global.css` prevents that — **do not remove it**.
8. **Type-aware lint needs `.astro/types.d.ts`.** `pnpm lint` runs `astro sync`
   first for exactly this reason; without it `import.meta.env.BASE_URL` is an
   error type and `no-unsafe-member-access` fires on a cold checkout only.
9. **jsdom does not implement arrow-key stepping on range inputs.** A keyboard
   test there asserts nothing. Real keyboard operability is covered in the
   browser.
10. **Font assertions are racy** without `await page.evaluate(() =>
document.fonts.ready)`.
11. **MDX is not linted.** Unused imports and duplicated components in `.mdx`
    will not be flagged — the gallery once rendered the same panel three times
    for exactly this reason.
12. **lychee needs `--root-dir` with an absolute path**, not `--base`, to
    resolve root-relative links in local files.

---

## Conventions established (follow these)

- **Copy.** Lesson prose lives in MDX. UI chrome — button labels, headings,
  per-interactive titles — lives in `src/copy/en.ts`, imported and never
  inlined. This is a deliberate reading of hard rule 10: an interactive must
  work as a bare tag with zero required props, so it needs a default title, and
  an inlined default title is what the rule forbids. **Never put teaching prose
  in that file.**
- **Native elements first.** `input[type=range]`, real radios, `role="switch"`,
  `<details>` for disclosure. Content pages ship **zero JavaScript**, and
  `tests/e2e/no-js.spec.ts` proves it with scripting disabled.
- **Logic beside the view, tested.** `logic.ts` next to `index.tsx`, pure, with
  its own test file. Seedable randomness only.
- **Interactives compose primitives**, never their own controls.
- **Diagrams go in `Figure`**, whose `description` prop is required and must
  teach rather than label.
- **Budgets attribute chunks from the built HTML** (`<astro-island
component-url renderer-url>`), not a Vite manifest — Astro will not emit one,
  and this measures what a browser actually downloads.
- **Prove a gate fails.** Every gate added so far was checked by deliberately
  breaking it: budgets exit 1 over / 0 under, lychee exit 2 on a bad link, the
  raw-colour rule firing on its own fixtures.

### Deliberate deviations from PLAN.md

| PLAN says                      | We do                                           | Why                                                                                                                     |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Schema has `id: z.string()`    | No `id` field                                   | The glob loader derives it from the filename; declaring it twice creates two sources of truth                           |
| `<DevAside><Lang name="java">` | Astro named slots (`<Fragment slot="java">`)    | Keeps panels as server-rendered markdown. Astro also requires a **literal** slot name — a loop variable fails the build |
| Copy only in MDX/frontmatter   | Plus `src/copy/en.ts` for UI chrome             | See above                                                                                                               |
| —                              | Vitest runs one project, not a node/jsdom split | Vitest `projects` do not inherit root Vite plugins, so a split loses the Astro and React transforms entirely            |

---

## Starting Phase 2

**Unblocked — the artifact is in `reference/how-ai-works.html`.**

The order that matters:

1. **`docs/CURRICULUM.md` first**, from `reference/how-ai-works.html` — the full
   unit inventory with proposed Part grouping and order, **for Bhavin's sign-off
   before any porting**. Reconcile the `part` enum in `src/content.config.ts`
   with whatever is agreed.
2. **The pilot unit** (Tokenization suggested) end to end: re-taught prose,
   upgraded diagram, rebuilt interactive, connections, checkpoint. This is also
   the first real exercise of the unit route, `ConnectionsFooter`, and the cycle
   check.
3. Then Phase 2's slices: one PR per Part, plus `2-nav` (generated sidebar,
   after the _first_ Part, not the last) and `2-meta` (`/map`, Pagefind,
   sitemap, 404).

Two smaller things deferred and worth picking up when they fit:

- A lint rule forbidding hardcoded root-absolute internal links (PLAN §7). It
  needs MDX linting to catch the realistic case, which is why it waited.
- The post-build assertion walking every `status: published` unit (PLAN §6.1
  job 4) — pointless with zero units, valuable from the first Part onward.

Also unverified until Phase 3: **the fork-preview path**. Same-repo previews
work; a PR from a real fork on a second account is the one path Phases 0–2
never exercise.

---

## Working agreements

- One scoped PR per logical chunk, squash-merged. Never commit to `main`.
- `pnpm check`, `lint`, `test`, `build`, `budgets`, `test:e2e` all pass before
  opening a PR — and read the actual output rather than assuming.
- The palette hexes in `tokens.css` are an interpretation, not values carried
  from the artifact. Reconcile them when it lands; every ink weight must clear
  WCAG AA against **every** surface token, not just `--color-paper`.
