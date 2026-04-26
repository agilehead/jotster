# Implementation Status

This document records the current implementation state of the hardening plan. The code has moved from convention-based safety to construction-based safety for the greenfield Jotster rewrite.

## Status Summary

Implemented:

- Product schema and entities use the greenfield workspace/identity/participant/channel/thread/message/notification model.
- Legacy Zulip-style product modules were removed; Zulip remains only an API edge package.
- Normal data access now has a dedicated `JotsterWorkspaceDbContext`.
- Unscoped access is split into explicit `JotsterAdminDbContext` and `JotsterBootstrapDbContext`.
- Workspace-owned reads are registered through scoped EF query filters for every workspace-owned entity.
- Workspace-owned writes are checked before sync and async saves.
- Request auth now resolves host/domain to workspace before authenticating session/API credentials.
- Session and API credential auth derives identity through `participant -> workspace_member -> identity`.
- Authorization now has typed subject/resource/action/effect primitives and a generic deny-before-allow evaluator.
- Notifications now use opaque queue IDs, participant-scoped queue access, endpoint validation, delivery ownership checks, retry state, and signed agent webhooks.
- API packages now expose secured route contracts for native, agent, and Zulip surfaces instead of planned stubs.
- Static proof gates cover schema shape, vocabulary, package topology, scoped data access, request auth, authorization, notifications, and API contracts.

Blocked externally:

- Full TypeScript/build validation is blocked by the known Tsonic package skew where the compiler expects callable `attributes` markers (`A<T>()`) but installed `@tsonic/core@10.0.40` still exposes only the removed `A.on(...)` shape.
- Jotster source intentionally uses the greenfield callable marker API and must not revert to `A.on(...)`.

## Plan Coverage

### Scoped Data Foundation

Done.

- `WorkspaceOwnedEntity` defines the structural workspace marker.
- `WORKSPACE_OWNED_ENTITY_NAMES` lists every workspace-owned entity.
- `JotsterWorkspaceDbContext` takes exactly one workspace ID.
- `configureWorkspaceFilters` registers all workspace-owned entities.
- `ValidateWorkspaceWrites` rejects added, modified, or deleted tracked entities with the wrong workspace.
- Raw `JotsterDbContext` is not exported from the package index.

Required invariant:

```ts
const db = createWorkspaceDbContext(options, context);
const message = await db.Messages.Where((m) => m.Id === messageId).FirstOrDefaultAsync();
```

The query is scoped by the context before handler logic can forget a workspace predicate.

Bad write rejected:

```ts
const message = new Message();
message.WorkspaceId = "w_beta";
db.Messages.Add(message);
await acmeDb.SaveChangesAsync();
```

The scoped save guard rejects the mismatch.

### Request Context And Auth Pipeline

Done at the shared pipeline layer.

- Host selection respects trusted proxy configuration.
- Public routes are explicit.
- Domain resolution happens before authentication.
- Workspace state is checked before scoped DB creation.
- Raw session/API secrets are hashed before lookup.
- Auth lookup runs through the workspace-scoped DB.
- Session and credential records no longer carry redundant identity IDs.

Required invariant:

```text
Host: acme.example
Authorization: ApiKey beta-secret
```

The credential lookup runs inside Acme's workspace context, so Beta credentials cannot authenticate.

### Schema Hardening

Done in the single migration and entity model.

- Workspace-owned ID tables use composite `(workspace_id, id)` primary keys where appropriate.
- Foreign keys to workspace-owned tables include `workspace_id`.
- `auth_session` and `api_credential` bind to participant, not duplicate identity.
- `message` has a container-shape check.
- `permission_grant` constrains subject kind and effect.
- `notification_delivery` binds notification and endpoint through the same participant.

Required invariant:

```text
notification_delivery.workspace_id = w_acme
notification_delivery.participant_id = p_alice
endpoint.participant_id = p_bob
```

The schema and service factory reject the cross-participant delivery.

### Authorization Service

Done at evaluator level.

- Resources are canonical workspace-rooted paths.
- Grant creation validates subject, effect, action, and resource workspace.
- Evaluator ignores grants outside the active workspace.
- Explicit deny wins over any allow.
- System subjects are allowlisted.
- Channel/thread adapter functions use the same generic evaluator.

Required invariant:

```ts
const decision = evaluateAuthorization({
  context,
  resource: createResourcePath(context.WorkspaceId, threadPath),
  action: ACTION_THREAD_WRITE,
  grants,
  roleIds,
  groupIds,
  systemSubjectIds: [],
  nowMs,
});
```

The evaluator cannot authorize resources outside `context.WorkspaceId`.

### Notifications And Agents

Done at queue and delivery foundation level.

- Queue IDs are generated with `generateId("queue")`.
- Queue reads and deletes require the same workspace and participant.
- Blind workspace-wide dispatch is rejected.
- Agent webhook endpoint configs require HTTPS and reject local/private hosts.
- Delivery records are created from notification+endpoint pairs after ownership validation.
- Delivery failure state computes bounded exponential retry.
- Webhook payloads include HMAC SHA-256 signatures.

Required invariant:

```ts
getEventsFromQueue(aliceContext, bobQueueId, nowMs);
```

This returns no events because queues are participant-scoped.

### Config And Ops Hardening

Done for startup and response boundary.

- Production mode rejects dev auth.
- Production mode requires a strong JWT secret.
- Production mode requires upload storage.
- Production listen URL must be HTTPS unless behind a trusted TLS proxy.
- JSON body size uses configured limits.
- Public error responses return stable codes and hide internals in production.

### Proof Gates

Done for static/source gates currently possible.

Passing command:

```bash
NODE_OPTIONS='--import tsx' npx mocha tests/index.ts --timeout 60000
```

Current result:

```text
27 passing
```

Also passing:

```bash
git diff --check
```

Blocked command:

```bash
npx tsc -p packages/core/tsconfig.json --noEmit --pretty false
```

Current blocker:

```text
Type 'AttributesApi' has no call signatures.
```

That blocker is expected until the Tsonic/core package wave exposes callable `attributes` markers.

## Remaining After Tsonic Unblocks

These are validation steps, not architecture changes:

1. Re-run package typecheck/build once `@tsonic/core` exposes `A<T>()`.
2. Run `npm run build`.
3. Run `npm test`.
4. Add runtime tenant-isolation fixtures on top of the now-static proof gates.
5. Wire protected route handlers to the request security context as real endpoints are implemented.

The source architecture now enforces the intended model; the remaining work is compiler/package unblocking and runtime fixture expansion.
