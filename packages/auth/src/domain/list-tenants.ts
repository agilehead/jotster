import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig } from "@jotster/core/Jotster.Core.js";
import { Tenant, ok, err } from "@jotster/core/Jotster.Core.js";
import { listTenants } from "../repo/list-tenants.ts";

export const listTenantsAdmin = async (
  options: DbContextOptions,
  config: ServerConfig,
  rootToken: string
): Promise<Result<Tenant[], string>> => {
  if (config.rootToken.Length === 0 || rootToken !== config.rootToken) {
    return err("Unauthorized");
  }

  const tenants = await listTenants(options);
  return ok(tenants);
};
