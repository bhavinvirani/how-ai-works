<!--
A preview URL is posted as a comment once CI finishes. Review your change
there, not in `pnpm dev` — the preview is the built site with the base path
applied, which is the only place base-path mistakes are visible.
-->

## What this changes

<!-- Two or three sentences. The diff carries the detail. -->

## Track

<!-- Delete the lines that do not apply. -->

- [ ] **A — the words.** Prose in `src/content/units/`.
- [ ] **B — a diagram.** An SVG component in `src/components/diagrams/`.
- [ ] **C — an interactive.** Requires an `interactive-proposal` issue already
      carrying `approved-to-build`.
- [ ] Something else — tooling, CI, docs, dependencies.

Closes # <!-- Track C must have one. -->

---

## Pedagogy

The half that needs a person, because no gate can read. Judge it against the
rendered preview page rather than the diff, and tick only what this change
actually touches — a checklist ticked wholesale tells the reviewer nothing.

### The words

- [ ] Opens with a problem or a situation, **not** a definition. The term is
      named only after the reader already has the idea.
- [ ] One new idea per paragraph. Two ideas in one paragraph means two
      paragraphs.
- [ ] Every technical term is defined in plain words at first use, in that
      sentence or the next.
- [ ] The analogies come from ordinary life and **hold** for as long as they are
      used. One that breaks down two sentences later does more damage than none.
- [ ] It answers all three questions somewhere and explicitly: why this exists,
      how it is actually used, what it connects to.

> Test: cover the title and read the first paragraph. Does it make you curious,
> or does it read like a textbook clearing its throat?

### Formulas

- [ ] Present only where the symbols make the idea clearer than words do, each
      with a plain-English reading directly underneath saying what it _means_
      rather than restating the symbols.

> Test: delete the formula. If the section reads just as well, delete it for
> real.

### Diagrams

- [ ] The `description` teaches. "A diagram of tokenization" is not a
      description; "rare words break into familiar fragments, so the model can
      spell out something it has never seen" is.
- [ ] Nothing is carried by colour alone — shape, label, or position carries it
      too.
- [ ] It is worth its space, and does not restate the paragraph above it.

### Interactives

- [ ] It teaches **one** thing, and here is that sentence: <!-- write it -->
- [ ] Fiddling with it produces a surprise, or confirms something the prose has
      just claimed. If every setting looks much the same, it is decoration.
- [ ] The `lead` says what to _look for_, not what the control does.
- [ ] It is honest. A simplification a reader would have to unlearn later is
      worse than no instrument at all.

### Connections

- [ ] Every `why` is a real sentence about the relationship, not a restatement
      of the other unit's title.
- [ ] Prerequisites are genuinely required, not merely related. Merely related
      belongs in `connections`, which carries no ordering meaning.

---

## Technical

CI already runs formatting, lint, types, unit tests, the build, axe, the link
check and the bundle budgets. If it is green, that half is answered. Do not
re-check it here — a checklist that duplicates CI is one people learn to tick
without reading, and then they tick this half too.

What is left is only what automation cannot see:

- [ ] **Keyboard.** Tabbed to every new control, operated it, tabbed away. Focus
      visible throughout and never trapped.
- [ ] **Reduced motion.** With the OS setting on, animation is _instant_, never
      merely slower.
- [ ] **Labels** say what a control does — "Temperature", not "slider 1".
- [ ] **`StaticFallback`** wherever the interaction needs hover or drag
      precision, with a caption that teaches rather than apologises.
- [ ] **Logic lives in `logic.ts`** and is tested, including the
      `describe('the lesson the instrument exists to deliver')` block.
- [ ] **Any new dependency has a row in `docs/DEPENDENCIES.md`**, in this PR.
      Read its "Not happening" table first.
- [ ] **Internal links go through `withBase`**, checked on the preview. Markdown
      link syntax in `.mdx` emits the href verbatim, so `[map](/map)` works in
      dev and 404s in production, and nothing in CI catches it.
- [ ] Read once at a phone width. Instruments may stand down there; prose and
      diagrams may not.

---

## Sign-off

- [ ] My commits are signed off — `git commit -s`. This is the DCO, and it is
      the only paperwork here.
- [ ] Inbound equals outbound: code under MIT, prose and diagrams under
      CC BY 4.0.

If any part of this came from somewhere else — an AI prototype, a diagram you
adapted, a paragraph that was already good — say so here. Provenance nobody can
inspect is exactly why the sign-off exists.

<!-- where it came from, or "all mine" -->
