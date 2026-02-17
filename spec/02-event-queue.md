# Event Queue Module

## Overview

The event queue is the backbone of Zulip's real-time communication model. Unlike many modern chat systems that use WebSockets, Zulip uses **long-polling**: clients register an event queue, then repeatedly poll for new events. The server holds each poll request open until events are available or a timeout elapses.

Every state change in the system (new message, user update, channel creation, settings change, etc.) is expressed as an event. When a domain function modifies state, it emits one or more events into the event system. The event queue module acts as a **pub/sub hub**: it receives emitted events and routes them to all matching client queues based on tenant, user, event type filters, and stream/channel subscriptions.

Event queues are **entirely in-memory**. They are not persisted to SQLite. If the server restarts, all queues are lost and clients must re-register (Zulip clients handle this via the `restart` event and automatic re-registration). This is by design -- event queues are ephemeral session state, not durable data.

## API Endpoints

| Method   | Path                 | Auth Required | Description                                              |
| -------- | -------------------- | ------------- | -------------------------------------------------------- |
| `POST`   | `/api/v1/register`   | Yes           | Create an event queue and fetch initial state snapshot   |
| `GET`    | `/api/v1/events`     | Yes           | Long-poll for new events from a queue                    |
| `DELETE` | `/api/v1/events`     | Yes           | Delete (unregister) an event queue                       |

### Endpoint Details

#### POST /api/v1/register

Creates a new event queue for the authenticated user and returns the queue ID along with an initial state snapshot. The snapshot gives the client a consistent view of the world at queue-creation time; subsequent events represent deltas from that snapshot.

**Request (form-encoded or JSON):**

| Parameter              | Type         | Required | Default  | Description                                                              |
| ---------------------- | ------------ | -------- | -------- | ------------------------------------------------------------------------ |
| `event_types`          | JSON array   | No       | all      | Which event types to subscribe to (e.g., `["message", "presence"]`)      |
| `fetch_event_types`    | JSON array   | No       | all      | Which initial state sections to include in the response                  |
| `apply_markdown`       | boolean      | No       | true     | Whether to render message content as HTML                                |
| `client_gravatar`      | boolean      | No       | true     | Whether to include Gravatar URLs for users                               |
| `slim_presence`        | boolean      | No       | false    | Use compact presence format (`{ "active_timestamp": ... }`)              |
| `all_public_streams`   | boolean      | No       | false    | Receive events from all public channels, not just subscribed ones        |
| `narrow`               | JSON array   | No       | none     | Narrow filter for which messages to receive (e.g., stream/topic narrow)  |
| `client_capabilities`  | JSON object  | No       | `{}`     | Feature negotiation flags between client and server                      |

**`client_capabilities` fields:**

| Field                             | Type    | Description                                                    |
| --------------------------------- | ------- | -------------------------------------------------------------- |
| `notification_settings_null`      | boolean | Client handles null notification settings                      |
| `bulk_message_deletion`           | boolean | Client handles bulk message deletion events                    |
| `user_avatar_url_field_optional`  | boolean | Client does not require avatar_url on every user object        |
| `stream_typing_notifications`     | boolean | Client handles typing notifications in channels                |
| `user_settings_object`            | boolean | Client reads settings from `user_settings` (not legacy fields) |
| `linkifier_url_template`          | boolean | Client supports URL template format for linkifiers             |
| `group_setting_value`             | boolean | Client supports group-based permission settings                |

**Response (200):**

The response is large. It includes the `queue_id`, `last_event_id`, and a snapshot of all requested initial state. Below is the structure with key fields. Fields are included only if requested via `fetch_event_types` (or if `fetch_event_types` is omitted, all are included).

```json
{
  "result": "success",
  "msg": "",
  "queue_id": "1739800000:0",
  "last_event_id": -1,
  "zulip_feature_level": 320,
  "zulip_version": "11.0",
  "zulip_merge_base": "11.0",

  "alert_words": ["bug", "urgent"],

  "custom_profile_fields": [
    { "id": 1, "name": "Phone", "type": 1, "hint": "", "order": 1 }
  ],

  "drafts": [
    { "id": 1, "type": "stream", "to": [10], "topic": "design", "content": "draft text", "timestamp": 1739800000 }
  ],

  "muted_topics": [],
  "muted_users": [],

  "presences": {
    "user@example.com": {
      "aggregated": { "status": "active", "timestamp": 1739800000 },
      "website": { "status": "active", "timestamp": 1739800000, "client": "website" }
    }
  },

  "realm_bots": [],

  "realm_domains": [
    { "domain": "example.com", "allow_subdomains": false }
  ],

  "realm_emoji": {},

  "realm_filters": [],
  "realm_linkifiers": [],
  "realm_playgrounds": [],

  "realm_name": "Acme Corp",
  "realm_description": "Acme team chat",
  "realm_icon_url": "/avatar/realm/icon.png",
  "realm_icon_source": "U",
  "realm_uri": "https://acme.jotster.example",

  "realm_allow_message_editing": true,
  "realm_message_content_edit_limit_seconds": 600,
  "realm_message_content_delete_limit_seconds": 600,
  "realm_allow_edit_history": true,
  "realm_enable_read_receipts": true,
  "realm_enable_spectator_access": false,
  "realm_invite_required": true,
  "realm_create_public_stream_policy": 1,
  "realm_create_private_stream_policy": 1,
  "realm_create_web_public_stream_policy": 6,

  "realm_default_language": "en",
  "realm_video_chat_provider": 1,

  "realm_users": [
    {
      "user_id": "u_abc123",
      "email": "user@example.com",
      "full_name": "Alice Smith",
      "avatar_url": "/avatar/u_abc123",
      "is_admin": false,
      "is_owner": false,
      "is_guest": false,
      "is_bot": false,
      "is_active": true,
      "role": 400,
      "date_joined": "2025-01-15T00:00:00Z",
      "timezone": "America/New_York",
      "profile_data": {}
    }
  ],

  "realm_non_active_users": [],

  "subscriptions": [
    {
      "stream_id": "s_abc123",
      "name": "general",
      "description": "General discussion",
      "color": "#c2c2c2",
      "pin_to_top": false,
      "is_muted": false,
      "in_home_view": true,
      "desktop_notifications": null,
      "push_notifications": null,
      "audible_notifications": null,
      "email_notifications": null,
      "wildcard_mentions_notify": null,
      "invite_only": false,
      "is_web_public": false,
      "history_public_to_subscribers": true,
      "stream_weekly_traffic": 0,
      "subscribers": ["u_abc123", "u_def456"]
    }
  ],

  "unsubscribed": [],
  "never_subscribed": [],

  "unread_msgs": {
    "pms": [],
    "streams": [],
    "huddles": [],
    "mentions": [],
    "count": 0,
    "old_unreads_missing": false
  },

  "starred_messages": [],

  "recent_private_conversations": [],

  "user_settings": {
    "twenty_four_hour_time": false,
    "dense_mode": true,
    "high_contrast_mode": false,
    "color_scheme": 1,
    "translate_emoticons": true,
    "display_emoji_reaction_users": true,
    "default_language": "en",
    "default_view": "recent_topics",
    "escape_navigates_to_default_view": true,
    "left_side_userlist": false,
    "emojiset": "google",
    "demote_inactive_streams": 1,
    "enable_stream_desktop_notifications": false,
    "enable_stream_email_notifications": false,
    "enable_stream_push_notifications": false,
    "enable_stream_audible_notifications": false,
    "wildcard_mentions_notify": true,
    "enable_desktop_notifications": true,
    "enable_sounds": true,
    "enable_offline_email_notifications": true,
    "enable_offline_push_notifications": true,
    "enable_online_push_notifications": true,
    "notification_sound": "zulip",
    "pm_content_in_desktop_notifications": true,
    "desktop_icon_count_display": 1,
    "presence_enabled": true,
    "enter_sends": true,
    "send_private_typing_notifications": true,
    "send_stream_typing_notifications": true,
    "send_read_receipts": true
  },

  "max_message_id": 1000,
  "max_stream_name_length": 60,
  "max_stream_description_length": 1024,
  "max_topic_length": 60,
  "max_message_length": 10000,
  "server_generation": 1739800000,
  "server_emoji_data_url": "/static/emoji/data.json"
}
```

#### GET /api/v1/events

Long-polls for new events. The server holds the connection open until one of: (a) events are available, (b) the timeout elapses, or (c) a heartbeat is due.

**Request (query parameters):**

| Parameter       | Type    | Required | Default | Description                                               |
| --------------- | ------- | -------- | ------- | --------------------------------------------------------- |
| `queue_id`      | string  | Yes      | --      | The queue ID returned by `POST /register`                 |
| `last_event_id` | integer | Yes      | --      | ID of the last event the client received (-1 for initial) |
| `dont_block`    | boolean | No       | false   | If true, return immediately even if no events             |

**Response (200):**

```json
{
  "result": "success",
  "msg": "",
  "events": [
    {
      "id": 0,
      "type": "message",
      "message": { "...": "..." }
    },
    {
      "id": 1,
      "type": "heartbeat"
    }
  ]
}
```

**Error (400) -- BAD_EVENT_QUEUE_ID:** Returned when the `queue_id` is unknown (e.g., after server restart or garbage collection). The client must re-register.

```json
{
  "result": "error",
  "msg": "Bad event queue id: 1739800000:0",
  "code": "BAD_EVENT_QUEUE_ID",
  "queue_id": "1739800000:0"
}
```

**Behavior:**

1. Validate that `queue_id` belongs to the authenticated user in the correct tenant.
2. If events with IDs greater than `last_event_id` exist in the queue buffer, return them immediately.
3. Otherwise, block (async wait) until events arrive or timeout (~90 seconds).
4. A heartbeat event is injected approximately every 45 seconds to keep the connection alive and detect dead clients.
5. If `dont_block` is true, return immediately with an empty events array if nothing is pending.

#### DELETE /api/v1/events

Deletes an event queue. Clients should call this on clean shutdown.

**Request (form-encoded or query):**

| Parameter  | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `queue_id` | string | Yes      | The queue ID to delete      |

**Response (200):**

```json
{
  "result": "success",
  "msg": ""
}
```

## Data Model

Event queues are held entirely in memory. There are no database tables for this module.

### EventQueue (in-memory)

| Field                | Type              | Description                                                           |
| -------------------- | ----------------- | --------------------------------------------------------------------- |
| `queue_id`           | string            | Unique queue identifier (format: `{unix_seconds}:{sequence}`)         |
| `tenant_id`          | string            | Tenant this queue belongs to                                          |
| `user_id`            | string            | User this queue belongs to                                            |
| `event_types`        | string[] or null  | Event types filter; null means all types                              |
| `last_event_id`      | integer           | Monotonically increasing event ID counter within this queue           |
| `events`             | Event[]           | Ring buffer of pending events not yet consumed by the client          |
| `last_access_time`   | integer           | Unix milliseconds of the last `GET /events` request for this queue    |
| `narrow`             | NarrowFilter[]    | Optional narrow filter for message events                             |
| `all_public_streams` | boolean           | Whether to include events from all public channels                    |
| `apply_markdown`     | boolean           | Whether to render markdown in message content                         |
| `client_gravatar`    | boolean           | Whether to include gravatar URLs                                      |
| `slim_presence`      | boolean           | Whether to use compact presence format                                |
| `client_capabilities`| ClientCapabilities| Feature negotiation flags                                             |
| `waiter`             | AsyncSignal       | Async signaling mechanism to wake blocked long-poll handlers          |

### Event (in-memory)

| Field  | Type   | Description                                    |
| ------ | ------ | ---------------------------------------------- |
| `id`   | integer| Queue-local sequential event ID                |
| `type` | string | Event type identifier (e.g., `"message"`)      |
| `op`   | string | Sub-operation (e.g., `"add"`, `"remove"`, `"update"`) -- present on some event types |
| `data` | object | Event-type-specific payload                    |

### EventQueueRegistry (in-memory, singleton per server)

| Field              | Type                                  | Description                                         |
| ------------------ | ------------------------------------- | --------------------------------------------------- |
| `queues`           | ConcurrentDictionary<string, EventQueue> | All active queues keyed by queue_id                |
| `user_queues`      | ConcurrentDictionary<(tenant_id, user_id), List<queue_id>> | Index: user to their queue IDs    |
| `next_queue_seq`   | AtomicInteger                         | Global sequence counter for generating queue IDs    |
| `gc_timer`         | Timer                                 | Periodic timer for garbage collection               |
| `heartbeat_timer`  | Timer                                 | Periodic timer for heartbeat injection              |

## Repository Interface

This module has no database repository. All state is in-memory. The interface is defined for the in-memory event system.

### IEventQueueManager

```
RegisterQueue(tenantId: string, userId: string, params: RegisterParams) -> Result<RegisterResponse>
GetEvents(tenantId: string, userId: string, queueId: string, lastEventId: int, dontBlock: bool) -> Result<EventsResponse>
DeleteQueue(tenantId: string, userId: string, queueId: string) -> Result<void>
DispatchEvent(tenantId: string, event: DomainEvent) -> void
DispatchEventToUser(tenantId: string, userId: string, event: DomainEvent) -> void
GetActiveQueueCount() -> int
```

### IInitialStateBuilder

Responsible for assembling the initial state snapshot returned by `POST /register`. Each section of the snapshot is built by querying the appropriate repository.

```
BuildInitialState(tenantId: string, userId: string, fetchEventTypes: string[]?, params: RegisterParams) -> Result<InitialState>
```

Internally delegates to other modules' repositories:

- User repository for `realm_users`, `realm_non_active_users`, `realm_bots`
- Channel/stream repository for `subscriptions`, `unsubscribed`, `never_subscribed`
- Message repository for `unread_msgs`, `starred_messages`, `max_message_id`
- Presence repository for `presences`
- User settings repository for `user_settings`
- Draft repository for `drafts`
- Alert words repository for `alert_words`
- Muted topics/users for `muted_topics`, `muted_users`
- Custom profile fields repository for `custom_profile_fields`
- Emoji repository for `realm_emoji`
- Realm settings for all `realm_*` configuration fields
- Recent DM conversations for `recent_private_conversations`

## Domain Functions

### Register Queue

```
RegisterQueue(tenantId: string, userId: string, params: RegisterParams) -> Result<RegisterResponse>
```

1. Generate a unique `queue_id` using the format `{unix_seconds}:{next_queue_seq}`.
2. Create an `EventQueue` instance with the provided parameters (`event_types`, `narrow`, `all_public_streams`, `apply_markdown`, `client_gravatar`, `slim_presence`, `client_capabilities`).
3. Set `last_event_id` to -1.
4. Store the queue in the `EventQueueRegistry`.
5. Index the queue under `(tenant_id, user_id)` in the `user_queues` map.
6. Build the initial state snapshot by calling `IInitialStateBuilder.BuildInitialState(...)`.
7. Return the `queue_id`, `last_event_id` (-1), and the initial state.

### Get Events (Long-Poll)

```
GetEvents(tenantId: string, userId: string, queueId: string, lastEventId: int, dontBlock: bool) -> Result<EventsResponse>
```

1. Look up the queue by `queue_id`. Return `BAD_EVENT_QUEUE_ID` error if not found.
2. Verify the queue belongs to the requesting `tenant_id` and `user_id`. Return unauthorized if mismatch.
3. Update `last_access_time` to now.
4. Discard events from the buffer with IDs less than or equal to `lastEventId` (the client has already processed them).
5. If events remain in the buffer, return them immediately.
6. If `dont_block` is true, return an empty events array.
7. Otherwise, wait on the queue's `AsyncSignal` with a timeout of ~90 seconds.
8. When woken (by new events or timeout), collect all pending events and return them.
9. If the wait timed out with no events, return an empty events array (the client will immediately re-poll).

### Delete Queue

```
DeleteQueue(tenantId: string, userId: string, queueId: string) -> Result<void>
```

1. Look up the queue by `queue_id`. Return error if not found.
2. Verify ownership (tenant + user).
3. Signal any blocked long-poll waiter so it returns immediately.
4. Remove the queue from `EventQueueRegistry.queues`.
5. Remove the queue ID from `user_queues`.

### Dispatch Event

```
DispatchEvent(tenantId: string, event: DomainEvent) -> void
```

Called by domain functions across all modules whenever state changes. This is the core pub/sub routing logic.

1. Determine which users should receive this event based on its type:
   - **message**: Users subscribed to the channel (or DM participants). Users with `all_public_streams` queues also receive public channel messages.
   - **typing**, **reaction**: Same audience as message events for that channel/DM.
   - **presence**: All active users in the tenant.
   - **realm_user**, **realm**, **realm_emoji**, **realm_domains**, **realm_bot**: All active users in the tenant.
   - **subscription**: The specific user(s) whose subscriptions changed, plus peer events to other subscribers.
   - **stream/channel**: All users in the tenant (for public channels) or subscribers (for private channels).
   - **user_settings**, **user_status**, **muted_users**, **alert_words**, **drafts**, **user_topic**: Only the specific user.
   - **update_message**, **delete_message**: Users who had access to the original message.
   - **update_message_flags**: Only the specific user whose flags changed.
   - **user_group**: All active users in the tenant.
   - **custom_profile_fields**: All active users in the tenant.
   - **channel_folder**: Only the specific user.
   - **invites_changed**: Only admins.
   - **attachment**: Only the uploading user.
   - **heartbeat**: Injected by timer, not dispatched through this path.
   - **restart**: All queues (broadcast).
2. For each target user, find all their queues in `user_queues`.
3. For each queue, check if the event type is in the queue's `event_types` filter (if the filter is non-null).
4. For message events, check if the message matches the queue's `narrow` filter (if set).
5. If the event passes all filters, assign it a sequential `id` within the queue (increment `last_event_id`), apply formatting options (`apply_markdown`, `client_gravatar`, `slim_presence`), add it to the queue's event buffer, and signal the queue's `AsyncSignal` to wake any blocked long-poll handler.

### Dispatch Event to Specific User

```
DispatchEventToUser(tenantId: string, userId: string, event: DomainEvent) -> void
```

A convenience function for events targeted at a single user (e.g., `user_settings`, `drafts`, `muted_users`). Finds all queues for the given `(tenant_id, user_id)` and dispatches the event to matching queues.

### Heartbeat

```
HeartbeatTick() -> void
```

Called by the heartbeat timer every ~45 seconds. Iterates all active queues and injects a heartbeat event:

```json
{ "id": <next_id>, "type": "heartbeat" }
```

This keeps long-poll connections alive (prevents proxy/load-balancer timeouts) and lets clients detect stale connections.

### Garbage Collection

```
GarbageCollectQueues() -> void
```

Called by the GC timer every ~60 seconds. Iterates all queues and removes any whose `last_access_time` is older than 10 minutes. For each removed queue:

1. Signal any blocked waiter.
2. Remove from `queues` dictionary.
3. Remove from `user_queues` index.

This handles clients that disconnected without calling `DELETE /events`.

## Events

The event queue module does not itself emit domain events -- it is the **consumer and router** of events emitted by all other modules. However, it generates the following synthetic events:

| Event Type  | Trigger                       | Payload                                                                        |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `heartbeat` | Heartbeat timer (~45s)        | `{ "id": <int>, "type": "heartbeat" }`                                        |
| `restart`   | Server shutdown/restart       | `{ "id": <int>, "type": "restart", "zulip_version": "11.0", "zulip_feature_level": 320, "server_generation": <int> }` |

### Complete Event Type Reference

Below is the full catalog of event types routed through this module. Each event is produced by its respective domain module and consumed here for delivery.

| Event Type               | Source Module      | Operations                              | Description                                      |
| ------------------------ | ------------------ | --------------------------------------- | ------------------------------------------------ |
| `message`                | Messages           | --                                      | New message posted                               |
| `update_message`         | Messages           | --                                      | Message content/topic edited or message moved     |
| `delete_message`         | Messages           | --                                      | Message deleted                                  |
| `update_message_flags`   | Messages           | `add`, `remove`                         | Message flags changed (read, starred, etc.)      |
| `reaction`               | Messages           | `add`, `remove`                         | Emoji reaction added or removed                  |
| `typing`                 | Typing             | `start`, `stop`                         | User started/stopped typing                      |
| `presence`               | Presence           | --                                      | User presence status changed                     |
| `stream`                 | Channels           | `create`, `update`, `delete`            | Channel created, updated, or archived            |
| `subscription`           | Channels           | `add`, `remove`, `update`, `peer_add`, `peer_remove` | Subscription changed; peer notifications |
| `realm_user`             | Users              | `add`, `update`, `remove`              | User created, profile updated, or deactivated    |
| `realm`                  | Server & Auth      | `update`                                | Organization/realm settings changed              |
| `realm_bot`              | Users              | `add`, `update`, `delete`              | Bot created, updated, or removed                 |
| `realm_emoji`            | Emoji              | `update`                                | Custom emoji added/removed                       |
| `realm_domains`          | Server & Auth      | `add`, `change`, `remove`              | Allowed email domains changed                    |
| `realm_export`           | Data Export        | --                                      | Data export status changed                       |
| `user_group`             | User Groups        | `add`, `update`, `remove`, `add_members`, `remove_members`, `add_subgroups`, `remove_subgroups` | User group changes |
| `user_settings`          | Users              | `update`                                | Personal settings changed                        |
| `user_topic`             | Channels           | --                                      | Topic visibility policy changed                  |
| `user_status`            | Users              | --                                      | User status emoji/text changed                   |
| `muted_users`            | Users              | `add`, `remove`                         | Muted users list changed                         |
| `alert_words`            | Users              | --                                      | Alert words changed                              |
| `custom_profile_fields`  | Users              | --                                      | Profile field definitions changed                |
| `drafts`                 | Drafts             | `add`, `update`, `remove`              | Message draft CRUD                               |
| `channel_folder`         | Channels           | `add`, `update`, `remove`              | Channel folder CRUD                              |
| `invites_changed`        | Invitations        | --                                      | Invitation created or revoked                    |
| `attachment`             | Attachments        | `add`, `update`, `remove`              | File attachment changes                          |
| `heartbeat`              | Event Queue        | --                                      | Keep-alive signal                                |
| `restart`                | Event Queue        | --                                      | Server restart notification                      |
