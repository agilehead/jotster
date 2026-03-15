import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { ok } from "@jotster/core/Jotster.Core.js";
import { checkPermission } from "./check-permission.ts";

export const canUserManageUserGroup = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long,
): Promise<Result<boolean, string>> => {
  // Check can_manage_all_groups first
  const manageAllResult = await checkPermission(
    options,
    tenantId,
    userId,
    "can_manage_all_groups",
  );

  if (!manageAllResult.success) {
    return manageAllResult;
  }

  if (manageAllResult.data) {
    return ok(true);
  }

  // Fall back to user_group_edit_policy
  return await checkPermission(
    options,
    tenantId,
    userId,
    "user_group_edit_policy",
  );
};
