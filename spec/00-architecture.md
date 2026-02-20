# Jotster Architecture Overview

Jotster is a Zulip 11.x compatible team chat server (API feature level ~320). It is a drop-in replacement for Zulip -- existing Zulip clients (web, mobile, terminal) connect to it unchanged. Built with Tsonic (TypeScript compiled to C# via NativeAOT), `@tsonic/express` for HTTP, EF Core + SQLite for data access. Ships as a single native binary.

## 1. Project Overview

- **Zulip 11.x API compatible** -- feature level ~320, full REST + event system
- **Tsonic** -- TypeScript source compiled to C# and then to native code via .NET NativeAOT
- **`@tsonic/express`** -- HTTP layer, middleware, routing (Express-style API compiled to native via Tsonic)
- **EF Core + SQLite** -- data access, migrations, single-file database
- **Single native binary** -- no runtime dependencies, one file to deploy
- **Multi-tenant** by default, with a single-tenant mode option

## 2. Package Structure

Following the tsumo pattern, each module is a separate package compiled to a DLL. The `server` package references all others and links into one executable binary.

```
jotster/
├── packages/
│   ├── server/          # HTTP layer, entry point (executable)
│   ├── core/            # Shared types, config, multi-tenancy
│   ├── auth/            # Authentication, API keys
│   ├── event-queue/     # Real-time event system
│   ├── messages/        # Messages, flags, search
│   ├── channels/        # Channels, topics, channel folders
│   ├── subscriptions/   # Channel subscriptions
│   ├── users/           # Users, user groups, user status, custom profile fields
│   ├── presence/        # Presence, typing indicators
│   ├── emoji/           # Emoji reactions, custom emoji
│   ├── uploads/         # File uploads, attachments
│   ├── drafts/          # Message drafts
│   ├── notifications/   # Alert words, push notifications, muting
│   ├── organization/    # Realm/org settings, invitations, data export
│   ├── webhooks/        # Incoming/outgoing webhooks
│   └── permissions/     # Roles, user groups permissions
├── database/
│   └── jotster/sqlite/migrations/
├── spec/
├── tsonic.workspace.json
├── package.json
└── README.md
```

### Package dependency graph

```
server
├── core
├── auth           → core
├── event-queue    → core
├── messages       → core
├── channels       → core
├── subscriptions  → core, channels
├── users          → core
├── presence       → core, users
├── emoji          → core
├── uploads        → core
├── drafts         → core, messages
├── notifications  → core, users
├── organization   → core, users
├── webhooks       → core, messages
└── permissions    → core, users
```

All domain packages depend on `core`. Some packages have secondary dependencies as shown. The `server` package depends on all packages and is the only executable.

## 3. Architecture Layers

```
Zulip Clients (web, mobile, terminal)
        │
        ▼
HTTP Handlers (packages/server/)
  - One handler per endpoint, one file per handler
  - Translates Zulip API format ↔ internal domain types
  - Kebab-case files: handle-send-message.ts, handle-get-messages.ts
        │
        ▼
Domain/Service Layer (each package)
  - Pure business logic functions
  - No I/O, no DB access
  - Takes explicit parameters (repos, config, user context)
  - Returns Result types for errors
  - Functional style: no classes, immutable data
        │
        ▼
Repository Layer (each package)
  - Interface defined per module (e.g., MessageRepository)
  - SQLite implementation provided
  - Can swap for PostgreSQL later
  - All queries go through repository
        │
        ▼
SQLite (via EF Core)
```

### HTTP Handlers

Each Zulip API endpoint maps to one handler file in `packages/server/`. The handler is responsible for:

1. Parsing and validating the Zulip API request format
2. Calling domain functions with the appropriate parameters
3. Translating domain results back to Zulip API response format

Handlers do not contain business logic. They are thin adapters between the Zulip wire format and the internal domain.

### Domain/Service Layer

Each package exposes domain functions as its public API. These functions:

- Accept explicit parameters (no hidden state, no dependency injection containers)
- Receive repository interfaces to perform data access
- Return `Result<T, E>` types for expected errors
- Are pure functions where possible -- side effects are pushed to the edges

### Repository Layer

Each package defines its own repository interface(s). For example, `packages/messages/` defines `MessageRepository` with methods like `getById`, `getForNarrow`, `insert`. The SQLite implementation of each repository lives in the same package.

## 4. Multi-Tenancy Model

The **tenant** table is the root entity. Most tables have a `tenant_id` foreign key. All queries are scoped to a tenant.

### Multi-tenant mode (default)

- Each tenant gets a subdomain: `{subdomain}.example.com`
- Server extracts subdomain from `Host` header and resolves it to `tenant_id`
- A root user (configured at server level via `rootToken`) can create and manage tenants
- The root user is NOT a tenant user -- it is a server-level admin with no presence inside any tenant

### Single-tenant mode

- Configured in `jotster.config.json` with `{ "mode": "single-tenant", "singleTenantId": "..." }`
- The main domain serves the single tenant directly, no subdomain routing
- The root user can still manage the single tenant via server-level API

### Tenant resolution flow

```
Request arrives
    │
    ├─ Single-tenant mode? → use configured singleTenantId
    │
    └─ Multi-tenant mode?
         │
         ├─ Extract subdomain from Host header
         ├─ Look up tenant by subdomain
         ├─ Not found? → 404
         └─ Found → set tenant context for request
```

## 5. Database Conventions

| Convention         | Rule                                                      |
| ------------------ | --------------------------------------------------------- |
| Table names        | Singular, lowercase (`user`, `channel`, `message`)        |
| Column names       | snake_case (`tenant_id`, `created_at`, `sender_id`)       |
| Primary keys       | `id` column, system-generated string IDs (nanoid)         |
| Foreign keys       | `{referenced_table}_id` pattern                           |
| Timestamps         | `created_at`, `updated_at` as integer (Unix milliseconds) |
| Booleans           | Integer 0/1 (SQLite convention)                           |
| JSON data          | Stored as TEXT column                                     |
| Multi-tenancy      | All entity tables have `tenant_id` FK                     |
| Soft deletes       | Where needed, `deleted_at` integer column (nullable)      |

## 6. Migrations (Knex on Node.js)

Migrations are managed by **Knex.js** running on Node.js — they are NOT part of the Tsonic build. This follows the same pattern as Lesser and Clickmeter.

### Directory structure

```
database/
└── jotster/
    └── sqlite/
        └── migrations/
            ├── 20260217000000_initial_schema.js
            ├── 20260217000001_initial_data.js
            └── ...
knexfile.jotster.js
```

### Knexfile configuration

```javascript
// knexfile.jotster.js
export default {
  development: {
    client: "better-sqlite3",
    connection: { filename: process.env.JOTSTER_DATA_DIR + "/jotster.db" },
    useNullAsDefault: true,
    migrations: {
      directory: "./database/jotster/sqlite/migrations",
    },
  },
  test: {
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
    migrations: {
      directory: "./database/jotster/sqlite/migrations",
    },
  },
  production: {
    client: "better-sqlite3",
    connection: { filename: process.env.JOTSTER_DATA_DIR + "/jotster.db" },
    useNullAsDefault: true,
    pool: { min: 2, max: 10 },
    migrations: {
      directory: "./database/jotster/sqlite/migrations",
    },
  },
};
```

### Migration file pattern

Each migration follows the standard Knex ES module pattern:

```javascript
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("channel", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
    table.string("name").notNullable();
    // ...
    table.bigInteger("created_at").notNullable();
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("channel");
}
```

### Commands

```bash
npm run migrate                    # Run all pending migrations
npm run migrate:rollback           # Rollback last batch
npm run migrate:make <name>        # Create new migration file
npm run migrate:status             # Check migration status
```

### SQLite FK constraint workarounds

SQLite cannot `ALTER TABLE` to modify FK constraints. When needed, use the rename-and-swap pattern:

1. `PRAGMA foreign_keys = OFF`
2. Create new table with desired constraints
3. `INSERT INTO new_table SELECT * FROM old_table`
4. `DROP TABLE old_table`
5. `ALTER TABLE new_table RENAME TO old_table`
6. Recreate indexes
7. `PRAGMA foreign_keys = ON`

### SQLite pragmas

Applied at connection time:

- `PRAGMA foreign_keys = ON` — enforce FK constraints
- `PRAGMA journal_mode = WAL` — write-ahead logging for concurrent reads

## 7. Testing (Node.js / Mocha)

Tests run on **Node.js** using Mocha + Chai — they are NOT compiled through Tsonic. This follows the same pattern as Lesser.

### Test structure

```
tests/
├── index.ts                       # Main entry point, imports all tests
├── test-setup.ts                  # Global before/after hooks, DB + server setup
├── utils/
│   ├── test-db.ts                 # TestDatabase class — setup, teardown, helpers
│   ├── test-server.ts             # Starts the Jotster binary for integration tests
│   └── api-client.ts              # HTTP client for calling Zulip API endpoints
└── tests/
    ├── auth/
    │   ├── test-setup.ts          # Feature-specific test context
    │   ├── fetch-api-key.test.ts
    │   └── server-settings.test.ts
    ├── messages/
    │   ├── send-message.test.ts
    │   ├── get-messages.test.ts
    │   └── edit-message.test.ts
    ├── channels/
    ├── users/
    ├── subscriptions/
    └── ...
```

### Test execution flow

1. **Global setup** (`before`): create test database, run migrations, start Jotster binary
2. **Feature setup** (`beforeEach`): truncate all tables, insert test data
3. **Test**: call Zulip API endpoints via HTTP client, assert responses
4. **Global teardown** (`after`): stop server, delete test database

### Test database management

- Each test run gets a fresh SQLite database (file-based or `:memory:`)
- Migrations applied via Knex at setup
- `truncateAllTables()` between tests for isolation (disable FK checks, delete all rows, re-enable)
- Foreign key constraints and WAL mode enabled

### Test commands

```bash
npm run test                       # Run all tests
npm run test -- --grep "pattern"   # Run tests matching pattern
npm run test:integration           # Run integration tests against running server
```

### API client for tests

Tests use a lightweight HTTP client that speaks the Zulip API:

```typescript
// Authenticate as a test user
const client = createApiClient(baseUrl, testUserEmail, testApiKey);

// Make Zulip API calls
const result = await client.post("/api/v1/messages", {
  type: "stream",
  to: channelId,
  topic: "test topic",
  content: "Hello, world!",
});

expect(result.status).to.equal(200);
expect(result.body.id).to.be.a("number");
```

### Key dependencies (devDependencies)

```json
{
  "knex": "^3.1.0",
  "better-sqlite3": "^11.0.0",
  "mocha": "^10.0.0",
  "chai": "^5.0.0",
  "tsx": "^4.0.0"
}
```

Tests run via tsx loader: `NODE_OPTIONS='--import tsx' mocha tests/index.ts --timeout 60000`

## 8. Build vs. Runtime Split

The project has a clear split between what runs on Tsonic/.NET and what runs on Node.js:

| Concern         | Runtime     | Tool/Framework                |
| --------------- | ----------- | ----------------------------- |
| Server code     | .NET (AOT)  | Tsonic, @tsonic/express, EF Core |
| Migrations      | Node.js     | Knex.js, better-sqlite3       |
| Tests           | Node.js     | Mocha, Chai, tsx              |
| Dev tooling     | Node.js     | npm scripts                   |

`package.json` at root manages the Node.js side (migrations, tests, dev scripts). `tsonic.workspace.json` manages the Tsonic build side (packages, .NET dependencies).

## 9. Coding Standards

Following the clickmeter and lesser patterns:

| Area               | Convention                                              |
| ------------------ | ------------------------------------------------------- |
| File naming        | kebab-case (`handle-send-message.ts`)                   |
| Function naming    | camelCase (`handleSendMessage`)                         |
| Exports            | One exported function per file                          |
| Style              | Functional, no classes for business logic                |
| TypeScript         | Strict mode, `noLib: true` (Tsonic)                     |
| Imports            | `.js` extensions on all imports                         |
| Error handling     | Result types, not exceptions, for domain errors         |
| Data               | Immutable -- no mutation of shared objects              |

## 10. Configuration

### jotster.config.json

```json
{
  "mode": "multi-tenant",
  "listenUrl": "http://localhost:8080",
  "database": "jotster.db",
  "rootToken": "...",
  "singleTenantId": null
}
```

### Environment variable overrides

Environment variables take precedence over `jotster.config.json`.

| Config key       | Environment variable     |
| ---------------- | ------------------------ |
| `mode`           | `JOTSTER_MODE`           |
| `listenUrl`      | `JOTSTER_LISTEN_URL`     |
| `database`       | `JOTSTER_DB`             |
| `rootToken`      | `JOTSTER_ROOT_TOKEN`     |
| `singleTenantId` | `JOTSTER_SINGLE_TENANT`  |

Resolution order: environment variable > config file > default value.

## 11. Module List

Jotster has 24 modules. Each module has a corresponding spec file.

| #  | Module                 | Package              | Spec file                      |
| -- | ---------------------- | -------------------- | ------------------------------ |
| 01 | Server & Auth          | server, auth         | `01-server-and-auth.md`        |
| 02 | Event Queue            | event-queue          | `02-event-queue.md`            |
| 03 | Messages               | messages             | `03-messages.md`               |
| 04 | Emoji Reactions        | emoji                | `04-emoji-reactions.md`        |
| 05 | Channels               | channels             | `05-channels.md`               |
| 06 | Channel Folders        | channels             | `06-channel-folders.md`        |
| 07 | Subscriptions          | subscriptions        | `07-subscriptions.md`          |
| 08 | Users                  | users                | `08-users.md`                  |
| 09 | User Groups            | users, permissions   | `09-user-groups.md`            |
| 10 | User Status            | users                | `10-user-status.md`            |
| 11 | Presence               | presence             | `11-presence.md`               |
| 12 | Typing Indicators      | presence             | `12-typing-indicators.md`      |
| 13 | Muting                 | notifications        | `13-muting.md`                 |
| 14 | File Uploads           | uploads              | `14-file-uploads.md`           |
| 15 | Custom Emoji           | emoji                | `15-custom-emoji.md`           |
| 16 | Custom Profile Fields  | users                | `16-custom-profile-fields.md`  |
| 17 | Drafts                 | drafts               | `17-drafts.md`                 |
| 18 | Alert Words            | notifications        | `18-alert-words.md`            |
| 19 | Organization Settings  | organization         | `19-organization-settings.md`  |
| 20 | Invitations            | organization         | `20-invitations.md`            |
| 21 | Push Notifications     | notifications        | `21-push-notifications.md`     |
| 22 | Webhooks               | webhooks             | `22-webhooks.md`               |
| 23 | Roles & Permissions    | permissions          | `23-roles-and-permissions.md`  |
| 24 | Data Export            | organization         | `24-data-export.md`            |

### Module-to-package mapping summary

Several modules share a package:

| Package        | Modules                                              |
| -------------- | ---------------------------------------------------- |
| server         | Server & Auth (01)                                   |
| auth           | Server & Auth (01)                                   |
| event-queue    | Event Queue (02)                                     |
| messages       | Messages (03)                                        |
| emoji          | Emoji Reactions (04), Custom Emoji (15)              |
| channels       | Channels (05), Channel Folders (06)                  |
| subscriptions  | Subscriptions (07)                                   |
| users          | Users (08), User Status (10), Custom Profile Fields (16) |
| permissions    | User Groups (09), Roles & Permissions (23)           |
| presence       | Presence (11), Typing Indicators (12)                |
| notifications  | Muting (13), Alert Words (18), Push Notifications (21) |
| uploads        | File Uploads (14)                                    |
| drafts         | Drafts (17)                                          |
| organization   | Organization Settings (19), Invitations (20), Data Export (24) |
| webhooks       | Webhooks (22)                                        |
