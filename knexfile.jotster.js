export default {
  development: {
    client: "better-sqlite3",
    connection: { filename: (process.env.JOTSTER_DATA_DIR || ".") + "/jotster.db" },
    useNullAsDefault: true,
    migrations: {
      directory: "./database/jotster/sqlite/migrations",
    },
  },
  test: {
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
    migrations: {
      directory: "./database/jotster/sqlite/migrations",
    },
  },
  production: {
    client: "better-sqlite3",
    connection: { filename: (process.env.JOTSTER_DATA_DIR || ".") + "/jotster.db" },
    useNullAsDefault: true,
    migrations: {
      directory: "./database/jotster/sqlite/migrations",
    },
  },
};
