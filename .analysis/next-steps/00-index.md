# Next Steps: Security And Architecture Hardening

This plan turns the audit findings into implementation-ready work. The goal is not to add scattered checks. The goal is to make unsafe code hard to write, easy to detect, and impossible to ship through gates.

## Current Verdict

Jotster's greenfield architecture is directionally sound:

- Product vocabulary is clean.
- Workspaces are the isolation boundary.
- Global identity plus workspace-local membership/participant is the right model.
- Humans and external agents share the same participant/notification/permission model.
- Zulip is isolated as an API edge.

The missing production-grade piece is enforcement. Today, workspace isolation is present in schema and docs, but runtime data access still depends on callers doing the right thing. That is not acceptable for a multi-tenant system.

## Required Outcome

A request that has resolved to `workspace_id = w_acme` must not be able to read, write, authorize, notify, or deliver anything for `workspace_id = w_beta`, even if a handler forgets to add a filter.

Correct by construction means:

```text
host/domain -> workspace context -> authenticated actor -> tenant-scoped DB context -> authorization -> handler
```

Not:

```text
handler -> manually remember workspace_id filters everywhere
```

The normal database factory must return a tenant/workspace-scoped context. Unscoped access must be a different admin/bootstrap context type with explicit privileged construction, audit requirements, and narrow call sites.

## Documents

- `01-threat-model-and-principles.md` — attack model, invariants, and non-negotiable security principles.
- `02-scoped-data-access.md` — mandatory workspace-scoped ORM/data-access boundary.
- `03-request-auth-boundary.md` — domain resolution, authentication, context creation, and server middleware.
- `04-schema-hardening.md` — migration-level constraints that close remaining cross-workspace consistency gaps.
- `05-authorization.md` — permission evaluator, resource canonicalization, and grant safety.
- `06-notifications-and-agents.md` — secure queues, deliveries, and agent-specific notification handling.
- `07-config-and-operational-hardening.md` — fail-closed config, production mode, error handling, and operational controls.
- `08-tests-and-proof-gates.md` — negative tests and static gates required before merging.
- `09-execution-plan.md` — one-pass implementation order and completion criteria.
- `10-prior-plan-incorporation-report.md` — coverage map proving this plan incorporates the previous greenfield rewrite plan.
- `11-implementation-status.md` — current implementation status, proof gates, and remaining external blocker.

## Priority Order

1. Build the scoped data-access boundary.
2. Add request/domain/auth context middleware.
3. Harden schema invariants in the single migration.
4. Implement authorization as a required service boundary.
5. Secure notification queues and delivery ownership.
6. Add config/startup hardening and safe error handling.
7. Add proof gates and negative multi-workspace tests.

## Completion Definition

This work is complete only when all of these are true:

- Product code outside `core` cannot access raw unscoped `JotsterDbContext` for workspace-owned data.
- Default DB access returns a tenant/workspace-scoped context; admin access uses a separate unscoped context type.
- Every workspace-owned query is scoped automatically by the returned context or by a repository that is constructed from that context.
- Writes reject entities whose `WorkspaceId` does not match the active request context.
- Domain resolution happens before authentication and produces an immutable workspace context.
- Auth sessions and API credentials are workspace-scoped and cannot be replayed across domains/workspaces.
- Authorization checks use canonical resources and cannot grant or evaluate resources outside the active workspace.
- Notification queues/deliveries cannot be guessed, stolen, drained, or cross-bound to another participant.
- The schema rejects structurally invalid rows where the DB can enforce the invariant.
- Negative tests prove cross-workspace reads/writes/notifications/auth fail.
