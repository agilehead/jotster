# Coding Standards (Jotster)

These rules are intentionally strict. The codebase is meant to stay "small-file, single-purpose" as it grows.

## Core Principles

### 1. Functional Programming First

**NO CLASSES** — use functions and modules exclusively.

```typescript
// Good — pure function with explicit dependencies
export async function createChannel(
  repo: IChannelRepository,
  tenantId: string,
  name: string,
  creatorId: string,
): Promise<Result<Channel>> {
  // Implementation
}

// Bad — service class for stateless operations
export class ChannelService {
  constructor(private repo: IChannelRepository) {}
  async createChannel(...): Promise<Channel> { /* ... */ }
}
```

### 2. Explicit Error Handling with Result Types

Use `Result<T>` for all operations that can fail. Never throw exceptions for expected errors.

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### 3. One Export Per File

- **One exported function per implementation file.** The exported function is the "unit of reuse" (domain operation, handler, parser, etc).
- **Internal helpers** (`function foo() {}`) are allowed inside the file.
- **Types related to that exported function** may be exported from the same file (e.g. `export type CreateChannelInput = ...`).
- Avoid exporting "bags of unrelated helpers".

## File Layout

- **Kebab-case file names** for all implementation files (e.g. `create-channel.ts`, `handle-send-message.ts`).
- Prefer directory names that read like a sentence when combined with the file name (e.g. `server/handlers/handle-send-message.ts`).
- Use small "wiring" modules that compose exported functions (e.g. `create-app-handlers.ts`).

## Naming Conventions

| What             | Convention        | Example                          |
| ---------------- | ----------------- | -------------------------------- |
| Functions        | camelCase         | `createChannel`, `handleIngest`  |
| Types/Interfaces | PascalCase        | `Channel`, `CreateChannelInput`  |
| Constants        | UPPER_SNAKE_CASE  | `MAX_MESSAGE_LENGTH`             |
| Files            | kebab-case        | `create-channel.ts`              |
| Database tables  | singular lowercase | `channel`, `message`, `user`     |
| Database columns | snake_case        | `tenant_id`, `created_at`        |
| Foreign keys     | `{table}_id`      | `sender_id`, `channel_id`        |

## TypeScript Guidelines

- Strict mode always (`noLib: true` with Tsonic).
- Prefer `type` over `interface`.
- **Strict equality only** (`===`/`!==`, never `==`/`!=`).
- Never use `any`; use `unknown` if the type is truly unknown.
- All imports MUST include the `.js` extension.
- Use named exports exclusively (no default exports).
- Always use async/await instead of promise chains.

## Architecture Layers

### HTTP Handlers (`packages/server/`)

- One handler per endpoint, one file per handler.
- Translates between Zulip API format and internal domain types.
- Thin — no business logic. Parse request, call domain function, serialize response.

### Domain/Service Layer (each package)

- Pure business logic functions.
- No I/O, no database access — push I/O to the edges.
- Takes explicit parameters (repos, config, user context).
- Returns `Result<T>` types for errors.
- Deterministic and side-effect free where possible.

### Repository Layer (each package)

- Interface defined per module (e.g. `IChannelRepository`).
- SQLite implementation provided via EF Core.
- Can swap for PostgreSQL later — the interface is the contract.
- All database queries go through the repository; no raw SQL in domain or handler code.

## Database Conventions

- Table names: **singular, lowercase** (`user`, `channel`, `message`).
- Column names: **snake_case** (`tenant_id`, `created_at`, `sender_id`).
- Foreign keys: **`{table}_id`** pattern (`sender_id` → `user.id`).
- Primary keys: `id` column, system-generated string IDs (nanoid).
- Timestamps: `created_at`, `updated_at` as integer (Unix milliseconds).
- Booleans: integer `0`/`1` (SQLite).
- JSON data: stored as `TEXT` column.
- Multi-tenancy: all entity tables have `tenant_id` FK referencing `tenant.id`.

## Multi-Tenancy

- Most tables carry a `tenant_id` column with a foreign key to `tenant.id`.
- All queries must be scoped to the tenant. Never leak data across tenants.
- Subdomain routing in multi-tenant mode; fixed tenant ID in single-tenant mode.

## Code Review Checklist

- [ ] All functions use Result types for error handling
- [ ] No classes used
- [ ] One exported function per file
- [ ] All imports include `.js` extension
- [ ] Repository pattern used for all data access
- [ ] Domain functions are pure (no I/O)
- [ ] Handlers are thin (no business logic)
- [ ] No `any` types
- [ ] Strict equality only (`===`/`!==`)
- [ ] All queries scoped to `tenant_id`
- [ ] Kebab-case file names, camelCase function names
- [ ] Database tables singular lowercase, columns snake_case
