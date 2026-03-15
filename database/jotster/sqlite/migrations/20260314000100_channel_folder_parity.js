/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable("channel_folder", (table) => {
    table.text("description").notNullable().defaultTo("");
    table.integer("is_archived").notNullable().defaultTo(0);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable("channel_folder", (table) => {
    table.dropColumn("is_archived");
    table.dropColumn("description");
  });
}
