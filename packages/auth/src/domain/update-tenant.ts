import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig } from "@jotster/core/Jotster.Core.js";
import { Tenant, ok, err } from "@jotster/core/Jotster.Core.js";
import { updateTenant } from "../repo/update-tenant.ts";

export const updateTenantAdmin = async (
  options: DbContextOptions,
  config: ServerConfig,
  rootToken: string,
  tenantId: string,
  updates: { name?: string; description?: string; active?: int }
): Promise<Result<Tenant, string>> => {
  if (config.rootToken.Length === 0 || rootToken !== config.rootToken) {
    return err("Unauthorized");
  }

  const tenant = await updateTenant(options, tenantId, updates);
  if (tenant === undefined) {
    return err("Tenant not found");
  }

  return ok(tenant);
};
