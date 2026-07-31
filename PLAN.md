# Project Plan — "How AI Actually Works" (Open-Source Learning Site)

An open-source, community-maintained website that teaches AI/ML from first principles — plain language, heavy visuals, hands-on interactives — hosted free and static on GitHub Pages.

This plan is written to be executed by Claude Code, phase by phase. A companion `CLAUDE.md` (separate file) should be dropped into the repo root at Phase 0.

---

## 0. Fixed decisions (settled in planning — do not re-litigate)

| Area | Decision |
|---|---|
| Framework | Astro (latest stable) + MDX content + React islands |
| Hosting | GitHub Pages, fully static, zero backend |
| Auth | **None at MVP.** Progress lives in localStorage behind a store interface; manual JSON export/import covers cross-device; a sync layer can be added later without rework |
| Audience | General audience. Plain English, no assumed background. Developer material demoted to optional collapsed asides |
| Dev asides | Language-tabbed code comparisons. Java ships first (from existing artifact), Python second; further languages are contributor-addable per aside |
| Platform | Desktop-first. Prose/diagrams must be readable on mobile; interactives may show a static fallback on small screens |
| Visuals | 2D only at MVP (no three.js). Math notation minimal — KaTeX available, every formula paired with a plain-English reading |
| Design | Carry forward the bench-notes system: sage-paper background, navy ink, magenta + teal accents; Bricolage Grotesque (display), Public Sans (body), JetBrains Mono (code) |
| Repo home | Personal account `bhavinvirani` (no org). Reviewer-vs-merger split enforced via branch protection + CODEOWNERS (§5.5) |
| License | MIT for code, CC BY 4.0 for content (dual license, stated in README + LICENSE files) |
| Language | English only at MVP; structure must not block future i18n. Made concrete: **no user-facing English inside components** — all copy lives in MDX or frontmatter |
| Cost | Free tooling only — GitHub Actions and free OSS services, no paid SaaS |
| Content source | The existing artifact (`reference/how-ai-works.html`) defines topics and coverage; content is **re-taught**, not copied (§2.4) |
| Artifact→component conversion | Contributor's job, supported by scaffolding (§3.4, §5.3) |
| Governance | Solo maintainer (Bhavin) now; collaborators can triage/review/approve; only Bhavin merges; settings/deploys/secrets stay owner-only |

**Repo name** — `how-ai-works` (settled). URL `bhavinvirani.github.io/how-ai-works`, so `base: '/how-ai-works'` (§7).

---

## 1. Architecture & tech stack

### 1.1 Framework: Astro + MDX + React islands — why

- **Content and code are separated.** Every lesson is an `.mdx` file: plain markdown that embeds interactives as tags (`<TokenizerPlayground />`). A prose contributor edits markdown in GitHub's web UI without touching React; an engineer builds components without touching prose. This is the single biggest lever for "easy to contribute."
- **Islands architecture fits a learning site exactly.** Pages ship as static HTML; each interactive hydrates independently only when scrolled into view (`client:visible`). A unit with three interactives loads JS for exactly those three things. Fast on any connection, cheap to host.
- **Content collections give a typed knowledge base.** Each unit's frontmatter (id, part, order, prerequisites, connections) is validated by a Zod schema at build time. Sidebar order, prerequisite links, the connections footer, and the concept map are all *generated* from this metadata — the "connect the dots" requirement becomes data, not hand-maintained links, and a broken reference fails the build instead of shipping.
- **Rejected alternatives:** Docusaurus (free sidebar/search but an opinionated docs skin that fights the bench-notes design); Next.js static export (no islands benefit, all content plumbing hand-built); plain Vite SPA (worst contributor experience for prose).

### 1.2 Styling: Tailwind CSS v4 + design tokens

- Tailwind v4 via `@tailwindcss/vite`, with **every bench-notes token declared in `@theme`** in `src/styles/tokens.css` — colors, type scale, spacing, radii. In v4, `@theme` entries *are* CSS custom properties, so tokens have one source of truth usable from utilities and plain CSS alike.
- Why Tailwind here specifically: contributor prototypes arrive as Claude artifacts, which are written in Tailwind. Conversion becomes "re-map utility colors/spacing to our tokens," not "rewrite all styling." This directly de-risks the artifact→component pipeline.
- Fonts self-hosted via `@fontsource` packages (no external CDN, works offline, no tracking).
- **Hard rule:** no raw hex/rgb values outside `tokens.css`. Enforced by a lint rule (custom ESLint rule or regex check in CI), not just review.

### 1.3 Curated dependency allowlist

| Purpose | Choice | Why |
|---|---|---|
| Cross-island + persisted state | `nanostores` + `@nanostores/persistent` | ~1KB, Astro-idiomatic way to share state between islands; persistent variant wraps localStorage safely |
| Animation | `motion` (Framer Motion's successor); CSS transitions preferred when sufficient | Declarative, well-known to React contributors; CSS-first keeps islands small |
| Visualization | Custom SVG components + d3 micro-packages only (`d3-scale`, `d3-shape`, `d3-array`; `d3-force` if needed) | Pedagogical visuals are bespoke instruments, not dashboards. Chart libraries (Recharts etc.) fight the design system and bloat islands. We import d3's math, never its DOM manipulation |
| Concept map | `@xyflow/react` (React Flow) | Interactive node graph out of the box; used on exactly one page as a lazy island with its own budget |
| Math | `remark-math` + `rehype-katex` | Formulas render at build time — zero client JS for math. **Still ships assets:** `katex.min.css` plus its woff2 fonts, self-hosted and base-path-aware. That, not client-side JS, is the part that breaks under `/how-ai-works/` |
| Search | Pagefind | Static search index generated at build; free, no service. Runs as a **postbuild pass over `dist/`**, ships its own client JS + wasm (so it gets its own entry in `budgets.json`), and needs explicit base-path configuration |
| Diagrams | Hand-authored React SVG components on tokens | Mermaid rejected: generic look breaks design consistency, and our diagrams are teaching illustrations, not box-and-arrow charts |

**Adding any dependency** requires a justification entry in `docs/DEPENDENCIES.md` in the same PR and maintainer approval. This keeps islands small and the artifact-conversion target stable.

### 1.4 Explicitly rejected (and when to revisit)

- **three.js / react-three-fiber** — heavy, GPU/mobile-hostile. Revisit post-MVP for specific units (e.g., embedding space) as lazy-loaded exceptions with their own budget.
- **Storybook** — real maintenance tax for a solo maintainer. A built-in `/gallery` route (§3.4) covers the need for free.
- **Any server or database** — contradicts the zero-infra maintainability constraint. The one future exception (a ~50-line token-exchange worker for optional progress sync) is documented in `docs/FUTURE.md` and out of scope.

### 1.5 Repository layout

```
/
├── .devcontainer/              # Codespaces config — zero-setup contributions (Phase 3)
├── .github/
│   ├── ISSUE_TEMPLATE/         # YAML forms (§5.2) — Phase 3
│   ├── workflows/              # ci.yml, deploy.yml, preview-build.yml, preview-deploy.yml (§6.2)
│   ├── CODEOWNERS              # Phase 3
│   └── pull_request_template.md  # Phase 3
├── docs/
│   ├── CURRICULUM.md           # unit inventory + ordering (Phase 1 output)
│   ├── QUALITY_BAR.md          # pedagogy + technical checklists (§5.4)
│   ├── DEPENDENCIES.md         # allowlist + justifications
│   └── FUTURE.md               # deferred ideas (3D, sync, i18n, mobile interactives)
├── reference/
│   └── how-ai-works.html       # original artifact — content source, excluded from build
├── scripts/
│   ├── new-interactive.mjs     # scaffolding generators (§3.4)
│   ├── new-unit.mjs
│   └── check-budgets.mjs       # island bundle-size gate (§6.1)
├── src/
│   ├── content.config.ts       # Astro 5 collection defs: glob() loader + Zod (§2.1)
│   ├── content/
│   │   └── units/**/*.mdx      # all lesson content
│   ├── components/
│   │   ├── primitives/         # Slider, Toggle, Stepper, RevealButton, Tabs…
│   │   ├── blocks/             # Figure, Aside, DevAside, Checkpoint, ConnectionsFooter…
│   │   ├── diagrams/           # static/animated SVG components
│   │   └── interactives/       # React islands (one folder per interactive)
│   ├── layouts/
│   ├── lib/
│   │   └── progress/           # ProgressStore interface + localStorage impl (§4)
│   ├── pages/                  # index, unit routes, /map, /gallery, /progress, 404
│   └── styles/tokens.css       # THE design token source of truth
├── astro.config.mjs
├── CLAUDE.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md          # Contributor Covenant
├── LICENSE (MIT) + LICENSE-content (CC BY 4.0)
└── README.md
```

---

## 2. Content architecture

### 2.1 Structure: Parts → Units

The curriculum is grouped into Parts (e.g., "Foundations," "How models learn," "Language models," "Using models"), each containing ordered Units. Grouping and order come from frontmatter — the sidebar is generated, never hand-edited.

Collection schema (`src/content.config.ts` — Astro 5 location and loader API):

```ts
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const units = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/units' }),
  schema: z.object({
    id: z.string(),                 // stable slug, referenced by other units
    title: z.string(),
    part: z.enum([...parts]),
    order: z.number(),
    summary: z.string(),            // one plain-English sentence, used on cards & map
    prerequisites: z.array(reference('units')).default([]),
    connections: z.array(z.object({ to: reference('units'), why: z.string() })).default([]),
    interactives: z.array(z.string()).default([]),    // component names used
    status: z.enum(['draft', 'published']).default('draft'),
    updated: z.date(),
  }),
});
```

**`reference('units')`, not `z.string()`** — this is the line that makes §1.1's "a broken reference fails the build instead of shipping" actually true. A plain string array type-checks anything and ships dead links silently.

A separate build-time check rejects **cycles in `prerequisites`**: `/map` and the generated learning order both assume a DAG, and nothing in Zod enforces that.

### 2.2 Unit page anatomy — every unit, same skeleton

1. **Hook** — the real-world problem this concept exists to solve, told as an everyday scenario before the term is ever named.
2. **Intuition** — the plain-language explanation, analogy-first.
3. **See it** — diagram(s).
4. **Touch it** — interactive instrument(s) the learner manipulates.
5. **Where it fits** — connections footer: generated links from frontmatter, each with its hand-written "why" line ("Tokenization feeds embeddings because…").
6. **Checkpoint** — reveal-answer question(s), bench-notes style.

`<DevAside>` blocks may appear anywhere, collapsed by default under a "For developers" label.

### 2.3 Pedagogy rules — the "good teacher" pass

These are binding rules for all prose, enforced through review against `docs/QUALITY_BAR.md`:

- **Experience before terminology.** Describe the problem or behavior first; name the term after the reader already gets it.
- **One new idea per paragraph.** Short sentences. If a sentence needs a comma-chain to survive, split it.
- **No unexplained jargon, ever.** First use of any technical term includes a plain definition inline, in the same sentence or the next.
- **Analogies from everyday life**, tested against an "explain it to a smart 15-year-old" bar.
- **Every unit must answer three questions:** why does this exist, how is it actually used, and what does it connect to.
- **Formulas only when they add intuition**, always with a spoken-English translation directly underneath ("in words: how similar two things are, ignoring how big they are").

### 2.4 Porting the existing artifact (re-teach, don't copy)

`reference/how-ai-works.html` is the source of truth for *topics and coverage* — not for prose. Per unit:

1. Extract the topic, key points, and what its current diagram/interactive teaches.
2. Rewrite the prose from scratch per §2.3 — this is a re-teach by a better teacher, not a copy-paste.
3. Redesign the diagram as a token-based SVG component (upgrade it, don't just port it).
4. Rebuild the interactive against the contract in §3.3 — and improve it where the single-file constraint previously limited it.
5. Add connections metadata + a checkpoint.

**First content task (Phase 1):** Claude Code reads the HTML file and produces `docs/CURRICULUM.md` — the full unit inventory with proposed Part grouping and order — for Bhavin's sign-off *before* mass porting begins.

### 2.5 Concept map

`/map` route: nodes = units, edges = prerequisite + connection metadata, colored by Part, click-through to units. Built with React Flow as a lazy island, generated entirely from the content collection at build time. This page is the visual answer to "how does everything connect."

---

## 3. Component system

### 3.1 Design tokens — single source of truth

`src/styles/tokens.css` declares everything in Tailwind v4 `@theme`: `--color-paper` (sage), `--color-ink` (navy), `--color-accent` (magenta), `--color-accent-2` (teal), semantic state colors, the type scale (Bricolage Grotesque display / Public Sans body / JetBrains Mono code), spacing, and radii. Diagrams, interactives, and prose all consume tokens — visual consistency is by construction, not by review vigilance.

### 3.2 Component tiers

1. **UI primitives** — `Slider`, `Toggle`, `SegmentedControl`, `Stepper`, `RevealButton`, `Tabs`. Every interactive must compose these instead of rolling its own controls; this is how fifty interactives from thirty contributors still look like one product.
2. **Content blocks** — `Figure`, `Aside`, `DevAside`, `Checkpoint`, `ConnectionsFooter`, `UnitProgress`. Used directly in MDX.
3. **Diagrams** — static or CSS-animated SVG components; no hydration unless genuinely needed. **Binding diagram contract:** every diagram carries an accessible name *and* a plain-English description of what it teaches — enforced by making `description` a **required** prop on `Figure`, so it cannot be skipped; purely decorative SVG is `aria-hidden`; no meaning is ever carried by color alone. Automated axe checks will not flag an unlabeled `<svg>` full of `<path>` elements, so on a site this visual the gate has to be structural, not automated.
4. **Interactives** — React islands, always wrapped in `InstrumentPanel`.

### 3.3 The interactive contract (binding; mirrored in QUALITY_BAR.md and CI)

- Wrapped in `<InstrumentPanel title lead>` — standard chrome, title, one-line "what to try," and a reset button.
- All props typed and defaulted; **zero required props** (must work as a bare tag in MDX).
- **No network calls.** Deterministic behavior; any randomness is seedable.
- Hydration directive `client:visible` unless justified.
- **Bundle budget: ≤ 75 KB gzipped per island** beyond shared chunks (React runtime). The React Flow map island gets its own ≤ 160 KB budget and exists only on `/map`. Budgets live in `scripts/budgets.json`; CI fails on breach.
- Keyboard operable, controls labeled, passes automated axe checks.
- **Respects `prefers-reduced-motion`** — `motion` and CSS animations degrade to instant state changes, never to slow ones. Motion is central to this design system, which is exactly why the opt-out has to be a contract term.
- Desktop-first: below the `md` breakpoint an interactive may render a `<StaticFallback>` (captioned figure) — *required* whenever the interaction depends on hover or drag precision.
- Logic separated from view: pure functions in a `logic.ts` next to the component, unit-tested with Vitest.

### 3.4 Scaffolding & the gallery

- `pnpm new:interactive <Name>` — generates the component folder from a template (InstrumentPanel wiring, `logic.ts`, test stub) and registers a demo entry.
- `pnpm new:unit <id>` — generates an MDX skeleton with the §2.2 anatomy pre-scaffolded.
- `/gallery` route — lists every interactive live with its knobs. Serves triple duty: living style guide, review surface for PRs (via preview deploys), and free Storybook replacement.

### 3.5 DevAside spec (multi-language)

```mdx
<DevAside>
  <Lang name="java">{/* code + comparison prose */}</Lang>
  <Lang name="python">{/* … */}</Lang>
</DevAside>
```

Renders tabs only for the languages actually provided — no language is mandatory, so asides never block on translation parity. Java ships first (existing content), Python is the priority second tab; contributors add languages by adding a `<Lang>` block. The reader's tab choice is remembered globally via a nanostore.

---

## 4. Progress tracking (no backend, by design)

```ts
interface ProgressStore {
  getUnit(id: string): UnitProgress | null;
  setUnitComplete(id: string): void;
  saveCheckpoint(id: string, result: CheckpointResult): void;
  exportJSON(): string;
  importJSON(payload: string): ImportResult;
  clearAll(): void;
}
```

- Implementation: `LocalStorageProgressStore` built on `@nanostores/persistent`.
- Payload is versioned (`{ v: 1, ... }`) with a migration hook, so the schema can evolve without nuking anyone's progress.
- `/progress` page: per-part completion overview + **Export / Import JSON buttons** — cross-device transfer with zero servers, and a clear banner stating that nothing ever leaves the browser.
- Future sync (GitHub Gist + tiny token-exchange worker) slots in as a second `ProgressStore` implementation behind the same interface — documented in `docs/FUTURE.md`, explicitly out of scope now.

---

## 5. Contribution & governance

> **Timing: all of §5 is Phase 3 work** (§8.0). Phases 0–2 are a solo build. The two exceptions are `docs/QUALITY_BAR.md` (§5.4) and `docs/DEPENDENCIES.md` (§1.3), which are the maintainer's own gates during the port and land in Phase 1.

### 5.1 Three contribution tracks (CONTRIBUTING.md leads with these)

- **Track A — improve the words.** Typo, clearer sentence, better analogy: edit the `.mdx` file in GitHub's web UI; GitHub creates the fork + PR automatically. Zero local setup. For anything bigger, one click opens the repo in Codespaces via the devcontainer (free tier) — still zero local setup.
- **Track B — improve a diagram.** Replace or add an SVG component in `src/components/diagrams/`, tokens only.
- **Track C — new or better interactive.** The pipeline in §5.3.

### 5.2 Issue & PR templates (`.github/`, YAML issue forms)

- `content-fix.yml` — which unit, what's unclear/wrong, suggested wording.
- `concept-proposal.yml` — proposing a new unit: concept, why it belongs, where it connects.
- `interactive-proposal.yml` — **Claude artifact link required**, plus: target unit, the one thing a learner should understand after using it, libraries used in the prototype, and "I want to implement this myself: yes/no."
- `bug.yml` — standard.
- PR template = the QUALITY_BAR checklist inlined, split by pedagogy / technical.

### 5.3 Interactive pipeline: Claude artifact → merged component

1. Contributor opens an `interactive-proposal` issue with the artifact link.
2. Maintainer reviews the *idea* (teaching value, fit, feasibility) and applies the `approved-to-build` label. Cheap gate — no code has been written yet.
3. Contributor scaffolds with `pnpm new:interactive`, then converts: Tailwind utilities → tokens, dependencies → allowlist only, contract §3.3 satisfied. CONTRIBUTING.md contains a dedicated "Converting a Claude artifact" checklist for exactly this step.
4. PR → CI runs all gates → preview deploy comment appears with a live URL.
5. Review against `docs/QUALITY_BAR.md` (human review focuses on teaching quality; CI already policed the mechanical rules).
6. Squash-merge by Bhavin.

### 5.4 Quality bar (`docs/QUALITY_BAR.md`)

Two checklists. **Pedagogy:** hook before terminology; plain-language pass (§2.3); connections written; checkpoint present; the interactive teaches one clear thing. **Technical:** tokens only; allowlist deps; budget passes; axe passes; keyboard operable; tests for logic; StaticFallback where required. Everything on the technical list that *can* be automated *is* automated (§6), so human review time — the scarcest resource in this project — goes to teaching quality.

### 5.5 Permissions — solo now, expandable later

- **Branch protection on `main` — solo configuration (Phase 3; Phases 0–2 run with required status checks only, §8.0):** require a PR before merging with **0 required approvals**; require all status checks; no force pushes; no direct pushes (admins included — Bhavin goes through PRs too, which keeps the pipeline honest).
  **Do not enable "require review from Code Owners" while Bhavin is the only owner.** GitHub forbids approving your own PR, so `* @bhavinvirani` + a review requirement makes every PR Bhavin opens unmergeable by the only person allowed to merge it — a self-inflicted deadlock on day one. (Dependabot PRs are unaffected: he isn't the author, so he can approve them.)
- **Branch protection — collaborator configuration (flip the day someone gets Write):** add require ≥1 approving review + require review from Code Owners. A settings change, not a rework.
- **CODEOWNERS:** `* @bhavinvirani` from day one — it auto-requests review immediately and sits inert until the requirement above is switched on.
- **Inbound licensing:** CONTRIBUTING.md states inbound = outbound (code MIT, content CC BY 4.0) and carries a DCO line signed off with `git commit -s`. This matters more here than on a typical repo because §5.3 actively invites contributors to bring Claude artifacts whose provenance the maintainer cannot inspect.
- **Trusted collaborators** get the Write role: they can label, triage, review, and approve — but the Code Owners requirement means nothing merges without Bhavin. This is exactly the "others can review and manage, sensitive things stay with me" split, on a personal repo, no org needed.
- **Owner-only forever:** repo settings, Pages configuration, secrets, releases (inherent to personal-repo ownership).
- **Scaling later:** `MAINTAINERS.md` + path-scoped CODEOWNERS (e.g., a content maintainer owns `src/content/**`) — documented now, activated only when a real maintainer appears.
- `CODE_OF_CONDUCT.md` (Contributor Covenant) and a minimal `SECURITY.md` from day one.

---

## 6. CI/CD & guardrails (all free, GitHub Actions only)

### 6.1 `ci.yml` — every PR and every push to main

Jobs (pnpm-cached, concurrency-cancelled, actions pinned to SHAs):

1. **Lint + format** — ESLint flat config (`eslint-plugin-astro`, `typescript-eslint`, `eslint-plugin-jsx-a11y`, custom no-raw-color rule) + Prettier check (`prettier-plugin-astro`).
2. **Typecheck** — `astro check` (templates + generated content types) plus `tsc --noEmit` scoped to `scripts/` and other non-Astro TS, which `astro check` does not cover. Running both unscoped is near-redundant.
3. **Unit tests** — Vitest + React Testing Library on interactive logic and progress store.
4. **Build** — `astro build`; content-collection schema violations (a `reference()` pointing at a nonexistent unit, missing frontmatter, a prerequisite cycle) fail here. A post-build assertion then walks **every `status: published` unit** and fails if it did not render, or if a name in its `interactives[]` does not resolve to a real component. Playwright's fixed five-route list covers a shrinking fraction of the site as each Part lands; this scales with the content.
5. **E2E smoke + a11y** — Playwright against the built site: home, one unit, `/map`, `/gallery`, `/progress`; `@axe-core/playwright` assertions on each.
6. **Links** — lychee on `dist/` (internal + external, external soft-fail).
7. **Budgets** — `scripts/check-budgets.mjs` gzips island chunks and compares against `budgets.json`. "Beyond shared chunks" means reading Vite's build manifest to map hashed chunk names back to islands and subtract the shared React chunk; Pagefind's client bundle gets its own entry. **This job lands in Phase 1 alongside the first island, not in Phase 0** — before then there is nothing to measure and the manifest-parsing work has no payoff.

This exceeds the `Scheduler` repo baseline on every axis: strict types, tests, a11y gates, size budgets, protected releases.

### 6.2 Deploy + PR previews

- Pages serves the `gh-pages` **branch**. Main deploys publish `dist/` to the branch root via `peaceiris/actions-gh-pages` with the keep-files pattern.
- **Deliberate departure from the `Scheduler` repo**, which deploys via `actions/deploy-pages` with Pages source = GitHub Actions. That mode cannot host `/pr-preview/<n>/` alongside the live site. Previews are the entire reason for the branch — don't "fix" this back later.
- **PR previews must survive fork PRs, and by default they don't.** A `pull_request` event from a fork gets a read-only `GITHUB_TOKEN`, so a single-workflow `rossjrw/pr-preview-action` cannot push to `gh-pages`. Track A (§5.1) produces *exactly* these PRs — GitHub's web editor always forks first — so the naive setup fails for every external contributor while working fine for the maintainer. Previews therefore split in two:
  1. `preview-build.yml` — `on: pull_request`, read-only token, builds `dist/` and uploads it as a workflow artifact.
  2. `preview-deploy.yml` — `on: workflow_run` (completed), runs in the base-repo context with a write token, downloads that artifact, publishes to `/pr-preview/<n>/`, and posts the sticky comment.

  `pull_request_target` is the alternative and is a footgun: under it, never check out or execute PR head code. Prefer the `workflow_run` split.

  Build this split in Phase 0 — it costs the same as the naive version and avoids a rewrite — but note that Phases 0–2 only ever exercise the same-repo path. **The fork path is unverified until someone actually tests it from a second account, which is a Phase 3 acceptance criterion (§8.0).**
- **One writer at a time on `gh-pages`.** Main deploys and preview deploys both push to the same branch; two concurrent runs mean one force-push silently clobbers the other. Every workflow that writes the branch shares `concurrency: { group: gh-pages-write, cancel-in-progress: false }`. The keep-files pattern alone does **not** prevent this — it solves a different problem (overwriting the tree, not racing on it).

### 6.3 Hygiene

Dependabot weekly (grouped updates); CodeQL default setup (free for public repos); `concurrency` groups to cancel superseded runs.

### 6.4 Deliberate non-goals

No paid visual-regression SaaS at MVP. The `/gallery` route + preview URLs are the visual review surface. Revisit an OSS option (e.g., Lost Pixel) only if visual regressions actually start slipping through.

---

## 7. GitHub Pages deployment details

- Public repo; Pages source = `gh-pages` branch.
- `astro.config.mjs`: `site: 'https://bhavinvirani.github.io/how-ai-works'`, `base: '/how-ai-works'`.
- **The classic Pages footgun is the base path.** All internal links and asset references go through Astro's base-aware helpers; a lint check forbids hardcoded root-absolute internal links. The Playwright smoke suite runs against the built output with the base path applied, so a broken link ships red, not live.
- Third-party assets are subject to the same base path — specifically **KaTeX's CSS + woff2 fonts** and **Pagefind's index + client bundle**. These are the two that will 404 under `/how-ai-works/` while looking perfect in dev.
- `404.html` emitted; sitemap via `@astrojs/sitemap`.
- Custom domain later = add CNAME, set `base: '/'` — a two-line change.

---

## 8. Phased roadmap (each phase ends mergeable and live)

### 8.0 Sequencing rule — the application gets built first

Everything contributor-facing is deferred wholesale to Phase 3: branch protection beyond required status checks, CODEOWNERS, issue forms, CONTRIBUTING, Code of Conduct, SECURITY.md, devcontainer/Codespaces, and the fork-preview verification. **Phases 0–2 are a solo build on a public repo.**

Why: none of that machinery can be validated without a second person, and every hour spent on it before the site teaches anything is an hour not spent teaching. What *is* kept from day one is only the shape that would be expensive to retrofit — the workflow split in §6.2, the licence pair, and the metadata schema — not the process wrapped around it.

Two things stay early despite living in §5: `docs/QUALITY_BAR.md` and `docs/DEPENDENCIES.md`. Those are the maintainer's own gates during the port, not contributor onboarding, and they land in Phase 1.

### Phase 0 — Foundation (target: shell live on Pages)
Scaffold Astro + TypeScript strict + Tailwind v4 + tokens.css with the full bench-notes token set and self-hosted fonts (KaTeX's CSS + woff2 included); pin pnpm via `packageManager` in `package.json`; wire ESLint/Prettier/Vitest/Playwright; workflows `ci`, `deploy`, `preview-build`, `preview-deploy` green — built in their **final split form** now (§6.2) so they never need rewriting, even though only the same-repo path gets exercised until Phase 3; base layout rendering fonts + palette on a placeholder home page; LICENSE pair + minimal README. Budgets are deliberately **not** in this phase (§6.1), and neither is anything contributor-facing (§8.0).
**Accept when:** push to main auto-deploys to the Pages URL with tokens/fonts visibly applied; all CI jobs run on a PR; a preview URL appears on a PR from a branch in the repo.
**Manual steps for Bhavin:** create repo `how-ai-works` + enable Pages (gh-pages branch); export the artifact to `reference/how-ai-works.html` **by hand** — the public share URL serves a JS shell and cannot be fetched by an agent; once CI is green, turn on *require status checks to pass* on `main` (nothing else from §5.5 — zero friction solo, and it stops a red build from merging).

### Phase 1 — Component system + pilot unit
Build primitives and blocks (InstrumentPanel, Slider/Toggle/Stepper/RevealButton/Tabs, Figure **with its required `description` prop** per §3.2, Aside, DevAside with language tabs, Checkpoint, ConnectionsFooter); ProgressStore + `/progress` page with export/import; content collection schema + the prerequisite-cycle check; generator scripts; `scripts/check-budgets.mjs` + `budgets.json` (§6.1, deferred from Phase 0); `/gallery`. `docs/QUALITY_BAR.md` and `docs/DEPENDENCIES.md` land here too — they're the maintainer's own checklists during the port, not contributor onboarding (§8.0). Produce `docs/CURRICULUM.md` from the reference HTML for sign-off. Then port **one pilot unit end-to-end** (suggest Tokenization — self-contained, strong interactive potential) with re-taught prose, an upgraded diagram, a rebuilt interactive, connections, and a checkpoint.
**Accept when:** pilot unit is live and reads/works noticeably better than the artifact version; progress persists across reload and survives export→clear→import; budget + axe gates enforce on the pilot's island; `pnpm new:interactive Demo` yields a compiling, gallery-registered component.

### Phase 2 — Full curriculum port (sliced, not one phase)

"Port everything" is not a phase — as one unit of work it breaks §8's own promise that every phase ends mergeable and live, and it has no bounded size until CURRICULUM.md exists. The signed-off Part grouping defines the slices:

- **2a … 2n — one slice per Part.** Port that Part's units per §2.4, upgrading diagrams and interactives as they go. *Accept when:* every unit in the Part is `status: published`, meets the quality bar, and all its connections resolve.
- **2-nav — generated navigation.** Sidebar + connections footers driven by frontmatter. Lands after the first Part, not after the last — it's what makes each subsequent Part self-integrating.
- **2-meta — site plumbing.** `/map`, Pagefind search, sitemap, 404. This is metadata-only work: it depends on the *schema*, not the unit count, so it can land early and grow as Parts arrive.

**Accept when (phase overall):** every artifact topic exists as a published unit meeting the quality bar; the concept map renders all units/edges from metadata; search returns unit content; CI fully green.

### Phase 3 — Community launch kit (all contributor-facing work, in one phase)

Nothing here is attempted before the site is worth contributing to (§8.0).

CONTRIBUTING.md (three tracks + artifact-conversion checklist + the inbound-licensing/DCO line from §5.5); `docs/FUTURE.md`; all issue forms + PR template; CODE_OF_CONDUCT.md + SECURITY.md; devcontainer + Codespaces enabled; MAINTAINERS.md (dormant); branch protection moved up to the full **solo configuration** in §5.5 and CODEOWNERS added; **fork-preview verification** — open a PR from a real fork on a second account and confirm the `workflow_run` split posts a live preview URL (§6.2), which is the one path Phases 0–2 never exercise; seed the public roadmap as milestones + good-first-issues (including "add Python tabs to unit X" — perfect first contributions); README made properly public-facing.

**Accept when:** a stranger can go from "found the repo" to "opened a correct Track A PR" using only the docs, and that PR gets both CI and a working preview URL; an interactive-proposal issue can walk the whole §5.3 pipeline.

### Phase 4 — Future (documented in FUTURE.md, not built now)
Remaining Python/other language tabs; new units beyond the artifact; 3D exceptions (lazy three.js); mobile-optimized interactives; i18n; optional Gist progress sync (+ token-exchange worker); OG image generation; visual regression tooling if needed.

---

## 9. Working notes for Claude Code

- Execute phase by phase; keep PRs scoped to one logical chunk even while solo — it exercises the exact pipeline contributors will use.
- From Phase 0 onward, CI is the gate: nothing merges red.
- The first *content* deliverable is `docs/CURRICULUM.md`, not ported units — get the inventory signed off before mass porting (§2.4).
- When re-teaching prose, apply §2.3 as a checklist per section, and prefer rewriting a weak analogy over decorating it.
- Use latest stable versions of everything at implementation time; this plan names tools, not version pins. Where this plan and the current API disagree, the current API wins — §2.1 has already been corrected once for Astro 5's `src/content.config.ts` + loader form.
- **Verify the preview pipeline from a real fork before trusting it** (§6.2). A PR from a branch inside the repo exercises a different token than a contributor PR and will pass green while the contributor path is completely broken.
- `reference/how-ai-works.html` has to be exported from the artifact by hand — the public share URL serves a JS shell with no content, so no agent can fetch the curriculum source for you.
