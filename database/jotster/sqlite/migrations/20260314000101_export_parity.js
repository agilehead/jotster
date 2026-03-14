export async function up(knex) {
  await knex.schema.alterTable("tenant", (table) => {
    table.integer("owner_full_content_access").notNullable().defaultTo(0);
  });

  await knex.schema.alterTable("user_setting", (table) => {
    table.integer("allow_private_data_export").notNullable().defaultTo(0);
  });
}

export async function down(knex) {
  await knex.schema.alterTable("user_setting", (table) => {
    table.dropColumn("allow_private_data_export");
  });

  await knex.schema.alterTable("tenant", (table) => {
    table.dropColumn("owner_full_content_access");
  });
}
