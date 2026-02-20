import knex, { type Knex } from "knex";
import knexConfig from "../../knexfile.jotster.js";

const TABLE_NAMES = [
  "push_device_token",
  "data_export",
  "bot_storage",
  "outgoing_webhook",
  "invitation",
  "tenant_user_setting_default",
  "realm_domain",
  "alert_word",
  "draft",
  "custom_profile_field_value",
  "custom_profile_field",
  "custom_emoji",
  "attachment_message",
  "attachment",
  "channel_folder_item",
  "channel_folder",
  "user_topic",
  "muted_user",
  "presence",
  "user_status",
  "user_group_subgroup",
  "user_group_member",
  "user_group",
  "reaction",
  "message_flag",
  "message_edit_history",
  "message",
  "dm_group_member",
  "dm_group",
  "subscription",
  "default_channel_group_item",
  "default_channel_group",
  "default_channel",
  "channel",
  "api_key",
  "user_setting",
  "user",
  "tenant",
];

export class TestDatabase {
  private db!: Knex;

  async setup(): Promise<void> {
    this.db = knex((knexConfig as Record<string, unknown>).test as Knex.Config);
    await this.db.migrate.latest();
  }

  async teardown(): Promise<void> {
    await this.db.destroy();
  }

  async truncateAllTables(): Promise<void> {
    await this.db.raw("PRAGMA foreign_keys = OFF");
    for (const table of TABLE_NAMES) {
      await this.db(table).del();
    }
    await this.db.raw("PRAGMA foreign_keys = ON");
  }

  getDb(): Knex {
    return this.db;
  }

  async insert(table: string, data: Record<string, unknown>): Promise<void> {
    await this.db(table).insert(data);
  }

  async insertMany(table: string, rows: Record<string, unknown>[]): Promise<void> {
    await this.db(table).insert(rows);
  }
}
