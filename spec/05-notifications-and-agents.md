# Notifications And Agents

Notifications are participant-directed. Humans and agents receive the same notification objects; endpoints decide delivery mechanics.

## Notification Flow

```text
product event
  -> authorization/filtering
  -> notification row
  -> endpoint selection
  -> delivery row
  -> external delivery worker
```

## Endpoint Kinds

- Human UI queue
- Email
- Push token
- Webhook
- Agent poll queue
- Agent webhook

## Agent Contract

An agent is an external process. It authenticates with a workspace-scoped credential, reads notifications, fetches referenced objects, and posts messages or actions as its participant. Jotster does not spawn agents or persist their internal state.

## Safety Rules

- Notifications carry `workspace_id` and `participant_id`.
- Delivery endpoints are scoped to a participant in one workspace.
- Notification payloads reference objects by product IDs; clients fetch full objects through authorized APIs.
