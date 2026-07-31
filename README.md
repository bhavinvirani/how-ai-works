# How AI Actually Works

An open-source site that teaches AI and machine learning from first principles —
plain English, custom diagrams, and hands-on interactive "instruments" you can
poke at until the idea clicks.

**Read it here:** https://bhavinvirani.github.io/how-ai-works

**Sixty lessons, in sixteen parts**, in the order that makes them make sense —
from why some jobs cannot be done by writing rules, through what a neuron
actually computes, to why a model that can write an essay cannot count the
letters in a word.

No maths background needed. No programming needed. Where a lesson has something
extra for developers, it is folded into a box you can ignore.

## What makes it different

Most explanations of AI pick one of two bad options. They wave their hands and
say it is "like a brain", which explains nothing, or they open with notation
that assumes you already know the answer.

Every unit here follows the same shape, and the shape is the teaching:

**Hook → Intuition → See it → Touch it → Where it fits → Checkpoint**

The problem comes before the word for it. The name arrives only once you already
have the idea. Then a diagram, then something you can actually adjust and break —
because reading about a thing and playing with it are not the same kind of
knowing.

The **35 instruments** are the part that took the longest. Each one exists only
because it teaches something the prose and the diagram cannot, and each one ships
a test that pins its pedagogical claim as arithmetic — so a change that quietly
falsifies the surrounding paragraphs fails the build rather than shipping.

## What is here

|                                                                                 |                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| [The lessons](https://bhavinvirani.github.io/how-ai-works/units/why-rules-fail) | 60 units, 16 parts, start at the beginning                   |
| [The map](https://bhavinvirani.github.io/how-ai-works/map)                      | every unit and how they connect, generated from metadata     |
| [Search](https://bhavinvirani.github.io/how-ai-works/search)                    | runs entirely in your browser                                |
| [The gallery](https://bhavinvirani.github.io/how-ai-works/gallery)              | every control and instrument, live — the working style guide |
| [Your progress](https://bhavinvirani.github.io/how-ai-works/progress)           | stored in your browser, never sent anywhere                  |

## Contributing

Yes, please — and there are three ways in, from "fix a sentence in your browser"
to "build a new interactive". Start with **[`CONTRIBUTING.md`](./CONTRIBUTING.md)**.

The shortest version: if you can already phrase the fix, edit the `.mdx` file
directly in GitHub's web UI. It forks the repo and opens the pull request for
you, and you never install anything.

Two things worth knowing before you start:

- **The pedagogy rules are the product, not decoration.** A technically perfect
  pull request with a weak analogy will be asked to change. `docs/QUALITY_BAR.md`
  is the bar, and it is short.
- **CI polices the mechanical rules** — tokens, types, bundle size, accessibility,
  broken links — so human review can go to teaching quality. That is the deal,
  and it is why review here is quick.

## Local development

Requires [Node](https://nodejs.org) 24.16+ (see `.nvmrc`) and
[pnpm](https://pnpm.io) (pinned via `packageManager` — run `corepack enable`).

On Node 20 the install fails with a misleading `node:sqlite` error. That is the
version, not your setup.

```bash
pnpm install
pnpm dev              # dev server
pnpm build            # production build, then the search index
pnpm preview          # serve the built site with the base path applied
```

Everything that must pass before anything merges:

```bash
pnpm check            # astro check + tsc --noEmit
pnpm lint             # eslint, plus the raw-colour check
pnpm test             # vitest — unit and interactive logic
pnpm test:e2e         # playwright smoke + axe, against the built site
pnpm budgets          # island bundle sizes
```

Content changes need a `pnpm build` before pushing: content-collection schema
failures surface at build time, not in dev.

## How it is built

Static [Astro](https://astro.build) with MDX content and React islands,
[Tailwind CSS](https://tailwindcss.com) v4 driven entirely by design tokens,
deployed to GitHub Pages.

No backend, no database, no accounts, no cookies. Fonts and maths typesetting
are self-hosted rather than pulled from a CDN. Progress lives in your own
browser and never leaves it.

One thing does leave: an anonymous visit count, through
[GoatCounter](https://www.goatcounter.com). It sets no cookie and stores nothing
on your device — it records a page path, a referrer, and a coarse browser and
country, with no way to tell one reader from another or to link a visit to
anything you have marked complete.

Lesson prose lives in `src/content/units/**/*.mdx` and nowhere else, so writing
a lesson never means touching React. The sidebar, the connections between units,
and the concept map are all generated from each unit's frontmatter — which is
why a broken link between lessons fails the build instead of shipping.

## Licence

Dual licensed, on purpose:

- **Code** — MIT, see [`LICENSE`](./LICENSE)
- **Content** (lessons, docs, illustrations) — CC BY 4.0, see
  [`LICENSE-content`](./LICENSE-content)

Contributions are inbound = outbound under the same pair, with a DCO sign-off
(`git commit -s`). [`CONTRIBUTING.md`](./CONTRIBUTING.md) explains why that
matters more here than on most repositories.

## Project documents

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — the three ways to contribute
- [`docs/QUALITY_BAR.md`](./docs/QUALITY_BAR.md) — what has to be true before a change ships
- [`docs/CURRICULUM.md`](./docs/CURRICULUM.md) — the unit inventory and the reasoning behind the ordering
- [`docs/DEPENDENCIES.md`](./docs/DEPENDENCIES.md) — the allowlist, and what was rejected
- [`docs/FUTURE.md`](./docs/FUTURE.md) — deferred ideas, and what would have to change to revisit them
- [`docs/HANDOFF.md`](./docs/HANDOFF.md) — current state, version pins that are load-bearing, and the traps that produce a green build that is wrong
- [`PLAN.md`](./PLAN.md) — the full phased plan and the decisions behind it
- [`CLAUDE.md`](./CLAUDE.md) — architecture map and the rules the build follows
