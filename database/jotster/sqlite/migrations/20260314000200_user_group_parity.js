export async function up(knex) {
  await knex.schema.alterTable("user_group", (table) => {
    table.string("creator_id");
    table.string("can_remove_members_group_id");
  });

  await knex("user_group").update({
    can_remove_members_group_id: knex.ref("can_manage_group_id"),
  });
}

export async function down(knex) {
  await knex.schema.alterTable("user_group", (table) => {
    table.dropColumn("can_remove_members_group_id");
    table.dropColumn("creator_id");
  });
}
