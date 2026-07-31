# Contributing

Three ways in. Find yours, and stop reading the other two.

| Track                       | You want to                                                                             | What it costs you                                                         |
| --------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **A — improve the words**   | fix a typo, unstick a sentence, replace an analogy that does not hold, add a Python tab | Nothing. Edit the `.mdx` in GitHub's web UI; it makes the fork and the PR |
| **B — improve a diagram**   | redraw a figure that is not teaching, or draw one that is missing                       | A checkout, or one click into Codespaces                                  |
| **C — build an instrument** | add a new interactive, or fix one that is decoration                                    | Ten minutes proposing the idea first, then the pipeline below             |

Track A is genuinely zero setup — no clone, no Node, no install. Skip to
[Track A](#track-a--improve-the-words) and you can be done in five minutes.

## What this is, and what is unusual about it

This is a site that teaches AI from first principles to people with no maths and
no programming — 60 lessons in 16 parts, with 35 hands-on instruments. The
pedagogy rules are not a style guide bolted onto the product. They **are** the
product: the problem comes before the word for it, one new idea per paragraph,
every analogy has to hold two sentences later, and nothing is asserted that a
reader would have to unlearn.

So a technically perfect pull request with a weak analogy gets asked to change,
and a change that makes a sentence shorter but names the term before the reader
has the idea gets declined. That is not fussiness — it is the only thing this
site has that a hundred other AI explainers do not.

The trade in the other direction: **CI polices every mechanical rule** — colour
tokens, types, formatting, bundle size, accessibility, dead links, broken
references between lessons — so review can spend all of its attention on the
teaching. That is why review here is fast, and it is why the list of automated
gates is long. `docs/QUALITY_BAR.md` is the whole bar, and it is short.

---

## Track A — improve the words

Lesson prose lives in `src/content/units/**/*.mdx` and nowhere else. Writing for
this site never means opening a React file.

### The five-minute path

1. **Find the file.** The URL ends in the filename: the lesson at
   `/units/attention` is `src/content/units/attention.mdx`.
2. **Press the pencil** ("Edit this file") on GitHub. The first time, GitHub
   forks the repo into your account for you. Nothing is installed.
3. **Edit the prose.** It starts below the `import` lines. Everything above the
   second `---` is frontmatter — see [the metadata](#the-metadata-is-load-bearing)
   before touching it.
4. **Sign off in the commit box.** Put
   `Signed-off-by: Your Name <you@example.com>` on its own line in the
   description field. [Why](#licence-and-the-dco-sign-off).
5. **Propose changes → Create pull request.** CI runs, and a bot posts a live
   preview URL of your version of the site.

For anything larger than a few paragraphs, the green **Code** button →
**Codespaces** → **Create codespace** gives you the whole toolchain in the
browser, correct Node version included, on GitHub's free tier. Still nothing
installed locally.

### The bar

Read the **Pedagogy** half of [`docs/QUALITY_BAR.md`](./docs/QUALITY_BAR.md).
It is a page long and it is the actual review checklist — not a summary of one.

Every unit has the same skeleton:

**Hook → Intuition → See it → Touch it → Where it fits → Checkpoint**

The order is the teaching, not a template. The hook is a problem or a situation,
never a definition; the term is named only once the reader already has the idea;
the diagram comes after the words have done their work, and the instrument after
the diagram, because poking at a thing and reading about it are different kinds
of knowing.

The practical consequence: an edit that pulls a definition earlier is usually
wrong even when it reads tighter. If you find yourself writing "X is a technique
for…" in an opening paragraph, that is the failure mode this shape exists to
prevent.

### Things that will bite you

- **Internal links.** Markdown link syntax emits the href verbatim, so
  `[the map](/map)` works in dev and 404s on the live site, which is served
  under `/how-ai-works/`. In `.mdx`, import the helper alongside the other
  imports at the top of the file and link as JSX:

  ```mdx
  import { withBase } from '../../lib/paths';

  <a href={withBase('/map')}>the map</a>
  ```

  Nothing catches this automatically — `/map` does exist, just not at that path.
  Links to another lesson are usually better handled by the `connections`
  frontmatter, which renders the footer at the bottom of every unit.

- **A colon followed by a space inside a frontmatter string.** A `why` that
  reads `it fails on its first afternoon: a real invoice` is ambiguous YAML and
  fails the build with a parse error. Quote the whole value.
- **Formatting is not your problem on this track.** `pnpm format:check` skips
  `src/content/`, so a stray bullet marker or a trailing space in a lesson will
  never turn your pull request red. That exclusion exists specifically so Track
  A needs no tooling; the maintainer runs `pnpm format` and it is tidied on the
  way in. Everything that carries meaning — the schema, links between lessons,
  accessibility, bundle sizes — is still checked.
- **Content is re-taught, never copied.** `reference/how-ai-works.html` is the
  original artifact this site was built from. It is a coverage checklist, not a
  source of sentences.

### The metadata is load-bearing

The frontmatter is not decoration — the sidebar, the connections footer at the
bottom of each lesson, and the whole `/map` page are generated from it.

- `prerequisites` and `connections[].to` are checked against real units **at
  build time**. A typo fails the build with an error naming the field, which is
  the point.
- `prerequisites` means genuinely required first. Merely related belongs in
  `connections`, which carries no ordering meaning. Prerequisites must also stay
  acyclic; a cycle fails the build.
- Every `connections[].why` is a real sentence about the relationship, not a
  restatement of the other lesson's title.
- `updated` is a date. Move it when the change is more than a typo.

### Bigger than an edit

A whole new lesson is not a Track A pull request. Open an issue with the
**Concept proposal** form first: what the concept is, why it belongs, and where
it connects. The curriculum is a signed-off inventory
(`docs/CURRICULUM.md`) with a deliberate order, so where a unit sits matters as
much as whether it is good.

Adding a Python tab to a `<DevAside>` that only has Java, on the other hand, is
about as welcome as a contribution gets. No language is mandatory in that
component, so the tab appears the moment you add the block and nothing else has
to change.

---

## Track B — improve a diagram

Diagrams are hand-authored SVG in an `.astro` component under
`src/components/diagrams/`. No chart library, no Mermaid — see the _Not
happening_ table in [`docs/DEPENDENCIES.md`](./docs/DEPENDENCIES.md) for why
that is settled rather than an oversight. Our figures are teaching instruments,
not dashboards, and a generic renderer fights the design system while adding
weight.

What a diagram has to do:

- **Tokens only.** Use the utility classes generated from
  `src/styles/tokens.css` — `fill-ink`, `stroke-rule`, `text-ink-muted`. A raw
  hex or `rgb()` anywhere outside `tokens.css` fails lint. There is no exception
  for "just this one shade".
- **Live inside `<Figure>`**, whose `description` prop is **required** because a
  diagram with a name but no explanation is the most common failure on a site
  this visual, and axe cannot see it. The description must teach: "a diagram of
  tokenization" is not one; "rare words break into familiar fragments, so the
  model can spell out something it has never seen" is.
- **Mark the SVG `aria-hidden="true"`.** `Figure` already supplies the
  accessible name and the description; a graphic announcing itself again is
  noise.
- **Never carry meaning by colour alone.** Shape, label, or position has to
  carry it too. The test: view it in greyscale. If you can no longer tell what
  it is saying, it is not finished.
- **Stay static.** No hydration unless the diagram genuinely cannot work without
  it. CSS animation is fine; under `prefers-reduced-motion` it must become
  _instant_, never merely slower.
- **Be worth its space.** A diagram that restates the paragraph above it should
  be deleted, not improved.

Check it on `/gallery` and at a narrow width before opening the PR. Prose and
diagrams have to stay readable on a phone even where instruments do not.

---

## Track C — a new or better interactive

Instruments are the most expensive thing here and the reason the site works. The
rule they are held to: **an instrument has to teach something the prose and the
diagram cannot.** Thirty-five of them exist against a per-Part cap, so a new one
is asking for a slot that something else then does not get.

The pipeline, in order:

1. **Open an issue** with the **Interactive proposal** form. It asks for a
   Claude artifact link, the target unit, the one thing a learner should
   understand after using it, which libraries the prototype uses, and whether
   you want to build it yourself.
2. **Wait for the `approved-to-build` label.** This is the whole reason the
   pipeline starts with an issue.
3. **Scaffold and convert.** `pnpm new:interactive <Name>` creates the folder,
   seeds its copy entry, and registers a live demo on `/gallery` — so the first
   thing your instrument does is show up somewhere a reviewer can poke at it.
   Then work the
   [artifact conversion checklist](#converting-a-claude-artifact).
4. **Open the PR.** CI runs every gate and a preview URL is posted as a comment.
   Point reviewers at your instrument's section of the preview `/gallery`.
5. **Review against `docs/QUALITY_BAR.md`.** CI has already answered the
   mechanical questions, so this is about teaching: does it teach one thing, can
   you say what that is in a sentence, does fiddling with it produce a surprise
   or confirm something the prose claimed, and is it honest — a simplification a
   reader would have to unlearn later is worse than no instrument at all.
6. **Squash-merge.**

### Why step 2 is in your favour

It is a gate on the _idea_, before you have written a line of code, and it is
the cheapest hour you will ever save.

Instrument ideas get declined for reasons that are visible in one paragraph: the
lesson is already carried by the prose and the diagram, the unit already has an
instrument, the idea teaches three things at once, or every setting looks the
same when you drag it, which makes it decoration. Finding that out from a
paragraph costs you a paragraph. Finding it out from a finished, tested,
budget-passing component costs you a weekend.

The label also settles the target unit and the one-sentence lesson before you
start, which are the two things that turn out to be hard to change afterwards.

### The contract every instrument is held to

Binding, and mostly enforced by CI:

- Wrapped in `<InstrumentPanel title lead>`, which supplies the chrome and the
  reset button.
- **Zero required props.** It has to work as a bare `<YourThing client:visible />`
  tag in MDX. Data it needs lives beside it, never in the tag.
- **No network calls.** The site is static; there is no key, no backend, and
  nowhere for a request to go.
- **Deterministic.** Any randomness is seeded.
- Hydrated `client:visible` unless there is a reason in the PR description.
- **≤ 75 KB gzipped** beyond the shared React chunk. `pnpm budgets` is the
  arbiter.
- Keyboard operable, every control labelled with what it _does_ ("Temperature",
  not "slider 1"), and axe-clean.
- **`prefers-reduced-motion` degrades to instant**, never to slow.
- Logic in a pure `logic.ts` beside the view, with its own tests.
- A `<StaticFallback>` wherever the interaction needs hover or drag precision,
  passed to `InstrumentPanel`'s `fallback` prop.

---

## Converting a Claude artifact

This project actively invites prototypes built as Claude artifacts — React is
the island framework partly so that conversion is a port rather than a rewrite.
But every artifact arrives breaking the same rules, in the same order. Work down
this list and the PR will be boring, which is the goal.

- [ ] **Colour → tokens.** Delete every `bg-slate-800`, `text-blue-500`,
      `#1e293b` and `rgb(…)`. The palette lives in `src/styles/tokens.css` and
      the utilities are generated from it. `pnpm lint` fails on a raw colour
      anywhere else, including inside an SVG `fill`.
- [ ] **Dependencies → the allowlist, or gone.** Artifacts usually arrive with
      Recharts, lucide-react, framer-motion or a component kit. None of those are
      on the list. Icons become inline SVG; charts become hand-authored SVG
      (`d3-scale`, `d3-shape`, `d3-array` and `d3-force` are pre-approved for the
      arithmetic, never the DOM layer); most animation is a CSS transition. If
      something genuinely has to be added, it needs a row in
      `docs/DEPENDENCIES.md` **in the same PR** — read the _Not happening_ table
      first so you do not argue for something already settled.
- [ ] **`useState` soup → `logic.ts` plus a thin view.** Anything with a rule
      worth getting right — a score, a probability, a threshold, a layout
      computation — becomes an exported pure function. The view holds the current
      settings and renders. Rule of thumb: if you would want to assert it in a
      test, it does not belong in a component body.
- [ ] **`Math.random()` → a seeded generator.** An instrument that behaves
      differently on each visit cannot be tested, cannot be reasoned about, and
      cannot be discussed in the prose above it ("notice that the third run…").
      There is a four-line generator to copy in
      `src/components/interactives/shared/nextpiece/logic.ts`; the seed is a
      normal piece of state, and the reset button restores it.
- [ ] **Custom controls → the primitives.** `Slider`, `Toggle`,
      `SegmentedControl`, `Stepper`, `RevealButton` and `Tabs` in
      `src/components/primitives/`. Artifact controls are almost always a `div`
      with an `onClick`, which is invisible to a keyboard and to a screen reader.
      The primitives are native elements underneath, already labelled and already
      styled. Do not hand-roll a slider.
- [ ] **Hardcoded English → out of the component.** Teaching text and datasets
      go in a `data.en.ts` beside the island. Control chrome — the panel title,
      the one-line `lead` — goes in `src/copy/en.ts`, which the scaffolder has
      already seeded an entry in. Never put teaching prose in `src/copy/en.ts`,
      and never make copy a required prop.
- [ ] **Wrap it in `<InstrumentPanel>`** and delete the artifact's own card,
      heading and reset button. Write the `lead` as what to _look for_, not what
      the control does.
- [ ] **Delete every network call.** Artifacts often call a model API. There is
      no API here, no key, and no server to hold one. Whatever it fetched has to
      become a fixed dataset in `data.en.ts`, which is usually better teaching
      anyway — a reader can be told in advance what to look for.
- [ ] **Add the `describe('the lesson the instrument exists to deliver')`
      block.** Every instrument here ships one, and it is the single
      highest-value convention in the project. Inside it, pin the pedagogical
      claim as arithmetic: if the prose says "past a threshold the model starts
      inventing", assert that it does, at that threshold, in the actual data. A
      later edit to the dataset that quietly falsifies the paragraph then fails
      the build instead of shipping.
- [ ] **Run `pnpm budgets`.** ≤ 75 KB gz beyond the shared chunks. If a library
      pushed you over, that is the answer about the library.
- [ ] **Add a `<StaticFallback caption>` if the interaction needs a pointer.**
      Drag, hover and fine positioning do not exist on a phone. The caption has
      to teach what the instrument would have shown, not apologise for its
      absence.
- [ ] **Tab through it, then turn on reduced motion.** Every control reachable
      and operable, focus always visible, nothing trapped, and every animation
      instant rather than slow. axe cannot check any of that.

Done when `pnpm lint && pnpm check && pnpm test && pnpm budgets` are all green
and it looks right on `/gallery`.

---

## Local setup

Needed for Tracks B and C. Not needed for Track A.

**Node 24.16 or newer** (`.nvmrc` pins the exact version) and **pnpm via
corepack**, never npm — the version is pinned in `package.json` and corepack
reads it.

```bash
corepack enable
pnpm install
pnpm dev
```

**On Node 20 this fails with an error about `node:sqlite` or
`node:fs/promises`** that looks like a corrupt install or a broken lockfile. It
is neither. It is the Node version, and no amount of deleting `node_modules`
will fix it. Switch to 24 first.

| Command                       | What it does                                         |
| ----------------------------- | ---------------------------------------------------- |
| `pnpm dev`                    | dev server                                           |
| `pnpm build`                  | production build, then the search index              |
| `pnpm preview`                | serve the built site **with the base path applied**  |
| `pnpm check`                  | `astro check` + `tsc --noEmit`                       |
| `pnpm lint` / `lint:fix`      | ESLint, plus the raw-colour check                    |
| `pnpm format`                 | Prettier, over everything including Markdown         |
| `pnpm test`                   | Vitest — interactive logic and the progress store    |
| `pnpm test:e2e`               | Playwright smoke + axe, against the built site       |
| `pnpm budgets`                | island bundle sizes against `scripts/budgets.json`   |
| `pnpm new:interactive <Name>` | scaffold an instrument and register it on `/gallery` |
| `pnpm new:unit <id>`          | scaffold a lesson with the anatomy already in place  |

Three things that cost other people an hour:

- **Run `pnpm build` before pushing content changes.** Content-collection schema
  failures — a reference to a unit that does not exist, missing frontmatter, a
  prerequisite cycle — surface at build, not in dev. Dev will happily serve a
  page that cannot ship.
- **Read the exit code of `pnpm check`, not its output.** It is two commands.
  The first prints a friendly `0 errors, 0 warnings` summary and the second
  prints nothing at all when it passes — so a green-looking block can sit above
  a failure. This has shipped a red PR here already.
- **`pnpm test:e2e` and `pnpm budgets` both build first.** They are slow on
  purpose: they measure what a browser actually downloads, not what the dev
  server improvises.

`docs/HANDOFF.md` carries the full list of traps that produce a green build that
is wrong. If something passes locally and behaves strangely on the preview URL,
read that file before anything else.

---

## Definition of done

Everything on this list either passes or is answered in the PR description.

**CI checks these — do not check them by hand.**

| Job                        | What it fails on                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Lint, types, unit tests    | Prettier formatting, ESLint (including the a11y rules), a raw colour outside `tokens.css`, types, Vitest  |
| Build, budgets, E2E + a11y | Schema violations, a unit that did not render, an island over budget, an axe violation, a Playwright fail |
| Link check                 | Internal links that do not resolve                                                                        |

**Nobody can check these but you.**

- Keyboard: tab to every control, operate it, and leave. Focus visible, never
  trapped.
- Reduced motion on: animation is instant, not slow.
- A narrow window: prose and diagrams still readable.
- No new dependency without a row in `docs/DEPENDENCIES.md` in the same PR.
- The pedagogy half of `docs/QUALITY_BAR.md`, read against the rendered preview
  rather than the diff.

Keep the PR to one logical change. A pull request that fixes a typo and also
reorders a section is two reviews wearing one hat, and the second one is the
slow one.

---

## Licence and the DCO sign-off

The repository is dual licensed on purpose: **code is MIT** (`LICENSE`),
**content — lessons, docs, illustrations — is CC BY 4.0** (`LICENSE-content`).

**Inbound = outbound.** What you contribute is licensed under the same pair as
the part of the repo it lands in. You keep the copyright.

Every commit needs a **Developer Certificate of Origin** sign-off:

```bash
git commit -s -m "unit: sharpen the tokenization hook"
```

which appends one line:

```
Signed-off-by: Your Name <you@example.com>
```

In GitHub's web editor there is no `-s`, so type that line yourself into the
commit description box. Use a real name and a working email.

**Why this matters more here than on most repositories.** Track C actively
invites you to bring a Claude artifact as a prototype, and the maintainer cannot
inspect where that code came from. An artifact you prompted into existence is
yours to contribute. An artifact someone else published, a snippet lifted from
another project, or a diagram traced from a paper is not — not without a licence
that permits it, named in the PR. The sign-off is you saying you have the right
to send what you sent. It is thirty characters and it is the only provenance
signal this project has.

Nothing in CI enforces it today; it is checked at review. A missing sign-off
looks like every check green and a comment asking you to amend:

```bash
git commit --amend -s --no-edit
git push --force-with-lease
```

---

## How review and merge actually work

Bhavin Virani (`@bhavinvirani`) is the only maintainer today. That is a fact
about the project, not a stage of a plan, and it shapes the process in two ways.

- **Zero approvals are required to merge**, because GitHub forbids approving
  your own pull request and requiring one would deadlock the only person able to
  merge anything. CI is the real gate: `main` requires every status check to
  pass, with no bypass, and that applies to the maintainer's own pull requests
  too. Everything goes through a PR here, including his.
- **Everything is squash-merged**, by him.

What happens to your PR: CI runs, a preview URL appears as a comment, and review
happens against the preview rather than the diff — because the questions worth
asking ("does the hook make you keep reading", "does this instrument surprise
you") cannot be answered from a patch. Expect comments about teaching before
comments about code. If a mechanical check is red, that is yours to fix — though
prose formatting is excluded from the check on purpose, so a web-UI content PR
should not go red for anything cosmetic.

No response times are promised. This is one person's side project, and a
pull request sitting for a while is not a verdict on it.

## Things that will be declined

Said plainly, so nobody spends a weekend finding out:

- **Prose copied from `reference/how-ai-works.html`.** Content is re-taught,
  never copied. The reference is a coverage checklist.
- **A dependency without a row in `docs/DEPENDENCIES.md`**, and anything in that
  file's _Not happening_ table — chart libraries, Mermaid, three.js, a component
  kit, a backend, analytics.
- **An instrument that is decoration**: one where every setting looks the same,
  or that teaches whatever the paragraph above it already said.
- **Site-wide reformatting, dependency-bump sprees, or typo PRs generated in
  bulk.** They cost more review than they return, and Dependabot already has the
  second one.
- **Translations.** i18n is a real ambition and it is in `docs/FUTURE.md`; the
  site is not structured to absorb a translated unit yet, and a half-translated
  curriculum is worse than an English one.
- **A new unit that arrived as a pull request** rather than as a concept
  proposal. Where a lesson sits in the order is most of the work.

## The rest

- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — how people are expected to
  behave here, and what to do when someone does not.
- [`SECURITY.md`](./SECURITY.md) — reporting a vulnerability. The site is static
  with no backend and no accounts, which makes the surface small but not zero.
- [`docs/QUALITY_BAR.md`](./docs/QUALITY_BAR.md) — the review checklist itself.
- [`docs/CURRICULUM.md`](./docs/CURRICULUM.md) — the unit inventory and why the
  order is what it is.
- [`docs/DEPENDENCIES.md`](./docs/DEPENDENCIES.md) — the allowlist, and what was
  rejected.
- [`docs/FUTURE.md`](./docs/FUTURE.md) — deferred ideas and what would have to
  change to revisit them.
- [`docs/HANDOFF.md`](./docs/HANDOFF.md) — current state, load-bearing version
  pins, and the traps.
- [`CLAUDE.md`](./CLAUDE.md) — the architecture map and the ten rules the build
  follows. Written for Claude Code, and the fastest way for a person to find
  where anything lives.

Last thing: if a rule in any of these keeps producing worse writing, say so in
the PR and change it. A rule nobody believes gets skipped silently, which is
worse than not having one.
