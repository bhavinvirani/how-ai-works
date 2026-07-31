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

**Last updated:** Parts 1–4 ported and live; 15 of 60 units (2026-07-31).

| Phase                    | State                                                  |
| ------------------------ | ------------------------------------------------------ |
| 0 — Foundation           | Merged (#1)                                            |
| 1 — Component system     | Merged (#2). The pilot unit shipped with Phase 2 (#10) |
| 2 — Curriculum port      | **In progress.** 15/60 units, 4/16 Parts, `2-nav` done |
| 3 — Community launch kit | Not started                                            |

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

**Nothing is blocked.** The curriculum is signed off and porting is under way.

### Still true

- **Phase 2 is mid-flight.** Parts 1–4 are live; 45 units and `2-meta` remain.
  The runbook for picking up the next slice — the next Part, the instrument
  budget, how a batch is actually run, and every remaining unit with its
  artifact line range — is **_Continuing Phase 2_ at the bottom of this file.**
  Read that before starting.
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
proposed. That target is now allocated per Part; see _Continuing Phase 2_.

Two placements were left open on purpose and are still open, both landing in
slices that have not been written yet: where `embeddings` sits (it is currently
the closer of `inside-the-machine`, the **next** Part to be ported — so this is
now a live decision, not a future one), and whether `positional-encoding` comes
before or after `multi-head-attention`.

**Two issues it turned up. One is fixed here; one is not.**

1. **Fixed in this PR.** `[...slug].astro` passed the **unfiltered** collection
   as props while paths came from `visible`, so a published unit connecting to a
   draft emitted a link to a page `getStaticPaths` never generated — surfacing
   as a lychee "broken internal link" rather than the Zod reference error it
   looks like. It now passes `visible`, which is what `resolve.ts`'s
   drop-anything-missing comment always assumed.
2. **Open.** `/map` cannot colour nodes by Part. `tokens.css` ships two
   categorical accents, and hard rule 9 forbids colour-only meaning regardless.
   Encode Part by label and cluster position. Decide before `2-meta` is built,
   not after.

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

## Continuing Phase 2 — the runbook

**State: 15 of 60 units live. Parts 1–4 complete. `2-nav` done.** Merged in #10.

Everything below is what a fresh session needs to pick up the next slice without
rediscovering it.

### The next slice

**`inside-the-machine` (7 units)** — the heaviest Part on the site: 3 units at
L effort and four units that all draw the same network.

`src/components/diagrams/LayerStackDiagram.astro` **already exists**, is
typechecked, and is used by nothing yet. It was built for exactly this Part:
`layers` counts its connections, `forward-pass` lights a path through it,
`backpropagation` reverses the arrows along the same edges, and
`feature-hierarchy` labels what each level detects. Four views of one machine is
most of the teaching; four separate networks is the most expensive Part on the
site for no gain. **Pass it to the agents as a component they must use, not
discover.**

Two known traps in this Part, both from the source analysis:

- `forward-pass` and `backpropagation` ship the _identical_ stepper in the
  artifact. Ported literally the reader gets the same experience twice and
  learns nothing either time. They have to diverge: `forward-pass` is about
  fixed cost regardless of difficulty, `backpropagation` is about blame
  splitting in proportion. Their **diagrams** should stay near-identical — that
  repetition is the lesson.
- `feature-hierarchy` moves **after** `backpropagation` (CURRICULUM's one
  declared prerequisite override). Its claim — the hierarchy assembles itself
  because that arrangement makes the wrongness smallest — cannot honestly be
  made to a reader who has not yet watched blame travel backwards.

### Instrument budget — decided 2026-07-31, and it binds

The signed-off rule is _an instrument has to teach something the prose and the
diagram cannot_, targeting ~35 across the site. The first 15 units produced 13
instruments, tracking to ~52, because **each agent justified its own instrument
in isolation and nothing counted the total.**

So the budget is now allocated per Part and given to the batch as a cap:

| Part                    | Units  | Instruments |
| ----------------------- | ------ | ----------- |
| `inside-the-machine`    | 7      | **3**       |
| `language-problem`      | 3      | **2**       |
| `the-transformer`       | 5      | **3**       |
| `large-models`          | 5      | **3**       |
| `building-an-assistant` | 4      | **2**       |
| `assistant-behaviour`   | 3      | **2**       |
| `asking-well`           | 3      | **2**       |
| `your-own-documents`    | 4      | **2**       |
| `letting-it-act`        | 3      | **1**       |
| `does-it-work`          | 2      | **1**       |
| `small-fast-cheap`      | 4      | **1**       |
| `the-whole-picture`     | 2      | **0**       |
|                         | **45** | **22**      |

13 built + 22 remaining = 35. A batch may argue for a different split _within_
its Part, but not for a bigger total. Units that lose their instrument still get
a diagram — the _See it_ step is not optional, and cutting an instrument is not
licence to cut both. `ai-ml-and-deep-learning` and `supervised-learning` are the
model for what a good "no" looks like.

### Review depth — decided 2026-07-31

Gates plus spot-checks: agents draft, integrate centrally, run **every gate by
exit code**, and read the prose of the highest-stakes unit in each batch in
full. Accepted risk, stated so nobody is surprised: CI cannot see pedagogy, so a
weak analogy or an unearned jargon term can reach `main` unreviewed.

### How to run a batch

This is the shape that worked for 13 units across two batches.

1. **One agent per unit, in parallel.** Give each agent: CLAUDE.md,
   QUALITY_BAR.md, its CURRICULUM row, **the shipped units as the reference
   implementation** (not a written spec — quality tracks whatever is already in
   the repo), and its artifact line range.
2. **Agents write ONLY** their unit MDX, their diagrams, and their own
   `components/interactives/<Name>/` folder. They must never touch
   `src/copy/en.ts`, `src/pages/gallery.mdx`, `src/content.config.ts`, or
   another unit. Concurrent edits to shared files are the one thing that
   actually conflicts — everything else merges cleanly.
3. **Give every agent the explicit list of units that already exist.** A
   `reference('units')` to anything else fails the build. Forward links get
   trimmed on the way in and backfilled by the slice that lands the target;
   agents should report what they trimmed.
4. **Require the lesson to be pinned by a test.** Every shipped instrument has a
   `describe('the lesson the instrument exists to deliver')` block asserting the
   pedagogical claim, so a dataset edit that quietly falsifies the surrounding
   prose fails the build rather than shipping.
5. **Integrate:** add the `ui.interactives` entries, add the `/gallery` entries,
   `pnpm format`, then run every gate **by exit code**.

Agents cannot run the gates themselves — a fresh worktree has no `node_modules`,
and several agents running `astro build` in one working directory clash. They
verify with the binaries directly and report; integration is where it gets
proven.

### Going faster without lowering the bar

The first 15 units took two batches and a lot of integration round-trips. Most
of that was avoidable. Apply these before the next batch — none of them touches
what makes the units good, and each removes a step that produced rework:

1. **Pre-compute the frontmatter and hand it to the agent.** Prerequisites and
   connections are derivable from the artifact's own link graph
   (`builds on` / `back to` → prerequisites, everything else → connections),
   filtered to units that already exist. Agents currently guess this, and then
   report which links they trimmed. Generating the exact frontmatter block per
   unit removes both the guesswork and the trimming report — and removes the
   class of build failure where an agent references a unit that does not exist.
2. **Pre-write the `ui.interactives` entries before the batch runs.** The
   instrument names come from the budget allocation above, which is decided
   before any agent starts. Writing the copy entries up front removes an
   integration step _and_ removes the runtime-throw risk when an entry is
   missed — which every batch so far has had to be reminded about.
3. **Batch two or three whole Parts at once.** The concurrency cap runs ~10
   agents at a time regardless, so a 15-agent batch costs roughly what a 7-agent
   batch costs in wall-clock, and halves the number of integrate-and-verify
   cycles.
4. **Name the shared components in the brief.** `LayerStackDiagram` exists
   because four units needed it; nobody discovered that from the brief, it came
   out of reading the source first. Before each batch, scan the Part for repeats
   — the attention chip view, the probability-bar view, the context-budget board
   are the known ones — and either build them first or name the agent that owns
   them.
5. **Run the gates once per batch, not per unit.** Integration is cheap; it is
   the round-trips that are not.

**What must NOT be traded for speed**, because these are what have actually been
catching things:

- Every instrument keeps its `describe('the lesson the instrument exists to
deliver')` block. This is the single highest-value convention in the port.
- Every gate is run **by exit code**, never by reading output (trap 15).
- The instrument cap per Part is a cap, not a target to grow into.
- The shipped units stay the reference implementation. Quality tracks the repo,
  so it degrades the moment a weaker unit is allowed to land as the new example.

### Suggested session plan

Three sessions, one substantial PR each, each ending mergeable and live.

| Session | Parts                                                                                                          | Units | Instruments |
| ------- | -------------------------------------------------------------------------------------------------------------- | ----- | ----------- |
| A       | `inside-the-machine`, `language-problem`, `the-transformer`                                                    | 15    | 8           |
| B       | `large-models`, `building-an-assistant`, `assistant-behaviour`, `asking-well`                                  | 15    | 9           |
| C       | `your-own-documents`, `letting-it-act`, `does-it-work`, `small-fast-cheap`, `the-whole-picture`, plus `2-meta` | 15    | 5           |

Session C carries `2-meta` (`/map`, Pagefind, sitemap) because it is the lightest
on instruments — and `/map` needs the colour question settled first.

### Remaining units, with artifact line ranges

**`inside-the-machine`** — 7 units

- `neuron` (order 1) — artifact `neuron`, lines 1399–1425
- `layers` (order 2) — artifact `layers`, lines 1426–1448
- `forward-pass` (order 3) — artifact `forward`, lines 1487–1524
- `backpropagation` (order 4) — artifact `backprop`, lines 1525–1567
- `feature-hierarchy` (order 5) — artifact `hier`, lines 1449–1486
- `why-depth-works` (order 6) — artifact `deep`, lines 1568–1592
- `embeddings` (order 7) — artifact `embed`, lines 1593–1644

**`language-problem`** — 3 units

- `why-language-is-hard` (order 1) — artifact `langhard`, lines 1645–1672
- `tokenization` (order 2) — artifact `tok`, lines 1673–1717
- `recurrent-networks` (order 3) — artifact `rnn`, lines 1718–1765

**`the-transformer`** — 5 units

- `attention` (order 1) — artifact `att`, lines 1766–1828
- `multi-head-attention` (order 2) — artifact `heads`, lines 1829–1848
- `positional-encoding` (order 3) — artifact `pos`, lines 1849–1868
- `transformers` (order 4) — artifact `tf`, lines 1869–1912
- `multimodal-models` (order 5) — artifact `multimodal`, lines 2962–2989

**`large-models`** — 5 units

- `llm` (order 1) — artifact `llm`, lines 1913–1940
- `text-generation` (order 2) — artifact `gen`, lines 1941–1997
- `temperature` (order 3) — artifact `temp`, lines 1998–2054
- `context-window` (order 4) — artifact `ctxwin`, lines 2055–2082
- `scaling-laws` (order 5) — artifact `scale`, lines 2083–2127

**`building-an-assistant`** — 4 units

- `pretraining` (order 1) — artifact `pretrain`, lines 2128–2153
- `base-models` (order 2) — artifact `base`, lines 2154–2184
- `fine-tuning` (order 3) — artifact `ft`, lines 2185–2212
- `rlhf` (order 4) — artifact `rlhf`, lines 2213–2267

**`assistant-behaviour`** — 3 units

- `reasoning-models` (order 1) — artifact `reason`, lines 2268–2298
- `hallucination` (order 2) — artifact `halluc`, lines 2299–2348
- `why-models-refuse` (order 3) — artifact `align`, lines 2349–2376

**`asking-well`** — 3 units

- `prompting` (order 1) — artifact `prompt`, lines 2377–2405
- `few-shot-prompting` (order 2) — artifact `fewshot`, lines 2406–2440
- `chain-of-thought` (order 3) — artifact `cot`, lines 2441–2479

**`your-own-documents`** — 4 units

- `rag` (order 1) — artifact `rag`, lines 2480–2533
- `chunking` (order 2) — artifact `chunk`, lines 2534–2569
- `vector-search` (order 3) — artifact `vdb`, lines 2570–2604
- `context-engineering` (order 4) — artifact `ctxeng`, lines 2605–2661

**`letting-it-act`** — 3 units

- `tool-use` (order 1) — artifact `tools`, lines 2662–2696
- `mcp` (order 2) — artifact `mcp`, lines 2697–2733
- `agents` (order 3) — artifact `agents`, lines 2734–2785

**`does-it-work`** — 2 units

- `evaluation` (order 1) — artifact `evals`, lines 2786–2814
- `prompt-injection` (order 2) — artifact `inject`, lines 2815–2847

**`small-fast-cheap`** — 4 units

- `small-models` (order 1) — artifact `slm`, lines 2848–2887
- `distillation` (order 2) — artifact `dist`, lines 2888–2918
- `quantization` (order 3) — artifact `quant`, lines 2919–2961
- `cost-and-latency` (order 4) — artifact `cost`, lines 2990–3018

**`the-whole-picture`** — 2 units

- `what-ai-cannot-do` (order 1) — artifact `limits`, lines 3019–3045
- `how-it-all-connects` (order 2) — artifact `map`, lines 3046–3074

### After the units

- **`2-meta`** — `/map`, Pagefind, sitemap. Depends on the schema rather than
  the unit count, so it can land any time. **Decide the `/map` colour question
  first** (see _Two issues it turned up_ above): sixteen Part colours are not
  reachable, so Part must be encoded by label and cluster position.
- **Backfill the trimmed forward links.** Every slice trimmed connections to
  units that did not exist yet. They are recorded in the PR descriptions.
- A lint rule forbidding hardcoded root-absolute internal links (PLAN §7). Needs
  MDX linting to catch the realistic case, which is why it waited.

Also unverified until Phase 3: **the fork-preview path**. Same-repo previews
work; a PR from a real fork on a second account is the one path Phases 0–2 never
exercise.

---

## Working agreements

- One scoped PR per logical chunk, squash-merged. Never commit to `main`.
- `pnpm check`, `lint`, `test`, `build`, `budgets`, `test:e2e` all pass before
  opening a PR — and read the actual output rather than assuming.
- The palette hexes in `tokens.css` are an interpretation, not values carried
  from the artifact. Reconcile them when it lands; every ink weight must clear
  WCAG AA against **every** surface token, not just `--color-paper`.
