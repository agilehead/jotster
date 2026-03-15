import type { int, long } from "@tsonic/core/types.js";
import type { DbContextOptions } from "@tsonic/efcore/Microsoft.EntityFrameworkCore.js";
import type { Result, AuthenticatedUser } from "@jotster/core/Jotster.Core.js";
import { ok, err } from "@jotster/core/Jotster.Core.js";
import { getUserGroupById } from "../repo/get-user-group-by-id.ts";
import { getUserGroupMembers } from "../repo/get-user-group-members.ts";

export const getUserGroupMembersDomain = async (
  options: DbContextOptions,
  user: AuthenticatedUser,
  groupId: long,
): Promise<Result<long[], string>> => {
  const group = await getUserGroupById(options, groupId);
  if (group === undefined) {
    return err("User group not found");
  }

  const zero = 0 as int;
  if (group.IsActive === zero) {
    return err("User group is deactivated");
  }

  const members = await getUserGroupMembers(options, groupId);
  return ok(members);
};
