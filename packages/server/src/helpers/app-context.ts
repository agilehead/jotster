import type { ServerConfig } from "@jotster/core/Jotster.Core.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";

export type AppContext = {
  readonly options: DbContextOptions;
  readonly config: ServerConfig;
};
