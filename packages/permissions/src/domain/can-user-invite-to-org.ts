import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { checkPermission } from "./check-permission.ts";

export const canUserInviteToOrg = async (
  options: DbContextOptions,
  tenantId: string,
  userId: string
): Promise<Result<boolean, string>> => {
  return await checkPermission(options, tenantId, userId, "invite_to_realm_policy");
};
