import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { updateUserSetting } from "../repo/update-user-setting.ts";

const KNOWN_SETTING_KEYS: Record<string, boolean> = {
  twenty_four_hour_time: true,
  dense_mode: true,
  web_font_size_px: true,
  web_line_height_percent: true,
  starred_message_counts: true,
  fluid_layout_width: true,
  high_contrast_mode: true,
  color_scheme: true,
  translate_emoticons: true,
  display_emoji_reaction_users: true,
  default_language: true,
  default_view: true,
  escape_navigates_to_default_view: true,
  left_side_userlist: true,
  emojiset: true,
  demote_inactive_streams: true,
  enable_stream_desktop_notifications: true,
  enable_stream_email_notifications: true,
  enable_stream_push_notifications: true,
  enable_stream_audible_notifications: true,
  notification_sound: true,
  enable_desktop_notifications: true,
  enable_sounds: true,
  enable_offline_email_notifications: true,
  enable_offline_push_notifications: true,
  enable_online_push_notifications: true,
  enable_followed_topic_desktop_notifications: true,
  enable_followed_topic_email_notifications: true,
  enable_followed_topic_push_notifications: true,
  enable_followed_topic_audible_notifications: true,
  email_notifications_batching_period_seconds: true,
  enable_drafts_synchronization: true,
  message_content_in_email_notifications: true,
  pm_content_in_desktop_notifications: true,
  wildcard_mentions_notify: true,
  presence_enabled: true,
  send_private_typing_notifications: true,
  send_stream_typing_notifications: true,
  send_read_receipts: true,
  email_address_visibility: true,
  realm_name_in_email_notifications_policy: true,
  automatically_follow_topics_policy: true,
  automatically_unmute_topics_in_muted_streams_policy: true,
  automatically_follow_topics_where_mentioned: true,
  user_list_style: true,
  web_stream_unreads_count_display_policy: true,
  web_navigate_to_sent_message: true,
  web_channel_default_view: true,
};

export const updateSettingsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  updates: Record<string, unknown>,
  updateKeys: List<string>
): Promise<Result<Record<string, unknown>[], string>> => {
  const validUpdates: Record<string, unknown> = {};
  const validUpdateKeys = new List<string>();
  const ignoredParams = new List<Record<string, unknown>>();

  for (let i = 0; i < updateKeys.Count; i++) {
    const key = updateKeys[i];
    if (KNOWN_SETTING_KEYS[key] === true) {
      validUpdates[key] = updates[key];
      validUpdateKeys.Add(key);
    } else {
      const ignoredEntry: Record<string, unknown> = {};
      ignoredEntry[key] = updates[key];
      ignoredParams.Add(ignoredEntry);
    }
  }

  const setting = await updateUserSetting(options, user.userId, validUpdates, validUpdateKeys);
  if (setting === undefined) {
    return err("User settings not found");
  }

  return ok(ignoredParams.ToArray());
};
