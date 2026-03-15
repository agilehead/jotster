import type { int, long } from "@tsonic/core/types.js";
import { attributes as A } from "@tsonic/core/lang.js";
import { KeyAttribute } from "@tsonic/dotnet/System.ComponentModel.DataAnnotations.js";

export class UserSetting {
  UserId!: long;
  TenantId!: long;
  TwentyFourHourTime!: int;
  DenseMode!: int;
  WebFontSizePx!: int;
  WebLineHeightPercent!: int;
  StarredMessageCounts!: int;
  FluidLayoutWidth!: int;
  HighContrastMode!: int;
  ColorScheme!: int;
  TranslateEmoticons!: int;
  DisplayEmojiReactionUsers!: int;
  DefaultLanguage!: string;
  DefaultView!: string;
  EscapeNavigatesToDefaultView!: int;
  LeftSideUserlist!: int;
  Emojiset!: string;
  DemoteInactiveStreams!: int;
  EnableStreamDesktopNotifications!: int;
  EnableStreamEmailNotifications!: int;
  EnableStreamPushNotifications!: int;
  EnableStreamAudibleNotifications!: int;
  NotificationSound!: string;
  EnableDesktopNotifications!: int;
  EnableSounds!: int;
  EnableOfflineEmailNotifications!: int;
  EnableOfflinePushNotifications!: int;
  EnableOnlinePushNotifications!: int;
  EnableFollowedTopicDesktopNotifications!: int;
  EnableFollowedTopicEmailNotifications!: int;
  EnableFollowedTopicPushNotifications!: int;
  EnableFollowedTopicAudibleNotifications!: int;
  EmailNotificationsBatchingPeriodSeconds!: int;
  EnableDraftsSynchronization!: int;
  MessageContentInEmailNotifications!: int;
  PmContentInDesktopNotifications!: int;
  WildcardMentionsNotify!: int;
  PresenceEnabled!: int;
  SendPrivateTypingNotifications!: int;
  SendStreamTypingNotifications!: int;
  SendReadReceipts!: int;
  AllowPrivateDataExport!: int;
  EmailAddressVisibility!: int;
  RealmNameInEmailNotificationsPolicy!: int;
  AutomaticallyFollowTopicsPolicy!: int;
  AutomaticallyUnmuteTopicsInMutedStreamsPolicy!: int;
  AutomaticallyFollowTopicsWhereMentioned!: int;
  UserListStyle!: int;
  WebStreamUnreadsCountDisplayPolicy!: int;
  WebNavigateToSentMessage!: int;
  WebChannelDefaultView!: int;
}

A.on(UserSetting)
  .prop((x) => x.UserId)
  .add(KeyAttribute);
