# Channels Module

## Overview

Channels (historically called "streams" in Zulip) are the primary organizational unit for conversations in Jotster. Messages are posted to a channel with a topic, forming threaded discussions. Channels can be public (visible and joinable by any user in the tenant), private (invite-only), or web-public (readable without authentication).

Zulip's API uses "stream" terminology in URL paths and parameter names for backward compatibility, while the user-facing terminology has moved to "channels." Jotster maintains this same convention -- the API surface uses `stream_id` and `/streams/` paths, but the internal data model and code use "channel."

Topics are not a separate table. A topic is simply the `topic` string column on the `message` table. The "get topics" endpoint queries distinct topic values from messages within a channel, sorted by the most recent message in each topic.

## API Endpoints

### Zulip-Compatible Endpoints

| Method   | Path                                        | Auth Required | Description                                        |
| -------- | ------------------------------------------- | ------------- | -------------------------------------------------- |
| `GET`    | `/api/v1/streams`                           | Yes           | Get all channels visible to the authenticated user |
| `POST`   | `/api/v1/channels/create`                   | Yes           | Create a new channel                               |
| `GET`    | `/api/v1/streams/{stream_id}`               | Yes           | Get a single channel by ID                         |
| `PATCH`  | `/api/v1/streams/{stream_id}`               | Yes           | Update channel properties                          |
| `DELETE` | `/api/v1/streams/{stream_id}`               | Yes           | Archive a channel                                  |
| `GET`    | `/api/v1/get_stream_id`                     | Yes           | Look up a channel ID by name                       |
| `GET`    | `/api/v1/users/me/{stream_id}/topics`       | Yes           | List topics in a channel sorted by recency         |
| `POST`   | `/api/v1/streams/{stream_id}/delete_topic`  | Yes           | Delete all messages in a topic                     |
| `GET`    | `/api/v1/streams/{stream_id}/members`       | Yes           | List subscribers of a channel                      |
| `GET`    | `/api/v1/streams/{stream_id}/email_address` | Yes           | Get the channel's email gateway address            |
| `POST`   | `/api/v1/default_streams`                           | Yes           | Add a channel as a default channel (new users auto-subscribe) |
| `DELETE` | `/api/v1/default_streams`                           | Yes           | Remove a channel from defaults                     |
| `POST`   | `/api/v1/default_stream_groups/create`              | Yes           | Create a default stream group                      |
| `PATCH`  | `/api/v1/default_stream_groups/{group_id}`          | Yes           | Update default stream group info                   |
| `DELETE` | `/api/v1/default_stream_groups/{group_id}`          | Yes           | Remove a default stream group                      |
| `PATCH`  | `/api/v1/default_stream_groups/{group_id}/streams`  | Yes           | Update streams in a default group                  |

### Endpoint Details

#### GET /api/v1/streams

Returns all channels visible to the authenticated user. Admins see all channels including private ones they are not subscribed to (with a flag indicating limited access). Regular users see all public channels and private channels they are subscribed to.

**Query Parameters:**

| Parameter          | Type | Required | Default | Description                               |
| ------------------ | ---- | -------- | ------- | ----------------------------------------- |
| `include_archived` | int  | No       | 0       | Whether to include archived channels (0/1)|

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "streams": [
    {
      "stream_id": "ch_abc123",
      "name": "general",
      "description": "General discussion",
      "rendered_description": "<p>General discussion</p>",
      "invite_only": false,
      "is_web_public": false,
      "history_public_to_subscribers": true,
      "creator_id": "u_xyz789",
      "date_created": 1739800000,
      "first_message_id": "msg_001",
      "message_retention_days": null,
      "is_archived": false,
      "stream_weekly_traffic": null
    }
  ]
}
```

Note: The response uses `stream_id` and `invite_only` (not `channel_id` and `is_private`) to match Zulip's wire format. The `date_created` field is Unix seconds (not milliseconds) per Zulip convention. The handler converts from internal milliseconds to seconds.

#### POST /api/v1/channels/create

Creates a new channel. The authenticated user must have permission to create channels (controlled by organization settings). The creator is automatically subscribed.

**Request (JSON):**

```json
{
  "subscriptions": [{"name": "engineering", "description": "Engineering team"}],
  "invite_only": false,
  "is_web_public": false,
  "history_public_to_subscribers": true,
  "message_retention_days": null,
  "announce": true
}
```

The `subscriptions` array must contain exactly one entry when creating a channel. The `name` field is required; `description` is optional.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subscribed": { "user@example.com": ["engineering"] },
  "already_subscribed": {},
  "unauthorized": []
}
```

#### GET /api/v1/streams/{stream_id}

Returns a single channel. The user must be able to see the channel (public, or private and subscribed, or admin).

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "stream": { ... }
}
```

The `stream` object has the same shape as entries in the `GET /api/v1/streams` response.

#### PATCH /api/v1/streams/{stream_id}

Updates channel properties. Requires admin or channel owner permissions.

**Request (JSON):**

| Parameter                        | Type    | Required | Description                                     |
| -------------------------------- | ------- | -------- | ----------------------------------------------- |
| `description`                    | string  | No       | New description                                 |
| `new_name`                       | string  | No       | New channel name (must be unique within tenant)  |
| `is_private`                     | boolean | No       | Change channel visibility                        |
| `is_web_public`                  | boolean | No       | Change web-public status                         |
| `history_public_to_subscribers`  | boolean | No       | Change history visibility for subscribers        |
| `message_retention_days`         | int     | No       | Set retention policy (null for org default)       |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### DELETE /api/v1/streams/{stream_id}

Archives a channel. Requires admin permissions. The channel is soft-deleted (marked as archived) rather than physically removed. Archived channels do not appear in default listings and cannot receive new messages.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

#### GET /api/v1/get_stream_id

Looks up a channel ID by name.

**Query Parameters:**

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `stream`  | string | Yes      | Channel name   |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "stream_id": "ch_abc123"
}
```

**Error (404):** Channel with that name does not exist or is not visible to the user.

#### GET /api/v1/users/me/{stream_id}/topics

Returns all topics in a channel, sorted by the most recent message in each topic (descending). The user must be subscribed to the channel or the channel must be public.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "topics": [
    { "name": "bug reports", "max_id": "msg_999" },
    { "name": "release planning", "max_id": "msg_850" }
  ]
}
```

The `max_id` is the ID of the most recent message in that topic. Topics are derived from the `message` table -- there is no separate topic table.

#### POST /api/v1/streams/{stream_id}/delete_topic

Deletes all messages in a topic within the channel. Requires admin permissions or the `can_delete_any_message` permission.

**Request (form-encoded):**

| Parameter    | Type   | Required | Description        |
| ------------ | ------ | -------- | ------------------ |
| `topic_name` | string | Yes      | Topic to delete    |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "complete": true
}
```

The `complete` field indicates whether all messages were deleted. For topics with very many messages, the server may delete in batches and return `complete: false`, requiring the client to call the endpoint again.

#### GET /api/v1/streams/{stream_id}/members

Returns the user IDs of all subscribers to the channel. Requires the user to be subscribed (for private channels) or the channel to be public.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subscribers": ["u_abc123", "u_def456"]
}
```

#### GET /api/v1/streams/{stream_id}/email_address

Returns the email address that can be used to post messages to the channel via email. Requires the user to be subscribed.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "email_address": "engineering.abc123@streams.jotster.example"
}
```

#### POST /api/v1/default_streams

Adds a channel as a default channel. New users who join the tenant will be automatically subscribed to all default channels. Requires admin permissions.

**Request (JSON):**

| Parameter   | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| `stream_id` | string | Yes      | ID of the channel to mark as default |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Channel is already a default channel.
**Error (404):** Channel does not exist.

#### DELETE /api/v1/default_streams

Removes a channel from the set of default channels. Existing subscriptions are not affected. Requires admin permissions.

**Request (JSON):**

| Parameter   | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| `stream_id` | string | Yes      | ID of the channel to remove from defaults    |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Channel is not a default channel.
**Error (404):** Channel does not exist.

#### POST /api/v1/default_stream_groups/create

Creates a new default stream group. Default stream groups organize default channels into named collections presented to new users during onboarding. Requires admin permissions.

**Request (JSON):**

| Parameter     | Type     | Required | Description                                      |
| ------------- | -------- | -------- | ------------------------------------------------ |
| `group_name`  | string   | Yes      | Name of the group (must be unique within tenant)  |
| `description` | string   | No       | Description of the group (defaults to "")         |
| `stream_ids`  | string[] | Yes      | IDs of channels to include in the group           |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Group name already exists, or one or more stream IDs are invalid.

#### PATCH /api/v1/default_stream_groups/{group_id}

Updates the name and/or description of a default stream group. Requires admin permissions.

**Request (JSON):**

| Parameter     | Type   | Required | Description            |
| ------------- | ------ | -------- | ---------------------- |
| `group_name`  | string | No       | New name for the group |
| `description` | string | No       | New description        |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** New group name conflicts with an existing group.
**Error (404):** Group does not exist.

#### DELETE /api/v1/default_stream_groups/{group_id}

Removes a default stream group. The channels within the group are not affected -- they remain as channels but are no longer part of this group. Requires admin permissions.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (404):** Group does not exist.

#### PATCH /api/v1/default_stream_groups/{group_id}/streams

Updates the set of channels in a default stream group by adding and/or removing channels. Requires admin permissions.

**Request (JSON):**

| Parameter | Type     | Required | Description                                |
| --------- | -------- | -------- | ------------------------------------------ |
| `add`     | string[] | No       | Channel IDs to add to the group            |
| `remove`  | string[] | No       | Channel IDs to remove from the group       |

At least one of `add` or `remove` must be provided.

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** One or more channel IDs are invalid, or a channel to add is already in the group, or a channel to remove is not in the group.
**Error (404):** Group does not exist.

## Data Model

### channel

Stores channel definitions. Each channel belongs to a tenant and has a unique name within that tenant.

| Column                           | Type    | Constraints                     | Description                                           |
| -------------------------------- | ------- | ------------------------------- | ----------------------------------------------------- |
| `id`                             | TEXT    | PK                              | System-generated nanoid                               |
| `tenant_id`                      | TEXT    | NOT NULL, FK -> tenant          | Owning tenant                                         |
| `name`                           | TEXT    | NOT NULL                        | Channel display name, unique per tenant               |
| `description`                    | TEXT    | NOT NULL DEFAULT ''             | Plain-text description                                |
| `rendered_description`           | TEXT    | NOT NULL DEFAULT ''             | HTML-rendered description                             |
| `is_private`                     | INTEGER | NOT NULL DEFAULT 0              | Boolean 0/1; invite-only when 1                       |
| `is_web_public`                  | INTEGER | NOT NULL DEFAULT 0              | Boolean 0/1; readable without auth when 1             |
| `history_public_to_subscribers`  | INTEGER | NOT NULL DEFAULT 1              | Boolean 0/1; new subscribers can see old messages     |
| `creator_id`                     | TEXT    | NULL, FK -> user                | User who created the channel; null for system-created |
| `message_retention_days`         | INTEGER | NULL                            | Custom retention; null means use org default          |
| `first_message_id`              | TEXT    | NULL                            | ID of the first message ever posted to this channel   |
| `is_archived`                    | INTEGER | NOT NULL DEFAULT 0              | Boolean 0/1; archived channels are soft-deleted       |
| `created_at`                     | INTEGER | NOT NULL                        | Unix milliseconds                                     |
| `updated_at`                     | INTEGER | NOT NULL                        | Unix milliseconds                                     |

**Indexes:**

- `ix_channel_tenant_name` UNIQUE on `(tenant_id, name)` -- enforces unique channel names per tenant and supports name lookup.
- `ix_channel_tenant_archived` on `(tenant_id, is_archived)` -- supports filtered listing of active channels.

**Notes:**

- Topics are NOT a separate table. A topic is the `topic` column on the `message` table. The "get topics" endpoint queries `SELECT DISTINCT topic, MAX(id) AS max_id FROM message WHERE channel_id = ? GROUP BY topic ORDER BY max_id DESC`.
- Archiving a channel sets `is_archived = 1` and `updated_at` to the current time. Messages are retained for historical access.
- The `first_message_id` is set when the first message is posted to the channel and never updated afterward.

### default_channel

Tracks which channels are designated as defaults for a tenant. New users joining the tenant are automatically subscribed to all default channels.

| Column       | Type    | Constraints                     | Description                        |
| ------------ | ------- | ------------------------------- | ---------------------------------- |
| `id`         | TEXT    | PK                              | System-generated nanoid            |
| `tenant_id`  | TEXT    | NOT NULL, FK -> tenant          | Owning tenant                      |
| `channel_id` | TEXT    | NOT NULL, FK -> channel         | The channel marked as default      |
| `created_at` | INTEGER | NOT NULL                        | Unix milliseconds                  |

**Indexes:**

- `uq_default_channel_tenant_channel` UNIQUE on `(tenant_id, channel_id)` -- each channel can be a default at most once per tenant.

### default_channel_group

Named groupings of default channels, presented to new users during onboarding to let them choose which sets of channels to subscribe to.

| Column        | Type    | Constraints                     | Description                        |
| ------------- | ------- | ------------------------------- | ---------------------------------- |
| `id`          | TEXT    | PK                              | System-generated nanoid            |
| `tenant_id`   | TEXT    | NOT NULL, FK -> tenant          | Owning tenant                      |
| `name`        | TEXT    | NOT NULL                        | Group display name                 |
| `description` | TEXT    | NOT NULL DEFAULT ''             | Group description                  |
| `created_at`  | INTEGER | NOT NULL                        | Unix milliseconds                  |

**Indexes:**

- `uq_default_channel_group_tenant_name` UNIQUE on `(tenant_id, name)` -- group names are unique per tenant.

### default_channel_group_item

Join table linking channels to default channel groups.

| Column                     | Type | Constraints                              | Description                            |
| -------------------------- | ---- | ---------------------------------------- | -------------------------------------- |
| `default_channel_group_id` | TEXT | NOT NULL, FK -> default_channel_group    | The group this item belongs to         |
| `channel_id`               | TEXT | NOT NULL, FK -> channel                  | The channel included in the group      |

**Primary Key:** `(default_channel_group_id, channel_id)`

## Repository Interface

### IChannelRepository

```
getAllChannels(tenantId: string, includeArchived: boolean) -> Result<Channel[]>
```
Returns all channels for the tenant. When `includeArchived` is false, filters out channels where `is_archived = 1`.

```
getChannelById(tenantId: string, channelId: string) -> Result<Channel | null>
```
Returns a single channel by ID within the tenant, or null if not found.

```
getChannelByName(tenantId: string, name: string) -> Result<Channel | null>
```
Returns a single channel by name within the tenant, or null if not found. Used by the `get_stream_id` endpoint.

```
createChannel(channel: NewChannel) -> Result<Channel>
```
Inserts a new channel record. The `NewChannel` input includes `tenantId`, `name`, `description`, `isPrivate`, `isWebPublic`, `historyPublicToSubscribers`, `creatorId`, and `messageRetentionDays`. The repository generates the `id`, sets `createdAt` and `updatedAt`, and returns the full record.

```
updateChannel(tenantId: string, channelId: string, updates: ChannelUpdate) -> Result<Channel>
```
Applies partial updates to a channel. `ChannelUpdate` may include `name`, `description`, `renderedDescription`, `isPrivate`, `isWebPublic`, `historyPublicToSubscribers`, and `messageRetentionDays`. Sets `updatedAt` to current time.

```
archiveChannel(tenantId: string, channelId: string) -> Result<void>
```
Sets `is_archived = 1` and `updated_at` to the current time for the specified channel.

```
getTopics(tenantId: string, channelId: string) -> Result<{ name: string, maxId: string }[]>
```
Queries distinct topics from the `message` table for the given channel, returning each topic name and the ID of its most recent message, sorted by most recent first.

```
deleteTopicMessages(tenantId: string, channelId: string, topicName: string) -> Result<{ complete: boolean }>
```
Deletes all messages in the specified topic within the channel. May delete in batches; returns `complete: true` if all messages were deleted, `complete: false` if more remain.

```
getSubscribers(tenantId: string, channelId: string) -> Result<string[]>
```
Returns the user IDs of all users subscribed to the channel. Queries the `subscription` table.

```
setFirstMessageId(tenantId: string, channelId: string, messageId: string) -> Result<void>
```
Sets the `first_message_id` on the channel, called when the first message is posted. No-op if already set.

### IDefaultChannelRepository

```
getDefaultChannels(tenantId: string) -> Result<DefaultChannel[]>
```
Returns all default channel records for the tenant.

```
addDefaultChannel(tenantId: string, channelId: string) -> Result<DefaultChannel>
```
Inserts a new default channel record. The repository generates the `id` and sets `createdAt`. Returns an error if the `(tenant_id, channel_id)` pair already exists.

```
removeDefaultChannel(tenantId: string, channelId: string) -> Result<void>
```
Deletes the default channel record for the given tenant and channel. Returns an error if no such record exists.

### IDefaultChannelGroupRepository

```
getDefaultChannelGroups(tenantId: string) -> Result<DefaultChannelGroup[]>
```
Returns all default channel groups for the tenant, including their associated channel IDs.

```
createDefaultChannelGroup(tenantId: string, name: string, description: string, channelIds: string[]) -> Result<DefaultChannelGroup>
```
Creates a new default channel group and inserts the associated channel items. The repository generates the `id` and sets `createdAt`. Returns an error if a group with the same name already exists in the tenant.

```
updateDefaultChannelGroup(tenantId: string, groupId: string, updates: { name?: string, description?: string }) -> Result<DefaultChannelGroup>
```
Updates the name and/or description of a default channel group. Returns an error if the group does not exist or if the new name conflicts with an existing group.

```
deleteDefaultChannelGroup(tenantId: string, groupId: string) -> Result<void>
```
Deletes a default channel group and all its associated items. Returns an error if the group does not exist.

```
addStreamsToDefaultChannelGroup(tenantId: string, groupId: string, channelIds: string[]) -> Result<void>
```
Adds channels to a default channel group by inserting into the `default_channel_group_item` table. Returns an error if the group does not exist or any channel is already in the group.

```
removeStreamsFromDefaultChannelGroup(tenantId: string, groupId: string, channelIds: string[]) -> Result<void>
```
Removes channels from a default channel group by deleting from the `default_channel_group_item` table. Returns an error if the group does not exist or any channel is not in the group.

## Domain Functions

### createChannel

```
createChannel(
  repo: IChannelRepository,
  subRepo: ISubscriptionRepository,
  tenantId: string,
  userId: string,
  name: string,
  description: string,
  isPrivate: boolean,
  isWebPublic: boolean,
  historyPublicToSubscribers: boolean,
  messageRetentionDays: int | null,
  announce: boolean
) -> Result<Channel>
```

1. Validate the channel name: must be non-empty, must not contain newlines or certain special characters, must not exceed 60 characters.
2. Check that no existing active channel has the same name in this tenant.
3. Verify the user has permission to create channels (organization setting `create_stream_policy`).
4. If `isWebPublic` is true, verify the organization allows web-public channels.
5. Persist the new channel via the repository.
6. Auto-subscribe the creator to the new channel.
7. If `announce` is true and an announcement channel is configured, post an announcement message.
8. Emit a `stream` event with `op: "create"`.
9. Return the created channel.

### updateChannel

```
updateChannel(
  repo: IChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string,
  updates: ChannelUpdate
) -> Result<Channel>
```

1. Fetch the existing channel; return error if not found or archived.
2. Verify the user has permission to modify the channel (admin, or channel creator if the org allows it).
3. If `name` is being changed, validate the new name and check uniqueness.
4. If `description` is being changed, render the description to HTML for `rendered_description`.
5. If changing `isPrivate` from public to private, verify admin permission (this is a more restricted operation).
6. Persist updates via the repository.
7. Emit a `stream` event with `op: "update"` for each changed property.
8. Return the updated channel.

### archiveChannel

```
archiveChannel(
  repo: IChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string
) -> Result<void>
```

1. Fetch the existing channel; return error if not found or already archived.
2. Verify the user has admin permissions.
3. Mark the channel as archived via the repository.
4. Emit a `stream` event with `op: "delete"` to notify all subscribers.
5. Note: subscriptions are retained but become inactive. Messages are retained for historical access.

### getTopics

```
getTopics(
  repo: IChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string
) -> Result<{ name: string, maxId: string }[]>
```

1. Fetch the channel; return error if not found.
2. Verify the user can access the channel (subscribed to private channel, or channel is public).
3. Query distinct topics from the `message` table via the repository, sorted by most recent message descending.
4. Return the topic list.

### deleteTopic

```
deleteTopic(
  repo: IChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string,
  topicName: string
) -> Result<{ complete: boolean }>
```

1. Fetch the channel; return error if not found.
2. Verify the user has permission to delete topics (admin or `can_delete_any_message` permission).
3. Delete all messages in the topic via the repository.
4. Emit message deletion events for each deleted message so clients can update their UI.
5. Return whether the deletion was complete.

### addDefaultChannel

```
addDefaultChannel(
  channelRepo: IChannelRepository,
  defaultChannelRepo: IDefaultChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string
) -> Result<void>
```

1. Verify the user has admin permissions.
2. Fetch the channel; return error if not found or archived.
3. Add the channel as a default via the repository.
4. Emit a `default_streams` event with `op: "add"`.

### removeDefaultChannel

```
removeDefaultChannel(
  channelRepo: IChannelRepository,
  defaultChannelRepo: IDefaultChannelRepository,
  tenantId: string,
  userId: string,
  channelId: string
) -> Result<void>
```

1. Verify the user has admin permissions.
2. Fetch the channel; return error if not found.
3. Remove the channel from defaults via the repository. Return error if the channel is not currently a default.
4. Emit a `default_streams` event with `op: "remove"`.

### createDefaultChannelGroup

```
createDefaultChannelGroup(
  channelRepo: IChannelRepository,
  groupRepo: IDefaultChannelGroupRepository,
  tenantId: string,
  userId: string,
  name: string,
  description: string,
  channelIds: string[]
) -> Result<DefaultChannelGroup>
```

1. Verify the user has admin permissions.
2. Validate the group name: must be non-empty and not exceed 60 characters.
3. Verify all provided channel IDs exist and are not archived.
4. Create the group via the repository. Return error if the name is already taken.
5. Emit a `default_stream_groups` event with `op: "add"`.
6. Return the created group.

### updateDefaultChannelGroup

```
updateDefaultChannelGroup(
  groupRepo: IDefaultChannelGroupRepository,
  tenantId: string,
  userId: string,
  groupId: string,
  updates: { name?: string, description?: string }
) -> Result<DefaultChannelGroup>
```

1. Verify the user has admin permissions.
2. Fetch the group; return error if not found.
3. If `name` is being changed, validate the new name and check uniqueness.
4. Update the group via the repository.
5. Emit a `default_stream_groups` event with `op: "update"`.
6. Return the updated group.

### deleteDefaultChannelGroup

```
deleteDefaultChannelGroup(
  groupRepo: IDefaultChannelGroupRepository,
  tenantId: string,
  userId: string,
  groupId: string
) -> Result<void>
```

1. Verify the user has admin permissions.
2. Fetch the group; return error if not found.
3. Delete the group and its items via the repository.
4. Emit a `default_stream_groups` event with `op: "remove"`.

### updateDefaultChannelGroupStreams

```
updateDefaultChannelGroupStreams(
  channelRepo: IChannelRepository,
  groupRepo: IDefaultChannelGroupRepository,
  tenantId: string,
  userId: string,
  groupId: string,
  add: string[],
  remove: string[]
) -> Result<void>
```

1. Verify the user has admin permissions.
2. Fetch the group; return error if not found.
3. Verify at least one of `add` or `remove` is non-empty.
4. If `add` is provided, verify all channel IDs exist and are not archived, then add them to the group.
5. If `remove` is provided, verify all channel IDs are currently in the group, then remove them.
6. Emit a `default_stream_groups` event with `op: "update"`.

## Events

All events are dispatched to the event queue module for delivery to connected clients.

| Event Type | Op       | Trigger                       | Recipients                        | Payload                                                                         |
| ---------- | -------- | ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `stream`   | `create` | Channel created               | All active users in the tenant    | `{ type: "stream", op: "create", streams: [{ ...channel_fields }] }`           |
| `stream`   | `update` | Channel property changed       | All subscribers of the channel    | `{ type: "stream", op: "update", stream_id, name, property, value }`           |
| `stream`   | `delete` | Channel archived/deleted       | All subscribers of the channel    | `{ type: "stream", op: "delete", streams: [{ stream_id, name }] }`            |
| `default_streams`        | `add`    | Channel added to defaults       | All active users in the tenant    | `{ type: "default_streams", op: "add", stream: { stream_id, name } }`         |
| `default_streams`        | `remove` | Channel removed from defaults   | All active users in the tenant    | `{ type: "default_streams", op: "remove", stream: { stream_id, name } }`      |
| `default_stream_groups`  | `add`    | Default stream group created    | All active users in the tenant    | `{ type: "default_stream_groups", op: "add", group: { id, name, description, stream_ids } }` |
| `default_stream_groups`  | `update` | Default stream group updated    | All active users in the tenant    | `{ type: "default_stream_groups", op: "update", group: { id, name, description, stream_ids } }` |
| `default_stream_groups`  | `remove` | Default stream group removed    | All active users in the tenant    | `{ type: "default_stream_groups", op: "remove", group_id: "..." }`            |

**Notes:**

- The `create` event is sent to all active users so they can see the new channel in their channel list (unless it is private, in which case only the initial subscribers receive it).
- The `update` event is sent once per changed property. If multiple properties change in a single PATCH request, multiple events are emitted.
- The `delete` event uses the same structure as `create` but the `streams` array contains only `stream_id` and `name`.
- Event payloads use Zulip's wire format field names (`stream_id`, `invite_only`, etc.) rather than internal names.
