import { Environment } from "@tsonic/dotnet/System.js";
import type { Interface } from "@tsonic/core/lang.js";
import type { IDesignTimeDbContextFactory } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.Design.js";

import { createBootstrapDbContext } from "./jotster-db-context.ts";
import type { JotsterBootstrapDbContext } from "./jotster-db-context.ts";
import { createDbOptions } from "./create-db-options.ts";

export class JotsterDbContextFactory implements Interface<
  IDesignTimeDbContextFactory<JotsterBootstrapDbContext>
> {
  CreateDbContext(_args: string[]): JotsterBootstrapDbContext {
    const dbPath =
      Environment.GetEnvironmentVariable("JOTSTER_DB") ?? "jotster.db";
    return createBootstrapDbContext(createDbOptions(dbPath));
  }
}
