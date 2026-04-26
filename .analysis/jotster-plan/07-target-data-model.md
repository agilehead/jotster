# Target Data Model

## Schema Principles

The target schema should follow the clean noun-first style used by Tussle while adding hard tenant safety.

Rules:

- Product-owned nouns only.
- `workspace_id` on every workspace-owned table.
- Composite keys where they improve tenant safety.
- No Zulip field names in core tables.
- No raw auth secrets in DB.
- No JSON blobs for core relations or permissions.
- JSON only for bounded extension/config payloads where schema is intentionally flexible.
- Threads are first-class.
- Participants, not users, own collaboration actions.

## Global Tables

Global tables are not tenant-owned. Keep this list small.

```sql
identity (
  id          text primary key,
  kind        text not null, -- human | agent
  state       text not null,
  created_at  integer not null,
  updated_at  integer not null
)

human_profile (
  identity_id   text primary key references identity(id),
  primary_email text,
  name          text,
  avatar_url    text
)

agent_profile (
  identity_id       text primary key references identity(id),
  default_name      text not null,
  owner_identity_id text references identity(id),
  external_system   text,
  description       text,
  created_at        integer not null
)

workspace (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  state       text not null,
  created_at  integer not null,
  updated_at  integer not null
)

workspace_domain (
  host         text primary key,
  workspace_id text not null references workspace(id),
  kind         text not null,
  verified_at  integer,
  created_at   integer not null
)
```

## Identity/Auth Tables

```sql
auth_provider (
  workspace_id text not null,
  id           text not null,
  kind         text not null,
  display_name text not null,
  config_json  text not null,
  enabled      integer not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id)
)

external_identity (
  id               text primary key,
  identity_id      text not null references identity(id),
  workspace_id     text not null,
  auth_provider_id text not null,
  subject          text not null,
  email_at_login   text,
  last_login_at    integer,
  created_at       integer not null,
  unique (workspace_id, auth_provider_id, subject),
  foreign key (workspace_id, auth_provider_id)
    references auth_provider(workspace_id, id)
)

auth_session (
  workspace_id    text not null,
  id              text not null,
  identity_id     text not null references identity(id),
  participant_id  text not null,
  token_hash      text not null unique,
  expires_at      integer not null,
  revoked_at      integer,
  created_at      integer not null,
  primary key (workspace_id, id)
)

api_credential (
  workspace_id    text not null,
  id              text not null,
  subject_kind    text not null,
  subject_id      text not null,
  name            text not null,
  token_hash      text not null unique,
  scopes_json     text not null,
  created_by_participant_id text,
  expires_at      integer,
  revoked_at      integer,
  created_at      integer not null,
  primary key (workspace_id, id)
)
```

## Workspace Participation Tables

```sql
workspace_member (
  workspace_id text not null references workspace(id),
  id           text not null,
  identity_id  text not null references identity(id),
  state        text not null,
  joined_at    integer,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, identity_id)
)

participant (
  workspace_id        text not null,
  id                  text not null,
  workspace_member_id text not null,
  kind                text not null, -- human | agent
  display_name        text not null,
  avatar_url          text,
  timezone            text,
  locale              text,
  state               text not null,
  created_at          integer not null,
  updated_at          integer not null,
  primary key (workspace_id, id),
  foreign key (workspace_id, workspace_member_id)
    references workspace_member(workspace_id, id)
)

participant_preferences (
  workspace_id    text not null,
  participant_id  text not null,
  key             text not null,
  value_json      text not null,
  updated_at      integer not null,
  primary key (workspace_id, participant_id, key),
  foreign key (workspace_id, participant_id)
    references participant(workspace_id, id)
)
```

This replaces the current single `user_setting` table with many Zulip-shaped columns.

## Authorization Tables

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

group_child (
  workspace_id     text not null,
  parent_group_id  text not null,
  child_group_id   text not null,
  created_at       integer not null,
  primary key (workspace_id, parent_group_id, child_group_id)
)

permission_grant (
  workspace_id  text not null,
  id            text not null,
  subject_kind  text not null,
  subject_id    text not null,
  resource_path text not null,
  action        text not null,
  effect        text not null,
  created_at    integer not null,
  primary key (workspace_id, id)
)
```

## Collaboration Tables

```sql
channel (
  workspace_id text not null,
  id           text not null,
  name         text not null,
  description  text not null,
  visibility   text not null, -- public | private | restricted
  state        text not null, -- active | archived
  created_by_participant_id text,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, name)
)

channel_member (
  workspace_id    text not null,
  channel_id      text not null,
  participant_id  text not null,
  role            text not null,
  state           text not null,
  muted           integer not null,
  notification_level text,
  created_at      integer not null,
  updated_at      integer not null,
  primary key (workspace_id, channel_id, participant_id)
)

thread (
  workspace_id text not null,
  id           text not null,
  channel_id   text not null,
  title        text not null,
  state        text not null,
  access_policy text not null, -- inherit | restricted
  created_by_participant_id text not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id),
  foreign key (workspace_id, channel_id)
    references channel(workspace_id, id)
)

direct_chat (
  workspace_id text not null,
  id           text not null,
  kind         text not null,
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

message (
  workspace_id text not null,
  id           text not null,
  sender_participant_id text not null,
  container_kind text not null, -- channel_thread | direct_chat
  channel_id   text,
  thread_id    text,
  direct_chat_id text,
  content      text not null,
  rendered_content text,
  state        text not null,
  created_at   integer not null,
  edited_at    integer,
  primary key (workspace_id, id)
)
```

## Message State Tables

```sql
message_version (
  workspace_id text not null,
  id           text not null,
  message_id   text not null,
  editor_participant_id text not null,
  previous_content text,
  previous_rendered_content text,
  previous_thread_id text,
  previous_channel_id text,
  created_at integer not null,
  primary key (workspace_id, id)
)

message_marker (
  workspace_id    text not null,
  message_id      text not null,
  participant_id  text not null,
  marker          text not null,
  created_at      integer not null,
  primary key (workspace_id, message_id, participant_id, marker)
)

reaction (
  workspace_id    text not null,
  id              text not null,
  message_id      text not null,
  participant_id  text not null,
  emoji_key       text not null,
  created_at      integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, message_id, participant_id, emoji_key)
)
```

## Workspace Extension Tables

These are product-owned tables for generic collaboration features. They replace current Zulip-shaped extras without making the core depend on Zulip compatibility fields.

```sql
attachment (
  workspace_id text not null,
  id           text not null,
  owner_participant_id text not null,
  message_id   text,
  storage_key  text not null,
  file_name    text not null,
  content_type text not null,
  byte_size    integer not null,
  created_at   integer not null,
  primary key (workspace_id, id)
)

emoji (
  workspace_id text not null,
  id           text not null,
  key          text not null,
  display_name text not null,
  image_storage_key text not null,
  created_by_participant_id text,
  created_at   integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, key)
)

profile_field (
  workspace_id text not null,
  id           text not null,
  key          text not null,
  label        text not null,
  value_kind   text not null,
  required     integer not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, key)
)

participant_profile_field_value (
  workspace_id      text not null,
  participant_id    text not null,
  profile_field_id  text not null,
  value_json        text not null,
  updated_at        integer not null,
  primary key (workspace_id, participant_id, profile_field_id)
)

workspace_member_defaults (
  workspace_id text not null,
  key          text not null,
  value_json   text not null,
  updated_at   integer not null,
  primary key (workspace_id, key)
)
```

Integration and audit tables stay generic:

```sql
webhook (
  workspace_id text not null,
  id           text not null,
  owner_participant_id text,
  direction    text not null, -- inbound | outbound
  event_filter_json text not null,
  target_config_json text not null,
  secret_hash  text,
  enabled      integer not null,
  created_at   integer not null,
  updated_at   integer not null,
  primary key (workspace_id, id)
)

device_token (
  workspace_id    text not null,
  id              text not null,
  participant_id  text not null,
  provider        text not null,
  token_hash      text not null,
  enabled         integer not null,
  created_at      integer not null,
  updated_at      integer not null,
  primary key (workspace_id, id),
  unique (workspace_id, provider, token_hash)
)

audit_event (
  workspace_id text not null,
  id           text not null,
  actor_participant_id text,
  action       text not null,
  object_type  text not null,
  object_id    text,
  metadata_json text not null,
  created_at   integer not null,
  primary key (workspace_id, id)
)
```

## Notification Tables

```sql
notification (
  workspace_id     text not null,
  id               text not null,
  participant_id   text not null,
  activity_type    text not null,
  object_type      text not null,
  object_id        text not null,
  reason           text not null,
  payload_json     text not null,
  created_at       integer not null,
  read_at          integer,
  consumed_at      integer,
  primary key (workspace_id, id)
)

notification_endpoint (
  workspace_id     text not null,
  id               text not null,
  participant_id   text not null,
  kind             text not null,
  config_json      text not null,
  enabled          integer not null,
  created_at       integer not null,
  updated_at       integer not null,
  primary key (workspace_id, id)
)

notification_delivery (
  workspace_id      text not null,
  id                text not null,
  notification_id   text not null,
  endpoint_id       text not null,
  status            text not null,
  attempts          integer not null,
  last_error        text,
  next_attempt_at   integer,
  created_at        integer not null,
  updated_at        integer not null,
  primary key (workspace_id, id)
)
```

## Example Query Patterns

Bad:

```csharp
await db.Messages.SingleAsync(m => m.Id == messageId);
```

Correct:

```csharp
await db.Messages.SingleOrDefaultAsync(
    m => m.WorkspaceId == context.WorkspaceId &&
         m.Id == messageId,
    ct);
```

Bad:

```csharp
await db.ChannelMembers
    .Where(m => m.ChannelId == channelId)
    .ToListAsync(ct);
```

Correct:

```csharp
await db.ChannelMembers
    .Where(m => m.WorkspaceId == context.WorkspaceId)
    .Where(m => m.ChannelId == channelId)
    .ToListAsync(ct);
```

## Current Table Disposition

| Current table | Target disposition |
|---|---|
| `tenant` | Replace with `workspace`. |
| `user` | Split into `identity`, profile, `workspace_member`, `participant`. |
| `user_setting` | Replace with `participant_preferences` and notification preferences. |
| `api_key` | Replace with scoped `api_credential`; never store raw key. |
| `channel` | Keep concept; rename ownership to `workspace_id`, replace flags with visibility/state. |
| `subscription` | Replace with `channel_member`. |
| `dm_group` | Replace with `direct_chat`. |
| `dm_group_member` | Replace with `direct_chat_member`. |
| `message` | Keep concept; sender becomes participant; thread/direct-chat first-class. |
| `message_edit_history` | Replace with `message_version`. |
| `message_flag` | Replace with `message_marker`. |
| `reaction` | Keep concept; actor becomes participant. |
| `user_group*` | Replace with `group`, `group_member`, `group_child`; authz owns semantics. |
| `user_topic` | Replace with thread preferences keyed by `thread_id`. |
| `realm_domain` | Replace with `workspace_domain`. |
| `outgoing_webhook` | Replace with webhook/integration/notification endpoint model. |
| `bot_storage` | Remove from core. External agent systems own storage. |
