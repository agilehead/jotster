# Jotster Greenfield Rewrite Plan

This folder captures the architectural direction for the Jotster rewrite discussed so far. The plan intentionally treats this as a large product and platform rewrite, not a compatibility cleanup.

## Documents

- `01-principles-and-vocabulary.md` — product principles, canonical terms, and terms that must stay at the API edge.
- `02-current-state-and-gaps.md` — what the current schema/code supports today and where it is unsafe or too Zulip-shaped.
- `03-target-architecture.md` — target .NET monorepo architecture and module boundaries.
- `04-multitenancy-and-auth.md` — domain-routed multi-tenancy, sessions, SSO, and tenant safety rules.
- `05-identity-participants-agents.md` — human/agent identity model and notification behavior for external agents.
- `06-authorization-permissions.md` — Permiso-derived authorization strategy and access model for workspaces, channels, threads, direct chats, and messages.
- `07-target-data-model.md` — target DB model, table groups, ownership, keys, and query patterns.
- `08-apis-and-zulip-edge.md` — native API, agent API, Zulip adapter boundary, and compatibility rules.
- `09-rewrite-execution-plan.md` — phased implementation plan for the rewrite.
- `10-validation-and-safety.md` — validation gates, tenant isolation checks, migration checks, and test strategy.

## One-Sentence Target

Jotster is a greenfield, multi-tenant, domain-routed collaboration platform for humans and external agents, built as a modular .NET monorepo with clean product-owned schemas, Persona-derived identity, Permiso-derived authorization, first-class participant notifications, and Zulip compatibility isolated entirely at the edge.

## Core Architecture At A Glance

```text
                          ┌──────────────────────────────┐
                          │      One Jotster Deployment   │
                          └───────────────┬──────────────┘
                                          │
                         resolve Host / API audience / route
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Workspace Context                                 │
│                  workspace_id + domain + policy                         │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼                                         ▼
┌──────────────────────────┐                 ┌────────────────────────────┐
│ Jotster.Identity          │                 │ Jotster.Authorization      │
│ Persona-derived .NET      │                 │ Permiso-derived .NET       │
│ auth, SSO, sessions,      │                 │ roles, resources, grants,  │
│ credentials               │                 │ permission checks          │
└───────────────┬──────────┘                 └──────────────┬─────────────┘
                │                                           │
                └──────────────────────┬────────────────────┘
                                       ▼
                         ┌──────────────────────────┐
                         │ Jotster.Collaboration    │
                         │ workspace, participants, │
                         │ channels, threads,       │
                         │ direct chats, messages,  │
                         │ attachments              │
                         └──────────────┬───────────┘
                                        ▼
                         ┌──────────────────────────┐
                         │ Jotster.Notifications    │
                         │ human + agent delivery   │
                         └──────────────┬───────────┘
                                        ▼
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ Native API        │          │ Agent API         │          │ Zulip API Edge    │
│ product-first     │          │ machine-friendly  │          │ compatibility     │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

## Most Important Decisions

1. **Jotster remains multi-tenant.** One deployment can host many independent workspaces.
2. **Domains route workspaces.** `chat.acme.com`, `jotster.beta.io`, and `ops.internal.dev` can all route to the same deployment and resolve to different workspaces.
3. **Product term is `workspace`.** The system is multi-tenant, but product-owned DB/domain vocabulary should use `workspace`, not `tenant`.
4. **Identity is global; membership is per workspace.** A human or agent identity can be a participant in many workspaces.
5. **Agents are external but humanlike.** Jotster does not run agents; it gives them identity, membership, credentials, permissions, messages, and notifications.
6. **Notifications are generic.** Humans and agents both receive notifications; delivery endpoints differ.
7. **Persona and Permiso are ported as .NET modules.** Their ideas come in; their JS code/schema is not copied wholesale.
8. **Zulip is an API adapter only.** No Zulip terms, fields, policies, or schema constraints should leak into core modules.
9. **All workspace data is scoped by construction.** Every workspace-owned row carries `workspace_id`, all queries filter by workspace context, and FKs/indexes prevent accidental cross-workspace joins.
10. **Threads are first-class.** Current `message.topic` string behavior must become a real `thread` model with permissions, notifications, follows, mutes, and history.
