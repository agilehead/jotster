/**
 * Initial schema migration for Jotster.
 * Creates all 44 tables in dependency order.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  // 1. tenant - root entity (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("tenant", (table) => {
    table.bigIncrements("id");
    table.string("subdomain").notNullable().unique();
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.string("icon_url");
    table.string("logo_url");
    table.text("settings_json").notNullable().defaultTo("{}");
    table.integer("owner_full_content_access").notNullable().defaultTo(0);
    table.integer("active").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
  });

  // 2. user - FK to tenant (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("user", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("email").notNullable();
    table.string("full_name").notNullable();
    table.string("password_hash");
    table.integer("role").notNullable().defaultTo(400);
    table.string("avatar_url");
    table.string("avatar_source").notNullable().defaultTo("gravatar");
    table.integer("is_bot").notNullable().defaultTo(0);
    table.integer("bot_type");
    table.bigInteger("bot_owner_id").references("id").inTable("user");
    table.integer("is_active").notNullable().defaultTo(1);
    table.string("timezone").notNullable().defaultTo("");
    table.bigInteger("date_joined").notNullable();
    table.integer("is_billing_admin").notNullable().defaultTo(0);
    table.string("delivery_email").notNullable();
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "email"]);
    table.index(["tenant_id", "is_active"]);
  });

  // 3. user_setting - PK is user_id (FK to user, bigInteger PK)
  await knex.schema.createTable("user_setting", (table) => {
    table.bigInteger("user_id").primary().references("id").inTable("user");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");

    // Display settings
    table.integer("twenty_four_hour_time").defaultTo(0);
    table.integer("dense_mode").defaultTo(0);
    table.integer("web_font_size_px").defaultTo(14);
    table.integer("web_line_height_percent").defaultTo(122);
    table.integer("starred_message_counts").defaultTo(1);
    table.integer("fluid_layout_width").defaultTo(0);
    table.integer("high_contrast_mode").defaultTo(0);
    table.integer("color_scheme").defaultTo(3);
    table.integer("translate_emoticons").defaultTo(1);
    table.integer("display_emoji_reaction_users").defaultTo(1);
    table.string("default_language").defaultTo("en");
    table.string("default_view").defaultTo("recent_topics");
    table.integer("escape_navigates_to_default_view").defaultTo(1);
    table.integer("left_side_userlist").defaultTo(0);
    table.string("emojiset").defaultTo("google");
    table.integer("demote_inactive_streams").defaultTo(1);

    // Stream/channel notification settings
    table.integer("enable_stream_desktop_notifications").defaultTo(0);
    table.integer("enable_stream_email_notifications").defaultTo(0);
    table.integer("enable_stream_push_notifications").defaultTo(0);
    table.integer("enable_stream_audible_notifications").defaultTo(0);
    table.string("notification_sound").defaultTo("zulip");

    // General notification settings
    table.integer("enable_desktop_notifications").defaultTo(1);
    table.integer("enable_sounds").defaultTo(1);
    table.integer("enable_offline_email_notifications").defaultTo(1);
    table.integer("enable_offline_push_notifications").defaultTo(1);
    table.integer("enable_online_push_notifications").defaultTo(1);

    // Followed topic notification settings
    table.integer("enable_followed_topic_desktop_notifications").defaultTo(1);
    table.integer("enable_followed_topic_email_notifications").defaultTo(1);
    table.integer("enable_followed_topic_push_notifications").defaultTo(1);
    table.integer("enable_followed_topic_audible_notifications").defaultTo(1);

    // Email and notification behavior
    table.integer("email_notifications_batching_period_seconds").defaultTo(120);
    table.integer("enable_drafts_synchronization").defaultTo(1);
    table.integer("message_content_in_email_notifications").defaultTo(1);
    table.integer("pm_content_in_desktop_notifications").defaultTo(1);
    table.integer("wildcard_mentions_notify").defaultTo(1);

    // Presence and typing
    table.integer("presence_enabled").defaultTo(1);
    table.integer("send_private_typing_notifications").defaultTo(1);
    table.integer("send_stream_typing_notifications").defaultTo(1);
    table.integer("send_read_receipts").defaultTo(1);

    // Privacy and display policies
    table.integer("email_address_visibility").defaultTo(1);
    table.integer("realm_name_in_email_notifications_policy").defaultTo(1);
    table.integer("automatically_follow_topics_policy").defaultTo(0);
    table
      .integer("automatically_unmute_topics_in_muted_streams_policy")
      .defaultTo(0);
    table.integer("automatically_follow_topics_where_mentioned").defaultTo(1);
    table.integer("user_list_style").defaultTo(1);
    table.integer("web_stream_unreads_count_display_policy").defaultTo(1);
    table.integer("web_navigate_to_sent_message").defaultTo(1);
    table.integer("web_channel_default_view").defaultTo(1);
    table.integer("allow_private_data_export").defaultTo(0);
  });

  // 4. api_key - FK to tenant, user (non-Zulip: string PK)
  await knex.schema.createTable("api_key", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("key_hash").notNullable();
    table.string("raw_key");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("revoked_at");

    table.index(["tenant_id", "user_id"]);
    table.index(["key_hash"]);
  });

  // 5. channel - FK to tenant, creator_id FK->user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("channel", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.string("rendered_description").notNullable().defaultTo("");
    table.integer("is_private").notNullable().defaultTo(0);
    table.integer("is_web_public").notNullable().defaultTo(0);
    table.integer("history_public_to_subscribers").notNullable().defaultTo(1);
    table.bigInteger("creator_id").references("id").inTable("user");
    table.integer("message_retention_days");
    table.bigInteger("first_message_id");
    table.integer("is_archived").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "name"]);
    table.index(["tenant_id", "is_archived"]);
  });

  // 6. default_channel - FK to tenant, channel (non-Zulip: string PK)
  await knex.schema.createTable("default_channel", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table
      .bigInteger("channel_id")
      .notNullable()
      .references("id")
      .inTable("channel");
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "channel_id"]);
  });

  // 7. default_channel_group - FK to tenant (non-Zulip: string PK)
  await knex.schema.createTable("default_channel_group", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "name"]);
  });

  // 8. default_channel_group_item - FK to default_channel_group (string), channel (bigInteger)
  await knex.schema.createTable("default_channel_group_item", (table) => {
    table
      .string("default_channel_group_id")
      .notNullable()
      .references("id")
      .inTable("default_channel_group");
    table
      .bigInteger("channel_id")
      .notNullable()
      .references("id")
      .inTable("channel");

    table.primary(["default_channel_group_id", "channel_id"]);
  });

  // 9. subscription - FK to tenant, user, channel (non-Zulip: string PK)
  await knex.schema.createTable("subscription", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("channel_id")
      .notNullable()
      .references("id")
      .inTable("channel");
    table.string("color").notNullable().defaultTo("#c2c2c2");
    table.integer("pin_to_top").notNullable().defaultTo(0);
    table.integer("is_muted").notNullable().defaultTo(0);
    table.integer("desktop_notifications");
    table.integer("push_notifications");
    table.integer("audible_notifications");
    table.integer("email_notifications");
    table.integer("wildcard_mentions_notify");
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "user_id", "channel_id"]);
    table.index(["tenant_id", "channel_id"]);
    table.index(["tenant_id", "user_id"]);
  });

  // 10. dm_group - FK to tenant (non-Zulip: string PK)
  await knex.schema.createTable("dm_group", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("group_hash").notNullable();
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "group_hash"]);
  });

  // 11. dm_group_member - FK to dm_group (string), user (bigInteger)
  await knex.schema.createTable("dm_group_member", (table) => {
    table
      .string("dm_group_id")
      .notNullable()
      .references("id")
      .inTable("dm_group");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");

    table.primary(["dm_group_id", "user_id"]);
    table.index(["user_id", "dm_group_id"]);
  });

  // 12. message - FK to tenant, sender_id FK->user, channel_id FK->channel, dm_group_id FK->dm_group (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("message", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table
      .bigInteger("sender_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.string("type").notNullable();
    table.bigInteger("channel_id").references("id").inTable("channel");
    table.string("topic");
    table.string("dm_group_id").references("id").inTable("dm_group");
    table.text("content").notNullable();
    table.text("rendered_content").notNullable();
    table.integer("has_attachment").notNullable().defaultTo(0);
    table.integer("has_image").notNullable().defaultTo(0);
    table.integer("has_link").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("edited_at");

    table.index(["tenant_id", "channel_id", "topic", "id"]);
    table.index(["tenant_id", "dm_group_id", "id"]);
    table.index(["tenant_id", "sender_id", "id"]);
  });

  // 13. message_edit_history - FK to message, user (non-Zulip: string PK)
  await knex.schema.createTable("message_edit_history", (table) => {
    table.string("id").primary();
    table
      .bigInteger("message_id")
      .notNullable()
      .references("id")
      .inTable("message");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.text("prev_content");
    table.text("prev_rendered_content");
    table.string("prev_topic");
    table.string("prev_channel_id");
    table.bigInteger("timestamp").notNullable();

    table.index(["message_id", "timestamp"]);
  });

  // 14. message_flag - FK to user, message (composite PK)
  await knex.schema.createTable("message_flag", (table) => {
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("message_id")
      .notNullable()
      .references("id")
      .inTable("message");
    table.string("flag").notNullable();

    table.primary(["user_id", "message_id", "flag"]);
    table.index(["message_id", "flag"]);
    table.index(["user_id", "flag", "message_id"]);
  });

  // 15. reaction - FK to tenant, message, user (non-Zulip: string PK)
  await knex.schema.createTable("reaction", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table
      .bigInteger("message_id")
      .notNullable()
      .references("id")
      .inTable("message");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("emoji_name").notNullable();
    table.string("emoji_code").notNullable();
    table.string("reaction_type").notNullable();
    table.bigInteger("created_at").notNullable();

    table.unique(["message_id", "user_id", "emoji_code", "reaction_type"]);
    table.index(["tenant_id", "message_id"]);
    table.index(["tenant_id", "user_id", "created_at"]);
  });

  // 16. user_group - FK to tenant, self-referential FKs (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("user_group", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.integer("is_system_group").notNullable().defaultTo(0);
    table.bigInteger("creator_id").references("id").inTable("user");
    table
      .bigInteger("can_add_members_group_id")
      .references("id")
      .inTable("user_group");
    table
      .bigInteger("can_join_group_id")
      .references("id")
      .inTable("user_group");
    table
      .bigInteger("can_leave_group_id")
      .references("id")
      .inTable("user_group");
    table
      .bigInteger("can_manage_group_id")
      .references("id")
      .inTable("user_group");
    table
      .bigInteger("can_mention_group_id")
      .references("id")
      .inTable("user_group");
    table
      .bigInteger("can_remove_members_group_id")
      .references("id")
      .inTable("user_group");
    table.integer("is_active").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "name"]);
  });

  // 17. user_group_member - FK to user_group (bigInteger), user (bigInteger)
  await knex.schema.createTable("user_group_member", (table) => {
    table
      .bigInteger("user_group_id")
      .notNullable()
      .references("id")
      .inTable("user_group");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");

    table.primary(["user_group_id", "user_id"]);
    table.index(["user_id"]);
  });

  // 18. user_group_subgroup - FK to user_group (both parent and child, bigInteger)
  await knex.schema.createTable("user_group_subgroup", (table) => {
    table
      .bigInteger("parent_group_id")
      .notNullable()
      .references("id")
      .inTable("user_group");
    table
      .bigInteger("subgroup_id")
      .notNullable()
      .references("id")
      .inTable("user_group");

    table.primary(["parent_group_id", "subgroup_id"]);
    table.index(["subgroup_id"]);
  });

  // 19. user_status - PK is user_id (FK to user, bigInteger PK)
  await knex.schema.createTable("user_status", (table) => {
    table.bigInteger("user_id").primary().references("id").inTable("user");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("status_text").notNullable().defaultTo("");
    table.string("emoji_name");
    table.string("emoji_code");
    table.string("reaction_type");
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id"]);
  });

  // 20. presence - FK to user, tenant (composite PK: user_id bigInteger, client_name string)
  await knex.schema.createTable("presence", (table) => {
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("client_name").notNullable();
    table.string("status").notNullable();
    table.bigInteger("timestamp").notNullable();

    table.primary(["user_id", "client_name"]);
    table.index(["tenant_id", "timestamp"]);
    table.index(["tenant_id", "user_id"]);
  });

  // 21. muted_user - FK to tenant, user (both muter and mutee) (non-Zulip: string PK)
  await knex.schema.createTable("muted_user", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("muted_user_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "user_id", "muted_user_id"]);
    table.index(["tenant_id", "user_id"]);
  });

  // 22. user_topic - FK to tenant, user, channel (non-Zulip: string PK)
  await knex.schema.createTable("user_topic", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("channel_id")
      .notNullable()
      .references("id")
      .inTable("channel");
    table.string("topic").notNullable();
    table.integer("visibility_policy").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "user_id", "channel_id", "topic"]);
    table.index(["tenant_id", "user_id"]);
    table.index(["tenant_id", "channel_id", "topic"]);
  });

  // 23. channel_folder - FK to tenant, user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("channel_folder", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("name").notNullable();
    table.text("description").notNullable().defaultTo("");
    table.integer("is_archived").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.integer("ordering").notNullable().defaultTo(0);
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "user_id", "name"]);
    table.index(["tenant_id", "user_id"]);
  });

  // 24. channel_folder_item - FK to channel_folder (bigInteger), channel (bigInteger)
  await knex.schema.createTable("channel_folder_item", (table) => {
    table
      .bigInteger("channel_folder_id")
      .notNullable()
      .references("id")
      .inTable("channel_folder");
    table
      .bigInteger("channel_id")
      .notNullable()
      .references("id")
      .inTable("channel");

    table.primary(["channel_folder_id", "channel_id"]);
    table.index(["channel_id"]);
  });

  // 25. attachment - FK to tenant, user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("attachment", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("file_name").notNullable();
    table.string("path_id").notNullable();
    table.integer("size").notNullable();
    table.string("content_type").notNullable();
    table.integer("is_web_public").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "path_id"]);
    table.index(["tenant_id", "user_id", "created_at"]);
  });

  // 26. attachment_message - FK to attachment (bigInteger), message (bigInteger)
  await knex.schema.createTable("attachment_message", (table) => {
    table
      .bigInteger("attachment_id")
      .notNullable()
      .references("id")
      .inTable("attachment");
    table
      .bigInteger("message_id")
      .notNullable()
      .references("id")
      .inTable("message");

    table.primary(["attachment_id", "message_id"]);
    table.index(["message_id"]);
  });

  // 27. custom_emoji - FK to tenant, author_id FK->user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("custom_emoji", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("name").notNullable();
    table.string("file_name").notNullable();
    table
      .bigInteger("author_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.integer("is_active").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();

    table.index(["tenant_id", "is_active"]);
  });

  // 28. custom_profile_field - FK to tenant (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("custom_profile_field", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("name").notNullable();
    table.string("hint").notNullable().defaultTo("");
    table.integer("field_type").notNullable();
    table.text("field_data_json").notNullable().defaultTo("{}");
    table.integer("display_in_profile_summary").notNullable().defaultTo(0);
    table.integer("required").notNullable().defaultTo(0);
    table.integer("editable_by_user").notNullable().defaultTo(1);
    table.integer("use_for_user_matching").notNullable().defaultTo(0);
    table.integer("ordering").notNullable();
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "name"]);
    table.index(["tenant_id", "ordering"]);
  });

  // 29. custom_profile_field_value - FK to tenant, user, custom_profile_field (non-Zulip: string PK)
  await knex.schema.createTable("custom_profile_field_value", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("field_id")
      .notNullable()
      .references("id")
      .inTable("custom_profile_field");
    table.text("value").notNullable();
    table.text("rendered_value");

    table.unique(["tenant_id", "user_id", "field_id"]);
    table.index(["tenant_id", "user_id"]);
    table.index(["field_id"]);
  });

  // 30. draft - FK to tenant, user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("draft", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("type").notNullable();
    table.bigInteger("channel_id");
    table.string("topic");
    table.text("recipient_ids_json");
    table.text("content").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.bigInteger("created_at").notNullable();

    table.index(["tenant_id", "user_id"]);
  });

  // 31. alert_word - FK to tenant, user (non-Zulip: string PK)
  await knex.schema.createTable("alert_word", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("word").notNullable();
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "user_id", "word"]);
    table.index(["tenant_id", "user_id"]);
    table.index(["tenant_id"]);
  });

  // 32. realm_domain - FK to tenant (non-Zulip: string PK)
  await knex.schema.createTable("realm_domain", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("domain").notNullable();
    table.integer("allow_subdomains").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();

    table.unique(["tenant_id", "domain"]);
  });

  // 33. tenant_user_setting_default - PK is tenant_id (FK to tenant, bigInteger PK)
  await knex.schema.createTable("tenant_user_setting_default", (table) => {
    table.bigInteger("tenant_id").primary().references("id").inTable("tenant");
    table.text("settings_json").notNullable().defaultTo("{}");
  });

  // 34. invitation - FK to tenant, inviter_id FK->user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("invitation", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table
      .bigInteger("inviter_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.string("email");
    table.integer("is_multiuse").notNullable().defaultTo(0);
    table.string("link_token").notNullable().unique();
    table.text("channel_ids_json").notNullable().defaultTo("[]");
    table.integer("invited_as_role").notNullable().defaultTo(400);
    table.string("status").notNullable().defaultTo("pending");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("expires_at");

    table.index(["tenant_id", "status"]);
    table.index(["tenant_id", "inviter_id"]);
  });

  // 35. outgoing_webhook - FK to tenant, bot_user_id FK->user (non-Zulip: string PK)
  await knex.schema.createTable("outgoing_webhook", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table
      .bigInteger("bot_user_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("user");
    table.string("url").notNullable();
    table.string("token").notNullable();
    table.string("trigger_type").notNullable();
    table.text("channel_ids_json");
    table.integer("interface_type").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id"]);
  });

  // 36. bot_storage - FK to bot_user_id FK->user (composite PK: bot_user_id bigInteger, key string)
  await knex.schema.createTable("bot_storage", (table) => {
    table
      .bigInteger("bot_user_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.string("key").notNullable();
    table.text("value").notNullable();

    table.primary(["bot_user_id", "key"]);
  });

  // 37. push_device_token - FK to tenant, user (non-Zulip: string PK)
  await knex.schema.createTable("push_device_token", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("kind").notNullable();
    table.string("token").notNullable();
    table.string("ios_app_id");
    table.bigInteger("created_at").notNullable();

    table.index(["tenant_id", "user_id", "token"]);
    table.index(["tenant_id", "user_id"]);
  });

  // 38. saved_snippet - FK to tenant, user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("saved_snippet", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("title").notNullable();
    table.text("content").notNullable();
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id", "user_id"]);
  });

  // 39. reminder - FK to tenant, user, message (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("reminder", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table
      .bigInteger("message_id")
      .notNullable()
      .references("id")
      .inTable("message");
    table.text("note");
    table.text("content").notNullable();
    table.text("rendered_content").notNullable();
    table.bigInteger("scheduled_delivery_timestamp").notNullable();
    table.integer("failed").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id", "user_id"]);
    table.index(["tenant_id", "user_id", "scheduled_delivery_timestamp"]);
  });

  // 40. scheduled_message - FK to tenant, user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("scheduled_message", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("type").notNullable();
    table.bigInteger("channel_id").references("id").inTable("channel");
    table.string("topic");
    table.text("recipient_ids_json");
    table.text("content").notNullable();
    table.text("rendered_content").notNullable();
    table.bigInteger("scheduled_delivery_timestamp").notNullable();
    table.integer("failed").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id", "user_id"]);
    table.index(["tenant_id", "user_id", "scheduled_delivery_timestamp"]);
  });

  // 41. navigation_view - FK to tenant, user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("navigation_view", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.string("fragment").notNullable();
    table.integer("is_pinned").notNullable().defaultTo(0);
    table.string("name");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "user_id", "fragment"]);
    table.index(["tenant_id", "user_id"]);
  });

  // 42. linkifier - FK to tenant (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("linkifier", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.string("pattern").notNullable();
    table.string("url_template").notNullable();
    table.string("example_input");
    table.string("reverse_template");
    table.text("alternative_url_templates_json");
    table.integer("ordering").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id"]);
  });

  // 43. client_device - FK to tenant, user (non-Zulip: string PK)
  await knex.schema.createTable("client_device", (table) => {
    table.string("id").primary();
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table.bigInteger("user_id").notNullable().references("id").inTable("user");
    table.bigInteger("created_at").notNullable();

    table.index(["tenant_id", "user_id"]);
  });

  // 44. data_export - FK to tenant, requester_id FK->user (Zulip-visible: bigIncrements PK)
  await knex.schema.createTable("data_export", (table) => {
    table.bigIncrements("id");
    table
      .bigInteger("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenant");
    table
      .bigInteger("requester_id")
      .notNullable()
      .references("id")
      .inTable("user");
    table.string("export_type").notNullable();
    table.string("status").notNullable().defaultTo("pending");
    table.string("url");
    table.text("error_message");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("completed_at");
    table.bigInteger("failed_at");

    table.index(["tenant_id", "created_at"]);
  });
}

/**
 * Drop all tables in reverse dependency order.
 *
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists("client_device");
  await knex.schema.dropTableIfExists("linkifier");
  await knex.schema.dropTableIfExists("navigation_view");
  await knex.schema.dropTableIfExists("scheduled_message");
  await knex.schema.dropTableIfExists("reminder");
  await knex.schema.dropTableIfExists("saved_snippet");
  await knex.schema.dropTableIfExists("push_device_token");
  await knex.schema.dropTableIfExists("data_export");
  await knex.schema.dropTableIfExists("bot_storage");
  await knex.schema.dropTableIfExists("outgoing_webhook");
  await knex.schema.dropTableIfExists("invitation");
  await knex.schema.dropTableIfExists("tenant_user_setting_default");
  await knex.schema.dropTableIfExists("realm_domain");
  await knex.schema.dropTableIfExists("alert_word");
  await knex.schema.dropTableIfExists("draft");
  await knex.schema.dropTableIfExists("custom_profile_field_value");
  await knex.schema.dropTableIfExists("custom_profile_field");
  await knex.schema.dropTableIfExists("custom_emoji");
  await knex.schema.dropTableIfExists("attachment_message");
  await knex.schema.dropTableIfExists("attachment");
  await knex.schema.dropTableIfExists("channel_folder_item");
  await knex.schema.dropTableIfExists("channel_folder");
  await knex.schema.dropTableIfExists("user_topic");
  await knex.schema.dropTableIfExists("muted_user");
  await knex.schema.dropTableIfExists("presence");
  await knex.schema.dropTableIfExists("user_status");
  await knex.schema.dropTableIfExists("user_group_subgroup");
  await knex.schema.dropTableIfExists("user_group_member");
  await knex.schema.dropTableIfExists("user_group");
  await knex.schema.dropTableIfExists("reaction");
  await knex.schema.dropTableIfExists("message_flag");
  await knex.schema.dropTableIfExists("message_edit_history");
  await knex.schema.dropTableIfExists("message");
  await knex.schema.dropTableIfExists("dm_group_member");
  await knex.schema.dropTableIfExists("dm_group");
  await knex.schema.dropTableIfExists("subscription");
  await knex.schema.dropTableIfExists("default_channel_group_item");
  await knex.schema.dropTableIfExists("default_channel_group");
  await knex.schema.dropTableIfExists("default_channel");
  await knex.schema.dropTableIfExists("channel");
  await knex.schema.dropTableIfExists("api_key");
  await knex.schema.dropTableIfExists("user_setting");
  await knex.schema.dropTableIfExists("user");
  await knex.schema.dropTableIfExists("tenant");
}
