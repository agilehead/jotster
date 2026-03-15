# Target Zulip-Native Model

This section defines the desired architecture. This is the end state to build toward.

## 1. Identity rules

### 1.1 Zulip-visible resources use integer IDs as their real IDs

For Zulip-visible resources, the canonical persisted identifier is an integer.

Examples:

- users
- channels/streams
- messages
- user groups
- channel folders
- drafts
- reminders
- scheduled messages
- saved snippets
- custom emoji
- custom profile fields
- invitations
- exports
- linkifiers
- navigation views
- attachments

For those resources:

- entity `Id` is integer
- database PK is integer
- FK references are integer
- API payload IDs are integer
- event payload IDs are integer
- test fixtures use integer IDs

### 1.2 Opaque tokens remain strings

These remain string-valued because Zulip does not model them as integer identities:

- API keys
- queue IDs
- upload path IDs
- invitation link tokens
- webhook secrets
- hashes
- raw device tokens

These are not resource IDs in the Zulip sense.

## 2. No dual-ID model

The final model does **not** allow:

- `Id: string`
- `PublicId: long`

for the same Zulip-visible resource.

That means the current bridge-style fields should be removed from final design once cutover is complete.

Final rule:

- one resource, one canonical identity

If the resource is Zulip-visible and integer-identified, that canonical identity is integer.

## 3. Handler contract rules

Handlers should not perform “public ID to internal ID” bridge translation for ordinary Zulip-visible resources.

Correct end state:

- route params already parse into the canonical entity identity
- repo/domain functions accept the same identity type used by storage
- response mapping just emits the same canonical integer values

Examples of code that should disappear in final design:

- `resolveUserPublicId(...)`
- `resolveChannelPublicId(...)`
- `resolveMessagePublicId(...)`
- similar bridge helpers in `packages/server/src/helpers/public-ids.ts`

Those are migration artifacts, not final architecture.

## 4. Domain model rules

Domain functions should accept and return Zulip-native types for public-facing concepts.

Examples:

- `getUserByIdDomain(...)` should work on integer IDs for user identity
- `getChannelByIdDomain(...)` should work on integer IDs for stream identity
- `getMessage...(...)` functions should use integer message IDs
- membership lists should return integer user IDs
- topic summaries should return integer `max_id`

## 5. Event model rules

Every event payload that references a Zulip-visible resource should use the same integer ID type that the API uses.

Examples:

- `user_id`
- `stream_id`
- `message_id`
- `group_id`
- `channel_folder.id`
- `custom_profile_field.id`
- `scheduled_message_id`
- `reminder_target_message_id`

No event should leak an internal string resource ID.

## 6. Initial-state rules

Initial-state payloads must already be fully Zulip-native.

That includes:

- realm user objects
- subscriptions
- streams
- never-subscribed streams
- user groups
- folders
- reminders
- scheduled messages
- custom profile fields
- linkifiers

There should be no post-hoc compat mapping on top of non-Zulip domain data. The domain data itself should already be correct.

## 7. Test model rules

Tests must seed and assert against the same contract the product is supposed to implement.

That means:

- seeded public resources get integer IDs directly
- tests assert integer API IDs directly
- tests stop depending on internal opaque string IDs for public objects
- fixtures mirror Zulip’s identifier conventions

## 8. Migration rule

Because this plan rejects legacy/bridge compatibility, the migration target is a **clean cutover**, not a permanent hybrid:

- old string-ID assumptions are to be removed
- compatibility shims are temporary only if strictly needed to land the rewrite
- final code should read like a system that always used Zulip-style IDs
