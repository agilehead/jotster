import {
  DbContextOptions,
  DbContextOptionsBuilder,
} from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import { SqliteDbContextOptionsBuilderExtensions } from "@tsonic/efcore-sqlite/Microsoft.EntityFrameworkCore.js";

export function createDbOptions(dbPath: string): DbContextOptions {
  const optionsBuilder = new DbContextOptionsBuilder();
  const connectionString = `Data Source=${dbPath};Cache=Shared;Pooling=true;Foreign Keys=True;Default Timeout=5`;
  SqliteDbContextOptionsBuilderExtensions.UseSqlite(
    optionsBuilder,
    connectionString,
  );
  return optionsBuilder.Options;
}
