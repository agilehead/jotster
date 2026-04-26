/**
 * Initial greenfield schema migration for Jotster.
 *
 * The database stores Jotster product concepts only. Compatibility APIs
 * translate at their own boundary and do not shape core storage.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable("workspace", (table) => {
    table.string("id").notNullable();
    table.string("slug").notNullable();
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.string("icon_url");
    table.string("logo_url");
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["id"]);
    table.unique(["slug"]);
    table.index(["state"]);
  });

  await knex.schema.createTable("workspace_domain", (table) => {
    table.string("domain").notNullable();
    table.string("workspace_id").notNullable();
    table.integer("is_primary").notNullable().defaultTo(0);
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["domain"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.index(["workspace_id", "state"]);
    table.index(["workspace_id", "is_primary"]);
  });

  await knex.schema.createTable("identity", (table) => {
    table.string("id").notNullable();
    table.string("kind").notNullable();
    table.string("primary_email");
    table.string("display_name").notNullable();
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["id"]);
    table.index(["kind", "state"]);
    table.index(["primary_email"]);
  });

  await knex.schema.createTable("human_profile", (table) => {
    table.string("identity_id").notNullable();
    table.string("full_name").notNullable();
    table.string("avatar_url");
    table.string("timezone").notNullable().defaultTo("");
    table.string("locale").notNullable().defaultTo("en");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["identity_id"]);
    table.foreign(["identity_id"]).references(["id"]).inTable("identity");
  });

  await knex.schema.createTable("agent_profile", (table) => {
    table.string("identity_id").notNullable();
    table.string("owner_identity_id");
    table.string("agent_kind").notNullable();
    table.string("display_name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.string("avatar_url");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["identity_id"]);
    table.foreign(["identity_id"]).references(["id"]).inTable("identity");
    table.foreign(["owner_identity_id"]).references(["id"]).inTable("identity");
    table.index(["owner_identity_id"]);
  });

  await knex.schema.createTable("auth_provider", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("kind").notNullable();
    table.string("display_name").notNullable();
    table.string("issuer").notNullable();
    table.string("client_id").notNullable();
    table.text("config_json").notNullable().defaultTo("{}");
    table.integer("enabled").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.unique(["workspace_id", "display_name"]);
    table.index(["workspace_id", "kind"]);
    table.index(["workspace_id", "enabled"]);
  });

  await knex.schema.createTable("external_identity", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("identity_id").notNullable();
    table.string("auth_provider_id").notNullable();
    table.string("subject").notNullable();
    table.string("email_at_login");
    table.text("claims_json").notNullable().defaultTo("{}");
    table.bigInteger("last_login_at");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["identity_id"]).references(["id"]).inTable("identity");
    table.foreign(["workspace_id", "auth_provider_id"]).references(["workspace_id", "id"]).inTable("auth_provider");
    table.unique(["workspace_id", "auth_provider_id", "subject"]);
    table.index(["identity_id"]);
    table.index(["workspace_id", "auth_provider_id"]);
  });

  await knex.schema.createTable("workspace_member", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("identity_id").notNullable();
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("joined_at").notNullable();
    table.bigInteger("suspended_at");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["identity_id"]).references(["id"]).inTable("identity");
    table.unique(["workspace_id", "identity_id"]);
    table.index(["workspace_id", "state"]);
  });

  await knex.schema.createTable("participant", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("workspace_member_id").notNullable();
    table.string("kind").notNullable();
    table.string("display_name").notNullable();
    table.string("avatar_url");
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "workspace_member_id"]).references(["workspace_id", "id"]).inTable("workspace_member");
    table.unique(["workspace_id", "workspace_member_id"]);
    table.index(["workspace_id", "kind", "state"]);
  });

  await knex.schema.createTable("auth_session", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("participant_id").notNullable();
    table.string("session_hash").notNullable();
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("expires_at").notNullable();
    table.bigInteger("revoked_at");
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "session_hash"]);
    table.index(["workspace_id", "participant_id", "state"]);
  });

  await knex.schema.createTable("api_credential", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("participant_id").notNullable();
    table.string("name").notNullable();
    table.string("credential_hash").notNullable();
    table.text("scopes_json").notNullable().defaultTo("{}");
    table.string("created_by_participant_id");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("expires_at");
    table.bigInteger("revoked_at");
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.foreign(["workspace_id", "created_by_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "credential_hash"]);
    table.index(["workspace_id", "participant_id"]);
    table.index(["workspace_id", "created_by_participant_id"]);
  });

  await knex.schema.createTable("participant_preference", (table) => {
    table.string("workspace_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("key").notNullable();
    table.text("value_json").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "participant_id", "key"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
  });

  await knex.schema.createTable("role", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.integer("built_in").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.unique(["workspace_id", "name"]);
  });

  await knex.schema.createTable("participant_role", (table) => {
    table.string("workspace_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("role_id").notNullable();
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "participant_id", "role_id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.foreign(["workspace_id", "role_id"]).references(["workspace_id", "id"]).inTable("role");
    table.index(["workspace_id", "role_id"]);
  });

  await knex.schema.createTable("group", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.integer("built_in").notNullable().defaultTo(0);
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.unique(["workspace_id", "name"]);
    table.index(["workspace_id", "state"]);
  });

  await knex.schema.createTable("group_member", (table) => {
    table.string("workspace_id").notNullable();
    table.string("group_id").notNullable();
    table.string("participant_id").notNullable();
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "group_id", "participant_id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "group_id"]).references(["workspace_id", "id"]).inTable("group");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "participant_id"]);
  });

  await knex.schema.createTable("group_child", (table) => {
    table.string("workspace_id").notNullable();
    table.string("parent_group_id").notNullable();
    table.string("child_group_id").notNullable();
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "parent_group_id", "child_group_id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "parent_group_id"]).references(["workspace_id", "id"]).inTable("group");
    table.foreign(["workspace_id", "child_group_id"]).references(["workspace_id", "id"]).inTable("group");
    table.index(["workspace_id", "child_group_id"]);
  });

  await knex.schema.createTable("permission_grant", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("subject_kind").notNullable();
    table.string("subject_id").notNullable();
    table.string("resource_path").notNullable();
    table.string("action").notNullable();
    table.string("effect").notNullable();
    table.bigInteger("created_at").notNullable();
    table.bigInteger("expires_at");
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.check("subject_kind in ('participant','role','group','system')", undefined, "permission_grant_subject_kind_ck");
    table.check("effect in ('allow','deny')", undefined, "permission_grant_effect_ck");
    table.index(["workspace_id", "subject_kind", "subject_id"]);
    table.index(["workspace_id", "resource_path", "action"]);
  });

  await knex.schema.createTable("channel", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("name").notNullable();
    table.string("description").notNullable().defaultTo("");
    table.string("visibility").notNullable().defaultTo("public");
    table.string("state").notNullable().defaultTo("active");
    table.string("created_by_participant_id");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "created_by_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "name"]);
    table.index(["workspace_id", "state"]);
    table.index(["workspace_id", "created_by_participant_id"]);
  });

  await knex.schema.createTable("channel_member", (table) => {
    table.string("workspace_id").notNullable();
    table.string("channel_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("role").notNullable().defaultTo("member");
    table.string("state").notNullable().defaultTo("active");
    table.integer("muted").notNullable().defaultTo(0);
    table.string("notification_level");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "channel_id", "participant_id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "channel_id"]).references(["workspace_id", "id"]).inTable("channel");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "participant_id"]);
    table.index(["workspace_id", "channel_id", "state"]);
  });

  await knex.schema.createTable("thread", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("channel_id").notNullable();
    table.string("title").notNullable();
    table.string("state").notNullable().defaultTo("active");
    table.string("access_policy").notNullable().defaultTo("inherit");
    table.string("created_by_participant_id").notNullable();
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "channel_id"]).references(["workspace_id", "id"]).inTable("channel");
    table.foreign(["workspace_id", "created_by_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "channel_id", "id"]);
    table.unique(["workspace_id", "channel_id", "title"]);
    table.index(["workspace_id", "state"]);
    table.index(["workspace_id", "created_by_participant_id"]);
  });

  await knex.schema.createTable("direct_chat", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("kind").notNullable();
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.index(["workspace_id", "kind", "state"]);
  });

  await knex.schema.createTable("direct_chat_member", (table) => {
    table.string("workspace_id").notNullable();
    table.string("direct_chat_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "direct_chat_id", "participant_id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "direct_chat_id"]).references(["workspace_id", "id"]).inTable("direct_chat");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "participant_id"]);
  });

  await knex.schema.createTable("message", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("sender_participant_id").notNullable();
    table.string("container_kind").notNullable();
    table.string("channel_id");
    table.string("thread_id");
    table.string("direct_chat_id");
    table.text("content").notNullable();
    table.text("rendered_content");
    table.string("state").notNullable().defaultTo("active");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("edited_at");
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "sender_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.foreign(["workspace_id", "channel_id"]).references(["workspace_id", "id"]).inTable("channel");
    table.foreign(["workspace_id", "thread_id"]).references(["workspace_id", "id"]).inTable("thread");
    table.foreign(["workspace_id", "channel_id", "thread_id"]).references(["workspace_id", "channel_id", "id"]).inTable("thread");
    table.foreign(["workspace_id", "direct_chat_id"]).references(["workspace_id", "id"]).inTable("direct_chat");
    table.check(
      "(container_kind = 'channel_thread' and thread_id is not null and direct_chat_id is null) or (container_kind = 'direct_chat' and direct_chat_id is not null and thread_id is null and channel_id is null)",
      undefined,
      "message_container_shape_ck",
    );
    table.index(["workspace_id", "thread_id", "created_at"]);
    table.index(["workspace_id", "direct_chat_id", "created_at"]);
    table.index(["workspace_id", "sender_participant_id", "created_at"]);
  });

  await knex.schema.createTable("message_version", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("message_id").notNullable();
    table.string("editor_participant_id").notNullable();
    table.text("previous_content");
    table.text("previous_rendered_content");
    table.string("previous_thread_id");
    table.string("previous_channel_id");
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "message_id"]).references(["workspace_id", "id"]).inTable("message");
    table.foreign(["workspace_id", "editor_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "message_id", "created_at"]);
  });

  await knex.schema.createTable("message_marker", (table) => {
    table.string("workspace_id").notNullable();
    table.string("message_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("marker").notNullable();
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "message_id", "participant_id", "marker"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "message_id"]).references(["workspace_id", "id"]).inTable("message");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "participant_id", "marker"]);
  });

  await knex.schema.createTable("reaction", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("message_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("emoji_key").notNullable();
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "message_id"]).references(["workspace_id", "id"]).inTable("message");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "message_id", "participant_id", "emoji_key"]);
    table.index(["workspace_id", "participant_id", "created_at"]);
  });

  await knex.schema.createTable("attachment", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("owner_participant_id").notNullable();
    table.string("message_id");
    table.string("storage_key").notNullable();
    table.string("file_name").notNullable();
    table.string("content_type").notNullable();
    table.bigInteger("byte_size").notNullable();
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "owner_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.foreign(["workspace_id", "message_id"]).references(["workspace_id", "id"]).inTable("message");
    table.unique(["workspace_id", "storage_key"]);
    table.index(["workspace_id", "owner_participant_id", "created_at"]);
  });

  await knex.schema.createTable("emoji", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("key").notNullable();
    table.string("display_name").notNullable();
    table.string("image_storage_key").notNullable();
    table.string("created_by_participant_id");
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "created_by_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "key"]);
    table.index(["workspace_id", "created_by_participant_id"]);
  });

  await knex.schema.createTable("profile_field", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("key").notNullable();
    table.string("label").notNullable();
    table.string("value_kind").notNullable();
    table.integer("required").notNullable().defaultTo(0);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.unique(["workspace_id", "key"]);
  });

  await knex.schema.createTable("participant_profile_field_value", (table) => {
    table.string("workspace_id").notNullable();
    table.string("participant_id").notNullable();
    table.string("profile_field_id").notNullable();
    table.text("value_json").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "participant_id", "profile_field_id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.foreign(["workspace_id", "profile_field_id"]).references(["workspace_id", "id"]).inTable("profile_field");
  });

  await knex.schema.createTable("workspace_member_default", (table) => {
    table.string("workspace_id").notNullable();
    table.string("key").notNullable();
    table.text("value_json").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "key"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
  });

  await knex.schema.createTable("webhook", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("owner_participant_id");
    table.string("direction").notNullable();
    table.text("event_filter_json").notNullable().defaultTo("{}");
    table.text("target_config_json").notNullable().defaultTo("{}");
    table.string("secret_hash");
    table.integer("enabled").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "owner_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "direction", "enabled"]);
    table.index(["workspace_id", "owner_participant_id"]);
  });

  await knex.schema.createTable("device_token", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("participant_id").notNullable();
    table.string("provider").notNullable();
    table.string("token_hash").notNullable();
    table.integer("enabled").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "provider", "token_hash"]);
    table.index(["workspace_id", "participant_id"]);
  });

  await knex.schema.createTable("audit_event", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("actor_participant_id");
    table.string("action").notNullable();
    table.string("object_type").notNullable();
    table.string("object_id");
    table.text("metadata_json").notNullable().defaultTo("{}");
    table.bigInteger("created_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "actor_participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.index(["workspace_id", "actor_participant_id", "created_at"]);
    table.index(["workspace_id", "object_type", "object_id"]);
  });

  await knex.schema.createTable("notification", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("participant_id").notNullable();
    table.string("activity_type").notNullable();
    table.string("object_type").notNullable();
    table.string("object_id").notNullable();
    table.string("reason").notNullable();
    table.text("payload_json").notNullable().defaultTo("{}");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("read_at");
    table.bigInteger("consumed_at");
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "participant_id", "id"]);
    table.index(["workspace_id", "participant_id", "created_at"]);
    table.index(["workspace_id", "object_type", "object_id"]);
  });

  await knex.schema.createTable("notification_endpoint", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("participant_id").notNullable();
    table.string("kind").notNullable();
    table.text("config_json").notNullable().defaultTo("{}");
    table.integer("enabled").notNullable().defaultTo(1);
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "participant_id"]).references(["workspace_id", "id"]).inTable("participant");
    table.unique(["workspace_id", "participant_id", "id"]);
    table.index(["workspace_id", "participant_id", "kind"]);
    table.index(["workspace_id", "enabled"]);
  });

  await knex.schema.createTable("notification_delivery", (table) => {
    table.string("workspace_id").notNullable();
    table.string("id").notNullable();
    table.string("participant_id").notNullable();
    table.string("notification_id").notNullable();
    table.string("endpoint_id").notNullable();
    table.string("status").notNullable();
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error");
    table.bigInteger("next_attempt_at");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();
    table.primary(["workspace_id", "id"]);
    table.foreign(["workspace_id"]).references(["id"]).inTable("workspace");
    table.foreign(["workspace_id", "notification_id"]).references(["workspace_id", "id"]).inTable("notification");
    table.foreign(["workspace_id", "endpoint_id"]).references(["workspace_id", "id"]).inTable("notification_endpoint");
    table.foreign(["workspace_id", "participant_id", "notification_id"]).references(["workspace_id", "participant_id", "id"]).inTable("notification");
    table.foreign(["workspace_id", "participant_id", "endpoint_id"]).references(["workspace_id", "participant_id", "id"]).inTable("notification_endpoint");
    table.index(["workspace_id", "notification_id"]);
    table.index(["workspace_id", "participant_id", "notification_id"]);
    table.index(["workspace_id", "endpoint_id", "status"]);
  });

}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  const tables = [
    "notification_delivery",
    "notification_endpoint",
    "notification",
    "audit_event",
    "device_token",
    "webhook",
    "workspace_member_default",
    "participant_profile_field_value",
    "profile_field",
    "emoji",
    "attachment",
    "reaction",
    "message_marker",
    "message_version",
    "message",
    "direct_chat_member",
    "direct_chat",
    "thread",
    "channel_member",
    "channel",
    "permission_grant",
    "group_child",
    "group_member",
    "group",
    "participant_role",
    "role",
    "participant_preference",
    "api_credential",
    "auth_session",
    "participant",
    "workspace_member",
    "external_identity",
    "auth_provider",
    "agent_profile",
    "human_profile",
    "identity",
    "workspace_domain",
    "workspace",
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
}
