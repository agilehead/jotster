# Principles And Vocabulary

## Product Principles

Jotster is not a Zulip clone internally. Jotster is a greenfield collaboration product with a Zulip-compatible API available at the edge.

Core principles:

- **Greenfield core:** core domain, DB schema, and module names must use Jotster concepts, not Zulip compatibility terms.
- **Multi-tenant by design:** one deployment can host many workspaces, each selected by domain/API routing.
- **Human + agent watercooler:** external agents participate like humans in channels, threads, direct chats, messages, reactions, and notifications.
- **External agent execution:** Jotster does not store agent runs, memory, plans, tool traces, execution steps, or internal approval state. Codex, Claude Code, and other systems own that.
- **Identity is not membership:** one identity can be present in many workspaces with different roles, profile display, settings, and state.
- **Authorization is explicit:** scattered checks like `role <= 200` and `channel.is_private` are not sufficient for the new core.
- **Adapter isolation:** Zulip compatibility can translate terms, fields, and response shapes, but only at `Jotster.Api.Zulip`.

## Canonical Product Terms

Use these terms in product/domain/database code.

| Canonical term | Meaning |
|---|---|
| `workspace` | Tenant-owned collaboration space. |
| `workspace_domain` | Host/domain routed to a workspace. |
| `identity` | Global human or agent identity. |
| `external_identity` | SSO/OIDC/SAML/OAuth provider subject linked to an identity. |
| `workspace_member` | Identity’s membership in a workspace. |
| `participant` | Actor inside one workspace; sender/recipient/assignee/notification target. |
| `human_profile` | Human-specific identity/profile details. |
| `agent_profile` | External agent/service-account profile details. |
| `api_credential` | Scoped token/key for API access by human clients or external agents. |
| `auth_session` | Workspace-scoped interactive session. |
| `channel` | Named shared room in a workspace. |
| `channel_member` | Participant’s channel membership and per-channel preferences. |
| `thread` | First-class discussion topic within a channel or conversation. |
| `direct_chat` | Direct/private conversation among participants. |
| `direct_chat_member` | Participant membership in a direct chat. |
| `message` | Content sent by a participant in channel/thread/direct-chat context. |
| `message_version` | Edit history/version record for a message. |
| `message_marker` | Per-participant state on a message: read, starred, collapsed, etc. |
| `reaction` | Participant reaction to a message. |
| `attachment` | Uploaded or linked file/blob metadata. |
| `notification` | Durable notification generated for a participant. |
| `notification_endpoint` | Delivery target such as email, push, websocket, webhook, queue, or polling. |
| `notification_delivery` | Delivery attempt/status for a notification endpoint. |
| `role` | Workspace-scoped role, managed by authorization. |
| `group` | Workspace-scoped participant group. |
| `permission_grant` | Subject/resource/action authorization assignment. |
| `resource` | Authorization resource path. |
| `webhook` | Incoming/outgoing integration endpoint. |
| `device_token` | Human push notification device token. |
| `audit_event` | Security/action audit row. |

## Current-To-Target Renames

| Current term/table | Target term/table | Reason |
|---|---|---|
| `tenant` | `workspace` | Product term should be workspace while system remains multi-tenant. |
| `user` | `identity` + `workspace_member` + `participant` | Current `user` mixes login, tenant membership, role, profile, and bot status. |
| `subscription` | `channel_member` | Membership in a channel is a product concept, not a Zulip subscription concept. |
| `topic` | `thread` | Thread needs identity, permissions, notifications, lifecycle, and history. |
| `dm_group` | `direct_chat` | Product-owned term. |
| `dm_group_member` | `direct_chat_member` | Product-owned membership table. |
| `message_flag` | `message_marker` | Generic per-participant message state. |
| `message_edit_history` | `message_version` | Version history is generic, not “edit history” only. |
| `api_key` | `api_credential` | Credentials include API tokens, service keys, webhook secrets, session-bound tokens. |
| `user_setting` | `participant_preferences` | Preferences are per workspace participant, not global user identity. |
| `realm_domain` | `workspace_domain` | Domain routing belongs to workspace. |
| `tenant_user_setting_default` | `workspace_member_defaults` | Workspace-specific defaults. |
| `custom_emoji` | `emoji` | Emoji can be workspace-owned without “custom” in core. |
| `custom_profile_field` | `profile_field` | Workspace profile field. |
| `push_device_token` | `device_token` | Generic device token. |
| `outgoing_webhook` | `webhook` / `webhook_subscription` | Integration endpoint and delivery/subscription should be separated. |
| `bot_storage` | Remove or edge-owned compatibility storage | Agent execution/storage belongs outside Jotster. |

## Terms Banned Outside API Adapters

These terms may appear in `Jotster.Api.Zulip` or compatibility tests only.

- `zulip`
- `realm`
- `stream`
- `subscription` when meaning channel membership
- `topic` when meaning first-class thread
- `pm`
- `private` when meaning direct message
- `narrow`
- `feature_level`
- `legacy`
- `compat`
- `invite_only`

Example adapter translation:

```csharp
// Jotster.Api.Zulip only
public sealed record ZulipStreamResponse(
    long stream_id,
    string name,
    bool invite_only
);

public static ZulipStreamResponse ToZulip(Channel channel)
{
    return new ZulipStreamResponse(
        stream_id: channel.Id,
        name: channel.Name,
        invite_only: channel.Visibility == ChannelVisibility.Private
    );
}
```

Core code should not do this:

```csharp
// Not allowed in core
message.StreamId = channel.Id;
message.Subject = topicName;
```

Core code should do this:

```csharp
message.ChannelId = channel.Id;
message.ThreadId = thread.Id;
```
