import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { RealmDomain, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { addRealmDomain } from "../repo/add-realm-domain.ts";

export const addRealmDomainDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  domain: string,
  allowSubdomains: boolean
): Promise<Result<RealmDomain, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  // Validate domain format - basic check for valid domain
  const trimmed = domain.trim().toLowerCase();
  if (trimmed.length === 0) {
    return err("Domain must not be empty");
  }

  if (!trimmed.includes(".")) {
    return err("Invalid domain format");
  }

  const allowSub = allowSubdomains ? 1 as int : 0 as int;
  const realmDomain = await addRealmDomain(options, user.tenantId, trimmed, allowSub);

  if (realmDomain === undefined) {
    return err("Domain already exists for this organization");
  }

  // Emit realm_domains event
  const domainObj: Record<string, unknown> = {};
  domainObj["domain"] = realmDomain.Domain;
  domainObj["allow_subdomains"] = realmDomain.AllowSubdomains === (1 as int);

  dispatchEventToTenant(user.tenantId, {
    type: "realm_domains",
    op: "add",
    data: {
      realm_domain: domainObj,
    },
  });

  return ok(realmDomain);
};
