import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { List } from "@tsonic/dotnet/System.Collections.Generic.js";
import {
  JotsterDbContext,
  ZULIP_VERSION,
  ZULIP_FEATURE_LEVEL,
  SERVER_GENERATION,
  MAX_MESSAGE_LENGTH,
  MAX_TOPIC_LENGTH,
  MAX_CHANNEL_NAME_LENGTH,
  MAX_CHANNEL_DESCRIPTION_LENGTH,
} from "@jotster/core/Jotster.Core.js";
import { getAllUsers } from "@jotster/users/Jotster.Users.js";
import { getUserSetting } from "@jotster/users/Jotster.Users.js";
import { getSubscriptionsForUser } from "@jotster/subscriptions/Jotster.Subscriptions.js";
import { getChannels, getChannelSubscribers } from "@jotster/channels/Jotster.Channels.js";
import type { RegisterParams } from "@jotster/event-queue/Jotster.EventQueue.js";

const mapUserToZulip = (u: {
  Id: string;
  Email: string;
  FullName: string;
  AvatarUrl?: string;
  Role: number;
  IsBot: number;
  IsActive: number;
  DateJoined: number;
  Timezone: string;
  BotType?: number;
  BotOwnerId?: string;
}): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  obj.user_id = u.Id;
  obj.email = u.Email;
  obj.full_name = u.FullName;
  obj.avatar_url = u.AvatarUrl ?? null;
  obj.is_admin = u.Role <= 200;
  obj.is_owner = u.Role === 100;
  obj.is_guest = u.Role === 600;
  obj.is_bot = u.IsBot === 1;
  obj.is_active = u.IsActive === 1;
  obj.role = u.Role;
  obj.date_joined = u.DateJoined;
  obj.timezone = u.Timezone;
  obj.bot_type = u.BotType ?? null;
  obj.bot_owner_id = u.BotOwnerId ?? null;
  obj.profile_data = {};
  return obj;
};

export const buildInitialState = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string,
  fetchEventTypes: string[] | undefined,
  params: RegisterParams
): Promise<Record<string, unknown>> => {
  const shouldInclude = (type: string): boolean => {
    if (fetchEventTypes === undefined) {
      return true;
    }
    for (let i = 0; i < fetchEventTypes.length; i++) {
      if (fetchEventTypes[i] === type) {
        return true;
      }
    }
    return false;
  };

  const state: Record<string, unknown> = {};

  // Server metadata (always included)
  state.zulip_version = ZULIP_VERSION;
  state.zulip_feature_level = ZULIP_FEATURE_LEVEL;
  state.zulip_merge_base = ZULIP_VERSION;

  // --- realm_users + realm_non_active_users ---
  let realmUserObjects: Record<string, unknown>[] = [];

  if (shouldInclude("realm_user")) {
    const allUsers = await getAllUsers(options, tenantId);

    const activeUsers = new List<Record<string, unknown>>();
    const inactiveUsers = new List<Record<string, unknown>>();

    for (let i = 0; i < allUsers.length; i++) {
      const u = allUsers[i];
      const mapped = mapUserToZulip(u);
      if (u.IsActive === 1) {
        activeUsers.Add(mapped);
      } else {
        inactiveUsers.Add(mapped);
      }
    }

    realmUserObjects = activeUsers.ToArray();
    state.realm_users = activeUsers.ToArray();
    state.realm_non_active_users = inactiveUsers.ToArray();
  }

  // --- realm_bots ---
  if (shouldInclude("realm_bot")) {
    // If we already have realm_users from above, filter from that.
    // Otherwise we need to query.
    let botSource: Record<string, unknown>[];
    if (shouldInclude("realm_user")) {
      botSource = realmUserObjects;
    } else {
      const allUsers = await getAllUsers(options, tenantId);
      const mapped = new List<Record<string, unknown>>();
      for (let i = 0; i < allUsers.length; i++) {
        mapped.Add(mapUserToZulip(allUsers[i]));
      }
      botSource = mapped.ToArray();
    }

    const bots = new List<Record<string, unknown>>();
    for (let i = 0; i < botSource.length; i++) {
      const u = botSource[i];
      if (u.is_bot === true) {
        const bot: Record<string, unknown> = {};
        bot.user_id = u.user_id;
        bot.email = u.email;
        bot.full_name = u.full_name;
        bot.bot_type = u.bot_type;
        bot.is_active = u.is_active;
        bot.api_key = "";
        bot.default_sending_stream = null;
        bot.default_events_register_stream = null;
        bot.default_all_public_streams = false;
        bot.avatar_url = u.avatar_url;
        bot.owner_id = u.bot_owner_id ?? null;
        bot.services = [];
        bots.Add(bot);
      }
    }

    state.realm_bots = bots.ToArray();
  }

  // --- subscriptions ---
  if (shouldInclude("subscription")) {
    const userSubs = await getSubscriptionsForUser(options, tenantId, userId);
    const allChannels = await getChannels(options, tenantId, false);

    // Build channel lookup map
    const channelMap: Record<string, typeof allChannels[0]> = {};
    for (let i = 0; i < allChannels.length; i++) {
      const ch = allChannels[i];
      channelMap[ch.Id] = ch;
    }

    const subscriptions = new List<Record<string, unknown>>();

    for (let i = 0; i < userSubs.Count; i++) {
      const sub = userSubs[i];
      const ch = channelMap[sub.ChannelId];
      if (ch === undefined) {
        continue;
      }

      const subscriberIds = await getChannelSubscribers(options, tenantId, sub.ChannelId);

      const entry: Record<string, unknown> = {};
      entry.stream_id = sub.ChannelId;
      entry.name = ch.Name;
      entry.description = ch.Description;
      entry.rendered_description = ch.RenderedDescription;
      entry.color = sub.Color;
      entry.pin_to_top = sub.PinToTop === 1;
      entry.is_muted = sub.IsMuted === 1;
      entry.in_home_view = sub.IsMuted !== 1;
      entry.desktop_notifications = sub.DesktopNotifications !== undefined ? sub.DesktopNotifications === 1 : null;
      entry.push_notifications = sub.PushNotifications !== undefined ? sub.PushNotifications === 1 : null;
      entry.audible_notifications = sub.AudibleNotifications !== undefined ? sub.AudibleNotifications === 1 : null;
      entry.email_notifications = sub.EmailNotifications !== undefined ? sub.EmailNotifications === 1 : null;
      entry.wildcard_mentions_notify = sub.WildcardMentionsNotify !== undefined ? sub.WildcardMentionsNotify === 1 : null;
      entry.invite_only = ch.IsPrivate === 1;
      entry.is_web_public = ch.IsWebPublic === 1;
      entry.history_public_to_subscribers = ch.HistoryPublicToSubscribers === 1;
      entry.stream_weekly_traffic = 0;
      entry.subscribers = subscriberIds;

      subscriptions.Add(entry);
    }

    state.subscriptions = subscriptions.ToArray();
    state.unsubscribed = [];
    state.never_subscribed = [];
  }

  // --- user_settings ---
  if (shouldInclude("user_settings")) {
    const s = await getUserSetting(options, userId);

    if (s !== undefined) {
      const settings: Record<string, unknown> = {};
      settings.twenty_four_hour_time = s.TwentyFourHourTime === 1;
      settings.dense_mode = s.DenseMode === 1;
      settings.high_contrast_mode = s.HighContrastMode === 1;
      settings.color_scheme = s.ColorScheme;
      settings.translate_emoticons = s.TranslateEmoticons === 1;
      settings.display_emoji_reaction_users = s.DisplayEmojiReactionUsers === 1;
      settings.default_language = s.DefaultLanguage;
      settings.default_view = s.DefaultView;
      settings.escape_navigates_to_default_view = s.EscapeNavigatesToDefaultView === 1;
      settings.left_side_userlist = s.LeftSideUserlist === 1;
      settings.emojiset = s.Emojiset;
      settings.demote_inactive_streams = s.DemoteInactiveStreams;
      settings.enable_stream_desktop_notifications = s.EnableStreamDesktopNotifications === 1;
      settings.enable_stream_email_notifications = s.EnableStreamEmailNotifications === 1;
      settings.enable_stream_push_notifications = s.EnableStreamPushNotifications === 1;
      settings.enable_stream_audible_notifications = s.EnableStreamAudibleNotifications === 1;
      settings.notification_sound = s.NotificationSound;
      settings.enable_desktop_notifications = s.EnableDesktopNotifications === 1;
      settings.enable_sounds = s.EnableSounds === 1;
      settings.enable_offline_email_notifications = s.EnableOfflineEmailNotifications === 1;
      settings.enable_offline_push_notifications = s.EnableOfflinePushNotifications === 1;
      settings.enable_online_push_notifications = s.EnableOnlinePushNotifications === 1;
      settings.enable_followed_topic_desktop_notifications = s.EnableFollowedTopicDesktopNotifications === 1;
      settings.enable_followed_topic_email_notifications = s.EnableFollowedTopicEmailNotifications === 1;
      settings.enable_followed_topic_push_notifications = s.EnableFollowedTopicPushNotifications === 1;
      settings.enable_followed_topic_audible_notifications = s.EnableFollowedTopicAudibleNotifications === 1;
      settings.wildcard_mentions_notify = s.WildcardMentionsNotify === 1;
      settings.pm_content_in_desktop_notifications = s.PmContentInDesktopNotifications === 1;
      settings.presence_enabled = s.PresenceEnabled === 1;
      settings.send_private_typing_notifications = s.SendPrivateTypingNotifications === 1;
      settings.send_stream_typing_notifications = s.SendStreamTypingNotifications === 1;
      settings.send_read_receipts = s.SendReadReceipts === 1;
      settings.email_address_visibility = s.EmailAddressVisibility;
      settings.email_notifications_batching_period_seconds = s.EmailNotificationsBatchingPeriodSeconds;
      settings.enable_drafts_synchronization = s.EnableDraftsSynchronization === 1;
      settings.message_content_in_email_notifications = s.MessageContentInEmailNotifications === 1;
      settings.web_font_size_px = s.WebFontSizePx;
      settings.web_line_height_percent = s.WebLineHeightPercent;
      settings.starred_message_counts = s.StarredMessageCounts === 1;
      settings.fluid_layout_width = s.FluidLayoutWidth === 1;
      settings.realm_name_in_email_notifications_policy = s.RealmNameInEmailNotificationsPolicy;
      settings.automatically_follow_topics_policy = s.AutomaticallyFollowTopicsPolicy;
      settings.automatically_unmute_topics_in_muted_streams_policy = s.AutomaticallyUnmuteTopicsInMutedStreamsPolicy;
      settings.automatically_follow_topics_where_mentioned = s.AutomaticallyFollowTopicsWhereMentioned === 1;
      settings.user_list_style = s.UserListStyle;
      settings.web_stream_unreads_count_display_policy = s.WebStreamUnreadsCountDisplayPolicy;
      settings.web_navigate_to_sent_message = s.WebNavigateToSentMessage === 1;
      settings.web_channel_default_view = s.WebChannelDefaultView;
      settings.enter_sends = true;
      settings.desktop_icon_count_display = 1;

      state.user_settings = settings;
    }
  }

  // --- realm config ---
  if (shouldInclude("realm")) {
    const db = new JotsterDbContext(options);
    try {
      const db0 = db;
      const tenantId0 = tenantId;
      const tenant = await db0.Tenants
        .Where((t) => t.Id === tenantId0)
        .FirstOrDefaultAsync();

      if (tenant !== undefined && tenant !== null) {
        state.realm_name = tenant.Name;
        state.realm_description = tenant.Description;
        state.realm_icon_url = tenant.IconUrl ?? null;
        state.realm_uri = "https://" + tenant.Subdomain + ".jotster.app";
        state.realm_allow_message_editing = true;
        state.realm_message_content_edit_limit_seconds = 600;
        state.realm_message_content_delete_limit_seconds = 600;
        state.realm_allow_edit_history = true;
        state.realm_enable_read_receipts = true;
        state.realm_enable_spectator_access = false;
        state.realm_invite_required = true;
        state.realm_create_public_stream_policy = 1;
        state.realm_create_private_stream_policy = 1;
        state.realm_create_web_public_stream_policy = 6;
        state.realm_default_language = "en";
        state.realm_video_chat_provider = 1;
      }
    } finally {
      db.Dispose();
    }
  }

  // --- Empty/default sections for not-yet-implemented modules ---
  if (shouldInclude("alert_words")) {
    state.alert_words = [];
  }

  if (shouldInclude("custom_profile_fields")) {
    state.custom_profile_fields = [];
  }

  if (shouldInclude("drafts")) {
    state.drafts = [];
  }

  if (shouldInclude("muted_topics")) {
    state.muted_topics = [];
  }

  if (shouldInclude("muted_users")) {
    state.muted_users = [];
  }

  if (shouldInclude("presence")) {
    state.presences = {};
  }

  if (shouldInclude("realm_domains")) {
    state.realm_domains = [];
  }

  if (shouldInclude("realm_emoji")) {
    state.realm_emoji = {};
  }

  if (shouldInclude("realm")) {
    state.realm_filters = [];
    state.realm_linkifiers = [];
    state.realm_playgrounds = [];
  }

  if (shouldInclude("message")) {
    state.max_message_id = 0;

    const unreadMsgs: Record<string, unknown> = {};
    unreadMsgs.pms = [];
    unreadMsgs.streams = [];
    unreadMsgs.huddles = [];
    unreadMsgs.mentions = [];
    unreadMsgs.count = 0;
    unreadMsgs.old_unreads_missing = false;
    state.unread_msgs = unreadMsgs;

    state.recent_private_conversations = [];
  }

  if (shouldInclude("update_message_flags") || shouldInclude("message")) {
    state.starred_messages = [];
  }

  // --- Constants (always included) ---
  state.max_stream_name_length = MAX_CHANNEL_NAME_LENGTH;
  state.max_stream_description_length = MAX_CHANNEL_DESCRIPTION_LENGTH;
  state.max_topic_length = MAX_TOPIC_LENGTH;
  state.max_message_length = MAX_MESSAGE_LENGTH;
  state.server_generation = SERVER_GENERATION;
  state.server_emoji_data_url = "/static/emoji/data.json";

  return state;
};
