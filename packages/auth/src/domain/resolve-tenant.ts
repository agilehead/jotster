import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, ServerConfig } from "@jotster/core/Jotster.Core.js";
import { Tenant, ok, err } from "@jotster/core/Jotster.Core.js";
import { getTenantById } from "../repo/get-tenant-by-id.ts";
import { getTenantBySubdomain } from "../repo/get-tenant-by-subdomain.ts";

export const resolveTenant = async (
  options: DbContextOptions,
  config: ServerConfig,
  host: string
): Promise<Result<Tenant, string>> => {
  if (config.mode === "single-tenant" && config.singleTenantId !== "") {
    const tenant = await getTenantById(options, config.singleTenantId);
    if (tenant === undefined) {
      return err("Tenant not found");
    }
    return ok(tenant);
  }

  const colonIdx = host.indexOf(":");
  const hostname = colonIdx >= 0 ? host.substring(0, colonIdx) : host;

  const parts = hostname.split(".");
  if (parts.length <= 2) {
    return err("Invalid subdomain");
  }

  const subdomain = parts[0];
  const tenant = await getTenantBySubdomain(options, subdomain);
  if (tenant === undefined) {
    return err("Invalid subdomain");
  }
  if (tenant.Active !== 1) {
    return err("This organization has been deactivated");
  }

  return ok(tenant);
};
