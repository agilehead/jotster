import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { JotsterDbContext, UserSetting } from "@jotster/core/Jotster.Core.js";

export const updateUserSetting = async (
  options: DbContextOptions,
  userId: string,
  updates: Record<string, unknown>,
  updateKeys: List<string>
): Promise<UserSetting | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const setting = await db0.UserSettings
      .Where((s) => s.UserId === userId0)
      .FirstOrDefaultAsync();

    if (setting === undefined) {
      return undefined;
    }

    for (let i = 0; i < updateKeys.Count; i++) {
      const key = updateKeys[i];
      const value = updates[key];

      if (key === "twenty_four_hour_time") {
        setting.TwentyFourHourTime = value as int;
      } else if (key === "dense_mode") {
        setting.DenseMode = value as int;
      } else if (key === "web_font_size_px") {
        setting.WebFontSizePx = value as int;
      } else if (key === "web_line_height_percent") {
        setting.WebLineHeightPercent = value as int;
      } else if (key === "starred_message_counts") {
        setting.StarredMessageCounts = value as int;
      } else if (key === "fluid_layout_width") {
        setting.FluidLayoutWidth = value as int;
      } else if (key === "high_contrast_mode") {
        setting.HighContrastMode = value as int;
      } else if (key === "color_scheme") {
        setting.ColorScheme = value as int;
      } else if (key === "translate_emoticons") {
        setting.TranslateEmoticons = value as int;
      } else if (key === "display_emoji_reaction_users") {
        setting.DisplayEmojiReactionUsers = value as int;
      } else if (key === "default_language") {
        setting.DefaultLanguage = value as string;
      } else if (key === "default_view") {
        setting.DefaultView = value as string;
      } else if (key === "escape_navigates_to_default_view") {
        setting.EscapeNavigatesToDefaultView = value as int;
      } else if (key === "left_side_userlist") {
        setting.LeftSideUserlist = value as int;
      } else if (key === "emojiset") {
        setting.Emojiset = value as string;
      } else if (key === "demote_inactive_streams") {
        setting.DemoteInactiveStreams = value as int;
      } else if (key === "enable_stream_desktop_notifications") {
        setting.EnableStreamDesktopNotifications = value as int;
      } else if (key === "enable_stream_email_notifications") {
        setting.EnableStreamEmailNotifications = value as int;
      } else if (key === "enable_stream_push_notifications") {
        setting.EnableStreamPushNotifications = value as int;
      } else if (key === "enable_stream_audible_notifications") {
        setting.EnableStreamAudibleNotifications = value as int;
      } else if (key === "notification_sound") {
        setting.NotificationSound = value as string;
      } else if (key === "enable_desktop_notifications") {
        setting.EnableDesktopNotifications = value as int;
      } else if (key === "enable_sounds") {
        setting.EnableSounds = value as int;
      } else if (key === "enable_offline_email_notifications") {
        setting.EnableOfflineEmailNotifications = value as int;
      } else if (key === "enable_offline_push_notifications") {
        setting.EnableOfflinePushNotifications = value as int;
      } else if (key === "enable_online_push_notifications") {
        setting.EnableOnlinePushNotifications = value as int;
      } else if (key === "enable_followed_topic_desktop_notifications") {
        setting.EnableFollowedTopicDesktopNotifications = value as int;
      } else if (key === "enable_followed_topic_email_notifications") {
        setting.EnableFollowedTopicEmailNotifications = value as int;
      } else if (key === "enable_followed_topic_push_notifications") {
        setting.EnableFollowedTopicPushNotifications = value as int;
      } else if (key === "enable_followed_topic_audible_notifications") {
        setting.EnableFollowedTopicAudibleNotifications = value as int;
      } else if (key === "email_notifications_batching_period_seconds") {
        setting.EmailNotificationsBatchingPeriodSeconds = value as int;
      } else if (key === "enable_drafts_synchronization") {
        setting.EnableDraftsSynchronization = value as int;
      } else if (key === "message_content_in_email_notifications") {
        setting.MessageContentInEmailNotifications = value as int;
      } else if (key === "pm_content_in_desktop_notifications") {
        setting.PmContentInDesktopNotifications = value as int;
      } else if (key === "wildcard_mentions_notify") {
        setting.WildcardMentionsNotify = value as int;
      } else if (key === "presence_enabled") {
        setting.PresenceEnabled = value as int;
      } else if (key === "send_private_typing_notifications") {
        setting.SendPrivateTypingNotifications = value as int;
      } else if (key === "send_stream_typing_notifications") {
        setting.SendStreamTypingNotifications = value as int;
      } else if (key === "send_read_receipts") {
        setting.SendReadReceipts = value as int;
      } else if (key === "email_address_visibility") {
        setting.EmailAddressVisibility = value as int;
      } else if (key === "realm_name_in_email_notifications_policy") {
        setting.RealmNameInEmailNotificationsPolicy = value as int;
      } else if (key === "automatically_follow_topics_policy") {
        setting.AutomaticallyFollowTopicsPolicy = value as int;
      } else if (key === "automatically_unmute_topics_in_muted_streams_policy") {
        setting.AutomaticallyUnmuteTopicsInMutedStreamsPolicy = value as int;
      } else if (key === "automatically_follow_topics_where_mentioned") {
        setting.AutomaticallyFollowTopicsWhereMentioned = value as int;
      } else if (key === "user_list_style") {
        setting.UserListStyle = value as int;
      } else if (key === "web_stream_unreads_count_display_policy") {
        setting.WebStreamUnreadsCountDisplayPolicy = value as int;
      } else if (key === "web_navigate_to_sent_message") {
        setting.WebNavigateToSentMessage = value as int;
      } else if (key === "web_channel_default_view") {
        setting.WebChannelDefaultView = value as int;
      }
    }

    await db0.SaveChangesAsync();
    return setting;
  } finally {
    db.Dispose();
  }
};
