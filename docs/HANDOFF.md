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

**Last updated:** discovery pass — full metadata, generated brand marks and a
cookieless visit count (2026-07-31). Phase 2 complete before that: 60 of 60
units, 16 of 16 Parts, `/map`, search and sitemap all live.

| Phase                    | State                                                  |
| ------------------------ | ------------------------------------------------------ |
| 0 — Foundation           | Merged (#1)                                            |
| 1 — Component system     | Merged (#2). The pilot unit shipped with Phase 2 (#10) |
| 2 — Curriculum port      | **Complete.** 60/60 units, 16/16 Parts, `2-meta` done  |
| 3 — Community launch kit | **Complete**, bar fork-preview verification (below)    |

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

- **`main` requires CI to pass.** Ruleset _"main: require CI to pass"_, active
  on the default branch, requiring `Lint, types, unit tests`, `Build, budgets,
E2E + a11y`, and `Link check`. No bypass actors. Verified by attempting a
  direct push, which GitHub rejected with _"3 of 3 required status checks are
  expected"_ — so **everything goes through a PR now**, including yours.

  Deliberately _not_ included: `Build preview` / `Publish preview` / `Remove
preview` are deployment steps, and `Remove preview` only runs on close, so
  requiring it would block every merge. Code Owner review stays off until a
  second collaborator exists — GitHub forbids approving your own PR, so it
  deadlocks a solo maintainer (PLAN §5.5).

- **The port is finished.** All 60 units, in all 16 Parts, with **35
  instruments** — exactly the number signed off in `CURRICULUM.md`, against the
  ~52 the first fifteen units were tracking towards. The per-Part cap is what
  did that; see _What actually worked_ below.
- **`2-meta` shipped with the last slice**: `/map`, `/search` (Pagefind) and a
  sitemap.

- **Phase 3 shipped.** `CONTRIBUTING.md` (three tracks + the Claude-artifact
  conversion checklist), `CODE_OF_CONDUCT.md`, `SECURITY.md`, `MAINTAINERS.md`,
  `docs/FUTURE.md`, four YAML issue forms + PR template, `CODEOWNERS`,
  Dependabot, a devcontainer, and a public-facing README.

**Repository settings changed in Phase 3** — none of these live in a file, so
they are recorded here or nowhere:

- **Private vulnerability reporting: ON.** Both `SECURITY.md`'s only reporting
  route and the Code of Conduct's enforcement route point at it. With it off,
  both documents send people to a tab with no form on it.
- **CodeQL default setup: configured** (`javascript-typescript`, `actions`).
  `SECURITY.md` states this as fact, so it has to stay true.
- **Dependabot alerts + security updates: ON**, alongside the weekly grouped
  version updates in `.github/dependabot.yml`.
- **Labels the issue forms depend on exist**: `content`, `diagram`,
  `interactive`, `proposal`, `approved-to-build`. GitHub **silently drops** a
  label named in a form that does not exist in the repo — no error, no warning.
- **Branch protection raised to the solo configuration** — see PLAN §5.5 and
  `MAINTAINERS.md`. Code Owner review stays OFF; the deadlock reason is in
  `.github/CODEOWNERS`.

**One Phase 3 item is not done and cannot be done solo:** the **fork-preview
verification**. A PR from a branch in this repo uses a different token than a
PR from a real fork, so the same-repo path can be green while every external
contributor's preview silently fails — and every external contributor arrives
by fork, because GitHub's web editor forks first. It needs a second account.
Until it is exercised, treat the preview pipeline as verified for maintainers
only. (PLAN §6.2, §9.)

**Nothing else is blocked.** Everything remaining is Phase 4 material, in
`docs/FUTURE.md`, with the trigger conditions written down.

### Still true

- **The Parts live in `src/lib/units/parts.ts`, not in `content.config.ts`**, and
  that is deliberate: `scripts/new-unit.mjs` used to keep its own hardcoded copy,
  so changing the schema alone would have left the generator rejecting every
  valid Part. It now imports the same list — Node strips the types on a `.ts`
  import, which `engines: >=24.16.0` already guarantees. Never reintroduce a
  second copy.
- Instrument datasets live in a `data.<locale>.ts` beside the island, never in
  `src/copy/en.ts` (which is chrome only, and says so) and never as required
  props (which the zero-required-props contract forbids). That is the pattern
  for every instrument carrying its own examples.

### Signed off in `docs/CURRICULUM.md` (2026-07-31)

Sixteen Parts, the slug scheme, `why-rules-fail` + `model-as-dials` as the pilot
(shipped in #10), and the rule that **an instrument has to teach something the
prose and the diagram cannot** — target ~35, not the 56 the per-unit analysis
proposed. **Landed on exactly 35.**

**All three open questions are now closed.** Recorded here because a future
contributor checking the port against the artifact will find the disagreements
and should not "fix" them.

1. **`embeddings` stays at the end of `inside-the-machine`** rather than moving
   after `tokenization`. Moving it inverts the artifact's
   `tokenization builds on embeddings` edge, and once inverted, anyone later
   restoring the obvious `why-language-is-hard builds on embeddings` edge
   creates a three-node cycle. It also turned out to be better teaching:
   `embeddings` promises in an aside that "word" is about to get more precise,
   and `tokenization` opens by cashing that promise by name.
2. **`multi-head-attention` stays ahead of `positional-encoding`.** Multi-head
   is "attention again, in parallel" and belongs beside attention; positional
   encoding is a correction applied during assembly and lands right before
   `transformers`, its real consumer. Adjacency to the consumer beat adjacency
   to the motivation.
3. **`/map` encodes Part by label and cluster position, never colour** — as
   recommended, and now built. Each Part is a dashed-bordered box with its
   reading-order number and full name in a header strip; the same encoding
   repeats in the small-screen fallback and in the page's server-rendered
   per-Part index. Zero new colour tokens. The map reads identically in
   greyscale.

The `[...slug].astro` draft-link bug noted here previously was fixed in #10.

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
13. **Scrolling without a paint between steps never hydrates the middle of a
    page.** `IntersectionObserver` reports intersection changes the browser
    actually observed, so a tight `scrollTo` loop — or pressing `End` to leap to
    the bottom — can collapse into ONE observed position. Every island passed
    over stays unhydrated, and a wait on "no island still `ssr`" then hangs
    forever. `a11y.spec.ts` pressed `End` from Phase 1 and was fine only because
    the gallery was short enough to have no middle; it broke the moment five
    instruments were added. Use `tests/e2e/support/settle.ts`, which forces a
    frame with a double `requestAnimationFrame` and re-sweeps while the page is
    still growing. **This failure appears as the site grows, not when the code
    changes.**
14. **An unquoted YAML scalar containing `": "` fails the content parse.** A
    connection `why` like `from its first afternoon: a real invoice` is
    ambiguous YAML. It fails at `astro build` with a js-yaml error pointing at a
    line and column, which is clear enough once you know — quote the value.
15. **`pnpm check` is two commands, and the first one's output looks like the
    verdict.** It runs `astro check && tsc --noEmit -p tsconfig.node.json`.
    `astro check` prints a friendly `0 errors / 0 warnings / 0 hints` summary
    and `tsc` prints nothing at all when it passes — so reading the tail of the
    output, or grepping it for errors, shows a reassuring green block while
    `tsc` has already failed underneath it. `tsc` is the half that covers
    `scripts/`, which `astro check` does not look at. **Check the exit code, not
    the output.** This shipped a red PR once already.

16. **A missing connection is invisible to every gate.** Zod catches a reference
    to a unit that does not exist. Nothing catches a reference that was never
    written. Phase 2 trimmed forward links slice by slice and backfilled them
    later, and one batch of five was computed, printed, and then never written
    to the files — every gate stayed green. What caught it was checking the
    repo's frontmatter against the artifact's own 168-link graph once all 60
    units existed. **If you move units around or add slices, re-run that
    comparison**; it is a dozen lines and it is the only thing that can see this.
17. **Prettier escapes `*` inside a multi-line JSX comment in MDX**, turning
    `{/* …` into `{/\* …`. The next build then fails with acorn's _"Unterminated
    regular expression"_, pointing at the file but not at the cause. Do not put
    long `{/* */}` comments in `.mdx`; put the explanation in a `.ts` or
    `.astro` file and link to it.
18. **MDX's ESM block accepts import and export statements ONLY.** A JSX comment
    between two imports fails with _"Unexpected `BlockStatement` in code: only
    import/exports are supported"_.
19. **Markdown link syntax in MDX emits the href verbatim**, so `[x](/map)`
    works in dev and 404s under `/how-ai-works/`. MDX is not linted (trap 11),
    so nothing catches it — lychee only checks that the target exists, and
    `/map` does exist, just not at that path. Internal links in `.mdx` must go
    through `withBase` as JSX: `<a href={withBase('/map')}>`.
20. **`data-pagefind-body` is site-wide in effect.** Once ANY page carries it,
    Pagefind indexes ONLY pages that carry it. It is therefore an opt-in
    `searchable` prop on `BaseLayout`, set by the unit route alone — 60 pages
    indexed, and `/gallery`, `/progress`, `/map` and `/search` deliberately not.
    It sits on the existing `<main>` rather than on a wrapper because
    `.content > *` in `global.css` uses **direct child combinators**: a wrapper
    element would silently break prose spacing on all sixty unit pages while
    every gate stayed green.
21. **Pagefind fuzzy-matches, so "no results" is nearly unreachable.** A string
    of gibberish comes back with its closest match. A test asserting the empty
    state fails for that reason — the empty branch is real defensive code but
    should not be pinned.
22. **Fading a whole element to show a weight fades its text too.** A shared
    chip view carried attention weight as `opacity` on the chip and dropped
    `text-ink` to 2.48:1 at low weights — a real WCAG failure, caught by axe on
    three unit pages. Vary a background LAYER behind the text, never the opacity
    of anything containing a glyph.
23. **An unscoped locator is unambiguous only until the site grows.** The
    gallery's reveal test used a bare `getByRole('button', { name: 'Show
answer' })`, which was correct while exactly one reveal existed and became a
    strict-mode violation the moment an instrument adopted one. Same class as
    trap 13: it fails on growth, not on change.
24. **The visit counter is one unset environment variable from never running,
    and nothing goes red.** It is gated on `ENABLE_ANALYTICS`, which ONLY
    `deploy.yml` sets. That gate is deliberate — `import.meta.env.PROD` is also
    true for the build `test:e2e` runs against, so the obvious version puts a
    request to `gc.zgo.at` into every CI run, and `smoke.spec.ts` fails the
    build on any response ≥ 400, handing a third party a veto over our CI. The
    trade is that a lost `env:` block disables analytics silently. `seo.spec.ts`
    can only assert the script is _absent_ from a normal build. **Now half
    closed:** `deploy.yml` greps the published `dist/index.html` for the tag
    after publishing and fails the deploy if it is gone. What that still cannot
    see is GoatCounter rejecting the hits — so after touching `deploy.yml` or
    `BaseLayout.astro`, check the count at
    <https://bhavinvirani01.goatcounter.com>.
25. **`JSON.stringify(…, null, 2)` and Prettier disagree about single-element
    arrays.** Prettier collapses `["education"]` onto one line; `JSON.stringify`
    expands it. A generated JSON file containing one therefore passes `pnpm
icons` and fails `pnpm format:check` immediately afterwards. The manifest's
    `categories` key was dropped rather than worked around — it does nothing for
    a website — but any future generated JSON has the same edge.

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

## Phase 2, in hindsight — what to reuse

The port is done. This section replaces the slice-by-slice runbook, which is
now history. What is here is the part worth carrying into Phase 3 and beyond.

### What actually worked

1. **Compute the frontmatter, do not let agents guess it.** The artifact
   registers its own topics in a machine-readable `add({...})` block — 60
   topics, 168 links, zero dangling. Parsing it and handing each agent its exact
   prerequisites and connections removed the guess-and-trim round trip AND the
   whole class of build failure where an agent references a unit that does not
   exist. The first fifteen units guessed; every link still missing today comes
   from those fifteen.
2. **Build shared components BEFORE the batch, and name them in the brief.**
   `LayerStackDiagram` existed and four units used it. `shared/attention/` and
   `shared/nextpiece/` were built the same way, and three and two units used
   them. Told to use a component, agents use it; told to consider one, they
   build their own.
3. **The instrument cap has to be a cap, not a target.** The first fifteen units
   produced thirteen instruments — tracking to ~52 — because each agent
   justified its own in isolation and nothing counted the total. Allocated per
   Part and given to the batch as a hard number, the remaining 45 units produced
   exactly 22. Total: 35, the signed-off figure.
4. **Pre-write the `ui.interactives` entries.** The names come from the
   allocation, which is decided before any agent starts. Zero missing-entry
   runtime throws after this changed.
5. **One agent per unit, 15 at a time.** The concurrency cap runs ~10
   concurrently regardless, so a 15-agent batch costs about what a 7-agent batch
   costs in wall-clock and halves the integrate-and-verify cycles.
6. **Every instrument keeps its `describe('the lesson the instrument exists to
deliver')` block.** Still the single highest-value convention in the port.

### What to watch for next time

- **Gates cannot see pedagogy, and they cannot see absence.** Traps 16 and 22
  are both "green build, wrong site". Budget review attention for what CI
  structurally cannot check.
- **Integration owns cross-unit consistency.** Agents cannot see each other, so
  two units drawing the same machine at different sizes, or two instruments
  teaching the same lesson, only surface centrally. `forward-pass` and
  `backpropagation` drew different networks until integration caught it.
- **Content filters can stop a unit mid-flight.** One agent was interrupted
  while emitting a large hand-authored vocabulary. Re-running with the output
  constrained to a few dozen ordinary fragments worked, and produced better
  teaching material anyway.

### Known, measured, and deliberately not fixed

**18 of the artifact's 92 connection edges are absent from the repo.** All 76
prerequisite edges are present. Every absent one originates in the first fifteen
units and points at a unit in the same or the next Part, where the generated
sidebar already supplies the adjacency — so they are an editorial choice by
those slices rather than a loss. The number is measured, not assumed: re-derive
it by comparing the frontmatter against the artifact's `add({...})` graph.

### `/map`, search and sitemap

- **`/map`** encodes Part by label and cluster position (see _Signed off_
  above). The React Flow canvas is `aria-hidden` with nothing inside it
  focusable — the real navigation is the server-rendered per-Part index
  underneath, which works with scripting off. `map.astro` calls `learningOrder`,
  which runs `assertAcyclic`, so a prerequisite cycle now fails the build on
  this page too and not only on the unit route.
- **Search** is Pagefind over `dist/`, run by the `build` script AFTER
  `astro build`. `test:e2e` and `budgets` therefore call `pnpm build` rather
  than `astro build`, or the index would not exist. See traps 20 and 21.
- **The sitemap is skipped on PR previews** (`BASE_PATH` set), because previews
  are served from the same origin as the live site and a preview sitemap would
  claim throwaway URLs are canonical.
- **It now filters and stamps.** `scripts/sitemap.mjs` drops the four
  `noindex` pages and gives each lesson a `lastmod` read from its own `updated`
  frontmatter. `NOINDEXED` there MUST agree with the pages' own `seo:` props —
  a sitemap entry is a request to index, so listing a `noindex` page is an
  error reported against the whole site.

### Discovery, brand marks, and the visit count

Full detail in **`docs/SEO.md`**; the parts a fresh session cannot infer:

- **Skipping the sitemap on previews was only ever half the defence.** A
  crawler that arrives by following a link never reads one. A preview build now
  also emits `noindex, nofollow` site-wide and no canonical, off the same
  `BASE_PATH` switch. Before this, every open PR was a crawlable duplicate of
  all sixty-six pages on the live site's own origin.
- **`public/robots.txt` is inert and that is not a bug.** On a project Pages
  site it lands at `/how-ai-works/robots.txt`, and robots.txt is only honoured
  at the origin root — `bhavinvirani.github.io/robots.txt`, which belongs to a
  repository that does not exist and answers 404. Per-page `<meta name=robots>`
  is what actually governs indexing. The file becomes real under a custom
  domain.
- **Everything in `public/` is generated.** `favicon.svg`, `favicon.ico`, the
  four PNG icons, `og.png`, the sixty per-lesson cards in `og/units/`,
  `site.webmanifest` and `robots.txt` all come from `pnpm icons`. Hand-editing
  any of them is undone by the next run. **Adding a unit means re-running it** —
  `src/lib/seo/cards.test.ts` is the only thing that catches a missing card. Colours are parsed out of `tokens.css` at generation time, so
  hard rule 1 holds in files ESLint cannot see.
- **`pnpm icons` uses the Playwright Chromium the e2e suite already installs**
  — no new dependency for rasterising SVG, and no browser needed in CI, which
  is why the output is committed.
- **The 16px favicon has to be looked at.** `pnpm icons --preview` writes
  `preview-{16,32,48}.png` (gitignored) for exactly that. Three redesigns went
  into the current glyph; the reasons are recorded above `NODES` in
  `scripts/brand.mjs`.

### Still open, for whoever wants it

- A lint rule forbidding hardcoded root-absolute internal links (PLAN §7). Trap
  19 is the realistic case and it needs MDX linting, which is why it has waited.
  It is now a rule with two known near-misses rather than a hypothetical.
- **The fork-preview path is still unverified.** Same-repo previews work; a PR
  from a real fork on a second account is the one path Phases 0–2 never
  exercised. It is Phase 3 work by definition.

## Working agreements

- One scoped PR per logical chunk, squash-merged. Never commit to `main`.
- `pnpm check`, `lint`, `test`, `build`, `budgets`, `test:e2e` all pass before
  opening a PR — and read the actual output rather than assuming.
- The palette hexes in `tokens.css` are an interpretation, not values carried
  from the artifact. Reconcile them when it lands; every ink weight must clear
  WCAG AA against **every** surface token, not just `--color-paper`.
