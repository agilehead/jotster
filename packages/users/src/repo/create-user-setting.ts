import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { JotsterDbContext, UserSetting } from "@jotster/core/Jotster.Core.js";

export const createUserSetting = async (
  options: DbContextOptions,
  userId: string,
  tenantId: string
): Promise<UserSetting> => {
  const setting = new UserSetting();
  setting.UserId = userId;
  setting.TenantId = tenantId;
  setting.TwentyFourHourTime = 0 as int;
  setting.DenseMode = 0 as int;
  setting.WebFontSizePx = 14 as int;
  setting.WebLineHeightPercent = 122 as int;
  setting.StarredMessageCounts = 1 as int;
  setting.FluidLayoutWidth = 0 as int;
  setting.HighContrastMode = 0 as int;
  setting.ColorScheme = 3 as int;
  setting.TranslateEmoticons = 1 as int;
  setting.DisplayEmojiReactionUsers = 1 as int;
  setting.DefaultLanguage = "en";
  setting.DefaultView = "recent_topics";
  setting.EscapeNavigatesToDefaultView = 1 as int;
  setting.LeftSideUserlist = 0 as int;
  setting.Emojiset = "google";
  setting.DemoteInactiveStreams = 1 as int;
  setting.EnableStreamDesktopNotifications = 0 as int;
  setting.EnableStreamEmailNotifications = 0 as int;
  setting.EnableStreamPushNotifications = 0 as int;
  setting.EnableStreamAudibleNotifications = 0 as int;
  setting.NotificationSound = "zulip";
  setting.EnableDesktopNotifications = 1 as int;
  setting.EnableSounds = 1 as int;
  setting.EnableOfflineEmailNotifications = 1 as int;
  setting.EnableOfflinePushNotifications = 1 as int;
  setting.EnableOnlinePushNotifications = 1 as int;
  setting.EnableFollowedTopicDesktopNotifications = 1 as int;
  setting.EnableFollowedTopicEmailNotifications = 1 as int;
  setting.EnableFollowedTopicPushNotifications = 1 as int;
  setting.EnableFollowedTopicAudibleNotifications = 1 as int;
  setting.EmailNotificationsBatchingPeriodSeconds = 120 as int;
  setting.EnableDraftsSynchronization = 1 as int;
  setting.MessageContentInEmailNotifications = 1 as int;
  setting.PmContentInDesktopNotifications = 1 as int;
  setting.WildcardMentionsNotify = 1 as int;
  setting.PresenceEnabled = 1 as int;
  setting.SendPrivateTypingNotifications = 1 as int;
  setting.SendStreamTypingNotifications = 1 as int;
  setting.SendReadReceipts = 1 as int;
  setting.EmailAddressVisibility = 1 as int;
  setting.RealmNameInEmailNotificationsPolicy = 1 as int;
  setting.AutomaticallyFollowTopicsPolicy = 0 as int;
  setting.AutomaticallyUnmuteTopicsInMutedStreamsPolicy = 0 as int;
  setting.AutomaticallyFollowTopicsWhereMentioned = 1 as int;
  setting.UserListStyle = 1 as int;
  setting.WebStreamUnreadsCountDisplayPolicy = 1 as int;
  setting.WebNavigateToSentMessage = 1 as int;
  setting.WebChannelDefaultView = 1 as int;

  const db = new JotsterDbContext(options);
  try {
    db.UserSettings.Add(setting);
    await db.SaveChangesAsync();
    return setting;
  } finally {
    db.Dispose();
  }
};
