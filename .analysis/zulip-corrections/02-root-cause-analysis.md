# Root Cause Analysis

## 1. Jotster was designed as a standalone product first

The earliest core decisions reflect a system optimized for internal autonomy, not for external Zulip contract parity.

That is visible in:

- generated opaque IDs
- string primary keys everywhere
- string foreign keys everywhere
- tests and helpers that seed and assert on those opaque strings

Examples:

- `packages/core/src/generate-id.ts:3`
- `database/jotster/sqlite/migrations/20260217000000_initial_schema.js:10`
- `database/jotster/sqlite/migrations/20260217000000_initial_schema.js:24`

This was reasonable for an internal product model.
It becomes incorrect when the target changes to Zulip-native API compatibility.

## 2. The system collapsed internal identity and public identity into one field

The original model used one identifier for both:

- persistence identity
- public API identity

That is the real design bug.

For Zulip compatibility, those concerns should have been evaluated explicitly:

- either use integer identity throughout for Zulip-visible resources
- or isolate a separate public identity model from day one

Jotster did neither.

## 3. Compatibility work started at the route layer

The project has already done substantial route and handler compatibility work:

- `.analysis/api-compat/02-summary.md:11`
  - in-scope operations are now present and directly tested

That improved the surface quickly, but it also meant the deeper storage/type mismatch was deferred.

Result:

- route-level parity advanced faster than core-model parity
- handlers started compensating for old core choices
- the public-ID bridge appeared as a migration technique

## 4. The bridge approach is structurally unstable

Once the system has both:

- internal string IDs
- external numeric IDs

every layer becomes vulnerable to drift:

- handlers can emit the wrong one
- tests can assert the wrong one
- events can mix them
- helper functions can resolve one and persist another
- compat-specific code can diverge from non-compat code

That is exactly the kind of architecture that accumulates latent parity defects.

## 5. Types followed storage instead of contract

Because storage identity was string-based, TypeScript types followed that choice.

That spread string assumptions into:

- domain interfaces
- handler signatures
- compat helpers
- tests
- event payloads

So the remaining work is not just changing column types. It is correcting the entire type graph to match the intended public contract.

## 6. The correct correction strategy

The only robust fix is:

- treat Zulip’s public contract as the primary design input
- rebuild the core identity and type model around it
- let handlers, repos, events, tests, and state generation naturally inherit the right shapes

That means:

- the storage model must be corrected first
- the domain model must be corrected second
- the API/event/test layers must then be rebuilt on top of that corrected foundation

Any strategy that keeps the old string-ID core as the permanent truth will keep leaking complexity forever.
