# 13 - Muting

## Overview

The muting module provides two distinct but related features: user muting and topic visibility policies. User muting allows a user to hide all messages from a specific user. Topic visibility policies allow fine-grained control over notifications and visibility for individual topics within channels.

**User muting**: When user A mutes user B, messages from user B are hidden in user A's views. Muted users are not notified that they have been muted. The muted user can still send messages and interact normally -- the muting is entirely client-side filtering driven by the muted users list.

**Topic visibility policies**: Users can set per-topic policies that override the channel's default behavior. This is used to mute noisy topics, explicitly unmute topics in a muted channel, or follow topics to receive notifications for every new message.

Package: `notifications`

## API Endpoints

| Method   | Path                                              | Auth Required | Description                                        |
| -------- | ------------------------------------------------- | ------------- | -------------------------------------------------- |
| `POST`   | `/api/v1/users/me/muted_users/{muted_user_id}`   | Yes           | Mute a user                                        |
| `DELETE` | `/api/v1/users/me/muted_users/{muted_user_id}`   | Yes           | Unmute a user                                      |
| `POST`   | `/api/v1/user_topics`                             | Yes           | Set topic visibility policy                        |
| `PATCH`  | `/api/v1/users/me/subscriptions/muted_topics`     | Yes           | Legacy endpoint for muting/unmuting topics         |

### Endpoint Details

#### POST /api/v1/users/me/muted_users/{muted_user_id}

Mutes a user. The `muted_user_id` is provided as a path parameter.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 400 if the user tries to mute themselves.
- 400 if the target user is already muted.
- 400 if the target user does not exist in the tenant.

#### DELETE /api/v1/users/me/muted_users/{muted_user_id}

Unmutes a previously muted user.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 400 if the target user is not currently muted.

#### POST /api/v1/user_topics

Sets the visibility policy for a specific topic in a channel.

**Request (form-encoded):**

| Parameter           | Type   | Required | Description                                             |
| ------------------- | ------ | -------- | ------------------------------------------------------- |
| `stream_id`         | string | Yes      | Channel ID                                              |
| `topic`             | string | Yes      | Topic name                                              |
| `visibility_policy` | int    | Yes      | Policy value: 0=inherit, 1=muted, 2=unmuted, 3=followed |

**Topic visibility policies:**

| Value | Name      | Description                                                            |
| ----- | --------- | ---------------------------------------------------------------------- |
| 0     | INHERIT   | Use channel default. Setting this deletes the row (no override).       |
| 1     | MUTED     | Topic is muted; no notifications, hidden in default views.             |
| 2     | UNMUTED   | Explicitly unmuted; overrides a muted channel subscription.            |
| 3     | FOLLOWED  | Followed topic; receive notifications for all new messages in topic.   |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error cases:**
- 400 if `visibility_policy` is not 0, 1, 2, or 3.
- 400 if the channel does not exist.
- 400 if the user does not have access to the channel.

#### PATCH /api/v1/users/me/subscriptions/muted_topics

Legacy endpoint for backward compatibility. Supports muting and unmuting topics using the older API format.

**Request (form-encoded):**

| Parameter | Type   | Required    | Description                                                    |
| --------- | ------ | ----------- | -------------------------------------------------------------- |
| `op`      | string | Yes         | `"add"` (mute topic) or `"remove"` (unmute topic)             |
| `stream`  | string | Conditional | Channel name (one of `stream` or `stream_id` must be provided) |
| `stream_id`| string | Conditional | Channel ID                                                    |
| `topic`   | string | Yes         | Topic name                                                     |

This endpoint maps to the modern `POST /user_topics` endpoint:
- `op: "add"` sets `visibility_policy = 1` (MUTED).
- `op: "remove"` sets `visibility_policy = 0` (INHERIT), which deletes the override.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

## Data Model

### `muted_user`

Tracks which users a given user has muted.

| Column          | Type    | Constraints                            | Description                              |
| --------------- | ------- | -------------------------------------- | ---------------------------------------- |
| `id`            | TEXT    | PK                                     | System-generated nanoid                  |
| `tenant_id`     | TEXT    | NOT NULL, FK -> tenant                 | Tenant scope                             |
| `user_id`       | TEXT    | NOT NULL, FK -> user                   | The user who is doing the muting         |
| `muted_user_id` | TEXT    | NOT NULL, FK -> user                   | The user being muted                     |
| `created_at`    | INTEGER | NOT NULL                               | Unix milliseconds                        |

**Indexes:**

| Name                            | Columns                                    | Purpose                                       |
| ------------------------------- | ------------------------------------------ | --------------------------------------------- |
| uq_muted_user_pair              | (tenant_id, user_id, muted_user_id)        | UNIQUE -- prevents duplicate mute entries      |
| ix_muted_user_user              | (tenant_id, user_id)                       | Fetch all muted users for a given user         |

### `user_topic`

Stores per-user visibility policies for specific topics within channels.

| Column              | Type    | Constraints                            | Description                                              |
| ------------------- | ------- | -------------------------------------- | -------------------------------------------------------- |
| `id`                | TEXT    | PK                                     | System-generated nanoid                                  |
| `tenant_id`         | TEXT    | NOT NULL, FK -> tenant                 | Tenant scope                                             |
| `user_id`           | TEXT    | NOT NULL, FK -> user                   | The user who set the policy                              |
| `channel_id`        | TEXT    | NOT NULL, FK -> channel                | The channel containing the topic                         |
| `topic`             | TEXT    | NOT NULL                               | Topic name                                               |
| `visibility_policy` | INTEGER | NOT NULL                               | 0=inherit, 1=muted, 2=unmuted, 3=followed               |
| `updated_at`        | INTEGER | NOT NULL                               | Unix milliseconds of the last policy change              |

**Indexes:**

| Name                                | Columns                                        | Purpose                                                  |
| ----------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| uq_user_topic_unique                | (tenant_id, user_id, channel_id, topic)        | UNIQUE -- one policy per user per topic                  |
| ix_user_topic_user                  | (tenant_id, user_id)                           | Fetch all topic policies for a user                      |
| ix_user_topic_channel               | (tenant_id, channel_id, topic)                 | Fetch all user policies for a specific topic             |

**Notes:**

- Rows with `visibility_policy = 0` (INHERIT) are deleted rather than stored. Setting a policy to INHERIT is equivalent to removing the override.
- The `topic` column stores the exact topic string. Topic matching is case-sensitive, consistent with Zulip's behavior.

## Repository Interface

```
getMutedUsers(tenantId: string, userId: string)
  -> Result<MutedUser[]>
```
Fetch all muted user records for the given user. Returns the muted user entries including `muted_user_id` and `created_at`.

```
muteUser(tenantId: string, userId: string, mutedUserId: string, createdAt: int64)
  -> Result<void>
```
Insert a new muted user record. Fails if the unique constraint is violated (already muted).

```
unmuteUser(tenantId: string, userId: string, mutedUserId: string)
  -> Result<void>
```
Delete the muted user record matching the given (user, muted_user) pair. Fails if no matching record exists.

```
getUserTopics(tenantId: string, userId: string)
  -> Result<UserTopic[]>
```
Fetch all topic visibility policies for the given user. Returns entries including `channel_id`, `topic`, `visibility_policy`, and `updated_at`.

```
setUserTopicPolicy(tenantId: string, userId: string, channelId: string, topic: string, visibilityPolicy: int, updatedAt: int64)
  -> Result<void>
```
Upsert a topic visibility policy. If `visibilityPolicy` is 0 (INHERIT), delete the existing row instead. Otherwise, insert or update the row.

## Domain Functions

### muteUser

```
muteUser(
  repo: IMutingRepository,
  userRepo: IUserRepository,
  tenantId: string,
  userId: string,
  mutedUserId: string
) -> Result<void>
```

1. Validate that the user is not trying to mute themselves. Return error if `userId == mutedUserId`.
2. Validate that the target user exists in the tenant.
3. Check that the target user is not already muted by this user.
4. Persist the muted user record via the repository.
5. Emit a `muted_users` event to the muting user's event queues so all their clients update.

### unmuteUser

```
unmuteUser(
  repo: IMutingRepository,
  tenantId: string,
  userId: string,
  mutedUserId: string
) -> Result<void>
```

1. Verify that a muted user record exists for this (user, muted_user) pair. Return error if not found.
2. Delete the muted user record via the repository.
3. Emit a `muted_users` event to the user's event queues.

### setTopicVisibility

```
setTopicVisibility(
  repo: IMutingRepository,
  channelRepo: IChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string,
  topic: string,
  visibilityPolicy: int
) -> Result<void>
```

1. Validate that `visibilityPolicy` is 0, 1, 2, or 3.
2. Fetch the channel and verify it exists and belongs to the tenant.
3. Verify the user has access to the channel (subscribed to private channel, or channel is public).
4. If `visibilityPolicy` is 0 (INHERIT), delete any existing row for this (user, channel, topic). This removes the override so the channel default applies.
5. Otherwise, upsert the policy via the repository.
6. Emit a `user_topic` event to the user's event queues.

### getEffectiveTopicVisibility

```
getEffectiveTopicVisibility(
  userTopics: UserTopic[],
  channelId: string,
  topic: string,
  isChannelMuted: boolean
) -> string
```

Pure function that computes the effective visibility for a topic given the user's policies:
1. Look up the user's policy for this (channel, topic). If no policy exists, the effective policy is INHERIT.
2. If INHERIT: the topic inherits the channel's mute status. If the channel subscription is muted, the topic is effectively muted. Otherwise, it is normal.
3. If MUTED: the topic is muted regardless of channel status.
4. If UNMUTED: the topic is unmuted regardless of channel status (overrides a muted channel).
5. If FOLLOWED: the topic is followed (implies unmuted, with enhanced notifications).

## Events

### `muted_users`

Emitted when the user's muted users list changes (user muted or unmuted). Delivered only to the user who performed the action (all their connected clients).

**Payload:**

```json
{
  "type": "muted_users",
  "muted_users": [
    { "id": "u_def456", "timestamp": 1739800000 },
    { "id": "u_ghi789", "timestamp": 1739750000 }
  ]
}
```

The payload contains the complete list of currently muted users (not a diff). Each entry includes the muted user's ID and the timestamp when they were muted (Unix seconds).

### `user_topic`

Emitted when a topic visibility policy is changed. Delivered to the user who set the policy (all their connected clients).

**Payload:**

```json
{
  "type": "user_topic",
  "stream_id": "ch_abc123",
  "topic_name": "release planning",
  "last_updated": 1739800000,
  "visibility_policy": 1
}
```

**Notes:**

- The `stream_id` field uses the Zulip wire format name (not `channel_id`).
- The `last_updated` timestamp is Unix seconds (not milliseconds), matching Zulip's convention for event timestamps.
- When a policy is set to INHERIT (0), the event still fires with `visibility_policy: 0` so clients know to remove their local override.
