# Future

Things that are not being built now, each with the condition that would change
that.

Adding an entry here is how you **close** a discussion, not how you open one.
"We should do X" becomes a paragraph on this page with a trigger attached, and
then stops being re-argued every few months. That re-arguing is the actual cost
this file exists to remove — a solo maintainer can afford to decide something
once.

Every entry answers three things: what it is, why it is not being done now, and
what would have to be true to revisit it. The third one is the point. A
deferred idea with no trigger condition is just a nag.

So if you want something on this page built, argue that its trigger has fired.
The idea is already accepted in principle; only the timing is open. That is a
much shorter conversation, and it is the one worth having.

Its companion is the **Not happening** table in `docs/DEPENDENCIES.md`. Those
are refusals with no trigger. This page holds deferrals with one.

Nothing here is scheduled. `PLAN.md` §8 calls it Phase 4, which is a label for
"after the launch kit", not a date.

---

## More languages in developer asides

**What it is.** `<DevAside>` renders one tab per language actually provided,
and no language is mandatory (`PLAN.md` §3.5). Two are registered today: Java
first, Python second. Every unit has a Python tab; 59 of 60 have a Java one —
`multi-head-attention` is the single gap. Anything beyond those two is future
work.

**Why not now.** A third language is a content commitment, not a config change.
Someone has to write comparison prose in it across 60 units, and a language
with tabs on eight units is worse than one with none: a reader picks it once,
the choice is remembered site-wide, and then they keep landing on asides where
their tab silently is not there. Partial coverage teaches readers not to trust
the tabs.

**Revisit when.** Someone wants to write one and will carry it well past a
handful of units. Mechanically this is small — a line in
`src/lib/devaside/languages.ts`, a matching forwarding pair in
`src/components/blocks/DevAside.astro` (Astro needs a literal slot name, so the
loop you want to write there fails the build), then a `<Fragment slot="…">` per
aside.

**This is the best good-first-issue seam on the project, and it is meant to be
used as one.** The unit of work is one aside in one file. It compiles or it does
not. It needs no design decision, no new dependency, and no interaction with
anything else on the page — which is exactly what someone opening their first
PR here needs. Start with the missing Java tab in `multi-head-attention`.

---

## New units beyond the artifact

**What it is.** The 60 units came from `reference/how-ai-works.html`. The
artifact defined the scope, the scope was signed off in `docs/CURRICULUM.md`,
and the port is finished. A 61st unit is new curriculum.

**Why not now.** Because a new unit is not an addition, it is an edit to a
graph. The 60 form one connected prerequisite structure with a reading order,
and a unit dropped into it needs prerequisites that already exist, connections
whose `why` says something real, and a position that never puts a reader in
front of a concept they have not met. That is a curriculum decision. It is
also the decision most likely to be made badly by someone who has only read the
one unit they care about.

**Revisit when.** Per unit, on a `concept-proposal` issue that names the
concept, why it belongs, and where it connects — in both directions. If it
cannot be placed in the graph, that is the answer: a unit with no prerequisites
and no dependents is a blog post, and it should be one. The schema enforces the
easy half of this already. `prerequisites` and `connections[].to` are Zod
`reference('units')`, so a proposal that cannot name real neighbours cannot be
built even if everyone agrees with it.

---

## 3D, as a per-unit exception

**What it is.** `three.js` or react-three-fiber, lazily loaded on the one or
two units where a third dimension genuinely teaches. Embedding space is the
standing example.

**Why not now.** Heavy, and hostile to low-end mobile. It is rejected in
`docs/DEPENDENCIES.md`, in `PLAN.md` §1.4, and by name in CLAUDE.md rule 8.
A tree-shaken build still lands several times over the 75 KB island budget
before anything is drawn, and the readers most likely to be pushed off the page
by that are the ones this site was written for.

**Revisit when.** All three of these can be written down:

1. A specific unit where a 2D SVG demonstrably cannot teach the thing. "It
   would look better" is not that.
2. Its own entry in `scripts/budgets.json`, the way `ConceptMap` has one, so it
   is capped on its own page and can never leak into the shared chunk.
3. A `<StaticFallback>` that teaches the same lesson without the canvas —
   because the phone case is the majority case and it is not going to improve.

Miss any one and the answer stays no. The exception was always meant to be
per-unit and lazy; a general 3D capability is not on the table at all.

---

## Touch-native interactives

**What it is.** Instruments designed for a finger, rather than adapted to one.

**Why not now.** The site is desktop-first by design (CLAUDE.md rule 3). Prose
and diagrams must stay readable on a phone and are checked at a narrow width,
but an instrument that needs hover or drag precision falls back to
`<StaticFallback>` below `md` — 12 of the 35 instruments ship one today. That
is a trade, not an oversight. A slider that works under a fingertip and a
slider that works under a mouse are different controls, and building both
doubles the surface area of every instrument, including the axe pass, the
keyboard pass and the tests.

The fallback is also not a placeholder. `StaticFallback` requires a `caption`
whose job is to teach the lesson without the interaction, and
`docs/QUALITY_BAR.md` fails one that apologises instead. Replacing a caption
that works with a control that half-works is a downgrade.

**Revisit when.** Someone proposes a specific instrument whose interaction _is_
the lesson, where the fallback caption provably cannot carry the idea, and can
say why in one sentence. Then it is an ordinary `interactive-proposal` with a
touch design attached, not a change of policy.

Worth saying plainly: the site collects nothing about its readers and never
will, so nobody is ever going to settle this with "x% of our traffic is
mobile". The argument has to be made from the teaching. That is a feature of
the constraint, not a gap in it.

---

## Translation

**What it is.** The site in a language other than English.

**Why not now.** Nothing is translated and nothing is scheduled. What exists is
groundwork, and it is deliberately cheap groundwork. CLAUDE.md rule 10 — no
user-facing English inside components — is the reason `src/copy/en.ts` exists
at all, and the reason every instrument's examples live in a `data.<locale>.ts`
beside it instead of inside `logic.ts`. Both conventions cost roughly nothing
while there is one locale, and are close to impossible to retrofit across 60
units and 35 instruments once there are two. Keeping the door open was the
cheap part. Walking through it is not.

**What it would actually take.** Concretely, and in rough order of how much
people underestimate it:

- **`src/copy/en.ts`** — one file, under 300 lines of control chrome. This is
  the easy one, and it is the one everybody pictures when they say i18n.
- **Locale routing.** Astro's i18n routing on top of `base`. Every internal
  link already goes through `withBase`, so the change itself is small; the work
  is checking it, because the site lives under `/how-ai-works/` and a locale
  segment has to land inside that, not beside it. This is the same class of bug
  that 404s KaTeX and Pagefind in production while looking perfect in dev.
- **60 units of prose, re-taught rather than translated.** CLAUDE.md rule 4
  applies to a translator too. An analogy chosen because it is ordinary in
  English may be exotic somewhere else, and a faithful translation that leaves
  a broken analogy standing is worse than none.
- **35 instrument datasets.** These are not strings, they are the lesson.
  `TokenSplitter` teaches subword splitting using English morphology and a
  Polish surname; the equivalent in another language is a _different dataset
  teaching a different fact_, and its
  `describe('the lesson the instrument exists to deliver')` block has to be
  rewritten to match. Some instruments will not survive the crossing at all and
  will need replacing.
- **Frontmatter.** `summary` on every unit, and every `connections[].why`.
  These are prose that happens to live in the schema, and they generate the
  sidebar and the connections footers.
- **Search.** Pagefind indexes per language off the `lang` attribute, so the
  index and the UI both have to know which locale a page is.

**Revisit when.** A fluent contributor commits to one language end to end _and_
to keeping it current. Not a pull request — a person. A half-translated site is
worse than an English one: a reader who lands on a translated index and then
hits English units has been misled, and from that day every content PR silently
rots a translation nobody is maintaining. That last cost is permanent and it
lands on the maintainer, which is why the bar is set where it is.

---

## Optional progress sync

**What it is.** Reading progress that follows a reader between devices. Opt-in,
off by default.

**Why not now.** The site has no backend, and that is the constraint the whole
architecture rests on. `/progress` already solves the cross-device case with
Export and Import JSON buttons: clumsier, works everywhere, costs nothing to
keep running, and cannot leak anything because nothing ever leaves the browser.

**The one documented exception.** The design, when it happens, is GitHub Gist
as the store — the reader's own account, their own data, nothing of ours
holding it — plus roughly fifty lines of worker whose entire job is exchanging
an OAuth code for a token, because an OAuth client secret cannot ship inside a
static bundle. That worker is the only backend this project has ever agreed
could exist. It is named in CLAUDE.md rule 8, in `PLAN.md` §1.4 and §4, and in
the **Not happening** row in `docs/DEPENDENCIES.md`, specifically so nobody has
to re-derive whether the no-backend rule has a hole in it. It has exactly one,
it is that shape, and it is closed today.

**Why it stays cheap to defer.** `ProgressStore` in `src/lib/progress/types.ts`
is an interface with one implementation, `LocalStorageProgressStore`. A
Gist-backed store is a second implementation behind the same seven methods, and
not one component changes. The payload is versioned (`{ v: 1, … }`) with a
migration hook for the same reason. That interface is not abstraction for its
own sake — it _is_ this deferral, written as code, and it is why sitting on the
decision costs nothing.

**Revisit when.** All of:

- Somebody actually asks for it. Nobody has.
- There is a maintainer willing to own a deployed service — its outages, its
  secret rotation, its abuse surface. That is a different job from maintaining
  a static site, and it, not the fifty lines, is the real reason this is
  deferred.
- It stays genuinely optional: local storage remains the default, and no reader
  is ever asked to sign in to read a lesson.

Fail any one of those and export/import stays the answer.

---

## Social preview images

**What it is.** A generated Open Graph image per page, so a shared link renders
as a card instead of a bare URL.

**Why not now.** It is polish for an audience the site does not have yet, and
it is the cheapest thing on this page to add later. `BaseLayout` currently
emits `<title>` and `<meta name="description">` and no `og:` tags at all. Both
of those props are already passed for every page, which means the entire input
to an OG image already exists — so delaying costs nothing and touches no
content.

**Revisit when.** Links to the site start being shared and land flat. Whoever
does it should know the trap in advance: `og:image` is fetched by _someone
else's_ server, so the URL must be absolute and include the base path.
`withBase` alone is not enough, and a root-relative path produces a card with a
missing image, which looks identical to no card at all — the failure is
invisible from inside the site.

---

## Visual regression tooling

**What it is.** Screenshot diffing in CI, so an unintended change to a diagram
or a token fails a build.

**Why not now.** Because nothing has slipped through. `/gallery` renders every
instrument on one page from the code production uses, and every PR gets a
preview URL, so the current answer to "did this change how anything looks?" is
to open two tabs. That is free and it cannot drift from production, because it
_is_ production — the same argument that keeps Storybook out
(`docs/DEPENDENCIES.md`).

Screenshot suites also have a well-known failure mode. They go red for font
hinting and antialiasing differences until people stop reading them, and at
that point they are worse than nothing, because they are spending the review
attention `docs/QUALITY_BAR.md` exists to protect.

**Revisit when.** A visual regression reaches `main` and nobody notices until a
reader does. Twice, ideally — once is an argument for looking at the preview.
If it does happen, scope it to the smallest surface that would have caught that
regression: the diagram components and `/gallery`, one browser, one container,
pinned. Not every page at every viewport.

---

## What is not on this page

Ideas rejected outright rather than deferred live in the **Not happening**
table in `docs/DEPENDENCIES.md`: chart libraries, Mermaid, Storybook, a UI
component library, and any backend beyond the one exception above. Those carry
no trigger condition, which is precisely the difference.

If you think one of them belongs here instead — a refusal that should really be
a deferral — that is a genuine argument and worth making. In an issue, once.
