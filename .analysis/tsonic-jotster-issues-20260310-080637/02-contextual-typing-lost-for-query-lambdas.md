# Issue 2: Contextual typing is lost for EF/LINQ query lambdas across source-package bindings

## Status

- confidence: high
- category: Tsonic type/context propagation defect
- impact: blocks ordinary query code in downstream packages by turning callback params into implicit `any`

## Summary

Consumer packages receive queryable-looking properties such as:

- `db.ApiKeys`
- `db.Users`
- `db.Tenants`

through source-package bindings.

Those properties already carry EF/LINQ extension-method wrapper types in the generated binding surface.
But when downstream code calls query methods like `Where(...)`, the callback parameter loses contextual typing and becomes implicit `any`.

## Generated consumer-visible query surface

File:

- `/home/jester/repos/agilehead/jotster/packages/core/dist/tsonic/bindings/Jotster.Core.db/internal/index.d.ts`

Relevant examples:

```ts
readonly ApiKeys: __TsonicExt_Ef<__TsonicExt_Linq<DbSet<ApiKey>>>;
readonly Users: __TsonicExt_Ef<__TsonicExt_Linq<DbSet<User>>>;
readonly Tenants: __TsonicExt_Ef<__TsonicExt_Linq<DbSet<Tenant>>>;
```

So the downstream package is not seeing an untyped object.
It is seeing a typed query surface that should be sufficient to contextually type the callback.

## Concrete failing examples

### Example A: `ApiKeys.Where(...)`

File:

- `/home/jester/repos/agilehead/jotster/packages/auth/src/repo/get-api-key-by-hash.ts`

Code:

```ts
const result = await db0.ApiKeys
  .Where((k) => k.KeyHash === hash0)
  .Where((k) => k.RevokedAt === undefined)
  .FirstOrDefaultAsync();
```

Compiler result:

- `Parameter 'k' implicitly has an 'any' type.`

### Example B: `Tenants.Where(...)`

File:

- `/home/jester/repos/agilehead/jotster/packages/auth/src/repo/get-tenant-by-id.ts`

Code:

```ts
const result = await db0.Tenants.Where((t) => t.Id === tenantId0).FirstOrDefaultAsync();
```

Compiler result:

- `Parameter 't' implicitly has an 'any' type.`

### Example C: `Users.Where(...)`

File:

- `/home/jester/repos/agilehead/jotster/packages/auth/src/repo/get-user-by-id.ts`

Code:

```ts
const result = await db0.Users.Where((u) => u.Id === userId0).FirstOrDefaultAsync();
```

Compiler result:

- `Parameter 'u' implicitly has an 'any' type.`

### Example D: array-returning query then loop

File:

- `/home/jester/repos/agilehead/jotster/packages/auth/src/repo/revoke-all-api-keys.ts`

Code:

```ts
const keys = await db0.ApiKeys
  .Where((k) => k.TenantId === tenantId0)
  .Where((k) => k.UserId === userId0)
  .Where((k) => k.RevokedAt === undefined)
  .ToArrayAsync();
```

Compiler result:

- `Parameter 'k' implicitly has an 'any' type.`

## Why this is a Tsonic issue

This is not just “Jotster needs more annotations”.

The generated binding surface already claims these properties are:

- EF/LINQ-extended queryable sets

That should be enough for contextual typing of callbacks like:

```ts
(u) => u.Id === userId0
```

If it is not enough, then one of the compiler/bindings layers is losing information:

- extension-method typing through source-package bindings
- generic receiver element typing
- callback contextual typing after source-package import resolution

Any of those are compiler-side issues, not Jotster-specific design mistakes.

## Why this matters

This is ordinary, central application code.

Without this working, any first-party Tsonic library exposing queryable or extension-method-heavy APIs becomes painful or impossible to consume from other first-party packages.

That directly cuts against the point of source-package bindings.

## Minimal repro

### Library

```ts
export class MyContext extends DbContext {
  get Users(): Ef<Linq<DbSet<User>>> {
    return asinterface(this.Set<User>());
  }
}
```

### Consumer

```ts
const users = await db.Users
  .Where((u) => u.Email === email)
  .ToArrayAsync();
```

### Expected

- `u` is contextually typed as `User`

### Current behavior in Jotster

- `u` becomes implicit `any`

## Expected fix direction

Tsonic should preserve enough generic and extension-method typing information across source-package boundaries for standard callback contextual typing to continue working in consumers.

This likely sits in one of:

- source binding generation
- extension method type reconstruction
- contextual typing after source-package resolution
