# Rewrite Execution Plan

## Phase 0: Lock Principles And Terms

Deliverables:

- Canonical vocabulary approved.
- Banned legacy terms list enforced.
- Module boundary diagram approved.
- Target table list approved.
- API boundary rules approved.

Checks:

```bash
rg -n "zulip|realm|stream|topic|subscription|invite_only|narrow|legacy|compat" src/Jotster.* \
  -g '!src/Jotster.Api.Zulip/**' \
  -g '!tests/Jotster.Api.Zulip.Tests/**'
```

Expected: no matches except approved compatibility docs/tests.

## Phase 1: Create .NET Module Skeleton

Create:

```text
Jotster.Core
Jotster.Database
Jotster.Identity
Jotster.Authorization
Jotster.Collaboration
Jotster.Notifications
Jotster.Api.Native
Jotster.Api.Agent
Jotster.Api.Zulip
Jotster.Workers
```

Define:

- `WorkspaceId`
- `IdentityId`
- `ParticipantId`
- `RequestContext`
- `ResourcePath`
- result/error primitives
- clock/id abstractions

Example:

```csharp
public readonly record struct WorkspaceId(string Value);
public readonly record struct IdentityId(string Value);
public readonly record struct ParticipantId(string Value);

public sealed record RequestContext(
    WorkspaceId WorkspaceId,
    IdentityId IdentityId,
    ParticipantId ParticipantId,
    string? CredentialId,
    IReadOnlySet<string> Scopes
);
```

## Phase 2: Build Database Foundation

Implement EF Core models and migrations for:

- Global identity/workspace/domain tables.
- Workspace participant tables.
- Auth provider/session/credential tables.
- Authorization tables.
- Collaboration base tables.
- Notification base tables.

Important:

- No old tables mixed with new tables in the same model unless migration strategy explicitly requires it.
- Every workspace-owned entity includes `WorkspaceId`.
- Composite indexes/FKs include `WorkspaceId`.

Example EF shape:

```csharp
modelBuilder.Entity<Message>()
    .HasKey(x => new { x.WorkspaceId, x.Id });

modelBuilder.Entity<Message>()
    .HasIndex(x => new { x.WorkspaceId, x.ChannelId, x.ThreadId, x.Id });

modelBuilder.Entity<Message>()
    .HasOne<Thread>()
    .WithMany()
    .HasForeignKey(x => new { x.WorkspaceId, x.ThreadId });
```

## Phase 3: Port Persona Concepts Into `Jotster.Identity`

Do not copy Persona JS. Port the concepts:

- Provider subject uniqueness.
- Identity creation/linking.
- Session issuance.
- Token hashing.
- Refresh/session revocation.
- Internal link/update flows.

Adaptations:

- `tenant_id` becomes `workspace_id`.
- `user_id` becomes `identity_id`/`participant_id` depending on operation.
- Roles move out of identity into authorization.
- Support human SSO and agent credentials.

Example login result:

```csharp
public sealed record LoginResult(
    IdentityId IdentityId,
    WorkspaceId WorkspaceId,
    ParticipantId ParticipantId,
    string SessionToken,
    DateTimeOffset ExpiresAt
);
```

## Phase 4: Port Permiso Concepts Into `Jotster.Authorization`

Do not copy Permiso JS. Port the concepts:

- Roles.
- Resources.
- Permission grants.
- Direct participant grants.
- Role grants.
- Group grants.
- Effective permissions.
- Prefix/wildcard resource matching.

Adaptations:

- `tenant_id` becomes `workspace_id`.
- `user` becomes `participant`.
- Resource paths use Jotster canonical product paths.
- Actions are explicit product actions.

Example:

```csharp
await authorization.GrantAsync(
    workspaceId,
    Subject.Role(adminRoleId),
    Resources.Workspace(workspaceId),
    "workspace.manage",
    ct);
```

## Phase 5: Implement Collaboration Core

Order:

1. Workspaces/domains.
2. Participants.
3. Channels.
4. Channel members.
5. Threads.
6. Direct chats.
7. Messages.
8. Reactions.
9. Attachments.
10. Message versions and markers.

Every service method takes `RequestContext`.

Example:

```csharp
public Task<MessageDto> SendMessageAsync(
    RequestContext context,
    SendMessageCommand command,
    CancellationToken ct);
```

No domain method should accept only `userId` and `tenantId`.

## Phase 6: Implement Notifications

Build generic notifications:

- Message mention.
- Direct chat message.
- Thread reply.
- Channel invite.
- Assignment/follow-up if product includes it.

Then delivery:

- Websocket for active clients.
- Email/push for humans.
- Webhook/queue/polling for agents.

Example:

```csharp
await notifications.NotifyAsync(
    context.WorkspaceId,
    new NotificationCommand
    {
        ParticipantId = targetParticipantId,
        ActivityType = "message.created",
        ObjectType = "message",
        ObjectId = message.Id,
        Reason = "mention",
        Payload = payload
    },
    ct);
```

## Phase 7: Build Native And Agent APIs

Native API:

- Workspace info.
- Channels.
- Threads.
- Messages.
- Direct chats.
- Participants.
- Notifications.
- Preferences.
- Credentials.

Agent API:

- Poll notifications.
- Ack/consume notifications.
- Post messages.
- Read allowed context.
- Update agent profile/display.
- Manage agent endpoints if scoped.

## Phase 8: Move Zulip To Edge

Create `Jotster.Api.Zulip`.

Responsibilities:

- Parse Zulip request formats.
- Translate `stream` → `channel`.
- Translate `topic`/`subject` → `thread`.
- Translate `narrow` → core filters.
- Map response fields.
- Preserve compatible error strings where required.

Forbidden:

- Core DB references to Zulip names.
- Core service methods named for Zulip concepts.
- Zulip settings in core preferences unless generalized.

## Phase 9: Migration Strategy

There are two viable strategies.

### Strategy A: Greenfield Cutover

Use if production data can be reset or migrated offline.

```text
old DB -> migration tool -> new DB
```

Pros:

- Cleanest result.
- No long-term dual-model complexity.

Cons:

- Requires migration tool and downtime/cutover.

### Strategy B: Dual Read/Write Transition

Use only if compatibility must be preserved during live migration.

```text
old writes + new writes
old reads gradually replaced by new reads
```

Pros:

- Lower cutover risk for live users.

Cons:

- More complexity.
- More chance of subtle data drift.

Given current direction, prefer Strategy A unless hard production requirements say otherwise.

## Phase 10: Delete Old Model

Removal is part of the plan, not cleanup later.

Delete/retire:

- `tenant` product naming in core.
- `user` as actor.
- `subscription`.
- `topic` string thread identity.
- Zulip settings in core.
- Numeric role thresholds.
- `bot_storage`.
- Direct `is_bot` domain logic.

Acceptance condition:

```text
Core can operate without the old Zulip-shaped schema.
```

