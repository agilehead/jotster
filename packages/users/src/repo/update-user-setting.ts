import type { JsValue, int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { JotsterDbContext, UserSetting } from "@jotster/core/Jotster.Core.js";
import { createUserSetting } from "./create-user-setting.ts";

export const updateUserSetting = async (
  options: DbContextOptions,
  userId: long,
  tenantId: long,
  numericUpdates: Record<string, int>,
  numericUpdateKeys: List<string>,
  stringUpdates: Record<string, string>,
  stringUpdateKeys: List<string>,
): Promise<UserSetting | undefined> => {
  const db = new JotsterDbContext(options);
  try {
    const db0 = db;
    const userId0 = userId;
    const setting = await db0.UserSettings.Where(
      (s) => s.UserId === userId0,
    ).FirstOrDefaultAsync();

    let setting0 = setting;
    if (setting0 == null) {
      setting0 = await createUserSetting(options, userId, tenantId);
    }
    if (setting0 == null) {
      return undefined;
    }

    for (let i = 0; i < numericUpdateKeys.Count; i++) {
      const key = numericUpdateKeys[i];
      const value = numericUpdates[key];
      if (key === "twenty_four_hour_time") {
        setting0.TwentyFourHourTime = value;
      } else if (key === "dense_mode") {
        setting0.DenseMode = value;
      } else if (key === "web_font_size_px") {
        setting0.WebFontSizePx = value;
      } else if (key === "web_line_height_percent") {
        setting0.WebLineHeightPercent = value;
      } else if (key === "starred_message_counts") {
        setting0.StarredMessageCounts = value;
      } else if (key === "fluid_layout_width") {
        setting0.FluidLayoutWidth = value;
      } else if (key === "high_contrast_mode") {
        setting0.HighContrastMode = value;
      } else if (key === "color_scheme") {
        setting0.ColorScheme = value;
      } else if (key === "translate_emoticons") {
        setting0.TranslateEmoticons = value;
      } else if (key === "display_emoji_reaction_users") {
        setting0.DisplayEmojiReactionUsers = value;
      } else if (key === "escape_navigates_to_default_view") {
        setting0.EscapeNavigatesToDefaultView = value;
      } else if (key === "left_side_userlist") {
        setting0.LeftSideUserlist = value;
      } else if (key === "demote_inactive_streams") {
        setting0.DemoteInactiveStreams = value;
      } else if (key === "enable_stream_desktop_notifications") {
        setting0.EnableStreamDesktopNotifications = value;
      } else if (key === "enable_stream_email_notifications") {
        setting0.EnableStreamEmailNotifications = value;
      } else if (key === "enable_stream_push_notifications") {
        setting0.EnableStreamPushNotifications = value;
      } else if (key === "enable_stream_audible_notifications") {
        setting0.EnableStreamAudibleNotifications = value;
      } else if (key === "enable_desktop_notifications") {
        setting0.EnableDesktopNotifications = value;
      } else if (key === "enable_sounds") {
        setting0.EnableSounds = value;
      } else if (key === "enable_offline_email_notifications") {
        setting0.EnableOfflineEmailNotifications = value;
      } else if (key === "enable_offline_push_notifications") {
        setting0.EnableOfflinePushNotifications = value;
      } else if (key === "enable_online_push_notifications") {
        setting0.EnableOnlinePushNotifications = value;
      } else if (key === "enable_followed_topic_desktop_notifications") {
        setting0.EnableFollowedTopicDesktopNotifications = value;
      } else if (key === "enable_followed_topic_email_notifications") {
        setting0.EnableFollowedTopicEmailNotifications = value;
      } else if (key === "enable_followed_topic_push_notifications") {
        setting0.EnableFollowedTopicPushNotifications = value;
      } else if (key === "enable_followed_topic_audible_notifications") {
        setting0.EnableFollowedTopicAudibleNotifications = value;
      } else if (key === "email_notifications_batching_period_seconds") {
        setting0.EmailNotificationsBatchingPeriodSeconds = value;
      } else if (key === "enable_drafts_synchronization") {
        setting0.EnableDraftsSynchronization = value;
      } else if (key === "message_content_in_email_notifications") {
        setting0.MessageContentInEmailNotifications = value;
      } else if (key === "pm_content_in_desktop_notifications") {
        setting0.PmContentInDesktopNotifications = value;
      } else if (key === "wildcard_mentions_notify") {
        setting0.WildcardMentionsNotify = value;
      } else if (key === "presence_enabled") {
        setting0.PresenceEnabled = value;
      } else if (key === "send_private_typing_notifications") {
        setting0.SendPrivateTypingNotifications = value;
      } else if (key === "send_stream_typing_notifications") {
        setting0.SendStreamTypingNotifications = value;
      } else if (key === "send_read_receipts") {
        setting0.SendReadReceipts = value;
      } else if (key === "email_address_visibility") {
        setting0.EmailAddressVisibility = value;
      } else if (key === "realm_name_in_email_notifications_policy") {
        setting0.RealmNameInEmailNotificationsPolicy = value;
      } else if (key === "automatically_follow_topics_policy") {
        setting0.AutomaticallyFollowTopicsPolicy = value;
      } else if (
        key === "automatically_unmute_topics_in_muted_streams_policy"
      ) {
        setting0.AutomaticallyUnmuteTopicsInMutedStreamsPolicy = value;
      } else if (key === "automatically_follow_topics_where_mentioned") {
        setting0.AutomaticallyFollowTopicsWhereMentioned = value;
      } else if (key === "user_list_style") {
        setting0.UserListStyle = value;
      } else if (key === "web_stream_unreads_count_display_policy") {
        setting0.WebStreamUnreadsCountDisplayPolicy = value;
      } else if (key === "web_navigate_to_sent_message") {
        setting0.WebNavigateToSentMessage = value;
      } else if (key === "web_channel_default_view") {
        setting0.WebChannelDefaultView = value;
      }
    }

    for (let i = 0; i < stringUpdateKeys.Count; i++) {
      const key = stringUpdateKeys[i];
      const value = stringUpdates[key];

      if (key === "default_language") {
        setting0.DefaultLanguage = value;
      } else if (key === "default_view") {
        setting0.DefaultView = value;
      } else if (key === "emojiset") {
        setting0.Emojiset = value;
      } else if (key === "notification_sound") {
        setting0.NotificationSound = value;
      }
    }

    await db0.SaveChangesAsync();
    return setting0;
  } finally {
    db.Dispose();
  }
};
