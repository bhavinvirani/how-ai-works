# Maintainers

This file is dormant on purpose.

There is one maintainer, and a second is a possibility rather than a plan. What
is written down here is the shape that change would take, decided now while
nothing depends on it — because permission decisions made in a hurry produce
either a bottleneck or an accident, and the pressure to make one arrives at the
same moment as the person.

## Today

| Person        | GitHub          | Role                      | Owns       |
| ------------- | --------------- | ------------------------- | ---------- |
| Bhavin Virani | `@bhavinvirani` | Owner and sole maintainer | Everything |

`.github/CODEOWNERS` is a single line, `* @bhavinvirani`. Its only job today is
to auto-request his review on every pull request. The setting that would give it
teeth is deliberately switched off, which is the next section.

## The one setting that must stay off

**"Require review from Code Owners" stays OFF while Bhavin is the only owner.**

GitHub forbids approving your own pull request. With `* @bhavinvirani` and a
Code Owners review requirement, every pull request Bhavin opens needs an
approval from Bhavin, which he cannot give — so it can never be merged by the
only person allowed to merge it. That is a deadlock on the maintainer's own work
from the first PR onward, with no way out except turning the setting back off.

It gets its own section because it looks exactly like the kind of tightening a
security-minded contributor would helpfully suggest, and because the failure
does not appear until the next PR is already open.

Dependabot's pull requests are unaffected either way: Bhavin is not their
author, so he can approve those.

Everything else in the branch protection is on. Nothing merges red, and nothing
merges without a pull request, including his own.

| Branch protection on `main`     | Solo — now                | The day someone gets Write |
| ------------------------------- | ------------------------- | -------------------------- |
| Require a pull request          | Yes, 0 required approvals | Yes, 1 required approval   |
| Require review from Code Owners | **Off**                   | On                         |
| Require status checks to pass   | Yes                       | Unchanged                  |
| Force pushes                    | Blocked                   | Unchanged                  |
| Direct pushes, admins included  | Blocked                   | Unchanged                  |

Both changes in the right-hand column are repository settings. Neither is a
change to a file, and neither is a rework.

## What the Write role gets

A trusted collaborator gets GitHub's **Write** role. That is: labelling and
triaging issues, closing duplicates, reviewing pull requests, and **approving**
them — an approval that counts, because it satisfies the one-approval
requirement above. It also means pushing branches to this repository instead of
working from a fork, which is mostly convenience.

What it does not get is a merge Bhavin has not approved. Be precise about the
mechanism: the Write role does put a merge button on the page, and branch
protection is what makes it unusable — with Code Owners review required and
`* @bhavinvirani` still matching every path, no pull request meets its
requirements until he has approved it. The split is enforced by a setting, not
by trust. Turn the setting off and the button works.

This is the arrangement `PLAN.md` §5.5 describes as "others can review and
manage, sensitive things stay with me", on a personal repository, with no
organisation needed.

## Adding a maintainer

In order:

1. Grant the Write role (repository settings — owner only).
2. Add a path-scoped line to `.github/CODEOWNERS`.
3. Flip the two settings in the right-hand column above.
4. Update the table at the top of this file, in the same pull request as step 2.

Step 2 is the one with a trap in it. **CODEOWNERS is last match wins**, and only
the owners named on the last matching line are requested. So a content
maintainer is added like this:

```
* @bhavinvirani
src/content/** @bhavinvirani @some-writer
```

Naming both owners on the second line is the whole point. A second line naming
only `@some-writer` would silently remove Bhavin as an owner of all sixty
lessons — the opposite of what "add a maintainer" is supposed to mean, and
invisible until a content pull request is merged without him.

The same pattern extends to any other area worth splitting off:
`src/components/interactives/**` for an instruments maintainer,
`.github/workflows/**` for someone who actually enjoys CI.

## Owner-only, permanently

This is a personal repository, not an organisation, so exactly one account owns
it and that cannot be delegated without transferring the repository:

- repository settings, including branch protection and rulesets
- GitHub Pages configuration, and any custom domain
- Actions secrets and variables
- releases and tags
- adding or removing collaborators

A maintainer who needs one of these asks. That is the entire escalation path,
and it is one step long because the project is one person deep.

---

`PLAN.md` §5.5 is the source for all of the above. `CONTRIBUTING.md` is for
people sending changes; this file is only about who can merge them.
