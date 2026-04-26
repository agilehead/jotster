# Threat Model And Security Principles

## Security Boundary

The primary boundary is the workspace. A single Jotster deployment can host many workspaces, but data and authority must be isolated as if each workspace were a separate deployment.

```text
Deployment
  ├─ workspace w_acme
  │   ├─ participants
  │   ├─ channels / threads / messages
  │   ├─ credentials / sessions
  │   └─ notifications / endpoints
  └─ workspace w_beta
      ├─ participants
      ├─ channels / threads / messages
      ├─ credentials / sessions
      └─ notifications / endpoints
```

`identity` is global. `participant` is workspace-local. All product activity is performed as a participant inside one workspace.

## Attacker Model

Assume an attacker can:

- Know or guess IDs from another workspace.
- Send arbitrary request bodies.
- Control URL path parameters.
- Control `Host` unless proxy/header trust is handled correctly.
- Replay old credentials or queue IDs.
- Trigger handler code paths that a developer forgot to manually scope.
- Observe API error messages.
- Create malicious JSON payload values such as embedded quotes or unexpected object fields.

The system must remain safe under these assumptions.

## Non-Negotiable Principles

### 1. Workspace Is Resolved Once

The workspace comes from a verified domain or an explicit trusted internal job context. It must not be inferred from body fields after request routing.

Bad:

```ts
const workspaceId = req.body.workspaceId;
```

Good:

```ts
const context = req.context;
const workspaceId = context.WorkspaceId;
```

### 2. Workspace Scoping Is Automatic

Every workspace-owned query must be scoped by construction.

Bad:

```ts
await db.Messages.Where((m) => m.Id === messageId).FirstOrDefaultAsync();
```

Good:

```ts
await scopedDb.Messages.Where((m) => m.Id === messageId).FirstOrDefaultAsync();
```

The second shape is safe only if `scopedDb.Messages` automatically applies `WorkspaceId == context.WorkspaceId`.

### 3. Writes Are Guarded

A scoped request for `w_acme` must not be able to insert or modify a row with `WorkspaceId = w_beta`.

Bad:

```ts
const message = createChannelMessageRecord({
  workspaceId: req.body.workspaceId,
  senderParticipantId,
  channelId,
  threadId,
  content,
  createdAt,
});
```

Good:

```ts
const message = createChannelMessageRecord({
  workspaceId: context.WorkspaceId,
  senderParticipantId: context.ParticipantId,
  channelId,
  threadId,
  content,
  createdAt,
});

await scopedDb.SaveChangesAsync(); // rejects mismatched WorkspaceId before write
```

### 4. Authorization Is Separate From Visibility

Filtering data to a workspace is not authorization. A participant can be inside the workspace and still lack access to a private channel, restricted thread, webhook, or credential.

Required order:

```text
workspace scope -> load candidate row -> authorization check -> return result
```

For hidden resources, return not-found unless product semantics require explicit forbidden.

### 5. Global Tables Have Explicit Services

Global tables such as `identity`, `human_profile`, `agent_profile`, `workspace`, and `workspace_domain` are not workspace-owned. They still must not be casually queried from product handlers.

Allowed examples:

- Domain resolution service reads `workspace_domain` by canonical host.
- Authentication service reads `identity` through verified provider/session/credential paths.
- Admin/internal service reads global roots with explicit root authority.

Disallowed example:

```ts
await db.Identities.Where((x) => x.PrimaryEmail === email).ToArrayAsync();
```

from an arbitrary workspace handler.

### 6. Edge APIs Cannot Shape Core Security

The Zulip API is an adapter. It can translate wire terms, but it cannot introduce storage tables, permissions, or exceptions that affect core security.

