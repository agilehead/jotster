import { asinterface } from "@tsonic/core/lang.js";
import { Enumerable } from "@tsonic/dotnet/System.Linq.js";
import type { ExtensionMethods as Linq } from "@tsonic/dotnet/System.Linq.js";
import type { ExtensionMethods as Ef } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import {
  DbContext,
  DbContextOptions,
  EntityState,
  ModelBuilder,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { CancellationToken } from "@tsonic/dotnet/System.Threading.js";
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

type DbSetQuery<T extends object> = Ef<Linq<DbSet<T>>>;
type RelationalEntityTypeBuilder = Ef<EntityTypeBuilder>;
type RelationalPropertyBuilder = Ef<PropertyBuilder>;

interface QueryFilteredEntityTypeBuilder<T> {
  HasQueryFilter(predicate: (entity: T) => boolean): EntityTypeBuilder;
}

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

function configureWorkspaceFilter<T extends object & WorkspaceOwnedEntity>(
  modelBuilder: ModelBuilder,
  workspaceId: string,
): void {
  const builder = asinterface<QueryFilteredEntityTypeBuilder<T>>(
    modelBuilder.Entity<T>(),
  );
  builder.HasQueryFilter((entity) => entity.WorkspaceId === workspaceId);
}

function configureWorkspaceFilters(
  modelBuilder: ModelBuilder,
  workspaceId: string,
): void {
  configureWorkspaceFilter<AuthProvider>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ExternalIdentity>(modelBuilder, workspaceId);
  configureWorkspaceFilter<AuthSession>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ApiCredential>(modelBuilder, workspaceId);
  configureWorkspaceFilter<WorkspaceMember>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Participant>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ParticipantPreference>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Role>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ParticipantRole>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Group>(modelBuilder, workspaceId);
  configureWorkspaceFilter<GroupMember>(modelBuilder, workspaceId);
  configureWorkspaceFilter<GroupChild>(modelBuilder, workspaceId);
  configureWorkspaceFilter<PermissionGrant>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Channel>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ChannelMember>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Thread>(modelBuilder, workspaceId);
  configureWorkspaceFilter<DirectChat>(modelBuilder, workspaceId);
  configureWorkspaceFilter<DirectChatMember>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Message>(modelBuilder, workspaceId);
  configureWorkspaceFilter<MessageVersion>(modelBuilder, workspaceId);
  configureWorkspaceFilter<MessageMarker>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Reaction>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Attachment>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Emoji>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ProfileField>(modelBuilder, workspaceId);
  configureWorkspaceFilter<ParticipantProfileFieldValue>(modelBuilder, workspaceId);
  configureWorkspaceFilter<WorkspaceMemberDefault>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Webhook>(modelBuilder, workspaceId);
  configureWorkspaceFilter<DeviceToken>(modelBuilder, workspaceId);
  configureWorkspaceFilter<AuditEvent>(modelBuilder, workspaceId);
  configureWorkspaceFilter<Notification>(modelBuilder, workspaceId);
  configureWorkspaceFilter<NotificationEndpoint>(modelBuilder, workspaceId);
  configureWorkspaceFilter<NotificationDelivery>(modelBuilder, workspaceId);
}

export abstract class JotsterDbContext extends DbContext {
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

  protected constructor(options: DbContextOptions) {
    super(options);
  }

  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);

    configureRelationalNames(modelBuilder.Entity<Workspace>());
    configureRelationalNames(modelBuilder.Entity<WorkspaceDomain>());
    configureRelationalNames(modelBuilder.Entity<Identity>());
    configureRelationalNames(modelBuilder.Entity<HumanProfile>());
    configureRelationalNames(modelBuilder.Entity<AgentProfile>());
    configureRelationalNames(modelBuilder.Entity<AuthProvider>());
    configureRelationalNames(modelBuilder.Entity<ExternalIdentity>());
    configureRelationalNames(modelBuilder.Entity<AuthSession>());
    configureRelationalNames(modelBuilder.Entity<ApiCredential>());
    configureRelationalNames(modelBuilder.Entity<WorkspaceMember>());
    configureRelationalNames(modelBuilder.Entity<Participant>());
    configureRelationalNames(modelBuilder.Entity<ParticipantPreference>());
    configureRelationalNames(modelBuilder.Entity<Role>());
    configureRelationalNames(modelBuilder.Entity<ParticipantRole>());
    configureRelationalNames(modelBuilder.Entity<Group>());
    configureRelationalNames(modelBuilder.Entity<GroupMember>());
    configureRelationalNames(modelBuilder.Entity<GroupChild>());
    configureRelationalNames(modelBuilder.Entity<PermissionGrant>());
    configureRelationalNames(modelBuilder.Entity<Channel>());
    configureRelationalNames(modelBuilder.Entity<ChannelMember>());
    configureRelationalNames(modelBuilder.Entity<Thread>());
    configureRelationalNames(modelBuilder.Entity<DirectChat>());
    configureRelationalNames(modelBuilder.Entity<DirectChatMember>());
    configureRelationalNames(modelBuilder.Entity<Message>());
    configureRelationalNames(modelBuilder.Entity<MessageVersion>());
    configureRelationalNames(modelBuilder.Entity<MessageMarker>());
    configureRelationalNames(modelBuilder.Entity<Reaction>());
    configureRelationalNames(modelBuilder.Entity<Attachment>());
    configureRelationalNames(modelBuilder.Entity<Emoji>());
    configureRelationalNames(modelBuilder.Entity<ProfileField>());
    configureRelationalNames(modelBuilder.Entity<ParticipantProfileFieldValue>());
    configureRelationalNames(modelBuilder.Entity<WorkspaceMemberDefault>());
    configureRelationalNames(modelBuilder.Entity<Webhook>());
    configureRelationalNames(modelBuilder.Entity<DeviceToken>());
    configureRelationalNames(modelBuilder.Entity<AuditEvent>());
    configureRelationalNames(modelBuilder.Entity<Notification>());
    configureRelationalNames(modelBuilder.Entity<NotificationEndpoint>());
    configureRelationalNames(modelBuilder.Entity<NotificationDelivery>());
  }
}

export class JotsterWorkspaceDbContext extends JotsterDbContext {
  CurrentWorkspaceId!: string;

  constructor(options: DbContextOptions, workspaceId: string) {
    super(options);
    this.CurrentWorkspaceId = workspaceId;
  }

  override OnModelCreating(modelBuilder: ModelBuilder): void {
    super.OnModelCreating(modelBuilder);
    configureWorkspaceFilters(modelBuilder, this.CurrentWorkspaceId);
  }

  RequireWorkspace(workspaceId: string): void {
    requireWorkspaceMatch(this.CurrentWorkspaceId, workspaceId);
  }

  ValidateWorkspaceOwnedEntity(entity: WorkspaceOwnedEntity): void {
    requireWorkspaceMatch(this.CurrentWorkspaceId, entity.WorkspaceId);
  }

  ValidateWorkspaceWrites(): void {
    const entries = Enumerable.ToArray(this.ChangeTracker.Entries());
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

  override SaveChanges(acceptAllChangesOnSuccess?: boolean): number {
    this.ValidateWorkspaceWrites();
    if (acceptAllChangesOnSuccess === undefined) {
      return super.SaveChanges();
    }
    return super.SaveChanges(acceptAllChangesOnSuccess);
  }

  override SaveChangesAsync(
    acceptAllChangesOnSuccessOrCancellationToken?: boolean | CancellationToken,
    cancellationToken?: CancellationToken,
  ) {
    this.ValidateWorkspaceWrites();
    if (acceptAllChangesOnSuccessOrCancellationToken === undefined) {
      return super.SaveChangesAsync();
    }
    if (typeof acceptAllChangesOnSuccessOrCancellationToken === "boolean") {
      if (cancellationToken === undefined) {
        return super.SaveChangesAsync(acceptAllChangesOnSuccessOrCancellationToken);
      }
      return super.SaveChangesAsync(
        acceptAllChangesOnSuccessOrCancellationToken,
        cancellationToken,
      );
    }
    return super.SaveChangesAsync(acceptAllChangesOnSuccessOrCancellationToken);
  }
}

export class JotsterAdminDbContext extends JotsterDbContext {
  Admin!: AdminContext;

  constructor(options: DbContextOptions, adminContext: AdminContext) {
    super(options);
    this.Admin = adminContext;
  }
}

export class JotsterBootstrapDbContext extends JotsterDbContext {
  Bootstrap?: BootstrapContext;

  constructor(options: DbContextOptions, bootstrapContext?: BootstrapContext) {
    super(options);
    this.Bootstrap = bootstrapContext;
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
