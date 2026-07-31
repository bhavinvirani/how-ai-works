# CLAUDE.md

## What this is

An open-source static website that teaches AI/ML from first principles to a general audience — plain English, custom SVG diagrams, hands-on interactive "instruments." Astro + MDX content + React islands, deployed to GitHub Pages. No backend, no auth, no database at MVP — by design. Full plan: `PLAN.md`.

**Current stage: solo build (Phases 0–2).** Everything contributor-facing — CONTRIBUTING.md, issue forms, PR template, CODE_OF_CONDUCT, SECURITY.md, devcontainer/Codespaces, CODEOWNERS, fork-preview verification — is deliberately deferred to Phase 3 (`PLAN.md` §8.0). Don't build it early, and don't treat its absence as a gap. The exceptions that land in Phase 1 are `docs/QUALITY_BAR.md` and `docs/DEPENDENCIES.md`, which are gates for the build itself.

## Commands

```
pnpm dev              # local dev server
pnpm build            # astro build (schema violations fail here)
pnpm preview          # serve built output (base-path applied)
pnpm check            # astro check + tsc --noEmit
pnpm lint / lint:fix  # eslint (flat config)
pnpm format           # prettier
pnpm test             # vitest (interactive logic, progress store)
pnpm test:e2e         # playwright smoke + axe against built site
pnpm budgets          # island bundle-size check vs scripts/budgets.json
pnpm new:interactive <Name>   # scaffold an interactive island
pnpm new:unit <id>            # scaffold a unit MDX skeleton
```

## Architecture map

- `src/content/units/**/*.mdx` — all lesson content. Prose lives here and ONLY here.
- `src/content.config.ts` — Astro 5 collection: `glob()` loader + Zod schema (id, part, order, summary, prerequisites[], connections[{to, why}], interactives[], status, updated). `prerequisites` and `connections[].to` use `reference('units')`, **never `z.string()`** — that's what makes a broken link fail the build. Sidebar, connections footers, and `/map` are generated from this metadata.
- `src/styles/tokens.css` — THE design token source (Tailwind v4 `@theme`): sage paper bg, navy ink, magenta + teal accents; Bricolage Grotesque / Public Sans / JetBrains Mono (self-hosted via @fontsource).
- `src/components/primitives/` — Slider, Toggle, SegmentedControl, Stepper, RevealButton, Tabs. Interactives must compose these.
- `src/components/blocks/` — Figure, Aside, DevAside, Checkpoint, ConnectionsFooter, UnitProgress (used in MDX).
- `src/components/diagrams/` — SVG diagram components, static or CSS-animated, no hydration unless necessary.
- `src/components/interactives/<Name>/` — React islands: `index.tsx` (view) + `logic.ts` (pure, tested) + `logic.test.ts`.
- `src/lib/progress/` — ProgressStore interface + LocalStorageProgressStore (@nanostores/persistent, versioned payload).
- `reference/how-ai-works.html` — the original artifact; source of truth for topic coverage, NOT for prose. Excluded from build.

## Hard rules

1. **Tokens only.** No raw hex/rgb outside `src/styles/tokens.css`. Lint-enforced.
2. **Dependency allowlist.** nanostores, motion, d3 micro-packages (scale/shape/array/force), @xyflow/react (map island only), remark-math + rehype-katex, Pagefind. Adding anything requires a justification entry in `docs/DEPENDENCIES.md` in the same PR.
3. **Interactive contract:** wrapped in `<InstrumentPanel>`; zero required props; no network calls; deterministic (seedable randomness); `client:visible`; ≤ 75 KB gz per island beyond shared chunks (map island ≤ 160 KB); keyboard operable + labeled + axe-clean; respects `prefers-reduced-motion` (animations degrade to instant state changes, never slow ones); logic in `logic.ts` with unit tests; `<StaticFallback>` below `md` breakpoint whenever the interaction needs hover/drag precision. Desktop-first, but prose/diagrams must remain readable on mobile.
4. **Content is re-taught, never copied** from the reference HTML. Pedagogy rules: experience before terminology; one new idea per paragraph; no unexplained jargon (first use = inline plain definition); everyday analogies; every unit answers why it exists / how it's used / what it connects to; formulas only when they add intuition, always with a plain-English reading underneath.
5. **Unit anatomy (fixed skeleton):** Hook → Intuition → See it (diagram) → Touch it (interactive) → Where it fits (connections) → Checkpoint. DevAsides optional, collapsed by default.
6. **DevAside languages:** `<DevAside><Lang name="java">…</Lang><Lang name="python">…</Lang></DevAside>` — tabs render only for provided languages; Java first, Python second; no language is mandatory.
7. **Base-path safety.** Site deploys under `/how-ai-works/`. All internal links/assets go through base-aware helpers; never hardcode root-absolute internal paths. This applies to third-party assets too — KaTeX's CSS/fonts and Pagefind's index are the two that 404 in production while looking perfect in dev.
8. **Never add at MVP:** a backend, auth, server-side storage, chart libraries, Mermaid, three.js. `docs/FUTURE.md` holds the revisit list — including the one documented backend exception (a ~50-line token-exchange worker for optional progress sync), which is out of scope now, not forbidden forever.
9. **Diagram contract.** Every diagram carries an accessible name *and* a plain-English description of what it teaches — `Figure`'s `description` prop is required so it can't be skipped. Decorative-only SVG is `aria-hidden`. Never carry meaning by color alone. axe cannot catch any of this; it's on review.
10. **No user-facing English inside components.** All copy lives in MDX or frontmatter — the only thing keeping future i18n cheap.

## Definition of done (every PR)

- `pnpm check`, `lint`, `test`, `build`, `test:e2e`, `budgets` all pass locally.
- New/changed interactives visible and correct in `/gallery`.
- Content changes meet `docs/QUALITY_BAR.md` (pedagogy checklist).
- No new dependency without a `DEPENDENCIES.md` entry.
- Scoped PR with a clear description; squash-merge. Phases 0–2 are a **solo build**: `main` requires status checks to pass, nothing more. Full protection (require-PR, 0 approvals) lands in Phase 3, and Code Owner review stays **off** until a second collaborator exists — GitHub forbids self-approval, so enabling it solo deadlocks every maintainer PR. Work on branches and merge through PRs by habit regardless; it keeps the pipeline honest.

## Gotchas

- GitHub Pages base path breaks naive absolute links — always preview with `pnpm preview` and rely on the e2e suite, which runs against the built, base-path-applied output.
- `gh-pages` branch holds deployments AND `/pr-preview/<n>/` directories; main deploys must use the keep-files pattern (`peaceiris/actions-gh-pages` + `rossjrw/pr-preview-action` conventions) or previews get wiped. Keep-files is not sufficient on its own: **every** workflow writing `gh-pages` shares `concurrency: { group: gh-pages-write, cancel-in-progress: false }`, or a merge landing mid-preview force-pushes over it.
- Preview deploys are split in two: `preview-build.yml` (`on: pull_request`, read-only, uploads `dist/` as an artifact) and `preview-deploy.yml` (`on: workflow_run`, write token, publishes + comments). Fork PRs get a read-only token, so a single-workflow preview fails silently for every external contributor — which is all of them, since GitHub's web editor always forks first. Under `pull_request_target`, never check out or execute PR head code.
- KaTeX renders at build time (rehype) — never import KaTeX client-side. Its `katex.min.css` and woff2 fonts still ship, self-hosted and base-path-aware; that's the part that actually breaks in production.
- pnpm is pinned via `packageManager` in `package.json`; CI and the devcontainer both read it. Don't reach for npm here.
- Islands hydrate `client:visible`; if an interactive must be interactive immediately above the fold, justify `client:load` in the PR.
- Content collection schema failures surface at `astro build`, not in dev — run a build before pushing content changes.
