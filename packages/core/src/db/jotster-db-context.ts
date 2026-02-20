import { asinterface } from "@tsonic/core/lang.js";
import type { ExtensionMethods as Linq } from "@tsonic/dotnet/System.Linq.js";
import type { ExtensionMethods as Ef } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { DbContext, DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { DbSet } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

import type { Tenant } from "./entities/tenant.ts";
import type { User } from "./entities/user.ts";
import type { UserSetting } from "./entities/user-setting.ts";
import type { ApiKey } from "./entities/api-key.ts";
import type { Channel } from "./entities/channel.ts";
import type { DefaultChannel } from "./entities/default-channel.ts";
import type { DefaultChannelGroup } from "./entities/default-channel-group.ts";
import type { DefaultChannelGroupItem } from "./entities/default-channel-group-item.ts";
import type { Subscription } from "./entities/subscription.ts";
import type { Message } from "./entities/message.ts";
import type { MessageEditHistory } from "./entities/message-edit-history.ts";
import type { MessageFlag } from "./entities/message-flag.ts";
import type { DmGroup } from "./entities/dm-group.ts";
import type { DmGroupMember } from "./entities/dm-group-member.ts";
import type { Reaction } from "./entities/reaction.ts";
import type { Presence } from "./entities/presence.ts";
import type { UserStatus } from "./entities/user-status.ts";
import type { UserGroup } from "./entities/user-group.ts";
import type { UserGroupMember } from "./entities/user-group-member.ts";
import type { UserGroupSubgroup } from "./entities/user-group-subgroup.ts";
import type { MutedUser } from "./entities/muted-user.ts";
import type { UserTopic } from "./entities/user-topic.ts";
import type { ChannelFolder } from "./entities/channel-folder.ts";
import type { ChannelFolderItem } from "./entities/channel-folder-item.ts";
import type { Attachment } from "./entities/attachment.ts";
import type { AttachmentMessage } from "./entities/attachment-message.ts";
import type { CustomEmoji } from "./entities/custom-emoji.ts";
import type { CustomProfileField } from "./entities/custom-profile-field.ts";
import type { CustomProfileFieldValue } from "./entities/custom-profile-field-value.ts";
import type { Draft } from "./entities/draft.ts";
import type { AlertWord } from "./entities/alert-word.ts";
import type { RealmDomain } from "./entities/realm-domain.ts";
import type { TenantUserSettingDefault } from "./entities/tenant-user-setting-default.ts";
import type { Invitation } from "./entities/invitation.ts";
import type { OutgoingWebhook } from "./entities/outgoing-webhook.ts";
import type { BotStorage } from "./entities/bot-storage.ts";
import type { DataExport } from "./entities/data-export.ts";
import type { PushDeviceToken } from "./entities/push-device-token.ts";

type DbSetQuery<T> = Ef<Linq<DbSet<T>>>;

export class JotsterDbContext extends DbContext {
  get Tenants(): DbSetQuery<Tenant> {
    return asinterface<DbSetQuery<Tenant>>(this.Set<Tenant>());
  }

  get Users(): DbSetQuery<User> {
    return asinterface<DbSetQuery<User>>(this.Set<User>());
  }

  get UserSettings(): DbSetQuery<UserSetting> {
    return asinterface<DbSetQuery<UserSetting>>(this.Set<UserSetting>());
  }

  get ApiKeys(): DbSetQuery<ApiKey> {
    return asinterface<DbSetQuery<ApiKey>>(this.Set<ApiKey>());
  }

  get Channels(): DbSetQuery<Channel> {
    return asinterface<DbSetQuery<Channel>>(this.Set<Channel>());
  }

  get DefaultChannels(): DbSetQuery<DefaultChannel> {
    return asinterface<DbSetQuery<DefaultChannel>>(this.Set<DefaultChannel>());
  }

  get DefaultChannelGroups(): DbSetQuery<DefaultChannelGroup> {
    return asinterface<DbSetQuery<DefaultChannelGroup>>(this.Set<DefaultChannelGroup>());
  }

  get DefaultChannelGroupItems(): DbSetQuery<DefaultChannelGroupItem> {
    return asinterface<DbSetQuery<DefaultChannelGroupItem>>(this.Set<DefaultChannelGroupItem>());
  }

  get Subscriptions(): DbSetQuery<Subscription> {
    return asinterface<DbSetQuery<Subscription>>(this.Set<Subscription>());
  }

  get Messages(): DbSetQuery<Message> {
    return asinterface<DbSetQuery<Message>>(this.Set<Message>());
  }

  get MessageEditHistories(): DbSetQuery<MessageEditHistory> {
    return asinterface<DbSetQuery<MessageEditHistory>>(this.Set<MessageEditHistory>());
  }

  get MessageFlags(): DbSetQuery<MessageFlag> {
    return asinterface<DbSetQuery<MessageFlag>>(this.Set<MessageFlag>());
  }

  get DmGroups(): DbSetQuery<DmGroup> {
    return asinterface<DbSetQuery<DmGroup>>(this.Set<DmGroup>());
  }

  get DmGroupMembers(): DbSetQuery<DmGroupMember> {
    return asinterface<DbSetQuery<DmGroupMember>>(this.Set<DmGroupMember>());
  }

  get Reactions(): DbSetQuery<Reaction> {
    return asinterface<DbSetQuery<Reaction>>(this.Set<Reaction>());
  }

  get Presences(): DbSetQuery<Presence> {
    return asinterface<DbSetQuery<Presence>>(this.Set<Presence>());
  }

  get UserStatuses(): DbSetQuery<UserStatus> {
    return asinterface<DbSetQuery<UserStatus>>(this.Set<UserStatus>());
  }

  get UserGroups(): DbSetQuery<UserGroup> {
    return asinterface<DbSetQuery<UserGroup>>(this.Set<UserGroup>());
  }

  get UserGroupMembers(): DbSetQuery<UserGroupMember> {
    return asinterface<DbSetQuery<UserGroupMember>>(this.Set<UserGroupMember>());
  }

  get UserGroupSubgroups(): DbSetQuery<UserGroupSubgroup> {
    return asinterface<DbSetQuery<UserGroupSubgroup>>(this.Set<UserGroupSubgroup>());
  }

  get MutedUsers(): DbSetQuery<MutedUser> {
    return asinterface<DbSetQuery<MutedUser>>(this.Set<MutedUser>());
  }

  get UserTopics(): DbSetQuery<UserTopic> {
    return asinterface<DbSetQuery<UserTopic>>(this.Set<UserTopic>());
  }

  get ChannelFolders(): DbSetQuery<ChannelFolder> {
    return asinterface<DbSetQuery<ChannelFolder>>(this.Set<ChannelFolder>());
  }

  get ChannelFolderItems(): DbSetQuery<ChannelFolderItem> {
    return asinterface<DbSetQuery<ChannelFolderItem>>(this.Set<ChannelFolderItem>());
  }

  get Attachments(): DbSetQuery<Attachment> {
    return asinterface<DbSetQuery<Attachment>>(this.Set<Attachment>());
  }

  get AttachmentMessages(): DbSetQuery<AttachmentMessage> {
    return asinterface<DbSetQuery<AttachmentMessage>>(this.Set<AttachmentMessage>());
  }

  get CustomEmojis(): DbSetQuery<CustomEmoji> {
    return asinterface<DbSetQuery<CustomEmoji>>(this.Set<CustomEmoji>());
  }

  get CustomProfileFields(): DbSetQuery<CustomProfileField> {
    return asinterface<DbSetQuery<CustomProfileField>>(this.Set<CustomProfileField>());
  }

  get CustomProfileFieldValues(): DbSetQuery<CustomProfileFieldValue> {
    return asinterface<DbSetQuery<CustomProfileFieldValue>>(this.Set<CustomProfileFieldValue>());
  }

  get Drafts(): DbSetQuery<Draft> {
    return asinterface<DbSetQuery<Draft>>(this.Set<Draft>());
  }

  get AlertWords(): DbSetQuery<AlertWord> {
    return asinterface<DbSetQuery<AlertWord>>(this.Set<AlertWord>());
  }

  get RealmDomains(): DbSetQuery<RealmDomain> {
    return asinterface<DbSetQuery<RealmDomain>>(this.Set<RealmDomain>());
  }

  get TenantUserSettingDefaults(): DbSetQuery<TenantUserSettingDefault> {
    return asinterface<DbSetQuery<TenantUserSettingDefault>>(this.Set<TenantUserSettingDefault>());
  }

  get Invitations(): DbSetQuery<Invitation> {
    return asinterface<DbSetQuery<Invitation>>(this.Set<Invitation>());
  }

  get OutgoingWebhooks(): DbSetQuery<OutgoingWebhook> {
    return asinterface<DbSetQuery<OutgoingWebhook>>(this.Set<OutgoingWebhook>());
  }

  get BotStorages(): DbSetQuery<BotStorage> {
    return asinterface<DbSetQuery<BotStorage>>(this.Set<BotStorage>());
  }

  get DataExports(): DbSetQuery<DataExport> {
    return asinterface<DbSetQuery<DataExport>>(this.Set<DataExport>());
  }

  get PushDeviceTokens(): DbSetQuery<PushDeviceToken> {
    return asinterface<DbSetQuery<PushDeviceToken>>(this.Set<PushDeviceToken>());
  }

  constructor(options: DbContextOptions) {
    super(options);
  }
}
