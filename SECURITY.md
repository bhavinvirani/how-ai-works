# Security

This site is static. There is no backend, no database, no authentication, no
server-side storage and no user accounts — by design and permanently
(`PLAN.md` §1.4). It collects nothing about anyone. Reading progress is written
to your own browser's `localStorage` and is never transmitted, because there is
nowhere for it to go.

So the honest threat model is small, and this file is short for that reason
rather than out of neglect. There is no server here to compromise. What is
genuinely at risk is what gets **into** a build, and what **publishes** it.

## Supported versions

There are no releases, no tags and no published package. The only supported
version is the site currently deployed at
<https://bhavinvirani.github.io/how-ai-works/>, which is whatever `main` built
last.

Fixes ship by merging to `main` and letting the deploy workflow republish.
Nothing is backported, because there is nothing to backport to. A fork, a
vendored copy or a local build is yours to keep current.

## Reporting

Use GitHub's private vulnerability reporting: the **Security** tab on this
repository, then **Report a vulnerability**. It reaches Bhavin Virani
([@bhavinvirani](https://github.com/bhavinvirani)) privately, and it is the only
channel here that is private by default.

Please do not open a public issue for a suspected vulnerability. Everything else
— a broken link, a wrong explanation, a rendering bug — belongs in a public
issue, and will get a faster and better answer there.

Expect an acknowledgement within about a week. That is one person's realistic
turnaround in his own time, not a service level, and saying so is more useful
than a 24-hour promise nobody can keep. There is no bounty programme.

## In scope

Roughly: anything that puts code a reader did not ask for into their browser, or
into a deployment.

- **Dependencies that reach the browser.** The allowlist in
  `docs/DEPENDENCIES.md` is short for weight reasons, and this is the second
  reason. A compromised package on that list reaches every reader of every
  lesson. Report it here even if the upstream advisory already exists — what
  matters is whether it ships to `dist/`.
- **The GitHub Actions workflows and their tokens.** `deploy.yml` and
  `preview-deploy.yml` hold `contents: write` and can push to the `gh-pages`
  branch, which is the live site. Anything that lets a pull request steer what
  those two run, or borrow their token, is the most valuable thing in this
  repository. `ci.yml` and `preview-build.yml` are `contents: read` and are
  meant to stay that way — a change widening either is a finding in itself.
- **Script injection into a built page.** Lessons are MDX, which can embed
  components, so a page can in principle ship JavaScript that the prose does not
  advertise. The one place a string becomes markup at runtime is
  `src/pages/search.astro`, which sets Pagefind's excerpt with `innerHTML` to
  keep its `<mark>` elements; that string comes from our own build-time index
  and never from what you typed. If you find a path from a query, a URL or a
  stored value to markup, that is a report.
- **The published site behaving differently to what this repository builds.**
  Anything served under `/how-ai-works/` that a clean `pnpm build` does not
  produce.

## Not in scope

These are real observations that are not vulnerabilities here. Saying so up
front saves everyone a round trip.

- **Response headers we cannot set** — a Content-Security-Policy above all, plus
  frame and referrer policies. GitHub Pages serves static files and gives a
  project no way to set headers. The defence is that content pages ship zero
  JavaScript (`tests/e2e/no-js.spec.ts` proves it with scripting disabled), not
  a header we are unable to send. A scanner report listing missing headers is
  not a finding.
- **`localStorage` being readable on a shared machine.** It is the reader's own
  browser, and the contents are which lessons they have ticked off. Anyone with
  the device already has it. `/progress` offers export and clear for exactly
  this.
- **Denial of service** against GitHub's CDN. Not ours to defend, and there is
  nothing dynamic to exhaust.
- **`reference/how-ai-works.html`.** A vendored source artifact, excluded from
  the build, from lint and from format. It ships to nobody.
- **Scanner output with no working exploit** against the deployed site. Send the
  steps and the request, not the tool's summary.
- **Anything that needs the reader to run attacker code in their own browser
  first.** At that point the site is not the vulnerability.

## Known, and accepted

**Pull request previews serve unreviewed code from the live origin.** Every open
pull request — including one from a stranger's fork, which is exactly what the
Track A contribution path produces — is built and published to
`/pr-preview/pr-<n>/` on the same host as the live site. A preview's JavaScript
therefore shares an origin, and so shares `localStorage`, with the real thing.

That is inherent to preview deploys on GitHub Pages and we accept it. Previews
exist only while a pull request is open and are removed when it closes, and the
alternative is having no previews, which would remove the single best thing a
first-time contributor gets. Treat a preview URL as what it is — a stranger's
branch — and do not follow one from somewhere you do not trust.

What is **not** accepted, and is the reason the preview pipeline is split in two
(`PLAN.md` §6.2): the workflow holding the write token never checks out or
executes pull request code. It downloads an artifact built by the read-only
workflow and publishes it — no install, no build, no script from the PR branch.
`pull_request_target` appears once, on the `closed` event that removes a
finished preview, and that job checks out the base branch and runs nothing from
the pull request either. If you extend either workflow, that is the rule.

## What already runs

- **Dependabot**, weekly and grouped (`.github/dependabot.yml`), for npm and for
  the Actions themselves. Updates go through the same gates as a human pull
  request, so a bad one fails on budgets, axe or the e2e suite.
- **CodeQL**, default setup.
- **Every action pinned to a commit SHA**, with the version in a trailing
  comment. A moved tag cannot change what CI executes.
- **Least privilege by default.** Workflows declare `contents: read` unless they
  have a specific reason to write, and the two that write share a
  `gh-pages-write` concurrency group so they cannot race each other.
