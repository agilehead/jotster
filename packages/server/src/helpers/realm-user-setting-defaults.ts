import {
  copyRecord,
  getOptionalBooleanField,
  getOptionalField,
  getOptionalIntField,
  getOptionalStringField,
  hasField,
} from "./body.ts";

const REALM_USER_SETTING_DEFAULTS_BASE: Record<string, unknown> = {
  twenty_four_hour_time: false,
  color_scheme: 3,
  demote_inactive_streams: 1,
  display_emoji_reaction_users: true,
  email_address_visibility: 1,
  email_notifications_batching_period_seconds: 120,
  emojiset: "google",
  enable_desktop_notifications: true,
  enable_digest_emails: false,
  enable_drafts_synchronization: true,
  enable_offline_email_notifications: true,
  enable_offline_push_notifications: true,
  enable_online_push_notifications: true,
  enable_sounds: true,
  enter_sends: true,
  fluid_layout_width: false,
  left_side_userlist: false,
  message_content_in_email_notifications: true,
  notification_sound: "zulip",
  pm_content_in_desktop_notifications: true,
  presence_enabled: true,
  realm_name_in_email_notifications_policy: 1,
  send_private_typing_notifications: true,
  send_read_receipts: true,
  send_stream_typing_notifications: true,
  starred_message_counts: true,
  translate_emoticons: true,
  user_list_style: 1,
  web_channel_default_view: 1,
  web_font_size_px: 14,
  web_line_height_percent: 122,
  web_navigate_to_sent_message: true,
  web_stream_unreads_count_display_policy: 1,
  wildcard_mentions_notify: true,
};

const REALM_USER_SETTING_BOOLEAN_KEYS = [
  "twenty_four_hour_time",
  "display_emoji_reaction_users",
  "enable_desktop_notifications",
  "enable_digest_emails",
  "enable_drafts_synchronization",
  "enable_offline_email_notifications",
  "enable_offline_push_notifications",
  "enable_online_push_notifications",
  "enable_sounds",
  "enter_sends",
  "fluid_layout_width",
  "left_side_userlist",
  "message_content_in_email_notifications",
  "pm_content_in_desktop_notifications",
  "presence_enabled",
  "send_private_typing_notifications",
  "send_read_receipts",
  "send_stream_typing_notifications",
  "starred_message_counts",
  "translate_emoticons",
  "wildcard_mentions_notify",
];

const REALM_USER_SETTING_INT_KEYS = [
  "color_scheme",
  "demote_inactive_streams",
  "email_address_visibility",
  "email_notifications_batching_period_seconds",
  "realm_name_in_email_notifications_policy",
  "user_list_style",
  "web_channel_default_view",
  "web_font_size_px",
  "web_line_height_percent",
  "web_stream_unreads_count_display_policy",
];

const AVAILABLE_NOTIFICATION_SOUNDS = [
  "ascend",
  "beep_boop",
  "bink",
  "bright",
  "brlip",
  "chime",
  "deep tom",
  "ding",
  "double tap",
  "down",
  "dry bongos",
  "dutdut",
  "fast ascend",
  "flute",
  "friendly",
  "kick roll",
  "loud tintong",
  "metallic snare",
  "pan",
  "shaker",
  "simple",
  "stairs",
  "subtle",
  "swish",
  "tintong",
  "up",
  "wood block",
  "zaping",
  "zing",
  "zulip",
];

export const buildRealmUserSettingDefaultsState = (
  stored: Record<string, unknown>,
): Record<string, unknown> => {
  const state = copyRecord(REALM_USER_SETTING_DEFAULTS_BASE);
  const storedKeys = Object.keys(stored);
  for (let i = 0; i < storedKeys.length; i++) {
    state[storedKeys[i]] = stored[storedKeys[i]];
  }
  const emojisetChoices: Record<string, unknown>[] = [];
  const googleChoice: Record<string, unknown> = {};
  googleChoice["key"] = "google";
  googleChoice["text"] = "Google";
  emojisetChoices.push(googleChoice);
  const twitterChoice: Record<string, unknown> = {};
  twitterChoice["key"] = "twitter";
  twitterChoice["text"] = "Twitter";
  emojisetChoices.push(twitterChoice);
  const textChoice: Record<string, unknown> = {};
  textChoice["key"] = "text";
  textChoice["text"] = "Plain text";
  emojisetChoices.push(textChoice);
  state["emojiset_choices"] = emojisetChoices;
  state["available_notification_sounds"] = AVAILABLE_NOTIFICATION_SOUNDS;
  if (state["resolved_topic_notice_auto_read_policy"] === undefined) {
    state["resolved_topic_notice_auto_read_policy"] = "always";
  }
  return state;
};

export const normalizeRealmUserSettingDefaultsUpdates = (
  body: Record<string, unknown>,
): {
  updates: Record<string, unknown>;
  ignoredParametersUnsupported: string[];
  error?: string;
} => {
  const hasKnownKey = (knownKeys: string[], key: string): boolean => {
    for (let index = 0; index < knownKeys.length; index++) {
      if (knownKeys[index] === key) {
        return true;
      }
    }
    return false;
  };

  const updates: Record<string, unknown> = {};
  const ignoredParametersUnsupported: string[] = [];
  const keys = Object.keys(body);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (hasKnownKey(REALM_USER_SETTING_BOOLEAN_KEYS, key)) {
      const value = getOptionalBooleanField(body, key);
      if (value === undefined) {
        return {
          updates: {},
          ignoredParametersUnsupported,
          error: key + " is not valid JSON",
        };
      }
      updates[key] = value;
      continue;
    }

    if (hasKnownKey(REALM_USER_SETTING_INT_KEYS, key)) {
      const value = getOptionalIntField(body, key);
      if (value === undefined) {
        if (key === "email_notifications_batching_period_seconds") {
          const original = getOptionalField(body, key);
          return {
            updates: {},
            ignoredParametersUnsupported,
            error:
              "Invalid email batching period: " + String(original) + " seconds",
          };
        }
        return {
          updates: {},
          ignoredParametersUnsupported,
          error: "Invalid " + key,
        };
      }
      if (
        key === "email_notifications_batching_period_seconds" &&
        (value <= 0 || value > 604800)
      ) {
        return {
          updates: {},
          ignoredParametersUnsupported,
          error: "Invalid email batching period: " + String(value) + " seconds",
        };
      }
      updates[key] = value;
      continue;
    }

    if (key === "notification_sound") {
      const value = getOptionalStringField(body, key);
      if (
        value === undefined ||
        AVAILABLE_NOTIFICATION_SOUNDS.indexOf(value) === -1
      ) {
        return {
          updates: {},
          ignoredParametersUnsupported,
          error:
            "Invalid notification sound '" +
            String(getOptionalField(body, key)) +
            "'",
        };
      }
      updates[key] = value;
      continue;
    }

    if (key === "emojiset") {
      const value = getOptionalStringField(body, key);
      if (
        value === undefined ||
        (value !== "google" && value !== "twitter" && value !== "text")
      ) {
        return {
          updates: {},
          ignoredParametersUnsupported,
          error:
            "Invalid emojiset: Value error, Not in the list of possible values",
        };
      }
      updates[key] = value;
      continue;
    }

    if (key === "resolved_topic_notice_auto_read_policy") {
      const value = getOptionalStringField(body, key);
      if (
        value === undefined ||
        (value !== "always" &&
          value !== "conversation_view" &&
          value !== "never")
      ) {
        return {
          updates: {},
          ignoredParametersUnsupported,
          error: "Invalid resolved_topic_notice_auto_read_policy",
        };
      }
      updates[key] = value;
      continue;
    }

    if (hasField(REALM_USER_SETTING_DEFAULTS_BASE, key)) {
      updates[key] = body[key];
      continue;
    }

    ignoredParametersUnsupported.push(key);
  }

  return { updates, ignoredParametersUnsupported };
};
