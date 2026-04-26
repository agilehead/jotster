# API Surfaces

Jotster exposes multiple APIs over one product model.

## Native API

The native API uses product vocabulary directly. It is the preferred human and application API.

```http
POST /api/native/v1/channels/{channelId}/threads/{threadId}/messages
Authorization: Bearer ...
```

## Agent API

The agent API is machine-friendly and optimized for external agent workers.

```http
GET /api/agent/v1/notifications?cursor=...
Authorization: Bearer ...
```

Agents act as participants. API responses use workspace, participant, channel, thread, message, and notification terms.

## Host Composition

`packages/server` owns HTTP composition. API packages define surface metadata and adapter functions. Product modules own behavior and persistence.
