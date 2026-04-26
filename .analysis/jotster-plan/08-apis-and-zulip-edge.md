# APIs And Zulip Edge

## API Strategy

Jotster should expose multiple APIs over the same core product model.

```text
┌──────────────────┐
│ Native API        │  Jotster-first product API
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Agent API         │  machine-friendly API for external agents
└────────┬─────────┘
         │
┌────────▼─────────┐
│ Zulip API Edge    │  compatibility adapter only
└────────┬─────────┘
         │
         ▼
Identity / Authorization / Collaboration / Notifications
```

No API should own product persistence directly. APIs translate inputs/outputs and call core services.

## Native API

The native API uses Jotster vocabulary:

```http
POST /api/channels/{channelId}/threads/{threadId}/messages
Authorization: Bearer ...

{
  "content": "The migration needs a tenant isolation test."
}
```

Response:

```json
{
  "id": "msg_123",
  "workspaceId": "w_acme",
  "channelId": "c_eng",
  "threadId": "t_migration",
  "senderParticipantId": "p_asha",
  "content": "The migration needs a tenant isolation test.",
  "createdAt": 1777219200000
}
```

## Agent API

The Agent API is for external automation. It should be machine-friendly and stable.

Example:

```http
GET /agent/v1/notifications?cursor=abc
Authorization: Bearer agent_token
```

Response:

```json
{
  "notifications": [
    {
      "id": "n_123",
      "reason": "mention",
      "objectType": "message",
      "objectId": "msg_456",
      "workspaceId": "w_acme",
      "payload": {
        "channelId": "c_eng",
        "threadId": "t_release",
        "messageId": "msg_456"
      }
    }
  ],
  "nextCursor": "def"
}
```

Agent posts back like a participant:

```http
POST /agent/v1/messages
Authorization: Bearer agent_token

{
  "channelId": "c_eng",
  "threadId": "t_release",
  "content": "I checked the release notes and found one stale item."
}
```

Core sees:

```csharp
context.ParticipantId == "p_codex"
```

Not:

```csharp
context.AgentRunId
context.AgentMemoryId
```

Agent execution is external.

## Zulip API Edge

Zulip compatibility is an adapter.

```text
Zulip request/response terms
  stream, topic, narrow, realm, invite_only
        │
        ▼
Jotster.Api.Zulip translation
        │
        ▼
Core terms
  channel, thread, filter, workspace, visibility
```

Example translation:

```csharp
public async Task<IResult> SendZulipMessage(
    RequestContext context,
    ZulipSendMessageRequest request,
    IMessageService messages,
    IChannelLookup channels,
    IThreadService threads,
    CancellationToken ct)
{
    if (request.Type == "stream")
    {
        var channel = await channels.ResolveAsync(
            context.WorkspaceId,
            request.To,
            ct);

        var thread = await threads.GetOrCreateAsync(
            context,
            channel.Id,
            request.Topic,
            ct);

        var message = await messages.SendMessageAsync(
            context,
            new SendMessageCommand
            {
                ChannelId = channel.Id,
                ThreadId = thread.Id,
                Content = request.Content
            },
            ct);

        return Results.Ok(new { result = "success", msg = "", id = message.Id });
    }

    throw new BadRequestException("Unsupported message type");
}
```

The core service never receives `stream` or `topic`; it receives `channelId` and `threadId`.

## Adapter-Owned Compatibility

These are allowed in `Jotster.Api.Zulip`:

- Response field `stream_id`.
- Request field `topic`.
- Narrow parsing.
- Zulip error messages where compatibility requires exact strings.
- Feature-level reporting.
- Compatibility-specific route aliases.

These are not allowed in core modules:

- `ZULIP_VERSION`.
- `stream` as domain concept.
- `topic` as persisted thread identity.
- `realm`.
- `narrow`.
- `invite_only`.
- Zulip-specific settings as core preferences.

## Mapping Examples

### Channel

Core:

```json
{
  "id": "c_eng",
  "name": "engineering",
  "visibility": "private"
}
```

Zulip adapter:

```json
{
  "stream_id": "c_eng",
  "name": "engineering",
  "invite_only": true
}
```

### Thread

Core:

```json
{
  "id": "t_roadmap",
  "channelId": "c_eng",
  "title": "roadmap"
}
```

Zulip adapter:

```json
{
  "stream_id": "c_eng",
  "topic": "roadmap"
}
```

### Message

Core:

```json
{
  "id": "msg_123",
  "senderParticipantId": "p_asha",
  "channelId": "c_eng",
  "threadId": "t_roadmap"
}
```

Zulip adapter:

```json
{
  "id": "msg_123",
  "sender_id": "zulip_user_asha",
  "stream_id": "c_eng",
  "subject": "roadmap",
  "type": "stream"
}
```

## Compatibility Storage

Compatibility should generally be computed, not stored. If a Zulip-only field has no product meaning, it should not be in core DB.

Bad:

```sql
workspace.zulip_feature_level
message.zulip_subject
participant.zulip_user_id
```

Better:

```sql
api_compat_mapping (
  workspace_id text not null,
  adapter      text not null, -- zulip
  object_kind  text not null,
  object_id    text not null,
  external_id  text not null,
  primary key (workspace_id, adapter, object_kind, object_id)
)
```

Only add an adapter mapping table if deterministic translation is impossible without persistence.

## API Host Routing

Different APIs may be on different hosts or paths:

```text
chat.acme.com             → native web/API
agent.acme.com            → agent API
zulip-compatible.acme.com → Zulip API adapter
```

Or paths:

```text
chat.acme.com/api/...
chat.acme.com/agent/v1/...
chat.acme.com/zulip/...
```

Either way, the same tenant resolution rule applies:

```text
host/path → workspace_id → auth context → core services
```

