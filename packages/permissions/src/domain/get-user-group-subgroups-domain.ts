import type { int } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { getUserGroupSubgroups } from "../repo/get-user-group-subgroups.ts";

export const getUserGroupSubgroupsDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: string
): Promise<Result<string[], string>> => {
  const group = await getUserGroupById(options, groupId);
  if (group === undefined) {
    return err("User group not found");
  }

  const zero = 0 as int;
  if (group.IsActive === zero) {
    return err("User group is deactivated");
  }

  const subgroups = await getUserGroupSubgroups(options, groupId);
  return ok(subgroups);
};
