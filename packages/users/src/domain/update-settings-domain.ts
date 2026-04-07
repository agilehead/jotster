import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import type { JsValue, int } from "@tsonic/core/types.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import { Convert } from "@tsonic/dotnet/System.js";
import { dispatchEventToUser } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateUserSetting } from "../repo/update-user-setting.ts";

const STRING_SETTING_KEYS = [
  "default_language",
  "default_view",
  "emojiset",
  "notification_sound",
];

const INT_SETTING_KEYS = [
  "web_font_size_px",
  "web_line_height_percent",
  "color_scheme",
  "email_notifications_batching_period_seconds",
  "email_address_visibility",
  "realm_name_in_email_notifications_policy",
  "automatically_follow_topics_policy",
  "automatically_unmute_topics_in_muted_streams_policy",
  "user_list_style",
  "web_stream_unreads_count_display_policy",
  "web_channel_default_view",
];

const FLAG_SETTING_KEYS = [
  "twenty_four_hour_time",
  "dense_mode",
  "starred_message_counts",
  "fluid_layout_width",
  "high_contrast_mode",
  "translate_emoticons",
  "display_emoji_reaction_users",
  "escape_navigates_to_default_view",
  "left_side_userlist",
  "demote_inactive_streams",
  "enable_stream_desktop_notifications",
  "enable_stream_email_notifications",
  "enable_stream_push_notifications",
  "enable_stream_audible_notifications",
  "enable_desktop_notifications",
  "enable_sounds",
  "enable_offline_email_notifications",
  "enable_offline_push_notifications",
  "enable_online_push_notifications",
  "enable_followed_topic_desktop_notifications",
  "enable_followed_topic_email_notifications",
  "enable_followed_topic_push_notifications",
  "enable_followed_topic_audible_notifications",
  "enable_drafts_synchronization",
  "message_content_in_email_notifications",
  "pm_content_in_desktop_notifications",
  "wildcard_mentions_notify",
  "presence_enabled",
  "send_private_typing_notifications",
  "send_stream_typing_notifications",
  "send_read_receipts",
  "automatically_follow_topics_where_mentioned",
  "web_navigate_to_sent_message",
];

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  de: "German",
};

const containsKey = (keys: readonly string[], key: string): boolean => {
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === key) {
      return true;
    }
  }
  return false;
};

const toFlagInt = (value: JsValue): int | undefined => {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return 1 as int;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return 0 as int;
  }
  return undefined;
};

const toIntValue = (value: JsValue): int | undefined => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return undefined;
    }
    return Convert.ToInt32(value);
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const stringValue = value as string;
  const trimmed = stringValue.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  return Convert.ToInt32(parsed);
};

export const updateSettingsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  updates: Record<string, JsValue>,
  updateKeys: List<string>,
) : Promise<Result<Record<string, JsValue>[], string>> => {
  const numericUpdates: Record<string, int> = {};
  const numericUpdateKeys = new List<string>();
  const stringUpdates: Record<string, string> = {};
  const stringUpdateKeys = new List<string>();
  const eventUpdates: Record<string, JsValue> = {};
  const eventUpdateKeys = new List<string>();
  const ignoredParams = new List<Record<string, JsValue>>();

  for (let i = 0; i < updateKeys.Count; i++) {
    const key = updateKeys[i];
    const value = updates[key];
    if (containsKey(STRING_SETTING_KEYS, key)) {
      if (typeof value !== "string") {
        return err("Invalid value for setting: " + key);
      }
      stringUpdates[key] = value;
      stringUpdateKeys.Add(key);
      eventUpdates[key] = value;
      eventUpdateKeys.Add(key);
      continue;
    }
    if (containsKey(INT_SETTING_KEYS, key)) {
      const parsed = toIntValue(value);
      if (parsed === undefined) {
        return err("Invalid value for setting: " + key);
      }
      numericUpdates[key] = parsed;
      numericUpdateKeys.Add(key);
      eventUpdates[key] = parsed;
      eventUpdateKeys.Add(key);
      continue;
    }
    if (containsKey(FLAG_SETTING_KEYS, key)) {
      const parsed = toFlagInt(value);
      if (parsed === undefined) {
        return err("Invalid value for setting: " + key);
      }
      numericUpdates[key] = parsed;
      numericUpdateKeys.Add(key);
      eventUpdates[key] = parsed;
      eventUpdateKeys.Add(key);
      continue;
    }

    const ignoredEntry: Record<string, JsValue> = {};
    ignoredEntry[key] = value;
    ignoredParams.Add(ignoredEntry);
  }

  const setting = await updateUserSetting(
    options,
    user.userId,
    user.tenantId,
    numericUpdates,
    numericUpdateKeys,
    stringUpdates,
    stringUpdateKeys,
  );
  if (setting === undefined) {
    return err("User settings not found");
  }

  for (let i = 0; i < eventUpdateKeys.Count; i++) {
    const key = eventUpdateKeys[i];
    const eventData: Record<string, JsValue> = {
      property: key,
    };

    if (containsKey(FLAG_SETTING_KEYS, key)) {
      eventData["value"] = eventUpdates[key] === (1 as int);
    } else {
      eventData["value"] = eventUpdates[key];
    }

    if (key === "default_language") {
      const languageCode = stringUpdates[key];
      eventData["language_name"] = LANGUAGE_NAMES[languageCode] ?? languageCode;
    }

    dispatchEventToUser(user.tenantId, user.userId, {
      type: "user_settings",
      data: eventData,
    });
  }

  return ok(ignoredParams.ToArray());
};
