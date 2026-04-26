export interface WorkspaceOwnedEntity {
  WorkspaceId: string;
}

export const WORKSPACE_OWNED_ENTITY_NAMES = [
  "AuthProvider",
  "ExternalIdentity",
  "AuthSession",
  "ApiCredential",
  "WorkspaceMember",
  "Participant",
  "ParticipantPreference",
  "Role",
  "ParticipantRole",
  "Group",
  "GroupMember",
  "GroupChild",
  "PermissionGrant",
  "Channel",
  "ChannelMember",
  "Thread",
  "DirectChat",
  "DirectChatMember",
  "Message",
  "MessageVersion",
  "MessageMarker",
  "Reaction",
  "Attachment",
  "Emoji",
  "ProfileField",
  "ParticipantProfileFieldValue",
  "WorkspaceMemberDefault",
  "Webhook",
  "DeviceToken",
  "AuditEvent",
  "Notification",
  "NotificationEndpoint",
  "NotificationDelivery",
];

export function requireWorkspaceMatch(
  expectedWorkspaceId: string,
  actualWorkspaceId: string,
): void {
  if (expectedWorkspaceId !== actualWorkspaceId) {
    throw new Error("Workspace context mismatch");
  }
}

export function isWorkspaceOwnedEntity(value: unknown): value is WorkspaceOwnedEntity {
  if (value === undefined || value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as WorkspaceOwnedEntity;
  return typeof candidate.WorkspaceId === "string";
}

export function requireWorkspaceOwnedEntity(
  expectedWorkspaceId: string,
  value: unknown,
): void {
  if (!isWorkspaceOwnedEntity(value)) {
    return;
  }
  requireWorkspaceMatch(expectedWorkspaceId, value.WorkspaceId);
}
