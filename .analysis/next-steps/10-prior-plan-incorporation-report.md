# Prior Plan Incorporation Report

This report maps the earlier `.analysis/jotster-plan` documents into the security/architecture hardening plan in `.analysis/next-steps`.

## Verdict

The previous plan is incorporated. The new plan does not replace the greenfield rewrite direction; it adds the missing enforcement layer around the same architecture.

The most important upgrade is this: the previous plan said workspace isolation must be a schema and service invariant. The new plan makes the mechanism explicit: normal DB contexts returned to product code are tenant/workspace-scoped by construction, while admin/root access uses a separate unscoped context type.

## Coverage Map

| Previous document | Main content | Incorporated in next-steps |
|---|---|---|
| `00-index.md` | One-deployment, domain-routed, human+agent, Persona/Permiso-derived, Zulip edge only | `00-index.md`, `01-threat-model-and-principles.md`, `03-request-auth-boundary.md`, `05-authorization.md`, `06-notifications-and-agents.md` |
| `01-principles-and-vocabulary.md` | Canonical product vocabulary, banned Zulip terms, identity/member/participant split | `01-threat-model-and-principles.md`, `08-tests-and-proof-gates.md`, plus existing vocabulary gates remain required |
| `02-current-state-and-gaps.md` | User does too much, current auth too narrow, channel/thread/message access gaps, bot model cleanup | `03-request-auth-boundary.md`, `04-schema-hardening.md`, `05-authorization.md`, `06-notifications-and-agents.md` |
| `03-target-architecture.md` | Module boundaries, request pipeline, APIs call services, no core dependency on API edges | `00-index.md`, `03-request-auth-boundary.md`, `08-tests-and-proof-gates.md`, `09-execution-plan.md` |
| `04-multitenancy-and-auth.md` | Domain routing, workspace context, sessions, SSO, API credentials | `02-scoped-data-access.md`, `03-request-auth-boundary.md`, `04-schema-hardening.md`, `07-config-and-operational-hardening.md` |
| `05-identity-participants-agents.md` | Global identity, workspace-local participants, agents external/humanlike, notifications | `03-request-auth-boundary.md`, `04-schema-hardening.md`, `06-notifications-and-agents.md` |
| `06-authorization-permissions.md` | Permiso-derived resources/actions/grants, deny-before-allow, channel/thread access | `05-authorization.md`, `08-tests-and-proof-gates.md` |
| `07-target-data-model.md` | Product-owned tables, workspace keys, global roots, auth/collab/notification data model | `04-schema-hardening.md`, `02-scoped-data-access.md`, `08-tests-and-proof-gates.md` |
| `08-apis-and-zulip-edge.md` | Native, agent, and Zulip API separation; Zulip adapter only | `01-threat-model-and-principles.md`, `03-request-auth-boundary.md`, `05-authorization.md`, `08-tests-and-proof-gates.md` |
| `09-rewrite-execution-plan.md` | Build modules, DB foundation, port Persona/Permiso concepts, collaboration, notifications, APIs | `09-execution-plan.md` |
| `10-validation-and-safety.md` | Static hygiene checks, tenant isolation tests, auth tests, agent tests, migration tests | `08-tests-and-proof-gates.md` |

## Incorporated Decisions

### Greenfield Core Remains Intact

Previous decision:

```text
Jotster is not a Zulip clone internally.
```

Current hardening:

```text
Zulip remains edge-only. Security checks happen in core product terms before adapter mapping.
```

Example:

```ts
await authorization.RequireAsync(
  context,
  Resources.Thread(context.WorkspaceId, channelId, threadId),
  Actions.ThreadWrite,
);
```

The Zulip adapter can call this, but it cannot introduce a separate stream/topic permission path.

### Workspace Isolation Is Now Mechanized

Previous decision:

```text
All workspace data is scoped by construction.
```

Current hardening:

```text
Default DB factory returns JotsterWorkspaceDbContext.
Admin/root access uses JotsterAdminDbContext.
Bootstrap/domain resolution uses JotsterBootstrapDbContext.
```

Bad:

```ts
const db = createJotsterDbContext(options);
await db.Messages.Where((m) => m.Id === id).FirstOrDefaultAsync();
```

Good:

```ts
const db = createWorkspaceDbContext(options, context);
await db.Messages.Where((m) => m.Id === id).FirstOrDefaultAsync();
```

The good shape is safe because the returned context already carries `context.WorkspaceId`.

### Identity/Membership/Participant Split Is Preserved

Previous decision:

```text
identity -> workspace_member -> participant
```

Current hardening:

```text
Auth sessions and API credentials should bind to participant/workspace and derive identity through membership, or enforce identity-participant consistency.
```

Bad row:

```text
auth_session.identity_id = id_alice
auth_session.participant_id = p_bob
```

Target:

```text
auth_session.workspace_id
auth_session.participant_id
participant.workspace_member_id
workspace_member.identity_id
```

### Agents Stay External But Humanlike

Previous decision:

```text
No agent runs, memory, plans, tool traces, or execution state in Jotster.
```

Current hardening:

```text
Agent notifications and API credentials use the same participant security model as humans.
Queue/webhook delivery is secured as notification endpoint mechanics.
```

Good:

```text
agent process -> credential -> participant context -> authorized action
```

Bad:

```text
agent process -> special bypass route -> direct DB access
```

### Persona/Permiso Concepts Are Still The Source Direction

Previous decision:

```text
Port concepts, not JS implementation.
```

Current hardening:

```text
Identity gets provider/session/credential verification.
Authorization gets typed subject/resource/action/effect evaluation.
```

Example:

```ts
authorization.CreateGrant(context, {
  subject: Subject.Role(roleId),
  resource: Resources.Channel(context.WorkspaceId, channelId),
  action: Actions.ChannelRead,
  effect: Effect.Allow,
});
```

### Validation Strategy Is Expanded

Previous decision:

```text
Tenant isolation must be proven by tests.
```

Current hardening adds specific gates:

- Raw/admin DbContext import gate.
- Workspace-owned entity filter coverage gate.
- Tenant-isolation runtime fixture.
- Auth replay negative tests.
- Notification queue ownership tests.
- Schema CHECK/FK tests.
- Production config fail-closed tests.

## Remaining Design Decisions Before Implementation

These are not contradictions; they are details to settle while coding:

1. Whether Tsonic EF bindings can express `HasQueryFilter` cleanly.
   - If yes, use EF global query filters.
   - If no, use scoped repository sets returned by `JotsterWorkspaceDbContext`.
   - Do not use manual handler filters as the primary strategy.

2. Whether `auth_session` and `api_credential` keep `identity_id`.
   - Preferred: remove redundant `identity_id` and derive through participant.
   - Acceptable only with strong invariant checks: keep for denormalized lookup but prove consistency.

3. Whether `message.channel_id` is stored or derived from `thread_id`.
   - Preferred: derive to avoid inconsistency.
   - If stored for index/query speed, add composite constraints proving thread belongs to channel.

4. How broad admin context should be.
   - It must be unscoped by design.
   - It must not be injectable as the normal request DB.
   - It must require explicit admin authority and audit metadata.

## Conclusion

The previous plan is fully carried forward. The new plan narrows the next implementation step: make the architecture enforce itself. The first code priority should be the tenant-scoped context factory and separate admin context because that is the root guardrail for everything else.
