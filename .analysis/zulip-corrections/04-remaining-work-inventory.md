# Remaining Work Inventory

This is the comprehensive pending-work list for the Zulip-native rewrite.

## A. Core schema and entity model

### A1. Replace dual-ID entities with canonical integer IDs

Current transitional shape:

- `Id!: string`
- `PublicId!: long`

Examples:

- `packages/core/src/db/entities/user.ts:7`
- `packages/core/src/db/entities/channel-folder.ts:7`

Final required shape:

- `Id!: long` or `Id!: int64` equivalent
- no `PublicId`

Applies to every Zulip-visible resource entity.

### A2. Rewrite database schema from the root

The original baseline schema is string-keyed:

- `database/jotster/sqlite/migrations/20260217000000_initial_schema.js`

The current public-ID migration:

- `database/jotster/sqlite/migrations/20260315010000_public_ids.js`

is not the final approach. It preserves the old core.

Required final work:

- rewrite the baseline schema so Zulip-visible tables use integer primary keys
- rewrite all FKs referencing those resources
- remove `public_id_counter`
- remove `public_id` bridge columns
- remove legacy bridge migration assumptions

### A3. Rebuild seeds and low-level test fixtures

Examples already showing old assumptions:

- `tests/utils/test-helpers.ts`
- many tests still seed internal string IDs as the primary truth

Required:

- test fixture builders create canonical integer IDs directly
- helper return types expose integer IDs for public resources
- no dependence on string IDs for public-resource assertions

## B. Core helper and type corrections

### B1. Remove public-ID bridge helpers

Current migration helpers:

- `packages/server/src/helpers/public-ids.ts`
- `packages/core/src/public-ids.ts`

Final state:

- remove resolver helpers whose only purpose is translating numeric API IDs into old string IDs
- remove batch map helpers whose only purpose is mapping internal IDs back to public IDs

### B2. Correct all public-facing type signatures

Anything that refers to a Zulip-visible resource by ID must be updated.

Examples:

- `user_id`
- `stream_id`
- `message_id`
- `creator_id`
- `first_message_id`
- `scheduled_message_id`
- `channel_folder_id`

This work spans:

- entity types
- domain interfaces
- handler parameter extraction
- response builder types
- event record types
- test helper types

## C. Repository and domain rewrites

### C1. User domain and repos

Must be fully integer-based:

- create user
- get user by ID
- update user
- deactivate/reactivate user
- status operations
- mute/unmute user
- bot owner links
- API key owner links

### C2. Channel/subscription domain and repos

Must be fully integer-based:

- create/get/update/delete stream
- default streams
- subscriptions
- stream members
- stream topics
- channel folders
- muted topics

### C3. Message domain and repos

Must be fully integer-based:

- send/edit/delete message
- fetch messages
- single-message fetch
- reactions
- read receipts
- flags
- moderation/report endpoints
- scheduled/persisted message references

### C4. Persisted compat objects

Must be fully integer-based where Zulip expects it:

- reminders
- scheduled messages
- saved snippets
- navigation views
- linkifiers
- data exports

### C5. Organization and permissions domain

Must be fully integer-based:

- user groups
- invitations
- group membership checks
- custom profile fields
- custom emoji
- exports

## D. Handler layer corrections

Every handler that currently accepts a string identifier for a Zulip-visible resource must be corrected.

Examples already under active correction:

- `packages/server/src/handlers/handle-get-user.ts`
- `packages/server/src/handlers/handle-get-stream.ts`
- `packages/server/src/handlers/handle-channel-compat.ts`

Remaining comprehensive work:

- user endpoints
- presence endpoints
- stream endpoints
- subscription endpoints
- message endpoints
- organization endpoints
- permissions endpoints
- persisted-object endpoints
- export endpoints
- event/registration endpoints

## E. Event and state surfaces

### E1. Initial state

`buildInitialState` and all helper mappers must emit only Zulip-native ID shapes.

Examples already touched:

- `packages/server/src/helpers/build-initial-state.ts`

Remaining work:

- audit every object tree for leaked internal string IDs
- user groups
- subscriptions
- streams
- never-subscribed streams
- reminders
- scheduled messages
- linkifiers
- custom profile fields
- event registration payloads

### E2. Queue/event payloads

Every emitted event needs the same correction.

Key event families:

- `channel_folder`
- `user_group`
- `custom_profile_fields`
- `drafts`
- `user_settings`
- reminders/scheduled messages
- typing/presence/message events

## F. Compatibility helpers and legacy assumptions

Current compat helpers still encode old-ID assumptions in places:

- `packages/server/src/helpers/compat-db.ts`
- `packages/server/src/helpers/compat-mappers.ts`

Required:

- rewrite helpers to operate on canonical integer resource IDs
- remove helper code that exists only because the core still uses string IDs

## G. Test suite rewrite

The current suite now covers in-scope endpoints, but many tests still encode old string-ID assumptions.

Examples visible today:

- `tests/tests/subscriptions/properties.test.ts`
- `tests/tests/messages/message-compat.test.ts`
- `tests/tests/events/register-queue.test.ts`
- `tests/tests/export/data-export.test.ts`

Required work:

- convert all API assertions to canonical integer IDs
- convert all event assertions to canonical integer IDs
- convert all initial-state assertions to canonical integer IDs
- stop mixing DB internal IDs with API-visible IDs in the same test

## H. Documentation and analysis updates

Once the rewrite is complete:

- `.analysis/api-compat/*` must be refreshed against the final system
- all old references to bridge/public-ID migration strategy should be retired
- developer notes should describe the final Zulip-native model, not the transitional one
