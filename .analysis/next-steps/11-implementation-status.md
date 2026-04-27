# Implementation Status

This document records the current implementation state of the Jotster greenfield rewrite and security hardening plan.

## Status Summary

Implemented:

- Product storage uses the greenfield workspace/identity/participant/channel/thread/message/notification model.
- Zulip is isolated to the compatibility API edge package and does not drive product storage or core API shape.
- Normal data access is construction-safe through `JotsterWorkspaceDbContext`.
- Unscoped access is split into explicit `JotsterAdminDbContext` and `JotsterBootstrapDbContext`.
- EF key/index/table/column metadata is centralized in `configureJotsterBaseModel`, not scattered across entity marker calls.
- Workspace-scoped reads are registered through EF query filters for every workspace-owned entity.
- Workspace-scoped writes are checked before every sync and async save path.
- Request auth resolves host/domain to workspace before session/API credential authentication.
- Request auth includes a bounded failure rate limiter and centralized operational metadata redaction.
- Session and API credential auth derives identity through `participant -> workspace_member -> identity`.
- SSO providers and external identities are modeled generically in the identity module.
- Workspace-scoped SSO authentication resolves provider, external identity, member, and participant through the scoped DB.
- Authorization has typed subject/resource/action/effect primitives and deny-before-allow evaluation.
- Permission grant creation can require a workspace-loaded subject registry so stale or foreign subjects fail before persistence.
- Notifications use opaque queue IDs, participant-scoped queue access, endpoint validation, delivery ownership checks, retry state, and signed agent webhooks.
- Agent webhook URL validation rejects userinfo, local/reserved DNS suffixes, ambiguous numeric hosts, IPv6 literals, private IPv4, link-local IPv4, multicast, and reserved IPv4.
- Admin audit helpers require an explicit reason and include admin identity/auth metadata.
- API packages expose source-owned route contracts for native, agent, and Zulip surfaces.
- The API report script inventories current API source contracts and no longer depends on deleted Zulip OpenAPI artifacts.
- Static and runtime proof gates cover schema shape, vocabulary, package topology, scoped data access, request auth, authorization, notifications, API contracts, and database rejection of invalid rows.

## Validation

Passing:

```bash
TSONIC_BIN="node /home/jeswin/repos/tsoniclang/tsonic/packages/cli/dist/index.js" npm run typecheck
```

```bash
for pkg in core identity authorization collaboration notifications api-native api-agent api-zulip server; do
  npx tsc -p packages/$pkg/tsconfig.json --noEmit --pretty false
done
```

```bash
node /home/jeswin/repos/tsoniclang/tsonic/packages/cli/dist/index.js generate --project core
```

```bash
NODE_OPTIONS='--import tsx' npx mocha tests/index.ts --timeout 60000
```

Current result:

```text
36 passing
```

```bash
npm run report:api-compat --silent
git diff --check
```

Blocked externally:

```bash
TSONIC_BIN="node /home/jeswin/repos/tsoniclang/tsonic/packages/cli/dist/index.js" npm run -w @jotster/core build
```

Current blockers:

- The local Tsonic compiler emits calls to `Tsonic.JSRuntime`, but `/home/jeswin/repos/tsoniclang/tsonic/packages/cli/runtime` currently contains only `Tsonic.Runtime.dll` and does not provide `Tsonic.JSRuntime.dll`.
- The local Tsonic compiler does not emit CLR `override` for `DbContext` virtual methods even when the TypeScript source declares `override`.

The second issue is independently reproducible with a minimal source file:

```ts
import { DbContext, ModelBuilder } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export class AppDbContext extends DbContext {
  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);
  }
}
```

Current emitted C# shape:

```cs
public void OnModelCreating(ModelBuilder modelBuilder)
```

Required emitted C# shape:

```cs
protected override void OnModelCreating(ModelBuilder modelBuilder)
```

This is not a Jotster product-model issue. Jotster source is already using the intended greenfield Tsonic surface and validates through TypeScript plus Tsonic generation.

## Plan Coverage

### Scoped Data Foundation

Done.

- `WorkspaceOwnedEntity` defines the structural workspace marker.
- `isWorkspaceOwnedEntity` and `requireWorkspaceOwnedEntity` enforce the marker before writes.
- `JotsterWorkspaceDbContext` takes exactly one workspace ID.
- `configureWorkspaceFilters` registers every workspace-owned entity.
- `ValidateWorkspaceWrites` rejects added, modified, or deleted tracked entities with the wrong workspace.
- Raw `JotsterDbContext` is not exported from the package index.

Required invariant:

```ts
const db = createWorkspaceDbContext(options, context);
const message = await db.Messages.Where((m) => m.Id === messageId).FirstOrDefaultAsync();
```

The query is scoped by the context before handler logic can forget a workspace predicate.

Rejected write:

```ts
const message = new Message();
message.WorkspaceId = "w_beta";
await acmeDb.Messages.AddAsync(message);
await acmeDb.SaveChangesAsync();
```

The scoped save guard rejects the mismatch before persistence.

### Schema Hardening

Done.

- Workspace-owned ID tables use composite `(workspace_id, id)` primary keys where appropriate.
- Foreign keys to workspace-owned tables include `workspace_id`.
- `auth_session` and `api_credential` bind to participant, not duplicate identity.
- `message` has a database-level container-shape check.
- `permission_grant` constrains subject kind and effect.
- `notification_delivery` binds notification and endpoint through the same participant.
- Runtime migration tests prove cross-workspace message references, invalid message containers, cross-participant notification deliveries, and invalid permission effects are rejected.

### Request Context And Auth Pipeline

Done.

- Host selection respects trusted proxy configuration.
- Public routes are explicit.
- Domain resolution happens before authentication.
- Workspace state is checked before scoped DB creation.
- Raw session/API secrets are hashed before lookup.
- Authentication failures are rate-limited by domain, audience, and remote address.
- Successful authentication clears accumulated failure state.
- Operational metadata can be redacted before logs or diagnostics cross process boundaries.
- Auth lookup runs through the workspace-scoped DB.
- Session, credential, and SSO auth all return an explicit request context.

Required invariant:

```text
Host: acme.example
Authorization: ApiKey beta-secret
```

The credential lookup runs inside Acme's workspace context, so Beta credentials cannot authenticate.

### Authorization Service

Done.

- Resources are canonical workspace-rooted paths.
- Grant creation validates subject, effect, action, and resource workspace.
- The validated grant factory requires a caller-supplied subject registry loaded from the current workspace.
- The evaluator ignores grants outside the active workspace.
- Explicit deny wins over any allow.
- System subjects are allowlisted.
- Channel/thread adapter functions use the same generic evaluator.

Unknown grant subjects fail before persistence:

```ts
createValidatedPermissionGrantRecord(
  context,
  participantSubject("p_deleted"),
  createResourcePath(context.WorkspaceId, workspaceResource(context.WorkspaceId)),
  ACTION_WORKSPACE_READ,
  EFFECT_ALLOW,
  { participantIds: ["p_alice"], roleIds: [], groupIds: [], systemSubjectIds: [] },
  nowMs,
);
```

The helper rejects `p_deleted` because it was not loaded from the workspace subject registry.

### Notifications And Agents

Done.

- Queue IDs are generated with `generateId("queue")`.
- Queue reads and deletes require the same workspace and participant.
- Blind workspace-wide dispatch is rejected.
- Agent webhook endpoint configs require HTTPS and reject local/private destinations.
- Delivery records are created from notification+endpoint pairs after ownership validation.
- Delivery failure state computes bounded exponential retry.
- Webhook payloads include HMAC SHA-256 signatures.

Required invariant:

```ts
getEventsFromQueue(aliceContext, bobQueueId, nowMs);
```

This returns no events because queues are participant-scoped.

### Config And Ops Hardening

Done.

- Production mode rejects dev auth.
- Production mode requires a strong JWT secret.
- Production mode requires upload storage.
- Production listen URL must be HTTPS unless behind a trusted TLS proxy.
- JSON body size uses configured limits.
- Public error responses return stable codes and hide internals in production.
- Auth failures have a bounded in-process limiter.
- Operational metadata redaction is centralized.
- Admin audit events require an explicit reason and include admin identity/auth context.

## Remaining After Tsonic Unblocks

These are validation steps, not product architecture changes:

1. Publish or install a Tsonic package/runtime wave that provides `Tsonic.JSRuntime` for the local compiler output.
2. Fix Tsonic CLR override emission for `DbContext` virtual members.
3. Re-run `npm run build`.
4. Re-run `npm test`.
5. Re-run `npm run verify-all`.
6. Add end-to-end API/auth tests when concrete route handlers are implemented.

The Jotster source architecture is now in the intended greenfield shape. The remaining blocker is compiler/runtime emission consistency.
