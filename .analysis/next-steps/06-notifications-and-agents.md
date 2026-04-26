# Notifications And Agent Security

## Goal

Humans and agents should receive notifications through the same product model. Agents are external processes, but inside Jotster they are participants with credentials, permissions, and notification endpoints.

## Current Risk

The in-memory queue ID shape is predictable:

```ts
queueId = workspaceId + ":" + participantId + ":" + seq;
```

Then reads and deletes only require the queue ID.

Bad:

```ts
getEventsFromQueue("w_acme:p_agent:0", now);
deleteQueueById("w_acme:p_agent:0");
```

If exposed as an API, this is a bearer token with low entropy and embedded sensitive IDs.

## Secure Queue Model

Queue IDs must be opaque high-entropy handles.

Target:

```text
queue_public_id = random 256-bit URL-safe token
queue_hash      = hash(queue_public_id)
workspace_id    = active workspace
participant_id  = active participant
expires_at      = timestamp
```

API returns only `queue_public_id`. Storage uses `queue_hash` when persistent.

Read/delete must require both:

```text
authenticated RequestContext
queue token
```

Validation:

```text
queue.workspace_id == context.WorkspaceId
queue.participant_id == context.ParticipantId
queue.expires_at > now
```

## Dispatch Rules

Event dispatch must never be a blind workspace broadcast unless the event has been converted into per-participant notifications through authorization filtering.

Bad:

```ts
dispatchEvent({ workspaceId, type: "message_created", objectId: messageId });
```

This broadcasts to all active queues in the workspace.

Good:

```text
message_created
  -> resolve candidate participants
  -> authorization check per participant
  -> create notification rows per allowed participant
  -> deliver notification rows to matching endpoints
```

## Notification Ownership

Every notification is owned by one participant in one workspace.

```text
notification.workspace_id
notification.participant_id
```

Fetching notification details must go through scoped context plus participant filter:

```ts
await scopedDb.Notifications
  .Where((n) => n.ParticipantId === context.ParticipantId)
  .Where((n) => n.Id === notificationId)
  .FirstOrDefaultAsync();
```

Workspace filter is automatic. Participant filter is authorization/ownership.

## Delivery Ownership

Delivery rows must not connect Alice's notification to Bob's endpoint.

Bad row:

```text
notification_id = notif_alice
endpoint_id = endpoint_bob
```

Target service creation:

```ts
CreateDelivery(context, notification, endpoint) {
  require(notification.WorkspaceId === context.WorkspaceId);
  require(endpoint.WorkspaceId === context.WorkspaceId);
  require(notification.ParticipantId === endpoint.ParticipantId);
  return delivery;
}
```

Preferred DB hardening is described in `04-schema-hardening.md`.

## Agent Contract

Agents are not run by Jotster. Jotster exposes:

- Agent identity/profile.
- Workspace membership and participant record.
- API credentials.
- Permissions.
- Messages/actions.
- Notification endpoints.

Agent-specific endpoints are delivery mechanics, not a separate security model.

Correct:

```text
agent process -> API credential -> participant context -> authorized reads/writes
```

Incorrect:

```text
agent process -> special bypass endpoint -> direct DB/resource access
```

## Endpoint Kinds

Endpoint kinds should be typed and validated:

```text
human_websocket
human_push
human_email
agent_poll_queue
agent_webhook
webhook_generic
```

Each endpoint has validated config:

```text
agent_webhook: url, signing_key_id, retry_policy
agent_poll_queue: queue_policy, visibility_timeout
human_email: verified_address_id, template_policy
```

Do not store arbitrary `config_json` without kind-specific validation.

## Webhook Delivery Security

For agent webhooks and generic webhooks:

- Sign payloads.
- Include timestamp and nonce.
- Reject unsafe URL schemes.
- Add SSRF protections for private/internal address ranges unless explicitly allowlisted.
- Retry with bounded exponential backoff.
- Store delivery attempts without leaking secrets.

## Required Tests

- Queue token is opaque and high entropy.
- Queue read fails for wrong participant in same workspace.
- Queue read fails for same participant in wrong workspace.
- Queue delete fails for wrong participant.
- Workspace-wide event does not reach unauthorized participant.
- Agent mention creates agent notification.
- Human and agent notification creation uses same core path.
- Delivery cannot bind notification to endpoint for another participant.
- Disabled endpoint receives no delivery.
- Webhook endpoint rejects unsafe target URL.

