# Identity, Participants, And Agents

## Correct Mental Model

Jotster should treat humans and agents as humanlike participants in a workspace.

But agents are external:

- Jotster does not run agents.
- Jotster does not store agent memory.
- Jotster does not store agent plans.
- Jotster does not store agent runs.
- Jotster does not store tool traces.
- Jotster does not own agent approvals.

Jotster owns:

- How agents appear.
- How agents authenticate.
- Which workspace/channel/thread/direct-chat they can access.
- Which notifications they receive.
- Which messages/reactions/actions they create.
- Which delivery endpoints notify them.
- Audit logs for their interactions with Jotster.

## Identity Layers

```text
identity
  ├─ human_profile
  └─ agent_profile

workspace_member
  └─ participant
```

`identity` is global. `participant` is workspace-local.

Example:

```text
identity id_human_asha kind=human
identity id_agent_codex kind=agent

workspace_member wm1 workspace=acme identity=id_human_asha state=active
workspace_member wm2 workspace=acme identity=id_agent_codex state=active

participant p1 workspace=acme member=wm1 kind=human display_name=Asha
participant p2 workspace=acme member=wm2 kind=agent display_name=Codex Reviewer
```

Messages use participants:

```sql
message (
  workspace_id text not null,
  id text not null,
  sender_participant_id text not null
)
```

Not users:

```sql
-- Not target
message.sender_user_id
```

## Target Tables

```sql
identity (
  id          text primary key,
  kind        text not null, -- human | agent
  state       text not null, -- active | suspended | deleted
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
  owner_identity_id text,
  external_system   text, -- codex | claude_code | custom
  description       text,
  created_at        integer not null
)

workspace_member (
  workspace_id text not null,
  id           text not null,
  identity_id  text not null references identity(id),
  state        text not null, -- active | invited | suspended | left
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
```

## Human Example

```csharp
var identity = new Identity
{
    Id = ids.NewIdentityId(),
    Kind = IdentityKind.Human,
    State = IdentityState.Active
};

var member = new WorkspaceMember
{
    WorkspaceId = workspace.Id,
    Id = ids.NewWorkspaceMemberId(),
    IdentityId = identity.Id,
    State = WorkspaceMemberState.Active
};

var participant = new Participant
{
    WorkspaceId = workspace.Id,
    Id = ids.NewParticipantId(),
    WorkspaceMemberId = member.Id,
    Kind = ParticipantKind.Human,
    DisplayName = "Asha"
};
```

## Agent Example

```csharp
var identity = new Identity
{
    Id = ids.NewIdentityId(),
    Kind = IdentityKind.Agent,
    State = IdentityState.Active
};

var agent = new AgentProfile
{
    IdentityId = identity.Id,
    DefaultName = "Codex Reviewer",
    OwnerIdentityId = ownerIdentityId,
    ExternalSystem = "codex",
    Description = "Reviews pull requests and posts summaries"
};

var participant = new Participant
{
    WorkspaceId = workspace.Id,
    Id = ids.NewParticipantId(),
    WorkspaceMemberId = member.Id,
    Kind = ParticipantKind.Agent,
    DisplayName = "Codex Reviewer"
};
```

The agent sends messages the same way a human does:

```csharp
await messages.SendMessageAsync(
    context with { ParticipantId = codexParticipantId },
    new SendMessageCommand
    {
        ChannelId = engineeringChannelId,
        ThreadId = reviewThreadId,
        Content = "I reviewed the migration and found one tenant isolation risk."
    },
    ct);
```

## Agent Notifications

Humans and agents both receive notifications.

```text
Activity
  └─ notification rows for interested participants
       ├─ human delivery: websocket/email/push
       └─ agent delivery: webhook/queue/polling
```

Target notification tables:

```sql
notification (
  workspace_id     text not null,
  id               text not null,
  participant_id   text not null,
  activity_type    text not null,
  object_type      text not null,
  object_id        text not null,
  reason           text not null, -- mention | dm | assignment | thread_reply
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
  kind             text not null, -- websocket | email | push | webhook | queue | polling
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
  status            text not null, -- pending | delivered | failed | abandoned
  attempts          integer not null,
  last_error        text,
  next_attempt_at   integer,
  created_at        integer not null,
  updated_at        integer not null,
  primary key (workspace_id, id)
)
```

## Agent Dispatcher Boundary

The dispatcher can be outside Jotster.

```text
┌──────────────────┐
│     Jotster       │
│ notifications     │
└─────────┬────────┘
          │ webhook / queue / polling
          ▼
┌──────────────────┐
│ Agent Dispatcher │
│ external process │
└─────────┬────────┘
          │
          ├──► Codex
          ├──► Claude Code
          └──► custom agents
```

The dispatcher wakes the right external agent. The agent posts back through the Agent API as its participant.

## What Not To Store

Do not add:

```sql
agent_run
agent_step
agent_memory
agent_prompt
agent_tool_call
agent_plan
agent_trace
```

Those belong in external agent systems.

Jotster can store audit entries for calls into Jotster:

```sql
audit_event (
  workspace_id    text not null,
  id              text not null,
  actor_participant_id text,
  credential_id   text,
  action          text not null,
  resource        text not null,
  metadata_json   text not null,
  created_at      integer not null,
  primary key (workspace_id, id)
)
```

Example audit event:

```json
{
  "workspace_id": "w_acme",
  "actor_participant_id": "p_codex",
  "credential_id": "cred_123",
  "action": "message.create",
  "resource": "/workspaces/w_acme/channels/eng/threads/t_roadmap",
  "metadata": {
    "api": "agent",
    "client": "codex"
  }
}
```

