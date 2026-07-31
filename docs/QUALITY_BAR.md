# Quality bar

What has to be true before a change ships.

The technical half is almost entirely automated. That is the point: review
attention is the scarcest thing this project has, and none of it should be
spent on something a script can check. Read the pedagogy half slowly and skim
the technical half — if CI is green, most of it is already answered.

---

## Pedagogy

Only a person can judge these. Take them one at a time against the actual
rendered page, not the diff.

### The hook

- [ ] The unit opens with a problem or a situation, **not** a definition.
- [ ] A reader who has never heard the term would keep reading past the first
      paragraph.
- [ ] The term is named only **after** the reader already has the idea.

Test: cover the title and read the first paragraph. Does it make you curious,
or does it feel like a textbook clearing its throat?

### The explanation

- [ ] One new idea per paragraph. If a paragraph introduces two, split it.
- [ ] Every technical term is defined in plain words at first use, in that
      sentence or the next.
- [ ] Analogies come from ordinary life, and they **hold** — an analogy that
      breaks down two sentences later does more damage than none.
- [ ] No sentence survives only because of a comma chain.
- [ ] It passes the "smart fifteen-year-old" bar: not dumbed down, just not
      assuming a degree.

### Formulas

- [ ] Present only where the formula makes the idea _clearer_ than words do.
- [ ] Every one has a plain-English reading directly underneath, saying what it
      means rather than restating the symbols.
- [ ] Nothing in it goes unexplained, including the notation.

Test: delete the formula. If the section reads just as well, delete it for real.

### The three questions

Every unit answers all three, explicitly, somewhere:

- [ ] **Why does this exist?** What breaks without it.
- [ ] **How is it actually used?** Where a reader meets it in practice.
- [ ] **What does it connect to?** Handled by the connections footer.

### Diagrams

- [ ] The `description` prop teaches something. "A diagram of tokenization" is
      not a description; "rare words break into familiar fragments, so the model
      can spell out something it has never seen" is.
- [ ] Nothing is conveyed by colour alone — shape, label, or position carries it
      too.
- [ ] It is worth its space. A diagram restating the paragraph above it should
      go.

### Interactives

- [ ] It teaches **one** clear thing, and you can say what that is in a sentence.
- [ ] Fiddling with it produces a surprise, or confirms something the prose
      claimed. If every setting looks the same, it is decoration.
- [ ] The `lead` tells the reader what to try. Not what the control does — what
      to _look for_.
- [ ] It is honest. A simplification that would have to be unlearned later is
      worse than no instrument.

### Connections

- [ ] Every `why` is a real sentence about the relationship, not a restatement
      of the other unit's title.
- [ ] Prerequisites are genuinely required, not merely related. Anything else
      belongs in `connections`, which carries no ordering meaning.

---

## Technical

**Automated — CI fails if these break. Do not check by hand.**

| Requirement                                          | Enforced by                                           |
| ---------------------------------------------------- | ----------------------------------------------------- |
| Tokens only; no raw colour anywhere but `tokens.css` | `local/no-raw-color` + `scripts/check-raw-colors.mjs` |
| Types are sound                                      | `pnpm check` (`astro check` + `tsc`)                  |
| Formatting                                           | `pnpm format:check`                                   |
| Islands stay within budget                           | `scripts/check-budgets.mjs`                           |
| No detectable a11y violations                        | `@axe-core/playwright`                                |
| Internal links resolve                               | `lychee`                                              |
| Logic behaves                                        | `vitest`                                              |
| Content references point at real units               | Zod `reference()` at build                            |
| Prerequisites form a DAG                             | `assertAcyclic` in the unit route                     |
| Maths renders at build                               | e2e assertion on `.katex`                             |

**Still on you — automation cannot see these.**

- [ ] **Keyboard.** Tab to every control, operate it, and leave. Focus is
      always visible and never trapped. axe cannot check operability.
- [ ] **Reduced motion.** With the OS setting on, animation is _instant_, never
      merely slower.
- [ ] **StaticFallback** is present wherever the interaction needs hover or drag
      precision — and its caption teaches, rather than apologising.
- [ ] **Screen reader sanity.** Labels say what a control does, not what it is.
      "Temperature", not "slider 1".
- [ ] **Logic is in `logic.ts`** and tested, rather than tangled into the view.
- [ ] **No new dependency** without a row in `docs/DEPENDENCIES.md` in the same
      PR.
- [ ] **Zero required props** on interactives — it must work as a bare tag.
- [ ] **No user-facing English inside components.** Copy belongs in MDX; control
      chrome belongs in `src/copy/en.ts`.
- [ ] Checked at a narrow width. Prose and diagrams stay readable on a phone
      even where instruments do not.

---

## When something here is wrong

This file is not sacred. If a rule keeps producing worse writing, change the
rule and say why in the PR — a quality bar nobody believes gets skipped
silently, which is worse than not having one.
