import { asinterface, overloads as O } from "@tsonic/core/lang.js";
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
  ChangeTracker,
  EntityEntry,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.ChangeTracking.js";
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

function configureEntityModel(
  builder: EntityTypeBuilder,
  primaryKey: string[],
  indexes: string[][],
): void {
  configureRelationalNames(builder);
  builder.HasKey(...primaryKey);
  for (let index = 0; index < indexes.length; index++) {
    builder.HasIndex(...indexes[index]);
  }
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
  configureEntityModel(modelBuilder.Entity<Workspace>(), ["Id"], [["Slug"], ["State"]]);
  configureEntityModel(modelBuilder.Entity<WorkspaceDomain>(), ["Domain"], [["WorkspaceId", "State"], ["WorkspaceId", "IsPrimary"]]);
  configureEntityModel(modelBuilder.Entity<Identity>(), ["Id"], [["Kind", "State"], ["PrimaryEmail"]]);
  configureEntityModel(modelBuilder.Entity<HumanProfile>(), ["IdentityId"], []);
  configureEntityModel(modelBuilder.Entity<AgentProfile>(), ["IdentityId"], [["OwnerIdentityId"]]);
  configureEntityModel(modelBuilder.Entity<AuthProvider>(), ["WorkspaceId", "Id"], [["WorkspaceId", "DisplayName"], ["WorkspaceId", "Kind"], ["WorkspaceId", "Enabled"]]);
  configureEntityModel(modelBuilder.Entity<ExternalIdentity>(), ["WorkspaceId", "Id"], [["WorkspaceId", "AuthProviderId", "Subject"], ["IdentityId"], ["WorkspaceId", "AuthProviderId"]]);
  configureEntityModel(modelBuilder.Entity<AuthSession>(), ["WorkspaceId", "Id"], [["WorkspaceId", "SessionHash"], ["WorkspaceId", "ParticipantId", "State"]]);
  configureEntityModel(modelBuilder.Entity<ApiCredential>(), ["WorkspaceId", "Id"], [["WorkspaceId", "CredentialHash"], ["WorkspaceId", "ParticipantId"], ["WorkspaceId", "CreatedByParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<WorkspaceMember>(), ["WorkspaceId", "Id"], [["WorkspaceId", "IdentityId"], ["WorkspaceId", "State"]]);
  configureEntityModel(modelBuilder.Entity<Participant>(), ["WorkspaceId", "Id"], [["WorkspaceId", "WorkspaceMemberId"], ["WorkspaceId", "Kind", "State"]]);
  configureEntityModel(modelBuilder.Entity<ParticipantPreference>(), ["WorkspaceId", "ParticipantId", "Key"], []);
  configureEntityModel(modelBuilder.Entity<Role>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Name"]]);
  configureEntityModel(modelBuilder.Entity<ParticipantRole>(), ["WorkspaceId", "ParticipantId", "RoleId"], [["WorkspaceId", "RoleId"]]);
  configureEntityModel(modelBuilder.Entity<Group>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Name"], ["WorkspaceId", "State"]]);
  configureEntityModel(modelBuilder.Entity<GroupMember>(), ["WorkspaceId", "GroupId", "ParticipantId"], [["WorkspaceId", "ParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<GroupChild>(), ["WorkspaceId", "ParentGroupId", "ChildGroupId"], [["WorkspaceId", "ChildGroupId"]]);
  configureEntityModel(modelBuilder.Entity<PermissionGrant>(), ["WorkspaceId", "Id"], [["WorkspaceId", "SubjectKind", "SubjectId"], ["WorkspaceId", "ResourcePath", "Action"]]);
  configureEntityModel(modelBuilder.Entity<Channel>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Name"], ["WorkspaceId", "State"], ["WorkspaceId", "CreatedByParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<ChannelMember>(), ["WorkspaceId", "ChannelId", "ParticipantId"], [["WorkspaceId", "ParticipantId"], ["WorkspaceId", "ChannelId", "State"]]);
  configureEntityModel(modelBuilder.Entity<Thread>(), ["WorkspaceId", "Id"], [["WorkspaceId", "ChannelId", "Id"], ["WorkspaceId", "ChannelId", "Title"], ["WorkspaceId", "State"], ["WorkspaceId", "CreatedByParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<DirectChat>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Kind", "State"]]);
  configureEntityModel(modelBuilder.Entity<DirectChatMember>(), ["WorkspaceId", "DirectChatId", "ParticipantId"], [["WorkspaceId", "ParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<Message>(), ["WorkspaceId", "Id"], [["WorkspaceId", "ThreadId", "CreatedAt"], ["WorkspaceId", "DirectChatId", "CreatedAt"], ["WorkspaceId", "SenderParticipantId", "CreatedAt"]]);
  configureEntityModel(modelBuilder.Entity<MessageVersion>(), ["WorkspaceId", "Id"], [["WorkspaceId", "MessageId", "CreatedAt"]]);
  configureEntityModel(modelBuilder.Entity<MessageMarker>(), ["WorkspaceId", "MessageId", "ParticipantId", "Marker"], [["WorkspaceId", "ParticipantId", "Marker"]]);
  configureEntityModel(modelBuilder.Entity<Reaction>(), ["WorkspaceId", "Id"], [["WorkspaceId", "MessageId", "ParticipantId", "EmojiKey"], ["WorkspaceId", "ParticipantId", "CreatedAt"]]);
  configureEntityModel(modelBuilder.Entity<Attachment>(), ["WorkspaceId", "Id"], [["WorkspaceId", "StorageKey"], ["WorkspaceId", "OwnerParticipantId", "CreatedAt"]]);
  configureEntityModel(modelBuilder.Entity<Emoji>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Key"], ["WorkspaceId", "CreatedByParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<ProfileField>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Key"]]);
  configureEntityModel(modelBuilder.Entity<ParticipantProfileFieldValue>(), ["WorkspaceId", "ParticipantId", "ProfileFieldId"], []);
  configureEntityModel(modelBuilder.Entity<WorkspaceMemberDefault>(), ["WorkspaceId", "Key"], []);
  configureEntityModel(modelBuilder.Entity<Webhook>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Direction", "Enabled"], ["WorkspaceId", "OwnerParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<DeviceToken>(), ["WorkspaceId", "Id"], [["WorkspaceId", "Provider", "TokenHash"], ["WorkspaceId", "ParticipantId"]]);
  configureEntityModel(modelBuilder.Entity<AuditEvent>(), ["WorkspaceId", "Id"], [["WorkspaceId", "ActorParticipantId", "CreatedAt"], ["WorkspaceId", "ObjectType", "ObjectId"]]);
  configureEntityModel(modelBuilder.Entity<Notification>(), ["WorkspaceId", "Id"], [["WorkspaceId", "ParticipantId", "Id"], ["WorkspaceId", "ParticipantId", "CreatedAt"], ["WorkspaceId", "ObjectType", "ObjectId"]]);
  configureEntityModel(modelBuilder.Entity<NotificationEndpoint>(), ["WorkspaceId", "Id"], [["WorkspaceId", "ParticipantId", "Id"], ["WorkspaceId", "ParticipantId", "Kind"], ["WorkspaceId", "Enabled"]]);
  configureEntityModel(modelBuilder.Entity<NotificationDelivery>(), ["WorkspaceId", "Id"], [["WorkspaceId", "NotificationId"], ["WorkspaceId", "ParticipantId", "NotificationId"], ["WorkspaceId", "EndpointId", "Status"]]);
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
    const changeTracker = this.ChangeTracker as ChangeTracker;
    const entries = Enumerable.ToArray(changeTracker.Entries());
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index] as EntityEntry;
      if (
        entry.State === EntityState.Added ||
        entry.State === EntityState.Modified ||
        entry.State === EntityState.Deleted
      ) {
        requireWorkspaceOwnedEntity(this.CurrentWorkspaceId, entry.Entity as object);
      }
    }
  }

  override SaveChanges(): int;
  override SaveChanges(acceptAllChangesOnSuccess: boolean): int;
  SaveChanges(_acceptAllChangesOnSuccess?: any): any {
    throw new Error("SaveChanges overload stub must be erased");
  }

  SaveChangesDefault(): int {
    this.ValidateWorkspaceWrites();
    return super.SaveChanges();
  }

  SaveChangesWithAcceptAll(acceptAllChangesOnSuccess: boolean): int {
    this.ValidateWorkspaceWrites();
    return super.SaveChanges(acceptAllChangesOnSuccess === true);
  }

  override SaveChangesAsync(): Task<Int32>;
  override SaveChangesAsync(cancellationToken: CancellationToken): Task<Int32>;
  override SaveChangesAsync(acceptAllChangesOnSuccess: boolean): Task<Int32>;
  override SaveChangesAsync(
    acceptAllChangesOnSuccess: boolean,
    cancellationToken: CancellationToken,
  ): Task<Int32>;
  SaveChangesAsync(_p0?: any, _p1?: any): any {
    throw new Error("SaveChangesAsync overload stub must be erased");
  }

  SaveChangesAsyncDefault(): Task<Int32> {
    this.ValidateWorkspaceWrites();
    return super.SaveChangesAsync();
  }

  SaveChangesAsyncWithCancellation(
    cancellationToken: CancellationToken,
  ): Task<Int32> {
    this.ValidateWorkspaceWrites();
    return super.SaveChangesAsync(cancellationToken);
  }

  SaveChangesAsyncWithAcceptAll(
    acceptAllChangesOnSuccess: boolean,
  ): Task<Int32> {
    this.ValidateWorkspaceWrites();
    return super.SaveChangesAsync(acceptAllChangesOnSuccess === true);
  }

  SaveChangesAsyncWithAcceptAllAndCancellation(
    acceptAllChangesOnSuccess: boolean,
    cancellationToken: CancellationToken,
  ): Task<Int32> {
    this.ValidateWorkspaceWrites();
    return super.SaveChangesAsync(
      acceptAllChangesOnSuccess === true,
      cancellationToken,
    );
  }
}

O<JotsterWorkspaceDbContext>()
  .method((context) => context.SaveChangesDefault)
  .family((context) => context.SaveChanges);
O<JotsterWorkspaceDbContext>()
  .method((context) => context.SaveChangesWithAcceptAll)
  .family((context) => context.SaveChanges);
O<JotsterWorkspaceDbContext>()
  .method((context) => context.SaveChangesAsyncDefault)
  .family((context) => context.SaveChangesAsync);
O<JotsterWorkspaceDbContext>()
  .method((context) => context.SaveChangesAsyncWithCancellation)
  .family((context) => context.SaveChangesAsync);
O<JotsterWorkspaceDbContext>()
  .method((context) => context.SaveChangesAsyncWithAcceptAll)
  .family((context) => context.SaveChangesAsync);
O<JotsterWorkspaceDbContext>()
  .method((context) => context.SaveChangesAsyncWithAcceptAllAndCancellation)
  .family((context) => context.SaveChangesAsync);

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
