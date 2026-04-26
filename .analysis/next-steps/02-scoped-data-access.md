# Scoped Data Access

## Problem

`JotsterDbContext` currently exposes raw `DbSet` properties. A developer can query workspace-owned entities by bare ID and accidentally cross a workspace boundary.

Current unsafe shape:

```ts
const message = await db.Messages
  .Where((m) => m.Id === messageId)
  .FirstOrDefaultAsync();
```

This is unsafe because message IDs are not globally trusted authorization boundaries. Even if IDs are hard to guess, security cannot depend on obscurity.

## Target Design

Introduce separate data contexts. The default runtime factory must return the scoped one.

```text
JotsterWorkspaceDbContext
  - default context returned for normal request, API, service, and worker paths
  - constructed with exactly one immutable workspace_id
  - all workspace-owned reads are automatically filtered
  - all workspace-owned writes are checked before save

JotsterAdminDbContext
  - explicitly unscoped
  - only for root/admin operations that intentionally cross workspaces
  - never injected into product handlers
  - every use must be auditable and reviewed

JotsterBootstrapDbContext
  - unscoped, but narrower than admin
  - only for migrations, design-time EF, and domain/workspace resolution before request context exists
```

Runtime flow:

```text
RequestContext.WorkspaceId
  -> createDbContextForRequest(options, context)
  -> returns JotsterWorkspaceDbContext
  -> handlers/services receive scoped context only
```

Admin flow:

```text
Root/admin authority
  -> explicit createAdminDbContext(options, adminContext)
  -> audit event required for cross-workspace operation
```

There should be no generic `createJotsterDbContext()` available to normal product code. A name that does not say `Workspace`, `Admin`, or `Bootstrap` is too easy to misuse.

## Entity Marker

All workspace-owned entities need a common marker shape.

```ts
export interface WorkspaceOwnedEntity {
  WorkspaceId: string;
}
```

Every workspace-owned entity implements it conceptually:

```ts
export class Message implements WorkspaceOwnedEntity {
  WorkspaceId!: string;
  Id!: string;
  SenderParticipantId!: string;
  // ...
}
```

Global entities intentionally do not implement it:

```text
Workspace
WorkspaceDomain
Identity
HumanProfile
AgentProfile
```

## Query Enforcement

Preferred implementation is EF global query filters if Tsonic exposes the required EF APIs. The important product rule is not the mechanism; it is that the context returned to normal code has tenant scoping built in.

Target C# equivalent:

```csharp
modelBuilder.Entity<Message>()
    .HasQueryFilter(m => m.WorkspaceId == CurrentWorkspaceId);
```

Tsonic target shape:

```ts
class JotsterWorkspaceDbContext extends JotsterDbContext {
  CurrentWorkspaceId!: string;

  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);
    modelBuilder.Entity<Message>().HasQueryFilter(
      (m) => m.WorkspaceId === this.CurrentWorkspaceId,
    );
  }
}
```

If Tsonic cannot express `HasQueryFilter` reliably yet, do not fall back to manual call-site filters. Instead introduce scoped repository sets returned from the tenant-scoped context:

```ts
class WorkspaceSet<T extends WorkspaceOwnedEntity> {
  constructor(private readonly dbSet: DbSetQuery<T>, private readonly workspaceId: string) {}

  Query(): DbSetQuery<T> {
    return this.dbSet.Where((row) => row.WorkspaceId === this.workspaceId);
  }
}
```

Callers then receive only repository APIs:

```ts
await workspaceStore.Messages
  .Query()
  .Where((m) => m.Id === messageId)
  .FirstOrDefaultAsync();
```

The unscoped admin context must not expose the same type/interface as the scoped context. This prevents accidental dependency injection swaps.

Bad:

```ts
function createDbContext(options: DbContextOptions): JotsterDbContext;
```

Good:

```ts
function createWorkspaceDbContext(
  options: DbContextOptions,
  context: RequestContext,
): JotsterWorkspaceDbContext;

function createAdminDbContext(
  options: DbContextOptions,
  adminContext: AdminContext,
): JotsterAdminDbContext;
```

## Write Enforcement

Query filters do not protect writes. Add a save guard.

Required behavior:

```text
for each Added/Modified/Deleted tracked entity:
  if entity is WorkspaceOwnedEntity:
    if entity.WorkspaceId != CurrentWorkspaceId:
      throw SecurityInvariantViolation
```

Bad write that must fail:

```ts
const channel = createChannelRecord({
  workspaceId: "w_beta",
  name: "leak",
  visibility: "public",
  createdAt,
});

scopedDb.Channels.Add(channel); // scopedDb is for w_acme
await scopedDb.SaveChangesAsync(); // must throw
```

Good write:

```ts
const channel = createChannelRecord({
  workspaceId: context.WorkspaceId,
  name,
  visibility,
  createdByParticipantId: context.ParticipantId,
  createdAt,
});
```

## Raw Context Access Rules

Raw `JotsterDbContext` access should be allowed only in:

- `packages/core/src/db/*`
- design-time EF factory
- migration tooling
- domain resolution service before request context exists
- root/admin maintenance tasks with explicit root authority

Static gate:

```text
No package outside core imports or constructs the unscoped context directly.
No normal service accepts a base context type that can be backed by either scoped or admin context.
```

Bad import:

```ts
import type { JotsterDbContext } from "@jotster/core";
```

from `packages/collaboration`, `packages/notifications`, `packages/api-*`, or `packages/server`.

Good import:

```ts
import type { JotsterWorkspaceDbContext } from "@jotster/core";
```

or better, use narrow service interfaces:

```ts
import type { MessageStore } from "@jotster/collaboration";
```

## Global Table Access

Global tables need dedicated services, not a general global context in handlers.

Examples:

```ts
workspaceResolver.ResolveByHost(host);
identityResolver.ResolveExternalIdentity(workspaceId, providerId, subject);
```

These services must return a workspace-bound context or actor-bound context before product data access begins.

Admin global-table reads are a separate capability:

```ts
adminDirectory.ListWorkspaces(adminContext, filter);
adminDirectory.FindIdentityByEmail(adminContext, normalizedEmail);
```

These methods must require `AdminContext`, not `RequestContext`, and must create audit events for sensitive access.

## Required Tests

1. Query by foreign workspace ID returns not-found from a scoped context.
2. Insert with mismatched `WorkspaceId` throws.
3. Update with mismatched `WorkspaceId` throws.
4. Delete with mismatched `WorkspaceId` throws.
5. Raw `JotsterDbContext` imports are rejected outside allowlisted files.
6. Every entity with `WorkspaceId` is registered in the scoped filter list.
7. Every entity registered as workspace-owned has a test fixture proving isolation.
8. Default request/service DB factory cannot return an admin/unscoped context.
9. Admin context cannot be passed where scoped context is required.
10. Admin context creation requires explicit admin authority and audit metadata.
