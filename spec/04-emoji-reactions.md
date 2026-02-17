# 04 - Emoji Reactions

## Overview

The emoji reactions module lets users add and remove emoji reactions on messages. Reactions are lightweight annotations -- each reaction is a (user, emoji, message) triple. A user can react to the same message with multiple different emoji, but cannot add the same emoji to a message more than once.

Three reaction types are supported to match Zulip's emoji system:
- **unicode_emoji** -- standard Unicode emoji (e.g., thumbs up, heart)
- **realm_emoji** -- custom emoji uploaded by the organization (tenant)
- **zulip_extra_emoji** -- additional emoji bundled with Zulip (e.g., `:zulip:`)

Reactions are returned inline with messages in the `GET /api/v1/messages` response and also delivered as real-time events so clients can update their UI immediately.

Package: `emoji`

## API Endpoints

| Method | Path                                    | Description                          |
| ------ | --------------------------------------- | ------------------------------------ |
| POST   | /api/v1/messages/{message_id}/reactions | Add an emoji reaction to a message   |
| DELETE | /api/v1/messages/{message_id}/reactions | Remove an emoji reaction from a message |

### Request Parameters

Both endpoints accept the same parameters:

| Parameter      | Type   | Required | Description                                              |
| -------------- | ------ | -------- | -------------------------------------------------------- |
| emoji_name     | string | yes      | The emoji name without colons (e.g., `"thumbs_up"`, `"custom_logo"`) |
| emoji_code     | string | yes      | Unicode codepoint (e.g., `"1f44d"`) or custom emoji ID  |
| reaction_type  | string | yes      | One of: `"unicode_emoji"`, `"realm_emoji"`, `"zulip_extra_emoji"` |

### Response Format

**POST (add reaction):** Returns `{"result": "success", "msg": ""}` on success. Returns 400 if the reaction already exists for this user.

**DELETE (remove reaction):** Returns `{"result": "success", "msg": ""}` on success. Returns 400 if no matching reaction exists for this user.

## Data Model

### `reaction`

| Column        | Type   | Constraints                         | Description                                    |
| ------------- | ------ | ----------------------------------- | ---------------------------------------------- |
| id            | string | PK                                  | Nanoid                                         |
| tenant_id     | string | FK -> tenant, NOT NULL              | Tenant scope                                   |
| message_id    | string | FK -> message, NOT NULL             | The message being reacted to                   |
| user_id       | string | FK -> user, NOT NULL                | The user who added the reaction                |
| emoji_name    | string | NOT NULL                            | Display name of the emoji (e.g., `"thumbs_up"`) |
| emoji_code    | string | NOT NULL                            | Unicode codepoint or custom emoji ID           |
| reaction_type | string | NOT NULL                            | `"unicode_emoji"`, `"realm_emoji"`, or `"zulip_extra_emoji"` |
| created_at    | int    | NOT NULL                            | Unix milliseconds                              |

**Indexes:**

| Name                          | Columns                                          | Purpose                                    |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------ |
| uq_reaction_user_emoji        | (message_id, user_id, emoji_code, reaction_type) | UNIQUE -- one reaction per emoji per user per message |
| ix_reaction_message           | (tenant_id, message_id)                          | Fetch all reactions for a message          |
| ix_reaction_user              | (tenant_id, user_id, created_at)                 | Fetch all reactions by a user              |

## Repository Interface

```
addReaction(tenantId, messageId, userId, emojiName, emojiCode, reactionType)
  → Result<Reaction>
```
Insert a new reaction row. Fails if a row with the same (message_id, user_id, emoji_code, reaction_type) already exists (unique constraint violation). Returns the created reaction.

```
removeReaction(tenantId, messageId, userId, emojiCode, reactionType)
  → Result<void>
```
Delete the reaction matching (message_id, user_id, emoji_code, reaction_type). Fails if no matching row exists.

```
getReactionsForMessage(tenantId, messageId)
  → Result<Reaction[]>
```
Fetch all reactions on a single message, ordered by `created_at` ascending.

```
getReactionsForMessages(tenantId, messageIds)
  → Result<Map<messageId, Reaction[]>>
```
Batch fetch reactions for multiple messages. Returns a map keyed by message ID. Used when loading message lists to avoid N+1 queries.

## Domain Functions

### addReaction

Validate that the target message exists and belongs to the given tenant. Validate that the requesting user has access to the message (is a subscriber of the channel, or is a member of the DM group). Check that the user has not already added the same emoji to this message. For `realm_emoji` reactions, validate that the emoji_code references a valid custom emoji in the tenant. Persist the reaction via the repository. Emit a `reaction` event with `op: "add"`.

### removeReaction

Validate that the target message exists and belongs to the given tenant. Validate that a reaction matching (message_id, user_id, emoji_code, reaction_type) exists -- users can only remove their own reactions. Delete the reaction via the repository. Emit a `reaction` event with `op: "remove"`.

## Events

### `reaction` with `op: "add"`

Emitted when a user adds a reaction to a message. Contains:
- `type`: `"reaction"`
- `op`: `"add"`
- `message_id`: the message that was reacted to
- `user_id`: the user who added the reaction
- `user`: object with `user_id`, `email`, `full_name`
- `emoji_name`: display name of the emoji
- `emoji_code`: Unicode codepoint or custom emoji ID
- `reaction_type`: `"unicode_emoji"`, `"realm_emoji"`, or `"zulip_extra_emoji"`

### `reaction` with `op: "remove"`

Emitted when a user removes a reaction from a message. Contains:
- `type`: `"reaction"`
- `op`: `"remove"`
- `message_id`: the message the reaction was removed from
- `user_id`: the user who removed the reaction
- `user`: object with `user_id`, `email`, `full_name`
- `emoji_name`: display name of the emoji
- `emoji_code`: Unicode codepoint or custom emoji ID
- `reaction_type`: `"unicode_emoji"`, `"realm_emoji"`, or `"zulip_extra_emoji"`
