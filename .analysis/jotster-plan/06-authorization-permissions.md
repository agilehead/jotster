# Authorization And Permissions

## Source Of Ideas

Permiso has the right basic authorization shape. These are source concepts, not names to copy into Jotster core:

```text
tenant
user
role
resource
user_role
user_permission
role_permission
```

And source-style checks like:

```text
hasPermission(userId, resourceId, action)
```

Jotster should port this as a .NET module, but adapt it to the Jotster identity model:

```text
workspace
participant
role
group
resource
permission_grant
```

The target check shape must use the request workspace and participant context:

```csharp
await authorization.RequireAsync(
    context.WorkspaceId,
    Subject.Participant(context.ParticipantId),
    Resources.Thread(context.WorkspaceId, channelId, threadId),
    "thread.write"
);
```

## Authorization Model

Authorization should be subject/resource/action based.

```text
subject  = participant:p_codex
resource = /workspaces/w_acme/channels/c_eng/threads/t_roadmap
action   = thread.write
```

Common subjects:

```text
participant:p_123
identity:id_123
group:g_123
role:r_admin
system:workspace_member
```

Common actions:

```text
workspace.read
workspace.manage
participant.invite
participant.manage
channel.create
channel.read
channel.write
channel.manage
thread.read
thread.write
thread.manage
message.create
message.edit.own
message.edit.any
message.delete.own
message.delete.any
reaction.create
attachment.upload
notification.manage_self
webhook.manage
credential.manage_self
credential.manage_any
```

## Resource Paths

Use deterministic resource paths. They are useful for wildcard/prefix permissions and for audit.

```text
/workspaces/{workspaceId}
/workspaces/{workspaceId}/participants/{participantId}
/workspaces/{workspaceId}/channels/{channelId}
/workspaces/{workspaceId}/channels/{channelId}/threads/{threadId}
/workspaces/{workspaceId}/direct-chats/{directChatId}
/workspaces/{workspaceId}/messages/{messageId}
/workspaces/{workspaceId}/webhooks/{webhookId}
```

Example:

```csharp
public static class Resources
{
    public static ResourcePath Workspace(string workspaceId) =>
        ResourcePath.Parse($"/workspaces/{workspaceId}");

    public static ResourcePath Channel(string workspaceId, string channelId) =>
        ResourcePath.Parse($"/workspaces/{workspaceId}/channels/{channelId}");

    public static ResourcePath Thread(string workspaceId, string channelId, string threadId) =>
        ResourcePath.Parse($"/workspaces/{workspaceId}/channels/{channelId}/threads/{threadId}");
}
```

## Target Tables

```sql
role (
  workspace_id text not null,
  id           text not null,
  name         text not null,
  description  text,
  system       integer not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, name)
)

participant_role (
  workspace_id    text not null,
  participant_id  text not null,
  role_id         text not null,
  created_at      integer not null,
  primary key (workspace_id, participant_id, role_id)
)

group (
  workspace_id text not null,
  id           text not null,
  name         text not null,
  description  text,
  system       integer not null,
  state        text not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, name)
)

group_member (
  workspace_id    text not null,
  group_id        text not null,
  participant_id  text not null,
  created_at      integer not null,
  primary key (workspace_id, group_id, participant_id)
)

permission_grant (
  workspace_id  text not null,
  id            text not null,
  subject_kind  text not null, -- participant | role | group | system
  subject_id    text not null,
  resource_path text not null,
  action        text not null,
  effect        text not null, -- allow | deny
  created_at    integer not null,
  primary key (workspace_id, id)
)
```

## Channel Access

Channel access should not be hardcoded with `is_private` checks scattered through services.

Target channel fields:

```sql
channel (
  workspace_id text not null,
  id           text not null,
  name         text not null,
  description  text not null,
  visibility   text not null, -- public | private | restricted
  state        text not null,
  created_by_participant_id text,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id)
)

channel_member (
  workspace_id    text not null,
  channel_id      text not null,
  participant_id  text not null,
  role            text not null, -- member | moderator | owner
  state           text not null,
  muted           integer not null,
  created_at      integer not null,
  updated_at      integer not null,
  primary key (workspace_id, channel_id, participant_id)
)
```

Default rules:

- Public channel: active workspace members have `channel.read`.
- Private channel: only channel members have `channel.read`.
- Restricted channel: authorization grants decide read/write/manage.
- Channel owners/moderators can manage membership if granted.

Example:

```csharp
public async Task<bool> CanReadChannel(RequestContext context, Channel channel, CancellationToken ct)
{
    if (channel.Visibility == ChannelVisibility.Public)
    {
        return await authz.HasPermissionAsync(
            Subject.Participant(context.ParticipantId),
            Resources.Workspace(context.WorkspaceId),
            "workspace.read",
            ct);
    }

    return await authz.HasPermissionAsync(
        Subject.Participant(context.ParticipantId),
        Resources.Channel(context.WorkspaceId, channel.Id),
        "channel.read",
        ct);
}
```

## Thread Access

Threads normally inherit channel access.

Restricted/locked threads can override:

```sql
thread (
  workspace_id text not null,
  id           text not null,
  channel_id   text not null,
  title        text not null,
  state        text not null, -- active | archived | locked | resolved
  access_policy text not null, -- inherit | restricted
  created_by_participant_id text not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id)
)
```

Access:

```csharp
public async Task RequireThreadWriteAsync(
    RequestContext context,
    Thread thread,
    CancellationToken ct)
{
    if (thread.AccessPolicy == ThreadAccessPolicy.Inherit)
    {
        await authz.RequireAsync(
            Subject.Participant(context.ParticipantId),
            Resources.Channel(context.WorkspaceId, thread.ChannelId),
            "channel.write",
            ct);
        return;
    }

    await authz.RequireAsync(
        Subject.Participant(context.ParticipantId),
        Resources.Thread(context.WorkspaceId, thread.ChannelId, thread.Id),
        "thread.write",
        ct);
}
```

## Direct Chat Access

Direct chat access is membership-based.

```sql
direct_chat (
  workspace_id text not null,
  id           text not null,
  kind         text not null, -- one_to_one | group
  created_at   integer not null,
  primary key (workspace_id, id)
)

direct_chat_member (
  workspace_id    text not null,
  direct_chat_id  text not null,
  participant_id  text not null,
  state           text not null,
  created_at      integer not null,
  primary key (workspace_id, direct_chat_id, participant_id)
)
```

Read check:

```csharp
var member = await db.DirectChatMembers.AnyAsync(
    m => m.WorkspaceId == context.WorkspaceId &&
         m.DirectChatId == directChatId &&
         m.ParticipantId == context.ParticipantId &&
         m.State == "active",
    ct);

if (!member)
{
    throw new NotFoundException();
}
```

## Message Access

Messages inherit access from their container.

```text
channel thread message → channel/thread read
direct chat message    → direct chat membership
```

Edit/delete rules should use permissions:

```csharp
if (message.SenderParticipantId == context.ParticipantId)
{
    await authz.RequireAsync(subject, messageResource, "message.edit.own", ct);
}
else
{
    await authz.RequireAsync(subject, messageResource, "message.edit.any", ct);
}
```

Do not use raw numeric thresholds:

```ts
// Current style; not target
const isAdmin = user.role <= 200;
const isModerator = user.role <= 300;
```

Target:

```csharp
var canEditAny = await authz.HasPermissionAsync(
    Subject.Participant(context.ParticipantId),
    Resources.Message(context.WorkspaceId, message.Id),
    "message.edit.any",
    ct);
```

## Workspace Membership

User-to-tenant one-to-many is handled by `workspace_member`.

```text
identity id_asha
  ├─ workspace_member w_acme / p_asha_acme
  └─ workspace_member w_beta / p_asha_beta
```

Roles are assigned to the participant/member in the workspace:

```text
p_asha_acme -> role:workspace_admin
p_asha_beta -> role:member
```

This is the major correction from current `user.tenant_id` + `user.role`.

## Tenant-Safe Authorization

Every grant is workspace-scoped:

```sql
permission_grant.workspace_id = context.workspace_id
```

Every authorization check carries workspace:

```csharp
await authorization.HasPermissionAsync(
    Subject.Participant(context.ParticipantId),
    ResourcePath.Parse($"/workspaces/{context.WorkspaceId}/channels/{channelId}"),
    "channel.read",
    ct);
```

No check should accept only `participantId` and `resourceId` without `workspaceId`.
