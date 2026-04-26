# Current State And Gaps

## Current Schema Shape

The current initial migration creates 44 tables. It already has many useful collaboration concepts, but the ownership boundaries are wrong for the target product.

Current major groups:

- Tenant/workspace-ish: `tenant`, `realm_domain`, `tenant_user_setting_default`.
- Identity/user-ish: `user`, `user_setting`, `api_key`, `client_device`, `push_device_token`.
- Channels: `channel`, `default_channel`, `default_channel_group`, `default_channel_group_item`, `subscription`, `channel_folder`, `channel_folder_item`.
- Conversations/messages: `dm_group`, `dm_group_member`, `message`, `message_edit_history`, `message_flag`, `reaction`, `user_topic`.
- Permissions-ish: `user_group`, `user_group_member`, `user_group_subgroup`, plus JSON permission settings on `tenant.settings_json`.
- Product extras: `attachment`, `custom_emoji`, `custom_profile_field`, `draft`, `alert_word`, `invitation`, `outgoing_webhook`, `saved_snippet`, `reminder`, `scheduled_message`, `navigation_view`, `linkifier`, `data_export`.

## Main Problem: `user` Is Doing Too Much

Current `user` is tenant-scoped:

```ts
export class User {
  Id!: long;
  TenantId!: long;
  Email!: string;
  FullName!: string;
  PasswordHash?: string;
  Role!: int;
  IsBot!: int;
  BotType?: int;
  BotOwnerId?: long;
}
```

This implies:

```text
user -> tenant
```

But the target product needs:

```text
identity -> many workspace_members -> many participants
```

Example target:

```text
identity: asha@example.com
  ├─ acme workspace member: admin, active, participant p_acme_asha
  ├─ beta workspace member: guest, active, participant p_beta_asha
  └─ gamma workspace member: member, suspended, participant p_gamma_asha
```

The same identity can be in many tenants/workspaces. Role and status are membership properties, not global user properties.

## Current Auth Boundary

Current request auth creates an `AuthenticatedUser` with one tenant and one user:

```ts
export class AuthenticatedUser {
  tenantId!: long;
  userId!: long;
  email: string = "";
  role: number = 0;
  isBot: number = 0;
  botType?: number;
}
```

This works for Zulip-style single-tenant API keys, but it is too narrow for domain-routed multi-tenancy and agents. The target auth context should look more like:

```csharp
public sealed record RequestContext(
    WorkspaceId WorkspaceId,
    IdentityId IdentityId,
    ParticipantId ParticipantId,
    CredentialId? CredentialId,
    IReadOnlySet<string> Scopes
);
```

## Current Channel Access

Current channel privacy is represented by `channel.is_private` and membership by `subscription`.

Current behavior:

```ts
if (channel.IsPrivate === 1) {
  if (user.role <= 200) {
    return ok(channel);
  }

  const sub = await db.Subscriptions
    .Where((s) => s.TenantId === user.tenantId)
    .Where((s) => s.UserId === user.userId)
    .Where((s) => s.ChannelId === channelId)
    .FirstOrDefaultAsync();

  if (sub == null) {
    return err("Channel not found");
  }
}
```

This gives the basic idea but has gaps:

- It hardcodes role thresholds.
- It only handles public/private channel access.
- It cannot express thread-level exceptions.
- It cannot express agent/human participants uniformly.
- It cannot express group/resource/action grants like Permiso.
- It duplicates access logic across domains.

Target behavior:

```csharp
await authorization.RequireAsync(
    subject: Subject.Participant(context.ParticipantId),
    resource: Resource.Channel(context.WorkspaceId, channelId),
    action: "channel.read"
);
```

## Current Thread Model Is Not Enough

Current messages store topic as a string:

```ts
export class Message {
  Id!: long;
  TenantId!: long;
  SenderId!: long;
  Type!: string;
  ChannelId?: long;
  Topic?: string;
  DmGroupId?: string;
}
```

This makes thread operations hard:

- No durable thread identity.
- No thread creator/owner.
- No thread lifecycle: archived, resolved, locked, renamed, moved.
- No direct thread-level permission grants.
- `user_topic` must key by `(tenant_id, user_id, channel_id, topic)` string.
- Notifications and follows depend on string matching.
- Renames and moves are error-prone.

Target:

```sql
thread (
  workspace_id  text not null,
  id            text not null,
  channel_id    text not null,
  title         text not null,
  created_by_participant_id text not null,
  state         text not null,
  created_at    integer not null,
  updated_at    integer not null,
  primary key (workspace_id, id)
)
```

And:

```sql
message (
  workspace_id text not null,
  id           text not null,
  conversation_kind text not null,
  channel_id   text,
  thread_id    text,
  direct_chat_id text,
  sender_participant_id text not null,
  content      text not null,
  created_at   integer not null,
  primary key (workspace_id, id)
)
```

## Current Message Read Paths Can Leak Access

The current `getMessages` repo filters by `tenantId`, optional channel/topic/direct-chat/sender, then returns messages. It does not centrally enforce channel membership, direct-chat membership, or thread access for every path.

Unsafe pattern:

```ts
const result = await db.Messages
  .Where((m) => m.TenantId === tenantId)
  .Where((m) => m.ChannelId === channelId)
  .OrderByDescending((m) => m.Id)
  .Take(numBefore)
  .ToArrayAsync();
```

Safer target:

```csharp
var canRead = await authorization.HasPermissionAsync(
    Subject.Participant(context.ParticipantId),
    Resource.Channel(context.WorkspaceId, channelId),
    "channel.read"
);

if (!canRead)
{
    return NotFound();
}

var messages = await db.Messages
    .Where(m => m.WorkspaceId == context.WorkspaceId)
    .Where(m => m.ChannelId == channelId)
    .Where(m => m.ThreadId == threadId)
    .OrderBy(m => m.Id)
    .Take(limit)
    .ToListAsync();
```

The important rule: access checks happen before and/or inside every query path, and raw ID loading is not enough.

## Current Permissions

There is an early permission layer:

```ts
const PERMISSION_DEFAULTS: Record<string, string> = {
  create_public_stream_policy: "role:members",
  edit_topic_policy: "role:everyone",
  can_manage_all_groups: "role:administrators",
  can_delete_any_message: "role:administrators",
};
```

And group membership:

```ts
export const checkPermission = async (
  options,
  tenantId,
  userId,
  settingName,
) => {
  const groupId = await getPermissionSetting(options, tenantId, settingName);
  return await isUserInGroup(options, tenantId, userId, groupId);
};
```

This is conceptually useful but still too Zulip-shaped:

- Permission names are stream/topic/realm based.
- Settings live in `tenant.settings_json`.
- Roles are numeric thresholds on `user.role`.
- Resource/action is implicit, not explicit.

Target should use Permiso-derived resource/action authorization:

```text
subject:  participant:p_acme_asha
resource: /workspaces/acme/channels/eng/threads/roadmap
action:   thread.write
```

## Current Bot Model

Current bots are users:

```ts
user.IsBot = 1;
user.BotType = input.botType;
user.BotOwnerId = actingUser.userId;
```

This is not the final product model. Agents should be humanlike participants, but their execution lives outside Jotster.

Target:

```text
identity kind=agent
workspace_member identity=agent
participant kind=agent
api_credential subject=participant
notification_endpoint kind=webhook|queue|polling
```

No `agent_run`, `agent_step`, or `agent_memory` in Jotster.

## Current DB Positives To Keep Conceptually

The current schema has useful product ideas:

- Workspaces (`tenant`) and workspace domains (`realm_domain`).
- Channels and channel membership (`channel`, `subscription`).
- Direct chats (`dm_group`, `dm_group_member`).
- Messages, reactions, flags, edit history.
- Groups and nested groups.
- Attachments, drafts, reminders, scheduled messages.
- Notification tokens and alert words.
- Webhooks/integrations.

The rewrite should preserve useful concepts but replace the naming, ownership boundaries, and access model.
