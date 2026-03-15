const PUBLIC_ID_TABLES = [
  { tableName: "tenant", orderColumns: ["created_at", "id"] },
  { tableName: "user", orderColumns: ["created_at", "id"] },
  { tableName: "channel", orderColumns: ["created_at", "id"] },
  { tableName: "message", orderColumns: ["created_at", "id"] },
  { tableName: "user_group", orderColumns: ["created_at", "id"] },
  { tableName: "channel_folder", orderColumns: ["created_at", "id"] },
  { tableName: "attachment", orderColumns: ["created_at", "id"] },
  { tableName: "custom_emoji", orderColumns: ["created_at", "id"] },
  { tableName: "custom_profile_field", orderColumns: ["ordering", "id"] },
  { tableName: "draft", orderColumns: ["created_at", "id"] },
  { tableName: "saved_snippet", orderColumns: ["created_at", "id"] },
  { tableName: "reminder", orderColumns: ["created_at", "id"] },
  { tableName: "scheduled_message", orderColumns: ["created_at", "id"] },
  { tableName: "navigation_view", orderColumns: ["created_at", "id"] },
  { tableName: "linkifier", orderColumns: ["ordering", "id"] },
  { tableName: "invitation", orderColumns: ["created_at", "id"] },
  { tableName: "data_export", orderColumns: ["created_at", "id"] },
];

async function backfillPublicIds(knex, tableName, orderColumns) {
  const rows = await knex(tableName)
    .select("id")
    .orderBy(orderColumns[0], "asc")
    .modify((query) => {
      for (let i = 1; i < orderColumns.length; i++) {
        query.orderBy(orderColumns[i], "asc");
      }
    });

  let nextValue = 1;
  for (const row of rows) {
    await knex(tableName)
      .where({ id: row.id })
      .update({ public_id: nextValue });
    nextValue += 1;
  }

  await knex("public_id_counter").insert({
    entity_type: tableName,
    next_value: nextValue,
  });
}

export async function up(knex) {
  await knex.schema.createTable("public_id_counter", (table) => {
    table.string("entity_type").primary();
    table.bigInteger("next_value").notNullable();
  });

  for (const spec of PUBLIC_ID_TABLES) {
    await knex.schema.alterTable(spec.tableName, (table) => {
      table.bigInteger("public_id");
    });
  }

  for (const spec of PUBLIC_ID_TABLES) {
    await backfillPublicIds(knex, spec.tableName, spec.orderColumns);
  }

  for (const spec of PUBLIC_ID_TABLES) {
    await knex.schema.alterTable(spec.tableName, (table) => {
      table.unique(["public_id"]);
    });
  }
}

export async function down(knex) {
  for (const spec of [...PUBLIC_ID_TABLES].reverse()) {
    await knex.schema.alterTable(spec.tableName, (table) => {
      table.dropUnique(["public_id"]);
      table.dropColumn("public_id");
    });
  }

  await knex.schema.dropTableIfExists("public_id_counter");
}
