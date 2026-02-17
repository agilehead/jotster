# 03 - Messages

## Overview

The messages module is the core of Jotster's chat functionality. It handles sending, retrieving, editing, and deleting messages in both channel (stream) and direct message (DM) conversations. Messages in channels are organized by topic. DMs are modeled through `dm_group`, which represents a unique set of participants.

This module implements Zulip's narrow system -- a composable set of filter operators that power message search, notification scoping, and client-side views. Narrows are used both for fetching messages and for bulk flag operations.

The module also manages per-user message flags (read, starred, mentioned, etc.) and exposes message edit history. Markdown rendering converts Zulip-flavored markdown (mentions, emoji shortcodes, fenced code blocks, links) into HTML for display.

Package: `messages`

## API Endpoints

| Method | Path                                    | Description                                              |
| ------ | --------------------------------------- | -------------------------------------------------------- |
| POST   | /api/v1/messages                        | Send a message to a channel+topic or as a DM             |
| GET    | /api/v1/messages                        | Fetch messages matching narrow filters with anchor-based pagination |
| GET    | /api/v1/messages/{message_id}           | Fetch a single message by ID                             |
| PATCH  | /api/v1/messages/{message_id}           | Edit message content, topic, or move to a different channel |
| DELETE | /api/v1/messages/{message_id}           | Delete a message                                         |
| GET    | /api/v1/messages/{message_id}/history   | Get the edit history for a message                       |
| GET    | /api/v1/messages/{message_id}/read_receipts | Get the list of users who have read a message        |
| POST   | /api/v1/messages/render                 | Render Zulip markdown to HTML without sending            |
| GET    | /api/v1/messages/matches_narrow         | Check whether specific messages match a given narrow     |
| POST   | /api/v1/messages/flags                  | Add or remove flags on a list of message IDs             |
| POST   | /api/v1/messages/flags/narrow           | Add or remove flags on messages matching a narrow        |
| GET    | /api/v1/messages/summary                | Get a summary of messages (condensed message summaries)  |
| POST   | /api/v1/zcommand                        | Process slash commands (/me, /dark, /light, /fluid-width, /fixed-width) |
| POST   | /api/v1/messages/{message_id}/report    | Report a message for moderation                          |
| POST   | /api/v1/mark_all_as_read                | Mark all of the user's unread messages as read           |

### Narrow Operators

Narrows are JSON-encoded arrays of filter objects. Each object has an `operator` and an `operand`, and optionally a `negated` boolean. The following operators must be supported:

| Operator       | Operand                    | Description                                          |
| -------------- | -------------------------- | ---------------------------------------------------- |
| `channel`      | channel name or ID         | Messages in a specific channel                       |
| `stream`       | channel name or ID         | Alias for `channel`                                  |
| `topic`        | topic name                 | Messages with a specific topic (within a channel)    |
| `sender`       | email or user ID           | Messages sent by a specific user                     |
| `dm`           | comma-separated user IDs   | DM conversation with exactly these users             |
| `pm-with`      | comma-separated user IDs   | Alias for `dm`                                       |
| `dm-including` | user ID                    | All DM conversations that include the given user     |
| `is`           | flag name                  | Messages matching a status flag                      |
| `has`          | attachment type             | Messages that have a specific attachment type        |
| `search`       | search string              | Full-text search on message content                  |
| `near`         | message ID                 | Anchor for fetching messages near a given ID         |
| `id`           | message ID                 | A specific message by ID                             |

**`is` operand values:** `dm`, `starred`, `mentioned`, `alerted`, `unread`, `resolved`

**`has` operand values:** `link`, `image`, `attachment`, `reaction`

## Data Model

### `message`

| Column           | Type    | Constraints                             | Description                              |
| ---------------- | ------- | --------------------------------------- | ---------------------------------------- |
| id               | string  | PK                                      | Nanoid                                   |
| tenant_id        | string  | FK -> tenant, NOT NULL                  | Tenant scope                             |
| sender_id        | string  | FK -> user, NOT NULL                    | User who sent the message                |
| type             | string  | NOT NULL                                | `"stream"` for channel, `"direct"` for DM |
| channel_id       | string  | FK -> channel, nullable                 | Target channel (when type = "stream")    |
| topic            | string  | nullable                                | Topic within channel (when type = "stream") |
| dm_group_id      | string  | FK -> dm_group, nullable                | DM group (when type = "direct")          |
| content          | text    | NOT NULL                                | Raw Zulip markdown source                |
| rendered_content | text    | NOT NULL                                | HTML output from markdown rendering      |
| has_attachment   | int     | NOT NULL, default 0                     | 1 if message contains file attachments   |
| has_image        | int     | NOT NULL, default 0                     | 1 if message contains images             |
| has_link         | int     | NOT NULL, default 0                     | 1 if message contains URLs               |
| created_at       | int     | NOT NULL                                | Unix milliseconds                        |
| edited_at        | int     | nullable                                | Unix milliseconds of last edit           |

**Indexes:**

| Name                                | Columns                                  | Purpose                                  |
| ----------------------------------- | ---------------------------------------- | ---------------------------------------- |
| ix_message_channel_topic            | (tenant_id, channel_id, topic, id)       | Fetch messages in a channel+topic        |
| ix_message_dm_group                 | (tenant_id, dm_group_id, id)             | Fetch messages in a DM conversation      |
| ix_message_sender                   | (tenant_id, sender_id, id)               | Fetch messages by sender                 |
| fts_message_content                 | full-text index on content               | Full-text search via `search` narrow     |

### `dm_group`

Represents a unique set of DM participants. A given combination of users maps to exactly one `dm_group` row, enforced via `group_hash`.

| Column     | Type   | Constraints                              | Description                              |
| ---------- | ------ | ---------------------------------------- | ---------------------------------------- |
| id         | string | PK                                       | Nanoid                                   |
| tenant_id  | string | FK -> tenant, NOT NULL                   | Tenant scope                             |
| group_hash | string | NOT NULL                                 | Hash of sorted participant user IDs      |
| created_at | int    | NOT NULL                                 | Unix milliseconds                        |

**Indexes:**

| Name                         | Columns                    | Purpose                           |
| ---------------------------- | -------------------------- | --------------------------------- |
| uq_dm_group_hash             | (tenant_id, group_hash)    | UNIQUE -- prevents duplicate groups |

### `dm_group_member`

Join table linking users to their DM groups.

| Column      | Type   | Constraints                  | Description                |
| ----------- | ------ | ---------------------------- | -------------------------- |
| dm_group_id | string | FK -> dm_group, NOT NULL     | The DM group               |
| user_id     | string | FK -> user, NOT NULL         | A participant in the group  |

**Primary key:** (dm_group_id, user_id)

**Indexes:**

| Name                          | Columns                   | Purpose                              |
| ----------------------------- | ------------------------- | ------------------------------------ |
| ix_dm_group_member_user       | (user_id, dm_group_id)    | Find all DM groups a user belongs to |

### `message_edit_history`

Records each edit to a message. Stores the previous values of fields that were changed, so the full history can be reconstructed by walking backwards from the current message state.

| Column                | Type   | Constraints                  | Description                                    |
| --------------------- | ------ | ---------------------------- | ---------------------------------------------- |
| id                    | string | PK                           | Nanoid                                         |
| message_id            | string | FK -> message, NOT NULL      | The message that was edited                    |
| user_id               | string | FK -> user, NOT NULL         | The user who made the edit                     |
| prev_content          | text   | nullable                     | Previous markdown content (if content changed) |
| prev_rendered_content | text   | nullable                     | Previous HTML (if content changed)             |
| prev_topic            | string | nullable                     | Previous topic (if topic changed)              |
| prev_channel_id       | string | FK -> channel, nullable      | Previous channel (if message was moved)        |
| timestamp             | int    | NOT NULL                     | Unix milliseconds when the edit occurred       |

**Indexes:**

| Name                            | Columns                   | Purpose                        |
| ------------------------------- | ------------------------- | ------------------------------ |
| ix_message_edit_history_message | (message_id, timestamp)   | Fetch edit history for a message |

### `message_flag`

Per-user flags on messages. A row exists for each (user, message, flag) combination that is active.

| Column     | Type   | Constraints              | Description                                         |
| ---------- | ------ | ------------------------ | --------------------------------------------------- |
| user_id    | string | FK -> user, NOT NULL     | The user who owns this flag                         |
| message_id | string | FK -> message, NOT NULL  | The message the flag is on                          |
| flag       | string | NOT NULL                 | One of: `"read"`, `"starred"`, `"mentioned"`, `"wildcard_mentioned"`, `"has_alert_word"` |

**Primary key:** (user_id, message_id, flag)

**Indexes:**

| Name                          | Columns                          | Purpose                              |
| ----------------------------- | -------------------------------- | ------------------------------------ |
| ix_message_flag_message       | (message_id, flag)               | Get all users with a flag on a message |
| ix_message_flag_user_flag     | (user_id, flag, message_id)      | Get all messages with a flag for a user |

## Repository Interface

```
sendMessage(tenantId, senderId, type, channelId, topic, dmGroupId, content, renderedContent)
  → Result<Message>
```
Insert a new message row. Sets `has_attachment`, `has_image`, `has_link` based on rendered content analysis. Returns the created message.

```
getMessages(tenantId, narrow, anchor, numBefore, numAfter, applyMarkdown)
  → Result<Message[]>
```
Fetch messages matching the given narrow filters, paginated around the anchor. `anchor` can be a message ID, `"newest"`, `"oldest"`, or `"first_unread"`. Returns up to `numBefore` messages before the anchor and `numAfter` messages after it.

```
getMessage(tenantId, messageId)
  → Result<Message | null>
```
Fetch a single message by ID within the tenant.

```
updateMessage(tenantId, messageId, content, renderedContent, topic, channelId)
  → Result<void>
```
Update message fields. Any parameter that is `null`/`undefined` is left unchanged. Sets `edited_at` to current timestamp.

```
deleteMessage(tenantId, messageId)
  → Result<void>
```
Hard-delete a message row.

```
getEditHistory(tenantId, messageId)
  → Result<EditHistoryEntry[]>
```
Fetch all edit history entries for a message, ordered by timestamp descending (most recent first).

```
getReadReceipts(tenantId, messageId)
  → Result<userId[]>
```
Return the list of user IDs that have a `"read"` flag on the given message.

```
addMessageFlags(tenantId, userId, messageIds, flag)
  → Result<void>
```
Insert flag rows for the given (user, message, flag) combinations. Ignores duplicates.

```
removeMessageFlags(tenantId, userId, messageIds, flag)
  → Result<void>
```
Delete flag rows for the given (user, message, flag) combinations.

```
addMessageFlagsByNarrow(tenantId, userId, narrow, flag)
  → Result<{ updatedCount: number, firstMessageId: string, lastMessageId: string }>
```
Add a flag to all messages matching the narrow for the given user. Returns the count of newly flagged messages and the ID range.

```
findOrCreateDmGroup(tenantId, userIds)
  → Result<DmGroup>
```
Compute the `group_hash` from the sorted user IDs. If a `dm_group` with that hash exists in the tenant, return it. Otherwise create a new `dm_group` and its `dm_group_member` rows, then return it.

```
getUnreadCounts(tenantId, userId)
  → Result<UnreadCounts>
```
Return unread message counts grouped by: channels (per channel+topic), DMs (per dm_group), mentions, and total. A message is unread if no `"read"` flag row exists for the user.

```
getMessageSummary(tenantId, narrow)
  → Result<MessageSummary[]>
```
Return condensed summaries for messages matching the given narrow. Each summary includes the message ID, sender ID, timestamp, and a truncated snippet of content. Used by the `/api/v1/messages/summary` endpoint.

```
createMessageReport(tenantId, messageId, userId, reason)
  → Result<void>
```
Insert a moderation report row linking the reporting user to the target message with a reason string. Used by the `/api/v1/messages/{message_id}/report` endpoint.

## Domain Functions

### sendMessage

Validate that the sender has permission to post to the target channel+topic or DM group. For DMs, call `findOrCreateDmGroup` to resolve or create the group. Render the markdown content to HTML. Detect links, images, and attachments in the rendered output. Scan content for @-mentions and alert words to determine which flags to create for recipients. Persist the message via the repository. Create `"mentioned"` and `"wildcard_mentioned"` flag rows for mentioned users. Emit a `message` event.

### editMessage

Validate that the requesting user is allowed to edit the message (own messages within the time window, or admins for any message). If content is being changed, re-render markdown to HTML. If topic or channel is being changed, validate the user has permission for the move. Insert a `message_edit_history` row capturing the previous values. Update the message via the repository. Emit an `update_message` event.

### deleteMessage

Validate that the requesting user is allowed to delete the message (own messages within the time window, or admins for any message). Delete the message via the repository. Emit a `delete_message` event containing the message_id, channel_id, and topic so clients can update their views.

### updateMessageFlags

Process batch flag add/remove requests. For the explicit message ID list variant, call `addMessageFlags` or `removeMessageFlags`. For the narrow variant, call `addMessageFlagsByNarrow`. Emit an `update_message_flags` event with the flag, operation, and affected message IDs.

### renderMarkdown

Convert Zulip-flavored markdown to HTML. Supported syntax:
- **@-mentions**: `@**User Name**` and `@*group*` resolved to user/group IDs
- **Emoji shortcodes**: `:emoji_name:` resolved to Unicode or custom emoji
- **Links**: auto-linked URLs and `[text](url)` syntax
- **Code blocks**: fenced with language-specific syntax highlighting placeholders
- **Block quotes**, **bold**, **italic**, **strikethrough**, **lists**, **headings**
- **LaTeX**: `$$math$$` blocks
- **Spoilers**: `:::spoiler` blocks

Returns rendered HTML and metadata (mentions found, alert words matched, links/images/attachments detected).

### buildNarrowQuery

Convert an array of narrow operator objects into SQL query conditions. Each operator maps to specific WHERE clauses and JOINs:
- `channel`/`stream` -> WHERE channel_id = ?
- `topic` -> WHERE topic = ?
- `sender` -> WHERE sender_id = ?
- `dm`/`pm-with` -> resolve user IDs to dm_group_id, WHERE dm_group_id = ?
- `dm-including` -> JOIN dm_group_member WHERE user_id = ?
- `is` -> JOIN message_flag or check message fields
- `has` -> WHERE has_link/has_image/has_attachment = 1, or JOIN reaction
- `search` -> full-text search on content
- `near` -> sets the anchor for pagination
- `id` -> WHERE id = ?
- `negated` operators invert the condition with NOT

Multiple operators are combined with AND. Returns the composed query.

### checkMessageMatchesNarrow

Evaluate whether a set of message IDs match a given narrow. Used by the `matches_narrow` endpoint to let clients verify filter results. Returns a map of message ID to boolean.

### getMessageSummary

Accept a narrow and return condensed summaries for matching messages. Each summary includes the message ID, sender, timestamp, and a truncated content snippet. Validate that the requesting user has access to the messages covered by the narrow. Delegate to the repository's `getMessageSummary` to fetch results.

### processZcommand

Parse and execute a slash command string. Supported commands:
- `/me <status>` — set a status message for the user
- `/dark` — switch the client to dark theme
- `/light` — switch the client to light theme
- `/fluid-width` — switch the client to fluid-width display mode
- `/fixed-width` — switch the client to fixed-width display mode

Validate that the command is recognized. For `/me`, persist the status text on the user profile. For theme/layout commands, return the result to the client without server-side persistence (client-interpreted). Return an error for unrecognized commands.

### reportMessage

Validate that the target message exists and that the requesting user has access to it. Create a moderation report via the repository's `createMessageReport` with the user ID, message ID, and reason. Emit a `message_reported` event so moderation tooling can act on the report.

## Events

### `message`

Emitted when a new message is sent. Contains the full message object including:
- `id`, `sender_id`, `type`, `content`, `rendered_content`, `subject` (topic)
- `display_recipient`: channel name (for stream messages) or list of user objects (for DMs)
- `avatar_url`: sender's avatar
- `timestamp`: Unix seconds (Zulip convention for event timestamps)
- `flags`: list of flags applicable to the receiving user (e.g., `["mentioned"]`)
- `message_id`: same as `id` (Zulip convention)

### `update_message`

Emitted when a message is edited. Contains:
- `message_id`: the edited message ID
- `edit_timestamp`: Unix seconds when the edit occurred
- `user_id`: the user who made the edit
- `rendering_only`: boolean, true if only the rendering changed (no user-visible edit)
- `content`: new markdown content (if content changed)
- `rendered_content`: new HTML (if content changed)
- `orig_content`: previous markdown (if content changed)
- `orig_rendered_content`: previous HTML (if content changed)
- `subject`: new topic (if topic changed)
- `orig_subject`: previous topic (if topic changed)
- `stream_id`: new channel ID (if message was moved)
- `new_stream_id`: same as `stream_id` for moves
- `propagate_mode`: `"change_one"`, `"change_later"`, or `"change_all"` (for topic/channel moves)

### `delete_message`

Emitted when a message is deleted. Contains:
- `message_id`: the deleted message ID
- `message_type`: `"stream"` or `"private"`
- `stream_id`: channel ID (if it was a channel message)
- `topic`: topic name (if it was a channel message)

### `update_message_flags`

Emitted when flags are added or removed. Contains:
- `type`: `"update_message_flags"`
- `op`: `"add"` or `"remove"`
- `operation`: same as `op` (Zulip includes both)
- `flag`: the flag name (e.g., `"read"`, `"starred"`)
- `messages`: array of affected message IDs
- `all`: boolean, true if the operation applied to all messages (mark all as read)

### `message_reported`

Emitted when a message is reported for moderation. Contains:
- `message_id`: the reported message ID
- `reporter_user_id`: the user who filed the report
- `reason`: the reason string provided by the reporter
- `timestamp`: Unix seconds when the report was created
