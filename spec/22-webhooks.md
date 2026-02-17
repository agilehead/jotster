# 22 - Webhooks & Integrations

## Overview

The webhooks module handles two complementary integration patterns: incoming webhooks (external services posting messages into Jotster) and outgoing webhooks (Jotster forwarding messages to external services).

**Incoming webhooks** allow external services (CI/CD, monitoring, project management tools, etc.) to send messages to Jotster channels. They work through bot users with `bot_type = 2`. The bot's API key is embedded in the webhook URL, providing authentication. Jotster supports both its own incoming webhook format and a Slack-compatible format for easier migration.

**Outgoing webhooks** are configured on bot users with `bot_type = 3`. When a message matches the bot's trigger conditions (an @-mention of the bot, or any message in specific channels), the server POSTs the message content to the bot's configured external URL. The external service can optionally respond with a message to post back.

Bot users themselves are managed through the Users module (spec 08). This module focuses on the webhook-specific behavior: receiving incoming payloads, dispatching outgoing payloads, and managing outgoing webhook configuration.

Package: `webhooks`

## API Endpoints

### Incoming Webhooks

| Method | Path                                           | Description                                         |
| ------ | ---------------------------------------------- | --------------------------------------------------- |
| POST   | /api/v1/external/{integration_name}            | Receive a webhook payload from an external service  |
| POST   | /api/v1/external/slack_incoming                | Receive a Slack-format incoming webhook             |

### Bot Storage & Submessages

| Method | Path                                           | Description                                         |
| ------ | ---------------------------------------------- | --------------------------------------------------- |
| GET    | /api/v1/bot_storage                            | Get bot storage entries                             |
| PUT    | /api/v1/bot_storage                            | Update bot storage entries                          |
| DELETE | /api/v1/bot_storage                            | Remove bot storage entries                          |
| POST   | /api/v1/submessage                             | Process submessage (used for interactive widgets/polls in messages) |

### Bot/Webhook Management

Bots are created and managed via the Users API (`POST /api/v1/bots`, `PATCH /api/v1/bots/{bot_id}`, etc.) with the following bot types:

| bot_type | Name                | Description                                          |
| -------- | ------------------- | ---------------------------------------------------- |
| 1        | Generic bot         | Full API access, can send/receive messages programmatically |
| 2        | Incoming webhook bot| Posts messages via webhook URL using bot's API key   |
| 3        | Outgoing webhook bot| Receives messages matching trigger, forwards to external URL |
| 4        | Embedded bot        | Reserved for future embedded bot framework           |

### Incoming Webhook URL Format

Incoming webhooks are authenticated via the bot's API key in the URL:

```
POST /api/v1/external/{integration_name}?api_key={bot_api_key}
```

Or via standard API authentication (HTTP Basic with bot email + API key).

### POST /api/v1/external/{integration_name}

Receives a webhook payload from an external service. The `integration_name` identifies which payload parser to use.

**Supported integrations (initial set):**
- `generic` -- simple text or JSON payload
- `github` -- GitHub webhook events
- `gitlab` -- GitLab webhook events
- `jira` -- Jira webhook events
- `slack_incoming` -- Slack-compatible incoming webhook

**Generic webhook request:**
```json
{
  "topic": "Build Status",
  "content": "Build #42 passed :check_mark:"
}
```

Or with the Zulip message API format:
```json
{
  "type": "stream",
  "to": "engineering",
  "topic": "deploys",
  "content": "Deployed v1.2.3 to production"
}
```

**Response:**
```json
{
  "result": "success",
  "msg": "",
  "id": "message_id"
}
```

### POST /api/v1/external/slack_incoming

Receives a Slack-format incoming webhook. Supports the Slack webhook payload format for migration convenience.

**Request:**
```json
{
  "text": "Hello from Slack integration",
  "channel": "#general",
  "username": "webhook-bot",
  "icon_emoji": ":robot:"
}
```

The `channel` field is mapped to a Jotster channel name (stripping the `#` prefix). The `text` field becomes the message content. The `username` and `icon_emoji` fields are ignored (the bot user's name and avatar are used instead).

## Data Model

### `outgoing_webhook`

Configuration for outgoing webhook bots. One record per bot user with `bot_type = 3`.

| Column           | Type   | Constraints                          | Description                              |
| ---------------- | ------ | ------------------------------------ | ---------------------------------------- |
| id               | string | PK                                   | Nanoid                                   |
| tenant_id        | string | FK -> tenant, NOT NULL               | Tenant scope                             |
| bot_user_id      | string | FK -> user, NOT NULL, UNIQUE         | The bot user this webhook belongs to     |
| url              | string | NOT NULL                             | The external URL to POST messages to     |
| token            | string | NOT NULL                             | Verification token sent with each request |
| trigger_type     | string | NOT NULL                             | `"mention"` -- trigger on @-mention of the bot; `"channel"` -- trigger on any message in specified channels |
| channel_ids_json | text   | nullable                             | JSON array of channel IDs (for `"channel"` trigger type) |
| interface_type   | int    | NOT NULL, default 1                  | 1 = Zulip payload format, 2 = Slack payload format |
| created_at       | int    | NOT NULL                             | Unix milliseconds                        |
| updated_at       | int    | NOT NULL                             | Unix milliseconds                        |

**Indexes:**

| Name                              | Columns                       | Purpose                                  |
| --------------------------------- | ----------------------------- | ---------------------------------------- |
| uq_outgoing_webhook_bot           | (bot_user_id)                 | UNIQUE -- one webhook config per bot     |
| ix_outgoing_webhook_tenant        | (tenant_id)                   | List all outgoing webhooks for a tenant  |

### `bot_storage`

Key-value storage for bots. Allows bots to persist state across requests.

| Column       | Type   | Constraints                          | Description                              |
| ------------ | ------ | ------------------------------------ | ---------------------------------------- |
| bot_user_id  | string | FK -> user, NOT NULL                 | The bot user that owns this entry        |
| key          | string | NOT NULL                             | Storage key                              |
| value        | text   | NOT NULL                             | Storage value                            |

**Primary key:** (bot_user_id, key)

Note: Incoming webhooks do not need a separate table. They work through bot users with `bot_type = 2`. The bot's API key authenticates the incoming request, and the bot user determines which tenant and default channel to post to.

## Repository Interface

```
getOutgoingWebhook(tenantId, botUserId)
  -> Result<OutgoingWebhook | null>
```
Fetch the outgoing webhook configuration for a specific bot user. Returns null if no configuration exists.

```
createOutgoingWebhook(tenantId, botUserId, url, token, triggerType, channelIds, interfaceType)
  -> Result<OutgoingWebhook>
```
Insert a new outgoing webhook configuration for a bot user. Fails if a configuration already exists for the bot (unique constraint on `bot_user_id`).

```
updateOutgoingWebhook(tenantId, botUserId, updates)
  -> Result<OutgoingWebhook>
```
Update the outgoing webhook configuration. `updates` can include `url`, `token`, `triggerType`, `channelIds`, `interfaceType`. Sets `updated_at` to current timestamp.

```
deleteOutgoingWebhook(tenantId, botUserId)
  -> Result<void>
```
Delete the outgoing webhook configuration for a bot user.

```
getOutgoingWebhooksForChannel(tenantId, channelId)
  -> Result<OutgoingWebhook[]>
```
Fetch all outgoing webhooks that have `trigger_type = "channel"` and include the given channel ID in their `channel_ids_json`. Used when a message is sent to a channel to find matching outgoing webhooks.

```
getMentionTriggeredWebhooks(tenantId)
  -> Result<OutgoingWebhook[]>
```
Fetch all outgoing webhooks that have `trigger_type = "mention"`. Used when a message is sent to check if any mentioned users are outgoing webhook bots.

## Domain Functions

### handleIncomingWebhook

Authenticate the request using the bot's API key (from query parameter or HTTP Basic auth). Look up the bot user and validate it is `bot_type = 2` (incoming webhook). Resolve the target channel and topic from the request payload. If the integration-specific parser exists for the given `integration_name`, use it to extract the channel, topic, and formatted message content from the payload. Otherwise, fall back to the generic parser. Send the message to the resolved channel+topic as the bot user (using the messages module's `sendMessage` domain function). Return the created message ID.

### handleSlackIncomingWebhook

Parse the Slack-format webhook payload. Map the `channel` field (strip `#` prefix) to a Jotster channel name. Use the `text` field as message content. Convert basic Slack markdown formatting to Zulip markdown (e.g., `<url|text>` to `[text](url)`, `*bold*` to `**bold**`). Send the message via the bot user.

### triggerOutgoingWebhooks

Called after a message is successfully sent. Check for matching outgoing webhooks:

1. **Mention triggers:** If the message content @-mentions any users, look up those users. For each user that is a bot with `bot_type = 3`, fetch the outgoing webhook configuration via `getOutgoingWebhook`. If found and `trigger_type = "mention"`, dispatch.

2. **Channel triggers:** If the message is a channel message, call `getOutgoingWebhooksForChannel` to find webhooks monitoring that channel. For each matching webhook, dispatch.

For each matching webhook, format the payload and POST it to the configured URL asynchronously (do not block the message send response).

### formatOutgoingPayload

Format the message data for dispatch to the external URL. The format depends on the `interface_type`:

**Zulip format (interface_type = 1):**
```json
{
  "bot_email": "bot@example.com",
  "bot_full_name": "My Bot",
  "token": "verification_token",
  "trigger": "mention",
  "message": {
    "id": "msg_id",
    "sender_id": "user_id",
    "sender_email": "sender@example.com",
    "sender_full_name": "Sender Name",
    "type": "stream",
    "display_recipient": "channel-name",
    "subject": "topic name",
    "content": "message content",
    "timestamp": 1700000000
  }
}
```

**Slack format (interface_type = 2):**
```json
{
  "token": "verification_token",
  "team_id": "tenant_id",
  "event": {
    "type": "message",
    "text": "message content",
    "user": "sender_id",
    "channel": "channel_id"
  }
}
```

### handleOutgoingWebhookResponse

If the external service responds with a JSON body containing a `content` field (Zulip format) or `text` field (Slack format), post that response as a reply message from the bot user in the same channel+topic. If the response is empty or has no content field, do nothing.

## Events

No specific webhook events are emitted. Messages posted by incoming webhooks emit standard `message` events (from the messages module). Bot creation and updates emit `realm_bot` events (from the users module).

### `realm_bot` (emitted by the users module)

When an outgoing webhook bot is created or its configuration is updated:
- `type`: `"realm_bot"`
- `op`: `"add"`, `"update"`, or `"remove"`
- `bot`: object with bot user fields including `services` (the outgoing webhook configuration)
