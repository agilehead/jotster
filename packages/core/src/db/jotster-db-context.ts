import { asinterface } from "@tsonic/core/lang.js";
import type { int } from "@tsonic/core/types.js";
import { Enumerable } from "@tsonic/dotnet/System.Linq.js";
import type { Int32 } from "@tsonic/dotnet/System.js";
import type { ExtensionMethods as Linq } from "@tsonic/dotnet/System.Linq.js";
import type { ExtensionMethods as Ef } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  DbContext,
  DbContextOptions,
  EntityState,
  ModelBuilder,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { CancellationToken } from "@tsonic/dotnet/System.Threading.js";
import type { Task } from "@tsonic/dotnet/System.Threading.Tasks.js";
import type { DbSet } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type {
  EntityTypeBuilder,
  PropertyBuilder,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.Metadata.Builders.js";
import type {
  AdminContext,
  BootstrapContext,
  RequestContext,
} from "../types/request-context.ts";
import { requireWorkspaceMatch, requireWorkspaceOwnedEntity } from "./workspace-owned.ts";
import type { WorkspaceOwnedEntity } from "./workspace-owned.ts";

import type { Workspace } from "./entities/workspace.ts";
import type { WorkspaceDomain } from "./entities/workspace-domain.ts";
import type { Identity } from "./entities/identity.ts";
import type { HumanProfile } from "./entities/human-profile.ts";
import type { AgentProfile } from "./entities/agent-profile.ts";
import type { AuthProvider } from "./entities/auth-provider.ts";
import type { ExternalIdentity } from "./entities/external-identity.ts";
import type { AuthSession } from "./entities/auth-session.ts";
import type { ApiCredential } from "./entities/api-credential.ts";
import type { WorkspaceMember } from "./entities/workspace-member.ts";
import type { Participant } from "./entities/participant.ts";
import type { ParticipantPreference } from "./entities/participant-preference.ts";
import type { Role } from "./entities/role.ts";
import type { ParticipantRole } from "./entities/participant-role.ts";
import type { Group } from "./entities/group.ts";
import type { GroupMember } from "./entities/group-member.ts";
import type { GroupChild } from "./entities/group-child.ts";
import type { PermissionGrant } from "./entities/permission-grant.ts";
import type { Channel } from "./entities/channel.ts";
import type { ChannelMember } from "./entities/channel-member.ts";
import type { Thread } from "./entities/thread.ts";
import type { DirectChat } from "./entities/direct-chat.ts";
import type { DirectChatMember } from "./entities/direct-chat-member.ts";
import type { Message } from "./entities/message.ts";
import type { MessageVersion } from "./entities/message-version.ts";
import type { MessageMarker } from "./entities/message-marker.ts";
import type { Reaction } from "./entities/reaction.ts";
import type { Attachment } from "./entities/attachment.ts";
import type { Emoji } from "./entities/emoji.ts";
import type { ProfileField } from "./entities/profile-field.ts";
import type { ParticipantProfileFieldValue } from "./entities/participant-profile-field-value.ts";
import type { WorkspaceMemberDefault } from "./entities/workspace-member-default.ts";
import type { Webhook } from "./entities/webhook.ts";
import type { DeviceToken } from "./entities/device-token.ts";
import type { AuditEvent } from "./entities/audit-event.ts";
import type { Notification } from "./entities/notification.ts";
import type { NotificationEndpoint } from "./entities/notification-endpoint.ts";
import type { NotificationDelivery } from "./entities/notification-delivery.ts";

type DbSetQuery<T> = Ef<Linq<DbSet<T>>>;
type RelationalEntityTypeBuilder = Ef<EntityTypeBuilder>;
type RelationalPropertyBuilder = Ef<PropertyBuilder>;

function toSnakeCase(name: string): string {
  let result = "";

  for (let index = 0; index < name.length; index++) {
    const current = name[index];
    const previous = index > 0 ? name[index - 1] : undefined;
    const next = index + 1 < name.length ? name[index + 1] : undefined;
    const isUpper = current >= "A" && current <= "Z";
    const previousIsLowerOrDigit =
      previous !== undefined &&
      ((previous >= "a" && previous <= "z") ||
        (previous >= "0" && previous <= "9"));
    const nextIsLower = next !== undefined && next >= "a" && next <= "z";

    if (isUpper && (previousIsLowerOrDigit || nextIsLower) && index > 0) {
      result += "_";
    }

    result += current.toLowerCase();
  }

  return result;
}

function configureRelationalNames(builder: EntityTypeBuilder): void {
  const relationalBuilder = asinterface<RelationalEntityTypeBuilder>(builder);
  const tableName = toSnakeCase(relationalBuilder.Metadata.ClrType.Name ?? "");
  relationalBuilder.ToTable(tableName);

  for (const property of relationalBuilder.Metadata.ClrType.GetProperties()) {
    const propertyBuilder = asinterface<RelationalPropertyBuilder>(
      relationalBuilder.Property(property.PropertyType, property.Name),
    );
    propertyBuilder.HasColumnName(toSnakeCase(property.Name));
  }
}

function configureEntityModel<TEntity extends object>(
  builder: EntityTypeBuilder<TEntity>,
  configure: (builder: EntityTypeBuilder<TEntity>) => void,
): void {
  configureRelationalNames(builder);
  configure(builder);
}

function configureWorkspaceFilters(
  modelBuilder: ModelBuilder,
  workspaceId: string,
): void {
  modelBuilder.Entity<AuthProvider>().HasQueryFilter((entity: AuthProvider): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ExternalIdentity>().HasQueryFilter((entity: ExternalIdentity): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<AuthSession>().HasQueryFilter((entity: AuthSession): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ApiCredential>().HasQueryFilter((entity: ApiCredential): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<WorkspaceMember>().HasQueryFilter((entity: WorkspaceMember): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Participant>().HasQueryFilter((entity: Participant): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ParticipantPreference>().HasQueryFilter((entity: ParticipantPreference): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Role>().HasQueryFilter((entity: Role): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ParticipantRole>().HasQueryFilter((entity: ParticipantRole): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Group>().HasQueryFilter((entity: Group): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<GroupMember>().HasQueryFilter((entity: GroupMember): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<GroupChild>().HasQueryFilter((entity: GroupChild): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<PermissionGrant>().HasQueryFilter((entity: PermissionGrant): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Channel>().HasQueryFilter((entity: Channel): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ChannelMember>().HasQueryFilter((entity: ChannelMember): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Thread>().HasQueryFilter((entity: Thread): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<DirectChat>().HasQueryFilter((entity: DirectChat): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<DirectChatMember>().HasQueryFilter((entity: DirectChatMember): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Message>().HasQueryFilter((entity: Message): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<MessageVersion>().HasQueryFilter((entity: MessageVersion): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<MessageMarker>().HasQueryFilter((entity: MessageMarker): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Reaction>().HasQueryFilter((entity: Reaction): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Attachment>().HasQueryFilter((entity: Attachment): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Emoji>().HasQueryFilter((entity: Emoji): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ProfileField>().HasQueryFilter((entity: ProfileField): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<ParticipantProfileFieldValue>().HasQueryFilter((entity: ParticipantProfileFieldValue): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<WorkspaceMemberDefault>().HasQueryFilter((entity: WorkspaceMemberDefault): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Webhook>().HasQueryFilter((entity: Webhook): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<DeviceToken>().HasQueryFilter((entity: DeviceToken): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<AuditEvent>().HasQueryFilter((entity: AuditEvent): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<Notification>().HasQueryFilter((entity: Notification): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<NotificationEndpoint>().HasQueryFilter((entity: NotificationEndpoint): boolean => entity.WorkspaceId === workspaceId);
  modelBuilder.Entity<NotificationDelivery>().HasQueryFilter((entity: NotificationDelivery): boolean => entity.WorkspaceId === workspaceId);
}

function configureJotsterBaseModel(modelBuilder: ModelBuilder): void {
  configureEntityModel(modelBuilder.Entity<Workspace>(), (builder) => {
    builder.HasKey((row: Workspace) => row.Id);
    builder.HasIndex((row: Workspace) => row.Slug);
    builder.HasIndex((row: Workspace) => row.State);
  });
  configureEntityModel(modelBuilder.Entity<WorkspaceDomain>(), (builder) => {
    builder.HasKey((row: WorkspaceDomain) => row.Domain);
    builder.HasIndex((row: WorkspaceDomain) => ({ WorkspaceId: row.WorkspaceId, State: row.State }));
    builder.HasIndex((row: WorkspaceDomain) => ({ WorkspaceId: row.WorkspaceId, IsPrimary: row.IsPrimary }));
  });
  configureEntityModel(modelBuilder.Entity<Identity>(), (builder) => {
    builder.HasKey((row: Identity) => row.Id);
    builder.HasIndex((row: Identity) => ({ Kind: row.Kind, State: row.State }));
    builder.HasIndex((row: Identity) => row.PrimaryEmail);
  });
  configureEntityModel(modelBuilder.Entity<HumanProfile>(), (builder) => {
    builder.HasKey((row: HumanProfile) => row.IdentityId);
  });
  configureEntityModel(modelBuilder.Entity<AgentProfile>(), (builder) => {
    builder.HasKey((row: AgentProfile) => row.IdentityId);
    builder.HasIndex((row: AgentProfile) => row.OwnerIdentityId);
  });
  configureEntityModel(modelBuilder.Entity<AuthProvider>(), (builder) => {
    builder.HasKey((row: AuthProvider) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: AuthProvider) => ({ WorkspaceId: row.WorkspaceId, DisplayName: row.DisplayName }));
    builder.HasIndex((row: AuthProvider) => ({ WorkspaceId: row.WorkspaceId, Kind: row.Kind }));
    builder.HasIndex((row: AuthProvider) => ({ WorkspaceId: row.WorkspaceId, Enabled: row.Enabled }));
  });
  configureEntityModel(modelBuilder.Entity<ExternalIdentity>(), (builder) => {
    builder.HasKey((row: ExternalIdentity) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: ExternalIdentity) => ({ WorkspaceId: row.WorkspaceId, AuthProviderId: row.AuthProviderId, Subject: row.Subject }));
    builder.HasIndex((row: ExternalIdentity) => row.IdentityId);
    builder.HasIndex((row: ExternalIdentity) => ({ WorkspaceId: row.WorkspaceId, AuthProviderId: row.AuthProviderId }));
  });
  configureEntityModel(modelBuilder.Entity<AuthSession>(), (builder) => {
    builder.HasKey((row: AuthSession) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: AuthSession) => ({ WorkspaceId: row.WorkspaceId, SessionHash: row.SessionHash }));
    builder.HasIndex((row: AuthSession) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, State: row.State }));
  });
  configureEntityModel(modelBuilder.Entity<ApiCredential>(), (builder) => {
    builder.HasKey((row: ApiCredential) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: ApiCredential) => ({ WorkspaceId: row.WorkspaceId, CredentialHash: row.CredentialHash }));
    builder.HasIndex((row: ApiCredential) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId }));
    builder.HasIndex((row: ApiCredential) => ({ WorkspaceId: row.WorkspaceId, CreatedByParticipantId: row.CreatedByParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<WorkspaceMember>(), (builder) => {
    builder.HasKey((row: WorkspaceMember) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: WorkspaceMember) => ({ WorkspaceId: row.WorkspaceId, IdentityId: row.IdentityId }));
    builder.HasIndex((row: WorkspaceMember) => ({ WorkspaceId: row.WorkspaceId, State: row.State }));
  });
  configureEntityModel(modelBuilder.Entity<Participant>(), (builder) => {
    builder.HasKey((row: Participant) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Participant) => ({ WorkspaceId: row.WorkspaceId, WorkspaceMemberId: row.WorkspaceMemberId }));
    builder.HasIndex((row: Participant) => ({ WorkspaceId: row.WorkspaceId, Kind: row.Kind, State: row.State }));
  });
  configureEntityModel(modelBuilder.Entity<ParticipantPreference>(), (builder) => {
    builder.HasKey((row: ParticipantPreference) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, Key: row.Key }));
  });
  configureEntityModel(modelBuilder.Entity<Role>(), (builder) => {
    builder.HasKey((row: Role) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Role) => ({ WorkspaceId: row.WorkspaceId, Name: row.Name }));
  });
  configureEntityModel(modelBuilder.Entity<ParticipantRole>(), (builder) => {
    builder.HasKey((row: ParticipantRole) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, RoleId: row.RoleId }));
    builder.HasIndex((row: ParticipantRole) => ({ WorkspaceId: row.WorkspaceId, RoleId: row.RoleId }));
  });
  configureEntityModel(modelBuilder.Entity<Group>(), (builder) => {
    builder.HasKey((row: Group) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Group) => ({ WorkspaceId: row.WorkspaceId, Name: row.Name }));
    builder.HasIndex((row: Group) => ({ WorkspaceId: row.WorkspaceId, State: row.State }));
  });
  configureEntityModel(modelBuilder.Entity<GroupMember>(), (builder) => {
    builder.HasKey((row: GroupMember) => ({ WorkspaceId: row.WorkspaceId, GroupId: row.GroupId, ParticipantId: row.ParticipantId }));
    builder.HasIndex((row: GroupMember) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<GroupChild>(), (builder) => {
    builder.HasKey((row: GroupChild) => ({ WorkspaceId: row.WorkspaceId, ParentGroupId: row.ParentGroupId, ChildGroupId: row.ChildGroupId }));
    builder.HasIndex((row: GroupChild) => ({ WorkspaceId: row.WorkspaceId, ChildGroupId: row.ChildGroupId }));
  });
  configureEntityModel(modelBuilder.Entity<PermissionGrant>(), (builder) => {
    builder.HasKey((row: PermissionGrant) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: PermissionGrant) => ({ WorkspaceId: row.WorkspaceId, SubjectKind: row.SubjectKind, SubjectId: row.SubjectId }));
    builder.HasIndex((row: PermissionGrant) => ({ WorkspaceId: row.WorkspaceId, ResourcePath: row.ResourcePath, Action: row.Action }));
  });
  configureEntityModel(modelBuilder.Entity<Channel>(), (builder) => {
    builder.HasKey((row: Channel) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Channel) => ({ WorkspaceId: row.WorkspaceId, Name: row.Name }));
    builder.HasIndex((row: Channel) => ({ WorkspaceId: row.WorkspaceId, State: row.State }));
    builder.HasIndex((row: Channel) => ({ WorkspaceId: row.WorkspaceId, CreatedByParticipantId: row.CreatedByParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<ChannelMember>(), (builder) => {
    builder.HasKey((row: ChannelMember) => ({ WorkspaceId: row.WorkspaceId, ChannelId: row.ChannelId, ParticipantId: row.ParticipantId }));
    builder.HasIndex((row: ChannelMember) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId }));
    builder.HasIndex((row: ChannelMember) => ({ WorkspaceId: row.WorkspaceId, ChannelId: row.ChannelId, State: row.State }));
  });
  configureEntityModel(modelBuilder.Entity<Thread>(), (builder) => {
    builder.HasKey((row: Thread) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Thread) => ({ WorkspaceId: row.WorkspaceId, ChannelId: row.ChannelId, Id: row.Id }));
    builder.HasIndex((row: Thread) => ({ WorkspaceId: row.WorkspaceId, ChannelId: row.ChannelId, Title: row.Title }));
    builder.HasIndex((row: Thread) => ({ WorkspaceId: row.WorkspaceId, State: row.State }));
    builder.HasIndex((row: Thread) => ({ WorkspaceId: row.WorkspaceId, CreatedByParticipantId: row.CreatedByParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<DirectChat>(), (builder) => {
    builder.HasKey((row: DirectChat) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: DirectChat) => ({ WorkspaceId: row.WorkspaceId, Kind: row.Kind, State: row.State }));
  });
  configureEntityModel(modelBuilder.Entity<DirectChatMember>(), (builder) => {
    builder.HasKey((row: DirectChatMember) => ({ WorkspaceId: row.WorkspaceId, DirectChatId: row.DirectChatId, ParticipantId: row.ParticipantId }));
    builder.HasIndex((row: DirectChatMember) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<Message>(), (builder) => {
    builder.HasKey((row: Message) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Message) => ({ WorkspaceId: row.WorkspaceId, ThreadId: row.ThreadId, CreatedAt: row.CreatedAt }));
    builder.HasIndex((row: Message) => ({ WorkspaceId: row.WorkspaceId, DirectChatId: row.DirectChatId, CreatedAt: row.CreatedAt }));
    builder.HasIndex((row: Message) => ({ WorkspaceId: row.WorkspaceId, SenderParticipantId: row.SenderParticipantId, CreatedAt: row.CreatedAt }));
  });
  configureEntityModel(modelBuilder.Entity<MessageVersion>(), (builder) => {
    builder.HasKey((row: MessageVersion) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: MessageVersion) => ({ WorkspaceId: row.WorkspaceId, MessageId: row.MessageId, CreatedAt: row.CreatedAt }));
  });
  configureEntityModel(modelBuilder.Entity<MessageMarker>(), (builder) => {
    builder.HasKey((row: MessageMarker) => ({ WorkspaceId: row.WorkspaceId, MessageId: row.MessageId, ParticipantId: row.ParticipantId, Marker: row.Marker }));
    builder.HasIndex((row: MessageMarker) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, Marker: row.Marker }));
  });
  configureEntityModel(modelBuilder.Entity<Reaction>(), (builder) => {
    builder.HasKey((row: Reaction) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Reaction) => ({ WorkspaceId: row.WorkspaceId, MessageId: row.MessageId, ParticipantId: row.ParticipantId, EmojiKey: row.EmojiKey }));
    builder.HasIndex((row: Reaction) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, CreatedAt: row.CreatedAt }));
  });
  configureEntityModel(modelBuilder.Entity<Attachment>(), (builder) => {
    builder.HasKey((row: Attachment) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Attachment) => ({ WorkspaceId: row.WorkspaceId, StorageKey: row.StorageKey }));
    builder.HasIndex((row: Attachment) => ({ WorkspaceId: row.WorkspaceId, OwnerParticipantId: row.OwnerParticipantId, CreatedAt: row.CreatedAt }));
  });
  configureEntityModel(modelBuilder.Entity<Emoji>(), (builder) => {
    builder.HasKey((row: Emoji) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Emoji) => ({ WorkspaceId: row.WorkspaceId, Key: row.Key }));
    builder.HasIndex((row: Emoji) => ({ WorkspaceId: row.WorkspaceId, CreatedByParticipantId: row.CreatedByParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<ProfileField>(), (builder) => {
    builder.HasKey((row: ProfileField) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: ProfileField) => ({ WorkspaceId: row.WorkspaceId, Key: row.Key }));
  });
  configureEntityModel(modelBuilder.Entity<ParticipantProfileFieldValue>(), (builder) => {
    builder.HasKey((row: ParticipantProfileFieldValue) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, ProfileFieldId: row.ProfileFieldId }));
  });
  configureEntityModel(modelBuilder.Entity<WorkspaceMemberDefault>(), (builder) => {
    builder.HasKey((row: WorkspaceMemberDefault) => ({ WorkspaceId: row.WorkspaceId, Key: row.Key }));
  });
  configureEntityModel(modelBuilder.Entity<Webhook>(), (builder) => {
    builder.HasKey((row: Webhook) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Webhook) => ({ WorkspaceId: row.WorkspaceId, Direction: row.Direction, Enabled: row.Enabled }));
    builder.HasIndex((row: Webhook) => ({ WorkspaceId: row.WorkspaceId, OwnerParticipantId: row.OwnerParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<DeviceToken>(), (builder) => {
    builder.HasKey((row: DeviceToken) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: DeviceToken) => ({ WorkspaceId: row.WorkspaceId, Provider: row.Provider, TokenHash: row.TokenHash }));
    builder.HasIndex((row: DeviceToken) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId }));
  });
  configureEntityModel(modelBuilder.Entity<AuditEvent>(), (builder) => {
    builder.HasKey((row: AuditEvent) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: AuditEvent) => ({ WorkspaceId: row.WorkspaceId, ActorParticipantId: row.ActorParticipantId, CreatedAt: row.CreatedAt }));
    builder.HasIndex((row: AuditEvent) => ({ WorkspaceId: row.WorkspaceId, ObjectType: row.ObjectType, ObjectId: row.ObjectId }));
  });
  configureEntityModel(modelBuilder.Entity<Notification>(), (builder) => {
    builder.HasKey((row: Notification) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: Notification) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, Id: row.Id }));
    builder.HasIndex((row: Notification) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, CreatedAt: row.CreatedAt }));
    builder.HasIndex((row: Notification) => ({ WorkspaceId: row.WorkspaceId, ObjectType: row.ObjectType, ObjectId: row.ObjectId }));
  });
  configureEntityModel(modelBuilder.Entity<NotificationEndpoint>(), (builder) => {
    builder.HasKey((row: NotificationEndpoint) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: NotificationEndpoint) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, Id: row.Id }));
    builder.HasIndex((row: NotificationEndpoint) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, Kind: row.Kind }));
    builder.HasIndex((row: NotificationEndpoint) => ({ WorkspaceId: row.WorkspaceId, Enabled: row.Enabled }));
  });
  configureEntityModel(modelBuilder.Entity<NotificationDelivery>(), (builder) => {
    builder.HasKey((row: NotificationDelivery) => ({ WorkspaceId: row.WorkspaceId, Id: row.Id }));
    builder.HasIndex((row: NotificationDelivery) => ({ WorkspaceId: row.WorkspaceId, NotificationId: row.NotificationId }));
    builder.HasIndex((row: NotificationDelivery) => ({ WorkspaceId: row.WorkspaceId, ParticipantId: row.ParticipantId, NotificationId: row.NotificationId }));
    builder.HasIndex((row: NotificationDelivery) => ({ WorkspaceId: row.WorkspaceId, EndpointId: row.EndpointId, Status: row.Status }));
  });
}

export class JotsterWorkspaceDbContext extends DbContext {
  CurrentWorkspaceId!: string;

  constructor(options: DbContextOptions, workspaceId: string) {
    super(options);
    this.CurrentWorkspaceId = workspaceId;
  }

  get Workspaces(): DbSetQuery<Workspace> {
    return asinterface<DbSetQuery<Workspace>>(this.Set<Workspace>());
  }

  get WorkspaceDomains(): DbSetQuery<WorkspaceDomain> {
    return asinterface<DbSetQuery<WorkspaceDomain>>(this.Set<WorkspaceDomain>());
  }

  get Identities(): DbSetQuery<Identity> {
    return asinterface<DbSetQuery<Identity>>(this.Set<Identity>());
  }

  get HumanProfiles(): DbSetQuery<HumanProfile> {
    return asinterface<DbSetQuery<HumanProfile>>(this.Set<HumanProfile>());
  }

  get AgentProfiles(): DbSetQuery<AgentProfile> {
    return asinterface<DbSetQuery<AgentProfile>>(this.Set<AgentProfile>());
  }

  get AuthProviders(): DbSetQuery<AuthProvider> {
    return asinterface<DbSetQuery<AuthProvider>>(this.Set<AuthProvider>());
  }

  get ExternalIdentities(): DbSetQuery<ExternalIdentity> {
    return asinterface<DbSetQuery<ExternalIdentity>>(this.Set<ExternalIdentity>());
  }

  get AuthSessions(): DbSetQuery<AuthSession> {
    return asinterface<DbSetQuery<AuthSession>>(this.Set<AuthSession>());
  }

  get ApiCredentials(): DbSetQuery<ApiCredential> {
    return asinterface<DbSetQuery<ApiCredential>>(this.Set<ApiCredential>());
  }

  get WorkspaceMembers(): DbSetQuery<WorkspaceMember> {
    return asinterface<DbSetQuery<WorkspaceMember>>(this.Set<WorkspaceMember>());
  }

  get Participants(): DbSetQuery<Participant> {
    return asinterface<DbSetQuery<Participant>>(this.Set<Participant>());
  }

  get ParticipantPreferences(): DbSetQuery<ParticipantPreference> {
    return asinterface<DbSetQuery<ParticipantPreference>>(this.Set<ParticipantPreference>());
  }

  get Roles(): DbSetQuery<Role> {
    return asinterface<DbSetQuery<Role>>(this.Set<Role>());
  }

  get ParticipantRoles(): DbSetQuery<ParticipantRole> {
    return asinterface<DbSetQuery<ParticipantRole>>(this.Set<ParticipantRole>());
  }

  get Groups(): DbSetQuery<Group> {
    return asinterface<DbSetQuery<Group>>(this.Set<Group>());
  }

  get GroupMembers(): DbSetQuery<GroupMember> {
    return asinterface<DbSetQuery<GroupMember>>(this.Set<GroupMember>());
  }

  get GroupChildren(): DbSetQuery<GroupChild> {
    return asinterface<DbSetQuery<GroupChild>>(this.Set<GroupChild>());
  }

  get PermissionGrants(): DbSetQuery<PermissionGrant> {
    return asinterface<DbSetQuery<PermissionGrant>>(this.Set<PermissionGrant>());
  }

  get Channels(): DbSetQuery<Channel> {
    return asinterface<DbSetQuery<Channel>>(this.Set<Channel>());
  }

  get ChannelMembers(): DbSetQuery<ChannelMember> {
    return asinterface<DbSetQuery<ChannelMember>>(this.Set<ChannelMember>());
  }

  get Threads(): DbSetQuery<Thread> {
    return asinterface<DbSetQuery<Thread>>(this.Set<Thread>());
  }

  get DirectChats(): DbSetQuery<DirectChat> {
    return asinterface<DbSetQuery<DirectChat>>(this.Set<DirectChat>());
  }

  get DirectChatMembers(): DbSetQuery<DirectChatMember> {
    return asinterface<DbSetQuery<DirectChatMember>>(this.Set<DirectChatMember>());
  }

  get Messages(): DbSetQuery<Message> {
    return asinterface<DbSetQuery<Message>>(this.Set<Message>());
  }

  get MessageVersions(): DbSetQuery<MessageVersion> {
    return asinterface<DbSetQuery<MessageVersion>>(this.Set<MessageVersion>());
  }

  get MessageMarkers(): DbSetQuery<MessageMarker> {
    return asinterface<DbSetQuery<MessageMarker>>(this.Set<MessageMarker>());
  }

  get Reactions(): DbSetQuery<Reaction> {
    return asinterface<DbSetQuery<Reaction>>(this.Set<Reaction>());
  }

  get Attachments(): DbSetQuery<Attachment> {
    return asinterface<DbSetQuery<Attachment>>(this.Set<Attachment>());
  }

  get Emojis(): DbSetQuery<Emoji> {
    return asinterface<DbSetQuery<Emoji>>(this.Set<Emoji>());
  }

  get ProfileFields(): DbSetQuery<ProfileField> {
    return asinterface<DbSetQuery<ProfileField>>(this.Set<ProfileField>());
  }

  get ParticipantProfileFieldValues(): DbSetQuery<ParticipantProfileFieldValue> {
    return asinterface<DbSetQuery<ParticipantProfileFieldValue>>(this.Set<ParticipantProfileFieldValue>());
  }

  get WorkspaceMemberDefaults(): DbSetQuery<WorkspaceMemberDefault> {
    return asinterface<DbSetQuery<WorkspaceMemberDefault>>(this.Set<WorkspaceMemberDefault>());
  }

  get Webhooks(): DbSetQuery<Webhook> {
    return asinterface<DbSetQuery<Webhook>>(this.Set<Webhook>());
  }

  get DeviceTokens(): DbSetQuery<DeviceToken> {
    return asinterface<DbSetQuery<DeviceToken>>(this.Set<DeviceToken>());
  }

  get AuditEvents(): DbSetQuery<AuditEvent> {
    return asinterface<DbSetQuery<AuditEvent>>(this.Set<AuditEvent>());
  }

  get Notifications(): DbSetQuery<Notification> {
    return asinterface<DbSetQuery<Notification>>(this.Set<Notification>());
  }

  get NotificationEndpoints(): DbSetQuery<NotificationEndpoint> {
    return asinterface<DbSetQuery<NotificationEndpoint>>(this.Set<NotificationEndpoint>());
  }

  get NotificationDeliveries(): DbSetQuery<NotificationDelivery> {
    return asinterface<DbSetQuery<NotificationDelivery>>(this.Set<NotificationDelivery>());
  }

  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);
    configureJotsterBaseModel(modelBuilder);
    configureWorkspaceFilters(modelBuilder, this.CurrentWorkspaceId);
  }

  RequireWorkspace(workspaceId: string): void {
    requireWorkspaceMatch(this.CurrentWorkspaceId, workspaceId);
  }

  ValidateWorkspaceOwnedEntity(entity: WorkspaceOwnedEntity): void {
    requireWorkspaceMatch(this.CurrentWorkspaceId, entity.WorkspaceId);
  }

  ValidateWorkspaceWrites(): void {
    const changeTracker = this.ChangeTracker;
    const entries = Enumerable.ToArray(changeTracker.Entries());
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      if (
        entry.State === EntityState.Added ||
        entry.State === EntityState.Modified ||
        entry.State === EntityState.Deleted
      ) {
        requireWorkspaceOwnedEntity(this.CurrentWorkspaceId, entry.Entity);
      }
    }
  }

  override SaveChanges(): int;
  override SaveChanges(acceptAllChangesOnSuccess: boolean): int;
  override SaveChanges(acceptAllChangesOnSuccess?: boolean): int {
    this.ValidateWorkspaceWrites();
    if (acceptAllChangesOnSuccess === undefined) {
      return super.SaveChanges();
    }
    return super.SaveChanges(acceptAllChangesOnSuccess);
  }

  override SaveChangesAsync(): Task<Int32>;
  override SaveChangesAsync(cancellationToken: CancellationToken): Task<Int32>;
  override SaveChangesAsync(acceptAllChangesOnSuccess: boolean): Task<Int32>;
  override SaveChangesAsync(
    acceptAllChangesOnSuccess: boolean,
    cancellationToken: CancellationToken,
  ): Task<Int32>;
  override SaveChangesAsync(
    first?: boolean | CancellationToken,
    second?: CancellationToken,
  ): Task<Int32> {
    this.ValidateWorkspaceWrites();
    if (typeof first === "boolean") {
      if (second === undefined) {
        return super.SaveChangesAsync(first);
      }
      return super.SaveChangesAsync(first, second);
    }
    if (first === undefined) {
      return super.SaveChangesAsync();
    }
    return super.SaveChangesAsync(first);
  }
}

export class JotsterAdminDbContext extends DbContext {
  Admin!: AdminContext;

  constructor(options: DbContextOptions, adminContext: AdminContext) {
    super(options);
    this.Admin = adminContext;
  }

  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);
    configureJotsterBaseModel(modelBuilder);
  }
}

export class JotsterBootstrapDbContext extends DbContext {
  Bootstrap?: BootstrapContext;

  constructor(options: DbContextOptions, bootstrapContext?: BootstrapContext) {
    super(options);
    this.Bootstrap = bootstrapContext;
  }

  get Workspaces(): DbSetQuery<Workspace> {
    return asinterface<DbSetQuery<Workspace>>(this.Set<Workspace>());
  }

  get WorkspaceDomains(): DbSetQuery<WorkspaceDomain> {
    return asinterface<DbSetQuery<WorkspaceDomain>>(this.Set<WorkspaceDomain>());
  }

  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);
    configureJotsterBaseModel(modelBuilder);
  }
}

export function createWorkspaceDbContext(
  options: DbContextOptions,
  context: RequestContext,
): JotsterWorkspaceDbContext {
  return new JotsterWorkspaceDbContext(options, context.WorkspaceId);
}

export function createAdminDbContext(
  options: DbContextOptions,
  adminContext: AdminContext,
): JotsterAdminDbContext {
  if (adminContext.Reason.trim().length === 0) {
    throw new Error("Admin context requires an audit reason");
  }
  return new JotsterAdminDbContext(options, adminContext);
}

export function createBootstrapDbContext(
  options: DbContextOptions,
  bootstrapContext?: BootstrapContext,
): JotsterBootstrapDbContext {
  return new JotsterBootstrapDbContext(options, bootstrapContext);
}
