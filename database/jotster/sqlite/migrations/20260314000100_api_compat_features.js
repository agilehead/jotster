/**
 * Adds persistence needed for Zulip API compatibility features.
 *
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable("api_key", (table) => {
    table.string("raw_key");
  });

  await knex.schema.createTable("saved_snippet", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
    table.string("user_id").notNullable().references("id").inTable("user");
    table.string("title").notNullable();
    table.text("content").notNullable();
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.index(["tenant_id", "user_id"]);
  });

  await knex.schema.createTable("reminder", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
    table.string("user_id").notNullable().references("id").inTable("user");
    table.string("message_id").notNullable().references("id").inTable("message");
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

  await knex.schema.createTable("scheduled_message", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
    table.string("user_id").notNullable().references("id").inTable("user");
    table.string("type").notNullable();
    table.string("channel_id").references("id").inTable("channel");
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

  await knex.schema.createTable("navigation_view", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
    table.string("user_id").notNullable().references("id").inTable("user");
    table.string("fragment").notNullable();
    table.integer("is_pinned").notNullable().defaultTo(0);
    table.string("name");
    table.bigInteger("created_at").notNullable();
    table.bigInteger("updated_at").notNullable();

    table.unique(["tenant_id", "user_id", "fragment"]);
    table.index(["tenant_id", "user_id"]);
  });

  await knex.schema.createTable("linkifier", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
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

  await knex.schema.createTable("client_device", (table) => {
    table.string("id").primary();
    table.string("tenant_id").notNullable().references("id").inTable("tenant");
    table.string("user_id").notNullable().references("id").inTable("user");
    table.bigInteger("created_at").notNullable();

    table.index(["tenant_id", "user_id"]);
  });
}

export async function down(knex) {
  await knex.schema.alterTable("api_key", (table) => {
    table.dropColumn("raw_key");
  });
  await knex.schema.dropTableIfExists("client_device");
  await knex.schema.dropTableIfExists("linkifier");
  await knex.schema.dropTableIfExists("navigation_view");
  await knex.schema.dropTableIfExists("scheduled_message");
  await knex.schema.dropTableIfExists("reminder");
  await knex.schema.dropTableIfExists("saved_snippet");
}
