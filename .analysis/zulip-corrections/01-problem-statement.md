# Problem Statement

Jotster currently has strong route coverage for the in-scope Zulip API, but it was not originally designed around Zulip’s public contract.

That mismatch is now visible in the core model.

## 1. Identity model is wrong at the root

Jotster’s original core identity model is opaque string-based.

Examples:

- `packages/core/src/generate-id.ts:3`
  - `generateId(): string`
  - emits random 16-byte hex strings
- `packages/core/src/db/entities/user.ts:7`
  - `Id!: string`
- `database/jotster/sqlite/migrations/20260217000000_initial_schema.js:24`
  - `table.string("id").primary()`

This was internally coherent for a Jotster-native system.

It is not Zulip-native.

For Zulip-visible resources, Zulip expects integer identifiers across:

- URLs
- payloads
- event objects
- initial-state data
- client-side caches and references

## 2. The current dual-ID bridge is only a transitional patch

The repo now contains a partial dual-ID approach:

- string `Id`
- integer-like `PublicId`
- resolver helpers that translate numeric API values back to internal string IDs

Example:

- `packages/core/src/db/entities/user.ts:7`
  - `Id!: string`
  - `PublicId!: long`
- `packages/server/src/handlers/handle-get-user.ts:22`
  - resolves an incoming numeric user identifier back to the old string ID

This is useful as a migration aid, but it is not the correct final architecture.

Why it is wrong as an end state:

- it preserves the original non-Zulip identity model internally
- it forces every handler to participate in translation
- it creates two truths for the same resource
- it increases the chance of leaking the wrong identifier in responses, events, tests, or joins
- it makes the code look migrated instead of natively designed

If the goal is “as if the whole system was designed for Zulip compatibility from the beginning”, the dual-ID bridge must disappear.

## 3. Type shapes still carry legacy assumptions

The current codebase still has many places where internal string IDs are assumed by type.

Examples already visible in tests and handlers:

- `tests/tests/users/get-users.test.ts`
  - older expectations used `user.userId` string values in API responses
- `tests/tests/channels/channel-compat.test.ts`
  - older expectations used internal string `channelId` and `messageId` values
- `packages/server/src/helpers/compat-db.ts`
  - many helpers still accept `string` IDs even when the public contract should be numeric

That means the work is not only database or route work. It is also a type-correction program.

## 4. Route parity is not the same as contract parity

The current compatibility report is strong on route inventory:

- `.analysis/api-compat/02-summary.md:3`
  - 151 operations inventoried
- `.analysis/api-compat/02-summary.md:4`
  - 146 / 151 implemented by route
- `.analysis/api-compat/02-summary.md:6`
  - 5 excluded by scope

But route presence alone does not prove the system is Zulip-native.

The remaining gap is contract depth:

- exact identifier types
- exact request field types
- exact response field types
- exact event payload types
- exact state bootstrap shapes
- exact error semantics

## 5. The actual correction required

The remaining work is not:

- “add more translation helpers”
- “teach more handlers to map IDs”
- “leave storage alone and patch the edges”

The remaining work is:

- redesign the persistence and domain model so Zulip-visible resources are integer-ID based from the core
- update all dependent types and foreign keys
- remove dual identity where it only exists to bridge an old design
- rebuild every API and event surface on top of the corrected core model

That is the problem this plan solves.
