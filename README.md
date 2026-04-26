# Jotster

Jotster is a greenfield collaboration server for humans and external agentic workers. It is built as a Tsonic monorepo that compiles TypeScript-flavored product code into .NET output.

## Product Model

Jotster is workspace-first:

- A single deployment can host many workspaces.
- Each workspace is reached through one or more verified domains.
- Human and agent identities are global, then join workspaces through memberships.
- Every active actor inside a workspace is a participant.
- Channels, threads, direct chats, messages, attachments, reactions, preferences, and notifications are workspace-owned.
- External agents are not executed by Jotster. They interact as participants through credentials, permissions, messages, and notifications.

## Runtime Modules

```text
packages/core              Database entities, config, IDs, shared primitives
packages/identity          Domains, identities, profiles, memberships, credentials, sessions
packages/authorization     Roles, grants, resource paths, workspace-safety checks
packages/collaboration     Workspaces, channels, threads, direct chats, messages, files, reactions
packages/notifications     Participant notifications, endpoints, delivery, event queues
packages/api-native        Jotster-first API surface
packages/api-agent         Machine-friendly API surface for external agents
packages/api-zulip         Compatibility adapter; no product persistence ownership
packages/server            HTTP host and API composition
```

Dependency direction is inward: API packages call product modules; product modules depend on `core`; `core` owns persistence primitives and has no dependency on API packages.

## Database Rules

The initial migration is intentionally rewritten as a product-owned schema:

- `workspace` and `identity` are global roots.
- Workspace-owned tables carry `workspace_id`.
- Workspace-owned rows with their own IDs use composite primary keys: `workspace_id + id`.
- Foreign keys to workspace-owned tables include `workspace_id` on both sides.
- API compatibility terms do not own database tables.

## Current Build Note

This branch is waiting on the synchronized Tsonic package wave that exposes the callable attributes API:

```ts
A<Workspace>().prop((x) => x.Id).add(KeyAttribute);
```

Until that package wave lands, avoid judging this rewrite by the local latest compiler failure caused by stale installed attribute typings. Non-compiler hygiene tests can still run directly with Mocha.

## Local Hygiene Tests

Run the non-compiler checks directly:

```bash
NODE_OPTIONS='--import tsx' npx mocha tests/index.ts --timeout 60000
```

The normal `npm test` path intentionally runs the Tsonic build first and remains blocked until the package wave is available.
