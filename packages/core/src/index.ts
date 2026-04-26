import "./db/design-time-dbcontext-factory.ts";

export { ok, err } from "./types/result.ts";
export type { Result, Ok, Err } from "./types/result.ts";
export {
  AdminContext,
  BootstrapContext,
  RequestContext,
  WorkspaceContext,
} from "./types/request-context.ts";

export { ServerConfig } from "./config/server-config.ts";
export { loadConfig, validateConfig } from "./config/load-config.ts";

export { generateId } from "./generate-id.ts";
export { parseId } from "./public-ids.ts";

export {
  SERVER_GENERATION,
  MAX_MESSAGE_LENGTH,
  MAX_THREAD_TITLE_LENGTH,
  MAX_CHANNEL_NAME_LENGTH,
  MAX_CHANNEL_DESCRIPTION_LENGTH,
} from "./constants.ts";

export { createDbOptions } from "./db/create-db-options.ts";
export {
  JotsterAdminDbContext,
  JotsterBootstrapDbContext,
  JotsterWorkspaceDbContext,
  createAdminDbContext,
  createBootstrapDbContext,
  createWorkspaceDbContext,
} from "./db/jotster-db-context.ts";
export {
  WORKSPACE_OWNED_ENTITY_NAMES,
  isWorkspaceOwnedEntity,
  requireWorkspaceOwnedEntity,
  requireWorkspaceMatch,
} from "./db/workspace-owned.ts";
export type { WorkspaceOwnedEntity } from "./db/workspace-owned.ts";

export { Workspace } from "./db/entities/workspace.ts";
export { WorkspaceDomain } from "./db/entities/workspace-domain.ts";
export { Identity } from "./db/entities/identity.ts";
export { HumanProfile } from "./db/entities/human-profile.ts";
export { AgentProfile } from "./db/entities/agent-profile.ts";
export { AuthProvider } from "./db/entities/auth-provider.ts";
export { ExternalIdentity } from "./db/entities/external-identity.ts";
export { AuthSession } from "./db/entities/auth-session.ts";
export { ApiCredential } from "./db/entities/api-credential.ts";
export { WorkspaceMember } from "./db/entities/workspace-member.ts";
export { Participant } from "./db/entities/participant.ts";
export { ParticipantPreference } from "./db/entities/participant-preference.ts";
export { Role } from "./db/entities/role.ts";
export { ParticipantRole } from "./db/entities/participant-role.ts";
export { Group } from "./db/entities/group.ts";
export { GroupMember } from "./db/entities/group-member.ts";
export { GroupChild } from "./db/entities/group-child.ts";
export { PermissionGrant } from "./db/entities/permission-grant.ts";
export { Channel } from "./db/entities/channel.ts";
export { ChannelMember } from "./db/entities/channel-member.ts";
export { Thread } from "./db/entities/thread.ts";
export { DirectChat } from "./db/entities/direct-chat.ts";
export { DirectChatMember } from "./db/entities/direct-chat-member.ts";
export { Message } from "./db/entities/message.ts";
export { MessageVersion } from "./db/entities/message-version.ts";
export { MessageMarker } from "./db/entities/message-marker.ts";
export { Reaction } from "./db/entities/reaction.ts";
export { Attachment } from "./db/entities/attachment.ts";
export { Emoji } from "./db/entities/emoji.ts";
export { ProfileField } from "./db/entities/profile-field.ts";
export { ParticipantProfileFieldValue } from "./db/entities/participant-profile-field-value.ts";
export { WorkspaceMemberDefault } from "./db/entities/workspace-member-default.ts";
export { Webhook } from "./db/entities/webhook.ts";
export { DeviceToken } from "./db/entities/device-token.ts";
export { AuditEvent } from "./db/entities/audit-event.ts";
export { Notification } from "./db/entities/notification.ts";
export { NotificationEndpoint } from "./db/entities/notification-endpoint.ts";
export { NotificationDelivery } from "./db/entities/notification-delivery.ts";
