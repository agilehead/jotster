# 12 - Typing Indicators

## Overview

The typing indicators module notifies users in a conversation when someone is composing a message. Typing status is entirely ephemeral -- nothing is persisted to the database. When a user starts or stops typing, an event is dispatched directly to the relevant users' event queues.

Zulip clients are expected to send a "start" notification when the user begins typing and periodically re-send it while typing continues. A "stop" notification is sent when the user stops typing or navigates away. The server also provides timing configuration constants so clients know how often to re-send and when to expire stale typing indicators.

Typing indicators work for both direct messages (DMs) and channel messages (with topic granularity).

Package: `presence`

## API Endpoints

| Method | Path               | Auth Required | Description                                           |
| ------ | ------------------ | ------------- | ----------------------------------------------------- |
| `POST` | `/api/v1/typing`   | Yes           | Notify that the user started or stopped typing        |
| `POST` | `/api/v1/messages/{message_id}/typing` | Yes | Set typing status for message editing            |

### Endpoint Details

#### POST /api/v1/typing

Sends a typing notification to the relevant conversation participants.

**Request (form-encoded):**

| Parameter   | Type   | Required    | Description                                                                 |
| ----------- | ------ | ----------- | --------------------------------------------------------------------------- |
| `op`        | string | Yes         | `"start"` or `"stop"`                                                       |
| `type`      | string | No          | `"direct"` (alias `"private"`) for DMs, `"channel"` (alias `"stream"`) for channel messages. Defaults to `"direct"` if not specified. |
| `to`        | string | Conditional | JSON array of user IDs -- required when `type` is `"direct"`                |
| `stream_id` | string | Conditional | Channel ID -- required when `type` is `"channel"`                           |
| `topic`     | string | Conditional | Topic name -- required when `type` is `"channel"`                           |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 400 if `op` is not `"start"` or `"stop"`.
- 400 if `type` is `"direct"` and `to` is missing or empty.
- 400 if `type` is `"channel"` and `stream_id` or `topic` is missing.
- 400 if any user ID in `to` does not exist.
- 403 if the user does not have access to the specified channel.

#### POST /api/v1/messages/{message_id}/typing

Sets typing status for message editing. When a user is editing an existing message, this endpoint notifies others that the message is being edited.

**Request (form-encoded):**

| Parameter    | Type   | Required | Description                                                    |
| ------------ | ------ | -------- | -------------------------------------------------------------- |
| `op`         | string | Yes      | `"start"` or `"stop"`                                          |

The `message_id` path parameter identifies which message is being edited.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 400 if `op` is not `"start"` or `"stop"`.
- 404 if the message does not exist.
- 403 if the user does not have permission to edit the message.

### Typing Timing Configuration

These constants are returned in the `POST /api/v1/register` response (event queue registration) so clients can calibrate their typing indicator behavior:

| Constant                                          | Default (ms) | Description                                                        |
| ------------------------------------------------- | ------------ | ------------------------------------------------------------------ |
| `server_typing_started_wait_period_milliseconds`  | 10000        | How often the client should re-send `"start"` while still typing   |
| `server_typing_stopped_wait_period_milliseconds`  | 5000         | Delay after last keystroke before the client sends `"stop"`        |
| `server_typing_started_expiry_period_milliseconds`| 15000        | How long a `"start"` event is considered valid without renewal     |

Clients use these values to determine:
1. While the user is actively typing, re-send `"start"` every `started_wait_period` milliseconds.
2. After the user stops pressing keys, wait `stopped_wait_period` milliseconds and then send `"stop"`.
3. If a client receives a `"start"` event and does not receive a renewal or `"stop"` within `started_expiry_period`, it should locally expire the typing indicator.

## Data Model

This module has **no database tables**. Typing indicators are entirely ephemeral -- events are dispatched directly to user event queues without any persistence.

## Repository Interface

None. No persistence is needed for typing indicators.

## Domain Functions

### sendTypingNotification

```
sendTypingNotification(
  eventQueue: IEventQueueService,
  channelRepo: IChannelRepository,
  userRepo: IUserRepository,
  tenantId: string,
  senderId: string,
  op: string,
  type: string,
  to: string[] | null,
  channelId: string | null,
  topic: string | null
) -> Result<void>
```

1. Validate that `op` is `"start"` or `"stop"`.
2. Normalize `type`: accept `"private"` as an alias for `"direct"`, and `"stream"` as an alias for `"channel"`. Default to `"direct"` if not specified.
3. **For direct messages** (`type = "direct"`):
   a. Validate that `to` is provided and non-empty.
   b. Validate that all user IDs in `to` exist and belong to the tenant.
   c. The recipients of the typing event are the user IDs in `to` (excluding the sender).
   d. Dispatch the typing event to each recipient's event queue.
4. **For channel messages** (`type = "channel"`):
   a. Validate that `channelId` and `topic` are provided.
   b. Fetch the channel and verify it exists and belongs to the tenant.
   c. Verify the sender has access to the channel (is subscribed, or channel is public).
   d. The recipients are all users subscribed to the channel (excluding the sender).
   e. Dispatch the typing event to each recipient's event queue.
5. Return success. The sender does not receive their own typing event.

## Events

### `typing` with `op: "start"`

Emitted when a user starts typing in a conversation. Delivered to all other participants in the conversation.

**Payload for direct messages:**

```json
{
  "type": "typing",
  "op": "start",
  "message_type": "direct",
  "sender": {
    "user_id": "u_abc123",
    "email": "user@example.com"
  },
  "recipients": [
    { "user_id": "u_abc123", "email": "user@example.com" },
    { "user_id": "u_def456", "email": "other@example.com" }
  ]
}
```

**Payload for channel messages:**

```json
{
  "type": "typing",
  "op": "start",
  "message_type": "channel",
  "sender": {
    "user_id": "u_abc123",
    "email": "user@example.com"
  },
  "stream_id": "ch_xyz789",
  "topic": "bug reports"
}
```

### `typing` with `op: "stop"`

Emitted when a user stops typing. Same structure as `op: "start"` but with `"op": "stop"`.

**Payload for direct messages:**

```json
{
  "type": "typing",
  "op": "stop",
  "message_type": "direct",
  "sender": {
    "user_id": "u_abc123",
    "email": "user@example.com"
  },
  "recipients": [
    { "user_id": "u_abc123", "email": "user@example.com" },
    { "user_id": "u_def456", "email": "other@example.com" }
  ]
}
```

**Payload for channel messages:**

```json
{
  "type": "typing",
  "op": "stop",
  "message_type": "channel",
  "sender": {
    "user_id": "u_abc123",
    "email": "user@example.com"
  },
  "stream_id": "ch_xyz789",
  "topic": "bug reports"
}
```

**Notes:**

- The `recipients` array in DM typing events includes all participants in the DM conversation (including the sender), matching Zulip's convention. However, the event is only delivered to participants other than the sender.
- For channel typing events, the `recipients` field is omitted. Instead, `stream_id` and `topic` identify the conversation. The server determines the recipient list from channel subscribers.
- The `message_type` field uses `"direct"` (not `"private"`) in Zulip 11.x, though older clients may still send `"private"` which is accepted as an alias.
