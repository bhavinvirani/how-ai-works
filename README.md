# How AI Actually Works

An open-source site that teaches AI and machine learning from first principles —
plain English, custom diagrams, and hands-on interactive "instruments" you can
poke at until the idea clicks.

**Live site:** https://bhavinvirani.github.io/how-ai-works

> **Status: early.** The foundation is in place — build pipeline, design system,
> and deployment — but the curriculum is not written yet. There is nothing to
> learn here today.

## Local development

Requires [Node](https://nodejs.org) 24.16+ (see `.nvmrc`) and
[pnpm](https://pnpm.io) (pinned via `packageManager` — run `corepack enable`).

```bash
pnpm install
pnpm dev              # dev server
pnpm build            # production build
pnpm preview          # serve the built site with the base path applied
```

Checks that must pass before anything merges:

```bash
pnpm check            # astro check + tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest unit tests
pnpm test:e2e         # playwright smoke + axe against the built site
```

## How it is built

Static [Astro](https://astro.build) with MDX content and React islands,
[Tailwind CSS](https://tailwindcss.com) v4 driven entirely by design tokens,
deployed to GitHub Pages. No backend, no database, no accounts — progress is
stored in your own browser and never leaves it.

Lesson prose lives in `src/content/units/**/*.mdx` and nowhere else, so writing
a lesson never means touching React.

## Contributing

Contributor documentation, issue templates, and a code of conduct are coming
once the site has enough content to be worth contributing to. Until then,
please open an issue before starting work.

## License

Dual licensed, on purpose:

- **Code** — MIT, see [`LICENSE`](./LICENSE)
- **Content** (lessons, docs, illustrations) — CC BY 4.0, see
  [`LICENSE-content`](./LICENSE-content)

## Project documents

- [`PLAN.md`](./PLAN.md) — the full phased plan and the decisions behind it
- [`CLAUDE.md`](./CLAUDE.md) — architecture map and the rules the build follows
