# Tsonic & Express Build Issues

Issues found while attempting `npm run build` on the Jotster project.

## Status

- Issues 1-5: **RESOLVED** (code fixes applied per Tsonic team guidance)
- Issue 6: **RESOLVED** (fixed by tsonic@0.0.58 — binding augmentation now generates type aliases from TS source)
- Issue 7: **RESOLVED** (workaround: convert `export const fn = () =>` to `export function fn()` — Tsonic team confirmed bug, patch coming)
- Issue 8: **RESOLVED** — Was caused by old tsbindgen@0.7.39; installing @tsonic/tsbindgen@0.7.40 at workspace root fixes the package resolution
- Issue 9: **RESOLVED** (workaround: convert structural type aliases to CLR-backed classes per Tsonic team guidance)
- Issue 10: **RESOLVED** — tsbindgen type ownership ambiguity (fixed in tsbindgen post-0.7.41, commit `3abae5a`)
- Issue 11: **RESOLVED** — Extension methods missing (not a bug; requires `ExtensionMethods` wrapper — already implemented in JotsterDbContext source, but tsbindgen wasn't emitting it in bindings. Fixed in tsbindgen commit `3401dff`)
- Issue 12: **CURRENT** — Excessive stack depth in TypeScript when resolving extension method intersection types on `DbSet`
- Issue 13: **CURRENT** — `long` not assignable to `Nullable_1<Int64>` for optional entity fields

---

## Issue 9 (BLOCKED on 8): Branded types reject plain object literals for type aliases

**Severity**: Blocker (affects all code that constructs structural types)
**Tsonic version**: 0.0.58
**Error**:
```
Type 'Ok__Alias_1<{ tenantId: string; userId: string; email: string; role: number; }>'
  is not assignable to type 'Result<AuthenticatedUser__Alias$instance, string>'.
  Property '__tsonic_type_Jotster_Core_types_AuthenticatedUser__Alias' is missing in type
    '{ tenantId: string; userId: string; email: string; role: number; }'
  but required in type 'AuthenticatedUser__Alias$instance'.
```

**Context**: `AuthenticatedUser` is defined as a pure TS type alias:
```typescript
// packages/core/src/types/authenticated-user.ts
export type AuthenticatedUser = {
  tenantId: string;
  userId: string;
  email: string;
  role: number;
};
```

Usage in consumer packages:
```typescript
return ok({ tenantId, userId, email, role });  // where return type is Result<AuthenticatedUser, string>
```

Tsonic materializes the type alias as a branded class `AuthenticatedUser__Alias$instance` with a `__tsonic_type_...` brand marker. Passing a plain object literal `{ tenantId, userId, email, role }` to `ok()` fails because the brand is missing.

**Question**: For structural type aliases like this, should we:
1. Use `new AuthenticatedUser(...)` (class instantiation) instead of object literals?
2. Or should the binding not add brand markers to structural type aliases that are meant to be plain data shapes?

This is partially downstream of Issue 8 — we can't fully test this until DbContext type resolution is fixed. But the branding question is independent.

---

## Issue 8 (CURRENT): Generated bindings import DbContext from wrong package

**Severity**: Blocker
**Tsonic version**: 0.0.58
**Binding versions**: @tsonic/efcore@10.0.27, @tsonic/dotnet@10.0.27, @tsonic/core@10.0.27, @tsonic/globals@10.0.27
**Error**: `Property 'SaveChangesAsync' does not exist on type 'JotsterDbContext$instance'.` (and `Dispose`, also causing `Parameter 'k' implicitly has an 'any' type` downstream)

**Still broken after recommended version update**: We updated to all recommended versions (@tsonic/efcore@10.0.27, @tsonic/express@10.0.29, etc.) as suggested by the Tsonic team. The issue persists — `tsonic restore` still pulls `microsoft-entity-framework-core-abstractions-types` as a transitive dependency, and the binding generator still maps DbContext to it.

**Generated binding** (`packages/core/dist/tsonic/bindings/Jotster.Core.db/internal/index.d.ts`):
```typescript
// Lines 12-15 — ALL point to the wrong package:
import * as Microsoft_EntityFrameworkCore_Infrastructure_Internal from "microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore.Infrastructure/internal/index.js";
import type { IInfrastructure_1, IResettableService } from "microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore.Infrastructure/internal/index.js";
import * as Microsoft_EntityFrameworkCore_Internal from "microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore/internal/index.js";
import type { DbContext, DbContextOptions, DbSet_1 } from "microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore/internal/index.js";
```

Also in the facade file (`Jotster.Core.db.d.ts`):
```typescript
import * as Microsoft_EntityFrameworkCore_Internal from "microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore.js";
import type { IInfrastructure, IResettableService } from 'microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore.Infrastructure.js';
import type { DbContext, DbContextOptions, DbSet } from 'microsoft-entity-framework-core-abstractions-types/Microsoft.EntityFrameworkCore.js';
```

**Root cause**: The `microsoft-entity-framework-core-abstractions-types` package does NOT export `DbContext`, `DbContextOptions`, or `DbSet`. It only contains attribute types (`BackingFieldAttribute`, `CommentAttribute`, `DeleteBehavior`, etc.).

The correct types exist in `microsoft-entity-framework-core-types` (which IS installed alongside, and has DbContext with SaveChangesAsync, Dispose, etc.).

**Impact**: All 15 consumer packages that use `JotsterDbContext` for database operations cannot compile. Every repo file using `db.SaveChangesAsync()`, `db.Dispose()`, or LINQ queries like `.Where(k => ...)` fails.

**Verification**:
```bash
# DbContext NOT in abstractions package:
grep -r 'DbContext\$instance' node_modules/microsoft-entity-framework-core-abstractions-types/  # (no results)

# DbContext IS in the main EF Core package:
grep -r 'export interface DbContext\$instance' node_modules/microsoft-entity-framework-core-types/  # Found
grep -r 'export interface DbContext\$instance' node_modules/@tsonic/efcore/  # Found
```

**Expected behavior**: The binding generator should resolve `Microsoft.EntityFrameworkCore.DbContext` (and `DbContextOptions`, `DbSet`) to `microsoft-entity-framework-core-types` (or `@tsonic/efcore`), NOT to `microsoft-entity-framework-core-abstractions-types`. The NuGet assembly `Microsoft.EntityFrameworkCore.Abstractions` does not contain DbContext — it lives in the `Microsoft.EntityFrameworkCore` assembly.

**Resolution**: Fixed by installing `@tsonic/tsbindgen@0.7.40` at the workspace root (see Tsonic team guidance). However, this surfaced Issue 10.

---

## Issue 10 (CURRENT): tsbindgen type ownership ambiguity for cross-package CLR types

**Severity**: Blocker
**tsbindgen version**: 0.7.41 (local, from ~/repos/tsoniclang/tsbindgen)
**tsonic version**: 0.0.59 (local, from ~/repos/tsoniclang/tsonic)
**Binding versions**: @tsonic/efcore@10.0.27, @tsonic/dotnet@10.0.27

**History**:
- tsbindgen@0.7.39 (bundled with tsonic@0.0.58): silently picks the wrong package → Issue 8
- tsbindgen@0.7.40 (published): fails with `System.Transactions` namespace split
- tsbindgen@0.7.41 (local): `System.Transactions` fixed, but 2 type-level ambiguities remain

**Error history** (progressive fixes in tsbindgen):

1. tsbindgen@0.7.40: `Namespace 'System.Transactions' is split across multiple packages: @tsonic/dotnet, microsoft-entity-framework-core-types`
2. tsbindgen@0.7.41 (pre-fix build): Two type-level ambiguities:
   - `Microsoft.EntityFrameworkCore.Internal.MethodInfoExtensions`: microsoft-entity-framework-core-relational-types vs microsoft-entity-framework-core-types
   - `System.Collections.Generic.CollectionExtensions`: @tsonic/dotnet vs microsoft-extensions-dependency-model-types
3. tsbindgen@0.7.41 (post `bb78355 fix: defer ambiguous --lib type ownership`): Namespace-level ambiguity:
   ```
   Cannot choose a unique owning package for namespace 'Microsoft.EntityFrameworkCore.Metadata.Builders'
   in extension bucket emission. Referenced types resolve to multiple packages:
   microsoft-entity-framework-core-relational-types, microsoft-entity-framework-core-types.
   ```

**Root cause**: The generated NuGet binding packages (`microsoft-entity-framework-core-types`, `microsoft-entity-framework-core-relational-types`, `microsoft-extensions-dependency-model-types`) have overlapping namespaces and types with each other and with curated `@tsonic/*` packages. tsbindgen needs a strategy to resolve these overlaps.

**Suggested approach**: When a namespace/type appears in both a curated `@tsonic/*` package and a generated `microsoft-*-types` package, the curated package should always win. For conflicts between two generated packages (e.g. `microsoft-entity-framework-core-relational-types` vs `microsoft-entity-framework-core-types`), tsbindgen should prefer the more specific package for types that belong to its assembly, or allow explicit overrides in workspace config.

**Resolution**: Fixed in tsbindgen commit `3abae5a fix: allow split-namespace extension buckets in --lib mode`. Core now builds successfully with correct package resolution.

---

## Issue 11 (CURRENT): Generated bindings use internal `DbSet_1<T>` instead of facade `DbSet<T>`

**Severity**: Blocker
**tsbindgen version**: post-0.7.41 (commit `3abae5a`)
**tsonic version**: 0.0.59

**Error**:
```
Property 'Where' does not exist on type 'DbSet_1<ApiKey$instance>'.
Parameter 'k' implicitly has an 'any' type.
Property 'ToArrayAsync' does not exist on type 'DbSet_1<Tenant$instance>'.
```

**Context**: Core now builds successfully and tsbindgen correctly resolves packages. However, the generated binding for `JotsterDbContext` uses internal types instead of facade types.

In `packages/core/dist/tsonic/bindings/Jotster.Core.db/internal/index.d.ts`:
```typescript
// Line 17 — imports from internal path:
import type { DbContext, DbContextOptions, DbSet_1 } from "microsoft-entity-framework-core-types/Microsoft.EntityFrameworkCore/internal/index.js";

// Lines 30-67 — DbSet properties use internal DbSet_1:
readonly AlertWords: DbSet_1<AlertWord>;
readonly ApiKeys: DbSet_1<ApiKey>;
// ... all 37 DbSet properties use DbSet_1<T>
```

The internal type `DbSet_1$instance` has the core interface (`IQueryable_1`, etc.) but its `__DbSet_1$views` only includes `As_IInfrastructure_1()`. LINQ extension methods (`Where`, `FirstOrDefaultAsync`, `ToArrayAsync`) live in extension method buckets:
- `@tsonic/efcore/__internal/extensions/index.d.ts` — `FirstOrDefaultAsync`, `ToArrayAsync`, etc.
- `@tsonic/dotnet` (System.Linq) — `Where`

These extension methods are merged into types at the facade level, but since the binding uses `/internal/` paths directly, they're bypassed.

**Expected behavior**: The generated binding for `JotsterDbContext` should reference `DbSet<T>` from the facade path (non-`/internal/`), so that extension methods are available on DbSet properties.

---

## Issue 7 (RESOLVED): Binding augmentation fails to classify re-exported arrow-function consts

**Severity**: Blocker
**Tsonic version**: 0.0.58
**Error**:
```
Error: Failed to classify re-export 'loadConfig' from './config/load-config.ts'.
Could not find an exported declaration named 'loadConfig' in config/load-config.ts.
```

**Context**: After upgrading to tsonic@0.0.58 (which adds binding augmentation for source type aliases), building `@jotster/core` fails during the augmentation phase.

The re-export chain:
1. `packages/core/src/index.ts` line 9: `export { loadConfig } from "./config/load-config.ts";`
2. `packages/core/src/config/load-config.ts` line 4: `export const loadConfig = (): ServerConfig => { ... };`
3. `packages/core/src/config/server-config.ts`: `export type ServerConfig = { ... };` (pure TS structural type)

`loadConfig` is an **exported const arrow function** returning `ServerConfig` (a pure TS type alias — not a class). The binding augmentation's "classify re-export" step can't find `loadConfig` as an "exported declaration" in the source file.

**Possible causes**:
- The classifier may only recognize `export function foo()` and `export class Foo` declarations, not `export const foo = (): T => { ... }` (const arrow functions)
- Or the classifier may not find it because `ServerConfig` is a pure TS type (no CLR representation), so the function itself may not appear in compiled output — but the augmentation should still emit a TS type alias for it

**Reproduction**: `npm -w @jotster/core run build` (which runs `tsonic restore --project core && tsonic build --project core`)

**Expected behavior**: The binding augmentation should handle `export const foo = (): SomeType => { ... }` the same way as `export function foo(): SomeType { ... }`, emitting appropriate type aliases in the `.d.ts` output.

---

## Issue 6 (RESOLVED): Cross-package type bindings not generated for library types

Fixed by tsonic@0.0.58 — the binding augmentation now generates type aliases from TS source alongside CLR bindings.

---

## Issues 1-5 (RESOLVED)

### Issue 1: Generic arrow functions → converted to named functions
### Issue 2: `never` as generic param → modeled as explicit `Ok<T>` / `Err<E>` types
### Issue 3: `any` types → replaced with proper `@tsonic/express` and `@tsonic/nodejs` types
### Issue 4: Missing `@tsonic/nodejs` → added to dependencies + `Tsonic.Nodejs` NuGet reference
### Issue 5: JS collections (Map, .push(), .sort()) → replaced with CLR `Dictionary<K,V>` and `List<T>`

Additionally fixed:
- `crypto.randomBytes(n).toString("hex")` → `Buffer.from(crypto.randomBytes(n)).toString("hex")` (randomBytes returns `byte[]` in Tsonic, not a Buffer)
