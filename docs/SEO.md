# Discovery: metadata, brand marks, and the visit count

What a machine sees when it arrives — a crawler, a link unfurler, a browser
deciding what to draw in the tab. All of it is generated; none of it is
hand-maintained per page.

`CLAUDE.md` says the rules and `HANDOFF.md` says what is true right now. This
says how one particular corner works, and — more usefully — which parts of it do
nothing and why they are here anyway.

---

## Where everything lives

| Thing                            | File                                    |
| -------------------------------- | --------------------------------------- |
| Site identity, one source        | `src/seo/site.ts`                       |
| The `<head>` tags                | `src/components/seo/SeoHead.astro`      |
| Title / canonical / robots rules | `src/lib/seo/meta.ts` (unit-tested)     |
| JSON-LD builders                 | `src/lib/seo/schema.ts` (unit-tested)   |
| Sitemap filtering and `lastmod`  | `scripts/sitemap.mjs`                   |
| The icon and card **design**     | `scripts/brand.mjs`                     |
| Rasterising them                 | `scripts/make-icons.mjs` (`pnpm icons`) |
| The gate over all of it          | `tests/e2e/seo.spec.ts`                 |

Generated into `public/` and committed: `favicon.svg`, `favicon.ico`,
`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png`, `og.png`, `site.webmanifest`, `robots.txt`.
**Do not hand-edit any of them** — run `pnpm icons`.

---

## Which pages are indexable

Indexed: the home page, `/map`, and all sixty lessons.

`noindex`: `/gallery` (a style guide competing with lessons for the same
words), `/search` (no content without a query), `/progress` (permanently empty
to a crawler), and `/404` — which matters more than it looks, because GitHub
Pages serves `404.html` with a **200**, so without the tag it is an indexable
soft-404.

That set is declared twice and the two must agree: in each page's `seo:` prop or
frontmatter, and in `NOINDEXED` in `scripts/sitemap.mjs`. A page listed in the
sitemap that then answers `noindex` is a contradiction Search Console reports
against the whole site. `tests/e2e/seo.spec.ts` checks both halves.

## PR previews are not indexable

Previews publish to `/how-ai-works/pr-preview/<n>/` — the **same origin** as the
live site. Without intervention every open pull request is a complete crawlable
duplicate of all sixty-six pages.

A preview build (`BASE_PATH` set) therefore emits `noindex, nofollow`
site-wide, no canonical, and no sitemap. One switch, checked in
`SeoHead.astro` and `astro.config.mjs`, so the two cannot drift.

---

## robots.txt does nothing here, on purpose

`public/robots.txt` is served from `bhavinvirani.github.io/how-ai-works/robots.txt`.
**Crawlers do not read that.** robots.txt is only honoured at the origin root —
`bhavinvirani.github.io/robots.txt` — which belongs to a `bhavinvirani.github.io`
repository that does not exist (it currently answers 404).

So the file is inert. It ships because it is conventional, costs nothing, and
becomes authoritative the day a custom domain points here. What actually governs
indexing is the per-page `<meta name="robots">`, which needs no cooperation from
the origin.

If you ever want origin-level control, create a `bhavinvirani.github.io`
repository with a `robots.txt` at its root.

---

## Search Console

The sitemap cannot be discovered through robots.txt (see above), so it has to be
submitted by hand — once.

1. Search Console → **Add property** → **URL prefix** →
   `https://bhavinvirani.github.io/how-ai-works/`
2. Choose the **HTML tag** verification method and copy the `content` value.
3. Paste it into `verification.google` in `src/seo/site.ts` and deploy. An empty
   string renders no tag at all, which is deliberate — a placeholder would look
   configured and verify nothing.
4. Verify, then **Sitemaps** → submit `sitemap-index.xml`.

`verification.bing` works the same way for Bing Webmaster Tools.

A URL-prefix property only covers the subpath, which is correct here: the rest
of `bhavinvirani.github.io` is somebody else's problem.

---

## The visit count

GoatCounter, cookieless: it records a page path, a referrer, and a coarse
browser and country, and stores nothing on the reader's device.

**It is gated on an environment variable that only `deploy.yml` sets:**

```yaml
- run: pnpm build
  env:
    ENABLE_ANALYTICS: '1'
```

Not `import.meta.env.PROD`, which is also true for the build the e2e suite runs
against — that version puts a third-party request into every CI run on every
push, and `smoke.spec.ts` fails the build on any response ≥ 400, which would
hand GoatCounter's uptime a veto over ours.

The cost of that choice is that one unset variable silently disables the
counter forever. So:

**After any change to `deploy.yml` or `BaseLayout.astro`, check the count is
still recording** at <https://bhavinvirani01.goatcounter.com>. To confirm the
tag ships without deploying:

```
ENABLE_ANALYTICS=1 pnpm exec astro build && grep -c goatcounter dist/index.html
```

`tests/e2e/seo.spec.ts` asserts the script is **absent** from a normal build,
which is the half that can be automated.

Because the site counts visits, `/progress` and the README say so. If analytics
is ever removed, `ui.progress.page.privacyAnalytics` and the README's
"How it is built" section have to change back.

---

## Changing the brand marks

Everything — tab icon, home-screen icon, social card — comes from one glyph in
`scripts/brand.mjs`. Colours are **parsed out of `src/styles/tokens.css`** at
generation time rather than written down, so hard rule 1 still holds in a file
the ESLint rule cannot police, and a palette change reaches the icons.

```
pnpm icons              # regenerate everything into public/
pnpm icons --preview    # also write preview-{16,32,48}.png (gitignored) — LOOK AT THEM
```

**Always run `--preview` and open the 16px render.** 16px is the only size that
is hard, and the failure mode is not subtle-but-acceptable, it is mud. The
comment above `NODES` in `brand.mjs` records what was learned the expensive way:
fat dots and thin edges, no node with three edges, and no axis-aligned
quadrilateral — a symmetrical box is perfectly legible and reads as a window
rather than a network.

`pnpm icons` needs Playwright's Chromium (`pnpm exec playwright install
chromium`). It never runs in CI, which is why the output is committed.

---

## Things deliberately not shipped

Each of these is standard advice, and each does nothing here.

- **`<meta name="keywords">`** — ignored by Google since 2009.
- **`changefreq` and `priority` in the sitemap** — part of the protocol; ignored
  by both Google and Bing.
- **`Course` structured data** — the rich result needs a `courseWorkload`, and
  nobody has measured one. An invented number is worse than no rich result.
- **`datePublished`** — unit frontmatter carries only `updated`. Passing it as
  both would assert that every lesson was written the day it was last edited.
- **`potentialAction: SearchAction`** — the sitelinks searchbox was deprecated
  by Google in November 2024.

If you add any of them later, add the reason too.
