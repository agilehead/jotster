# Jotster → JS Surface: Tsonic / Ecosystem Issue Set

## Full path

`/home/jester/repos/agilehead/jotster/.analysis/tsonic-jotster-issues-20260310-080637/`

## Scope

This directory contains the **Tsonic-side issues** surfaced so far while moving Jotster to:

- `surface: "@tsonic/js"`
- published `@tsonic/nodejs`
- published `@tsonic/express`

It is **not** a full list of all remaining Jotster build failures.

Why:

- Jotster still contains substantial pre-surface CLR-shaped application code
- that local migration work creates many expected app-level errors
- I separated those from the actual compiler / bindings / ecosystem issues

So this report set is:

- comprehensive for the **confirmed Tsonic/ecosystem issues surfaced so far**
- not a claim that the entire Jotster migration is complete

## Issue files

### 1. Inherited members dropped from source-package bindings

File:

- `/home/jester/repos/agilehead/jotster/.analysis/tsonic-jotster-issues-20260310-080637/01-source-package-bindings-drop-inherited-members.md`

Status:

- confirmed
- high confidence

### 2. Contextual typing lost for EF/LINQ lambdas across source-package bindings

File:

- `/home/jester/repos/agilehead/jotster/.analysis/tsonic-jotster-issues-20260310-080637/02-contextual-typing-lost-for-query-lambdas.md`

Status:

- confirmed
- high confidence

### 3. Included ambient/module augmentation did not appear to affect `tsonic build`

File:

- `/home/jester/repos/agilehead/jotster/.analysis/tsonic-jotster-issues-20260310-080637/03-augmentation-not-observed-by-build.md`

Status:

- secondary observation
- lower confidence than 1 and 2

## Not included as open issues here

### Published dependency drift in `@tsonic/nodejs` / `@tsonic/express`

This was surfaced during the migration, but it has already been fixed upstream and published.
So it is not listed here as a current open issue.

### Jotster-local migration work

Examples:

- `.Length` → `.length`
- `.Substring(...)` → `.substring(...)`
- `.StartsWith(...)` → `.startsWith(...)`
- `.Split(...)` → `.split(...)`
- `.Contains(...)` → `.includes(...)`
- `.Replace(...)` → `.replace(...)`

Those are application migration tasks, not Tsonic defects.

## Recommendation

The Tsonic team should start with issues 1 and 2 first.
Issue 3 only matters if 1 and 2 do not already make the augmentation experiment irrelevant.
