import type { int, JsValue } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { RealmDomain, ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { updateRealmDomain } from "../repo/update-realm-domain.ts";

export const updateRealmDomainDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  domain: string,
  allowSubdomains: boolean,
): Promise<Result<RealmDomain, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  const allowSub = allowSubdomains ? (1 as int) : (0 as int);
  const realmDomain = await updateRealmDomain(
    options,
    user.tenantId,
    domain,
    allowSub,
  );

  if (realmDomain === undefined) {
    return err("Domain not found");
  }

  // Emit realm_domains event
  const domainObj: Record<string, JsValue> = {};
  domainObj["domain"] = realmDomain.Domain;
  domainObj["allow_subdomains"] = realmDomain.AllowSubdomains === (1 as int);

  dispatchEventToTenant(user.tenantId, {
    type: "realm_domains",
    op: "change",
    data: {
      realm_domain: domainObj,
    },
  });

  return ok(realmDomain);
};
