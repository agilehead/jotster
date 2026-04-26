# Execution Plan

## Approach

This should be implemented as one security hardening pass, with focused commits/PR sections if needed. The code should move from convention-based safety to construction-based safety.

Do not patch individual handlers with one-off `WorkspaceId` filters as the primary fix. Manual filters are acceptable only inside the implementation of the scoped boundary or clearly exceptional root services.

## Phase 1: Scoped Data Foundation

Tasks:

1. Add workspace-owned marker/interface.
2. Create default tenant-scoped DB/context factory.
3. Add query filters or scoped repository wrappers for every workspace-owned entity.
4. Add write guard for added/modified/deleted workspace-owned entities.
5. Create a separate explicit admin DB context for unscoped cross-workspace operations.
6. Restrict/export raw and admin context access.
7. Add static tests for entity coverage and forbidden imports.

Success examples:

```ts
await scopedDb.Messages.Where((m) => m.Id === betaMessageId).FirstOrDefaultAsync();
```

from Acme context returns not-found.

```ts
message.WorkspaceId = "w_beta";
await acmeScopedDb.SaveChangesAsync();
```

throws a security invariant error.

Admin example that is intentionally different:

```ts
const adminDb = createAdminDbContext(options, adminContext);
await adminAudit.RecordAsync(adminContext, "workspace.list", reason);
```

This path must not share the request-scoped context interface.

## Phase 2: Request Context And Auth Pipeline

Tasks:

1. Add canonical host parser.
2. Add workspace/domain resolver service.
3. Expand `RequestContext` with domain, workspace member, authenticator, scopes, and audience.
4. Implement session authentication.
5. Implement API credential authentication.
6. Add server middleware composition.
7. Make public routes explicit.
8. Replace raw error output with safe error responses.

Success examples:

```text
Host chat.acme.com + beta credential -> unauthenticated
Host beta.example.org + acme session -> unauthenticated
```

## Phase 3: Schema Hardening

Tasks:

1. Update the single migration with session/credential identity-participant cleanup.
2. Add message container constraints.
3. Add notification delivery participant consistency design.
4. Add permission grant subject/effect constraints.
5. Add indexes needed by scoped auth/authorization queries.
6. Update entity attributes to match migration.
7. Update migration parser tests.

Success examples:

Invalid SQL insert with mismatched message container fails.

Invalid grant effect fails:

```text
effect = maybe
```

## Phase 4: Authorization Service

Tasks:

1. Add typed subjects, resources, actions, and effects.
2. Replace raw string grant creation with validated service method.
3. Implement evaluator with deny-before-allow.
4. Add default policies for workspace/channel/thread/message operations.
5. Ensure native, agent, and Zulip APIs call the same evaluator.
6. Add authorization matrix tests.

Success examples:

Private channel non-member receives not-found/deny.

Explicit deny beats role allow.

Agent and human permissions behave identically for same grants.

## Phase 5: Notifications And Agents

Tasks:

1. Replace predictable queue IDs with opaque high-entropy handles.
2. Require context on queue read/delete.
3. Convert raw dispatch into per-participant notification creation after authorization filtering.
4. Validate endpoint configs by endpoint kind.
5. Add delivery participant consistency check.
6. Add webhook signing and SSRF-safe target validation.
7. Add agent notification tests.

Success examples:

Alice cannot drain Bob's queue in the same workspace.

Agent mention creates an agent notification but does not grant data access outside permissions.

## Phase 6: Config And Ops Hardening

Tasks:

1. Add config validation.
2. Fail production startup on unsafe defaults.
3. Add request/body limits.
4. Add stable public error codes.
5. Add audit events for security-sensitive actions.
6. Add redaction for secrets in logs.

Success examples:

```text
JOTSTER_PRODUCTION=true + JOTSTER_DEV_AUTH_ENABLED=true -> startup failure
JOTSTER_PRODUCTION=true + empty JWT secret -> startup failure
```

## Phase 7: Proof Gates

Tasks:

1. Add static gates to `tests/index.ts` or split security tests if the suite grows.
2. Add runtime tenant-isolation fixtures.
3. Add auth boundary tests.
4. Add authorization matrix tests.
5. Add notification/agent security tests.
6. Re-enable full build/test once Tsonic package wave is fixed.

Required commands:

```bash
NODE_OPTIONS='--import tsx' npx mocha tests/index.ts --timeout 60000
npm run build
npm test
npm run verify-all
```

## Stop Conditions

Stop and report if:

- Tsonic lacks a required EF API and repository fallback would require a larger abstraction decision.
- Any package has ahead/unmerged work that would be overwritten.
- A security invariant conflicts with a product requirement.
- A migration constraint is impossible in SQLite without changing the schema shape.

## Non-Goals

- Do not add Zulip-specific security exceptions.
- Do not preserve old compatibility schema names.
- Do not rely on ID entropy as the isolation mechanism.
- Do not use request body workspace IDs as authoritative.
- Do not implement agent execution inside Jotster.
