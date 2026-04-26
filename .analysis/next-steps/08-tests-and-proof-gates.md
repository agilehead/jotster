# Tests And Proof Gates

## Philosophy

This must be proven with negative tests. Positive tests that show happy paths work do not prove tenant isolation.

Every security invariant needs at least one test that tries to break it.

## Existing Passing Gate

Current non-compiler hygiene gate passes:

```bash
NODE_OPTIONS='--import tsx' npx mocha tests/index.ts --timeout 60000
```

This proves:

- Product table names.
- Entity/table alignment.
- Workspace columns and composite keys/FKs.
- Package topology.
- Vocabulary boundaries.
- Callable attribute marker usage.

It does not prove runtime auth, query scoping, or authorization.

## New Static Gates

### Raw/Admin DbContext Import Gate

Reject raw or admin `JotsterDbContext` imports outside allowlisted core/design-time/admin files.

Bad:

```ts
import type { JotsterDbContext } from "@jotster/core";
```

Allowed only in:

```text
packages/core/src/db/**
packages/identity/src/workspace-resolver.ts   // only if explicitly root/domain lookup
packages/admin/**                              // only with AdminContext audit checks
scripts/**
tests/security-fixtures/**
```

Normal service/API code must import the tenant-scoped context or narrower store interfaces only.

Bad:

```ts
function handler(db: JotsterAdminDbContext) {}
function handler(db: JotsterDbContext) {}
```

Good:

```ts
function handler(db: JotsterWorkspaceDbContext) {}
function handler(store: MessageStore) {}
```

### Workspace-Owned Entity Coverage Gate

Every entity with `WorkspaceId` must be in the scoped-filter registry.

Test shape:

```ts
const workspaceOwnedEntities = readEntitiesWithWorkspaceId();
const registeredFilters = readScopedFilterRegistry();
assert.deepEqual(registeredFilters.sort(), workspaceOwnedEntities.sort());
```

### No Manual JSON Construction Gate

Reject string-concatenated JSON.

Bad:

```ts
"{\"state\":\"" + state + "\"}"
```

Require serializer helper:

```ts
jsonSerialize({ state })
```

### No Body Workspace Gate

Reject service/handler usage of request body workspace IDs for workspace-owned operations.

Bad patterns:

```text
req.body.workspaceId
input.workspaceId from API DTO in handler
```

Service constructors/factories may accept `workspaceId` only when input comes from `RequestContext` or trusted job context.

## Tenant Isolation Runtime Tests

Fixture:

```text
workspace A
  human participant A1
  agent participant A2
  private channel A
  thread A
  message A
  notification A

workspace B
  human participant B1
  agent participant B2
  private channel B
  thread B
  message B
  notification B
```

Tests:

- A cannot read B workspace-owned row by bare ID.
- A cannot update B row by bare ID.
- A cannot delete B row by bare ID.
- A cannot create a row with `WorkspaceId = B` through A scoped context.
- A cannot use B session token on A domain.
- A cannot use B API credential on A domain.
- A cannot poll B notification queue.
- A cannot receive B notification delivery.
- Request/service DB factory cannot return an admin/unscoped context.
- Admin context construction requires explicit admin authority.

Example:

```ts
it("cannot read another workspace message by id", async () => {
  const acme = await fixture.workspace("acme");
  const beta = await fixture.workspace("beta");
  const acmeContext = await fixture.context(acme, "alice");
  const betaMessage = await fixture.message(beta, "secret");

  const result = await messages.GetMessageAsync(acmeContext, betaMessage.Id);

  assert.equal(result.Kind, "not_found");
});
```

## Authorization Matrix Tests

Channel read:

| Channel | Actor State | Expected |
|---|---|---|
| public | active workspace participant | allow |
| private | non-member | deny/not-found |
| private | member | allow |
| restricted | explicit allow | allow |
| restricted | no grant | deny/not-found |
| any | explicit deny | deny |

Thread write:

| Thread | Channel Write | Thread Grant | Expected |
|---|---:|---:|---|
| inherit | yes | none | allow |
| inherit | no | yes | policy-defined; must be explicit |
| restricted | yes | no | deny |
| restricted | no | yes | allow |
| locked | yes | no manage | deny |

Agent parity:

- Human and agent use same permission evaluator.
- Agent has no privileged bypass.
- Agent-specific API audience can narrow actions but cannot expand permissions.

## Auth Boundary Tests

- Unknown host rejected.
- Inactive workspace rejected.
- Inactive domain rejected.
- Same global identity gets distinct participant per workspace.
- Session bound to workspace A fails on workspace B.
- Credential bound to workspace A fails on workspace B.
- Revoked session fails.
- Expired credential fails.
- SSO callback with mismatched state/domain fails.

## Schema Tests

Migration parser should verify:

- `message` container CHECK exists.
- `permission_grant` subject/effect checks exist.
- `notification_delivery` participant consistency is enforceable or service-tested.
- `auth_session`/`api_credential` cannot represent identity/participant mismatch by design.
- Global tables are allowlisted and documented.

## Build Gates

Until Tsonic package consistency is fixed, keep non-compiler hygiene tests. After Tsonic package wave lands:

```bash
npm run build
npm test
npm run verify-all
```

Required downstream style for this repo:

```text
1. fast static checks
2. focused security tests
3. full Jotster test suite
4. downstream integration suites after compiler/runtime changes
```

Do not stop on first long-suite failure. Collect all failures, group by root cause, fix generically, rerun focused tests, then rerun full suite.
