import { Environment } from "@tsonic/dotnet/System.js";
import type { Interface } from "@tsonic/core/lang.js";
import type { IDesignTimeDbContextFactory } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.Design.js";

import { createJotsterDbContext } from "./jotster-db-context.ts";
import type { JotsterDbContext } from "./jotster-db-context.ts";
import { createDbOptions } from "./create-db-options.ts";

export class JotsterDbContextFactory
  implements Interface<IDesignTimeDbContextFactory<JotsterDbContext>>
{
  CreateDbContext(_args: string[]): JotsterDbContext {
    const dbPath = Environment.GetEnvironmentVariable("JOTSTER_DB") ?? "jotster.db";
    return createJotsterDbContext(createDbOptions(dbPath));
  }
}
