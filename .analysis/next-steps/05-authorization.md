# Authorization Plan

## Goal

Authorization must be a generic resource/action evaluator. It must not be scattered as ad hoc channel, thread, bot, or API-specific checks.

## Model

```text
subject  = participant | role | group | system
resource = canonical path under /workspaces/{workspace_id}
action   = operation name
effect   = allow | deny
```

Examples:

```text
participant:p_123 on /workspaces/w_acme/channels/c_general action channel.read
role:r_admin      on /workspaces/w_acme action workspace.manage
group:g_agents    on /workspaces/w_acme/channels/c_ops action message.create
```

## Canonical Resource Builder

No caller should hand-build resource strings.

Bad:

```ts
const resource = "/workspaces/" + workspaceId + "/channels/" + channelId;
```

Good:

```ts
const resource = Resources.Channel(context.WorkspaceId, channelId);
```

Target builders:

```ts
Resources.Workspace(workspaceId)
Resources.Participant(workspaceId, participantId)
Resources.Channel(workspaceId, channelId)
Resources.Thread(workspaceId, channelId, threadId)
Resources.DirectChat(workspaceId, directChatId)
Resources.Message(workspaceId, messageId)
Resources.Webhook(workspaceId, webhookId)
Resources.Credential(workspaceId, credentialId)
```

The resource type should not be a raw string at service boundaries.

```ts
class ResourcePath {
  WorkspaceId!: string;
  Kind!: string;
  Value!: string;
  ToString(): string;
}
```

## Grant Creation Safety

Grant creation must validate workspace ownership.

Bad:

```ts
createPermissionGrantRecord(
  "w_acme",
  "participant",
  "p_1",
  "/workspaces/w_beta/channels/c_1",
  "channel.read",
  "allow",
  now,
);
```

Good:

```ts
authorization.CreateGrant(context, {
  subject: Subject.Participant(context.ParticipantId),
  resource: Resources.Channel(context.WorkspaceId, channelId),
  action: Actions.ChannelRead,
  effect: Effect.Allow,
});
```

Creation must verify:

- `context.WorkspaceId === resource.WorkspaceId`.
- Subject exists in the same workspace unless it is an allowlisted system subject.
- Action is valid for the resource kind.
- Effect is only `allow` or `deny`.
- Expiry is in the future when present.

## Evaluation Algorithm

Input:

```text
RequestContext
ResourcePath
Action
```

Algorithm:

```text
1. Confirm resource workspace == context workspace.
2. Resolve participant subject.
3. Resolve role subjects for participant.
4. Resolve group subjects for participant.
5. Find matching grants for exact resource and inherited parent resources.
6. Apply explicit deny before allow.
7. Apply product default policy if no grant matched.
8. Return allow/deny with reason for audit.
```

Example:

```ts
await authorization.RequireAsync(
  context,
  Resources.Thread(context.WorkspaceId, channelId, threadId),
  Actions.ThreadWrite,
);
```

## Resource Inheritance

Resource hierarchy:

```text
/workspaces/w
/workspaces/w/channels/c
/workspaces/w/channels/c/threads/t
/workspaces/w/messages/m
```

A grant can apply to a parent resource only when the action permits inheritance.

Example:

```text
workspace.manage on /workspaces/w
```

can imply channel management if product policy says so.

But:

```text
channel.read on /workspaces/w/channels/c
```

should not automatically grant message edit unless explicitly mapped.

## Channel And Thread Policy

Visibility defaults:

```text
public channel     -> workspace members can discover/read unless denied
private channel    -> channel members only unless explicit grant
restricted channel -> explicit grant or role/group policy required
```

Thread access:

```text
inherit     -> channel access applies
restricted  -> thread-specific grants required
locked      -> read may continue, writes require manage/unlock
archived    -> writes require manage/archive policy
```

## API-Specific Authorization

Native, agent, and Zulip APIs call the same authorization service.

Bad:

```ts
if (apiSurface === "zulip") {
  // allow stream read for compatibility
}
```

Good:

```ts
await authorization.RequireAsync(context, resource, action);
return zulipAdapter.MapResponse(result);
```

The adapter maps errors and wire fields; it does not alter permission rules.

## Required Tests

- Deny beats allow for the same action/resource.
- Grant for workspace A cannot be created for workspace B resource.
- Participant cannot use another participant's group/role subjects.
- Public channel read works through default policy.
- Private channel read requires membership or grant.
- Restricted thread write requires thread permission even if channel is writable.
- Agent credentials use the same authorization path as humans.
- Zulip API authorization result matches native API result for same operation.

