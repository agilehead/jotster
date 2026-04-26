# Workspaces And Domains

A deployment can host multiple workspaces. The HTTP host is resolved before authentication so every downstream operation receives an explicit workspace context.

## Resolution Flow

```text
request host
  -> normalize host
  -> find active workspace_domain
  -> load workspace
  -> attach RequestContext.WorkspaceId
  -> authenticate identity and participant for that workspace
```

## Data Ownership

`workspace` is the product root. Workspace-owned tables contain `workspace_id`; global identity tables do not. Domain rows are globally unique so the same host cannot point at two workspaces.

## Safety Rules

- Never infer workspace from a user-controlled body field after domain resolution.
- Never join workspace-owned tables through bare IDs.
- Every service method that reads or writes workspace-owned data accepts a workspace context or workspace ID.
- Background jobs carry workspace ID in payloads and must re-check that referenced rows belong to that workspace.
