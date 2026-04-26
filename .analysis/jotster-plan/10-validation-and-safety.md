# Validation And Safety

## Validation Philosophy

This rewrite must be proven by tests and static checks. The main risks are:

- Tenant data leakage.
- Permission bypass.
- Zulip terms leaking into core.
- Agents receiving or posting outside their scope.
- Sessions being valid across the wrong domain/workspace.
- Migration drift from old schema to new schema.

## Static Hygiene Checks

### Legacy Term Check

Run:

```bash
rg -n "zulip|realm|stream|topic|subscription|invite_only|narrow|feature_level|legacy|compat" src tests \
  -g '!src/Jotster.Api.Zulip/**' \
  -g '!tests/Jotster.Api.Zulip.Tests/**' \
  -g '!docs/**'
```

Expected:

- No matches outside adapters/tests/docs.
- If a match exists, it must be intentionally whitelisted with rationale.

### Raw ID Query Check

Search for unsafe patterns:

```bash
rg -n "SingleAsync\\(.*=>.*\\.Id ==|SingleOrDefaultAsync\\(.*=>.*\\.Id ==|FindAsync\\(" src/Jotster.*
```

Every workspace-owned lookup must include `WorkspaceId`.

Bad:

```csharp
await db.Channels.SingleAsync(c => c.Id == channelId);
```

Good:

```csharp
await db.Channels.SingleAsync(
    c => c.WorkspaceId == context.WorkspaceId &&
         c.Id == channelId);
```

## Tenant Isolation Tests

Create a dedicated tenant isolation test suite.

Fixture:

```text
workspace A
  participant A1
  channel A
  thread A
  message A

workspace B
  participant B1
  channel B
  thread B
  message B
```

Tests:

- A participant cannot fetch B workspace by ID.
- A participant cannot fetch B channel by ID.
- A participant cannot fetch B thread by ID.
- A participant cannot fetch B message by ID.
- A participant cannot receive B notifications.
- A participant cannot use B credential on A domain.
- B domain session is rejected on A domain.

Example:

```csharp
[Fact]
public async Task Cannot_Read_Message_From_Another_Workspace()
{
    var acme = await fixture.CreateWorkspaceAsync("acme");
    var beta = await fixture.CreateWorkspaceAsync("beta");

    var acmeUser = await fixture.CreateParticipantAsync(acme);
    var betaMessage = await fixture.CreateMessageAsync(beta);

    var result = await messages.GetMessageAsync(
        fixture.Context(acme, acmeUser),
        betaMessage.Id,
        CancellationToken.None);

    result.ShouldBeNotFound();
}
```

## Authorization Tests

Test the permission matrix.

Channel read:

| Channel visibility | Participant state | Expected |
|---|---|---|
| public | workspace member | allow |
| private | not channel member | deny/not found |
| private | channel member | allow |
| restricted | explicit grant | allow |
| restricted | no grant | deny/not found |

Thread write:

| Thread access | Channel write | Thread write grant | Expected |
|---|---:|---:|---|
| inherit | yes | no | allow |
| inherit | no | yes | deny unless channel policy says otherwise |
| restricted | yes | no | deny |
| restricted | no | yes | allow |

Message edit:

| Actor | Permission | Expected |
|---|---|---|
| sender | `message.edit.own` | allow |
| non-sender | no grant | deny |
| moderator | `message.edit.any` | allow |
| agent | scoped `message.edit.own` | allow own only |

## Auth Tests

Domain routing:

```text
Host: chat.acme.com -> workspace acme
Host: beta.example.org -> workspace beta
```

Tests:

- Unknown host rejected.
- Unverified domain rejected.
- Session for `acme` rejected on `beta`.
- Credential for `acme` rejected on `beta`.
- Same identity can log into both domains and get different participants.

Example:

```csharp
[Fact]
public async Task Same_Identity_Gets_Different_Participants_Per_Workspace()
{
    var identity = await fixture.CreateIdentityAsync("asha@example.com");
    var acme = await fixture.CreateWorkspaceAsync("acme");
    var beta = await fixture.CreateWorkspaceAsync("beta");

    var acmeParticipant = await fixture.JoinAsync(identity, acme, role: "admin");
    var betaParticipant = await fixture.JoinAsync(identity, beta, role: "member");

    acmeParticipant.Id.ShouldNotBe(betaParticipant.Id);
}
```

## Agent Tests

Agent behavior should prove agents are humanlike participants.

Tests:

- Agent can join channel.
- Agent can receive mention notification.
- Agent can poll/receive webhook notification.
- Agent can post a reply with API credential.
- Agent cannot read channel it is not a member of.
- Agent cannot use credential outside workspace.
- Agent notification does not require internal `agent_run`.

Example:

```csharp
[Fact]
public async Task Mention_Creates_Agent_Notification()
{
    var workspace = await fixture.CreateWorkspaceAsync("acme");
    var human = await fixture.CreateHumanParticipantAsync(workspace);
    var agent = await fixture.CreateAgentParticipantAsync(workspace, "Codex Reviewer");
    var thread = await fixture.CreateThreadAsync(workspace);

    await messages.SendMessageAsync(
        fixture.Context(workspace, human),
        new SendMessageCommand
        {
            ThreadId = thread.Id,
            Content = "@Codex Reviewer please inspect this"
        },
        CancellationToken.None);

    var notifications = await notificationStore.ListAsync(workspace.Id, agent.Id);
    notifications.ShouldContain(n => n.Reason == "mention");
}
```

## Notification Delivery Tests

Humans and agents should share notification creation but differ in endpoint delivery.

```text
notification row
  ├─ human endpoint: websocket/email/push
  └─ agent endpoint: webhook/queue/polling
```

Tests:

- One activity can generate multiple notifications.
- Disabled endpoint does not receive delivery attempt.
- Failed webhook retries.
- Polling endpoint can consume notification exactly once if endpoint policy requires it.
- Read/consumed state is workspace-participant scoped.

## Migration Tests

If migrating existing data:

- Every current tenant becomes one workspace.
- Every current user becomes one identity plus one workspace member plus one participant.
- Current bots become agent identities/participants.
- Current subscriptions become channel members.
- Current `message.topic` strings become thread rows.
- Current message sender IDs map to participant IDs.
- Current message flags map to message markers.
- Current user topics map to thread preferences.
- Current realm domains map to workspace domains.

Example migration invariant:

```text
old message count == new message count
old distinct (tenant_id, channel_id, topic) count == new thread count for channel messages
old subscription count == new channel_member count
```

Test query:

```sql
select tenant_id, channel_id, topic, count(*)
from old.message
where type = 'stream'
group by tenant_id, channel_id, topic;
```

Must map to:

```sql
select workspace_id, channel_id, title, count(*)
from new.thread
group by workspace_id, channel_id, title;
```

## API Compatibility Tests

Zulip adapter tests:

- Send stream message maps to channel/thread message.
- Send private/direct maps to direct chat.
- Narrow by stream/topic maps to channel/thread filters.
- Stream response maps channel visibility to `invite_only`.
- Feature-level responses are adapter-owned.
- No core service returns Zulip-shaped DTOs.

Native API tests:

- Uses Jotster terms only.
- Requires workspace context.
- Returns participant IDs, not user IDs.

Agent API tests:

- Uses machine-friendly notification/message flows.
- Requires scoped credentials.
- Does not expose agent execution concepts.

## Required Gates Before Cutover

Minimum gates:

```text
dotnet test
tenant isolation suite
authorization matrix suite
auth/session suite
notification suite
agent API suite
native API suite
Zulip compatibility suite
migration invariant suite
legacy-term hygiene scan
raw-ID query scan
```

Cutover should not proceed until:

- No known tenant isolation gaps.
- No core Zulip vocabulary leaks.
- No raw workspace-owned ID queries without workspace scope.
- No raw secret persistence.
- No workspace-crossing FK gaps in critical tables.
- Agent notification and posting flows pass.

