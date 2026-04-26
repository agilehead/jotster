# Target Architecture

## Monorepo Layout

The rewrite should make Jotster a .NET-first modular monorepo. Persona and Permiso are not copied as JS services; their proven concepts are ported into .NET modules with explicit contracts.

```text
Jotster.sln
├─ src/
│  ├─ Jotster.AppHost/
│  ├─ Jotster.Core/
│  ├─ Jotster.Database/
│  ├─ Jotster.Identity/
│  ├─ Jotster.Authorization/
│  ├─ Jotster.Collaboration/
│  ├─ Jotster.Notifications/
│  ├─ Jotster.Api.Native/
│  ├─ Jotster.Api.Agent/
│  ├─ Jotster.Api.Zulip/
│  └─ Jotster.Workers/
├─ tests/
│  ├─ Jotster.Identity.Tests/
│  ├─ Jotster.Authorization.Tests/
│  ├─ Jotster.Collaboration.Tests/
│  ├─ Jotster.Notifications.Tests/
│  ├─ Jotster.Api.Native.Tests/
│  ├─ Jotster.Api.Agent.Tests/
│  ├─ Jotster.Api.Zulip.Tests/
│  └─ Jotster.TenantIsolation.Tests/
└─ database/
   └─ migrations/
```

## Module Responsibilities

### `Jotster.Identity`

Persona-derived identity service:

- Auth provider configuration per workspace.
- OIDC/SAML/OAuth external identity linking.
- Human auth sessions.
- Agent/service account credentials.
- API credential creation/revocation.
- Credential scope validation.
- Password support only if product explicitly wants local auth.

It answers:

```text
Who are you?
Which workspace participant are you acting as?
Which credential/session did you use?
```

### `Jotster.Authorization`

Permiso-derived authorization service:

- Workspace-scoped roles.
- Groups and group membership.
- Resource registration.
- Direct grants.
- Role grants.
- Effective permission calculation.
- `HasPermission(subject, resource, action)`.

It answers:

```text
May this participant do this action on this resource?
```

### `Jotster.Collaboration`

Product core:

- Workspaces.
- Participants.
- Channels.
- Channel members.
- Threads.
- Direct chats.
- Messages.
- Reactions.
- Attachments.
- Drafts.
- Message versions.
- Message markers.

It answers:

```text
What exists in the watercooler?
What changed?
Who participated?
```

### `Jotster.Notifications`

Human and agent notifications:

- Notification generation.
- Notification preferences.
- Notification endpoints.
- Delivery attempts.
- Websocket fanout.
- Push/email/webhook/queue/polling delivery.

It answers:

```text
Who should be notified?
How should they receive it?
Has delivery succeeded?
```

### API Modules

```text
Jotster.Api.Native  → product-first API
Jotster.Api.Agent   → machine-friendly API for external agents
Jotster.Api.Zulip   → compatibility adapter only
```

API modules should not own core tables. They translate request/response shapes and call core services.

## Process Topology

One deployment can host all modules in one process initially:

```text
┌──────────────────────────────────────────────────────────┐
│ Jotster.AppHost                                           │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Native API    │ │ Agent API     │ │ Zulip API Edge    │ │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          ▼                              │
│        Identity + Authorization + Collaboration          │
│                          ▼                              │
│                    Notifications                         │
│                          ▼                              │
│                      Database                            │
└──────────────────────────────────────────────────────────┘
```

The module boundaries should still be hard enough that services can later be split into separate processes if needed.

## Dependency Direction

```text
API modules
  depend on Identity, Authorization, Collaboration, Notifications contracts

Collaboration
  depends on Authorization contracts for checks
  depends on Notifications contracts for event/notification creation
  does not depend on API modules

Identity
  does not depend on Collaboration implementation
  may resolve participant membership through an interface

Authorization
  does not depend on API modules
  may use Collaboration resource IDs but not adapter terms

Database
  exposes EF Core DbContext and migrations
```

Bad dependency:

```text
Jotster.Collaboration -> Jotster.Api.Zulip
```

Allowed dependency:

```text
Jotster.Api.Zulip -> Jotster.Collaboration
```

## Example Service Contracts

```csharp
public interface IWorkspaceResolver
{
    Task<WorkspaceContext?> ResolveByHostAsync(string host, CancellationToken ct);
}

public interface IIdentityService
{
    Task<AuthResult> AuthenticateSessionAsync(
        WorkspaceContext workspace,
        HttpRequest request,
        CancellationToken ct);

    Task<AuthResult> AuthenticateCredentialAsync(
        WorkspaceContext workspace,
        string token,
        CancellationToken ct);
}

public interface IAuthorizationService
{
    Task<bool> HasPermissionAsync(
        Subject subject,
        ResourcePath resource,
        string action,
        CancellationToken ct);

    Task RequireAsync(
        Subject subject,
        ResourcePath resource,
        string action,
        CancellationToken ct);
}

public interface IMessageService
{
    Task<MessageDto> SendMessageAsync(
        RequestContext context,
        SendMessageCommand command,
        CancellationToken ct);
}
```

## Request Pipeline

```text
Incoming HTTP request
  ↓
Normalize host
  ↓
Resolve workspace_domain → workspace_id
  ↓
Authenticate session/API credential in that workspace context
  ↓
Resolve identity → workspace_member → participant
  ↓
Attach RequestContext(workspace_id, identity_id, participant_id)
  ↓
API handler parses adapter-specific request
  ↓
Domain service performs authorization
  ↓
Domain service reads/writes workspace-scoped rows
  ↓
Notification service creates notifications
  ↓
API handler maps response shape
```

## Example Handler

```csharp
public async Task<IResult> SendChannelMessage(
    RequestContext context,
    SendChannelMessageRequest request,
    IMessageService messages,
    CancellationToken ct)
{
    var command = new SendMessageCommand
    {
        ChannelId = request.ChannelId,
        ThreadId = request.ThreadId,
        Content = request.Content
    };

    var message = await messages.SendMessageAsync(context, command, ct);
    return Results.Ok(message);
}
```

The handler does not query by tenant manually. The context already contains `workspace_id`, and services enforce it.

