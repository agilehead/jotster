# Subscriptions Module

## Overview

Subscriptions manage which users are subscribed to which channels, along with per-channel user preferences (color, muting, notification overrides). A subscription is the link between a user and a channel -- without a subscription, a user cannot post to or receive messages from a private channel, and will not see the channel highlighted in their sidebar.

The subscriptions module is responsible for:

- Subscribing and unsubscribing users from channels.
- Auto-creating channels when subscribing to a non-existent channel name (Zulip behavior).
- Bulk subscribing multiple users (used when creating a channel or admin-adding users).
- Storing per-channel user preferences (color, pin, mute, notification overrides).
- Emitting peer events so other subscribers know when someone joins or leaves.

This module lives in the `subscriptions` package and depends on `core` and `channels`.

## API Endpoints

### Zulip-Compatible Endpoints

| Method   | Path                                                 | Auth Required | Description                                          |
| -------- | ---------------------------------------------------- | ------------- | ---------------------------------------------------- |
| `GET`    | `/api/v1/users/me/subscriptions`                     | Yes           | List channels the user is subscribed to              |
| `POST`   | `/api/v1/users/me/subscriptions`                     | Yes           | Subscribe user(s) to channel(s), auto-create if needed |
| `DELETE` | `/api/v1/users/me/subscriptions`                     | Yes           | Unsubscribe from channels                            |
| `GET`    | `/api/v1/users/{user_id}/subscriptions/{stream_id}`  | Yes           | Check if a specific user is subscribed to a channel  |
| `PATCH`  | `/api/v1/users/me/subscriptions`                     | Yes           | Update subscriptions (bulk add/remove channels)      |
| `PATCH`  | `/api/v1/users/me/subscriptions/{stream_id}`         | Yes           | Update a single subscription's property by stream ID |
| `GET`    | `/api/v1/users/{user_id}/channels`                   | Yes           | Get channels a specific user is subscribed to        |
| `POST`   | `/api/v1/users/me/subscriptions/properties`          | Yes           | Update per-channel settings                          |

### Endpoint Details

#### GET /api/v1/users/me/subscriptions

Returns all channels the authenticated user is subscribed to, including per-channel preferences.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subscriptions": [
    {
      "stream_id": "ch_abc123",
      "name": "general",
      "description": "General discussion",
      "rendered_description": "<p>General discussion</p>",
      "invite_only": false,
      "is_web_public": false,
      "history_public_to_subscribers": true,
      "color": "#c2c2c2",
      "pin_to_top": false,
      "is_muted": false,
      "desktop_notifications": null,
      "push_notifications": null,
      "audible_notifications": null,
      "email_notifications": null,
      "wildcard_mentions_notify": null,
      "date_created": 1739800000,
      "creator_id": "u_xyz789",
      "subscribers": ["u_abc123", "u_def456", "u_ghi789"]
    }
  ]
}
```

Each subscription object includes the full channel details merged with subscription-specific preferences. The `subscribers` field lists user IDs of all users subscribed to the channel (controlled by the `include_subscribers` parameter, which defaults to true).

**Query Parameters:**

| Parameter             | Type | Required | Default | Description                                              |
| --------------------- | ---- | -------- | ------- | -------------------------------------------------------- |
| `include_subscribers` | int  | No       | 1       | Whether to include the subscriber list for each channel  |

Note: Notification preference fields (`desktop_notifications`, `push_notifications`, etc.) return `null` when the user has not set a per-channel override, meaning the organization default applies.

#### POST /api/v1/users/me/subscriptions

Subscribes one or more users to one or more channels. If a channel name does not exist, the channel is auto-created (if the user has permission). This is the primary endpoint Zulip clients use for both subscribing and creating channels.

**Request (form-encoded):**

| Parameter                    | Type   | Required | Default | Description                                                      |
| ---------------------------- | ------ | -------- | ------- | ---------------------------------------------------------------- |
| `subscriptions`              | string | Yes      |         | JSON array of `{"name": "channel_name", "description": "..."}` objects |
| `principals`                 | string | No       |         | JSON array of user IDs or emails to subscribe (defaults to self) |
| `authorization_errors_fatal` | int    | No       | 1       | If 0, skip channels the user lacks permission for instead of erroring |
| `announce`                   | int    | No       | 0       | Whether to announce new subscriptions in the channel             |
| `invite_only`                | int    | No       | 0       | Set channel as private when auto-creating                        |
| `is_web_public`              | int    | No       | 0       | Set channel as web-public when auto-creating                     |
| `history_public_to_subscribers` | int | No       | 1       | Set history visibility when auto-creating                        |
| `message_retention_days`     | int    | No       |         | Set retention policy when auto-creating                          |

The `subscriptions` and `principals` parameters are JSON-encoded strings sent as form values (Zulip convention).

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subscribed": {
    "user@example.com": ["engineering", "design"]
  },
  "already_subscribed": {
    "user@example.com": ["general"]
  },
  "unauthorized": ["secret-channel"]
}
```

- `subscribed` -- map of email to list of channel names the user was newly subscribed to.
- `already_subscribed` -- map of email to list of channel names the user was already subscribed to.
- `unauthorized` -- list of channel names the user was not authorized to subscribe to (only populated when `authorization_errors_fatal` is 0).

#### DELETE /api/v1/users/me/subscriptions

Unsubscribes users from channels.

**Request (form-encoded):**

| Parameter    | Type   | Required | Description                                                    |
| ------------ | ------ | -------- | -------------------------------------------------------------- |
| `subscriptions` | string | Yes  | JSON array of channel names to unsubscribe from                |
| `principals`    | string | No   | JSON array of user IDs or emails to unsubscribe (defaults to self) |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "removed": ["engineering"],
  "not_removed": ["general"]
}
```

- `removed` -- channel names successfully unsubscribed from.
- `not_removed` -- channel names the user was not subscribed to or could not be removed from.

#### GET /api/v1/users/{user_id}/subscriptions/{stream_id}

Checks whether a specific user is subscribed to a specific channel. Returns a boolean result. The authenticated user must be an admin or be checking their own subscription.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "is_subscribed": true
}
```

#### POST /api/v1/users/me/subscriptions/properties

Updates per-channel settings for the authenticated user. Allows changing color, pin status, mute status, and notification overrides.

**Request (form-encoded):**

| Parameter             | Type   | Required | Description                                     |
| --------------------- | ------ | -------- | ----------------------------------------------- |
| `subscription_data`   | string | Yes      | JSON array of property update objects            |

Each object in the `subscription_data` array:

```json
{
  "stream_id": "ch_abc123",
  "property": "color",
  "value": "#ff6633"
}
```

Supported properties and value types:

| Property                    | Value Type | Description                                         |
| --------------------------- | ---------- | --------------------------------------------------- |
| `color`                     | string     | Hex color code (e.g., `"#ff6633"`)                  |
| `pin_to_top`                | boolean    | Pin channel to top of sidebar                       |
| `is_muted`                  | boolean    | Mute channel (suppress notifications)               |
| `desktop_notifications`     | boolean    | Override org default for desktop notifications       |
| `push_notifications`        | boolean    | Override org default for push notifications          |
| `audible_notifications`     | boolean    | Override org default for audible notifications       |
| `email_notifications`       | boolean    | Override org default for email notifications         |
| `wildcard_mentions_notify`  | boolean    | Override org default for wildcard mention alerts     |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Invalid property name or value type.
**Error (404):** User is not subscribed to the specified channel.

#### PATCH /api/v1/users/me/subscriptions

Updates the authenticated user's subscriptions in bulk -- adding and removing channels in a single atomic request. Unlike `POST` (subscribe) and `DELETE` (unsubscribe) which handle one direction at a time, this endpoint accepts both `add` and `delete` parameters together, making it suitable for clients that batch subscription changes.

**Request (form-encoded):**

| Parameter | Type   | Required | Description                                                                 |
| --------- | ------ | -------- | --------------------------------------------------------------------------- |
| `add`     | string | No       | JSON array of `{"name": "channel_name", "description": "..."}` objects to subscribe to |
| `delete`  | string | No       | JSON array of channel names to unsubscribe from                             |

At least one of `add` or `delete` must be provided.

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subscribed": {
    "user@example.com": ["engineering"]
  },
  "already_subscribed": {
    "user@example.com": ["general"]
  },
  "removed": ["random"],
  "not_removed": []
}
```

- `subscribed` -- map of email to list of channel names the user was newly subscribed to (from `add`).
- `already_subscribed` -- map of email to list of channel names the user was already subscribed to (from `add`).
- `removed` -- channel names successfully unsubscribed from (from `delete`).
- `not_removed` -- channel names the user was not subscribed to or could not be removed from (from `delete`).

**Error (400):** Neither `add` nor `delete` provided, or invalid JSON.

#### PATCH /api/v1/users/me/subscriptions/{stream_id}

Updates a single subscription's property directly by stream ID. This is a convenience alternative to `POST /api/v1/users/me/subscriptions/properties` -- instead of sending a JSON array of property update objects, the caller specifies the stream ID in the URL and sends the property/value pair in the request body.

**Path Parameters:**

| Parameter   | Type   | Description                    |
| ----------- | ------ | ------------------------------ |
| `stream_id` | string | The ID of the channel (stream) |

**Request (JSON body):**

```json
{
  "property": "color",
  "value": "#ff6633"
}
```

| Parameter  | Type   | Required | Description                                                 |
| ---------- | ------ | -------- | ----------------------------------------------------------- |
| `property` | string | Yes      | The subscription property to update (see supported properties below) |
| `value`    | any    | Yes      | The new value for the property                              |

Supported properties and value types are the same as `POST /api/v1/users/me/subscriptions/properties`: `color` (string), `pin_to_top` (boolean), `is_muted` (boolean), `desktop_notifications` (boolean), `push_notifications` (boolean), `audible_notifications` (boolean), `email_notifications` (boolean), `wildcard_mentions_notify` (boolean).

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

**Error (400):** Invalid property name or value type.
**Error (404):** User is not subscribed to the specified channel.

#### GET /api/v1/users/{user_id}/channels

Returns the list of channels a specific user is subscribed to. The authenticated user must be an admin or must be requesting their own channels (i.e., `{user_id}` matches the authenticated user's ID).

**Path Parameters:**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| `user_id` | string | The target user's ID |

**Query Parameters:**

| Parameter             | Type | Required | Default | Description                                              |
| --------------------- | ---- | -------- | ------- | -------------------------------------------------------- |
| `include_subscribers` | int  | No       | 0       | Whether to include the subscriber list for each channel  |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "subscriptions": [
    {
      "stream_id": "ch_abc123",
      "name": "general",
      "description": "General discussion",
      "invite_only": false,
      "is_web_public": false,
      "color": "#c2c2c2",
      "pin_to_top": false,
      "is_muted": false,
      "date_created": 1739800000,
      "subscribers": []
    }
  ]
}
```

The response format matches `GET /api/v1/users/me/subscriptions` but `include_subscribers` defaults to 0 (off) since this endpoint is typically used for querying other users' channel memberships.

**Error (403):** Authenticated user is not an admin and `{user_id}` does not match their own ID.
**Error (404):** User not found.

## Data Model

### subscription

Stores the relationship between users and channels, along with per-channel user preferences.

| Column                      | Type    | Constraints                   | Description                                            |
| --------------------------- | ------- | ----------------------------- | ------------------------------------------------------ |
| `id`                        | TEXT    | PK                            | System-generated nanoid                                |
| `tenant_id`                 | TEXT    | NOT NULL, FK -> tenant        | Owning tenant                                          |
| `user_id`                   | TEXT    | NOT NULL, FK -> user          | Subscribed user                                        |
| `channel_id`                | TEXT    | NOT NULL, FK -> channel       | Subscribed channel                                     |
| `color`                     | TEXT    | NOT NULL DEFAULT '#c2c2c2'    | Hex color for sidebar display                          |
| `pin_to_top`                | INTEGER | NOT NULL DEFAULT 0            | Boolean 0/1; pin channel to top of sidebar             |
| `is_muted`                  | INTEGER | NOT NULL DEFAULT 0            | Boolean 0/1; suppress notifications for this channel   |
| `desktop_notifications`     | INTEGER | NULL                          | Boolean 0/1 or NULL; NULL means use org default        |
| `push_notifications`        | INTEGER | NULL                          | Boolean 0/1 or NULL; NULL means use org default        |
| `audible_notifications`     | INTEGER | NULL                          | Boolean 0/1 or NULL; NULL means use org default        |
| `email_notifications`       | INTEGER | NULL                          | Boolean 0/1 or NULL; NULL means use org default        |
| `wildcard_mentions_notify`  | INTEGER | NULL                          | Boolean 0/1 or NULL; NULL means use org default        |
| `created_at`                | INTEGER | NOT NULL                      | Unix milliseconds                                      |

**Indexes:**

- `ix_subscription_tenant_user_channel` UNIQUE on `(tenant_id, user_id, channel_id)` -- enforces one subscription per user per channel per tenant and supports user subscription lookups.
- `ix_subscription_tenant_channel` on `(tenant_id, channel_id)` -- supports listing all subscribers for a channel (used by `GET /streams/{stream_id}/members` and peer events).
- `ix_subscription_tenant_user` on `(tenant_id, user_id)` -- supports listing all subscriptions for a user.

**Notes:**

- There is no `updated_at` column. Subscription property changes are tracked via events, not timestamps. The `created_at` records when the subscription was established.
- Notification override columns use NULL to represent "use organization default." A value of 0 means "explicitly disabled" and 1 means "explicitly enabled."
- When a user unsubscribes, the subscription row is deleted (hard delete), not soft-deleted. If the user re-subscribes later, a new row is created with default preferences.
- Color defaults are deterministic per channel -- the server assigns a color from a predefined palette based on the channel ID hash, but `#c2c2c2` is the database-level default.

## Repository Interface

### ISubscriptionRepository

```
getSubscriptions(tenantId: string, userId: string) -> Result<Subscription[]>
```
Returns all subscriptions for the user within the tenant, including channel details and per-channel preferences.

```
subscribe(tenantId: string, userId: string, channelId: string, color: string) -> Result<Subscription>
```
Creates a new subscription. Returns the created subscription including generated `id` and `created_at`. Returns an error if a subscription already exists.

```
unsubscribe(tenantId: string, userId: string, channelId: string) -> Result<void>
```
Deletes the subscription row. Returns an error if no subscription exists.

```
isSubscribed(tenantId: string, userId: string, channelId: string) -> Result<boolean>
```
Returns true if a subscription exists for the given user and channel.

```
updateSubscriptionProperties(tenantId: string, userId: string, channelId: string, updates: SubscriptionPropertyUpdate) -> Result<Subscription>
```
Updates one or more per-channel preferences on an existing subscription. `SubscriptionPropertyUpdate` may include `color`, `pinToTop`, `isMuted`, `desktopNotifications`, `pushNotifications`, `audibleNotifications`, `emailNotifications`, and `wildcardMentionsNotify`. Returns the updated subscription.

```
getSubscribersForChannel(tenantId: string, channelId: string) -> Result<string[]>
```
Returns the user IDs of all users subscribed to the specified channel.

```
bulkSubscribe(tenantId: string, userIds: string[], channelId: string, colorFn: (userId: string) => string) -> Result<{ subscribed: string[], alreadySubscribed: string[] }>
```
Subscribes multiple users to a channel in a single operation. The `colorFn` parameter provides the color for each user's subscription. Returns lists of newly subscribed and already-subscribed user IDs.

```
bulkUnsubscribe(tenantId: string, userIds: string[], channelId: string) -> Result<{ removed: string[], notSubscribed: string[] }>
```
Unsubscribes multiple users from a channel. Returns lists of removed and not-subscribed user IDs.

```
getSubscriptionsByChannel(tenantId: string, channelId: string) -> Result<Subscription[]>
```
Returns all subscription records for a channel, including user IDs and preferences. Used for building subscriber lists and delivering peer events.

```
getSubscriptionByUserAndChannel(tenantId: string, userId: string, channelId: string) -> Result<Subscription | null>
```
Returns the subscription record for a specific user and channel, or null if the user is not subscribed. Used by `PATCH /api/v1/users/me/subscriptions/{stream_id}` to look up the subscription directly by stream ID.

```
getChannelsForUser(tenantId: string, userId: string) -> Result<Channel[]>
```
Returns the list of channels the specified user is subscribed to, including channel details. Unlike `getSubscriptions` which returns subscription-centric records with preferences, this returns channel-centric records suitable for the `GET /api/v1/users/{user_id}/channels` endpoint.

## Domain Functions

### subscribe

```
subscribe(
  subRepo: ISubscriptionRepository,
  channelRepo: IChannelRepository,
  tenantId: string,
  actingUserId: string,
  targetUserId: string,
  channelName: string,
  createParams: ChannelCreateParams | null
) -> Result<{ subscribed: boolean, channelCreated: boolean, channel: Channel }>
```

1. Look up the channel by name in the tenant.
2. If the channel does not exist and `createParams` is provided, auto-create it (validate permissions first).
3. If the channel does not exist and `createParams` is null, return an error.
4. If the channel is private, verify the acting user has permission to subscribe the target user:
   - Users can subscribe themselves if they have been invited.
   - Admins and channel owners can subscribe other users.
5. If the channel is public, any user can subscribe themselves or be subscribed by an admin.
6. Check if the target user is already subscribed. If so, return `subscribed: false`.
7. Assign a color from the palette based on how many channels the user is already subscribed to.
8. Persist the subscription via the repository.
9. Emit a `subscription` event with `op: "add"` to the subscribed user.
10. Emit a `subscription` event with `op: "peer_add"` to all other subscribers of the channel.
11. Return the result.

### unsubscribe

```
unsubscribe(
  subRepo: ISubscriptionRepository,
  tenantId: string,
  actingUserId: string,
  targetUserId: string,
  channelName: string
) -> Result<{ removed: boolean }>
```

1. Look up the channel by name in the tenant; return error if not found.
2. Check if the target user is subscribed; return `removed: false` if not.
3. Verify the acting user has permission to unsubscribe the target user:
   - Users can unsubscribe themselves from any channel.
   - Admins can unsubscribe other users.
4. Delete the subscription via the repository.
5. Emit a `subscription` event with `op: "remove"` to the unsubscribed user.
6. Emit a `subscription` event with `op: "peer_remove"` to all remaining subscribers of the channel.
7. Return the result.

### bulkSubscribe

```
bulkSubscribe(
  subRepo: ISubscriptionRepository,
  channelRepo: IChannelRepository,
  tenantId: string,
  actingUserId: string,
  userIds: string[],
  channelId: string
) -> Result<{ subscribed: string[], alreadySubscribed: string[] }>
```

1. Verify the channel exists and is not archived.
2. Verify the acting user has permission to subscribe others (admin or channel creator).
3. For each user ID, determine subscription color.
4. Persist all new subscriptions via `bulkSubscribe` in the repository.
5. For each newly subscribed user, emit a `subscription` event with `op: "add"`.
6. Emit `subscription` events with `op: "peer_add"` to existing subscribers for each new subscriber.
7. Return the lists of subscribed and already-subscribed user IDs.

### updateProperties

```
updateProperties(
  subRepo: ISubscriptionRepository,
  tenantId: string,
  userId: string,
  updates: { streamId: string, property: string, value: any }[]
) -> Result<void>
```

1. For each update in the batch:
   a. Verify the user is subscribed to the channel; return error if not.
   b. Validate the property name is one of the supported properties.
   c. Validate the value type matches the expected type for the property.
   d. Apply the update via the repository.
   e. Emit a `subscription` event with `op: "update"` to the user.
2. Return success.

### assignColor

```
assignColor(
  subRepo: ISubscriptionRepository,
  tenantId: string,
  userId: string
) -> string
```

Assigns a color from a predefined palette. The palette contains 24 visually distinct colors. The assigned color is based on the number of existing subscriptions for the user modulo the palette size, ensuring variety across channels. This is a helper function used by `subscribe` and `bulkSubscribe`.

### updateSubscriptions

```
updateSubscriptions(
  subRepo: ISubscriptionRepository,
  channelRepo: IChannelRepository,
  tenantId: string,
  userId: string,
  add: { name: string, description?: string }[],
  remove: string[]
) -> Result<{ subscribed: Record<string, string[]>, alreadySubscribed: Record<string, string[]>, removed: string[], notRemoved: string[] }>
```

1. Validate that at least one of `add` or `remove` is non-empty; return error otherwise.
2. Process additions (if `add` is provided):
   a. For each channel in `add`, resolve the channel by name. Auto-create if the channel does not exist and the user has permission.
   b. For each resolved channel, check if the user is already subscribed; skip if so and record in `alreadySubscribed`.
   c. Assign a color and persist the subscription via the repository.
   d. Emit `subscription` events with `op: "add"` and `op: "peer_add"` as in `subscribe`.
3. Process removals (if `remove` is provided):
   a. For each channel name in `remove`, resolve the channel by name. Skip if not found and record in `notRemoved`.
   b. Check if the user is subscribed; skip if not and record in `notRemoved`.
   c. Delete the subscription via the repository.
   d. Emit `subscription` events with `op: "remove"` and `op: "peer_remove"` as in `unsubscribe`.
4. Return the combined result.

### updateSubscriptionProperty

```
updateSubscriptionProperty(
  subRepo: ISubscriptionRepository,
  tenantId: string,
  userId: string,
  streamId: string,
  property: string,
  value: any
) -> Result<void>
```

1. Look up the subscription by user ID and stream ID via `getSubscriptionByUserAndChannel`; return 404 if not found.
2. Validate the property name is one of the supported properties.
3. Validate the value type matches the expected type for the property.
4. Apply the update via the repository's `updateSubscriptionProperties`.
5. Emit a `subscription` event with `op: "update"` to the user.
6. Return success.

### getUserChannels

```
getUserChannels(
  subRepo: ISubscriptionRepository,
  tenantId: string,
  actingUserId: string,
  targetUserId: string,
  includeSubscribers: boolean
) -> Result<Subscription[]>
```

1. Verify the acting user has permission to view the target user's channels:
   - The acting user must be an admin, or `actingUserId` must equal `targetUserId`.
   - Return 403 if unauthorized.
2. Verify the target user exists; return 404 if not found.
3. Fetch channels for the target user via `getChannelsForUser` in the repository.
4. If `includeSubscribers` is true, for each channel, fetch the subscriber list via `getSubscribersForChannel` and attach it.
5. Return the list of subscriptions with channel details.

## Events

All events are dispatched to the event queue module for delivery to connected clients.

| Event Type     | Op            | Trigger                             | Recipients                              | Payload                                                                                                  |
| -------------- | ------------- | ----------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `subscription` | `add`         | User subscribed to a channel        | The subscribed user                     | `{ type: "subscription", op: "add", subscriptions: [{ ...channel_and_subscription_fields }] }`          |
| `subscription` | `remove`      | User unsubscribed from a channel    | The unsubscribed user                   | `{ type: "subscription", op: "remove", subscriptions: [{ stream_id, name }] }`                          |
| `subscription` | `update`      | Subscription property changed        | The user who owns the subscription      | `{ type: "subscription", op: "update", stream_id, property, value }`                                    |
| `subscription` | `peer_add`    | Another user joined a channel       | All other subscribers of the channel    | `{ type: "subscription", op: "peer_add", stream_ids: ["ch_abc123"], user_ids: ["u_def456"] }`           |
| `subscription` | `peer_remove` | Another user left a channel         | All remaining subscribers of the channel | `{ type: "subscription", op: "peer_remove", stream_ids: ["ch_abc123"], user_ids: ["u_def456"] }`        |

**Notes:**

- The `add` event payload includes the full subscription object (channel details merged with user preferences) so the client can immediately render the channel in the sidebar.
- The `remove` event payload includes only `stream_id` and `name` since the client just needs to know which channel to remove from the sidebar.
- The `update` event is sent once per property change. If multiple properties are updated in a single request, multiple events are emitted.
- The `peer_add` and `peer_remove` events use arrays for `stream_ids` and `user_ids` because Zulip batches these events. When multiple users subscribe simultaneously (e.g., during channel creation), a single `peer_add` event may contain multiple user IDs.
- Peer events are NOT sent for private channels to users who are not subscribed, preserving privacy.
- The `peer_add` and `peer_remove` events are only sent when the organization setting `enable_stream_audible_notifications` allows it (controlled by the `peer_add` / `peer_remove` notification policy).
