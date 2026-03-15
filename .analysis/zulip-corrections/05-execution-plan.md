# Execution Plan

This is the recommended implementation order.

## Phase 0: Freeze the target

Before more feature work:

- commit the architectural decision that there will be no permanent dual-ID bridge
- treat current `PublicId` work as transitional only
- stop adding new bridge helpers except where strictly needed to land the rewrite

Deliverable:

- this analysis directory

## Phase 1: Rebuild the core identity model

### Goals

- make canonical IDs integer for Zulip-visible resources
- remove the need for public-ID translation helpers

### Work

- rewrite entity definitions
- rewrite baseline schema/migrations
- rewrite FK types across all relevant tables
- remove `PublicId` fields
- remove `public_id_counter`
- remove `allocatePublicId` as a bridge allocator

### Exit criteria

- core packages build with integer canonical IDs
- no canonical Zulip-visible entity keeps `Id: string`

## Phase 2: Rebuild repositories and domains

### Goals

- make domain/repo APIs use the new canonical integer IDs directly

### Work

- users/auth
- channels/subscriptions
- messages
- permissions
- organization
- persisted compat objects
- exports

### Exit criteria

- repo/domain APIs no longer require bridge conversion for public resources
- public-resource identities are integer throughout the domain layer

## Phase 3: Rebuild handler and helper layers

### Goals

- handlers should parse and use canonical IDs directly
- helper modules should stop translating between public and internal IDs

### Work

- remove `resolve*PublicId` usage from handlers
- simplify request-param handling
- simplify compat helpers
- ensure all response builders emit canonical integer IDs directly from entities/domain objects

### Exit criteria

- no handler relies on public-ID bridge helpers for Zulip-visible resources
- response builders no longer map from string internal IDs to public IDs

## Phase 4: Rebuild initial-state and event surfaces

### Goals

- all emitted state/event payloads become canonically Zulip-native

### Work

- queue events
- register payloads
- bootstrap state
- compat/state helpers

### Exit criteria

- no event payload exposes internal string IDs for Zulip-visible resources
- no initial-state payload exposes internal string IDs for Zulip-visible resources

## Phase 5: Rewrite test infrastructure and suite

### Goals

- tests validate the final Zulip-native model directly

### Work

- rewrite seeding helpers
- rewrite API expectations
- rewrite event assertions
- rewrite initial-state assertions
- remove mixed-ID expectations

### Exit criteria

- test fixtures and assertions only use canonical integer IDs for Zulip-visible resources
- no test relies on bridge logic

## Phase 6: Final cleanup

### Goals

- remove all transitional artifacts

### Work

- delete bridge helpers
- delete obsolete migrations or replace with a clean baseline strategy
- delete analysis or comments that describe the bridge as the intended architecture

### Exit criteria

- codebase reads as if it was built for Zulip-native IDs from the start

## Rules for execution

- no partial “final” state with permanent dual identity
- no preserving legacy string public-resource IDs for backward compatibility
- no leaving bridge code in place “just in case”
- no updating only handlers while leaving domain/storage fundamentally old

If a step makes the product temporarily less tidy but is required to reach the clean end state, that is acceptable.
What is **not** acceptable is freezing the product in a hybrid design and calling it complete.
