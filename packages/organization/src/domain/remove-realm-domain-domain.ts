import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { dispatchEventToTenant } from "@jotster/event-queue/Jotster.EventQueue.js";
import { removeRealmDomain } from "../repo/remove-realm-domain.ts";

export const removeRealmDomainDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  domain: string,
): Promise<Result<boolean, string>> => {
  // Validate admin role (role <= 200)
  if (user.role > 200) {
    return err("Insufficient permission");
  }

  const removed = await removeRealmDomain(options, user.tenantId, domain);

  if (!removed) {
    return err("Domain not found");
  }

  // Emit realm_domains event
  dispatchEventToTenant(user.tenantId, {
    type: "realm_domains",
    op: "remove",
    data: {
      domain,
    },
  });

  return ok(true);
};
