/**
 * @param {import("knex").Knex} knex
 */
export async function up(knex) {
  await knex.schema.alterTable("custom_profile_field", (table) => {
    table.integer("required").notNullable().defaultTo(0);
    table.integer("editable_by_user").notNullable().defaultTo(1);
    table.integer("use_for_user_matching").notNullable().defaultTo(0);
  });
}

/**
 * @param {import("knex").Knex} knex
 */
export async function down(knex) {
  await knex.schema.alterTable("custom_profile_field", (table) => {
    table.dropColumn("use_for_user_matching");
    table.dropColumn("editable_by_user");
    table.dropColumn("required");
  });
}
