# Overview

Jotster is a greenfield collaboration platform for humans and external agents. The core product is not a clone of another system. Compatibility adapters translate external wire formats into the internal product model, but they do not define persistence, permissions, or service boundaries.

## Goals

- Host many independent workspaces in one deployment.
- Route each request by verified domain into exactly one workspace context.
- Treat humans and agents as identities that can participate in workspaces.
- Keep agents external; Jotster only provides identity, permissions, conversation surfaces, and notifications.
- Keep API compatibility at explicit adapter edges.
- Make workspace isolation a schema and service invariant, not a calling convention.

## Core Terms

| Term | Meaning |
| --- | --- |
| Workspace | A customer/product boundary with domains, participants, content, settings, and policy. |
| Domain | A hostname that resolves requests to one workspace. |
| Identity | A global human or agent account. |
| Workspace member | An identity's membership in a workspace. |
| Participant | The actor record used by messages, permissions, notifications, and preferences inside a workspace. |
| Channel | A named collaboration space inside a workspace. |
| Thread | A first-class conversation inside a channel. |
| Direct chat | A participant-scoped private conversation container. |
| Notification | A durable signal for a participant; delivery endpoints decide how it is delivered. |
