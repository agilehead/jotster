import {
  Attachment,
  AuditEvent,
  Channel,
  ChannelMember,
  DirectChat,
  DirectChatMember,
  Emoji,
  Message,
  MessageMarker,
  MessageVersion,
  ParticipantPreference,
  Reaction,
  Thread,
  Webhook,
  Workspace,
  WorkspaceDomain,
  WorkspaceMemberDefault,
  generateId,
} from "@jotster/core";
import type { AdminContext } from "@jotster/core";
import type { long } from "@tsonic/core/types.js";

export interface CreateWorkspaceInput {
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string;
  logoUrl?: string;
  createdAt: long;
}

export interface CreateChannelInput {
  workspaceId: string;
  name: string;
  description?: string;
  visibility: string;
  createdByParticipantId?: string;
  createdAt: long;
}

export interface CreateChannelMessageInput {
  workspaceId: string;
  senderParticipantId: string;
  channelId: string;
  threadId: string;
  content: string;
  renderedContent?: string;
  createdAt: long;
}

export interface MessageDraft {
  workspaceId: string;
  participantId: string;
  channelId?: string;
  threadId?: string;
  directChatId?: string;
  content: string;
}

export function normalizeWorkspaceSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase();
}

export function createWorkspaceRecord(input: CreateWorkspaceInput): Workspace {
  const workspace = new Workspace();
  workspace.Id = generateId("w");
  workspace.Slug = normalizeWorkspaceSlug(input.slug);
  workspace.Name = input.name;
  workspace.Description = input.description ?? "";
  workspace.IconUrl = input.iconUrl ?? null;
  workspace.LogoUrl = input.logoUrl ?? null;
  workspace.State = "active";
  workspace.CreatedAt = input.createdAt;
  workspace.UpdatedAt = input.createdAt;
  return workspace;
}

export function createWorkspaceDomainRecord(
  workspaceId: string,
  domain: string,
  isPrimary: boolean,
  createdAt: long,
): WorkspaceDomain {
  const record = new WorkspaceDomain();
  record.Domain = normalizeDomain(domain);
  record.WorkspaceId = workspaceId;
  record.IsPrimary = isPrimary ? 1 : 0;
  record.State = "active";
  record.CreatedAt = createdAt;
  record.UpdatedAt = createdAt;
  return record;
}

export function createWorkspaceMemberDefaultRecord(
  workspaceId: string,
  key: string,
  valueJson: string,
  updatedAt: long,
): WorkspaceMemberDefault {
  const record = new WorkspaceMemberDefault();
  record.WorkspaceId = workspaceId;
  record.Key = key;
  record.ValueJson = valueJson;
  record.UpdatedAt = updatedAt;
  return record;
}

export function createAuditEventRecord(
  workspaceId: string,
  actorParticipantId: string | undefined,
  action: string,
  objectType: string,
  objectId: string | undefined,
  metadataJson: string,
  createdAt: long,
): AuditEvent {
  const event = new AuditEvent();
  event.Id = generateId("audit");
  event.WorkspaceId = workspaceId;
  event.ActorParticipantId = actorParticipantId ?? null;
  event.Action = action;
  event.ObjectType = objectType;
  event.ObjectId = objectId ?? null;
  event.MetadataJson = metadataJson;
  event.CreatedAt = createdAt;
  return event;
}

function isJsonObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseAuditMetadataJson(metadataJson: string): Record<string, unknown> {
  if (metadataJson.trim().length === 0) {
    return {};
  }
  const parsed: unknown = JSON.parse(metadataJson);
  if (!isJsonObjectRecord(parsed)) {
    throw new Error("Admin audit metadata must be a JSON object");
  }
  return parsed;
}

export function createAdminAuditEventRecord(
  adminContext: AdminContext,
  workspaceId: string,
  action: string,
  objectType: string,
  objectId: string | undefined,
  metadataJson: string,
  createdAt: long,
): AuditEvent {
  if (adminContext.Reason.trim().length === 0) {
    throw new Error("Admin audit reason is required");
  }
  const metadata = {
    adminIdentityId: adminContext.IdentityId,
    adminAuthKind: adminContext.AuthKind,
    reason: adminContext.Reason,
    details: parseAuditMetadataJson(metadataJson),
  };
  return createAuditEventRecord(
    workspaceId,
    undefined,
    action,
    objectType,
    objectId,
    JSON.stringify(metadata),
    createdAt,
  );
}

export function createChannelRecord(input: CreateChannelInput): Channel {
  const channel = new Channel();
  channel.Id = generateId("c");
  channel.WorkspaceId = input.workspaceId;
  channel.Name = input.name;
  channel.Description = input.description ?? "";
  channel.Visibility = input.visibility;
  channel.State = "active";
  channel.CreatedByParticipantId = input.createdByParticipantId ?? null;
  channel.CreatedAt = input.createdAt;
  channel.UpdatedAt = input.createdAt;
  return channel;
}

export function createChannelMemberRecord(
  workspaceId: string,
  channelId: string,
  participantId: string,
  role: string,
  createdAt: long,
): ChannelMember {
  const member = new ChannelMember();
  member.WorkspaceId = workspaceId;
  member.ChannelId = channelId;
  member.ParticipantId = participantId;
  member.Role = role;
  member.State = "active";
  member.Muted = 0;
  member.CreatedAt = createdAt;
  member.UpdatedAt = createdAt;
  return member;
}

export function createThreadRecord(
  workspaceId: string,
  channelId: string,
  title: string,
  createdByParticipantId: string,
  createdAt: long,
): Thread {
  const thread = new Thread();
  thread.Id = generateId("t");
  thread.WorkspaceId = workspaceId;
  thread.ChannelId = channelId;
  thread.Title = title;
  thread.State = "active";
  thread.AccessPolicy = "inherit";
  thread.CreatedByParticipantId = createdByParticipantId;
  thread.CreatedAt = createdAt;
  thread.UpdatedAt = createdAt;
  return thread;
}

export function canJoinChannel(channel: Channel): boolean {
  return channel.State === "active" && channel.Visibility !== "restricted";
}

export function createChannelMessageRecord(input: CreateChannelMessageInput): Message {
  const message = new Message();
  message.Id = generateId("m");
  message.WorkspaceId = input.workspaceId;
  message.SenderParticipantId = input.senderParticipantId;
  message.ContainerKind = "channel_thread";
  message.ChannelId = input.channelId;
  message.ThreadId = input.threadId;
  message.DirectChatId = null;
  message.Content = input.content;
  message.RenderedContent = input.renderedContent ?? null;
  message.State = "active";
  message.CreatedAt = input.createdAt;
  message.EditedAt = null;
  return message;
}

export function createDirectChatRecord(workspaceId: string, kind: string, createdAt: long): DirectChat {
  const chat = new DirectChat();
  chat.Id = generateId("dc");
  chat.WorkspaceId = workspaceId;
  chat.Kind = kind;
  chat.State = "active";
  chat.CreatedAt = createdAt;
  chat.UpdatedAt = createdAt;
  return chat;
}

export function createDirectChatMemberRecord(
  workspaceId: string,
  directChatId: string,
  participantId: string,
  createdAt: long,
): DirectChatMember {
  const member = new DirectChatMember();
  member.WorkspaceId = workspaceId;
  member.DirectChatId = directChatId;
  member.ParticipantId = participantId;
  member.State = "active";
  member.CreatedAt = createdAt;
  return member;
}

export function createMessageVersionRecord(
  message: Message,
  editorParticipantId: string,
  createdAt: long,
): MessageVersion {
  const version = new MessageVersion();
  version.Id = generateId("mv");
  version.WorkspaceId = message.WorkspaceId;
  version.MessageId = message.Id;
  version.EditorParticipantId = editorParticipantId;
  version.PreviousContent = message.Content;
  version.PreviousRenderedContent = message.RenderedContent;
  version.PreviousThreadId = message.ThreadId;
  version.PreviousChannelId = message.ChannelId;
  version.CreatedAt = createdAt;
  return version;
}

export function createMessageMarkerRecord(
  workspaceId: string,
  messageId: string,
  participantId: string,
  marker: string,
  createdAt: long,
): MessageMarker {
  const record = new MessageMarker();
  record.WorkspaceId = workspaceId;
  record.MessageId = messageId;
  record.ParticipantId = participantId;
  record.Marker = marker;
  record.CreatedAt = createdAt;
  return record;
}

export function createReactionRecord(
  workspaceId: string,
  messageId: string,
  participantId: string,
  emojiKey: string,
  createdAt: long,
): Reaction {
  const reaction = new Reaction();
  reaction.Id = generateId("react");
  reaction.WorkspaceId = workspaceId;
  reaction.MessageId = messageId;
  reaction.ParticipantId = participantId;
  reaction.EmojiKey = emojiKey;
  reaction.CreatedAt = createdAt;
  return reaction;
}

export function createMessageDraft(
  workspaceId: string,
  participantId: string,
  content: string,
): MessageDraft {
  return { workspaceId, participantId, content };
}

export function createAttachmentRecord(
  workspaceId: string,
  ownerParticipantId: string,
  storageKey: string,
  fileName: string,
  contentType: string,
  byteSize: long,
  createdAt: long,
  messageId?: string,
): Attachment {
  const attachment = new Attachment();
  attachment.Id = generateId("att");
  attachment.WorkspaceId = workspaceId;
  attachment.OwnerParticipantId = ownerParticipantId;
  attachment.MessageId = messageId ?? null;
  attachment.StorageKey = storageKey;
  attachment.FileName = fileName;
  attachment.ContentType = contentType;
  attachment.ByteSize = byteSize;
  attachment.CreatedAt = createdAt;
  return attachment;
}

export function createEmojiRecord(
  workspaceId: string,
  key: string,
  displayName: string,
  imageStorageKey: string,
  createdByParticipantId: string | undefined,
  createdAt: long,
): Emoji {
  const emoji = new Emoji();
  emoji.Id = generateId("emoji");
  emoji.WorkspaceId = workspaceId;
  emoji.Key = key;
  emoji.DisplayName = displayName;
  emoji.ImageStorageKey = imageStorageKey;
  emoji.CreatedByParticipantId = createdByParticipantId ?? null;
  emoji.CreatedAt = createdAt;
  return emoji;
}

export function createPresencePreferenceRecord(
  workspaceId: string,
  participantId: string,
  state: string,
  updatedAt: long,
): ParticipantPreference {
  const preference = new ParticipantPreference();
  preference.WorkspaceId = workspaceId;
  preference.ParticipantId = participantId;
  preference.Key = "presence";
  preference.ValueJson = JSON.stringify({ state });
  preference.UpdatedAt = updatedAt;
  return preference;
}

export function createWebhookRecord(
  workspaceId: string,
  ownerParticipantId: string | undefined,
  direction: string,
  eventFilterJson: string,
  targetConfigJson: string,
  secretHash: string | undefined,
  createdAt: long,
): Webhook {
  const webhook = new Webhook();
  webhook.Id = generateId("wh");
  webhook.WorkspaceId = workspaceId;
  webhook.OwnerParticipantId = ownerParticipantId ?? null;
  webhook.Direction = direction;
  webhook.EventFilterJson = eventFilterJson;
  webhook.TargetConfigJson = targetConfigJson;
  webhook.SecretHash = secretHash ?? null;
  webhook.Enabled = 1;
  webhook.CreatedAt = createdAt;
  webhook.UpdatedAt = createdAt;
  return webhook;
}
