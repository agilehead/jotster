# Authorization

Authorization is resource-based and workspace-scoped.

## Concepts

- Subject: participant, role, group, or system actor.
- Resource: canonical path under a workspace.
- Action: operation name such as `message:create` or `channel:join`.
- Effect: allow or deny.

## Resource Paths

```text
/workspaces/{workspaceId}
/workspaces/{workspaceId}/participants/{participantId}
/workspaces/{workspaceId}/channels/{channelId}
/workspaces/{workspaceId}/channels/{channelId}/threads/{threadId}
/workspaces/{workspaceId}/direct-chats/{directChatId}
```

## Safety Rules

- A resource path must start with the current workspace path.
- Grants are stored with `workspace_id` and cannot apply across workspaces.
- Channel and thread membership checks are authorization inputs, not presentation filters.
- Deny effects must be resolved before allow effects when both match.
