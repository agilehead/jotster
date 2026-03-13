# Issue 3: Included ambient/module augmentation did not appear to affect `tsonic build`

## Status

- confidence: medium-low
- category: secondary observation
- impact: unclear until issues 1 and 2 are fixed

## Summary

I added a local type-only augmentation file to test whether the missing `JotsterDbContext` members could be supplied via normal TS module augmentation.

I also updated every package `tsconfig.json` to include the augmentation path.

But `tsonic build --project auth` still reported the same missing-member errors as if the augmentation were not present.

This may indicate a Tsonic program-construction or ambient-merge issue, but it is lower confidence than issues 1 and 2 because the augmentation was only a debugging probe.

## The augmentation file

File:

- `/home/jester/repos/agilehead/jotster/types/jotster-core-augment.d.ts`

Content:

```ts
declare module "@jotster/core/Jotster.Core.js" {
  interface JotsterDbContext$instance {
    SaveChangesAsync(cancellationToken?: CancellationToken): Task<Int32>;
    SaveChangesAsync(acceptAllChangesOnSuccess: boolean, cancellationToken?: CancellationToken): Task<Int32>;
    Dispose(): void;
  }
}
```

## Include change

Each package `tsconfig.json` was widened from:

```json
"include": ["src/**/*.ts"]
```

to:

```json
"include": ["src/**/*.ts", "../../types/**/*.d.ts"]
```

## Expected behavior

If Tsonic is building its TS program from the effective package `tsconfig.json` inputs, then that augmentation should at least have affected downstream typechecking.

That does **not** mean the augmentation is the correct product fix.
It just means the experiment should have been visible to the compiler.

## Actual behavior

After the include change and augmentation file existed, `tsonic build --project auth` still reported the same missing members:

- `Property 'SaveChangesAsync' does not exist on type 'JotsterDbContext$instance'`
- `Property 'Dispose' does not exist on type 'JotsterDbContext$instance'`

There was no visible sign that the augmentation participated in the build.

## Possible interpretations

### Interpretation A: not a separate issue

Issues 1 and 2 may be strong enough that the augmentation experiment is simply irrelevant or blocked by the same underlying source-package type problem.

If so, then this file does not describe a distinct bug.

### Interpretation B: `tsonic build` is not honoring included ambient files fully

That would mean one of:

- non-`src` included `.d.ts` files are not entering the build program
- module augmentation files are not being respected in the Tsonic program path
- or the source-package pipeline ignores this merge shape

## Why this is lower confidence

Unlike issues 1 and 2:

- this was not part of the original codebase
- it was introduced only as a diagnostic experiment
- it may be downstream of the primary source-package binding defect

So this should **not** be treated as the first thing to fix.

## Recommended handling

Priority:

1. fix issue 1
2. fix issue 2
3. then recheck whether augmentation visibility is still a problem

If issues 1 and 2 are fixed properly, this entire observation may disappear as irrelevant.
