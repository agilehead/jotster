import type { long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result } from "@jotster/core/Jotster.Core.js";
import { checkPermission } from "./check-permission.ts";

export const canUserEditTopic = async (
  options: DbContextOptions,
  tenantId: long,
  userId: long
): Promise<Result<boolean, string>> => {
  return await checkPermission(options, tenantId, userId, "edit_topic_policy");
};
